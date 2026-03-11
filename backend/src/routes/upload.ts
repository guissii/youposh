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
async function uploadToSupabase(file: Express.Multer.File, folder: string): Promise<string> {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const filename = `${folder}/${folder.slice(0, -1)}-${uniqueSuffix}${ext}`;

    const { data, error } = await supabase
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
    } catch (error) {
        console.error('Error uploading product image to Supabase:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

export default router;
