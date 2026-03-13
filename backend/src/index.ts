import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import categoryRoutes from './routes/categories';
import dashboardRoutes from './routes/dashboard';
import promoCodeRoutes from './routes/promoCodes';
import uploadRoutes from './routes/upload';
import settingsRoutes from './routes/settings';
import attributeLibraryRoutes from './routes/attributeLibrary';
import authRoutes from './routes/auth';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from the uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Only listen when running locally (not on Vercel)
if (!process.env.VERCEL) {
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
        console.log(`Version: ${new Date().toISOString()} - Supabase Upload Fix Applied`);
    });
}

export default app;
