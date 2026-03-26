
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
    const updates = [{"sku_like":"produit 1","cardZoom":1,"cardFocalX":50,"cardFocalY":50},{"sku_like":"produit 119","cardZoom":0.85,"cardFocalX":50,"cardFocalY":50},{"sku_like":"produit 2","cardZoom":0.9,"cardFocalX":50,"cardFocalY":50},{"sku_like":"produit 4","cardZoom":1,"cardFocalX":50,"cardFocalY":50},{"sku_like":"produit 5","cardZoom":0.95,"cardFocalX":50,"cardFocalY":50},{"sku_like":"produit 6","cardZoom":1.15,"cardFocalX":50,"cardFocalY":50},{"sku_like":"produit 7","cardZoom":1.2,"cardFocalX":50,"cardFocalY":45},{"sku_like":"produit 8","cardZoom":0.8,"cardFocalX":50,"cardFocalY":50}];
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
