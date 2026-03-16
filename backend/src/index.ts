import express from 'express';
import cors from 'cors';
import compression from 'compression';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import categoryRoutes from './routes/categories';
import dashboardRoutes from './routes/dashboard';
import promoCodeRoutes from './routes/promoCodes';
import uploadRoutes from './routes/upload';
import settingsRoutes from './routes/settings';
import attributeLibraryRoutes from './routes/attributeLibrary';
import authRoutes from './routes/auth';
import syncRoutes from './routes/sync';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(compression());
app.use(cors());
app.use(express.json());

// Visitor Tracking Middleware
app.use(async (req, _res, next) => {
    // Skip static files, uploads, and admin routes
    if (
        req.path.startsWith('/uploads') ||
        req.path.startsWith('/api/auth') ||
        req.path.startsWith('/api/dashboard') ||
        req.path.startsWith('/api/upload') ||
        req.method !== 'GET'
    ) {
        return next();
    }

    try {
        const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
        const userAgent = req.headers['user-agent'] || 'unknown';
        const visitorId = crypto
            .createHash('md5')
            .update(`${ip}-${userAgent}`)
            .digest('hex');

        await prisma.visitorStat.create({
            data: {
                visitorId,
                path: req.path,
            },
        });
    } catch (err) {
        console.error('Visitor tracking error:', err);
    }
    next();
});

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Debug Env Route (Temporary)
app.get('/api/debug-env', (_req, res) => {
    const vars = {
        GOOGLE_SERVICE_ACCOUNT_EMAIL: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'Present' : 'Missing',
        GOOGLE_SHEETS_SPREADSHEET_ID: process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'Present' : 'Missing',
        GOOGLE_PRIVATE_KEY: process.env.GOOGLE_PRIVATE_KEY ? 'Present (Raw)' : 'Missing',
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ? 'Present (Service)' : 'Missing',
        GOOGLE_PRIVATE_KEY_BASE64: process.env.GOOGLE_PRIVATE_KEY_BASE64 ? 'Present (Base64)' : 'Missing',
        GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_BASE64 ? 'Present (Service Base64)' : 'Missing',
        NODE_ENV: process.env.NODE_ENV,
    };
    res.json(vars);
});

const uploadsDir = process.env.UPLOADS_DIR || path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
    try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
}
app.use('/uploads', express.static(uploadsDir, { maxAge: '7d', immutable: true }));

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/attribute-library', attributeLibraryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sync', syncRoutes);

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Version: ${new Date().toISOString()} - Supabase Upload Fix Applied`);
    });
}

export default app;
