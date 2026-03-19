import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

router.post('/', async (req, res) => {
    try {
        const { visitorId, path } = req.body;
        const userAgent = req.headers['user-agent'] || '';
        
        if (!visitorId || !path) {
            return res.status(400).json({ error: 'visitorId and path are required' });
        }

        // Filter out obvious bots/crawlers
        const botKeywords = ['bot', 'crawler', 'spider', 'ping', 'lighthouse', 'google', 'bing', 'yandex'];
        const isBot = botKeywords.some(keyword => userAgent.toLowerCase().includes(keyword));
        
        if (isBot) {
            return res.json({ success: true, ignored: true });
        }

        await prisma.visitorStat.create({
            data: {
                visitorId,
                path
            }
        });

        res.json({ success: true });
    } catch (error) {
        console.error('Error tracking visitor:', error);
        res.status(500).json({ error: 'Failed to track visitor' });
    }
});

export default router;