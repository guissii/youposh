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
// GET all customers
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { search } = req.query;
        const where = {};
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { phone: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
            ];
        }
        const customers = yield prisma.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { orders: true } },
                orders: {
                    orderBy: { createdAt: 'desc' },
                    include: { items: { include: { product: true } } },
                }
            },
        });
        res.json(customers);
    }
    catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
}));
// GET single customer
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customer = yield prisma.customer.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                    include: { items: { include: { product: true } } },
                },
            },
        });
        if (!customer)
            return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
}));
// POST create customer
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const customer = yield prisma.customer.create({
            data: req.body,
        });
        res.status(201).json(customer);
    }
    catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
}));
// DELETE customer
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield prisma.customer.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.json({ message: 'Customer deleted' });
    }
    catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
}));
exports.default = router;
