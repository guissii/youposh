"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
function isActive(p) {
    return p.status === 'published' && p.isVisible === true && p.inStock === true;
}
function isNewProduct(p, days = 30) {
    if (!isActive(p))
        return false;
    if (!p.publishedAt)
        return false;
    const publishedMs = new Date(p.publishedAt).getTime();
    const limitMs = days * 24 * 60 * 60 * 1000;
    return Date.now() - publishedMs <= limitMs;
}
function isBestSellerProduct(p, minSales = 10) {
    var _a;
    if (!isActive(p))
        return false;
    return Number((_a = p.salesCount) !== null && _a !== void 0 ? _a : 0) >= minSales;
}
function getPopularityScore(p) {
    var _a, _b, _c;
    const sales = Number((_a = p.salesCount) !== null && _a !== void 0 ? _a : 0);
    const views = Number((_b = p.viewsCount) !== null && _b !== void 0 ? _b : 0);
    const cart = Number((_c = p.cartAddCount) !== null && _c !== void 0 ? _c : 0);
    return sales * 10 + views * 0.2 + cart * 1.5;
}
function computeBadge(p) {
    if (p.originalPrice != null && Number(p.originalPrice) > Number(p.price))
        return 'promo';
    if (isBestSellerProduct(p))
        return 'bestseller';
    if (isNewProduct(p))
        return 'new';
    return undefined;
}
// GET all products with optional filters
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { category, badge, search, sort, inStock, all, av, limit } = req.query;
        // Check if "all" is true OR if the request comes from the admin panel (implied by logic)
        // But to be safe, let's trust the "all" parameter more.
        const showAll = all === 'true';
        // By default, only show visible products, unless "all=true" is passed (e.g. by admin)
        const where = {};
        if (!showAll) {
            // Fix: Check for both 'published' status AND isVisible flag
            where.status = 'published';
            where.isVisible = true;
        }
        else {
            // Admin wants to see everything, but maybe not archived ones by default?
            // Let's allow fetching everything except hard-deleted (which don't exist).
            // If admin wants to see archived, they can filter by status if we implement it.
            // For now, "all=true" returns EVERYTHING including drafts and archived.
        }
        if (category)
            where.categorySlug = category;
        if (inStock === 'true')
            where.inStock = true;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { nameAr: { contains: search, mode: 'insensitive' } },
                { tags: { has: search.toLowerCase() } },
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
        const sortKey = (_a = sort) !== null && _a !== void 0 ? _a : 'popular';
        let orderBy = [{ sortOrder: 'desc' }, { salesCount: 'desc' }]; // Default sort now respects manual sortOrder
        if (sortKey === 'newest')
            orderBy = [{ publishedAt: 'desc' }, { createdAt: 'desc' }];
        if (sortKey === 'price-asc')
            orderBy = [{ price: 'asc' }];
        if (sortKey === 'price-desc')
            orderBy = [{ price: 'desc' }];
        if (sortKey === 'bestsellers')
            orderBy = [{ salesCount: 'desc' }, { viewsCount: 'desc' }];
        if (sortKey === 'popular')
            orderBy = [{ sortOrder: 'desc' }, { salesCount: 'desc' }, { viewsCount: 'desc' }];
        const products = yield prisma.product.findMany({
            where,
            orderBy,
            take: limit ? parseInt(limit) : undefined,
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
        const activeProducts = yield prisma.product.findMany({
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
        const popularIds = new Set([...activeProducts]
            .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
            .slice(0, 8)
            .map(p => p.id));
        const featuredIds = new Set([...activeProducts]
            .sort((a, b) => {
            const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            return db - da;
        })
            .slice(0, 8)
            .map(p => p.id));
        const withComputed = products.map(p => {
            const computed = Object.assign(Object.assign({}, p), { badge: computeBadge(p), isNew: isNewProduct(p), isBestSeller: isBestSellerProduct(p), isPopular: popularIds.has(p.id), isFeatured: featuredIds.has(p.id) });
            return computed;
        });
        const badgeKey = badge;
        let filtered = withComputed;
        if (badgeKey === 'promo') {
            filtered = filtered.filter(p => p.originalPrice != null && Number(p.originalPrice) > Number(p.price));
        }
        else if (badgeKey === 'new') {
            filtered = filtered.filter(p => p.isNew);
        }
        else if (badgeKey === 'bestseller') {
            filtered = filtered.filter(p => p.isBestSeller);
        }
        else if (badgeKey === 'popular') {
            filtered = filtered.filter(p => p.isPopular);
        }
        else if (badgeKey === 'in-stock') {
            filtered = filtered.filter(p => p.inStock === true);
        }
        if (sortKey === 'popular') {
            filtered = [...filtered].sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
        }
        else if (sortKey === 'promo') {
            filtered = [...filtered].sort((a, b) => {
                var _a, _b;
                const discA = (Number((_a = a.originalPrice) !== null && _a !== void 0 ? _a : 0) - Number(a.price));
                const discB = (Number((_b = b.originalPrice) !== null && _b !== void 0 ? _b : 0) - Number(b.price));
                return discB - discA;
            });
        }
        else if (sortKey === 'newest') {
            filtered = [...filtered].sort((a, b) => {
                const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                return db - da;
            });
        }
        else if (sortKey === 'bestsellers') {
            filtered = [...filtered].sort((a, b) => { var _a, _b; return Number((_a = b.salesCount) !== null && _a !== void 0 ? _a : 0) - Number((_b = a.salesCount) !== null && _b !== void 0 ? _b : 0); });
        }
        res.json(filtered);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
}));
// GET single product
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield prisma.product.findUnique({
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
        if (!product)
            return res.status(404).json({ error: 'Product not found' });
        const activeProducts = yield prisma.product.findMany({
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
        const popularIds = new Set([...activeProducts]
            .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
            .slice(0, 8)
            .map(p => p.id));
        const featuredIds = new Set([...activeProducts]
            .sort((a, b) => {
            const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
            const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
            return db - da;
        })
            .slice(0, 8)
            .map(p => p.id));
        res.json(Object.assign(Object.assign({}, product), { badge: computeBadge(product), isNew: isNewProduct(product), isBestSeller: isBestSellerProduct(product), isPopular: popularIds.has(product.id), isFeatured: featuredIds.has(product.id) }));
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch product' });
    }
}));
// POST create product
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        console.log('Creating product with body:', req.body);
        const _d = (_a = req.body) !== null && _a !== void 0 ? _a : {}, { badge, isNew, isPopular, isBestSeller, isFeatured, attributeValueIds, category } = _d, rest = __rest(_d, ["badge", "isNew", "isPopular", "isBestSeller", "isFeatured", "attributeValueIds", "category"]);
        const data = Object.assign({}, rest);
        if (data.categorySlug === "") {
            delete data.categorySlug;
        }
        const ids = Array.isArray(attributeValueIds)
            ? attributeValueIds.map((n) => parseInt(String(n))).filter((n) => Number.isFinite(n))
            : [];
        const product = yield prisma.product.create({
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
                isVisible: (_b = data.isVisible) !== null && _b !== void 0 ? _b : true,
                inStock: (_c = data.inStock) !== null && _c !== void 0 ? _c : true,
                tags: Array.isArray(data.tags) ? data.tags : [],
                features: Array.isArray(data.features) ? data.features : [],
                variants: Array.isArray(data.variants) ? data.variants : [],
                sortOrder: data.sortOrder ? parseInt(String(data.sortOrder)) : 0,
                cardZoom: data.cardZoom ? parseFloat(String(data.cardZoom)) : 1.0,
                cardFocalX: data.cardFocalX ? parseFloat(String(data.cardFocalX)) : 50.0,
                cardFocalY: data.cardFocalY ? parseFloat(String(data.cardFocalY)) : 50.0,
                publishedAt: data.publishedAt ? new Date(data.publishedAt) : new Date(),
                attributeValues: {
                    create: ids.map((id) => ({ attributeValueId: id }))
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
    }
    catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: `Failed to create product: ${error.message || error}` });
    }
}));
// PUT update product
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const _b = (_a = req.body) !== null && _a !== void 0 ? _a : {}, { badge, isNew, isPopular, isBestSeller, isFeatured, attributeValueIds } = _b, rest = __rest(_b, ["badge", "isNew", "isPopular", "isBestSeller", "isFeatured", "attributeValueIds"]);
        const data = Object.assign({}, rest);
        if (data.categorySlug === "") {
            data.categorySlug = null;
        }
        const id = parseInt(req.params.id);
        const ids = Array.isArray(attributeValueIds)
            ? attributeValueIds.map((n) => parseInt(String(n))).filter((n) => Number.isFinite(n))
            : undefined;
        const product = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const updated = yield tx.product.update({
                where: { id },
                data,
            });
            if (Array.isArray(ids)) {
                yield tx.productAttributeValue.deleteMany({ where: { productId: updated.id } });
                if (ids.length) {
                    yield tx.productAttributeValue.createMany({
                        data: ids.map((attributeValueId) => ({ productId: updated.id, attributeValueId })),
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
        }));
        res.json(product);
    }
    catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
}));
// DELETE product
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const productId = parseInt(req.params.id);
        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        // Check if product exists first
        const product = yield prisma.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        // Delete dependencies first (e.g. attribute values) if cascade delete is not set in DB
        yield prisma.productAttributeValue.deleteMany({ where: { productId } });
        // Now delete the product
        yield prisma.product.delete({
            where: { id: productId },
        });
        res.json({ message: 'Product deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        // Handle Foreign Key Constraint (P2003) - Product used in Orders
        if (error.code === 'P2003') {
            try {
                // Soft delete / Archive instead
                yield prisma.product.update({
                    where: { id: parseInt(req.params.id) },
                    data: {
                        status: 'archived',
                        isVisible: false,
                        inStock: false
                    }
                });
                return res.json({ message: 'Produit archivé (car présent dans des commandes existantes)' });
            }
            catch (archiveError) {
                return res.status(500).json({ error: 'Failed to archive product' });
            }
        }
        res.status(500).json({ error: `Failed to delete product: ${error.message || error}` });
    }
}));
exports.default = router;
