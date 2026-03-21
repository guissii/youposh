import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this';

function requireAdmin(req: express.Request, res: express.Response): boolean {
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

// ── Store Settings ──

router.get('/store', async (req, res) => {
    try {
        const settings = await prisma.storeSettings.findUnique({ where: { id: 1 } });
        if (!settings) {
            const defaultSettings = await prisma.storeSettings.create({ data: { id: 1 } });
            return res.json(defaultSettings);
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching store settings:', error);
        res.status(500).json({ error: 'Failed to fetch store settings' });
    }
});

router.post('/store', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const data = req.body;
        // Ensure ID and updatedAt are not updated
        delete data.id;
        delete data.updatedAt;

        // Clean up data to remove any fields not in the schema (Prisma strict mode fix)
        // We only allow fields that exist in our schema to be passed to update/create
        const allowedFields = [
            'storeName', 'phone', 'email', 'currency',
            'brandPrimary', 'brandSecondary',
            'brandColorYou', 'brandColorPosh', 'brandColorCart',
            'shippingFeeLocal', 'shippingFeeNational',
            'watermarkEnabled', 'watermarkOpacity', 'watermarkSize', 'watermarkPosX', 'watermarkPosY',
            'activeGlobalCoupon', 'globalCouponEnabled', 'promoSectionEnabled'
        ];

        const cleanData: any = {};
        for (const key of Object.keys(data)) {
            if (allowedFields.includes(key)) {
                cleanData[key] = data[key];
            }
        }

        const settings = await prisma.storeSettings.upsert({
            where: { id: 1 },
            update: cleanData,
            create: { id: 1, ...cleanData },
        });
        res.json(settings);
    } catch (error: any) {
        console.error('Error updating store settings:', error);
        // Return the specific error message to help debugging
        res.status(500).json({ error: `Save failed: ${error.message || error}` });
    }
});

// ── Watermark status (non-destructive overlay) ──
router.patch('/watermark/status', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const { isEnabled } = req.body ?? {};
        if (typeof isEnabled !== 'boolean') {
            return res.status(400).json({ error: 'isEnabled boolean is required' });
        }
        const settings = await prisma.storeSettings.upsert({
            where: { id: 1 },
            update: { watermarkEnabled: isEnabled },
            create: { id: 1, watermarkEnabled: isEnabled },
        });
        res.json(settings);
    } catch (error) {
        console.error('Error updating watermark status:', error);
        res.status(500).json({ error: 'Failed to update watermark status' });
    }
});

// ── Hero Settings ──

router.get('/hero', async (req, res) => {
    try {
        const settings = await prisma.heroSettings.findUnique({ where: { id: 1 } });
        if (!settings) {
            const defaultSettings = await prisma.heroSettings.create({ data: { id: 1 } });
            return res.json(defaultSettings);
        }
        res.json(settings);
    } catch (error) {
        console.error('Error fetching hero settings:', error);
        res.status(500).json({ error: 'Failed to fetch hero settings' });
    }
});

router.post('/hero', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        const data = req.body;
        delete data.id;
        delete data.updatedAt;

        // Clean up data to remove any fields not in the schema (Prisma strict mode fix)
        const allowedFields = [
            'isEnabled', 'badgeText', 'title', 'subtitle', 'slogan',
            'primaryCtaText', 'primaryCtaLink', 'secondaryCtaText', 'secondaryCtaLink',
            'badgeColor', 'badgeTextColor', 'titleColorYou', 'titleColorPosh',
            'videoEnabled', 'videoUrl', 'videoPosterUrl',
            'videoAutoplay', 'videoMuted', 'videoLoop', 'showOnMobile', 'overlayOpacity', 'heroVideoEnabled'
        ];

        const cleanData: any = {};
        for (const key of Object.keys(data)) {
            if (allowedFields.includes(key)) {
                cleanData[key] = data[key];
            }
        }
        if (cleanData.overlayOpacity !== undefined) {
            const parsed = Number(cleanData.overlayOpacity);
            cleanData.overlayOpacity = Number.isFinite(parsed) ? Math.max(0, Math.min(100, Math.round(parsed))) : 55;
        }
        if (cleanData.heroVideoEnabled === false) {
            cleanData.videoEnabled = false;
        }

        const settings = await prisma.heroSettings.upsert({
            where: { id: 1 },
            update: cleanData,
            create: { id: 1, ...cleanData },
        });
        res.json(settings);
    } catch (error) {
        console.error('Error updating hero settings:', error);
        res.status(500).json({ error: 'Failed to update hero settings' });
    }
});

export default router;
