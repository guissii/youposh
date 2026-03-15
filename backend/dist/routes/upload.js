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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
const util_1 = require("util");
dotenv_1.default.config();
const router = (0, express_1.Router)();
const driver = (process.env.UPLOADS_DRIVER || 'local').toLowerCase();
const ensureDir = (p) => {
    if (!fs_1.default.existsSync(p)) {
        fs_1.default.mkdirSync(p, { recursive: true });
    }
};
const baseUploadsDir = process.env.UPLOADS_DIR || path_1.default.resolve(process.cwd(), 'uploads');
ensureDir(baseUploadsDir);
ensureDir(path_1.default.join(baseUploadsDir, 'products'));
ensureDir(path_1.default.join(baseUploadsDir, 'categories'));
ensureDir(path_1.default.join(baseUploadsDir, 'videos'));
const filenameSafe = (name) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
const uniqueName = (original) => {
    const base = filenameSafe(original);
    const id = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    const ext = path_1.default.extname(base);
    const stem = path_1.default.basename(base, ext);
    return `${stem}-${id}${ext}`;
};
const getPublicBase = (req) => {
    const h = req.get('x-forwarded-host') || req.get('host') || '';
    const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
    if (!h)
        return '';
    return `${proto}://${h}`;
};
const diskStorageFactory = (folder) => multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dest = path_1.default.join(baseUploadsDir, folder);
        ensureDir(dest);
        cb(null, dest);
    },
    filename: (_req, file, cb) => {
        cb(null, uniqueName(file.originalname));
    }
});
const imageFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/'))
        cb(null, true);
    else
        cb(new Error('Only image files are allowed'));
};
const videoFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('video/'))
        cb(null, true);
    else
        cb(new Error('Only video files are allowed'));
};
const uploadImageToDisk = (0, multer_1.default)({
    storage: diskStorageFactory('products'),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFilter
});
const uploadCategoryImageToDisk = (0, multer_1.default)({
    storage: diskStorageFactory('categories'),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFilter
});
const uploadVideoToDisk = (0, multer_1.default)({
    storage: diskStorageFactory('videos'),
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: videoFilter
});
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseServiceKey
    ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        global: { headers: { Authorization: `Bearer ${supabaseServiceKey}` } }
    })
    : null;
const uploadToSupabase = (file, folder) => __awaiter(void 0, void 0, void 0, function* () {
    if (!supabase)
        throw new Error('Supabase not configured');
    const originalName = filenameSafe(file.originalname);
    const filename = uniqueName(originalName);
    const { error } = yield supabase.storage.from('uploads').upload(`${folder}/${filename}`, file.buffer, {
        contentType: file.mimetype,
        upsert: true
    });
    if (error)
        throw error;
    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(`${folder}/${filename}`);
    return publicUrlData.publicUrl;
});
router.post('/category', (req, res, next) => {
    if (driver === 'supabase') {
        const mem = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: imageFilter });
        return mem.single('image')(req, res, next);
    }
    else {
        return (uploadCategoryImageToDisk.single('image'))(req, res, next);
    }
}, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const f = req.file;
        if (!f)
            return res.status(400).json({ error: 'No image uploaded' });
        if (driver === 'supabase') {
            const url = yield uploadToSupabase(f, 'categories');
            return res.json({ url });
        }
        else {
            const base = getPublicBase(req);
            const url = `${base}/uploads/categories/${path_1.default.basename(f.path)}`;
            return res.json({ url });
        }
    }
    catch (e) {
        return res.status(500).json({ error: e.message || 'Failed to upload image' });
    }
}));
router.post('/product', (req, res, next) => {
    if (driver === 'supabase') {
        const mem = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: imageFilter });
        return mem.single('image')(req, res, next);
    }
    else {
        return (uploadImageToDisk.single('image'))(req, res, next);
    }
}, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const f = req.file;
        if (!f)
            return res.status(400).json({ error: 'No image uploaded' });
        if (driver === 'supabase') {
            const url = yield uploadToSupabase(f, 'products');
            return res.json({ url });
        }
        else {
            const base = getPublicBase(req);
            const url = `${base}/uploads/products/${path_1.default.basename(f.path)}`;
            return res.json({ url });
        }
    }
    catch (e) {
        return res.status(500).json({ error: e.message || 'Failed to upload image' });
    }
}));
router.post('/video', (req, res, next) => {
    if (driver === 'supabase') {
        const mem = (0, multer_1.default)({ storage: multer_1.default.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 }, fileFilter: videoFilter });
        return mem.single('video')(req, res, next);
    }
    else {
        return (uploadVideoToDisk.single('video'))(req, res, next);
    }
}, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const f = req.file;
        if (!f)
            return res.status(400).json({ error: 'No video uploaded' });
        if (driver === 'supabase') {
            const url = yield uploadToSupabase(f, 'videos');
            return res.json({ url });
        }
        else {
            const base = getPublicBase(req);
            const url = `${base}/uploads/videos/${path_1.default.basename(f.path)}`;
            return res.json({ url });
        }
    }
    catch (e) {
        return res.status(500).json({ error: e.message || 'Failed to upload video' });
    }
}));
router.post('/delete', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const url = (_a = req.body) === null || _a === void 0 ? void 0 : _a.url;
        if (!url)
            return res.status(400).json({ error: 'Missing url' });
        if (driver === 'supabase') {
            const u = new URL(url);
            const parts = u.pathname.split('/').slice(-2).join('/');
            const { error } = yield supabase.storage.from('uploads').remove([parts]);
            if (error)
                return res.status(500).json({ error: error.message || 'Failed to delete' });
            return res.json({ ok: true });
        }
        else {
            const u = new URL(url, getPublicBase(req) || 'http://localhost');
            if (!u.pathname.startsWith('/uploads/'))
                return res.status(400).json({ error: 'Invalid path' });
            const localPath = path_1.default.join(baseUploadsDir, u.pathname.replace('/uploads/', ''));
            if (!localPath.startsWith(baseUploadsDir))
                return res.status(400).json({ error: 'Invalid path' });
            try {
                yield (0, util_1.promisify)(fs_1.default.unlink)(localPath);
            }
            catch (_b) {
            }
            return res.json({ ok: true });
        }
    }
    catch (e) {
        return res.status(500).json({ error: e.message || 'Failed to delete file' });
    }
}));
exports.default = router;
