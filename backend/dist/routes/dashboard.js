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
const prisma_1 = __importDefault(require("../utils/prisma"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const child_process_1 = require("child_process");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';
function requireAdmin(req, res) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token manquant' });
        return false;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        if (decoded.role !== 'admin' && decoded.role !== 'editor') {
            res.status(403).json({ error: 'Accès refusé' });
            return false;
        }
        return true;
    }
    catch (_a) {
        res.status(401).json({ error: 'Token invalide' });
        return false;
    }
}
// GET dashboard stats
router.get('/stats', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    try {
        const [totalOrders, totalProducts, revenue, totalPageViews, statusCounts, uniqueVisitorCountRaw] = yield Promise.all([
            prisma_1.default.order.count(),
            prisma_1.default.product.count(),
            prisma_1.default.order.aggregate({ _sum: { total: true } }),
            prisma_1.default.visitorStat.count(),
            prisma_1.default.order.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            prisma_1.default.$queryRaw `SELECT COUNT(DISTINCT "visitorId")::bigint AS count FROM "VisitorStat"`,
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
        const orders = yield prisma_1.default.order.findMany({
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
        const products = yield prisma_1.default.product.findMany({
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
// ─── VPS Status (manual refresh only, no auto-polling) ──────────
function runCmd(cmd) {
    try {
        return (0, child_process_1.execSync)(cmd, { timeout: 5000 }).toString().trim();
    }
    catch (_a) {
        return '';
    }
}
router.get('/vps-status', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!requireAdmin(req, res))
            return;
        // Memory
        const totalMem = os_1.default.totalmem();
        const freeMem = os_1.default.freemem();
        const usedMem = totalMem - freeMem;
        // CPU load averages (1, 5, 15 min)
        const loadAvg = os_1.default.loadavg();
        const cpuCount = os_1.default.cpus().length;
        // Uptime
        const uptimeSec = process.uptime();
        // Disk usage
        let diskTotal = 0, diskUsed = 0, diskPercent = 0;
        try {
            const dfOut = runCmd("df -B1 / | tail -1");
            const parts = dfOut.split(/\s+/);
            if (parts.length >= 5) {
                diskTotal = parseInt(parts[1]) || 0;
                diskUsed = parseInt(parts[2]) || 0;
                diskPercent = parseInt(parts[4]) || 0;
            }
        }
        catch ( /* ignore */_a) { /* ignore */ }
        // Nginx status
        let nginxStatus = 'unknown';
        try {
            const out = runCmd('systemctl is-active nginx');
            nginxStatus = out === 'active' ? 'active' : 'down';
        }
        catch (_b) {
            nginxStatus = 'down';
        }
        // PostgreSQL status
        let pgStatus = 'unknown';
        try {
            yield prisma_1.default.$queryRaw `SELECT 1`;
            pgStatus = 'active';
        }
        catch (_c) {
            pgStatus = 'down';
        }
        // PM2 processes
        let pm2Processes = [];
        try {
            const pm2Out = runCmd('pm2 jlist');
            if (pm2Out) {
                const list = JSON.parse(pm2Out);
                pm2Processes = list.map((p) => {
                    var _a, _b, _c;
                    return ({
                        name: p.name,
                        status: ((_a = p.pm2_env) === null || _a === void 0 ? void 0 : _a.status) || 'unknown',
                        cpu: ((_b = p.monit) === null || _b === void 0 ? void 0 : _b.cpu) || 0,
                        memory: ((_c = p.monit) === null || _c === void 0 ? void 0 : _c.memory) || 0,
                    });
                });
            }
        }
        catch ( /* ignore */_d) { /* ignore */ }
        // Uploads folder size
        let uploadsSize = '0';
        let uploadsCount = 0;
        try {
            const uploadsDir = path_1.default.join(__dirname, '../../uploads');
            uploadsSize = runCmd(`du -sh "${uploadsDir}" | cut -f1`);
            const countStr = runCmd(`find "${uploadsDir}" -type f | wc -l`);
            uploadsCount = parseInt(countStr) || 0;
        }
        catch ( /* ignore */_e) { /* ignore */ }
        // Node version
        const nodeVersion = process.version;
        res.json({
            memory: {
                total: totalMem,
                used: usedMem,
                free: freeMem,
                percent: Math.round((usedMem / totalMem) * 100),
            },
            cpu: {
                loadAvg: loadAvg.map(l => Math.round(l * 100) / 100),
                cores: cpuCount,
                percent: Math.round((loadAvg[0] / cpuCount) * 100),
            },
            disk: {
                total: diskTotal,
                used: diskUsed,
                percent: diskPercent,
            },
            uptime: uptimeSec,
            nginx: nginxStatus,
            postgresql: pgStatus,
            pm2: pm2Processes,
            uploads: { size: uploadsSize, count: uploadsCount },
            nodeVersion,
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        console.error('Error fetching VPS status:', error);
        res.status(500).json({ error: 'Failed to fetch VPS status' });
    }
}));
exports.default = router;
