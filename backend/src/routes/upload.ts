import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();

// ─── Initialize Supabase Client ──────────────────────────────
const supabaseUrl = process.env.SUPABASE_URL;
// FORCE USE OF SERVICE ROLE KEY FOR UPLOADS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ CRITICAL ERROR: Supabase credentials missing in .env');
    console.error(`   SUPABASE_URL: ${supabaseUrl ? 'Set' : 'Missing'}`);
    console.error(`   SUPABASE_SERVICE_ROLE_KEY: ${supabaseServiceKey ? 'Set' : 'Missing'}`);
} else {
    console.log(`✅ Supabase initialized for uploads`);
    console.log(`   URL: ${supabaseUrl}`);
    // Log first few chars to verify it's the right key (service_role usually starts similarly but check length)
    console.log(`   Key: ${supabaseServiceKey.substring(0, 10)}... (Length: ${supabaseServiceKey.length})`);
}

// Create a client specifically for uploads with admin privileges
// We use the Service Role Key to bypass RLS policies
const supabase = createClient(supabaseUrl || '', supabaseServiceKey || '', {
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
const storage = multer.memoryStorage();

const imageFilter = (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const upload = multer({ storage: storage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });

const uploadToSupabase = async (file: Express.Multer.File, folder: string) => {
    // Sanitize filename to remove special chars
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E5)}`;
    const filename = `${uniqueSuffix}-${originalName}`;

    console.log(`📤 Uploading ${filename} to ${folder}...`);

    try {
        const { data, error } = await supabase
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

    } catch (err: any) {
        console.error("❌ Unexpected error during upload:", err);
        throw err;
    }
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
