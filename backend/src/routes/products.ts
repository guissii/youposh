import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

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

// GET all products with optional filters
router.get('/', async (req, res) => {
    try {
        const { category, badge, search, sort, inStock, all, av } = req.query;
        // Check if "all" is true OR if the request comes from the admin panel (implied by logic)
        // But to be safe, let's trust the "all" parameter more.
        const showAll = all === 'true';

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
        let orderBy: any = [{ sortOrder: 'desc' }, { salesCount: 'desc' }]; // Default sort now respects manual sortOrder
        
        if (sortKey === 'newest') orderBy = [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
        if (sortKey === 'price-asc') orderBy = [{ price: 'asc' }];
        if (sortKey === 'price-desc') orderBy = [{ price: 'desc' }];
        if (sortKey === 'bestsellers') orderBy = [{ salesCount: 'desc' }, { viewsCount: 'desc' }];
        if (sortKey === 'popular') orderBy = [{ sortOrder: 'desc' }, { salesCount: 'desc' }, { viewsCount: 'desc' }];

        const products = await prisma.product.findMany({
            where,
            orderBy,
            take: limit ? parseInt(limit as string) : undefined,
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

        const activeProducts = await prisma.product.findMany({
            where: { status: 'published', isVisible: true, inStock: true },
            select: {
                id: true,
                price: true,
                originalPrice: true,
                publishedAt: true,
                salesCount: true,
                viewsCount: true,
                cartAddCount: true,
                status: true,
                isVisible: true,
                inStock: true,
            },
        });

        const popularIds = new Set(
            [...activeProducts]
                .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
                .slice(0, 8)
                .map(p => p.id)
        );

        const featuredIds = new Set(
            [...activeProducts]
                .sort((a, b) => {
                    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                    return db - da;
                })
                .slice(0, 8)
                .map(p => p.id)
        );

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

        const badgeKey = badge as string | undefined;
        let filtered = withComputed;

        if (badgeKey === 'promo') {
            filtered = filtered.filter(p => p.originalPrice != null && Number(p.originalPrice) > Number(p.price));
        } else if (badgeKey === 'new') {
            filtered = filtered.filter(p => p.isNew);
        } else if (badgeKey === 'bestseller') {
            filtered = filtered.filter(p => p.isBestSeller);
        } else if (badgeKey === 'popular') {
            filtered = filtered.filter(p => p.isPopular);
        } else if (badgeKey === 'in-stock') {
            filtered = filtered.filter(p => p.inStock === true);
        }

        if (sortKey === 'popular') {
            filtered = [...filtered].sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
        } else if (sortKey === 'promo') {
            filtered = [...filtered].sort((a, b) => {
                const discA = (Number(a.originalPrice ?? 0) - Number(a.price));
                const discB = (Number(b.originalPrice ?? 0) - Number(b.price));
                return discB - discA;
            });
        } else if (sortKey === 'newest') {
            filtered = [...filtered].sort((a, b) => {
                const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                return db - da;
            });
        } else if (sortKey === 'bestsellers') {
            filtered = [...filtered].sort((a, b) => Number(b.salesCount ?? 0) - Number(a.salesCount ?? 0));
        }

        res.json(filtered);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

// GET single product
router.get('/:id', async (req, res) => {
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

        const activeProducts = await prisma.product.findMany({
            where: { status: 'published', isVisible: true, inStock: true },
            select: {
                id: true,
                price: true,
                originalPrice: true,
                publishedAt: true,
                salesCount: true,
                viewsCount: true,
                cartAddCount: true,
                status: true,
                isVisible: true,
                inStock: true,
            },
        });

        const popularIds = new Set(
            [...activeProducts]
                .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
                .slice(0, 8)
                .map(p => p.id)
        );

        const featuredIds = new Set(
            [...activeProducts]
                .sort((a, b) => {
                    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                    return db - da;
                })
                .slice(0, 8)
                .map(p => p.id)
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

        // Check if product exists first
        const product = await prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }

        // Delete dependencies first (e.g. attribute values) if cascade delete is not set in DB
        await prisma.productAttributeValue.deleteMany({ where: { productId } });
        
        // Now delete the product
        await prisma.product.delete({
            where: { id: productId },
        });
        
        res.json({ message: 'Product deleted successfully' });
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
                return res.json({ message: 'Produit archivé (car présent dans des commandes existantes)' });
            } catch (archiveError) {
                return res.status(500).json({ error: 'Failed to archive product' });
            }
        }

        res.status(500).json({ error: `Failed to delete product: ${error.message || error}` });
    }
});

export default router;
