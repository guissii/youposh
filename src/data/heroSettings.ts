// ─────────────────────────────────────────────────────────────
// Hero Section settings — admin-editable configuration
// ─────────────────────────────────────────────────────────────

export interface HeroSettings {
    isEnabled: boolean;
    badgeText: string;
    title: string;
    subtitle: string;
    slogan: string;
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;
    badgeColor?: string;
    badgeTextColor?: string;
    titleColorYou?: string;
    titleColorPosh?: string;
    videoEnabled: boolean;
    videoUrl: string;
    videoPosterUrl: string;
    videoAutoplay: boolean;
    videoMuted: boolean;
    videoLoop: boolean;
    showOnMobile: boolean;
    overlayOpacity: number;
    heroVideoEnabled?: boolean;
}

export const defaultHeroSettings: HeroSettings = {
    isEnabled: true,
    badgeText: 'Une marque marocaine pensée pour votre quotidien',
    title: 'Des produits tendance pour votre quotidien',
    subtitle: 'Des accessoires et produits utiles sélectionnés pour vous, partout au Maroc.',
    slogan: 'UNE MARQUE MAROCAINE',
    primaryCtaText: 'Explorer la boutique',
    primaryCtaLink: '/shop',
    secondaryCtaText: 'Voir les promotions',
    secondaryCtaLink: '/shop?filter=promo',
    badgeColor: 'rgba(255, 255, 255, 0.1)',
    badgeTextColor: '#ffffff',
    titleColorYou: '#2563EB',
    titleColorPosh: '#DC2626',
    videoEnabled: false,
    videoUrl: '/videos/hero-video.mp4',
    videoPosterUrl: '/images/products/headphones.jpg',
    videoAutoplay: true,
    videoMuted: true,
    videoLoop: true,
    showOnMobile: true,
    overlayOpacity: 35,
    heroVideoEnabled: true,
};

import { useState, useEffect } from 'react';
import { fetchHeroSettingsAPI, updateHeroSettingsAPI } from '@/lib/api';

const UPDATE_EVENT = 'youposh_hero_settings_updated';

let cachedHeroSettings: HeroSettings | null = null;
let isHeroSettingsLoading = false;

export function loadHeroSettings(): HeroSettings {
    return cachedHeroSettings || { ...defaultHeroSettings };
}

export async function fetchHeroSettingsGlobal(): Promise<HeroSettings> {
    if (isHeroSettingsLoading && cachedHeroSettings) return cachedHeroSettings;
    isHeroSettingsLoading = true;
    try {
        const settings = await fetchHeroSettingsAPI();
        cachedHeroSettings = { ...defaultHeroSettings, ...settings };
        window.dispatchEvent(new Event(UPDATE_EVENT));
        return cachedHeroSettings as HeroSettings;
    } catch (e) {
        console.warn('Failed to fetch hero settings:', e);
        return cachedHeroSettings || { ...defaultHeroSettings };
    } finally {
        isHeroSettingsLoading = false;
    }
}

export async function saveHeroSettings(settings: HeroSettings): Promise<void> {
    try {
        const updated = await updateHeroSettingsAPI(settings);
        cachedHeroSettings = { ...defaultHeroSettings, ...updated };
        window.dispatchEvent(new CustomEvent(UPDATE_EVENT, { detail: cachedHeroSettings }));
    } catch (e) {
        console.warn('Failed to save hero settings:', e);
        throw e;
    }
}

export function useHeroSettings() {
    const [settings, setSettings] = useState<HeroSettings>(loadHeroSettings());

    useEffect(() => {
        fetchHeroSettingsGlobal().then(data => {
            setSettings(data);
        });

        const handleUpdate = (e: any) => {
            if (e.detail) {
                setSettings(e.detail);
            } else {
                setSettings(loadHeroSettings());
            }
        };

        window.addEventListener(UPDATE_EVENT, handleUpdate);
        return () => window.removeEventListener(UPDATE_EVENT, handleUpdate);
    }, []);

    return settings;
}
