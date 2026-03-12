export interface StoreSettings {
    storeName: string;
    phone: string;
    email: string;
    currency: string;
    brandPrimary: string;
    brandSecondary: string;
    brandColorYou: string;
    brandColorPosh: string;
    brandColorCart: string;
    shippingFeeLocal: number;
    shippingFeeNational: number;
    watermarkEnabled: boolean;
    watermarkOpacity: number;
    watermarkSize: number;
    watermarkPosX: number;
    watermarkPosY: number;
}

export const defaultStoreSettings: StoreSettings = {
    storeName: 'YOUPOSH',
    phone: '+212 690-93909',
    email: 'contact@youposh.ma',
    currency: 'MAD',
    brandPrimary: '#2563EB',
    brandSecondary: '#DC2626',
    brandColorYou: '#2563EB',
    brandColorPosh: '#DC2626',
    brandColorCart: '#2563EB',
    shippingFeeLocal: 20,
    shippingFeeNational: 35,
    watermarkEnabled: true,
    watermarkOpacity: 20,
    watermarkSize: 30,
    watermarkPosX: 50,
    watermarkPosY: 50,
};

import { useState, useEffect } from 'react';
import { fetchStoreSettingsAPI, updateStoreSettingsAPI } from '@/lib/api';

const UPDATE_EVENT = 'youposh_store_settings_updated';

let cachedStoreSettings: StoreSettings | null = null;
let isStoreSettingsLoading = false;

function clampInt(n: number): number {
    return Math.max(0, Math.min(255, Math.round(n)));
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const raw = String(hex || '').trim().replace('#', '');
    if (!/^[0-9a-fA-F]{3}$/.test(raw) && !/^[0-9a-fA-F]{6}$/.test(raw)) return null;
    const full = raw.length === 3 ? raw.split('').map(c => c + c).join('') : raw;
    const r = parseInt(full.slice(0, 2), 16);
    const g = parseInt(full.slice(2, 4), 16);
    const b = parseInt(full.slice(4, 6), 16);
    return { r, g, b };
}

function rgbToHex(rgb: { r: number; g: number; b: number }): string {
    const to = (n: number) => clampInt(n).toString(16).padStart(2, '0');
    return `#${to(rgb.r)}${to(rgb.g)}${to(rgb.b)}`.toUpperCase();
}

function mix(hexA: string, hexB: string, t: number): string {
    const a = hexToRgb(hexA);
    const b = hexToRgb(hexB);
    if (!a || !b) return hexA;
    const tt = Math.max(0, Math.min(1, t));
    return rgbToHex({
        r: a.r + (b.r - a.r) * tt,
        g: a.g + (b.g - a.g) * tt,
        b: a.b + (b.b - a.b) * tt,
    });
}

function shade(hex: string, amount: number): string {
    const base = hexToRgb(hex);
    if (!base) return hex;
    const t = Math.max(-1, Math.min(1, amount));
    const target = t >= 0 ? { r: 255, g: 255, b: 255 } : { r: 0, g: 0, b: 0 };
    return rgbToHex({
        r: base.r + (target.r - base.r) * Math.abs(t),
        g: base.g + (target.g - base.g) * Math.abs(t),
        b: base.b + (target.b - base.b) * Math.abs(t),
    });
}

