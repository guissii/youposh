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
    // if (didWarnSheetsEnvMissing) return; // Always log for debugging now
    didWarnSheetsEnvMissing = true;
    const status = {
        SPREADSHEET_ID: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        KEY_RAW: !!(process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY),
        KEY_BASE64: !!(process.env.GOOGLE_PRIVATE_KEY_BASE64 || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64)
    };
    console.warn('Google Sheets sync skipped. Environment status:', JSON.stringify(status));
    return status;
}
function loadGooglePrivateKey() {
    const base64 = process.env.GOOGLE_PRIVATE_KEY_BASE64 || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64;
    const raw = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
    let keyContent = '';
    if (base64) {
        // Handle Base64 encoded key
        try {
            keyContent = Buffer.from(String(base64), 'base64').toString('utf8');
        }
        catch (e) {
            console.error('Failed to decode Base64 key:', e);
        }
    }
    else if (raw) {
        keyContent = String(raw);
    }
    if (!keyContent) {
        console.error('loadGooglePrivateKey: No key found in env vars');
        throw new Error('Google Sheets env vars missing (Private Key)');
    }
    // Aggressive cleaning to ensure valid PEM format
    // 1. Remove headers/footers if present to normalize
    const body = keyContent
        .replace(/-----BEGIN PRIVATE KEY-----/g, '')
        .replace(/-----END PRIVATE KEY-----/g, '')
        .replace(/\\n/g, '') // Remove literal escaped newlines
        .replace(/\s+/g, ''); // Remove all whitespace (newlines, spaces)
    // 2. Re-construct canonical PEM
    const chunkSize = 64;
    const chunks = [];
    for (let i = 0; i < body.length; i += chunkSize) {
        chunks.push(body.slice(i, i + chunkSize));
    }
    const validKey = `-----BEGIN PRIVATE KEY-----\n${chunks.join('\n')}\n-----END PRIVATE KEY-----\n`;
    // Debug log (safe)
    console.log(`loadGooglePrivateKey: Key reconstructed. Total length: ${validKey.length}`);
    return validKey;
}
function getDeliveryStatusFromOrderStatus(status) {
    if (status === 'shipped')
        return 'shipped';
    if (status === 'delivered' || status === 'completed')
        return 'delivered';
    return 'not_shipped';
}
function cleanEnvVar(val) {
    if (!val)
        return '';
    return val.replace(/['"]/g, '').trim();
}
function getSheetsClient() {
    return __awaiter(this, void 0, void 0, function* () {
        const spreadsheetId = cleanEnvVar(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
        const clientEmail = cleanEnvVar(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
        const privateKeyRaw = process.env.GOOGLE_PRIVATE_KEY_BASE64 ||
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 ||
            process.env.GOOGLE_PRIVATE_KEY ||
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;
        if (!spreadsheetId || !clientEmail || !privateKeyRaw) {
            throw new Error('Google Sheets env vars missing');
        }
        const privateKey = loadGooglePrivateKey();
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
        'Nom client',
        'Téléphone',
        'Ville',
        'Adresse',
        'Statut livraison',
        'Produits',
        'Total',
        'Statut commande',
        'Quantité totale',
        'ID commande',
        'Date création',
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
            // Updated DataValidation ranges for new column order
            {
                setDataValidation: {
                    range: {
                        sheetId,
                        startRowIndex: 1,
                        endRowIndex,
                        startColumnIndex: 7, // H: Statut commande (index 7)
                        endColumnIndex: 8,
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
                        startColumnIndex: 4, // E: Statut livraison (index 4)
                        endColumnIndex: 5,
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
                startColumnIndex: 4, // E: Statut livraison
                endColumnIndex: 5,
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
            !(process.env.GOOGLE_PRIVATE_KEY ||
                process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
                process.env.GOOGLE_PRIVATE_KEY_BASE64 ||
                process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64)) {
            warnSheetsEnvMissing();
            return;
        }
        const spreadsheetId = cleanEnvVar(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
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
            (_b = order.customerName) !== null && _b !== void 0 ? _b : '',
            (_c = order.phone) !== null && _c !== void 0 ? _c : '',
            (_d = order.city) !== null && _d !== void 0 ? _d : '',
            (_e = order.address) !== null && _e !== void 0 ? _e : '',
            deliveryStatus,
            productsLabel,
            (_f = order.total) !== null && _f !== void 0 ? _f : 0,
            (_g = order.status) !== null && _g !== void 0 ? _g : '',
            qtyTotal,
            order.id,
            createdAt.toISOString(),
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
            !(process.env.GOOGLE_PRIVATE_KEY ||
                process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
                process.env.GOOGLE_PRIVATE_KEY_BASE64 ||
                process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64)) {
            const status = warnSheetsEnvMissing();
            // THROW ERROR HERE instead of silent return, so manual sync can catch it
            throw new Error(`Google Sheets env vars missing: ${JSON.stringify(status)}`);
        }
        const spreadsheetId = cleanEnvVar(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
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
            (_d = order.customerName) !== null && _d !== void 0 ? _d : '',
            (_e = order.phone) !== null && _e !== void 0 ? _e : '',
            (_f = order.city) !== null && _f !== void 0 ? _f : '',
            (_g = order.address) !== null && _g !== void 0 ? _g : '',
            deliveryStatus,
            productsLabel,
            (_h = order.total) !== null && _h !== void 0 ? _h : 0,
            (_j = order.status) !== null && _j !== void 0 ? _j : '',
            qtyTotal,
            order.id,
            createdAt.toISOString(),
            (_k = order.promoCode) !== null && _k !== void 0 ? _k : '',
            (_l = order.discount) !== null && _l !== void 0 ? _l : 0,
            (_m = order.notes) !== null && _m !== void 0 ? _m : '',
            new Date().toISOString(),
        ];
        if (rowIndex === -1) {
            // Strategy: Insert a new empty row at index 1 (row 2), then update it.
            // This ensures the new order is always at the top.
            // 1. Insert empty row at index 1
            yield sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [
                        {
                            insertDimension: {
                                range: {
                                    sheetId,
                                    dimension: 'ROWS',
                                    startIndex: 1,
                                    endIndex: 2,
                                },
                                inheritFromBefore: false,
                            },
                        },
                    ],
                },
            });
            // 2. Update the new row (Row 2) with data
            const endColLetter = 'O';
            yield sheets.spreadsheets.values.update({
                spreadsheetId,
                range: `'${sheetTitle}'!A2:${endColLetter}2`,
                valueInputOption: 'RAW',
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
// GET /api/orders/debug-auth - Diagnose Google Auth issues
router.get('/debug-auth', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = cleanEnvVar(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) || 'MISSING';
        const keyRaw = process.env.GOOGLE_PRIVATE_KEY_BASE64 ||
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 ||
            process.env.GOOGLE_PRIVATE_KEY ||
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
            'MISSING';
        let keyStatus = 'MISSING';
        let keyPreview = 'N/A';
        let reconstructedKey = '';
        if (keyRaw !== 'MISSING') {
            try {
                reconstructedKey = loadGooglePrivateKey();
                keyStatus = 'LOADED_AND_RECONSTRUCTED';
                const lines = reconstructedKey.split('\n');
                keyPreview = `Starts with: ${lines[0]}, Ends with: ${lines[lines.length - 2] || lines[lines.length - 1]}, Total Length: ${reconstructedKey.length}`;
            }
            catch (e) {
                keyStatus = `ERROR_PARSING: ${e instanceof Error ? e.message : String(e)}`;
            }
        }
        const authTest = {
            email,
            keyStatus,
            keyPreview,
            authResult: 'PENDING'
        };
        if (keyStatus === 'LOADED_AND_RECONSTRUCTED') {
            try {
                const auth = new googleapis_1.google.auth.JWT({
                    email,
                    key: reconstructedKey,
                    scopes: SHEETS_SCOPES,
                });
                const token = yield auth.getAccessToken();
                authTest.authResult = `SUCCESS! Token generated.`;
            }
            catch (e) {
                authTest.authResult = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
                // @ts-expect-error - Google Auth error response type is not typed in the library
                if (e.response && e.response.data) {
                    // @ts-expect-error - Google Auth error response type is not typed in the library
                    authTest.apiError = e.response.data;
                }
            }
        }
        res.json(authTest);
    }
    catch (error) {
        res.status(500).json({ error: 'Debug failed', details: error instanceof Error ? error.message : String(error) });
    }
}));
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
            var _a, _b, _c, _d;
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
                if (Number(item.quantity) > 10) {
                    throw new Error(`La quantité maximale par produit est limitée à 10 pièces`);
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
            // Update product stock...
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
                if (!product)
                    continue; // Should not happen
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
                            return Object.assign(Object.assign({}, opt), { stock: Math.max(0, opt.stock - item.quantity) });
                        });
                        return Object.assign(Object.assign({}, v), { options: newOptions });
                    });
                    nextVariants = updated;
                }
                const newStock = Math.max(0, Number((_c = product.stock) !== null && _c !== void 0 ? _c : 0) - Number((_d = item.quantity) !== null && _d !== void 0 ? _d : 0));
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
        // Sync to Google Sheets
        try {
            // Use updateOrderInGoogleSheet instead of appendOrderToGoogleSheet
            // because it's proven to work (used by manual sync) and handles duplicates safely.
            yield updateOrderInGoogleSheet(order);
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
// POST /api/orders/:id/sync - Manually sync an order to Google Sheets
router.post('/:id/sync', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e;
    try {
        const order = yield prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: { include: { product: true } },
            },
        });
        if (!order)
            return res.status(404).json({ error: 'Order not found' });
        try {
            // Force create/update
            yield updateOrderInGoogleSheet(order);
            res.json({ message: 'Order synced to Google Sheets', order });
        }
        catch (e) {
            console.error('Manual sync failed:', e);
            const innerMessage = e instanceof Error ? e.message : String(e);
            const detailedError = ((_b = (_a = e === null || e === void 0 ? void 0 : e.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.error) || ((_d = (_c = e === null || e === void 0 ? void 0 : e.response) === null || _c === void 0 ? void 0 : _c.data) === null || _d === void 0 ? void 0 : _d.error_description) || innerMessage;
            // Add specific invalid_grant hint
            let hint = '';
            if (String(detailedError).includes('invalid_grant')) {
                hint = ' (Check system time or key validity)';
            }
            // Return full error details to client in the 'error' field so apiFetch picks it up
            res.status(500).json({
                error: `Sync failed: ${detailedError}${hint}`,
                message: innerMessage,
                details: ((_e = e === null || e === void 0 ? void 0 : e.response) === null || _e === void 0 ? void 0 : _e.data) || (e === null || e === void 0 ? void 0 : e.stack)
            });
        }
    }
    catch (error) {
        console.error('Error syncing order:', error);
        res.status(500).json({ error: 'Failed to sync order' });
    }
}));
exports.default = router;
