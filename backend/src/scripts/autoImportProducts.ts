import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Données enrichies générées par l'IA Vision (Vibecoder) simulant le formulaire complet
const AI_PRODUCT_DATA: Record<string, any> = {
    "produit 1 99 ancien 200": {
        name: "Réchaud de Camping Pliable",
        nameAr: "موقد تخييم قابل للطي",
        description: "Réchaud de camping compact, puissant et ultra-portable.",
        descriptionAr: "موقد تخييم مدمج وقوي وسهل الحمل.",
        categorySlug: "maison-cuisine",
        features: ["Ultra-compact", "Design intelligent", "Puissant", "Portable"]
    },
    "produit 119  200": {
        name: "Raquette Anti-Moustique Rechargeable",
        nameAr: "مضرب كهربائي لقتل البعوض قابل لإعادة الشحن",
        description: "Raquette anti-moustique électrique rechargeable avec socle de charge.",
        descriptionAr: "مضرب كهربائي لقتل البعوض مع قاعدة شحن.",
        categorySlug: "maison-cuisine",
        features: ["Rechargeable USB", "Socle automatique", "Sécurisé", "Haute Qualité"]
    },
    "produit 2   69  ancien 100": {
        name: "Râpe Électrique Soin des Pieds",
        nameAr: "جهاز كهربائي للعناية بالقدمين",
        description: "Râpe électrique sans fil pour soins des pieds.",
        descriptionAr: "جهاز كهربائي لاسلكي للعناية بالقدمين وإزالة الجلد الميت.",
        categorySlug: "beaute-sante",
        features: ["Sans fil", "Rechargeable", "Lumière LED intégrée", "2 Vitesses"]
    },
    "produit 4 149  230": {
        name: "Présentoir à Épices Rotatif",
        nameAr: "حامل توابل دوار",
        description: "Présentoir à épices rotatif pour cuisine parfaitement organisée.",
        descriptionAr: "حامل توابل دوار لتنظيم المطبخ بشكل مثالي.",
        categorySlug: "maison-cuisine",
        features: ["Rotatif", "Design moderne", "Gain de place", "Haute Qualité"]
    },
    "produit 5 99   200": {
        name: "Aspirateur Points Noirs",
        nameAr: "جهاز شفط الرؤوس السوداء",
        description: "Aspirateur points noirs électrique avec embouts interchangeables.",
        descriptionAr: "جهاز كهربائي لشفط الرؤوس السوداء مع رؤوس قابلة للتبديل.",
        categorySlug: "beaute-sante",
        features: ["Sans fil", "Multi-embouts", "Nettoyage profond", "Rechargeable"]
    },
    "produit 6   99    200": {
        name: "Casque de Réalité Virtuelle VR",
        nameAr: "نظارات الواقع الافتراضي",
        description: "Casque de réalité virtuelle 3D pour smartphone VR.",
        descriptionAr: "نظارات الواقع الافتراضي ثلاثية الأبعاد للهواتف الذكية.",
        categorySlug: "electronique",
        features: ["Vision 3D", "Confortable", "Ajustable", "Compatible Smartphone"]
    },
    "produit 7  59   99": {
        name: "Épilateur Sourcils Électrique",
        nameAr: "جهاز إزالة شعر الحواجب",
        description: "Épilateur à sourcils électrique, indolore, rechargeable et précis.",
        descriptionAr: "مزيل شعر الحواجب كهربائي دقيق وبدون ألم.",
        categorySlug: "beaute-sante",
        features: ["Sans douleur", "Précis", "Rechargeable USB", "Portable"]
    },
    "produit 8 149  250": {
        name: "Hydropulseur Dentaire Portable",
        nameAr: "جهاز تنظيف الأسنان بالماء",
        description: "Hydropulseur dentaire portable pour hygiène buccale optimale.",
        descriptionAr: "جهاز محمول لتنظيف الأسنان بالماء لعناية فائقة.",
        categorySlug: "beaute-sante",
        features: ["Étanche (IPX7)", "Rechargeable", "Multi-vitesses", "Portable"]
    }
};

async function main() {
    const rootDir = "C:\\Users\\MSI\\Pictures\\chat gpt\\prob3\\9moool\\tiroire\\ch3r lahrech\\zeema rani zwina\\sokar halalwa\\papier couisson\\epices\\tabouret\\rjilat\\chakoch\\tsbaan\\tension\\glose\\recho\\shiiit\\lforma\\sechouar\\linge\\picala";
    const uploadDir = "C:\\Users\\MSI\\Desktop\\you shop\\backend\\uploads\\products";

    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Créer des catégories de base si elles n'existent pas
    const categoriesToEnsure = [
        { slug: "beaute-sante", name: "Beauté & Santé", nameAr: "الصحة والجمال" },
        { slug: "maison-cuisine", name: "Maison & Cuisine", nameAr: "المنزل والمطبخ" },
        { slug: "electronique", name: "Électronique", nameAr: "إلكترونيات" }
    ];

    for (const cat of categoriesToEnsure) {
        await prisma.category.upsert({
            where: { slug: cat.slug },
            update: {},
            create: { slug: cat.slug, name: cat.name, nameAr: cat.nameAr }
        });
    }

    const folders = fs.readdirSync(rootDir).filter(f => fs.statSync(path.join(rootDir, f)).isDirectory());

    for (const folder of folders) {
        const numbers = folder.match(/\d+/g);
        let price = 0;
        let originalPrice = 0;

        if (numbers) {
            if (numbers.length >= 3) {
                price = parseInt(numbers[1]);
                originalPrice = parseInt(numbers[2]);
            } else if (numbers.length === 2) {
                price = parseInt(numbers[0]);
                originalPrice = parseInt(numbers[1]);
            }
        }

        const aiData = AI_PRODUCT_DATA[folder];
        if (!aiData) continue;

        const stock = Math.random() < 0.5 ? 30 : 50; // Stock demandé
        const sku = `PROD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const folderPath = path.join(rootDir, folder);
        const files = fs.readdirSync(folderPath).filter(f => f.match(/\.(jpg|jpeg|png|webp|gif)$/i));
        
        const uploadedPaths: string[] = [];
        for (const file of files) {
            const ext = path.extname(file);
            const newName = `auto-import-${Date.now()}-${Math.floor(Math.random() * 1000)}${ext}`;
            const sourcePath = path.join(folderPath, file);
            const targetPath = path.join(uploadDir, newName);
            fs.copyFileSync(sourcePath, targetPath);
            uploadedPaths.push(`/uploads/products/${newName}`);
        }

        if (uploadedPaths.length === 0) continue;

        const primaryImage = uploadedPaths[0];
        const galleryImages = uploadedPaths.slice(1);

        // Insertion complète comme le formulaire admin
        const product = await prisma.product.create({
            data: {
                name: aiData.name,
                nameAr: aiData.nameAr,
                price: price,
                originalPrice: originalPrice,
                description: aiData.description,
                descriptionAr: aiData.descriptionAr,
                categorySlug: aiData.categorySlug,
                features: aiData.features,
                stock: stock,
                inStock: stock > 0,
                isVisible: true,
                status: "published",
                isFeatured: true,
                image: primaryImage,
                images: galleryImages,
                sku: sku
            }
        });

        console.log(`✅ Produit Créé Complet: ${aiData.name} (${aiData.nameAr}) | Prix: ${price} | Stock: ${stock}`);
    }

    console.log("🎉 Importation complète (type formulaire Admin) terminée !");
}

main()
    .catch(e => {
        console.error("❌ Erreur lors de l'importation:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
