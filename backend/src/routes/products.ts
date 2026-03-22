import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { cacheMiddleware, clearCache } from '../utils/cache';

const router = Router();
const prisma = new PrismaClient();

function isActive(p: any): boolean {
    return p.status === 'published' && p.isVisible === true && p.inStock === true;
}

function isNewProduct(p: any, days = 30): boolean {
    if (!isActive(p)) return false;
    if (!p.publishedAt) return false;
    const publishedMs = new Date(p.publishedAt).getTime();
    const limitMs = days * 24 * 60 * 60 * 1000;
    return Date.now() - publishedMs <= limitMs;
}

function isBestSellerProduct(p: any, minSales = 10): boolean {
    if (!isActive(p)) return false;
    return Number(p.salesCount ?? 0) >= minSales;
}

function getPopularityScore(p: any): number {
    const sales = Number(p.salesCount ?? 0);
    const views = Number(p.viewsCount ?? 0);
    const cart = Number(p.cartAddCount ?? 0);
    return sales * 10 + views * 0.2 + cart * 1.5;
}

function computeBadge(p: any): 'promo' | 'bestseller' | 'new' | undefined {
    if (p.originalPrice != null && Number(p.originalPrice) > Number(p.price)) return 'promo';
    if (isBestSellerProduct(p)) return 'bestseller';
    if (isNewProduct(p)) return 'new';
    return undefined;
}

function parsePositiveInt(value: unknown): number | undefined {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return undefined;
    const normalized = Math.floor(parsed);
    if (normalized <= 0) return undefined;
    return normalized;
}

