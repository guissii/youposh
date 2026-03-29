import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const rootDir = 'C:/Users/MSI/Pictures/chat gpt/prob3/9moool';
const uploadDir = path.join(__dirname, '../uploads');

// Ensure upload directory exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

function getMarketingData(folderName: string) {
  let nameFR = "Produit Exclusif";
  let nameAR = "منتج حصري ومميز";
  let price = 99;
  let originalPrice = 199;
  
  // Extract prices if folder name contains numbers like "produit 6 129 230"
  const priceMatch = folderName.match(/(\d+)\s+(\d+)$/);
  if (priceMatch) {
    price = parseInt(priceMatch[1], 10);
    originalPrice = parseInt(priceMatch[2], 10);
  } else if (folderName === "149 250") {
    price = 149;
    originalPrice = 250;
  }

  const folderLower = folderName.toLowerCase();
  
  if (folderLower.includes('ch3r lahrech')) {
    nameFR = "Brosse Lissante Anti-Frizz Pro";
    nameAR = "فرشاة حرارية لتمليس الشعر الخشن";
    if (!priceMatch) { price = 149; originalPrice = 250; }
  } else if (folderLower.includes('linge')) {
    nameFR = "Séchoir à Linge Pliable et Solide";
    nameAR = "منشر غسيل قابل للطي عملي وصحيح";
    if (!priceMatch) { price = 199; originalPrice = 300; }
  } else if (folderLower.includes('sechouar')) {
    nameFR = "Sèche-Cheveux Professionnel Puissant";
    nameAR = "سيشوار احترافي قوي لتنشيف الشعر بالزربة";
    if (!priceMatch) { price = 159; originalPrice = 250; }
  } else if (folderLower.includes('lforma')) {
    nameFR = "Gaine Amincissante Invisible";
    nameAR = "مشد حراري لنحت الجسم وبناء الفورمة";
    if (!priceMatch) { price = 99; originalPrice = 180; }
  } else if (folderLower.includes('shiiit') || folderLower.includes('shit')) {
    nameFR = "Brosse Magique Nettoyante Multi-usage";
    nameAR = "فرشاة التنظيف السحرية متعددة الاستعمالات";
    if (!priceMatch) { price = 79; originalPrice = 150; }
  } else if (folderLower.includes('recho')) {
    nameFR = "Réchaud Électrique Portable Rapide";
    nameAR = "موقد كهربائي محمول سريع التسخين";
    if (!priceMatch) { price = 129; originalPrice = 200; }
  } else if (folderLower.includes('glose')) {
    nameFR = "Gloss Lèvres Brillant Longue Tenue";
    nameAR = "ملمع شفاه جذاب كيدوم طويلا";
    if (!priceMatch) { price = 49; originalPrice = 90; }
  } else if (folderLower.includes('tension')) {
    nameFR = "Tensiomètre Électronique Précis";
    nameAR = "جهاز إلكتروني دقيق لقياس ضغط الدم";
    if (!priceMatch) { price = 189; originalPrice = 300; }
  } else if (folderLower.includes('tsbaan')) {
    nameFR = "Mini Machine à Laver Portable";
    nameAR = "غسالة ملابس صغيرة محمولة للتصبين السريع";
    if (!priceMatch) { price = 249; originalPrice = 400; }
  } else if (folderLower.includes('chakoch')) {
    nameFR = "Marteau Multifonction Professionnel";
    nameAR = "مطرقة متعددة الاستعمالات صلبة وعملية";
    if (!priceMatch) { price = 89; originalPrice = 150; }
  } else if (folderLower.includes('rjilat')) {
    nameFR = "Appareil Pédicure Électrique Pieds";
    nameAR = "جهاز إزالة الجلد الميت وترطيب القدمين";
    if (!priceMatch) { price = 119; originalPrice = 200; }
  } else if (folderLower.includes('tabouret')) {
    nameFR = "Tabouret Pliable Portable Solide";
    nameAR = "كرسي قابل للطي عملي وسهل الحمل";
    if (!priceMatch) { price = 69; originalPrice = 120; }
  } else if (folderLower.includes('epices')) {
    nameFR = "Organisateur d'Épices Rotatif";
    nameAR = "منظم توابل دوار وعملي للكوزينة";
    if (!priceMatch) { price = 139; originalPrice = 220; }
  } else if (folderLower.includes('papier couisson')) {
    nameFR = "Papier Cuisson Air Fryer Anti-adhésif";
    nameAR = "ورق طهي خاص بالقلاية الهوائية اير فراير";
    if (!priceMatch) { price = 39; originalPrice = 80; }
  } else if (folderLower.includes('sokar halalwa')) {
    nameFR = "Cire d'Épilation Naturelle Facile";
    nameAR = "حلاوة طبيعية لإزالة الشعر بكل سهولة";
    if (!priceMatch) { price = 49; originalPrice = 90; }
  } else if (folderLower.includes('zeema rani zwina')) {
    nameFR = "Kit Beauté et Soin Essentiel";
    nameAR = "مجموعة العناية والجمال باش تبقاي ديما زوينة";
    if (!priceMatch) { price = 149; originalPrice = 250; }
  } else if (folderLower.includes('tiroire')) {
    nameFR = "Organisateur de Tiroirs Pratique";
    nameAR = "منظم أدراج عملي لترتيب الخزانة";
    if (!priceMatch) { price = 59; originalPrice = 100; }
  } else if (folderLower.includes('9moool')) {
    nameFR = "Pack Maison Essentiel Complet";
    nameAR = "باقة المنزل المتكاملة لكل احتياجاتك";
    if (!priceMatch) { price = 199; originalPrice = 350; }
  } else if (folderLower.includes('produi') || folderLower.includes('149 250')) {
    const numMatch = folderName.match(/produit?\s*(\d+)/i);
    const num = numMatch ? numMatch[1] : "";
    nameFR = `Produit Tendance ${num}`.trim();
    nameAR = `منتج حصري عالي الجودة ${num}`.trim();
  }

  const descFR = `Découvrez notre ${nameFR}, l'allié parfait pour votre quotidien. Conçu avec des matériaux de haute qualité, il vous garantit durabilité et efficacité. Commandez maintenant et profitez de la livraison rapide partout au Maroc !`;
  
  const descAR = `واش كتقلب على الجودة والثمن المناسب؟ جبنا ليك ${nameAR} لي غادي يهنيك ويسهل عليك حياتك اليومية! 
✅ جودة ممتازة ومضمونة
✅ سهل وعملي فالاستعمال
✅ التوصيل فابور تال باب الدار والدفع عند الاستلام
سارعوا بالطلب قبل نفاذ الكمية!`;

  return { nameFR, nameAR, price, originalPrice, descFR, descAR };
}

