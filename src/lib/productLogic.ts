import type { Product } from '@/types';

// ─────────────────────────────────────────────────────────────────
// Core predicates — hybrid auto + manual
// ─────────────────────────────────────────────────────────────────

/** Is the product published, visible and in stock? */
export function isActive(p: Product): boolean {
    return p.status === 'published' && p.isVisible && p.inStock;
}

/**
 * A product counts as "new" if:
 *  - it is active  (published + visible + in stock)
 *  - AND: `publishedAt` is within `days` days from now
 */
export function isNewProduct(p: Product, days = 30): boolean {
    if (!isActive(p)) return false;
    if (!p.publishedAt) return false;

    const publishedMs = new Date(p.publishedAt).getTime();
    const limitMs = days * 24 * 60 * 60 * 1000;
    return Date.now() - publishedMs <= limitMs;
}

/**
 * A product counts as "best seller" if:
 *  - it is active
 *  - AND: `salesCount >= minSales`
 */
export function isBestSellerProduct(p: Product, minSales = 10): boolean {
    if (!isActive(p)) return false;
    return p.salesCount >= minSales;
}

// ─────────────────────────────────────────────────────────────────
// Popularity score
// ─────────────────────────────────────────────────────────────────

/** Weighted score: sales 70%, views 20%, cart-adds 10% */
export function getPopularityScore(p: Product): number {
    return p.salesCount * 10 + p.viewsCount * 0.2 + p.cartAddCount * 1.5;
}

// ─────────────────────────────────────────────────────────────────
// Computed badge — replaces the hand-picked `badge` field
// ─────────────────────────────────────────────────────────────────

/** Priority: promo > bestseller > new */
export function computeBadge(p: Product): 'promo' | 'bestseller' | 'new' | undefined {
    if (p.originalPrice && p.originalPrice > p.price) return 'promo';
    if (isBestSellerProduct(p)) return 'bestseller';
    if (isNewProduct(p)) return 'new';
    return undefined;
}

// ─────────────────────────────────────────────────────────────────
// Query functions — replace the old simple list filters
// ─────────────────────────────────────────────────────────────────

/** New arrivals, sorted newest-first, capped at `limit` */
export function getNewProducts(allProducts: Product[], limit = 8): Product[] {
    return allProducts
        .filter(p => isNewProduct(p))
        .sort((a, b) => {
            const dateA = new Date(a.publishedAt ?? 0).getTime();
            const dateB = new Date(b.publishedAt ?? 0).getTime();
            return dateB - dateA;
        })
        .slice(0, limit);
}

/** Best sellers, sorted by popularity score desc, capped at `limit` */
export function getBestSellerProducts(allProducts: Product[], limit = 8): Product[] {
    return allProducts
        .filter(p => isBestSellerProduct(p))
        .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
        .slice(0, limit);
}

/** Products currently on sale */
export function getPromoProducts(allProducts: Product[], limit = 8): Product[] {
    return allProducts
        .filter(p => isActive(p) && p.originalPrice != null && p.originalPrice > p.price)
        .sort((a, b) => {
            const discA = (a.originalPrice ?? 0) - a.price;
            const discB = (b.originalPrice ?? 0) - b.price;
            return discB - discA;
        })
        .slice(0, limit);
}

/** 
 * Admin-picked featured products are now replaced by the most recent active products
 * since we removed the manual featured flag.
 */
export function getFeaturedProducts(allProducts: Product[], limit = 8): Product[] {
    return allProducts
        .filter(p => isActive(p))
        .sort((a, b) => {
            const dateA = new Date(a.publishedAt ?? 0).getTime();
            const dateB = new Date(b.publishedAt ?? 0).getTime();
            return dateB - dateA; // Newest first
        })
        .slice(0, limit);
}

/** Popular products by score */
export function getPopularProducts(allProducts: Product[], limit = 8): Product[] {
    return allProducts
        .filter(p => isActive(p))
        .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
        .slice(0, limit);
}
