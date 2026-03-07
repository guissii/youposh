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

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Mount routes
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/promo-codes', promoCodeRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
