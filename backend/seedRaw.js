const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const categories = [
    { id: 1, name: 'Électronique & Gadgets', nameAr: 'إلكترونيات وأدوات', icon: 'Smartphone', image: '/images/categories/electronics.jpg', slug: 'electronique' },
    { id: 2, name: 'Maison & Cuisine', nameAr: 'منزل ومطبخ', icon: 'Home', image: '/images/categories/home.jpg', slug: 'maison' },
    { id: 3, name: 'Beauté & Bien-être', nameAr: 'جمال وعناية', icon: 'Sparkles', image: '/images/categories/beauty.jpg', slug: 'beaute' },
    { id: 4, name: 'Mode & Accessoires', nameAr: 'أزياء وإكسسوارات', icon: 'Shirt', image: '/images/categories/fashion.jpg', slug: 'mode' },
    { id: 5, name: 'Auto & Moto', nameAr: 'سيارات ودراجات', icon: 'Car', image: '/images/categories/electronics.jpg', slug: 'auto' },
    { id: 6, name: 'Gaming', nameAr: 'ألعاب', icon: 'Gamepad2', image: '/images/categories/electronics.jpg', slug: 'gaming' },
    { id: 7, name: 'Cadeaux', nameAr: 'هدايا', icon: 'Gift', image: '/images/categories/fashion.jpg', slug: 'cadeaux' },
    { id: 8, name: 'Enfants & Jouets', nameAr: 'أطفال وألعاب', icon: 'Baby', image: '/images/categories/fashion.jpg', slug: 'jouets' },
];

