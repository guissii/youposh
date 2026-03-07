import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all promo codes
router.get('/', async (_req, res) => {
    try {
        const promoCodes = await prisma.promoCode.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(promoCodes);
    } catch (error) {
        console.error('Error fetching promo codes:', error);
        res.status(500).json({ error: 'Failed to fetch promo codes' });
    }
});

// POST validate a promo code (for frontend checkout)
router.post('/validate', async (req, res) => {
    try {
        const { code, orderTotal } = req.body;
        const promo = await prisma.promoCode.findUnique({ where: { code } });

        if (!promo) return res.status(404).json({ error: 'Code promo invalide' });
        if (!promo.isActive) return res.status(400).json({ error: 'Code promo expiré' });
        if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses) return res.status(400).json({ error: 'Code promo épuisé' });
        if (promo.endDate && new Date(promo.endDate) < new Date()) return res.status(400).json({ error: 'Code promo expiré' });
        if (promo.minOrder > 0 && orderTotal < promo.minOrder) return res.status(400).json({ error: `Commande minimum: ${promo.minOrder} MAD` });

        const discount = promo.discountType === 'percentage'
            ? (orderTotal * promo.discountValue) / 100
            : promo.discountValue;

        res.json({ valid: true, discount, promo });
    } catch (error) {
        res.status(500).json({ error: 'Erreur de validation' });
    }
});

// POST create promo code
router.post('/', async (req, res) => {
    try {
        const promo = await prisma.promoCode.create({ data: req.body });
        res.status(201).json(promo);
    } catch (error) {
        console.error('Error creating promo code:', error);
        res.status(500).json({ error: 'Failed to create promo code' });
    }
});

// PUT update promo code
router.put('/:id', async (req, res) => {
    try {
        const promo = await prisma.promoCode.update({
            where: { id: parseInt(req.params.id) },
            data: req.body,
        });
        res.json(promo);
    } catch (error) {
        console.error('Error updating promo code:', error);
        res.status(500).json({ error: 'Failed to update promo code' });
    }
});

// DELETE promo code
router.delete('/:id', async (req, res) => {
    try {
        await prisma.promoCode.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Promo code deleted' });
    } catch (error) {
        console.error('Error deleting promo code:', error);
        res.status(500).json({ error: 'Failed to delete promo code' });
    }
});

export default router;
