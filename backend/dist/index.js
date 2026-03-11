"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const products_1 = __importDefault(require("./routes/products"));
const orders_1 = __importDefault(require("./routes/orders"));
const categories_1 = __importDefault(require("./routes/categories"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const promoCodes_1 = __importDefault(require("./routes/promoCodes"));
const upload_1 = __importDefault(require("./routes/upload"));
const settings_1 = __importDefault(require("./routes/settings"));
const attributeLibrary_1 = __importDefault(require("./routes/attributeLibrary"));
const path_1 = __importDefault(require("path"));
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
// Serve static files from the uploads directory
app.use('/uploads', express_1.default.static(path_1.default.join(__dirname, '../uploads')));
// Mount routes
app.use('/api/products', products_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/categories', categories_1.default);
app.use('/api/attribute-library', attributeLibrary_1.default);
app.use('/api/dashboard', dashboard_1.default);
app.use('/api/promo-codes', promoCodes_1.default);
app.use('/api/upload', upload_1.default);
app.use('/api/settings', settings_1.default);
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
