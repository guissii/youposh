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
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
// ─── Initialize Supabase Client ──────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase credentials missing. Uploads will fail.');
}
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
    }
});
// ─── Multer config (Memory Storage) ─────────────────────────────
const storage = multer_1.default.memoryStorage();
const imageFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'));
    }
};
const upload = (0, multer_1.default)({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });
// Generic upload function to Supabase
function uploadToSupabase(file, folder) {
    return __awaiter(this, void 0, void 0, function* () {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        const filename = `${folder}/${folder.slice(0, -1)}-${uniqueSuffix}${ext}`;
        const { data, error } = yield supabase
            .storage
            .from('uploads')
            .upload(filename, file.buffer, {
            contentType: file.mimetype,
            upsert: false
        });
        if (error) {
            throw error;
        }
        const { data: publicUrlData } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(filename);
        return publicUrlData.publicUrl;
    });
}
// ─── POST /upload/category ──────────────────────────────────────
router.post('/category', upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        const publicUrl = yield uploadToSupabase(req.file, 'categories');
        res.json({ url: publicUrl });
    }
    catch (error) {
        console.error('Error uploading category image to Supabase:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
}));
// ─── POST /upload/product ───────────────────────────────────────
router.post('/product', upload.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        const publicUrl = yield uploadToSupabase(req.file, 'products');
        res.json({ url: publicUrl });
    }
    catch (error) {
        console.error('Error uploading product image to Supabase:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
}));
exports.default = router;
