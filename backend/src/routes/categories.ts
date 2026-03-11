import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

function slugify(input: any): string {
    const s = String(input ?? '').trim().toLowerCase();
    return s
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

const categoryInclude = {
    _count: { select: { products: true } },
    attributes: {
        orderBy: { sortOrder: 'asc' as const },
        include: {
            values: { orderBy: { sortOrder: 'asc' as const } },
        },
    },
};

// GET all categories
router.get('/', async (_req, res) => {
    try {
        const categories = await prisma.category.findMany({
            include: categoryInclude,
        });
        res.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// GET single category (with attributes)
router.get('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const category = await prisma.category.findUnique({
            where: { id },
            include: categoryInclude,
        });
        if (!category) return res.status(404).json({ error: 'Category not found' });
        res.json(category);
    } catch (error) {
        console.error('Error fetching category:', error);
        res.status(500).json({ error: 'Failed to fetch category' });
    }
});

// POST create category
router.post('/', async (req, res) => {
    try {
        const { attributes, ...categoryData } = req.body ?? {};

        const created = await prisma.$transaction(async (tx) => {
            const category = await tx.category.create({ data: categoryData });

            if (Array.isArray(attributes) && attributes.length) {
                for (let i = 0; i < attributes.length; i++) {
                    const a = attributes[i] ?? {};
                    const code = slugify(a.code || a.name) || `attr-${i + 1}`;
                    const globalAttributeId = Number.isFinite(Number(a.globalAttributeId)) ? Number(a.globalAttributeId) : undefined;
                    await tx.categoryAttribute.create({
                        data: {
                            categoryId: category.id,
                            globalAttributeId,
                            code,
                            name: String(a.name ?? ''),
                            nameAr: String(a.nameAr ?? ''),
                            isMulti: a.isMulti !== false,
                            sortOrder: Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : i,
                            values: {
                                create: Array.isArray(a.values)
                                    ? a.values.map((v: any, j: number) => ({
                                        globalValueId: Number.isFinite(Number(v.globalValueId)) ? Number(v.globalValueId) : undefined,
                                        value: String(v.value ?? ''),
                                        valueAr: String(v.valueAr ?? ''),
                                        sortOrder: Number.isFinite(Number(v.sortOrder)) ? Number(v.sortOrder) : j,
                                    })).filter((v: any) => v.value.trim().length > 0)
                                    : [],
                            },
                        },
                    });
                }
            }

            return tx.category.findUnique({
                where: { id: category.id },
                include: categoryInclude,
            });
        });

        res.status(201).json(created);
    } catch (error) {
        console.error('Error creating category:', error);
        res.status(500).json({ error: 'Failed to create category' });
    }
});

// PUT update category
router.put('/:id', async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { attributes, ...categoryData } = req.body ?? {};

        const updated = await prisma.$transaction(async (tx) => {
            await tx.category.update({
                where: { id },
                data: categoryData,
            });

            if (Array.isArray(attributes)) {
                const existingAttrs = await tx.categoryAttribute.findMany({
                    where: { categoryId: id },
                    include: { values: true },
                });

                const keepAttrIds = new Set<number>();

                for (let i = 0; i < attributes.length; i++) {
                    const a = attributes[i] ?? {};
                    const code = slugify(a.code || a.name) || `attr-${i + 1}`;
                    const globalAttributeId = Number.isFinite(Number(a.globalAttributeId)) ? Number(a.globalAttributeId) : undefined;

                    const attrIdFromPayload = Number.isFinite(Number(a.id)) ? Number(a.id) : undefined;
                    const existingSameCode = existingAttrs.find(x => x.code === code);
                    const targetAttrId = attrIdFromPayload ?? existingSameCode?.id;

                    const attr = targetAttrId
                        ? await tx.categoryAttribute.update({
                            where: { id: targetAttrId },
                            data: {
                                globalAttributeId,
                                code,
                                name: String(a.name ?? ''),
                                nameAr: String(a.nameAr ?? ''),
                                isMulti: a.isMulti !== false,
                                sortOrder: Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : i,
                            },
                        })
                        : await tx.categoryAttribute.create({
                            data: {
                                categoryId: id,
                                globalAttributeId,
                                code,
                                name: String(a.name ?? ''),
                                nameAr: String(a.nameAr ?? ''),
                                isMulti: a.isMulti !== false,
                                sortOrder: Number.isFinite(Number(a.sortOrder)) ? Number(a.sortOrder) : i,
                            },
                        });

                    keepAttrIds.add(attr.id);

                    const keepValueIds = new Set<number>();

                    if (Array.isArray(a.values)) {
                        for (let j = 0; j < a.values.length; j++) {
                            const v = a.values[j] ?? {};
                            const valueIdFromPayload = Number.isFinite(Number(v.id)) ? Number(v.id) : undefined;
                            const valueStr = String(v.value ?? '').trim();
                            if (!valueStr) continue;

                            const val = valueIdFromPayload
                                ? await tx.categoryAttributeValue.update({
                                    where: { id: valueIdFromPayload },
                                    data: {
                                        globalValueId: Number.isFinite(Number(v.globalValueId)) ? Number(v.globalValueId) : undefined,
                                        value: valueStr,
                                        valueAr: String(v.valueAr ?? ''),
                                        sortOrder: Number.isFinite(Number(v.sortOrder)) ? Number(v.sortOrder) : j,
                                    },
                                })
                                : await tx.categoryAttributeValue.create({
                                    data: {
                                        attributeId: attr.id,
                                        globalValueId: Number.isFinite(Number(v.globalValueId)) ? Number(v.globalValueId) : undefined,
                                        value: valueStr,
                                        valueAr: String(v.valueAr ?? ''),
                                        sortOrder: Number.isFinite(Number(v.sortOrder)) ? Number(v.sortOrder) : j,
                                    },
                                });

                            keepValueIds.add(val.id);
                        }
                    }

                    await tx.categoryAttributeValue.deleteMany({
                        where: {
                            attributeId: attr.id,
                            ...(keepValueIds.size ? { id: { notIn: [...keepValueIds] } } : {}),
                        },
                    });
                }

                await tx.categoryAttribute.deleteMany({
                    where: {
                        categoryId: id,
                        ...(keepAttrIds.size ? { id: { notIn: [...keepAttrIds] } } : {}),
                    },
                });
            }

            return tx.category.findUnique({
                where: { id },
                include: categoryInclude,
            });
        });

        res.json(updated);
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
