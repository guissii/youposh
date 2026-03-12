import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Updating StoreSettings phone number...");
    try {
        const settings = await prisma.storeSettings.update({
            where: { id: 1 },
            data: { phone: '+212 690-939090' }
        });
        console.log("Updated successfully:", settings.phone);
    } catch (error) {
        console.error("Error updating (maybe doesn't exist yet):", error.message);
    }
}

main()
    .catch(e => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
