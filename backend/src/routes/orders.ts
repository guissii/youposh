import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { google } from 'googleapis';

const router = Router();
const prisma = new PrismaClient();

type OrderForSheet = {
    id: string;
    createdAt: Date;
    customerName: string;
    phone: string;
    city: string | null;
    address: string | null;
    total: number;
    status: string;
    notes?: string | null;
    promoCode?: string | null;
    discount?: number | null;
    items?: Array<{
        quantity: number;
        price: number;
        productId: number;
        product?: { name?: string | null; sku?: string | null } | null;
    }>;
};

const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
let didWarnSheetsEnvMissing = false;

function warnSheetsEnvMissing() {
    if (didWarnSheetsEnvMissing) return;
    didWarnSheetsEnvMissing = true;
    console.warn(
        'Google Sheets sync skipped: missing env vars (GOOGLE_SHEETS_SPREADSHEET_ID, GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY or *_BASE64)'
    );
}

function loadGooglePrivateKey(): string {
    const base64 = process.env.GOOGLE_PRIVATE_KEY_BASE64 || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64;
    const raw = process.env.GOOGLE_PRIVATE_KEY || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    let keyContent = '';

    if (base64) {
        // Handle Base64 encoded key
        try {
            keyContent = Buffer.from(String(base64), 'base64').toString('utf8');
        } catch (e) {
            console.error('Failed to decode Base64 key:', e);
        }
    } else if (raw) {
        keyContent = String(raw);
    }

    if (!keyContent) {
        console.error('loadGooglePrivateKey: No key found in env vars');
        throw new Error('Google Sheets env vars missing (Private Key)');
    }

    // Aggressive cleaning to ensure valid PEM format
    // 1. Remove headers/footers if present to normalize
    let body = keyContent
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

function getDeliveryStatusFromOrderStatus(status: string) {
    if (status === 'shipped') return 'shipped';
    if (status === 'delivered' || status === 'completed') return 'delivered';
    return 'not_shipped';
}

function cleanEnvVar(val: string | undefined) {
    if (!val) return '';
    return val.replace(/['"]/g, '').trim();
}

async function getSheetsClient() {
    const spreadsheetId = cleanEnvVar(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
    const clientEmail = cleanEnvVar(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    const privateKeyRaw =
        process.env.GOOGLE_PRIVATE_KEY_BASE64 ||
        process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 ||
        process.env.GOOGLE_PRIVATE_KEY ||
        process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!spreadsheetId || !clientEmail || !privateKeyRaw) {
        throw new Error('Google Sheets env vars missing');
    }

    const privateKey = loadGooglePrivateKey();
    const auth = new google.auth.JWT({
        email: clientEmail,
        key: privateKey,
        scopes: SHEETS_SCOPES,
    });

    const sheets = google.sheets({ version: 'v4', auth });
    return { sheets, spreadsheetId };
}

async function ensureSheetTabExists(sheetTitle: string) {
    const { sheets, spreadsheetId } = await getSheetsClient();
    const meta = await sheets.spreadsheets.get({
        spreadsheetId,
        fields: 'sheets.properties.title,sheets.properties.sheetId,developerMetadata(metadataKey,location)',
    });

    const existingSheet = (meta.data.sheets ?? []).find(s => s.properties?.title === sheetTitle);
    if (existingSheet?.properties?.sheetId != null) {
        const sheetId = existingSheet.properties.sheetId;
        const hasDeliveryFormatting = (meta.data.developerMetadata ?? []).some((md: any) => {
            return md?.metadataKey === 'YOUPOSH_DELIVERY_V1' && md?.location?.sheetId === sheetId;
        });
        return { sheets, spreadsheetId, sheetId, hasDeliveryFormatting };
    }

    const created = await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: sheetTitle } } }] },
    });

    const createdSheetId = created.data.replies?.[0]?.addSheet?.properties?.sheetId;
    if (createdSheetId == null) {
        throw new Error(`Failed to create sheet tab "${sheetTitle}" (missing sheetId)`);
    }

    return { sheets, spreadsheetId, sheetId: createdSheetId, hasDeliveryFormatting: false };
}

