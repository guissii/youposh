import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import categoryRoutes from './routes/categories';
import dashboardRoutes from './routes/dashboard';
import customerRoutes from './routes/customers';
import promoCodeRoutes from './routes/promoCodes';
import uploadRoutes from './routes/upload';
import settingsRoutes from './routes/settings';
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
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

// Mount routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/promo-codes', promoCodeRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/settings', settingsRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