// GET all products with optional filters
router.get('/', cacheMiddleware(60), async (req, res) => {
    try {
        const { category, badge, search, sort, inStock, all, av, limit, includeArchived } = req.query;
        // Check if "all" is true OR if the request comes from the admin panel (implied by logic)
        // But to be safe, let's trust the "all" parameter more.
        const showAll = all === 'true';
        const showArchived = includeArchived === 'true';

        // By default, only show visible products, unless "all=true" is passed (e.g. by admin)
        const where: any = {};
        if (!showAll) {
            // Fix: Check for both 'published' status AND isVisible flag
            where.status = 'published';
            where.isVisible = true;
        } else {
            // Admin wants to see everything, but maybe not archived ones by default?
            // Let's allow fetching everything except hard-deleted (which don't exist).
            // If admin wants to see archived, they can filter by status if we implement it.
            // For now, "all=true" returns EVERYTHING including drafts and archived.
        }

        if (showAll && !showArchived) {
            where.NOT = { status: 'archived' };
        }

        if (category) where.categorySlug = category;
        if (inStock === 'true') where.inStock = true;
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { nameAr: { contains: search as string, mode: 'insensitive' } },
                { tags: { has: (search as string).toLowerCase() } },
            ];
        }

        const avIds = typeof av === 'string'
            ? av.split(',').map(s => parseInt(s.trim())).filter(n => Number.isFinite(n))
            : [];
        if (avIds.length) {
            where.AND = [
                ...(Array.isArray(where.AND) ? where.AND : []),
                ...avIds.map(id => ({ attributeValues: { some: { attributeValueId: id } } })),
            ];
        }

        const sortKey = (sort as string | undefined) ?? 'popular';
        const badgeKey = badge as string | undefined;
        const requestedLimit = parsePositiveInt(limit);
        const baseLimit = showAll ? 200 : 48;
        const safeLimit = Math.min(requestedLimit ?? baseLimit, 500);
        const requiresPostProcessing = badgeKey === 'promo' || sortKey === 'popular' || sortKey === 'promo' || badgeKey === 'popular';
        const prismaTake = requiresPostProcessing ? Math.min(safeLimit * 3, 1000) : safeLimit;
        let orderBy: any = [{ sortOrder: 'desc' }, { salesCount: 'desc' }]; // Default sort now respects manual sortOrder

        // Basic sorting directly via DB when possible
        if (sortKey === 'newest') orderBy = [{ sortOrder: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
        if (sortKey === 'price-asc') orderBy = [{ sortOrder: 'desc' }, { price: 'asc' }];
        if (sortKey === 'price-desc') orderBy = [{ sortOrder: 'desc' }, { price: 'desc' }];
        if (sortKey === 'bestsellers') orderBy = [{ sortOrder: 'desc' }, { salesCount: 'desc' }, { viewsCount: 'desc' }];
        if (sortKey === 'popular') orderBy = [{ sortOrder: 'desc' }, { salesCount: 'desc' }, { viewsCount: 'desc' }];

        // Optimization: Push standard badge filters to database
        if (badgeKey === 'in-stock') {
            where.inStock = true;
        } else if (badgeKey === 'bestseller') {
            where.isBestSeller = true;
        } else if (badgeKey === 'new') {
            where.isNew = true;
        } else if (badgeKey === 'promo') {
            // Optimisation : au lieu de filtrer en mémoire, on utilise Prisma
            // Prisma ne supporte pas la comparaison de deux colonnes (originalPrice > price) directement dans le `where` standard.
            // On s'assure au moins que originalPrice n'est pas nul. Le filtrage strict se fera en post-DB.
            where.originalPrice = { not: null };
        }

        const products = await prisma.product.findMany({
            where,
            orderBy,
            take: prismaTake,
            include: {
                category: true,
                attributeValues: {
                    include: {
                        attributeValue: {
                            include: {
                                attribute: true,
                            },
                        },
                    },
                },
            },
        });

        // Si aucun filtre complexe, on n'a pas besoin de calculer les scores pour TOUTE la BDD, juste pour les produits retournés.
        // Cela résout le problème de lenteur dans le panneau d'administration (O(n) evité).
        let popularIds = new Set<number>();
        let featuredIds = new Set<number>();

        if (sortKey === 'popular' || badgeKey === 'popular' || badgeKey === 'new') {
            const activeProducts = await prisma.product.findMany({
                where: { status: 'published', isVisible: true, inStock: true },
                orderBy: [{ salesCount: 'desc' }, { viewsCount: 'desc' }, { cartAddCount: 'desc' }],
                take: 300,
                select: {
                    id: true,
                    price: true,
                    originalPrice: true,
                    publishedAt: true,
                    salesCount: true,
                    viewsCount: true,
                    cartAddCount: true,
                },
            });

            popularIds = new Set(
                [...activeProducts]
                    .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
                    .slice(0, 8)
                    .map(p => p.id)
            );

            featuredIds = new Set(
                [...activeProducts]
                    .sort((a, b) => {
                        const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                        const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                        return db - da;
                    })
                    .slice(0, 8)
                    .map(p => p.id)
            );
        }

        const withComputed = products.map(p => {
            const computed = {
                ...p,
                badge: computeBadge(p),
                isNew: isNewProduct(p),
                isBestSeller: isBestSellerProduct(p),
                isPopular: popularIds.has(p.id),
                isFeatured: featuredIds.has(p.id),
            };
            return computed;
        });

        let filtered = withComputed;

        // Post-DB filtering for dynamic properties
        if (badgeKey === 'promo') {
            filtered = filtered.filter(p => p.originalPrice != null && Number(p.originalPrice) > Number(p.price));
        } else if (badgeKey === 'popular') {
            filtered = filtered.filter(p => p.isPopular);
        }

        // Post-DB sorting for dynamic properties
        if (sortKey === 'popular') {
            filtered = [...filtered].sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
        } else if (sortKey === 'promo') {
            filtered = [...filtered].sort((a, b) => {
                const discA = (Number(a.originalPrice ?? 0) - Number(a.price));
                const discB = (Number(b.originalPrice ?? 0) - Number(b.price));
                return discB - discA;
            });
        }

        // Appliquer la limite post-DB si elle a été sautée dans la requête Prisma
        if (sortKey === 'newest') {
            filtered = [...filtered].sort((a, b) => {
                const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                return db - da;
            });
        } else if (sortKey === 'bestsellers') {
            filtered = [...filtered].sort((a, b) => Number(b.salesCount ?? 0) - Number(a.salesCount ?? 0));
        }

        filtered = filtered.slice(0, safeLimit);

        res.json(filtered);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET single product
router.get('/:id', cacheMiddleware(60), async (req, res) => {
    try {
        const product = await prisma.product.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                category: true,
                attributeValues: {
                    include: {
                        attributeValue: {
                            include: {
                                attribute: true,
                            },
                        },
                    },
                },
            },
        });
        if (!product) return res.status(404).json({ error: 'Product not found' });

        const popularCandidates = await prisma.product.findMany({
            where: { status: 'published', isVisible: true, inStock: true },
            orderBy: [{ salesCount: 'desc' }, { viewsCount: 'desc' }, { cartAddCount: 'desc' }],
            take: 300,
            select: {
                id: true,
                price: true,
                originalPrice: true,
                publishedAt: true,
                salesCount: true,
                viewsCount: true,
                cartAddCount: true,
            },
        });

        const popularIds = new Set(
            [...popularCandidates]
                .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
                .slice(0, 8)
                .map(p => p.id)
        );

        const featuredCandidates = await prisma.product.findMany({
            where: { status: 'published', isVisible: true, inStock: true },
            orderBy: [{ publishedAt: 'desc' }, { createdAt: 'desc' }],
            take: 8,
            select: { id: true },
        });

        const featuredIds = new Set(
            featuredCandidates.map(p => p.id)
        );

        res.json({
            ...product,
            badge: computeBadge(product),
            isNew: isNewProduct(product),
            isBestSeller: isBestSellerProduct(product),
            isPopular: popularIds.has(product.id),
            isFeatured: featuredIds.has(product.id),
        });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// POST create product
router.post('/', async (req, res) => {
    try {
        console.log('Creating product with body:', req.body);
        const {
            badge,
            isNew,
            isPopular,
            isBestSeller,
            isFeatured,
            attributeValueIds,
            category,
            ...rest
        } = req.body ?? {};

        const data = { ...rest };
        if (data.categorySlug === "") {
            delete data.categorySlug;
        }

        const ids = Array.isArray(attributeValueIds)
            ? attributeValueIds.map((n: any) => parseInt(String(n))).filter((n: any) => Number.isFinite(n))
            : [];

        const product = await prisma.product.create({
            data: {
                name: data.name,
                nameAr: data.nameAr || '',
                description: data.description || '',
                descriptionAr: data.descriptionAr || '',
                price: parseFloat(data.price),
                originalPrice: data.originalPrice ? parseFloat(data.originalPrice) : null,
                stock: parseInt(data.stock),
                sku: data.sku || '',
                image: data.image || '',
                images: data.images || [],
                categorySlug: data.categorySlug || null,
                status: data.status || 'published',
                isVisible: data.isVisible ?? true,
                inStock: data.inStock ?? true,
                tags: Array.isArray(data.tags) ? data.tags : [],
                features: Array.isArray(data.features) ? data.features : [],
                variants: Array.isArray(data.variants) ? data.variants : [],
                sortOrder: data.sortOrder ? parseInt(String(data.sortOrder)) : 0,
                cardZoom: data.cardZoom ? parseFloat(String(data.cardZoom)) : 1.0,
                cardFocalX: data.cardFocalX ? parseFloat(String(data.cardFocalX)) : 50.0,
                cardFocalY: data.cardFocalY ? parseFloat(String(data.cardFocalY)) : 50.0,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
                attributeValues: {
                    create: ids.map((id: number) => ({ attributeValueId: id }))
                }
            },
            include: {
                category: true,
                attributeValues: {
                    include: {
                        attributeValue: {
                            include: { attribute: true },
                        },
                    },
                },
            },
        });
        clearCache();
        res.status(201).json(product);
    } catch (error: any) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: `Failed to create product: ${error.message || error}` });
    }
});

