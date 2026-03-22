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
// GET all promo codes
router.get('/', (_req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const promoCodes = yield prisma.promoCode.findMany({
            orderBy: { createdAt: 'desc' },
        });
        res.json(promoCodes);
    }
    catch (error) {
        console.error('Error fetching promo codes:', error);
        res.status(500).json({ error: 'Failed to fetch promo codes' });
    }
}));
// POST validate a promo code (for frontend checkout)
router.post('/validate', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const codeRaw = (_a = req.body) === null || _a === void 0 ? void 0 : _a.code;
        const orderTotalRaw = (_b = req.body) === null || _b === void 0 ? void 0 : _b.orderTotal;
        const code = typeof codeRaw === 'string' ? codeRaw.trim() : '';
        const orderTotal = typeof orderTotalRaw === 'number' && Number.isFinite(orderTotalRaw) ? orderTotalRaw : undefined;
        if (!code)
            return res.status(400).json({ error: 'Code promo invalide' });
        const promo = yield prisma.promoCode.findUnique({ where: { code } });
        if (!promo)
            return res.status(404).json({ error: 'Code promo invalide' });
        if (!promo.isActive)
            return res.status(400).json({ error: 'Code promo expiré' });
        if (promo.startDate && new Date(promo.startDate) > new Date())
            return res.status(400).json({ error: 'Code promo pas encore actif' });
        if (promo.maxUses > 0 && promo.usedCount >= promo.maxUses)
            return res.status(400).json({ error: 'Code promo épuisé' });
        if (promo.endDate && new Date(promo.endDate) < new Date())
            return res.status(400).json({ error: 'Code promo expiré' });
        if (typeof orderTotal === 'number' && promo.minOrder > 0 && orderTotal < promo.minOrder)
            return res.status(400).json({ error: `Commande minimum: ${promo.minOrder} MAD` });
        if (typeof orderTotal !== 'number') {
            return res.json({
                valid: true,
                discount: 0,
                promo,
                message: 'Code promo enregistré. Il sera appliqué à votre panier au moment du paiement.',
            });
        }
        const rawDiscount = promo.discountType === 'percentage'
            ? (orderTotal * promo.discountValue) / 100
            : promo.discountValue;
        const discount = Math.max(0, Math.min(orderTotal, rawDiscount));
        res.json({
            valid: true,
            discount,
            promo,
            cartTotalBefore: orderTotal,
            cartTotalAfter: Math.max(0, orderTotal - discount),
            message: 'Code promo appliqué avec succès',
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Erreur de validation' });
    }
}));
// POST create promo code
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const promo = yield prisma.promoCode.create({ data: req.body });
        res.status(201).json(promo);
    }
    catch (error) {
        console.error('Error creating promo code:', error);
        res.status(500).json({ error: 'Failed to create promo code' });
    }
}));
// PUT update promo code
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const promo = yield prisma.promoCode.update({
            where: { id: parseInt(String(req.params.id)) },
            data: req.body,
        });
        res.json(promo);
    }
    catch (error) {
        console.error('Error updating promo code:', error);
        res.status(500).json({ error: 'Failed to update promo code' });
    }
}));
// DELETE promo code
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.promoCode.delete({ where: { id: parseInt(String(req.params.id)) } });
        res.json({ message: 'Promo code deleted' });
    }
    catch (error) {
        console.error('Error deleting promo code:', error);
        res.status(500).json({ error: 'Failed to delete promo code' });
    }
}));
exports.default = router;
