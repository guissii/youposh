import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all customers
router.get('/', async (req, res) => {
    try {
        const { search } = req.query;

        const where: any = {};
        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { phone: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
                { city: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const customers = await prisma.customer.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            include: {
                _count: { select: { orders: true } },
                orders: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    select: { id: true, total: true, status: true, createdAt: true },
                }
            },
        });
        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers:', error);
        res.status(500).json({ error: 'Failed to fetch customers' });
    }
});

// GET single customer
router.get('/:id', async (req, res) => {
    try {
        const customer = await prisma.customer.findUnique({
            where: { id: parseInt(req.params.id) },
            include: {
                orders: {
                    orderBy: { createdAt: 'desc' },
                    include: { items: { include: { product: true } } },
                },
            },
        });
        if (!customer) return res.status(404).json({ error: 'Customer not found' });
        res.json(customer);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch customer' });
    }
});

// POST create customer
router.post('/', async (req, res) => {
    try {
        const customer = await prisma.customer.create({
            data: req.body,
        });
        res.status(201).json(customer);
    } catch (error) {
        console.error('Error creating customer:', error);
        res.status(500).json({ error: 'Failed to create customer' });
    }
});

// DELETE customer
router.delete('/:id', async (req, res) => {
    try {
        await prisma.customer.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.json({ message: 'Customer deleted' });
    } catch (error) {
        console.error('Error deleting customer:', error);
        res.status(500).json({ error: 'Failed to delete customer' });
    }
});

export default router;
