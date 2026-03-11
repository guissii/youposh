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
const router = (0, express_1.Router)();
// ─── Ensure upload directories exist ────────────────────────────
const categoryDir = path_1.default.join(__dirname, '../../uploads/categories');
const productDir = path_1.default.join(__dirname, '../../uploads/products');
if (!fs_1.default.existsSync(categoryDir))
    fs_1.default.mkdirSync(categoryDir, { recursive: true });
if (!fs_1.default.existsSync(productDir))
    fs_1.default.mkdirSync(productDir, { recursive: true });
// ─── Multer config for categories ───────────────────────────────
const categoryStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, categoryDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `category-${uniqueSuffix}${ext}`);
    }
});
// ─── Multer config for products ─────────────────────────────────
const productStorage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => cb(null, productDir),
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `product-${uniqueSuffix}${ext}`);
    }
});
const imageFilter = (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    }
    else {
        cb(new Error('Only image files are allowed'));
    }
};
const uploadCategory = (0, multer_1.default)({ storage: categoryStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });
const uploadProduct = (0, multer_1.default)({ storage: productStorage, limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter });
// ─── POST /upload/category ──────────────────────────────────────
router.post('/category', uploadCategory.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        const imageUrl = `/uploads/categories/${req.file.filename}`;
        res.json({ url: imageUrl });
    }
    catch (error) {
        console.error('Error uploading category image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
}));
// ─── POST /upload/product ───────────────────────────────────────
router.post('/product', uploadProduct.single('image'), (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image uploaded' });
        }
        const imageUrl = `/uploads/products/${req.file.filename}`;
        res.json({ url: imageUrl });
    }
    catch (error) {
        console.error('Error uploading product image:', error);
        res.status(500).json({ error: 'Failed to upload image' });
    }
}));
exports.default = router;
