import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

async function main() {
    const sourceDir = "c:\\Users\\MSI\\Desktop\\you shop\\dist\\images\\produit reel\\produit1";
    const targetDir = "c:\\Users\\MSI\\Desktop\\you shop\\backend\\uploads\\products";

    if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
    }

    const files = fs.readdirSync(sourceDir);
    const uploadedPaths: string[] = [];

    for (const file of files) {
        const ext = path.extname(file);
        const newName = `produit-reel-${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
        const sourcePath = path.join(sourceDir, file);
        const targetPath = path.join(targetDir, newName);

        fs.copyFileSync(sourcePath, targetPath);
        uploadedPaths.push(`/uploads/products/${newName}`);
    }

    if (uploadedPaths.length === 0) {
        console.log("No images found.");
        return;
    }

    const primaryImage = uploadedPaths[0];
    const galleryImages = uploadedPaths.slice(1);

    const product = await prisma.product.create({
        data: {
            name: "Nouveau Produit Importer (1)",
            nameAr: "منتج جديد مستورد (1)",
            price: 199,
            image: primaryImage,
            images: galleryImages,
            description: "Modifiez cette description à l'aide de l'outil de génération IA.",
            descriptionAr: "قم بتعديل هذا الوصف باستخدام أداة التوليد بالذكاء الاصطناعي.",
            inStock: true,
            isVisible: true,
            stock: 10,
        }
    });

    console.log(`Successfully created product ID ${product.id} with ${uploadedPaths.length} images.`);
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
