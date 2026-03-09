import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { applyWatermark, applyWatermarkToAll } from '../utils/watermark';

const router = Router();

// ─── Ensure upload directories exist ────────────────────────────
const categoryDir = path.join(__dirname, '../../uploads/categories');
const productDir = path.join(__dirname, '../../uploads/products');
if (!fs.existsSync(categoryDir)) fs.mkdirSync(categoryDir, { recursive: true });
if (!fs.existsSync(productDir)) fs.mkdirSync(productDir, { recursive: true });

// ─── Multer config for categories ───────────────────────────────
const categoryStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, categoryDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `category-${uniqueSuffix}${ext}`);
    }
});

// ─── Multer config for products ─────────────────────────────────
const productStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, productDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});

const imageFilter = (_req: any, file: any, cb: any) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'));
    }
};

const uploadCategory = multer({ storage: categoryStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });
const uploadProduct = multer({ storage: productStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });

// ─── POST /upload/category ──────────────────────────────────────
router.post('/category', uploadCategory.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const opacity = Number(req.body.watermarkOpacity);
        const size = Number(req.body.watermarkSize) || 30;
        if (opacity && opacity > 0) {
            await applyWatermark(req.file.path, opacity, size);
        }

        const imageUrl = `/uploads/categories/${req.file.filename}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error('Error uploading category image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// ─── POST /upload/product ───────────────────────────────────────
router.post('/product', uploadProduct.single('image'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }

        const opacity = Number(req.body.watermarkOpacity);
        const size = Number(req.body.watermarkSize) || 30;
        if (opacity && opacity > 0) {
            await applyWatermark(req.file.path, opacity, size);
        }

        const imageUrl = `/uploads/products/${req.file.filename}`;
        res.json({ url: imageUrl });
    } catch (error) {
        console.error('Error uploading product image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
});

// ─── POST /upload/watermark-all ─────────────────────────────────
// Apply watermark to ALL existing images with given opacity & size
router.post('/watermark-all', async (req, res) => {
    try {
        const opacity = Number(req.body.opacity) || 20;
        const size = Number(req.body.size) || 30;

        console.log(`[watermark-all] Applying to all images: opacity=${opacity}%, size=${size}%`);
        const result = await applyWatermarkToAll(opacity, size);
        console.log(`[watermark-all] Done: ${result.success}/${result.total} success`);

        res.json(result);
    } catch (error) {
        console.error('Error applying watermarks:', error);
        res.status(500).json({ error: 'Failed to apply watermarks' });
    }
});

export default router;
