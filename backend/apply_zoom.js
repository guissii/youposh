const { Client: SSHClient } = require('ssh2');

const updates = [
  // 1. Réchaud de Camping (Image souvent centrée et petite, on la laisse normale ou léger zoom)
  { sku_like: 'produit 1', cardZoom: 1.0, cardFocalX: 50, cardFocalY: 50 },
  
  // 2. Raquette Anti-Moustique (Produit très long verticalement, on veut dé-zoomer pour voir la raquette entière)
  { sku_like: 'produit 119', cardZoom: 0.85, cardFocalX: 50, cardFocalY: 50 },
  
  // 3. Râpe Électrique (Produit vertical, léger dé-zoom pour qu'il tienne dans la carte)
  { sku_like: 'produit 2', cardZoom: 0.9, cardFocalX: 50, cardFocalY: 50 },
  
  // 4. Présentoir à Épices (Produit large et complexe, on garde une taille normale mais bien centrée)
  { sku_like: 'produit 4', cardZoom: 1.0, cardFocalX: 50, cardFocalY: 50 },
  
  // 5. Aspirateur Points Noirs (Produit de beauté vertical, léger dé-zoom)
  { sku_like: 'produit 5', cardZoom: 0.95, cardFocalX: 50, cardFocalY: 50 },
  
  // 6. Casque de Réalité Virtuelle (Produit horizontal, on peut zoomer légèrement pour mettre en valeur l'objet)
  { sku_like: 'produit 6', cardZoom: 1.15, cardFocalX: 50, cardFocalY: 50 },
  
  // 7. Épilateur Sourcils (Petit produit style stylo, on zoom dessus pour voir les détails de la tête)
  { sku_like: 'produit 7', cardZoom: 1.2, cardFocalX: 50, cardFocalY: 45 },
  
  // 8. Hydropulseur Dentaire (Produit très haut/long, on dé-zoom pour qu'il ne soit pas coupé)
  { sku_like: 'produit 8', cardZoom: 0.8, cardFocalX: 50, cardFocalY: 50 }
];

const scriptContent = `
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const updates = ${JSON.stringify(updates)};
    const allProducts = await prisma.product.findMany();
    
    for (const p of allProducts) {
        // Find which update applies based on the original folder name logic
        // We look at the product name to determine which one it is
        let matchedUpdate = null;
        if (p.name.includes("Réchaud")) matchedUpdate = updates.find(u => u.sku_like === 'produit 1');
        if (p.name.includes("Raquette")) matchedUpdate = updates.find(u => u.sku_like === 'produit 119');
        if (p.name.includes("Râpe")) matchedUpdate = updates.find(u => u.sku_like === 'produit 2');
        if (p.name.includes("Présentoir")) matchedUpdate = updates.find(u => u.sku_like === 'produit 4');
        if (p.name.includes("Aspirateur")) matchedUpdate = updates.find(u => u.sku_like === 'produit 5');
        if (p.name.includes("Casque")) matchedUpdate = updates.find(u => u.sku_like === 'produit 6');
        if (p.name.includes("Épilateur")) matchedUpdate = updates.find(u => u.sku_like === 'produit 7');
        if (p.name.includes("Hydropulseur")) matchedUpdate = updates.find(u => u.sku_like === 'produit 8');
        
        if (matchedUpdate) {
            await prisma.product.update({
                where: { id: p.id },
                data: {
                    cardZoom: matchedUpdate.cardZoom,
                    cardFocalX: matchedUpdate.cardFocalX,
                    cardFocalY: matchedUpdate.cardFocalY
                }
            });
            console.log('Updated Zoom for: ' + p.name + ' -> Zoom: ' + matchedUpdate.cardZoom);
        }
    }
}

run().catch(console.error).finally(() => prisma.$disconnect());
`;

const fs = require('fs');
fs.writeFileSync('update_zoom_vps.js', scriptContent);

console.log('🚀 Exécution du script de mise à jour des zooms sur le VPS...');
const conn = new SSHClient();
conn.on('ready', () => {
    conn.sftp((err, sftp) => {
        if (err) throw err;
        const readStream = fs.createReadStream('update_zoom_vps.js');
        const writeStream = sftp.createWriteStream('/var/www/youposh/backend/update_zoom_vps.js');
        writeStream.on('close', () => {
            console.log('Script uploadé. Exécution en cours...');
            conn.exec('cd /var/www/youposh/backend && node update_zoom_vps.js', (err, stream) => {
                if (err) throw err;
                stream.on('close', (code, signal) => {
                    console.log('Exécution terminée avec le code ' + code);
                    conn.end();
                }).on('data', (data) => {
                    console.log('VPS: ' + data);
                }).stderr.on('data', (data) => {
                    console.log('VPS ERROR: ' + data);
                });
            });
        });
        readStream.pipe(writeStream);
    });
}).connect({
    host: process.env.VPS_HOST || '84.247.184.208',
    port: 22,
    username: 'root',
    password: process.env.VPS_PASSWORD
});
