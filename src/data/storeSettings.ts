export interface StoreSettings {
    storeName: string;
    phone: string;
    email: string;
    currency: string;
    shippingFee: number;
    watermarkEnabled: boolean;
    watermarkOpacity: number;
    watermarkSize: number;
}

export const defaultStoreSettings: StoreSettings = {
    storeName: 'YouShop',
    phone: '+212 6XX XXX XXX',
    email: 'contact@youposh.ma',
    currency: 'MAD',
    shippingFee: 30,
    watermarkEnabled: true,
    watermarkOpacity: 20,
    watermarkSize: 30,
};

import { useState, useEffect } from 'react';
import { fetchStoreSettingsAPI, updateStoreSettingsAPI } from '@/lib/api';

const UPDATE_EVENT = 'youposh_store_settings_updated';

let cachedStoreSettings: StoreSettings | null = null;
let isStoreSettingsLoading = false;

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
        window.dispatchEvent(new Event(UPDATE_EVENT));
        return cachedStoreSettings as StoreSettings;
    } catch (e) {
        console.warn('Failed to fetch store settings:', e);
        return cachedStoreSettings || { ...defaultStoreSettings };
    } finally {
        isStoreSettingsLoading = false;
    }
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
    try {
        const updated = await updateStoreSettingsAPI(settings);
        cachedStoreSettings = { ...defaultStoreSettings, ...updated };
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: cachedStoreSettings }));
    } catch (e) {
        console.warn('Failed to save store settings:', e);
        throw e;
    }
}

export function useStoreSettings() {
    const [settings, setSettings] = useState<StoreSettings>(loadStoreSettings());

    useEffect(() => {
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
