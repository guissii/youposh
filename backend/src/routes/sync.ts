import { Router } from 'express';
import multer from 'multer';
import { google } from 'googleapis';
import XLSX from 'xlsx';

const router = Router();

const SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

function loadGooglePrivateKey(): string {
  const base64 =
    process.env.GOOGLE_PRIVATE_KEY_BASE64 ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64;

  const raw =
    process.env.GOOGLE_PRIVATE_KEY ||
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

  let key: string | undefined;
  if (base64) {
    key = Buffer.from(String(base64), 'base64').toString('utf8');
  } else if (raw) {
    key = String(raw);
  }

  if (!key) {
    throw new Error(
      'Missing env: GOOGLE_PRIVATE_KEY / GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY (or *_BASE64)'
    );
  }

  return String(key)
    .replace(/^\s*["']|["']\s*$/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\\\\n/g, '\n')
    .replace(/\\n/g, '\n')
    .trim();
}

function getEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

async function getSheetsClient() {
  const spreadsheetId = getEnv('GOOGLE_SHEETS_SPREADSHEET_ID');
  const clientEmail = getEnv('GOOGLE_SERVICE_ACCOUNT_EMAIL');
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
    fields: 'sheets.properties.title',
  });
  const exists = (meta.data.sheets ?? []).some(s => s.properties?.title === sheetTitle);
  if (!exists) {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests: [{ addSheet: { properties: { title: sheetTitle } } }] },
    });
  }
  return { sheets, spreadsheetId };
}

async function clearSheet(sheets: any, spreadsheetId: string, sheetTitle: string) {
  await sheets.spreadsheets.values.clear({
    spreadsheetId,
    range: `'${sheetTitle}'!A:ZZZ`,
  });
}

async function writeMatrixToSheet(sheetTitle: string, matrix: any[][], overwrite = true) {
  const { sheets, spreadsheetId } = await ensureSheetTabExists(sheetTitle);
  if (overwrite) {
    await clearSheet(sheets, spreadsheetId, sheetTitle);
  }
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `'${sheetTitle}'!A1`,
    valueInputOption: 'RAW',
    requestBody: { values: matrix },
  });
}

const upload = multer({ storage: multer.memoryStorage() });

// POST /api/sync/excel-to-sheet
// Body: multipart/form-data with `file` (.xlsx), optional query `sheetTitle`, `overwrite=true|false`
router.post('/excel-to-sheet', upload.single('file'), async (req, res) => {
  try {
    const buf = req.file?.buffer;
    if (!buf) return res.status(400).json({ error: 'Fichier Excel manquant' });

    const sheetTitle = typeof req.query.sheetTitle === 'string' && req.query.sheetTitle.trim()
      ? String(req.query.sheetTitle).trim()
      : 'ExcelSync';
    const overwrite = String(req.query.overwrite ?? 'true').toLowerCase() !== 'false';

    const wb = XLSX.read(buf, { type: 'buffer' });
    const firstSheetName = wb.SheetNames[0];
    if (!firstSheetName) return res.status(400).json({ error: 'Aucune feuille trouvée dans le fichier Excel' });
    const ws = wb.Sheets[firstSheetName];

    const matrix: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false });
    if (!Array.isArray(matrix) || matrix.length === 0) {
      return res.status(400).json({ error: 'Feuille Excel vide' });
    }

    await writeMatrixToSheet(sheetTitle, matrix, overwrite);
    res.json({ ok: true, sheetTitle, rows: matrix.length, cols: Math.max(...matrix.map(r => r.length)) });
  } catch (error) {
    console.error('excel-to-sheet error:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: message });
  }
});

// GET /api/sync/sheet-to-excel?sheetTitle=...
// Returns an .xlsx file of the given sheet tab
router.get('/sheet-to-excel', async (req, res) => {
  try {
    const sheetTitle = typeof req.query.sheetTitle === 'string' && req.query.sheetTitle.trim()
      ? String(req.query.sheetTitle).trim()
      : 'ExcelSync';
    const { sheets, spreadsheetId } = await getSheetsClient();
    const resp = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `'${sheetTitle}'!A:ZZZ`,
    });
    const values: any[][] = (resp.data.values ?? []) as any[][];
    const ws = XLSX.utils.aoa_to_sheet(values);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle);
    const out = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${sheetTitle}.xlsx"`);
    res.send(out);
  } catch (error) {
    console.error('sheet-to-excel error:', error);
    const message = error instanceof Error ? error.message : 'Erreur inconnue';
    res.status(500).json({ error: message });
  }
});

// GET /api/sync/sheets-health
// Quick health check to confirm the server can read/write the configured Google Sheet.
router.get('/sheets-health', async (_req, res) => {
  try {
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKeyRaw =
      process.env.GOOGLE_PRIVATE_KEY_BASE64 ||
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 ||
      process.env.GOOGLE_PRIVATE_KEY ||
      process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

    if (!spreadsheetId || !clientEmail || !privateKeyRaw) {
      return res.status(400).json({
        ok: false,
        error: 'Missing Google Sheets env vars',
        env: {
          hasSpreadsheetId: Boolean(spreadsheetId),
          hasClientEmail: Boolean(clientEmail),
          hasPrivateKey: Boolean(privateKeyRaw),
          hasPrivateKeyBase64: Boolean(
            process.env.GOOGLE_PRIVATE_KEY_BASE64 || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64
          ),
        },
      });
    }

    const { sheets } = await getSheetsClient();
    const meta = await sheets.spreadsheets.get({
      spreadsheetId,
      fields: 'properties.title,sheets.properties.title',
    });

    const testSheetTitle = 'test';
    await ensureSheetTabExists(testSheetTitle);
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: `'${testSheetTitle}'!A1`,
      valueInputOption: 'RAW',
      requestBody: { values: [[`ok ${new Date().toISOString()}`]] },
    });

    return res.json({
      ok: true,
      spreadsheetId,
      spreadsheetTitle: meta.data.properties?.title ?? null,
      tabs: (meta.data.sheets ?? []).map(s => s.properties?.title).filter(Boolean),
      writeTest: { sheet: testSheetTitle, cell: 'A1' },
      env: {
        hasPrivateKeyBase64: Boolean(
          process.env.GOOGLE_PRIVATE_KEY_BASE64 || process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64
        ),
        privateKeyLooksLikePem: String(loadGooglePrivateKey()).includes('BEGIN PRIVATE KEY'),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('sheets-health error:', message);
    return res.status(500).json({ ok: false, error: message });
  }
});

export default router;
