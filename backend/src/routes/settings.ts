import express from 'express';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { cacheMiddleware, clearCache } from '../utils/cache';

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

router.get('/store', cacheMiddleware(60), async (req, res) => {
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
        clearCache();
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
        clearCache();
        res.json(settings);
    } catch (error) {
        console.error('Error updating watermark status:', error);
        res.status(500).json({ error: 'Failed to update watermark status' });
    }
});

// ── Hero Settings ──

router.get('/hero', cacheMiddleware(60), async (req, res) => {
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
        clearCache();
        res.json(settings);
    } catch (error) {
        console.error('Error updating hero settings:', error);
        res.status(500).json({ error: 'Failed to update hero settings' });
    }
});

// ── Backup and Restore ──
import archiver from 'archiver';
import fs from 'fs';
import path from 'path';

router.get('/backup/export', async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        
        // 1. Gather all database data
        const dbData = {
            categories: await prisma.category.findMany(),
            products: await prisma.product.findMany(),
            globalAttributes: await prisma.globalAttribute.findMany(),
            globalAttributeValues: await prisma.globalAttributeValue.findMany(),
            categoryAttributes: await prisma.categoryAttribute.findMany(),
            categoryAttributeValues: await prisma.categoryAttributeValue.findMany(),
            productAttributeValues: await prisma.productAttributeValue.findMany(),
            promoCodes: await prisma.promoCode.findMany(),
            orders: await prisma.order.findMany(),
            orderItems: await prisma.orderItem.findMany(),
            storeSettings: await prisma.storeSettings.findMany(),
            heroSettings: await prisma.heroSettings.findMany()
        };

        const date = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `youposh_backup_complet_${date}.zip`;

        // 2. Set headers for ZIP download in Chrome
        res.setHeader('Content-disposition', `attachment; filename=${filename}`);
        res.setHeader('Content-type', 'application/zip');

        // 3. Initialize Archiver (ZIP creator)
        const archive = archiver('zip', { zlib: { level: 5 } }); // Level 5 compression (good balance)

        archive.on('error', (err) => {
            console.error('Archive error:', err);
            if (!res.headersSent) res.status(500).json({ error: 'Failed to create zip' });
        });

        // Pipe the zip directly to the Chrome download stream
        archive.pipe(res);

        // 4. Add the Database JSON file to the zip
        archive.append(JSON.stringify(dbData, null, 2), { name: 'database_youposh.json' });

        // 5. Add the .env file (Credentials) if it exists
        const envPath = path.resolve(process.cwd(), '.env');
        if (fs.existsSync(envPath)) {
            archive.file(envPath, { name: '.env' });
        }

        // 6. Add the README instructions
        const readmeContent = `======================================================
SAUVEGARDE TOTALE YOUPOSH - ${date}
======================================================
Cette archive contient l'intégralité de votre site.

QUE CONTIENT CE DOSSIER ?
1. database_youposh.json : Vos produits, commandes et paramètres.
2. uploads/ : Toutes vos images (produits, catégories) et vidéos.
3. .env : Vos mots de passe (Base de données, JWT).

COMMENT RESTAURER CETTE SAUVEGARDE ?
------------------------------------------------------
Allez dans le panneau d'administration de votre site (Paramètres).
Utilisez le bouton "Restaurer une Sauvegarde" et sélectionnez
le fichier "database_youposh.json" qui se trouve dans ce dossier zip.

Pour restaurer les images, copiez simplement le dossier "uploads"
sur votre serveur via WinSCP dans /var/www/youposh/backend/
======================================================`;
        archive.append(readmeContent, { name: 'LISEZ_MOI_POUR_RESTAURER.txt' });

        // 7. Add the entire uploads folder (Images & Videos)
        const uploadsPath = path.resolve(process.cwd(), 'uploads');
        if (fs.existsSync(uploadsPath)) {
            archive.directory(uploadsPath, 'uploads');
        }

        // 8. Finalize the zip and send it to the browser
        await archive.finalize();

    } catch (error) {
        console.error('Error during backup export:', error);
        if (!res.headersSent) res.status(500).json({ error: 'Failed to export backup' });
    }
});

// For restore we need multer to handle the file upload
import multer from 'multer';
import unzipper from 'unzipper';

// We allow large files for the ZIP upload (e.g. 500MB)
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 500 * 1024 * 1024 } });

