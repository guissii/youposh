import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function exportData() {
    console.log('Starting data export from local database...');
    const dataDir = path.join(__dirname, 'data_export');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir);
    }

    try {
        const categories = await prisma.category.findMany();
        fs.writeFileSync(path.join(dataDir, 'categories.json'), JSON.stringify(categories, null, 2));
        console.log(`Exported ${categories.length} categories.`);

        const globalAttributes = await prisma.globalAttribute.findMany({ include: { values: true } });
        fs.writeFileSync(path.join(dataDir, 'globalAttributes.json'), JSON.stringify(globalAttributes, null, 2));
        console.log(`Exported ${globalAttributes.length} global attributes.`);

        const categoryAttributes = await prisma.categoryAttribute.findMany({ include: { values: true } });
        fs.writeFileSync(path.join(dataDir, 'categoryAttributes.json'), JSON.stringify(categoryAttributes, null, 2));
        console.log(`Exported ${categoryAttributes.length} category attributes.`);

        const products = await prisma.product.findMany({ include: { attributeValues: true } });
        fs.writeFileSync(path.join(dataDir, 'products.json'), JSON.stringify(products, null, 2));
        console.log(`Exported ${products.length} products.`);

        const promoCodes = await prisma.promoCode.findMany();
        fs.writeFileSync(path.join(dataDir, 'promoCodes.json'), JSON.stringify(promoCodes, null, 2));
        console.log(`Exported ${promoCodes.length} promo codes.`);

        const orders = await prisma.order.findMany({ include: { items: true } });
        fs.writeFileSync(path.join(dataDir, 'orders.json'), JSON.stringify(orders, null, 2));
        console.log(`Exported ${orders.length} orders.`);

        const storeSettings = await prisma.storeSettings.findMany();
        fs.writeFileSync(path.join(dataDir, 'storeSettings.json'), JSON.stringify(storeSettings, null, 2));
        console.log(`Exported store settings.`);

        const heroSettings = await prisma.heroSettings.findMany();
        fs.writeFileSync(path.join(dataDir, 'heroSettings.json'), JSON.stringify(heroSettings, null, 2));
        console.log(`Exported hero settings.`);

        console.log('Export complete! All data saved in backend/scripts/data_export/');
    } catch (error) {
        console.error('Error during export:', error);
    } finally {
        await prisma.$disconnect();
    }
}

exportData();
