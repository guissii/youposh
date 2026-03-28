const { Client } = require('ssh2');

const conn = new Client();
conn.on('ready', () => {
    console.log('Connexion établie. Déploiement des correctifs de vitesse...');
    
    // Commandes pour corriger les goulots d'étranglement :
    // 1. Désactiver la limite Nginx qui bloque Cloudflare (laisser Node.js gérer intelligemment)
    // 2. Augmenter la limite de connexion Supabase (de 1 à 15 pour traiter les requêtes en parallèle)
    // 3. Demander à Node.js de lire la vraie IP du client ("trust proxy")
    
    const cmd = `
        echo "1. Correction de Nginx..."
        sed -i 's/limit_req zone=api/#limit_req zone=api/' /etc/nginx/sites-available/api.youposhmaroc.com
        systemctl reload nginx

        echo "2. Correction de la base de données..."
        cd /var/www/youposh/backend
        sed -i 's/connection_limit=1/connection_limit=15/g' .env
        
        echo "3. Correction du Proxy Cloudflare..."
        sed -i "s/app.set('trust proxy',.*);/app.set('trust proxy', true);/g" src/index.ts
        
        echo "4. Recompilation et Redémarrage..."
        npx tsc
        pm2 restart youposh-api || pm2 restart all
    `;

    conn.exec(cmd, (err, stream) => {
        if (err) throw err;
        stream.on('close', (code) => {
            console.log('Correctifs appliqués avec succès. Code:', code);
            conn.end();
        }).on('data', (data) => process.stdout.write(data))
          .stderr.on('data', (data) => process.stderr.write(data));
    });
}).connect({
    host: '84.247.184.208',
    port: 22,
    username: 'root',
    password: 'Abc12345!'
});
