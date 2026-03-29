import { Router, Request, Response } from 'express';
import prisma from '../utils/prisma';
import os from 'os';
import path from 'path';
import { execSync } from 'child_process';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

function requireAdmin(req: Request, res: Response): boolean {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token manquant' });
        return false;
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as { role?: string };
        if (decoded.role !== 'admin' && decoded.role !== 'editor') {
            res.status(403).json({ error: 'Accès refusé' });
            return false;
        }
        return true;
    } catch {
        res.status(401).json({ error: 'Token invalide' });
        return false;
    }
}

// GET dashboard stats
router.get('/stats', async (_req, res) => {
    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const [totalOrders, totalProducts, revenue, totalPageViews, statusCounts, uniqueVisitorCountRaw] = await Promise.all([
            prisma.order.count(),
            prisma.product.count(),
            prisma.order.aggregate({ _sum: { total: true } }),
            prisma.visitorStat.count(),
            prisma.order.groupBy({
                by: ['status'],
                _count: { status: true },
            }),
            prisma.$queryRaw<Array<{ count: bigint | number }>>`SELECT COUNT(DISTINCT "visitorId")::bigint AS count FROM "VisitorStat" WHERE "timestamp" >= ${thirtyDaysAgo}`,
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

// ─── VPS Status (manual refresh only, no auto-polling) ──────────
function runCmd(cmd: string): string {
    try { return execSync(cmd, { timeout: 5000 }).toString().trim(); }
    catch { return ''; }
}

router.get('/vps-status', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        // Memory
        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        // CPU load averages (1, 5, 15 min)
        const loadAvg = os.loadavg();
        const cpuCount = os.cpus().length;

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
        } catch { /* ignore */ }

        // Nginx status
        let nginxStatus = 'unknown';
        try {
            const out = runCmd('systemctl is-active nginx');
            nginxStatus = out === 'active' ? 'active' : 'down';
        } catch { nginxStatus = 'down'; }

        // PostgreSQL status
        let pgStatus = 'unknown';
        try {
            await prisma.$queryRaw`SELECT 1`;
            pgStatus = 'active';
        } catch { pgStatus = 'down'; }

        // PM2 processes
        let pm2Processes: { name: string; status: string; cpu: number; memory: number }[] = [];
        try {
            const pm2Out = runCmd('pm2 jlist');
            if (pm2Out) {
                const list = JSON.parse(pm2Out);
                pm2Processes = list.map((p: any) => ({
                    name: p.name,
                    status: p.pm2_env?.status || 'unknown',
                    cpu: p.monit?.cpu || 0,
                    memory: p.monit?.memory || 0,
                }));
            }
        } catch { /* ignore */ }

        // Uploads folder size
        let uploadsSize = '0';
        let uploadsCount = 0;
        try {
            const uploadsDir = path.join(__dirname, '../../uploads');
            uploadsSize = runCmd(`du -sh "${uploadsDir}" | cut -f1`);
            const countStr = runCmd(`find "${uploadsDir}" -type f | wc -l`);
            uploadsCount = parseInt(countStr) || 0;
        } catch { /* ignore */ }

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
    } catch (error) {
        console.error('Error fetching VPS status:', error);
        res.status(500).json({ error: 'Failed to fetch VPS status' });
    }
});

export default router;
