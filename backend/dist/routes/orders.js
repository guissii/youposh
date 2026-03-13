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
let didWarnSheetsEnvMissing = false;
function warnSheetsEnvMissing() {
    if (didWarnSheetsEnvMissing)
        return;
    didWarnSheetsEnvMissing = true;
    console.warn('Google Sheets sync skipped: missing env vars (GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY or GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)');
}
function getDeliveryStatusFromOrderStatus(status) {
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
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
        if (!spreadsheetId || !clientEmail || !privateKeyRaw) {
            throw new Error('Google Sheets env vars missing');
        }
        const privateKey = String(privateKeyRaw)
            .replace(/^\s*["']|["']\s*$/g, '')
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .replace(/\\n/g, '\n')
            .trim();
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
        var _a, _b, _c, _d, _e, _f, _g;
        const { sheets, spreadsheetId } = yield getSheetsClient();
        const meta = yield sheets.spreadsheets.get({
            spreadsheetId,
            fields: 'sheets.properties.title,sheets.properties.sheetId,developerMetadata(metadataKey,location)',
        });
        const existingSheet = ((_a = meta.data.sheets) !== null && _a !== void 0 ? _a : []).find(s => { var _a; return ((_a = s.properties) === null || _a === void 0 ? void 0 : _a.title) === sheetTitle; });
        if (((_b = existingSheet === null || existingSheet === void 0 ? void 0 : existingSheet.properties) === null || _b === void 0 ? void 0 : _b.sheetId) != null) {
            const sheetId = existingSheet.properties.sheetId;
            const hasDeliveryFormatting = ((_c = meta.data.developerMetadata) !== null && _c !== void 0 ? _c : []).some((md) => {
                var _a;
                return (md === null || md === void 0 ? void 0 : md.metadataKey) === 'YOUPOSH_DELIVERY_V1' && ((_a = md === null || md === void 0 ? void 0 : md.location) === null || _a === void 0 ? void 0 : _a.sheetId) === sheetId;
            });
            return { sheets, spreadsheetId, sheetId, hasDeliveryFormatting };
        }
        const created = yield sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: { requests: [{ addSheet: { properties: { title: sheetTitle } } }] },
        });
        const createdSheetId = (_g = (_f = (_e = (_d = created.data.replies) === null || _d === void 0 ? void 0 : _d[0]) === null || _e === void 0 ? void 0 : _e.addSheet) === null || _f === void 0 ? void 0 : _f.properties) === null || _g === void 0 ? void 0 : _g.sheetId;
        if (createdSheetId == null) {
            throw new Error(`Failed to create sheet tab "${sheetTitle}" (missing sheetId)`);
        }
        return { sheets, spreadsheetId, sheetId: createdSheetId, hasDeliveryFormatting: false };
    });
}
function getExpectedSheetHeaders() {
    return [
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
}
function ensureSheetFormatting(sheets, spreadsheetId, sheetId, options) {
    return __awaiter(this, void 0, void 0, function* () {
        const endRowIndex = 5000;
        const endColumnIndex = 15;
        const orderStatusValues = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
        const deliveryStatusValues = ['not_shipped', 'shipped', 'delivered'];
        const includeDeliveryConditionalFormatting = (options === null || options === void 0 ? void 0 : options.includeDeliveryConditionalFormatting) !== false;
        const requests = [
            {
                updateSheetProperties: {
                    properties: {
                        sheetId,
                        gridProperties: { frozenRowCount: 1 },
                    },
                    fields: 'gridProperties.frozenRowCount',
                },
            },
            {
                setBasicFilter: {
                    filter: {
                        range: {
                            sheetId,
                            startRowIndex: 0,
                            endRowIndex,
                            startColumnIndex: 0,
                            endColumnIndex,
                        },
                    },
                },
            },
            {
                setDataValidation: {
                    range: {
                        sheetId,
                        startRowIndex: 1,
                        endRowIndex,
                        startColumnIndex: 9,
                        endColumnIndex: 10,
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: orderStatusValues.map(v => ({ userEnteredValue: v })),
                        },
                        strict: true,
                        showCustomUi: true,
                    },
                },
            },
            {
                setDataValidation: {
                    range: {
                        sheetId,
                        startRowIndex: 1,
                        endRowIndex,
                        startColumnIndex: 10,
                        endColumnIndex: 11,
                    },
                    rule: {
                        condition: {
                            type: 'ONE_OF_LIST',
                            values: deliveryStatusValues.map(v => ({ userEnteredValue: v })),
                        },
                        strict: true,
                        showCustomUi: true,
                    },
                },
            },
        ];
        if (includeDeliveryConditionalFormatting) {
            const deliveryRange = {
                sheetId,
                startRowIndex: 1,
                endRowIndex,
                startColumnIndex: 10,
                endColumnIndex: 11,
            };
            requests.push({
                addConditionalFormatRule: {
                    index: 0,
                    rule: {
                        ranges: [deliveryRange],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'not_shipped' }],
                            },
                            format: {
                                backgroundColor: { red: 0.93, green: 0.94, blue: 0.96 },
                                textFormat: { bold: true, foregroundColor: { red: 0.22, green: 0.25, blue: 0.32 } },
                            },
                        },
                    },
                },
            }, {
                addConditionalFormatRule: {
                    index: 0,
                    rule: {
                        ranges: [deliveryRange],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'shipped' }],
                            },
                            format: {
                                backgroundColor: { red: 1.0, green: 0.93, blue: 0.78 },
                                textFormat: { bold: true, foregroundColor: { red: 0.55, green: 0.35, blue: 0.0 } },
                            },
                        },
                    },
                },
            }, {
                addConditionalFormatRule: {
                    index: 0,
                    rule: {
                        ranges: [deliveryRange],
                        booleanRule: {
                            condition: {
                                type: 'TEXT_EQ',
                                values: [{ userEnteredValue: 'delivered' }],
                            },
                            format: {
                                backgroundColor: { red: 0.80, green: 0.95, blue: 0.86 },
                                textFormat: { bold: true, foregroundColor: { red: 0.02, green: 0.39, blue: 0.19 } },
                            },
                        },
                    },
                },
            }, {
                createDeveloperMetadata: {
                    developerMetadata: {
                        metadataKey: 'YOUPOSH_DELIVERY_V1',
                        metadataValue: '1',
                        visibility: 'DOCUMENT',
                        location: { sheetId },
                    },
                },
            });
        }
        yield sheets.spreadsheets.batchUpdate({
            spreadsheetId,
            requestBody: {
                requests,
            },
        });
    });
}
function ensureHeaderRow(sheets, spreadsheetId, sheetTitle, sheetId, hasDeliveryFormatting) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const expectedHeaders = getExpectedSheetHeaders();
        const headerRange = `'${sheetTitle}'!A1:O1`;
        const existing = yield sheets.spreadsheets.values.get({ spreadsheetId, range: headerRange });
        const currentHeaders = ((_b = (_a = existing.data.values) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : []);
        const needsUpdate = currentHeaders.length < expectedHeaders.length ||
            expectedHeaders.some((h, idx) => { var _a; return String((_a = currentHeaders[idx]) !== null && _a !== void 0 ? _a : '').trim() !== h; });
        if (needsUpdate) {
            yield sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetTitle}'!A1`,
                valueInputOption: 'RAW',
                requestBody: { values: [expectedHeaders] },
            });
        }
        try {
            yield ensureSheetFormatting(sheets, spreadsheetId, sheetId, {
                includeDeliveryConditionalFormatting: !hasDeliveryFormatting,
            });
        }
        catch (e) {
            console.warn('Sheets formatting setup failed:', e instanceof Error ? e.message : String(e));
        }
    });
}
function appendOrderToGoogleSheet(order) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
            !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
            !(process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)) {
            warnSheetsEnvMissing();
            return;
        }
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
        const sheetTitle = `Commandes_${createdAt.getFullYear()}_${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        const { sheets, sheetId, hasDeliveryFormatting } = yield ensureSheetTabExists(sheetTitle);
        yield ensureHeaderRow(sheets, spreadsheetId, sheetTitle, sheetId, hasDeliveryFormatting);
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
function updateOrderInGoogleSheet(order) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m;
        if (!process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
            !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
            !(process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY)) {
            warnSheetsEnvMissing();
            return;
        }
        const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
        const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
        const sheetTitle = `Commandes_${createdAt.getFullYear()}_${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
        const { sheets, sheetId, hasDeliveryFormatting } = yield ensureSheetTabExists(sheetTitle);
        yield ensureHeaderRow(sheets, spreadsheetId, sheetTitle, sheetId, hasDeliveryFormatting);
        const colA = yield sheets.spreadsheets.values.get({
            spreadsheetId,
            range: `'${sheetTitle}'!A:A`,
        });
        const values = ((_a = colA.data.values) !== null && _a !== void 0 ? _a : []);
        let rowIndex = -1;
        for (let i = 0; i < values.length; i++) {
            const v = (_b = values[i]) === null || _b === void 0 ? void 0 : _b[0];
            if (String(v) === String(order.id)) {
                rowIndex = i + 1;
                break;
            }
        }
        const items = (_c = order.items) !== null && _c !== void 0 ? _c : [];
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
            (_d = order.customerName) !== null && _d !== void 0 ? _d : '',
            (_e = order.phone) !== null && _e !== void 0 ? _e : '',
            (_f = order.city) !== null && _f !== void 0 ? _f : '',
            (_g = order.address) !== null && _g !== void 0 ? _g : '',
            productsLabel,
            qtyTotal,
            (_h = order.total) !== null && _h !== void 0 ? _h : 0,
            (_j = order.status) !== null && _j !== void 0 ? _j : '',
            deliveryStatus,
            (_k = order.promoCode) !== null && _k !== void 0 ? _k : '',
            (_l = order.discount) !== null && _l !== void 0 ? _l : 0,
            (_m = order.notes) !== null && _m !== void 0 ? _m : '',
            new Date().toISOString(),
        ];
        if (rowIndex === -1) {
            yield sheets.spreadsheets.values.append({
                spreadsheetId,
                range: `'${sheetTitle}'!A1`,
                valueInputOption: 'RAW',
                insertDataOption: 'INSERT_ROWS',
                requestBody: { values: [row] },
            });
        }
        else {
            const endColLetter = 'O';
            yield sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetTitle}'!A${rowIndex}:${endColLetter}${rowIndex}`,
                valueInputOption: 'RAW',
                requestBody: { values: [row] },
            });
        }
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
        try {
            yield updateOrderInGoogleSheet(order);
        }
        catch (e) {
        }
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
