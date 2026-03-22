import { Router } from 'express';
import prisma from '../utils/prisma';

const router = Router();

// GET dashboard stats
router.get('/stats', async (_req, res) => {
    try {
        const [totalOrders, totalProducts, revenue, totalPageViews, statusCounts, uniqueVisitorCountRaw] = await Promise.all([
            prisma.order.count(),
            prisma.product.count(),
            prisma.order.aggregate({ _sum: { total: true } }),
            prisma.visitorStat.count(),
            prisma.order.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            prisma.$queryRaw<Array<{ count: bigint | number }>>`SELECT COUNT(DISTINCT "visitorId")::bigint AS count FROM "VisitorStat"`,
        ]);

        const statusMap = new Map<string, number>();
        for (const row of statusCounts) {
            statusMap.set(row.status, row._count.status);
        }

        const uniqueVisitors = Number(uniqueVisitorCountRaw?.[0]?.count ?? 0);
        const totalRevenue = Number(revenue._sum.total ?? 0);
        const pendingOrders = statusMap.get('pending') ?? 0;
        const processingOrders = statusMap.get('processing') ?? 0;
        const completedOrders = (statusMap.get('completed') ?? 0) + (statusMap.get('delivered') ?? 0);
        const cancelledOrders = statusMap.get('cancelled') ?? 0;

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
