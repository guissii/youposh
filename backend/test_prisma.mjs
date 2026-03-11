import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const payload = {
            "name": "Test Real Error",
            "nameAr": "",
            "price": 50,
            "originalPrice": null,
            "stock": 5,
            "categorySlug": "",
            "description": "Desc",
            "descriptionAr": "",
            "image": "",
            "images": [],
            "sku": "SKU-1",
            "tags": [],
            "features": [],
            "variants": [],
            "status": "published",
            "isVisible": true,
            "isNew": true,
            "isPopular": false,
            "isBestSeller": false,
            "isFeatured": false,
            "publishedAt": "2026-03-09T00:00:00.000Z",
            "sortOrder": 0
        };
        const product = await prisma.product.create({ data: payload });
        console.log("Success:", product.id);
    } catch (err) {
        console.dir(err, { depth: null });
    } finally {
        await prisma.$disconnect();
    }
}
main();