function walk(dir: string): string[] {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      results.push(file);
    }
  });
  return results;
}

async function main() {
  console.log('Starting product import...');
  const allFiles = walk(rootDir);
  
  // Group images by directory
  const dirsWithImages: Record<string, string[]> = {};
  
  allFiles.forEach(file => {
    if (file.match(/\.(jpg|jpeg|png|webp)$/i)) {
      const dirName = path.dirname(file);
      if (!dirsWithImages[dirName]) {
        dirsWithImages[dirName] = [];
      }
      dirsWithImages[dirName].push(file);
    }
  });

  const features = ["Rapides", "Haute Qualité", "Livraison Rapide", "Garantie"];

  let count = 0;

  for (const dir of Object.keys(dirsWithImages)) {
    const folderName = path.basename(dir);
    const images = dirsWithImages[dir];
    
    const marketing = getMarketingData(folderName);
    
    // Copy images to uploads
    const copiedImages: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const ext = path.extname(images[i]);
      const newName = `import_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
      const dest = path.join(uploadDir, newName);
      fs.copyFileSync(images[i], dest);
      copiedImages.push(`/uploads/${newName}`);
    }

    const mainImage = copiedImages[0] || "";

    // Insert to DB
    const product = await prisma.product.create({
      data: {
        name: marketing.nameFR,
        nameAr: marketing.nameAR,
        price: marketing.price,
        originalPrice: marketing.originalPrice,
        image: mainImage,
        images: copiedImages,
        description: marketing.descFR,
        descriptionAr: marketing.descAR,
        inStock: true,
        isVisible: true,
        isPopular: true,
        isFeatured: true,
        status: "published",
        stock: 100,
        features: features,
        variants: JSON.stringify([
          { name: "Taille", values: ["Standard"] }
        ])
      }
    });

    console.log(`✅ Added product: ${marketing.nameFR} (${marketing.price} MAD)`);
    count++;
  }

  console.log(`\n🎉 Successfully imported ${count} products!`);
}

main().catch(e => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
