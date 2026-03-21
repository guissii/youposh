"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const helmet_1 = __importDefault(require("helmet"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
dotenv_1.default.config();
const prisma = new client_1.PrismaClient();
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const categories_1 = __importDefault(require("./routes/categories"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const promoCodes_1 = __importDefault(require("./routes/promoCodes"));
const upload_1 = __importDefault(require("./routes/upload"));
const settings_1 = __importDefault(require("./routes/settings"));
const attributeLibrary_1 = __importDefault(require("./routes/attributeLibrary"));
const auth_1 = __importDefault(require("./routes/auth"));
const sync_1 = __importDefault(require("./routes/sync"));
const tracking_1 = __importDefault(require("./routes/tracking"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const trustProxyHops = Number(process.env.TRUST_PROXY_HOPS || '1');
app.set('trust proxy', Number.isFinite(trustProxyHops) && trustProxyHops > 0 ? trustProxyHops : 1);
// Security Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: false, // Allow cross-origin if needed for images
    crossOriginOpenerPolicy: false
}));
// Rate Limiting
const limiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // Limit each IP to 200 requests per windowMs
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Trop de requêtes, veuillez réessayer plus tard.' }
});
// Apply rate limiter to all /api routes
app.use('/api', limiter);
app.use((0, compression_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Debug Env Route (Temporary)
app.get('/api/debug-env', (_req, res) => {
    const vars = {
        GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Present' : 'Missing',
        GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Present' : 'Missing',
        GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'Present (Raw)' : 'Missing',
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'Present (Service)' : 'Missing',
        GOOGLE_PRIVATE_KEY_BASE64: process.env.GOOGLE_PRIVATE_KEY_BASE64 ? 'Present (Base64)' : 'Missing',
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 ? 'Present (Service Base64)' : 'Missing',
        NODE_ENV: process.env.NODE_ENV,
    };
    res.json(vars);
});
const uploadsDir = process.env.UPLOADS_DIR || path_1.default.resolve(process.cwd(), 'uploads');
if (!fs_1.default.existsSync(uploadsDir)) {
    try {
        fs_1.default.mkdirSync(uploadsDir, { recursive: true });
    }
    catch (_a) { }
}
app.use('/uploads', express_1.default.static(uploadsDir, { maxAge: '7d', immutable: true }));
// Mount routes
app.use('/api/auth', auth_1.default);
app.use('/api/products', products_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/attribute-library', attributeLibrary_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/promo-codes', promoCodes_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/settings', settings_1.default);
app.use('/api/sync', sync_1.default);
app.use('/api/track', tracking_1.default);
// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Version: ${new Date().toISOString()} - API boot OK`);
    });
}
exports.default = app;