router.post('/backup/import', upload.single('backup'), async (req, res) => {
    try {
        if (!requireAdmin(req, res)) return;
        
        const file = (req as any).file;
        if (!file) {
            return res.status(400).json({ error: 'No backup file provided' });
        }

        // 1. Unzip the file in memory
        const directory = await unzipper.Open.buffer(file.buffer);
        
        // 2. Find the database JSON file
        const dbFile = directory.files.find(d => d.path === 'database_youposh.json' || d.path.endsWith('.json'));
        
        if (!dbFile) {
            return res.status(400).json({ error: 'Fichier de base de données introuvable dans le ZIP.' });
        }

        const dbBuffer = await dbFile.buffer();
        const data = JSON.parse(dbBuffer.toString('utf-8'));

        // 3. Import logic for Database
        await prisma.$transaction([
            prisma.orderItem.deleteMany(),
            prisma.order.deleteMany(),
            prisma.productAttributeValue.deleteMany(),
            prisma.categoryAttributeValue.deleteMany(),
            prisma.globalAttributeValue.deleteMany(),
            prisma.categoryAttribute.deleteMany(),
            prisma.globalAttribute.deleteMany(),
            prisma.product.deleteMany(),
            prisma.category.deleteMany(),
            prisma.promoCode.deleteMany(),
            prisma.storeSettings.deleteMany(),
            prisma.heroSettings.deleteMany(),
        ]);

        if (data.categories?.length > 0) await prisma.category.createMany({ data: data.categories });
        
        if (data.promoCodes?.length > 0) {
            const promoCodes = data.promoCodes.map((p: any) => ({
                ...p,
                startDate: new Date(p.startDate),
                endDate: p.endDate ? new Date(p.endDate) : null,
                createdAt: new Date(p.createdAt),
                updatedAt: new Date(p.updatedAt)
            }));
            await prisma.promoCode.createMany({ data: promoCodes });
        }

        if (data.products?.length > 0) {
            const products = data.products.map((p: any) => ({
                ...p,
                publishedAt: p.publishedAt ? new Date(p.publishedAt) : null,
                createdAt: new Date(p.createdAt),
                updatedAt: new Date(p.updatedAt)
            }));
            await prisma.product.createMany({ data: products });
        }

        if (data.globalAttributes?.length > 0) await prisma.globalAttribute.createMany({ data: data.globalAttributes });
        if (data.globalAttributeValues?.length > 0) await prisma.globalAttributeValue.createMany({ data: data.globalAttributeValues });
        if (data.categoryAttributes?.length > 0) await prisma.categoryAttribute.createMany({ data: data.categoryAttributes });
        if (data.categoryAttributeValues?.length > 0) await prisma.categoryAttributeValue.createMany({ data: data.categoryAttributeValues });
        if (data.productAttributeValues?.length > 0) await prisma.productAttributeValue.createMany({ data: data.productAttributeValues });

        if (data.orders?.length > 0) {
            const orders = data.orders.map((o: any) => ({
                ...o,
                createdAt: new Date(o.createdAt),
                updatedAt: new Date(o.updatedAt)
            }));
            await prisma.order.createMany({ data: orders });
        }

        if (data.orderItems?.length > 0) await prisma.orderItem.createMany({ data: data.orderItems });
        if (data.storeSettings?.length > 0) await prisma.storeSettings.createMany({ data: data.storeSettings });
        if (data.heroSettings?.length > 0) await prisma.heroSettings.createMany({ data: data.heroSettings });

        // 4. Restore images (Extract 'uploads' folder from ZIP to the server disk)
        const uploadsDest = path.resolve(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDest)) {
            fs.mkdirSync(uploadsDest, { recursive: true });
        }

        for (const fileInZip of directory.files) {
            if (fileInZip.path.startsWith('uploads/') && fileInZip.type === 'File') {
                const relativePath = fileInZip.path.replace('uploads/', '');
                const fullDestPath = path.join(uploadsDest, relativePath);
                
                // Ensure directory exists
                const dir = path.dirname(fullDestPath);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

                // Write file
                const buffer = await fileInZip.buffer();
                fs.writeFileSync(fullDestPath, buffer);
            }
        }

        clearCache();
        res.json({ message: 'Backup complet restauré avec succès !' });
    } catch (error: any) {
        console.error('Error during backup import:', error);
        res.status(500).json({ error: `Failed to restore backup: ${error.message}` });
    }
});

export default router;
