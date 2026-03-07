import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    console.log('🧹 Cleaning database...');
    await prisma.orderItem.deleteMany();
    await prisma.order.deleteMany();
    await prisma.product.deleteMany();
    await prisma.category.deleteMany();
    await prisma.customer.deleteMany();
    await prisma.promoCode.deleteMany();

    console.log('📂 Seeding categories...');
    const categories = [
        { name: 'Électronique & Gadgets', nameAr: 'إلكترونيات وأدوات', icon: 'Smartphone', image: '/images/categories/electronics.jpg', slug: 'electronique' },
        { name: 'Maison & Cuisine', nameAr: 'منزل ومطبخ', icon: 'Home', image: '/images/categories/home.jpg', slug: 'maison' },
        { name: 'Beauté & Bien-être', nameAr: 'جمال وعناية', icon: 'Sparkles', image: '/images/categories/beauty.jpg', slug: 'beaute' },
        { name: 'Mode & Accessoires', nameAr: 'أزياء وإكسسوارات', icon: 'Shirt', image: '/images/categories/fashion.jpg', slug: 'mode' },
        { name: 'Auto & Moto', nameAr: 'سيارات ودراجات', icon: 'Car', image: '/images/categories/electronics.jpg', slug: 'auto' },
        { name: 'Gaming', nameAr: 'ألعاب', icon: 'Gamepad2', image: '/images/categories/electronics.jpg', slug: 'gaming' },
        { name: 'Cadeaux', nameAr: 'هدايا', icon: 'Gift', image: '/images/categories/fashion.jpg', slug: 'cadeaux' },
        { name: 'Enfants & Jouets', nameAr: 'أطفال وألعاب', icon: 'Baby', image: '/images/categories/fashion.jpg', slug: 'jouets' },
    ];

    for (const cat of categories) {
        await prisma.category.create({ data: cat });
    }
    console.log(`✅ ${categories.length} catégories créées`);

    console.log('📦 Seeding products...');
    const products = [
        {
            name: 'Écouteurs Bluetooth ANC', nameAr: 'سماعات بلوتوث ANC',
            price: 299, originalPrice: 450,
            image: '/images/products/headphones.jpg',
            images: ['/images/products/headphones.jpg', '/images/products/headphones.jpg', '/images/products/headphones.jpg'],
            badge: 'promo', rating: 4.8, reviews: 328, categorySlug: 'electronique',
            description: 'Écouteurs sans fil avec réduction active du bruit. Autonomie 30h, son haute qualité.',
            descriptionAr: 'سماعات لاسلكية مع إلغاء الضوضاء النشط. بطارية 30 ساعة، صوت عالي الجودة.',
            inStock: true, sku: 'ECO-BT-001',
            tags: ['audio', 'bluetooth', 'sans-fil'],
            variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Noir', 'Blanc', 'Bleu'] }],
            features: ['Réduction bruit ANC', '30h autonomie', 'Bluetooth 5.3', 'Charge rapide'],
            isPopular: true, isNew: false, salesCount: 1250, stock: 45,
        },
        {
            name: 'Smartwatch Pro', nameAr: 'ساعة ذكية برو',
            price: 399, originalPrice: 599,
            image: '/images/products/smartwatch.jpg',
            images: ['/images/products/smartwatch.jpg', '/images/products/smartwatch.jpg'],
            badge: 'bestseller', rating: 4.9, reviews: 512, categorySlug: 'electronique',
            description: 'Montre connectée avec GPS, cardio, suivi sommeil. Écran AMOLED.',
            descriptionAr: 'ساعة ذكية مع GPS، معدل ضربات القلب، تتبع النوم. شاشة AMOLED.',
            inStock: true, sku: 'WATCH-PRO-002',
            tags: ['smartwatch', 'fitness', 'sante'],
            variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Noir', 'Rose', 'Argent'] }],
            features: ['GPS intégré', 'Cardio 24/7', 'Étanche 50m', '100+ sports'],
            isPopular: true, isNew: false, salesCount: 2100, stock: 32,
        },
        {
            name: 'PowerBank 20000mAh', nameAr: 'باور بانك 20000mAh',
            price: 149, originalPrice: 250,
            image: '/images/products/powerbank.jpg',
            images: ['/images/products/powerbank.jpg'],
            badge: 'promo', rating: 4.6, reviews: 189, categorySlug: 'electronique',
            description: 'Batterie externe ultra-capacité avec charge rapide 65W.',
            descriptionAr: 'بطارية خارجية عالية السعة مع شحن سريع 65 واط.',
            inStock: true, sku: 'PWR-20K-003',
            tags: ['powerbank', 'chargeur', 'portable'],
            variants: [],
            features: ['20000mAh', 'Charge rapide 65W', '3 ports USB', 'Écran LED'],
            isPopular: true, isNew: false, salesCount: 890, stock: 78,
        },
        {
            name: 'Lampe LED Bureau', nameAr: 'مصباح LED مكتبي',
            price: 129, originalPrice: 199,
            image: '/images/products/desklamp.jpg',
            images: ['/images/products/desklamp.jpg'],
            badge: 'new', rating: 4.7, reviews: 145, categorySlug: 'maison',
            description: 'Lampe de bureau LED avec variateur, port USB, protection yeux.',
            descriptionAr: 'مصباح مكتبي LED مع خافت، منفذ USB، حماية العيون.',
            inStock: true, sku: 'LAMP-LED-004',
            tags: ['lampe', 'bureau', 'maison'],
            variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Blanc', 'Noir'] }],
            features: ['5 modes lumière', 'Protection yeux', 'Port USB', 'Flexible'],
            isPopular: false, isNew: true, salesCount: 320, stock: 55,
        },
        {
            name: 'Enceinte Bluetooth', nameAr: 'سماعة بلوتوث',
            price: 179, originalPrice: 299,
            image: '/images/products/speaker.jpg',
            images: ['/images/products/speaker.jpg'],
            badge: 'promo', rating: 4.5, reviews: 234, categorySlug: 'electronique',
            description: 'Enceinte portable waterproof avec basses puissantes.',
            descriptionAr: 'سماعة محمولة مقاومة للماء مع جهير قوي.',
            inStock: true, sku: 'SPK-BT-005',
            tags: ['enceinte', 'audio', 'portable'],
            variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Noir', 'Rouge', 'Bleu'] }],
            features: ['Waterproof IPX7', '20h autonomie', 'Basses puissantes', 'Micro intégré'],
            isPopular: true, isNew: false, salesCount: 780, stock: 40,
        },
        {
            name: 'Support Téléphone Voiture', nameAr: 'حامل هاتف للسيارة',
            price: 79, originalPrice: 129,
            image: '/images/products/car-mount.jpg',
            images: ['/images/products/car-mount.jpg'],
            badge: 'bestseller', rating: 4.4, reviews: 567, categorySlug: 'auto',
            description: 'Support universel avec ventouse puissante et rotation 360°.',
            descriptionAr: 'حامل عالمي مع كوب شفط قوي ودوران 360 درجة.',
            inStock: true, sku: 'CAR-SUP-006',
            tags: ['auto', 'support', 'telephone'],
            variants: [],
            features: ['Rotation 360°', 'Ventouse puissante', 'Universel', 'Facile installer'],
            isPopular: true, isNew: false, salesCount: 1500, stock: 120,
        },
        {
            name: 'USB-C Hub 7-en-1', nameAr: 'موزع USB-C 7 في 1',
            price: 249, originalPrice: 399,
            image: '/images/products/usbhub.jpg',
            images: ['/images/products/usbhub.jpg'],
            badge: 'promo', rating: 4.7, reviews: 178, categorySlug: 'electronique',
            description: 'Hub multiport avec HDMI 4K, USB 3.0, SD, charge 100W.',
            descriptionAr: 'موزع متعدد المنافذ مع HDMI 4K، USB 3.0، SD، شحن 100 واط.',
            inStock: true, sku: 'HUB-7IN1-007',
            tags: ['usb', 'hub', 'informatique'],
            variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Gris', 'Argent'] }],
            features: ['HDMI 4K', '3x USB 3.0', 'Lecteur SD', 'Charge 100W'],
            isPopular: false, isNew: true, salesCount: 450, stock: 30,
        },
        {
            name: 'Souris Ergonomique', nameAr: 'فأرة مريحة',
            price: 99, originalPrice: 159,
            image: '/images/products/mouse.jpg',
            images: ['/images/products/mouse.jpg'],
            badge: 'new', rating: 4.6, reviews: 289, categorySlug: 'electronique',
            description: 'Souris sans fil verticale, confort maximale, réduction douleurs.',
            descriptionAr: 'فأرة لاسلكية عمودية، راحة قصوى، تقليل الآلام.',
            inStock: true, sku: 'MOUSE-ERG-008',
            tags: ['souris', 'ergonomique', 'bureau'],
            variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Noir', 'Gris'] }],
            features: ['Design vertical', 'Sans fil 2.4G', '2400 DPI', 'Confort max'],
            isPopular: false, isNew: true, salesCount: 380, stock: 65,
        },
        {
            name: 'Projecteur Étoiles', nameAr: 'جهاز عرض النجوم',
            price: 199, originalPrice: 349,
            image: '/images/products/night-light.jpg',
            images: ['/images/products/night-light.jpg'],
            badge: 'new', rating: 4.9, reviews: 412, categorySlug: 'maison',
            description: 'Projecteur ciel étoilé avec télécommande, musique, minuterie.',
            descriptionAr: 'جهاز عرض السماء المرصعة بالنجوم مع ريموت كنترول، موسيقى، مؤقت.',
            inStock: true, sku: 'PROJ-STAR-009',
            tags: ['deco', 'lumiere', 'maison'],
            variants: [],
            features: ['16 couleurs', 'Télécommande', 'Bluetooth', 'Minuterie'],
            isPopular: true, isNew: true, salesCount: 920, stock: 25,
        },
        {
            name: 'Support Téléphone Pliable', nameAr: 'حامل هاتف قابل للطي',
            price: 59, originalPrice: 99,
            image: '/images/products/foldable-stand.jpg',
            images: ['/images/products/foldable-stand.jpg'],
            badge: 'promo', rating: 4.5, reviews: 678, categorySlug: 'electronique',
            description: 'Support aluminium pliable, angle réglable, compact.',
            descriptionAr: 'حامل ألومنيوم قابل للطي، زاوية قابلة للتعديل، مضغوط.',
            inStock: true, sku: 'STAND-FLD-010',
            tags: ['support', 'telephone', 'bureau'],
            variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Argent', 'Noir', 'Or'] }],
            features: ['Aluminium', 'Angle réglable', 'Pliable', 'Universel'],
            isPopular: true, isNew: false, salesCount: 1100, stock: 90,
        },
        {
            name: 'Récepteur Bluetooth 5.0', nameAr: 'مستقبل بلوتوث 5.0',
            price: 89, originalPrice: 149,
            image: '/images/products/bt-receiver.jpg',
            images: ['/images/products/bt-receiver.jpg'],
            badge: 'new', rating: 4.4, reviews: 156, categorySlug: 'electronique',
            description: 'Adaptateur audio Bluetooth pour voiture et chaîne HiFi.',
            descriptionAr: 'محول صوت بلوتوث للسيارة ونظام الصوت HiFi.',
            inStock: true, sku: 'BT-REC-011',
            tags: ['bluetooth', 'audio', 'voiture'],
            variants: [],
            features: ['Bluetooth 5.0', 'Autonomie 10h', 'Micro intégré', 'Facile utiliser'],
            isPopular: false, isNew: true, salesCount: 280, stock: 70,
        },
        {
            name: 'Chargeur Sans Fil', nameAr: 'شاحن لاسلكي',
            price: 119, originalPrice: 199,
            image: '/images/products/phonestand.jpg',
            images: ['/images/products/phonestand.jpg'],
            badge: 'promo', rating: 4.7, reviews: 334, categorySlug: 'electronique',
            description: 'Chargeur induction rapide 15W avec LED, compatible iPhone/Samsung.',
            descriptionAr: 'شحن استقراء سريع 15 واط مع LED، متوافق مع iPhone/Samsung.',
            inStock: true, sku: 'CHG-WL-012',
            tags: ['chargeur', 'sans-fil', 'induction'],
            variants: [{ name: 'Couleur', nameAr: 'اللون', options: ['Blanc', 'Noir'] }],
            features: ['15W rapide', 'LED indicateur', 'Protection surchauffe', 'Universel'],
            isPopular: true, isNew: false, salesCount: 850, stock: 50,
        },
    ];

    for (const prod of products) {
        await prisma.product.create({ data: prod as any });
    }
    console.log(`✅ ${products.length} produits créés`);

    // Sample promo codes
    console.log('🎫 Seeding promo codes...');
    await prisma.promoCode.createMany({
        data: [
            { code: 'BIENVENUE10', description: '10% de réduction pour les nouveaux clients', discountType: 'percentage', discountValue: 10, minOrder: 100, maxUses: 500, isActive: true },
            { code: 'SUMMER25', description: 'Soldes été -25%', discountType: 'percentage', discountValue: 25, minOrder: 200, maxUses: 100, isActive: true, endDate: new Date('2026-09-01') },
            { code: 'LIVGRATUITE', description: 'Livraison gratuite (réduction 30 MAD)', discountType: 'fixed', discountValue: 30, minOrder: 150, maxUses: 0, isActive: true },
        ],
    });
    console.log('✅ 3 codes promo créés');

    // Sample customers & orders
    console.log('👥 Seeding customers & orders...');
    const c1 = await prisma.customer.create({ data: { name: 'Ahmed Benali', phone: '+212 612 345 678', email: 'ahmed@email.com', city: 'Casablanca', totalOrders: 3, totalSpent: 727 } });
    const c2 = await prisma.customer.create({ data: { name: 'Fatima Zahra', phone: '+212 661 234 567', email: 'fatima@email.com', city: 'Rabat', totalOrders: 2, totalSpent: 478 } });
    const c3 = await prisma.customer.create({ data: { name: 'Youssef El Amrani', phone: '+212 655 876 543', email: 'youssef@email.com', city: 'Marrakech', totalOrders: 1, totalSpent: 399 } });

    const allProducts = await prisma.product.findMany();
    const p = (sku: string) => allProducts.find(pr => pr.sku === sku)!;

    await prisma.order.create({
        data: {
            customerId: c1.id, customerName: 'Ahmed Benali', phone: '+212 612 345 678', city: 'Casablanca', address: '12 Rue Hassan II, Casablanca', total: 478, status: 'completed',
            items: { create: [{ productId: p('ECO-BT-001').id, quantity: 1, price: 299 }, { productId: p('SPK-BT-005').id, quantity: 1, price: 179 }] },
        },
    });
    await prisma.order.create({
        data: {
            customerId: c2.id, customerName: 'Fatima Zahra', phone: '+212 661 234 567', city: 'Rabat', address: '45 Av Mohammed V, Rabat', total: 478, status: 'processing',
            items: { create: [{ productId: p('WATCH-PRO-002').id, quantity: 1, price: 399 }, { productId: p('STAND-FLD-010').id, quantity: 1, price: 59 }] },
        },
    });
    await prisma.order.create({
        data: {
            customerId: c3.id, customerName: 'Youssef El Amrani', phone: '+212 655 876 543', city: 'Marrakech', address: '8 Derb Jdid, Marrakech', total: 399, status: 'pending',
            items: { create: [{ productId: p('WATCH-PRO-002').id, quantity: 1, price: 399 }] },
        },
    });
    await prisma.order.create({
        data: {
            customerId: c1.id, customerName: 'Ahmed Benali', phone: '+212 612 345 678', city: 'Casablanca', address: '12 Rue Hassan II', total: 249, status: 'shipped', promoCode: 'BIENVENUE10', discount: 27.67,
            items: { create: [{ productId: p('HUB-7IN1-007').id, quantity: 1, price: 249 }] },
        },
    });
    console.log('✅ 3 clients + 4 commandes créés');

    console.log('\n🎉 Seed terminé avec succès!');
}

main()
    .catch(e => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
