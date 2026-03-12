import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// ─── Initialize Supabase Client ──────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('⚠️ Supabase credentials missing. Uploads will fail.');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
    }
});

// ─── Multer config (Memory Storage) ─────────────────────────────
const storage = multer.memoryStorage();

const imageFilter = (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });

// Generic upload function to Supabase
const uploadToSupabase = async (file: Express.Multer.File, folder: string) => {
    // Sanitize filename to remove special chars
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E5)}`;
    // REMOVED FOLDER PREFIX FROM FILENAME to avoid "products/products/..."
    const filename = `${uniqueSuffix}-${originalName}`;

    const { data, error } = await supabase
        .storage
        .from('uploads')
        .upload(`${folder}/${filename}`, file.buffer, {
            contentType: file.mimetype,
            upsert: true // Allow overwriting if conflict
        });

    if (error) {
        console.error("Supabase Storage Error:", error);
        throw error;
    }

    const { data: publicUrlData } = supabase
        .storage
        .from('uploads')
        .getPublicUrl(`${folder}/${filename}`);

    return publicUrlData.publicUrl;
}

// ─── POST /upload/category ──────────────────────────────────────
router.post('/category', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const publicUrl = await uploadToSupabase(req.file, 'categories');
        res.json({ url: publicUrl });
    } catch (error) {
        console.error('Error uploading category image to Supabase:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// ─── POST /upload/product ───────────────────────────────────────
router.post('/product', upload.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const publicUrl = await uploadToSupabase(req.file, 'products');
        res.json({ url: publicUrl });
    } catch (error: any) {
        console.error('Error uploading product image to Supabase:', error);
        res.status(500).json({ error: `Failed to upload image: ${error.message || error}` });
    }
});

export default router;