function getExpectedSheetHeaders(): string[] {
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

async function ensureSheetFormatting(
    sheets: any,
    spreadsheetId: string,
    sheetId: number,
    options?: { includeDeliveryConditionalFormatting?: boolean }
) {
    const endRowIndex = 5000;
    const endColumnIndex = 15;

    const orderStatusValues = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];
    const deliveryStatusValues = ['not_shipped', 'shipped', 'delivered'];

    const includeDeliveryConditionalFormatting = options?.includeDeliveryConditionalFormatting !== false;

    const requests: any[] = [
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

        requests.push(
            {
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
            },
            {
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
            },
            {
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
            },
            {
                createDeveloperMetadata: {
                    developerMetadata: {
                        metadataKey: 'YOUPOSH_DELIVERY_V1',
                        metadataValue: '1',
                        visibility: 'DOCUMENT',
                        location: { sheetId },
                    },
                },
            }
        );
    }

    await sheets.spreadsheets.batchUpdate({
        spreadsheetId,
        requestBody: {
            requests,
        },
    });
}

async function ensureHeaderRow(
    sheets: any,
    spreadsheetId: string,
    sheetTitle: string,
    sheetId: number,
    hasDeliveryFormatting: boolean
) {
    const expectedHeaders = getExpectedSheetHeaders();
    const headerRange = `'${sheetTitle}'!A1:O1`;
    const existing = await sheets.spreadsheets.values.get({ spreadsheetId, range: headerRange });

    const currentHeaders = (existing.data.values?.[0] ?? []) as string[];
    const needsUpdate =
        currentHeaders.length < expectedHeaders.length ||
        expectedHeaders.some((h, idx) => String(currentHeaders[idx] ?? '').trim() !== h);

    if (needsUpdate) {
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetTitle}'!A1`,
            valueInputOption: 'RAW',
            requestBody: { values: [expectedHeaders] },
        });
    }

    try {
        await ensureSheetFormatting(sheets, spreadsheetId, sheetId, {
            includeDeliveryConditionalFormatting: !hasDeliveryFormatting,
        });
    } catch (e) {
        console.warn('Sheets formatting setup failed:', e instanceof Error ? e.message : String(e));
    }
}

async function appendOrderToGoogleSheet(order: OrderForSheet) {
    if (
        !process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
        !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !(
            process.env.GOOGLE_PRIVATE_KEY ||
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
            process.env.GOOGLE_PRIVATE_KEY_BASE64 ||
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64
        )
    ) {
        warnSheetsEnvMissing();
        return;
    }
    const spreadsheetId = cleanEnvVar(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);

    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const sheetTitle = `Commandes_${createdAt.getFullYear()}_${String(createdAt.getMonth() + 1).padStart(2, '0')}`;

    const { sheets, sheetId, hasDeliveryFormatting } = await ensureSheetTabExists(sheetTitle);
    await ensureHeaderRow(sheets, spreadsheetId, sheetTitle, sheetId, hasDeliveryFormatting);

    const items = order.items ?? [];
    const productsLabel = items
        .map(it => {
            const name = it.product?.name || `#${it.productId}`;
            return `${it.quantity}x ${name}`;
        })
        .join(', ');
    const qtyTotal = items.reduce((sum, it) => sum + Number(it.quantity ?? 0), 0);

    const deliveryStatus = getDeliveryStatusFromOrderStatus(order.status);

    const row = [
        order.id,
        createdAt.toISOString(),
        order.customerName ?? '',
        order.phone ?? '',
        order.city ?? '',
        order.address ?? '',
        productsLabel,
        qtyTotal,
        order.total ?? 0,
        order.status ?? '',
        deliveryStatus,
        order.promoCode ?? '',
        order.discount ?? 0,
        order.notes ?? '',
        new Date().toISOString(),
    ];

    await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: `'${sheetTitle}'!A1`,
        valueInputOption: 'RAW',
        insertDataOption: 'INSERT_ROWS',
        requestBody: { values: [row] },
    });
}

