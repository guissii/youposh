import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

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
        const data = req.body;
        // Ensure ID is not updated
        delete data.id;
        delete data.updatedAt;

        const settings = await prisma.storeSettings.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...data },
        });
        res.json(settings);
    } catch (error) {
        console.error('Error updating store settings:', error);
        res.status(500).json({ error: 'Failed to update store settings' });
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
        const data = req.body;
        delete data.id;
        delete data.updatedAt;

        const settings = await prisma.heroSettings.upsert({
            where: { id: 1 },
            update: data,
            create: { id: 1, ...data },
        });
        res.json(settings);
    } catch (error) {
        console.error('Error updating hero settings:', error);
        res.status(500).json({ error: 'Failed to update hero settings' });
    }
});

export default router;
