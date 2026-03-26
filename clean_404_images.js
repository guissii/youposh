const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const https = require('https');

function checkUrlexists(url) {
    return new Promise((resolve) => {
        if (!url || !url.startsWith('https')) return resolve(true); // only check https
        https.get(url, (res) => {
            res.resume(); // consume response body to free up memory
            resolve(res.statusCode === 200 || res.statusCode === 304);
        }).on('error', () => resolve(false));
    });
}

async function run() {
    console.log("Checking all products for Cloudflare 404 images...");
    const products = await prisma.product.findMany();
    let fixed = 0;

    for (const p of products) {
        let changed = false;
        const validImages = [];

        if (p.images && Array.isArray(p.images)) {
            for (const url of p.images) {
                const isOk = await checkUrlexists(url);
                if (isOk) {
                    validImages.push(url);
                } else {
                    console.log(`[ID: ${p.id}] Removing 404 Gallery Image:`, url);
                    changed = true;
                }
            }
        }

        let newHero = p.image;
        if (newHero) {
            const isOk = await checkUrlexists(newHero);
            if (!isOk) {
                console.log(`[ID: ${p.id}] Main image 404! Removing:`, newHero);
                changed = true;
                if (validImages.length > 0) {
                    newHero = validImages.shift();
                    console.log(`[ID: ${p.id}] Promoted gallery image to main:`, newHero);
                } else {
                    newHero = "";
                }
            }
        }

        if (changed) {
            await prisma.product.update({
                where: { id: p.id },
                data: { image: newHero, images: validImages }
            });
            fixed++;
        }
    }
    console.log('Total products cleaned:', fixed);
}
run().catch(console.error).finally(() => prisma.$disconnect());