const products = [
    {
        id: 1, name: 'Écouteurs Bluetooth ANC', nameAr: 'سماعات بلوتوث ANC', price: 299, originalPrice: 450,
        image: '/images/products/headphones.jpg', images: ['/images/products/headphones.jpg', '/images/products/headphones.jpg', '/images/products/headphones.jpg'],
        rating: 4.8, reviews: 328, category: 'electronique',
        description: 'Écouteurs sans fil avec réduction active du bruit. Autonomie 30h, son haute qualité.',
        descriptionAr: 'سماعات لاسلكية مع إلغاء الضوضاء النشط. بطارية 30 ساعة، صوت عالي الجودة.',
        inStock: true, sku: 'ECO-BT-001', tags: ['audio', 'bluetooth', 'sans-fil'],
        variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Noir', 'Blanc', 'Bleu'] }],
        features: ['Réduction bruit ANC', '30h autonomie', 'Bluetooth 5.3', 'Charge rapide'],
        status: 'published', isVisible: true, isNew: false, isPopular: true, isBestSeller: true, isFeatured: true,
        salesCount: 1250, publishedAt: '2025-11-15T10:00:00Z', sortOrder: 1,
    },
    {
        id: 2, name: 'Smartwatch Pro', nameAr: 'ساعة ذكية برو', price: 399, originalPrice: 599,
        image: '/images/products/smartwatch.jpg', images: ['/images/products/smartwatch.jpg', '/images/products/smartwatch.jpg'],
        rating: 4.9, reviews: 512, category: 'electronique',
        description: 'Montre connectée avec GPS, cardio, suivi sommeil. Écran AMOLED.',
        descriptionAr: 'ساعة ذكية مع GPS، معدل ضربات القلب، تتبع النوم. شاشة AMOLED.',
        inStock: true, sku: 'WATCH-PRO-002', tags: ['smartwatch', 'fitness', 'sante'],
        variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Noir', 'Rose', 'Argent'] }],
        features: ['GPS intégré', 'Cardio 24/7', 'Étanche 50m', '100+ sports'],
        status: 'published', isVisible: true, isNew: false, isPopular: true, isBestSeller: true, isFeatured: true,
        salesCount: 2100, publishedAt: '2025-10-20T10:00:00Z', sortOrder: 2,
    },
    {
        id: 3, name: 'PowerBank 20000mAh', nameAr: 'باور بانك 20000mAh', price: 149, originalPrice: 250,
        image: '/images/products/powerbank.jpg', images: ['/images/products/powerbank.jpg'],
        rating: 4.6, reviews: 189, category: 'electronique',
        description: 'Batterie externe ultra-capacité avec charge rapide 65W.',
        descriptionAr: 'بطارية خارجية عالية السعة مع شحن سريع 65 واط.',
        inStock: true, sku: 'PWR-20K-003', tags: ['powerbank', 'chargeur', 'portable'],
        variants: [], features: ['20000mAh', 'Charge rapide 65W', '3 ports USB', 'Écran LED'],
        status: 'published', isVisible: true, isNew: false, isPopular: true, isBestSeller: false, isFeatured: false,
        salesCount: 890, publishedAt: '2025-12-05T10:00:00Z', sortOrder: 5,
    },
    {
        id: 4, name: 'Lampe LED Bureau', nameAr: 'مصباح LED مكتبي', price: 129, originalPrice: 199,
        image: '/images/products/desklamp.jpg', images: ['/images/products/desklamp.jpg'],
        rating: 4.7, reviews: 145, category: 'maison',
        description: 'Lampe de bureau LED avec variateur, port USB, protection yeux.',
        descriptionAr: 'مصباح مكتبي LED مع خافت، منفذ USB، حماية العيون.',
        inStock: true, sku: 'LAMP-LED-004', tags: ['lampe', 'bureau', 'maison'],
        variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Blanc', 'Noir'] }],
        features: ['5 modes lumière', 'Protection yeux', 'Port USB', 'Flexible'],
        status: 'published', isVisible: true, isNew: true, isPopular: false, isBestSeller: false, isFeatured: false,
        salesCount: 320, publishedAt: '2026-02-20T10:00:00Z', sortOrder: 10,
    },
    {
        id: 5, name: 'Enceinte Bluetooth', nameAr: 'سماعة بلوتوث', price: 179, originalPrice: 299,
        image: '/images/products/speaker.jpg', images: ['/images/products/speaker.jpg'],
        rating: 4.5, reviews: 234, category: 'electronique',
        description: 'Enceinte portable waterproof avec basses puissantes.',
        descriptionAr: 'سماعة محمولة مقاومة للماء مع جهير قوي.',
        inStock: true, sku: 'SPK-BT-005', tags: ['enceinte', 'audio', 'portable'],
        variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Noir', 'Rouge', 'Bleu'] }],
        features: ['Waterproof IPX7', '20h autonomie', 'Basses puissantes', 'Micro intégré'],
        status: 'published', isVisible: true, isNew: false, isPopular: true, isBestSeller: false, isFeatured: false,
        salesCount: 780, publishedAt: '2025-11-10T10:00:00Z', sortOrder: 6,
    },
    {
        id: 6, name: 'Support Téléphone Voiture', nameAr: 'حامل هاتف للسيارة', price: 79, originalPrice: 129,
        image: '/images/products/car-mount.jpg', images: ['/images/products/car-mount.jpg'],
        rating: 4.4, reviews: 567, category: 'auto',
        description: 'Support universel avec ventouse puissante et rotation 360°.',
        descriptionAr: 'حامل عالمي مع كوب شفط قوي ودوران 360 درجة.',
        inStock: true, sku: 'CAR-SUP-006', tags: ['auto', 'support', 'telephone'],
        variants: [], features: ['Rotation 360°', 'Ventouse puissante', 'Universel', 'Facile installer'],
        status: 'published', isVisible: true, isNew: false, isPopular: true, isBestSeller: true, isFeatured: false,
        salesCount: 1500, publishedAt: '2025-09-01T10:00:00Z', sortOrder: 3,
    },
    {
        id: 7, name: 'USB-C Hub 7-en-1', nameAr: 'موزع USB-C 7 في 1', price: 249, originalPrice: 399,
        image: '/images/products/usbhub.jpg', images: ['/images/products/usbhub.jpg'],
        rating: 4.7, reviews: 178, category: 'electronique',
        description: 'Hub multiport avec HDMI 4K, USB 3.0, SD, charge 100W.',
        descriptionAr: 'موزع متعدد المنافذ مع HDMI 4K، USB 3.0، SD، شحن 100 واط.',
        inStock: true, sku: 'HUB-7IN1-007', tags: ['usb', 'hub', 'informatique'],
        variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Gris', 'Argent'] }],
        features: ['HDMI 4K', '3x USB 3.0', 'Lecteur SD', 'Charge 100W'],
        status: 'published', isVisible: true, isNew: true, isPopular: false, isBestSeller: false, isFeatured: false,
        salesCount: 450, publishedAt: '2026-02-25T10:00:00Z', sortOrder: 11,
    },
    {
        id: 8, name: 'Souris Ergonomique', nameAr: 'فأرة مريحة', price: 99, originalPrice: 159,
        image: '/images/products/mouse.jpg', images: ['/images/products/mouse.jpg'],
        rating: 4.6, reviews: 289, category: 'electronique',
        description: 'Souris sans fil verticale, confort maximale, réduction douleurs.',
        descriptionAr: 'فأرة لاسلكية عمودية، راحة قصوى، تقليل الآلام.',
        inStock: true, sku: 'MOUSE-ERG-008', tags: ['souris', 'ergonomique', 'bureau'],
        variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Noir', 'Gris'] }],
        features: ['Design vertical', 'Sans fil 2.4G', '2400 DPI', 'Confort max'],
        status: 'published', isVisible: true, isNew: true, isPopular: false, isBestSeller: false, isFeatured: false,
        salesCount: 380, publishedAt: '2026-03-01T10:00:00Z', sortOrder: 12,
    },
    {
        id: 9, name: 'Projecteur Étoiles', nameAr: 'جهاز عرض النجوم', price: 199, originalPrice: 349,
        image: '/images/products/night-light.jpg', images: ['/images/products/night-light.jpg'],
        rating: 4.9, reviews: 412, category: 'maison',
        description: 'Projecteur ciel étoilé avec télécommande, musique, minuterie.',
        descriptionAr: 'جهاز عرض السماء المرصعة بالنجوم مع ريموت كنترول، موسيقى، مؤقت.',
        inStock: true, sku: 'PROJ-STAR-009', tags: ['deco', 'lumiere', 'maison'],
        variants: [], features: ['16 couleurs', 'Télécommande', 'Bluetooth', 'Minuterie'],
        status: 'published', isVisible: true, isNew: true, isPopular: true, isBestSeller: true, isFeatured: true,
        salesCount: 920, publishedAt: '2026-02-10T10:00:00Z', sortOrder: 4,
    },
    {
        id: 10, name: 'Support Téléphone Pliable', nameAr: 'حامل هاتف قابل للطي', price: 59, originalPrice: 99,
        image: '/images/products/foldable-stand.jpg', images: ['/images/products/foldable-stand.jpg'],
        rating: 4.5, reviews: 678, category: 'electronique',
        description: 'Support aluminium pliable, angle réglable, compact.',
        descriptionAr: 'حامل ألومنيوم قابل للطي، زاوية قابلة للتعديل، مضغوط.',
        inStock: true, sku: 'STAND-FLD-010', tags: ['support', 'telephone', 'bureau'],
        variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Argent', 'Noir', 'Or'] }],
        features: ['Aluminium', 'Angle réglable', 'Pliable', 'Universel'],
        status: 'published', isVisible: true, isNew: false, isPopular: true, isBestSeller: false, isFeatured: false,
        salesCount: 1100, publishedAt: '2025-10-01T10:00:00Z', sortOrder: 7,
    },
    {
        id: 11, name: 'Récepteur Bluetooth 5.0', nameAr: 'مستقبل بلوتوث 5.0', price: 89, originalPrice: 149,
        image: '/images/products/bt-receiver.jpg', images: ['/images/products/bt-receiver.jpg'],
        rating: 4.4, reviews: 156, category: 'electronique',
        description: 'Adaptateur audio Bluetooth pour voiture et chaîne HiFi.',
        descriptionAr: 'محول صوت بلوتوث للسيارة ونظام الصوت HiFi.',
        inStock: true, sku: 'BT-REC-011', tags: ['bluetooth', 'audio', 'voiture'],
        variants: [], features: ['Bluetooth 5.0', 'Autonomie 10h', 'Micro intégré', 'Facile utiliser'],
        status: 'published', isVisible: true, isNew: true, isPopular: false, isBestSeller: false, isFeatured: false,
        salesCount: 280, publishedAt: '2026-02-28T10:00:00Z', sortOrder: 13,
    },
    {
        id: 12, name: 'Chargeur Sans Fil', nameAr: 'شاحن لاسلكي', price: 119, originalPrice: 199,
        image: '/images/products/phonestand.jpg', images: ['/images/products/phonestand.jpg'],
        rating: 4.7, reviews: 334, category: 'electronique',
        description: 'Chargeur induction rapide 15W avec LED, compatible iPhone/Samsung.',
        descriptionAr: 'شحن استقراء سريع 15 واط مع LED، متوافق مع iPhone/Samsung.',
        inStock: true, sku: 'CHG-WL-012', tags: ['chargeur', 'sans-fil', 'induction'],
        variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Blanc', 'Noir'] }],
        features: ['15W rapide', 'LED indicateur', 'Protection surchauffe', 'Universel'],
        status: 'published', isVisible: true, isNew: false, isPopular: true, isBestSeller: false, isFeatured: false,
        salesCount: 850, publishedAt: '2025-12-15T10:00:00Z', sortOrder: 8,
    }
];

