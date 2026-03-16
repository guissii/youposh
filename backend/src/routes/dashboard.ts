import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET dashboard stats
router.get('/stats', async (_req, res) => {
    try {
        const [totalOrders, totalProducts, orders, visitorStats] = await Promise.all([
            prisma.order.count(),
            prisma.product.count(),
            prisma.order.findMany({ select: { total: true, status: true } }),
            prisma.visitorStat.findMany({
                select: { visitorId: true, timestamp: true },
                where: {
                    timestamp: {
                        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
                    }
                }
            })
        ]);

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const processingOrders = orders.filter(o => o.status === 'processing').length;
        const completedOrders = orders.filter(o => ['completed', 'delivered'].includes(o.status)).length;
        const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;

        // Visitor stats calculations
        const totalPageViews = visitorStats.length;
        const uniqueVisitors = new Set(visitorStats.map(v => v.visitorId)).size;

        res.json({
            totalOrders,
            totalRevenue,
            pendingOrders,
            processingOrders,
            completedOrders,
            cancelledOrders,
            totalProducts,
            totalPageViews,
            uniqueVisitors,
        });
    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
});

// GET recent orders
router.get('/recent-orders', async (_req, res) => {
    try {
        const orders = await prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                items: { include: { product: true } },
            },
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
});

// GET top products
router.get('/top-products', async (_req, res) => {
    try {
        const products = await prisma.product.findMany({
            take: 10,
            orderBy: { salesCount: 'desc' },
            include: { category: true },
        });
        res.json(products);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch top products' });
    }
});

export default router;
