import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixSequence() {
    try {
        console.log('Fetching max product ID...');
        const result = await prisma.$queryRaw`SELECT MAX(id) as max_id FROM "Product"`;
        const maxId = Number(result[0].max_id) || 0;
        console.log(`Max Product ID is: ${maxId}`);

        if (maxId > 0) {
            console.log(`Setting sequence to ${maxId + 1}...`);
            await prisma.$executeRawUnsafe(`SELECT setval('"Product_id_seq"', ${maxId + 1}, false)`);
            console.log('Sequence updated successfully!');
        } else {
            console.log('No products found, sequence is fine.');
        }
    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

fixSequence();
