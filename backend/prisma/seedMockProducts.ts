import { PrismaClient } from '@prisma/client';
import { categories, products } from '../../src/data/products';

const prisma = new PrismaClient();

async function main() {
    console.log('🔄 Démarrage du seed... Insertion des données frontend dans PostgreSQL.');

    // 1. Inserer les catégories
    console.log(`\n📂 Insertion de ${categories.length} catégories...`);
    for (const cat of categories) {
        const exists = await prisma.category.findUnique({
            where: { slug: cat.slug }
        });

        if (!exists) {
            await prisma.category.create({
                data: {
                    name: cat.name,
                    nameAr: cat.nameAr,
                    icon: cat.icon,
                    image: cat.image,
                    slug: cat.slug,
                }
            });
            console.log(`  ✅ Catégorie créée: ${cat.name}`);
        } else {
            console.log(`  ⏩ Catégorie existante (ignorée): ${cat.name}`);
        }
    }

    // 2. Inserer les produits
    console.log(`\n🛍️ Insertion de ${products.length} produits...`);
    for (const prod of products) {
        const exists = await prisma.product.findFirst({
            where: { sku: prod.sku }
        });

        if (!exists) {
            await prisma.product.create({
                data: {
                    name: prod.name,
                    nameAr: prod.nameAr,
                    price: prod.price,
                    originalPrice: prod.originalPrice,
                    image: prod.image,
                    images: prod.images,
                    rating: prod.rating,
                    reviews: prod.reviews,
                    categorySlug: prod.category,
                    description: prod.description,
                    descriptionAr: prod.descriptionAr,
                    inStock: prod.inStock,
                    sku: prod.sku,
                    tags: prod.tags ?? [],
                    variants: prod.variants ? JSON.parse(JSON.stringify(prod.variants)) : [],
                    features: prod.features ?? [],
                    status: prod.status || 'published',
                    isVisible: prod.isVisible ?? true,
                    isNew: prod.isNew ?? false,
                    isPopular: prod.isPopular ?? false,
                    isBestSeller: prod.isBestSeller ?? false,
                    isFeatured: prod.isFeatured ?? false,
                    salesCount: prod.salesCount ?? 0,
                    stock: 100, // default stock assigned
                    createdAt: prod.publishedAt ? new Date(prod.publishedAt) : new Date(),
                }
            });
            console.log(`  ✅ Produit créé: ${prod.name}`);
        } else {
            console.log(`  ⏩ Produit (SKU) existant (ignorée): ${prod.name}`);
        }
    }
}

main()
    .catch((e) => {
        console.error('❌ Erreur durant le script de seed:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
        console.log('\n✅ Script de seed complété ! Tous les faux produits sont maintenant dans la base de données.');
    });
