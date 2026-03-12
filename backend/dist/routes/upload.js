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
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const router = (0, express_1.Router)();
// ─── Initialize Supabase Client ──────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
// FORCE USE OF SERVICE ROLE KEY FOR UPLOADS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ CRITICAL ERROR: Supabase credentials missing in .env');
    console.error(`   SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
    console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'Set' : 'Missing'}`);
}
else {
    console.log(`✅ Supabase initialized for uploads`);
    console.log(`   URL: ${supabaseUrl}`);
    // Log first few chars to verify it's the right key (service_role usually starts similarly but check length)
    console.log(`   Key: ${supabaseServiceKey.substring(0, 10)}... (Length: ${supabaseServiceKey.length})`);
}
// Create a client specifically for uploads with admin privileges
// We use the Service Role Key to bypass RLS policies
const supabase = (0, supabase_js_1.createClient)(supabaseUrl || '', supabaseServiceKey || '', {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    },
    global: {
        headers: {
            // Force Authorization header to be the service role key
            Authorization: `Bearer ${supabaseServiceKey}`
        }
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
const uploadToSupabase = (file, folder) => __awaiter(void 0, void 0, void 0, function* () {
    // Sanitize filename to remove special chars
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E5)}`;
    const filename = `${uniqueSuffix}-${originalName}`;
    console.log(`📤 Uploading ${filename} to ${folder}...`);
    try {
        const { data, error } = yield supabase
            .storage
            .from('uploads')
            .upload(`${folder}/${filename}`, file.buffer, {
            contentType: file.mimetype,
            upsert: true
        });
        if (error) {
            console.error("❌ Supabase Storage Error:", error);
            console.error("   Error Message:", error.message);
            console.error("   Error Details:", JSON.stringify(error));
            throw error;
        }
        const { data: publicUrlData } = supabase
            .storage
            .from('uploads')
            .getPublicUrl(`${folder}/${filename}`);
        console.log(`✅ Upload successful: ${publicUrlData.publicUrl}`);
        return publicUrlData.publicUrl;
    }
    catch (err) {
        console.error("❌ Unexpected error during upload:", err);
        throw err;
    }
});
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
        res.status(500).json({ error: `Failed to upload image: ${error.message || error}` });
    }
}));
exports.default = router;
