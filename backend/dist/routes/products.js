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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const prisma_1 = __importDefault(require("../utils/prisma"));
const cache_1 = require("../utils/cache");
const router = (0, express_1.Router)();
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
function parsePositiveInt(value) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed))
        return undefined;
    const normalized = Math.floor(parsed);
    if (normalized <= 0)
        return undefined;
    return normalized;
}
// GET all products with optional filters
router.get('/', (0, cache_1.cacheMiddleware)(60), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c;
    try {
        const { category, badge, search, sort, inStock, all, av, limit, includeArchived, page, perPage } = req.query;
        // Check if "all" is true OR if the request comes from the admin panel (implied by logic)
        // But to be safe, let's trust the "all" parameter more.
        const showAll = all === 'true';
        const showArchived = includeArchived === 'true';
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
        if (showAll && !showArchived) {
            where.NOT = { status: 'archived' };
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
        const badgeKey = badge;
        const requestedPage = (_b = parsePositiveInt(page)) !== null && _b !== void 0 ? _b : 1;
        const requestedPerPage = Math.min((_c = parsePositiveInt(perPage)) !== null && _c !== void 0 ? _c : 12, 60);
        const usePagination = page !== undefined || perPage !== undefined;
        const requestedLimit = parsePositiveInt(limit);
        const baseLimit = showAll ? 200 : 48;
        const safeLimit = usePagination
            ? Math.min(Math.max(requestedPerPage * 20, 120), 1000)
            : Math.min(requestedLimit !== null && requestedLimit !== void 0 ? requestedLimit : baseLimit, 500);
        const requiresPostProcessing = badgeKey === 'promo' || sortKey === 'popular' || sortKey === 'promo' || badgeKey === 'popular';
        const prismaTake = requiresPostProcessing ? Math.min(safeLimit * 3, 1000) : safeLimit;
        let orderBy = [{ sortOrder: 'desc' }, { salesCount: 'desc' }]; // Default sort now respects manual sortOrder
        // Basic sorting directly via DB when possible
        if (sortKey === 'newest')
            orderBy = [{ sortOrder: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }];
        if (sortKey === 'price-asc')
            orderBy = [{ sortOrder: 'desc' }, { price: 'asc' }];
        if (sortKey === 'price-desc')
            orderBy = [{ sortOrder: 'desc' }, { price: 'desc' }];
        if (sortKey === 'bestsellers')
            orderBy = [{ sortOrder: 'desc' }, { salesCount: 'desc' }, { viewsCount: 'desc' }];
        if (sortKey === 'popular')
            orderBy = [{ sortOrder: 'desc' }, { salesCount: 'desc' }, { viewsCount: 'desc' }];
        // Optimization: Push standard badge filters to database
        if (badgeKey === 'in-stock') {
            where.inStock = true;
        }
        else if (badgeKey === 'bestseller') {
            where.isBestSeller = true;
        }
        else if (badgeKey === 'new') {
            where.isNew = true;
        }
        else if (badgeKey === 'promo') {
            // Optimisation : au lieu de filtrer en mémoire, on utilise Prisma
            // Prisma ne supporte pas la comparaison de deux colonnes (originalPrice > price) directement dans le `where` standard.
            // On s'assure au moins que originalPrice n'est pas nul. Le filtrage strict se fera en post-DB.
            where.originalPrice = { not: null };
        }
        else if (badgeKey === 'featured') {
            where.isFeatured = true;
        }
        const productSelect = Object.assign({ id: true, name: true, nameAr: true, price: true, originalPrice: true, image: true, images: true, badge: true, rating: true, reviews: true, categorySlug: true, description: true, descriptionAr: true, inStock: true, isVisible: true, sku: true, tags: true, features: true, variants: true, isPopular: true, isNew: true, isBestSeller: true, isFeatured: true, status: true, publishedAt: true, sortOrder: true, viewsCount: true, cartAddCount: true, salesCount: true, stock: true, cardZoom: true, cardFocalX: true, cardFocalY: true, createdAt: true, updatedAt: true, category: true }, (showAll ? {
            attributeValues: {
                include: {
                    attributeValue: {
                        include: { attribute: true },
                    },
                },
            },
        } : {}));
        const canUseDbPagination = usePagination && !requiresPostProcessing;
        if (canUseDbPagination) {
            const total = yield prisma_1.default.product.count({ where });
            const totalPages = Math.max(1, Math.ceil(total / requestedPerPage));
            const normalizedPage = Math.min(requestedPage, totalPages);
            const offset = (normalizedPage - 1) * requestedPerPage;
            const pageProducts = yield prisma_1.default.product.findMany({
                where,
                orderBy,
                skip: offset,
                take: requestedPerPage,
                select: productSelect,
            });
            const items = pageProducts.map((p) => (Object.assign(Object.assign({}, p), { badge: computeBadge(p), isNew: isNewProduct(p), isBestSeller: isBestSellerProduct(p), isPopular: false })));
            res.json({
                items,
                total,
                page: normalizedPage,
                perPage: requestedPerPage,
                totalPages
            });
            return;
        }
        const products = yield prisma_1.default.product.findMany({
            where,
            orderBy,
            take: prismaTake,
            select: productSelect,
        });
        // Si aucun filtre complexe, on n'a pas besoin de calculer les scores pour TOUTE la BDD, juste pour les produits retournés.
        // Cela résout le problème de lenteur dans le panneau d'administration (O(n) evité).
        let popularIds = new Set();
        if (sortKey === 'popular' || badgeKey === 'popular' || badgeKey === 'new') {
            // OPTIMIZATION: Cache popularIds to avoid heavy DB queries on every request
            const cacheKey = 'popular_product_ids';
            const cachedPopularIds = cache_1.cache.get(cacheKey);
            if (cachedPopularIds) {
                popularIds = new Set(cachedPopularIds);
            }
            else {
                const activeProducts = yield prisma_1.default.product.findMany({
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
                const computedPopularIds = [...activeProducts]
                    .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
                    .slice(0, 8)
                    .map(p => p.id);
                popularIds = new Set(computedPopularIds);
                cache_1.cache.set(cacheKey, computedPopularIds, 300); // Cache for 5 minutes
            }
        }
        const withComputed = products.map((p) => {
            const computed = Object.assign(Object.assign({}, p), { badge: computeBadge(p), isNew: isNewProduct(p), isBestSeller: isBestSellerProduct(p), isPopular: popularIds.has(p.id) });
            return computed;
        });
        let filtered = withComputed;
        // Post-DB filtering for dynamic properties
        if (badgeKey === 'promo') {
            filtered = filtered.filter(p => p.originalPrice != null && Number(p.originalPrice) > Number(p.price));
        }
        else if (badgeKey === 'popular') {
            filtered = filtered.filter(p => p.isPopular);
        }
        // Post-DB sorting for dynamic properties
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
        // Appliquer la limite post-DB si elle a été sautée dans la requête Prisma
        if (sortKey === 'newest') {
            filtered = [...filtered].sort((a, b) => {
                const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
                const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
                return db - da;
            });
        }
        else if (sortKey === 'bestsellers') {
            filtered = [...filtered].sort((a, b) => { var _a, _b; return Number((_a = b.salesCount) !== null && _a !== void 0 ? _a : 0) - Number((_b = a.salesCount) !== null && _b !== void 0 ? _b : 0); });
        }
        if (usePagination) {
            const total = filtered.length;
            const totalPages = Math.max(1, Math.ceil(total / requestedPerPage));
            const normalizedPage = Math.min(requestedPage, totalPages);
            const offset = (normalizedPage - 1) * requestedPerPage;
            const items = filtered.slice(offset, offset + requestedPerPage);
            res.json({
                items,
                total,
                page: normalizedPage,
                perPage: requestedPerPage,
                totalPages
            });
            return;
        }
        filtered = filtered.slice(0, safeLimit);
        res.json(filtered);
    }
    catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
}));
// GET whatsapp-sync (n8n API)
router.get('/whatsapp-sync', (0, cache_1.cacheMiddleware)(60), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield prisma_1.default.product.findMany({
            where: {
                status: 'published',
                isVisible: true,
                inStock: true
            },
            include: {
                category: true,
            }
        });
        const backendUrl = process.env.VITE_API_URL || `${req.protocol}://${req.get('host')}`;
        const formattedProducts = products.map((p) => {
            let imageUrl = p.image || '';
            if (imageUrl && !imageUrl.startsWith('http')) {
                imageUrl = `${backendUrl}${imageUrl.startsWith('/') ? '' : '/'}${imageUrl}`;
            }
            return {
                id: String(p.id),
                nom: p.name || "",
                categorie: p.category ? p.category.name : (p.categorySlug || ""),
                sous_categorie: "",
                prix: Number(p.price),
                description: p.description || "",
                stock: Number(p.stock) || 0,
                image_url: imageUrl,
                actif: p.inStock && p.isVisible && p.status === 'published'
            };
        });
        res.json(formattedProducts);
    }
    catch (error) {
        console.error('Error fetching whatsapp-sync products:', error);
        res.status(500).json({ error: 'Failed to fetch products for WhatsApp sync' });
    }
}));
// GET single product
router.get('/:id', (0, cache_1.cacheMiddleware)(60), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const product = yield prisma_1.default.product.findUnique({
            where: { id: parseInt(String(req.params.id)) },
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
        // OPTIMIZATION: Cache popularIds to avoid heavy DB queries on every request
        const cacheKey = 'popular_product_ids';
        const cachedPopularIds = cache_1.cache.get(cacheKey);
        let popularIds;
        if (cachedPopularIds) {
            popularIds = new Set(cachedPopularIds);
        }
        else {
            const popularCandidates = yield prisma_1.default.product.findMany({
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
            const computedPopularIds = [...popularCandidates]
                .sort((a, b) => getPopularityScore(b) - getPopularityScore(a))
                .slice(0, 8)
                .map(p => p.id);
            popularIds = new Set(computedPopularIds);
            cache_1.cache.set(cacheKey, computedPopularIds, 300); // Cache for 5 minutes
        }
        res.json(Object.assign(Object.assign({}, product), { badge: computeBadge(product), isNew: isNewProduct(product), isBestSeller: isBestSellerProduct(product), isPopular: popularIds.has(product.id) }));
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
        if (isFeatured === true) {
            const featuredCount = yield prisma_1.default.product.count({ where: { isFeatured: true } });
            if (featuredCount >= 4) {
                return res.status(400).json({ error: "Maximum 4 produits autorisés en 'Offres du jour'." });
            }
        }
        const product = yield prisma_1.default.product.create({
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
                isFeatured: Boolean(isFeatured),
                isNew: typeof isNew === 'boolean' ? isNew : false,
                isPopular: typeof isPopular === 'boolean' ? isPopular : false,
                isBestSeller: typeof isBestSeller === 'boolean' ? isBestSeller : false,
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
        (0, cache_1.clearCache)();
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
        if (typeof isFeatured === 'boolean')
            data.isFeatured = isFeatured;
        if (typeof isNew === 'boolean')
            data.isNew = isNew;
        if (typeof isPopular === 'boolean')
            data.isPopular = isPopular;
        if (typeof isBestSeller === 'boolean')
            data.isBestSeller = isBestSeller;
        const id = parseInt(String(req.params.id));
        const current = yield prisma_1.default.product.findUnique({ where: { id }, select: { id: true, isFeatured: true } });
        if (!current) {
            return res.status(404).json({ error: 'Product not found' });
        }
        if (isFeatured === true && !current.isFeatured) {
            const featuredCount = yield prisma_1.default.product.count({ where: { isFeatured: true } });
            if (featuredCount >= 4) {
                return res.status(400).json({ error: "Maximum 4 produits autorisés en 'Offres du jour'." });
            }
        }
        const ids = Array.isArray(attributeValueIds)
            ? attributeValueIds.map((n) => parseInt(String(n))).filter((n) => Number.isFinite(n))
            : undefined;
        const product = yield prisma_1.default.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
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
        (0, cache_1.clearCache)();
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
        const productId = parseInt(String(req.params.id));
        if (isNaN(productId)) {
            return res.status(400).json({ error: 'Invalid product ID' });
        }
        const product = yield prisma_1.default.product.findUnique({ where: { id: productId } });
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        yield prisma_1.default.productAttributeValue.deleteMany({ where: { productId } });
        const driver = (process.env.UPLOADS_DRIVER || 'local').toLowerCase();
        if (driver === 'local') {
            const baseUploadsDir = process.env.UPLOADS_DIR || path_1.default.resolve(process.cwd(), 'uploads');
            const tryUnlink = (u) => {
                if (!u)
                    return;
                let p = '';
                try {
                    if (u.startsWith('http')) {
                        const url = new URL(u);
                        if (!url.pathname.startsWith('/uploads/'))
                            return;
                        p = path_1.default.join(baseUploadsDir, url.pathname.replace('/uploads/', ''));
                    }
                    else if (u.startsWith('/uploads/')) {
                        p = path_1.default.join(baseUploadsDir, u.replace('/uploads/', ''));
                    }
                    if (!p)
                        return;
                    if (!p.startsWith(baseUploadsDir))
                        return;
                    if (fs_1.default.existsSync(p))
                        fs_1.default.unlinkSync(p);
                }
                catch (_a) {
                }
            };
            tryUnlink(product.image);
            for (const img of product.images || [])
                tryUnlink(img);
        }
        yield prisma_1.default.product.delete({
            where: { id: productId },
        });
        (0, cache_1.clearCache)();
        res.json({ action: 'deleted', message: 'Product deleted successfully' });
    }
    catch (error) {
        console.error('Error deleting product:', error);
        // Handle Foreign Key Constraint (P2003) - Product used in Orders
        if (error.code === 'P2003') {
            try {
                // Soft delete / Archive instead
                yield prisma_1.default.product.update({
                    where: { id: parseInt(String(req.params.id)) },
                    data: {
                        status: 'archived',
                        isVisible: false,
                        inStock: false
                    }
                });
                (0, cache_1.clearCache)();
                return res.json({ action: 'archived', message: 'Produit archivé (car présent dans des commandes existantes)' });
            }
            catch (archiveError) {
                return res.status(500).json({ error: 'Failed to archive product' });
            }
        }
        res.status(500).json({ error: `Failed to delete product: ${error.message || error}` });
    }
}));
exports.default = router;
