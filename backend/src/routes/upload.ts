import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { promisify } from 'util';
import { Request } from 'express';

dotenv.config();

const router = Router();

const driver = (process.env.UPLOADS_DRIVER || 'local').toLowerCase();

const ensureDir = (p: string) => {
    if (!fs.existsSync(p)) {
        fs.mkdirSync(p, { recursive: true });
    }
};

const baseUploadsDir = process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads');
ensureDir(baseUploadsDir);
ensureDir(path.join(baseUploadsDir, 'products'));
ensureDir(path.join(baseUploadsDir, 'categories'));
ensureDir(path.join(baseUploadsDir, 'videos'));

const filenameSafe = (name: string) => name.replace(/[^a-zA-Z0-9._-]/g, '_');
const uniqueName = (original: string) => {
    const base = filenameSafe(original);
    const id = `${Date.now()}-${Math.round(Math.random() * 1e5)}`;
    const ext = path.extname(base);
    const stem = path.basename(base, ext);
    return `${stem}-${id}${ext}`;
};

const getPublicBase = (req: Request) => {
    const h = req.get('x-forwarded-host') || req.get('host') || '';
    const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim();
    if (!h) return '';
    return `${proto}://${h}`;
};

const diskStorageFactory = (folder: 'products' | 'categories' | 'videos') =>
    multer.diskStorage({
        destination: (_req, _file, cb) => {
            const dest = path.join(baseUploadsDir, folder);
            ensureDir(dest);
            cb(null, dest);
        },
        filename: (_req, file, cb) => {
            cb(null, uniqueName(file.originalname));
        }
    });

const imageFilter = (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
};

const videoFilter = (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'));
};

const uploadImageToDisk = multer({
    storage: diskStorageFactory('products'),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFilter
});

const uploadCategoryImageToDisk = multer({
    storage: diskStorageFactory('categories'),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFilter
});

const uploadVideoToDisk = multer({
    storage: diskStorageFactory('videos'),
    limits: { fileSize: 200 * 1024 * 1024 },
    fileFilter: videoFilter
});

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase =
    supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey, {
              auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
              global: { headers: { Authorization: `Bearer ${supabaseServiceKey}` } }
          })
        : null;

const uploadToSupabase = async (file: Express.Multer.File, folder: string) => {
    if (!supabase) throw new Error('Supabase not configured');
    const originalName = filenameSafe(file.originalname);
    const filename = uniqueName(originalName);
    const { error } = await supabase.storage.from('uploads').upload(`${folder}/${filename}`, file.buffer, {
        contentType: file.mimetype,
        upsert: true
    });
    if (error) throw error;
    const { data: publicUrlData } = supabase.storage.from('uploads').getPublicUrl(`${folder}/${filename}`);
    return publicUrlData.publicUrl;
};

router.post('/category', (req, res, next) => {
    if (driver === 'supabase') {
        const mem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: imageFilter });
        return mem.single('image')(req, res, next);
    } else {
        return (uploadCategoryImageToDisk.single('image'))(req, res, next);
    }
}, async (req, res) => {
    try {
        const f = (req as any).file as Express.Multer.File | undefined;
        if (!f) return res.status(400).json({ error: 'No image uploaded' });
        if (driver === 'supabase') {
            const url = await uploadToSupabase(f, 'categories');
            return res.json({ url });
        } else {
            const base = getPublicBase(req);
            const url = `${base}/uploads/categories/${path.basename(f.path)}`;
            return res.json({ url });
        }
    } catch (e: any) {
        return res.status(500).json({ error: e.message || 'Failed to upload image' });
    }
});

router.post('/product', (req, res, next) => {
    if (driver === 'supabase') {
        const mem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 }, fileFilter: imageFilter });
        return mem.single('image')(req, res, next);
    } else {
        return (uploadImageToDisk.single('image'))(req, res, next);
    }
}, async (req, res) => {
    try {
        const f = (req as any).file as Express.Multer.File | undefined;
        if (!f) return res.status(400).json({ error: 'No image uploaded' });
        if (driver === 'supabase') {
            const url = await uploadToSupabase(f, 'products');
            return res.json({ url });
        } else {
            const base = getPublicBase(req);
            const url = `${base}/uploads/products/${path.basename(f.path)}`;
            return res.json({ url });
        }
    } catch (e: any) {
        return res.status(500).json({ error: e.message || 'Failed to upload image' });
    }
});

router.post('/video', (req, res, next) => {
    if (driver === 'supabase') {
        const mem = multer({ storage: multer.memoryStorage(), limits: { fileSize: 200 * 1024 * 1024 }, fileFilter: videoFilter });
        return mem.single('video')(req, res, next);
    } else {
        return (uploadVideoToDisk.single('video'))(req, res, next);
    }
}, async (req, res) => {
    try {
        const f = (req as any).file as Express.Multer.File | undefined;
        if (!f) return res.status(400).json({ error: 'No video uploaded' });
        if (driver === 'supabase') {
            const url = await uploadToSupabase(f, 'videos');
            return res.json({ url });
        } else {
            const base = getPublicBase(req);
            const url = `${base}/uploads/videos/${path.basename(f.path)}`;
            return res.json({ url });
        }
    } catch (e: any) {
        return res.status(500).json({ error: e.message || 'Failed to upload video' });
    }
});

router.post('/delete', async (req, res) => {
    try {
        const url: string | undefined = (req as any).body?.url;
        if (!url) return res.status(400).json({ error: 'Missing url' });
        if (driver === 'supabase') {
            const u = new URL(url);
            const parts = u.pathname.split('/').slice(-2).join('/');
            const { error } = await supabase!.storage.from('uploads').remove([parts]);
            if (error) return res.status(500).json({ error: error.message || 'Failed to delete' });
            return res.json({ ok: true });
        } else {
            const u = new URL(url, getPublicBase(req) || 'http://localhost');
            if (!u.pathname.startsWith('/uploads/')) return res.status(400).json({ error: 'Invalid path' });
            const localPath = path.join(baseUploadsDir, u.pathname.replace('/uploads/', ''));
            if (!localPath.startsWith(baseUploadsDir)) return res.status(400).json({ error: 'Invalid path' });
            try {
                await promisify(fs.unlink)(localPath);
            } catch {
            }
            return res.json({ ok: true });
        }
    } catch (e: any) {
        return res.status(500).json({ error: e.message || 'Failed to delete file' });
    }
});

export default router;