function applyBrandTheme(settings: StoreSettings) {
    if (typeof document === 'undefined') return;
    const root = document.documentElement;

    const primary = settings.brandPrimary || defaultStoreSettings.brandPrimary;
    const secondary = settings.brandSecondary || defaultStoreSettings.brandSecondary;
    const colorYou = settings.brandColorYou || primary;
    const colorPosh = settings.brandColorPosh || secondary;
    const colorCart = settings.brandColorCart || primary;

    const primaryRgb = hexToRgb(primary);
    const secondaryRgb = hexToRgb(secondary);
    const cartRgb = hexToRgb(colorCart);

    root.style.setProperty('--yp-blue', primary);
    root.style.setProperty('--yp-blue-dark', shade(primary, -0.18));
    root.style.setProperty('--yp-blue-light', shade(primary, 0.12));
    root.style.setProperty('--yp-blue-50', mix('#FFFFFF', primary, 0.08));
    root.style.setProperty('--yp-blue-100', mix('#FFFFFF', primary, 0.16));
    if (primaryRgb) root.style.setProperty('--yp-blue-rgb', `${primaryRgb.r} ${primaryRgb.g} ${primaryRgb.b}`);

    root.style.setProperty('--yp-red', secondary);
    root.style.setProperty('--yp-red-dark', shade(secondary, -0.18));
    root.style.setProperty('--yp-red-light', shade(secondary, 0.12));
    root.style.setProperty('--yp-red-50', mix('#FFFFFF', secondary, 0.08));
    if (secondaryRgb) root.style.setProperty('--yp-red-rgb', `${secondaryRgb.r} ${secondaryRgb.g} ${secondaryRgb.b}`);

    // New specific colors
    root.style.setProperty('--yp-color-you', colorYou);
    root.style.setProperty('--yp-color-posh', colorPosh);
    root.style.setProperty('--yp-color-cart', colorCart);
    if (cartRgb) root.style.setProperty('--yp-cart-rgb', `${cartRgb.r} ${cartRgb.g} ${cartRgb.b}`);
}

// We export this for places that need it synchronously,
// but it might return default until loaded.
export function loadStoreSettings(): StoreSettings {
    return cachedStoreSettings || { ...defaultStoreSettings };
}

export async function fetchStoreSettingsGlobal(): Promise<StoreSettings> {
    if (isStoreSettingsLoading && cachedStoreSettings) return cachedStoreSettings;
    isStoreSettingsLoading = true;
    try {
        const settings = await fetchStoreSettingsAPI();
        cachedStoreSettings = { ...defaultStoreSettings, ...settings };
        applyBrandTheme(cachedStoreSettings as StoreSettings);
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: cachedStoreSettings }));
        return cachedStoreSettings as StoreSettings;
    } catch (e) {
        console.warn('Failed to fetch store settings:', e);
        applyBrandTheme(cachedStoreSettings || { ...defaultStoreSettings });
        return cachedStoreSettings || { ...defaultStoreSettings };
    } finally {
        isStoreSettingsLoading = false;
    }
}

export async function saveStoreSettings(settings: Partial<StoreSettings>): Promise<StoreSettings> {
    try {
        // Clean data before sending
        const allowedFields = [
            'storeName', 'phone', 'email', 'currency',
            'brandPrimary', 'brandSecondary',
            'brandColorYou', 'brandColorPosh', 'brandColorCart',
            'shippingFeeLocal', 'shippingFeeNational',
            'watermarkEnabled', 'watermarkOpacity', 'watermarkSize', 'watermarkPosX', 'watermarkPosY'
        ];
        const cleanSettings: any = {};
        for (const key of Object.keys(settings)) {
            if (allowedFields.includes(key)) {
                cleanSettings[key] = (settings as any)[key];
            }
        }

        const updated = await updateStoreSettingsAPI(cleanSettings);
        cachedStoreSettings = { ...defaultStoreSettings, ...updated };
        applyBrandTheme(cachedStoreSettings as StoreSettings);
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: cachedStoreSettings }));
        return cachedStoreSettings as StoreSettings;
    } catch (e) {
        console.warn('Failed to save store settings:', e);
        throw e;
    }
}

export function useStoreSettings() {
    const [settings, setSettings] = useState<StoreSettings>(loadStoreSettings());

    useEffect(() => {
        applyBrandTheme(loadStoreSettings());
        // Fetch from network on mount
        fetchStoreSettingsGlobal().then(data => {
            setSettings(data);
        });

        const handleUpdate = (e: any) => {
            if (e.detail) {
                setSettings(e.detail);
            } else {
                setSettings(loadStoreSettings());
            }
        };

        window.addEventListener(UPDATE_EVENT, handleUpdate);
        return () => window.removeEventListener(UPDATE_EVENT, handleUpdate);
    }, []);

    return settings;
}
