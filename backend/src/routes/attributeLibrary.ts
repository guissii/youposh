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

const defaultLibrary = [
    { code: 'size', name: 'Taille', nameAr: 'المقاس', isMulti: true, values: ['XS', 'S', 'M', 'L', 'XL', 'XXL'] },
    { code: 'color', name: 'Couleur', nameAr: 'اللون', isMulti: true, values: ['Noir', 'Blanc', 'Bleu', 'Rouge', 'Vert', 'Beige'] },
    { code: 'shoe_size', name: 'Pointure', nameAr: 'المقاس', isMulti: true, values: ['36', '37', '38', '39', '40', '41', '42'] },
    { code: 'capacity', name: 'Capacité', nameAr: 'السعة', isMulti: true, values: ['64GB', '128GB', '256GB', '512GB'] },
    { code: 'ram', name: 'RAM', nameAr: 'الذاكرة', isMulti: true, values: ['4GB', '8GB', '16GB', '32GB'] },
    { code: 'storage', name: 'Stockage', nameAr: 'التخزين', isMulti: true, values: ['64GB', '128GB', '256GB', '512GB', '1TB'] },
    { code: 'material', name: 'Matière', nameAr: 'الخامة', isMulti: true, values: ['Coton', 'Polyester', 'Cuir', 'Similicuir', 'Métal', 'Plastique'] },
    { code: 'connectivity', name: 'Connectivité', nameAr: 'الاتصال', isMulti: true, values: ['Bluetooth', 'Wi‑Fi', 'USB‑C', 'NFC', '4G', '5G'] },
    { code: 'gender', name: 'Genre', nameAr: 'الجنس', isMulti: true, values: ['Homme', 'Femme', 'Mixte'] },
    { code: 'model', name: 'Modèle', nameAr: 'الموديل', isMulti: true, values: [] },
    { code: 'length', name: 'Longueur', nameAr: 'الطول', isMulti: true, values: [] },
    { code: 'width', name: 'Largeur', nameAr: 'العرض', isMulti: true, values: [] },
    { code: 'height', name: 'Hauteur', nameAr: 'الارتفاع', isMulti: true, values: [] },
    { code: 'weight', name: 'Poids', nameAr: 'الوزن', isMulti: true, values: [] },
    { code: 'volume', name: 'Volume', nameAr: 'الحجم', isMulti: true, values: [] },
];

async function ensureSeed() {
    const count = await prisma.globalAttribute.count();
    if (count > 0) return;
    await prisma.$transaction(async (tx) => {
        for (let i = 0; i < defaultLibrary.length; i++) {
            const a = defaultLibrary[i];
            await tx.globalAttribute.create({
                data: {
                    code: a.code,
                    name: a.name,
                    nameAr: a.nameAr,
                    isMulti: a.isMulti,
                    sortOrder: i,
                    values: {
                        create: a.values.map((v, j) => ({
                            value: v,
                            sortOrder: j,
                        })),
                    },
                },
            });
        }
    });
}

router.get('/', async (_req, res) => {
    try {
        await ensureSeed();
        const attributes = await prisma.globalAttribute.findMany({
            orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
            include: { values: { orderBy: { sortOrder: 'asc' } } },
        });
        res.json(attributes);
    } catch (error) {
        console.error('Error fetching attribute library:', error);
        res.status(500).json({ error: 'Failed to fetch attribute library' });
    }
});

router.post('/', async (req, res) => {
    try {
        const { code, name, nameAr, isMulti, values } = req.body ?? {};
        const finalCode = slugify(code || name);
        if (!finalCode) return res.status(400).json({ error: 'Invalid code' });
        if (!String(name ?? '').trim()) return res.status(400).json({ error: 'Invalid name' });

        const created = await prisma.globalAttribute.create({
            data: {
                code: finalCode,
                name: String(name).trim(),
                nameAr: String(nameAr ?? '').trim(),
                isMulti: isMulti !== false,
                values: {
                    create: Array.isArray(values)
                        ? values.map((v: any, i: number) => ({
                            value: String(v.value ?? v).trim(),
                            valueAr: String(v.valueAr ?? '').trim(),
                            sortOrder: Number.isFinite(Number(v.sortOrder)) ? Number(v.sortOrder) : i,
                        })).filter((v: any) => v.value.length > 0)
                        : [],
                },
            },
            include: { values: { orderBy: { sortOrder: 'asc' } } },
        });
        res.status(201).json(created);
    } catch (error) {
        console.error('Error creating attribute library item:', error);
        res.status(500).json({ error: 'Failed to create attribute' });
    }
});

export default router;