async function updateOrderInGoogleSheet(order: OrderForSheet) {
    if (
        !process.env.GOOGLE_SHEETS_SPREADSHEET_ID ||
        !process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
        !(
            process.env.GOOGLE_PRIVATE_KEY ||
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
            process.env.GOOGLE_PRIVATE_KEY_BASE64 ||
            process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64
        )
    ) {
        warnSheetsEnvMissing();
        // THROW ERROR HERE instead of silent return, so manual sync can catch it
        throw new Error('Google Sheets env vars missing (ID, Email, or Private Key)');
    }
    const spreadsheetId = cleanEnvVar(process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
    const createdAt = order.createdAt ? new Date(order.createdAt) : new Date();
    const sheetTitle = `Commandes_${createdAt.getFullYear()}_${String(createdAt.getMonth() + 1).padStart(2, '0')}`;
    const { sheets, sheetId, hasDeliveryFormatting } = await ensureSheetTabExists(sheetTitle);
    await ensureHeaderRow(sheets, spreadsheetId, sheetTitle, sheetId, hasDeliveryFormatting);
    const colA = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: `'${sheetTitle}'!A:A`,
    });
    const values = (colA.data.values ?? []) as any[][];
    let rowIndex = -1;
    for (let i = 0; i < values.length; i++) {
        const v = values[i]?.[0];
        if (String(v) === String(order.id)) {
            rowIndex = i + 1;
            break;
        }
    }
    const items = order.items ?? [];
    const productsLabel = items
        .map(it => {
            const name = it.product?.name || `#${it.productId}`;
            return `${it.quantity}x ${name}`;
        })
        .join(', ');
    const qtyTotal = items.reduce((sum, it) => sum + Number(it.quantity ?? 0), 0);
    const deliveryStatus = getDeliveryStatusFromOrderStatus(order.status);
    const row = [
        order.id,
        createdAt.toISOString(),
        order.customerName ?? '',
        order.phone ?? '',
        order.city ?? '',
        order.address ?? '',
        productsLabel,
        qtyTotal,
        order.total ?? 0,
        order.status ?? '',
        deliveryStatus,
        order.promoCode ?? '',
        order.discount ?? 0,
        order.notes ?? '',
        new Date().toISOString(),
    ];
    if (rowIndex === -1) {
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `'${sheetTitle}'!A1`,
            valueInputOption: 'RAW',
            insertDataOption: 'INSERT_ROWS',
            requestBody: { values: [row] },
        });
    } else {
        const endColLetter = 'O';
        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `'${sheetTitle}'!A${rowIndex}:${endColLetter}${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: { values: [row] },
        });
    }
}
function parseVariantSelection(label: any): Record<string, string> {
    if (typeof label !== 'string') return {};
    const parts = label.split('/').map(p => p.trim()).filter(Boolean);
    const out: Record<string, string> = {};
    for (const part of parts) {
        const idx = part.indexOf(':');
        if (idx === -1) continue;
        const key = part.slice(0, idx).trim();
        const value = part.slice(idx + 1).trim();
        if (key && value) out[key] = value;
    }
    return out;
}

// GET /api/orders/debug-auth - Diagnose Google Auth issues
router.get('/debug-auth', async (req, res) => {
    try {
        const email = cleanEnvVar(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) || 'MISSING';
        const keyRaw = 
            process.env.GOOGLE_PRIVATE_KEY_BASE64 ||
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
            } catch (e) {
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
                const auth = new google.auth.JWT({
                    email,
                    key: reconstructedKey,
                    scopes: SHEETS_SCOPES,
                });
                const token = await auth.getAccessToken();
                authTest.authResult = `SUCCESS! Token generated.`;
            } catch (e) {
                authTest.authResult = `FAILED: ${e instanceof Error ? e.message : String(e)}`;
                // @ts-ignore
                if (e.response && e.response.data) {
                    // @ts-ignore
                    authTest.apiError = e.response.data;
                }
            }
        }

        res.json(authTest);

    } catch (error) {
        res.status(500).json({ error: 'Debug failed', details: error instanceof Error ? error.message : String(error) });
    }
});

// GET all orders with optional status filter
router.get('/', async (req, res) => {
    try {
        const { status, search } = req.query;

        const where: any = {};
        if (status === 'delivered' || status === 'completed') {
            where.status = { in: ['delivered', 'completed'] };
        } else if (status) {
            where.status = status;
        }
        if (search) {
            where.OR = [
                { customerName: { contains: search as string, mode: 'insensitive' } },
                { phone: { contains: search as string, mode: 'insensitive' } },
                { id: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const orders = await prisma.order.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                items: {
                    include: { product: true }
                },
            },
        });
        res.json(orders);
    } catch (error) {
        console.error('Error fetching orders:', error);
        res.status(500).json({ error: 'Failed to fetch orders' });
    }
});

// GET single order
router.get('/:id', async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: { include: { product: true } },
            },
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });
        res.json(order);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch order' });
    }
});

// POST create order
router.post('/', async (req, res) => {
    try {
        const { customerName, phone, city, address, notes, items, promoCode: promoCodeRaw } = req.body;

        const promoCode = typeof promoCodeRaw === 'string' ? promoCodeRaw.trim() : '';
        const normalizedItems = Array.isArray(items)
            ? items
                .map((it: any) => ({
                    productId: Number(it?.productId),
                    quantity: Number(it?.quantity),
                    variant: typeof it?.variant === 'string' ? it.variant : undefined,
                }))
                .filter((it: any) => Number.isFinite(it.productId) && Number.isFinite(it.quantity) && it.quantity > 0)
            : [];

        if (!normalizedItems.length) {
            return res.status(400).json({ error: 'Panier vide' });
        }

        const extraNotes = (items ?? [])
            .map((item: any) => (typeof item?.variant === 'string' && item.variant.trim() ? `Produit ${item.productId}: ${item.variant.trim()}` : null))
            .filter(Boolean)
            .join('\n');

        const finalNotes = [notes, extraNotes].filter((s: any) => typeof s === 'string' && s.trim()).join('\n');

        const order = await prisma.$transaction(async (tx) => {
            const productIds = [...new Set(normalizedItems.map((it: any) => it.productId))];
            const products = await tx.product.findMany({
                where: { id: { in: productIds } },
                select: { id: true, price: true, stock: true, inStock: true, variants: true },
            });
            const productById = new Map<number, { id: number; price: number; stock: number; inStock: boolean; variants: any }>(
                products.map((p: any) => [p.id, p])
            );

            let subtotal = 0;
            for (const item of normalizedItems) {
                const product = productById.get(item.productId);
                if (!product) {
                    throw new Error(`Product not found: ${item.productId}`);
                }
                if (product.inStock === false) {
                    throw new Error(`Produit en rupture de stock: ${item.productId}`);
                }
                if (Number(product.stock ?? 0) < Number(item.quantity ?? 0)) {
                    throw new Error(`Out of stock: ${item.productId}`);
                }
                subtotal += Number(product.price) * Number(item.quantity);
            }

            let appliedPromo: any = null;
            let discount = 0;
            if (promoCode) {
                const promo = await tx.promoCode.findUnique({ where: { code: promoCode } });
                if (!promo) throw new Error('Code promo invalide');
                if (!promo.isActive) throw new Error('Code promo expiré');
                if (promo.startDate && new Date(promo.startDate) > new Date()) throw new Error('Code promo pas encore actif');
                if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) throw new Error('Code promo épuisé');
                if (promo.endDate && new Date(promo.endDate) < new Date()) throw new Error('Code promo expiré');
                if (promo.minOrder > 0 && subtotal < promo.minOrder) throw new Error(`Commande minimum: ${promo.minOrder} MAD`);

                const rawDiscount = promo.discountType === 'percentage'
                    ? (subtotal * promo.discountValue) / 100
                    : promo.discountValue;
                discount = Math.max(0, Math.min(subtotal, rawDiscount));
                appliedPromo = promo;
            }

            const totalAfterDiscount = Math.max(0, subtotal - discount);

        const created = await tx.order.create({
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
                        create: normalizedItems.map((item: any) => {
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
                const product = await tx.product.findUnique({
                    where: { id: item.productId },
                    select: {
                        id: true,
                        stock: true,
                        inStock: true,
                        variants: true,
                    },
                });

                if (!product) continue; // Should not happen

                const selection = parseVariantSelection(item?.variant);
                let nextVariants: any = product.variants;

                if (selection && product.variants && Array.isArray(product.variants)) {
                    const updated = product.variants.map((v: any) => {
                        const selectedValue = selection?.[v?.name];
                        if (!selectedValue || !Array.isArray(v?.options)) return v;

                        const newOptions = v.options.map((opt: any) => {
                            if (!opt || typeof opt !== 'object') return opt;
                            if (typeof opt.value !== 'string') return opt;
                            if (opt.value !== selectedValue) return opt;
                            if (typeof opt.stock !== 'number') return opt;
                            return { ...opt, stock: Math.max(0, opt.stock - item.quantity) };
                        });

                        return { ...v, options: newOptions };
                    });
                    nextVariants = updated;
                }

                const newStock = Math.max(0, Number(product.stock ?? 0) - Number(item.quantity ?? 0));

                await tx.product.update({
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
                await tx.promoCode.update({
                    where: { id: appliedPromo.id },
                    data: { usedCount: { increment: 1 } },
                });
            }

            return created;
        });

        // Sync to Google Sheets
        try {
            await appendOrderToGoogleSheet(order as unknown as OrderForSheet);
        } catch (e) {
            console.warn('Sheets sync failed:', e instanceof Error ? e.message : String(e));
        }

        res.status(201).json(order);
    } catch (error) {
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
});

// PUT update order status
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled'];

        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const order = await prisma.order.update({
            where: { id: req.params.id },
            data: { status },
            include: {
                items: { include: { product: true } },
            },
        });
        try {
            await updateOrderInGoogleSheet(order as unknown as OrderForSheet);
        } catch (e) {
        }
        res.json(order);
    } catch (error) {
        console.error('Error updating order status:', error);
        res.status(500).json({ error: 'Failed to update order status' });
    }
});

// DELETE order
router.delete('/:id', async (req, res) => {
    try {
        await prisma.order.delete({
            where: { id: req.params.id },
        });
        res.json({ message: 'Order deleted' });
    } catch (error) {
        console.error('Error deleting order:', error);
        res.status(500).json({ error: 'Failed to delete order' });
    }
});

// POST /api/orders/:id/sync - Manually sync an order to Google Sheets
router.post('/:id/sync', async (req, res) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: {
                items: { include: { product: true } },
            },
        });
        if (!order) return res.status(404).json({ error: 'Order not found' });

        try {
            // Force create/update
            await updateOrderInGoogleSheet(order as unknown as OrderForSheet);
            res.json({ message: 'Order synced to Google Sheets', order });
        } catch (e: any) {
            console.error('Manual sync failed:', e);
            
            const innerMessage = e instanceof Error ? e.message : String(e);
            const detailedError = e?.response?.data?.error || e?.response?.data?.error_description || innerMessage;
            
            // Add specific invalid_grant hint
            let hint = '';
            if (String(detailedError).includes('invalid_grant')) {
                hint = ' (Check system time or key validity)';
            }

            // Return full error details to client in the 'error' field so apiFetch picks it up
            res.status(500).json({ 
                error: `Sync failed: ${detailedError}${hint}`,
                message: innerMessage,
                details: e?.response?.data || e?.stack
            });
        }
    } catch (error) {
        console.error('Error syncing order:', error);
        res.status(500).json({ error: 'Failed to sync order' });
    }
});

export default router;
