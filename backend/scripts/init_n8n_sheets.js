const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { google } = require('googleapis');

async function initSheets() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY || process.env.GOOGLE_PRIVATE_KEY;

  if (!spreadsheetId || !clientEmail || !privateKey) {
    console.error("❌ ERREUR : Identifiants Google manquants dans .env");
    return;
  }

  // Nettoyage de la clé privée pour s'assurer qu'elle est valide
  privateKey = privateKey.replace(/\\n/g, '\n');

  const auth = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });

  const tabsInfo = [
    {
      title: 'Catalogue_Produits',
      headers: ['ID', 'Nom_Produit', 'Categorie', 'Sous_Categorie', 'Prix_MAD', 'Description', 'Stock', 'Image_URL', 'Actif']
    },
    {
      title: 'Clients_Commandes',
      headers: ['Numero_WA', 'Nom_Client', 'Ville', 'Produits_Achetes', 'Categories_Preferees', 'Derniere_Commande', 'Produit_Interesse', 'Quantite', 'Adresse_Livraison', 'Statut', 'Date_Conversation', 'Notes']
    }
  ];

  try {
    const meta = await sheets.spreadsheets.get({ spreadsheetId });
    const existingTitles = meta.data.sheets.map(s => s.properties.title);

    for (const tab of tabsInfo) {
      if (!existingTitles.includes(tab.title)) {
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{ addSheet: { properties: { title: tab.title } } }]
          }
        });
        console.log(`✅ Feuille créée : ${tab.title}`);
      } else {
        console.log(`ℹ️ La feuille ${tab.title} existe déjà.`);
      }

      // Ajout des colonnes d'en-tête (ligne 1)
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `'${tab.title}'!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [tab.headers] }
      });
      console.log(`✅ Entêtes insérées pour : ${tab.title}`);
    }

    console.log(`\n🎉 Succès ! Les Google Sheets sont prêtes pour n8n.`);
    console.log(`Lien : https://docs.google.com/spreadsheets/d/${spreadsheetId}`);

  } catch (error) {
    console.error("❌ ERREUR lors de l'accès à Google Sheets :", error.message);
  }
}

initSheets();
