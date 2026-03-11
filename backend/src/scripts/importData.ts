import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

async function importData() {
    console.log('Starting data import to Supabase...');
    const dataDir = path.join(__dirname, 'data_export');

    try {
        // 1. Clear existing data to avoid conflicts (in case schema push created defaults)
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
        console.log('Cleared existing data.');

        // 2. Import simple tables
        const categories = JSON.parse(fs.readFileSync(path.join(dataDir, 'categories.json'), 'utf-8'));
        if (categories.length > 0) {
            await prisma.category.createMany({ data: categories });
            console.log(`Imported ${categories.length} categories.`);
        }

        const promoCodes = JSON.parse(fs.readFileSync(path.join(dataDir, 'promoCodes.json'), 'utf-8'));
        if (promoCodes.length > 0) {
            // Convert date strings back to Date objects
            const formattedPromos = promoCodes.map((p: any) => ({
                ...p,
                startDate: new Date(p.startDate),
                endDate: p.endDate ? new Date(p.endDate) : null,
                createdAt: new Date(p.createdAt),
                updatedAt: new Date(p.updatedAt)
            }));
            await prisma.promoCode.createMany({ data: formattedPromos });
            console.log(`Imported ${promoCodes.length} promo codes.`);
        }

        const storeSettings = JSON.parse(fs.readFileSync(path.join(dataDir, 'storeSettings.json'), 'utf-8'));
        if (storeSettings.length > 0) {
            const formattedSettings = storeSettings.map((s: any) => ({
                ...s,
                updatedAt: new Date(s.updatedAt)
            }));
            await prisma.storeSettings.createMany({ data: formattedSettings });
            console.log(`Imported store settings.`);
        }

        const heroSettings = JSON.parse(fs.readFileSync(path.join(dataDir, 'heroSettings.json'), 'utf-8'));
        if (heroSettings.length > 0) {
            const formattedHero = heroSettings.map((h: any) => ({
                ...h,
                updatedAt: new Date(h.updatedAt)
            }));
            await prisma.heroSettings.createMany({ data: formattedHero });
            console.log(`Imported hero settings.`);
        }

        // 3. Import nested relations (Attributes)
        const globalAttributes = JSON.parse(fs.readFileSync(path.join(dataDir, 'globalAttributes.json'), 'utf-8'));
        for (const attr of globalAttributes) {
            const { values, ...attrData } = attr;
            await prisma.globalAttribute.create({
                data: {
                    ...attrData,
                    values: {
                        create: values.map((v: any) => {
                            const { id, attributeId, ...valData } = v; // Remove IDs from nested creation
                            return valData;
                        })
                    }
                }
            });
        }
        console.log(`Imported ${globalAttributes.length} global attributes.`);

        // Note: User's categoryAttributes export was 0, but added logic just in case
        const categoryAttributes = JSON.parse(fs.readFileSync(path.join(dataDir, 'categoryAttributes.json'), 'utf-8'));
        for (const attr of categoryAttributes) {
            const { values, ...attrData } = attr;
            await prisma.categoryAttribute.create({
                data: {
                    ...attrData,
                    values: {
                        create: values.map((v: any) => {
                            const { id, attributeId, ...valData } = v;
                            return valData;
                        })
                    }
                }
            });
        }

        // 4. Import Products
        const products = JSON.parse(fs.readFileSync(path.join(dataDir, 'products.json'), 'utf-8'));
        for (const product of products) {
            const { attributeValues, ...productData } = product;

            const formattedProduct = {
                ...productData,
                publishedAt: productData.publishedAt ? new Date(productData.publishedAt) : null,
                createdAt: new Date(productData.createdAt),
                updatedAt: new Date(productData.updatedAt),
            };

            await prisma.product.create({
                data: {
                    ...formattedProduct,
                    attributeValues: {
                        create: attributeValues.map((av: any) => ({
                            attributeValueId: av.attributeValueId
                        }))
                    }
                }
            });
        }
        console.log(`Imported ${products.length} products.`);

        // 5. Import Orders
        const orders = JSON.parse(fs.readFileSync(path.join(dataDir, 'orders.json'), 'utf-8'));
        for (const order of orders) {
            const { items, ...orderData } = order;

            const formattedOrder = {
                ...orderData,
                createdAt: new Date(orderData.createdAt),
                updatedAt: new Date(orderData.updatedAt),
            };

            await prisma.order.create({
                data: {
                    ...formattedOrder,
                    items: {
                        create: items.map((item: any) => {
                            const { id, orderId, ...itemData } = item;
                            return itemData;
                        })
                    }
                }
            });
        }
        console.log(`Imported ${orders.length} orders.`);

        console.log('Data import complete!');
    } catch (error) {
        console.error('Error during import:', error);
    } finally {
        await prisma.$disconnect();
    }
}

importData();
