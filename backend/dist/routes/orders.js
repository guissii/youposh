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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const googleapis_1 = require("googleapis");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
function getDeliveryStatusFromOrderStatus(status) {
    if (status === 'cancelled')
        return 'returned';
    if (status === 'pending')
        return 'not_shipped';
    if (status === 'processing')
        return 'prepared';
    if (status === 'shipped')
        return 'shipped';
    if (status === 'delivered' || status === 'completed')
        return 'delivered';
    return 'not_shipped';
}
function getSheetsClient() {
    return __awaiter(this, void 0, void 0, function* () {
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY;
        if (!spreadsheetId || !clientEmail || !privateKeyRaw) {
            throw new Error('Google Sheets env vars missing');
        }
        const privateKey = privateKeyRaw.replace(/\\n/g, '\n');
        const auth = new googleapis_1.google.auth.JWT({
            email: clientEmail,
            key: privateKey,
            scopes: SHEETS_SCOPES,
        });
        const sheets = googleapis_1.google.sheets({ version: 'v4', auth });
        return { sheets, spreadsheetId };
    });
}
function ensureSheetTabExists(sheetTitle) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const { sheets, spreadsheetId } = yield getSheetsClient();
        const meta = yield sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets.properties.title',
        });
        const exists = ((_a = meta.data.sheets) !== null && _a !== void 0 ? _a : []).some(s => { var _a; return ((_a = s.properties) === null || _a === void 0 ? void 0 : _a.title) === sheetTitle; });
        if (!exists) {
            yield sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: { requests: [{ addSheet: { properties: { title: sheetTitle } } }] },
            });
        }
        return { sheets, spreadsheetId };
    });
}
function ensureHeaderRow(sheets, spreadsheetId, sheetTitle) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        const headerRange = `'${sheetTitle}'!1:1`;
        const existing = yield sheets.spreadsheets.values.get({ spreadsheetId, range: headerRange });
        const hasHeader = Array.isArray(existing.data.values) && existing.data.values.length > 0 && ((_a = existing.data.values[0]) !== null && _a !== void 0 ? _a : []).length > 0;
        if (hasHeader)
            return;
        const headers = [
            'ID commande',
            'Date création',
            'Nom client',
            'Téléphone',
            'Ville',
            'Adresse',
            'Produits',
            'Quantité totale',
            'Total',
            'Statut commande',
            'Statut livraison',
            'Code promo',
            'Remise',
            'Remarque',
            'Dernière mise à jour',
        ];
        yield sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetTitle}'!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: [headers] },
        });
    });
}
function appendOrderToGoogleSheet(order) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        if (!spreadsheetId)
            return;
        const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
        const sheetTitle = `Commandes_${createdAt.getFullYear()}_${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        const { sheets } = yield ensureSheetTabExists(sheetTitle);
        yield ensureHeaderRow(sheets, spreadsheetId, sheetTitle);
        const items = (_a = order.items) !== null && _a !== void 0 ? _a : [];
        const productsLabel = items
            .map(it => {
            var _a;
            const name = ((_a = it.product) === null || _a === void 0 ? void 0 : _a.name) || `#${it.productId}`;
            return `${it.quantity}x ${name}`;
        })
            .join(', ');
        const qtyTotal = items.reduce((sum, it) => { var _a; return sum + Number((_a = it.quantity) !== null && _a !== void 0 ? _a : 0); }, 0);
        const deliveryStatus = getDeliveryStatusFromOrderStatus(order.status);
        const row = [
            order.id,
            createdAt.toISOString(),
            (_b = order.customerName) !== null && _b !== void 0 ? _b : '',
            (_c = order.phone) !== null && _c !== void 0 ? _c : '',
            (_d = order.city) !== null && _d !== void 0 ? _d : '',
            (_e = order.address) !== null && _e !== void 0 ? _e : '',
            productsLabel,
            qtyTotal,
            (_f = order.total) !== null && _f !== void 0 ? _f : 0,
            (_g = order.status) !== null && _g !== void 0 ? _g : '',
            deliveryStatus,
            (_h = order.promoCode) !== null && _h !== void 0 ? _h : '',
            (_j = order.discount) !== null && _j !== void 0 ? _j : 0,
            (_k = order.notes) !== null && _k !== void 0 ? _k : '',
            new Date().toISOString(),
        ];
        yield sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${sheetTitle}'!A1`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [row] },
        });
    });
}
function parseVariantSelection(label) {
    if (typeof label !== 'string')
        return {};
    const parts = label.split('/').map(p => p.trim()).filter(Boolean);
    const out = {};
    for (const part of parts) {
        const idx = part.indexOf(':');
        if (idx === -1)
            continue;
        const key = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        if (key && value)
            out[key] = value;
    }
    return out;
}
// GET all orders with optional status filter
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, search } = req.query;
        const where = {};
        if (status === 'delivered' || status === 'completed') {
            where.status = { in: ['delivered', 'completed'] };
        }
        else if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { customerName: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { id: { contains: search, mode: 'insensitive' } },
            ];
        }
        const orders = yield prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { product: true }
                },
            },
        });
        res.json(orders);
    }
    catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
}));
// GET single order
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const order = yield prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: { include: { product: true } },
            },
        });
        if (!order)
            return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
}));
// POST create order
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { customerName, phone, city, address, notes, items, promoCode: promoCodeRaw } = req.body;
        const promoCode = typeof promoCodeRaw === 'string' ? promoCodeRaw.trim() : '';
        const normalizedItems = Array.isArray(items)
            ? items
                .map((it) => ({
                productId: Number(it === null || it === void 0 ? void 0 : it.productId),
                quantity: Number(it === null || it === void 0 ? void 0 : it.quantity),
                variant: typeof (it === null || it === void 0 ? void 0 : it.variant) === 'string' ? it.variant : undefined,
            }))
                .filter((it) => Number.isFinite(it.productId) && Number.isFinite(it.quantity) && it.quantity > 0)
            : [];
        if (!normalizedItems.length) {
            return res.status(400).json({ error: 'Panier vide' });
        }
        const extraNotes = (items !== null && items !== void 0 ? items : [])
            .map((item) => (typeof (item === null || item === void 0 ? void 0 : item.variant) === 'string' && item.variant.trim() ? `Produit ${item.productId}: ${item.variant.trim()}` : null))
            .filter(Boolean)
            .join('\n');
        const finalNotes = [notes, extraNotes].filter((s) => typeof s === 'string' && s.trim()).join('\n');
        const order = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            var _a, _b, _c, _d, _e, _f;
            const productIds = [...new Set(normalizedItems.map((it) => it.productId))];
            const products = yield tx.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, price: true, stock: true, inStock: true, variants: true },
            });
            const productById = new Map(products.map((p) => [p.id, p]));
            let subtotal = 0;
            for (const item of normalizedItems) {
                const product = productById.get(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                if (product.inStock === false) {
                    throw new Error(`Produit en rupture de stock: ${item.productId}`);
                }
                if (Number((_a = product.stock) !== null && _a !== void 0 ? _a : 0) < Number((_b = item.quantity) !== null && _b !== void 0 ? _b : 0)) {
                    throw new Error(`Out of stock: ${item.productId}`);
                }
                subtotal += Number(product.price) * Number(item.quantity);
            }
            let appliedPromo = null;
            let discount = 0;
            if (promoCode) {
                const promo = yield tx.promoCode.findUnique({ where: { code: promoCode } });
                if (!promo)
                    throw new Error('Code promo invalide');
                if (!promo.isActive)
                    throw new Error('Code promo expiré');
                if (promo.startDate && new Date(promo.startDate) > new Date())
                    throw new Error('Code promo pas encore actif');
                if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses)
                    throw new Error('Code promo épuisé');
                if (promo.endDate && new Date(promo.endDate) < new Date())
                    throw new Error('Code promo expiré');
                if (promo.minOrder > 0 && subtotal < promo.minOrder)
                    throw new Error(`Commande minimum: ${promo.minOrder} MAD`);
                const rawDiscount = promo.discountType === 'percentage'
                    ? (subtotal * promo.discountValue) / 100
                    : promo.discountValue;
                discount = Math.max(0, Math.min(subtotal, rawDiscount));
                appliedPromo = promo;
            }
            const totalAfterDiscount = Math.max(0, subtotal - discount);
            const created = yield tx.order.create({
                data: {
                    customerName,
                    phone,
                    city,
                    address,
                    notes: finalNotes || undefined,
                    promoCode: appliedPromo ? appliedPromo.code : undefined,
                    discount,
                    total: totalAfterDiscount,
                    items: {
                        create: normalizedItems.map((item) => {
                            const product = productById.get(item.productId);
                            const price = product ? Number(product.price) : 0;
                            return {
                                productId: item.productId,
                                quantity: item.quantity,
                                price,
                            };
                        }),
                    },
                },
                include: {
                    items: { include: { product: true } },
                },
            });
            for (const item of normalizedItems) {
                const product = yield tx.product.findUnique({
                    where: { id: item.productId },
                    select: {
                        id: true,
                        stock: true,
                        inStock: true,
                        variants: true,
                    },
                });
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                if (product.inStock === false) {
                    throw new Error(`Produit en rupture de stock: ${item.productId}`);
                }
                if (Number((_c = product.stock) !== null && _c !== void 0 ? _c : 0) < Number((_d = item.quantity) !== null && _d !== void 0 ? _d : 0)) {
                    throw new Error(`Out of stock: ${item.productId}`);
                }
                const selection = parseVariantSelection(item === null || item === void 0 ? void 0 : item.variant);
                let nextVariants = product.variants;
                if (selection && product.variants && Array.isArray(product.variants)) {
                    const updated = product.variants.map((v) => {
                        const selectedValue = selection === null || selection === void 0 ? void 0 : selection[v === null || v === void 0 ? void 0 : v.name];
                        if (!selectedValue || !Array.isArray(v === null || v === void 0 ? void 0 : v.options))
                            return v;
                        const newOptions = v.options.map((opt) => {
                            if (!opt || typeof opt !== 'object')
                                return opt;
                            if (typeof opt.value !== 'string')
                                return opt;
                            if (opt.value !== selectedValue)
                                return opt;
                            if (typeof opt.stock !== 'number')
                                return opt;
                            if (opt.stock < item.quantity) {
                                throw new Error(`Out of stock: ${item.productId} (${v.name}: ${opt.value})`);
                            }
                            return Object.assign(Object.assign({}, opt), { stock: opt.stock - item.quantity });
                        });
                        return Object.assign(Object.assign({}, v), { options: newOptions });
                    });
                    nextVariants = updated;
                }
                const newStock = Number((_e = product.stock) !== null && _e !== void 0 ? _e : 0) - Number((_f = item.quantity) !== null && _f !== void 0 ? _f : 0);
                yield tx.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: { decrement: item.quantity },
                        salesCount: { increment: item.quantity },
                        variants: nextVariants,
                        inStock: product.inStock && newStock <= 0 ? false : product.inStock,
                    },
                });
            }
            if (appliedPromo && discount > 0) {
                yield tx.promoCode.update({
                    where: { id: appliedPromo.id },
                    data: { usedCount: { increment: 1 } },
                });
            }
            return created;
        }));
        try {
            yield appendOrderToGoogleSheet(order);
        }
        catch (e) {
            console.warn('Sheets sync failed:', e instanceof Error ? e.message : String(e));
        }
        res.status(201).json(order);
    }
    catch (error) {
        console.error('Error creating order:', error);
        const message = error instanceof Error ? error.message : 'Failed to create order';
        const clientErrors = [
            'Panier vide',
            'Code promo invalide',
            'Code promo expiré',
            'Code promo épuisé',
            'Code promo pas encore actif',
            'Commande minimum:',
            'Product not found:',
            'Produit en rupture de stock:',
            'Out of stock:',
        ];
        const isClientError = clientErrors.some(prefix => message.startsWith(prefix));
        res.status(isClientError ? 400 : 500).json({ error: message });
    }
}));
// PUT update order status
router.put('/:id/status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        const order = yield prisma.order.update({
            where: { id: req.params.id },
            data: { status },
            include: {
                items: { include: { product: true } },
            },
        });
        res.json(order);
    }
    catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
}));
// DELETE order
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.order.delete({
            where: { id: req.params.id },
        });
        res.json({ message: 'Order deleted' });
    }
    catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
}));
exports.default = router;
