import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();
const importDir = path.join(__dirname, '../auto_import');
const uploadDir = path.join(__dirname, '../uploads');

// Crée les dossiers s'ils manquent
if (!fs.existsSync(importDir)) fs.mkdirSync(importDir, { recursive: true });
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// L'URL de l'API Groq
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Le Prompt système très strict pour obliger l'IA à être un génie du marketing marocain
const SYSTEM_PROMPT = `
Tu es le meilleur copywriter e-commerce du Maroc. Ton but est de vendre.
Je vais te donner une image d'un produit. Tu dois analyser l'image et me générer une fiche produit parfaite.

REGLES OBLIGATOIRES:
1. Le titre français (nameFR) doit être long, vendeur, et inclure les bénéfices du produit.
2. Le titre arabe (nameAR) doit être long, écrit en vraie DARIJA marocaine (ex: "ماكينة الحلاقة العجيبة لي غتهنيك").
3. La description française (descFR) doit être très marketing, longue, persuasive, utiliser du copywriting (AIDA) et inclure des émojis.
4. La description arabe (descAR) doit être très longue, très persuasive "marketing", écrite 100% en DARIJA Marocaine. Utilise des mots forts (تهنا, أحسن جودة, جرب وحكم, التوصيل فابور).
5. Déduis un prix logique au Maroc. Le 'price' est le prix promo (ex: 149), et le 'originalPrice' est le prix barré (ex: 250).
6. Tu dois UNIQUEMENT renvoyer un objet JSON valide, rien d'autre. Pas de texte avant, pas de texte après.

Format JSON attendu :
{
  "nameFR": "...",
  "nameAR": "...",
  "price": 149,
  "originalPrice": 250,
  "descFR": "...",
  "descAR": "..."
}
`;

async function analyzeImageWithGroq(base64Image: string, ext: string) {
    if (!GROQ_API_KEY) {
        throw new Error("GROQ_API_KEY manquante dans votre fichier .env");
    }

    const mimeType = ext === '.png' ? 'image/png' : ext === '.webp' ? 'image/webp' : 'image/jpeg';
    const dataUrl = `data:${mimeType};base64,${base64Image}`;

    const body = {
        model: "llama-3.2-11b-vision-preview",
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: SYSTEM_PROMPT },
                    { type: "image_url", image_url: { url: dataUrl } }
                ]
            }
        ],
        temperature: 0.7,
        max_tokens: 1024,
    };

    const response = await fetch(GROQ_API_URL, {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API Groq Error (${response.status}): ${errText}`);
    }

    const jsonRes = await response.json();
    const rawContent = jsonRes.choices[0].message.content;
    
    // Nettoyer pour s'assurer qu'on a juste le JSON
    const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
        throw new Error("L'IA n'a pas renvoyé un format JSON valide.\n" + rawContent);
    }

    return JSON.parse(jsonMatch[0]);
}

function walk(dir: string): string[] {
    let results: string[] = [];
    if (!fs.existsSync(dir)) return results;
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            results = results.concat(walk(fullPath));
        } else {
            results.push(fullPath);
        }
    });
    return results;
}

async function main() {
    console.log(`\n🤖 Démarrage de l'importateur IA YouPosh`);
    console.log(`Dossier scanné : ${importDir}\n`);

    const allFiles = walk(importDir);
    const imageFiles = allFiles.filter(f => f.match(/\.(jpg|jpeg|png|webp)$/i));

    if (imageFiles.length === 0) {
        console.log("ℹ️ Aucune image trouvée. Mettez vos photos dans 'backend/auto_import' et relancez.");
        return;
    }

    console.log(`Trouvé ${imageFiles.length} images. Début de la Magie 🪄 ...\n`);

    let successCount = 0;

    for (const file of imageFiles) {
        console.log(`🔄 Traitement de : ${path.basename(file)}`);
        
        try {
            const ext = path.extname(file).toLowerCase();
            const base64Image = fs.readFileSync(file, { encoding: 'base64' });

            process.stdout.write(`   ↳ 🧠 Demande à Groq Vision... `);
            const marketing = await analyzeImageWithGroq(base64Image, ext);
            console.log("Fait !");
            
            // Move picture to uploads
            const newName = `import_ai_${Date.now()}_${Math.floor(Math.random() * 1000)}${ext}`;
            const dest = path.join(uploadDir, newName);
            fs.copyFileSync(file, dest);
            
            const imageUrl = `/uploads/${newName}`;

            // Create in Database
            const product = await prisma.product.create({
                data: {
                    name: marketing.nameFR,
                    nameAr: marketing.nameAR,
                    price: parseFloat(marketing.price) || 149,
                    originalPrice: parseFloat(marketing.originalPrice) || 250,
                    image: imageUrl,
                    images: [imageUrl],
                    description: marketing.descFR,
                    descriptionAr: marketing.descAR,
                    inStock: true,
                    isVisible: true,
                    isPopular: true,
                    isFeatured: true,
                    status: "published",
                    stock: 99,
                    features: ["Haute Qualité", "Livraison Rapide", "Paiement à la livraison", "Testé Avant Paiement"],
                    variants: JSON.stringify([{ name: "Taille/Couleur", values: ["Standard"] }])
                }
            });

            console.log(`   ✅ Produit Créé : ${product.nameFR} (${product.price} MAD)`);
            successCount++;

            // Optionally, delete or move the original file so it doesn't get processed twice
            fs.unlinkSync(file);

        } catch (e: any) {
            console.error(`   ❌ ERREUR sur ${path.basename(file)}:`, e.message);
        }
    }

    console.log(`\n🎉 Terminé ! ${successCount} produits créés avec succès.`);
}

main().catch(e => {
    console.error(e);
    process.exit(1);
}).finally(async () => {
    await prisma.$disconnect();
});
