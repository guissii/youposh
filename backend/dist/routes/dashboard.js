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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// GET dashboard stats
router.get('/stats', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const [totalOrders, totalProducts, orders] = yield Promise.all([
            prisma.order.count(),
            prisma.product.count(),
            prisma.order.findMany({ select: { total: true, status: true } }),
        ]);
        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
        const pendingOrders = orders.filter(o => o.status === 'pending').length;
        const processingOrders = orders.filter(o => o.status === 'processing').length;
        const completedOrders = orders.filter(o => ['completed', 'delivered'].includes(o.status)).length;
        const cancelledOrders = orders.filter(o => o.status === 'cancelled').length;
        res.json({
            totalOrders,
            totalRevenue,
            pendingOrders,
            processingOrders,
            completedOrders,
            cancelledOrders,
            totalProducts,
        });
    }
    catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch stats' });
    }
}));
// GET recent orders
router.get('/recent-orders', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const orders = yield prisma.order.findMany({
            take: 10,
            orderBy: { createdAt: 'desc' },
            include: {
                items: { include: { product: true } },
            },
        });
        res.json(orders);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch recent orders' });
    }
}));
// GET top products
router.get('/top-products', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const products = yield prisma.product.findMany({
            take: 10,
            orderBy: { salesCount: 'desc' },
            include: { category: true },
        });
        res.json(products);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch top products' });
    }
}));
exports.default = router;
