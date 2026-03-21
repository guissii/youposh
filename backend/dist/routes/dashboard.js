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
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const [totalOrders, totalProducts, revenue, totalPageViews, statusCounts, uniqueVisitorCountRaw] = yield Promise.all([
            prisma.order.count(),
            prisma.product.count(),
            prisma.order.aggregate({ _sum: { total: true } }),
            prisma.visitorStat.count(),
            prisma.order.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            prisma.$queryRaw `SELECT COUNT(DISTINCT "visitorId")::bigint AS count FROM "VisitorStat"`,
        ]);
        const statusMap = new Map();
        for (const row of statusCounts) {
            statusMap.set(row.status, row._count.status);
        }
        const uniqueVisitors = Number((_b = (_a = uniqueVisitorCountRaw === null || uniqueVisitorCountRaw === void 0 ? void 0 : uniqueVisitorCountRaw[0]) === null || _a === void 0 ? void 0 : _a.count) !== null && _b !== void 0 ? _b : 0);
        const totalRevenue = Number((_c = revenue._sum.total) !== null && _c !== void 0 ? _c : 0);
        const pendingOrders = (_d = statusMap.get('pending')) !== null && _d !== void 0 ? _d : 0;
        const processingOrders = (_e = statusMap.get('processing')) !== null && _e !== void 0 ? _e : 0;
        const completedOrders = ((_f = statusMap.get('completed')) !== null && _f !== void 0 ? _f : 0) + ((_g = statusMap.get('delivered')) !== null && _g !== void 0 ? _g : 0);
        const cancelledOrders = (_h = statusMap.get('cancelled')) !== null && _h !== void 0 ? _h : 0;
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