async function main() {
    console.log('🔄 Démarrage du seed... Insertion des données fixes dans PostgreSQL.');

    console.log(`\n📂 Insertion de ${categories.length} catégories...`);
    for (const cat of categories) {
        const exists = await prisma.category.findUnique({ where: { slug: cat.slug } });
        if (!exists) {
            await prisma.category.create({
                data: { name: cat.name, nameAr: cat.nameAr, icon: cat.icon, image: cat.image, slug: cat.slug }
            });
            console.log(`  ✅ Catégorie: ${cat.name}`);
        } else {
            console.log(`  ⏩ Ignorée (existante): ${cat.name}`);
        }
    }

    console.log(`\n🛍️ Insertion de ${products.length} produits...`);
    for (const prod of products) {
        const exists = await prisma.product.findFirst({ where: { sku: prod.sku } });
        if (!exists) {
            await prisma.product.create({
                data: {
                    name: prod.name, nameAr: prod.nameAr, price: prod.price, originalPrice: prod.originalPrice,
                    image: prod.image, images: prod.images, rating: prod.rating, reviews: prod.reviews,
                    categorySlug: prod.category, description: prod.description, descriptionAr: prod.descriptionAr,
                    inStock: prod.inStock, sku: prod.sku, tags: prod.tags ?? [],
                    variants: prod.variants ? JSON.parse(JSON.stringify(prod.variants)) : [],
                    features: prod.features ?? [], isVisible: prod.isVisible ?? true, isNew: prod.isNew ?? false,
                    isPopular: prod.isPopular ?? false, isBestSeller: prod.isBestSeller ?? false, isFeatured: prod.isFeatured ?? false,
                    salesCount: prod.salesCount ?? 0, stock: 100,
                    createdAt: prod.publishedAt ? new Date(prod.publishedAt) : new Date(),
                }
            });
            console.log(`  ✅ Produit: ${prod.name}`);
        } else {
            console.log(`  ⏩ Ignoré (SKU existant): ${prod.name}`);
        }
    }
}

main().catch(e => { console.error('❌ Erreur:', e); process.exit(1); })
    .finally(async () => { await prisma.$disconnect(); console.log('\n✅ Script de seed JavaScript complété !'); });
