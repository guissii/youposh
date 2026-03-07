import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// GET all categories
router.get('/', async (_req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: {
                _count: { select: { products: true } }
            },
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// POST create category
router.post('/', async (req, res) => {
    try {
        const category = await prisma.category.create({
            data: req.body,
        });
        res.status(201).json(category);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// PUT update category
router.put('/:id', async (req, res) => {
    try {
        const category = await prisma.category.update({
            where: { id: parseInt(req.params.id) },
            data: req.body,
        });
        res.json(category);
    } catch (error) {
        console.error('Error updating category:', error);
        res.status(500).json({ error: 'Failed to update category' });
    }
});

// DELETE category
router.delete('/:id', async (req, res) => {
    try {
        await prisma.category.delete({
            where: { id: parseInt(req.params.id) },
        });
        res.json({ message: 'Category deleted' });
    } catch (error) {
        console.error('Error deleting category:', error);
        res.status(500).json({ error: 'Failed to delete category' });
    }
});

export default router;
