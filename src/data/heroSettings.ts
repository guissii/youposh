// ─────────────────────────────────────────────────────────────
// Hero Section settings — admin-editable configuration
// ─────────────────────────────────────────────────────────────

export interface HeroSettings {
    // ── Content ──
    isEnabled: boolean;
    badgeText: string;
    title: string;
    subtitle: string;
    slogan: string;

    // ── CTAs ──
    primaryCtaText: string;
    primaryCtaLink: string;
    secondaryCtaText: string;
    secondaryCtaLink: string;

    // ── Video ──
    videoEnabled: boolean;
    videoUrl: string;
    videoPosterUrl: string;
    videoAutoplay: boolean;
    videoMuted: boolean;
    videoLoop: boolean;
    showOnMobile: boolean;

    // ── Overlay ──
    overlayOpacity: number; // 0–100
}

// ── Default values (used until admin overrides) ──
export const defaultHeroSettings: HeroSettings = {
    isEnabled: true,
    badgeText: 'Boutique N°1 au Maroc',
    title: 'Des produits tendance pour votre quotidien',
    subtitle: 'Gadgets, accessoires et articles utiles sélectionnés pour vous. Livraison partout au Maroc — paiement à la livraison.',
    slogan: 'Votre boutique tendance au Maroc',

    primaryCtaText: 'Explorer la boutique',
    primaryCtaLink: '/shop',
    secondaryCtaText: 'Voir les promotions',
    secondaryCtaLink: '/shop?filter=promo',

    videoEnabled: true,
    videoUrl: '/videos/demo.mp4',
    videoPosterUrl: '/images/products/headphones.jpg',
    videoAutoplay: true,
    videoMuted: true,
    videoLoop: true,
    showOnMobile: true,

    overlayOpacity: 55,
};

// ── Storage key for localStorage persistence ──
const STORAGE_KEY = 'youposh_hero_settings';

/** Load hero settings from localStorage, fallback to defaults */
export function loadHeroSettings(): HeroSettings {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            return { ...defaultHeroSettings, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.warn('Failed to load hero settings:', e);
    }
    return { ...defaultHeroSettings };
}

/** Save hero settings to localStorage */
export function saveHeroSettings(settings: HeroSettings): void {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (e) {
        console.warn('Failed to save hero settings:', e);
    }
}