// PUT update product
router.put('/:id', async (req, res) => {
    try {
        const {
            badge,
            isNew,
            isPopular,
            isBestSeller,
            isFeatured,
            attributeValueIds,
            ...rest
        } = req.body ?? {};

        const data = { ...rest };
        if (data.categorySlug === "") {
            data.categorySlug = null;
        }

        const id = parseInt(req.params.id);
        const ids = Array.isArray(attributeValueIds)
            ? attributeValueIds.map((n: any) => parseInt(String(n))).filter((n: any) => Number.isFinite(n))
            : undefined;

        const product = await prisma.$transaction(async (tx) => {
            const updated = await tx.product.update({
                where: { id },
                data,
            });

            if (Array.isArray(ids)) {
                await tx.productAttributeValue.deleteMany({ where: { productId: updated.id } });
                if (ids.length) {
                    await tx.productAttributeValue.createMany({
                        data: ids.map((attributeValueId: number) => ({ productId: updated.id, attributeValueId })),
                        skipDuplicates: true,
                    });
                }
            }

            return tx.product.findUnique({
                where: { id: updated.id },
                include: {
                    category: true,
                    attributeValues: {
                        include: {
                            attributeValue: {
                                include: { attribute: true },
                            },
                        },
                    },
                },
            });
        });
        clearCache();
        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// DELETE product
router.delete('/:id', async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }

        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await prisma.productAttributeValue.deleteMany({ where: { productId } });

        const driver = (process.env.UPLOADS_DRIVER || 'local').toLowerCase();
        if (driver === 'local') {
            const baseUploadsDir = process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads');
            const tryUnlink = (u?: string | null) => {
                if (!u) return;
                let p = '';
                try {
                    if (u.startsWith('http')) {
                        const url = new URL(u);
                        if (!url.pathname.startsWith('/uploads/')) return;
                        p = path.join(baseUploadsDir, url.pathname.replace('/uploads/', ''));
                    } else if (u.startsWith('/uploads/')) {
                        p = path.join(baseUploadsDir, u.replace('/uploads/', ''));
                    }
                    if (!p) return;
                    if (!p.startsWith(baseUploadsDir)) return;
                    if (fs.existsSync(p)) fs.unlinkSync(p);
                } catch {
                }
            };
            tryUnlink(product.image);
            for (const img of product.images || []) tryUnlink(img);
        }

        await prisma.product.delete({
            where: { id: productId },
        });

        clearCache();
        res.json({ action: 'deleted', message: 'Product deleted successfully' });
    } catch (error: any) {
        console.error('Error deleting product:', error);

        // Handle Foreign Key Constraint (P2003) - Product used in Orders
        if (error.code === 'P2003') {
            try {
                // Soft delete / Archive instead
                await prisma.product.update({
                    where: { id: parseInt(req.params.id) },
                    data: {
                        status: 'archived',
                        isVisible: false,
                        inStock: false
                    }
                });
                clearCache();
                return res.json({ action: 'archived', message: 'Produit archivé (car présent dans des commandes existantes)' });
            } catch (archiveError) {
                return res.status(500).json({ error: 'Failed to archive product' });
            }
        }

        res.status(500).json({ error: `Failed to delete product: ${error.message || error}` });
    }
});

export default router;
