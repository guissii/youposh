# Documentation de l'Infrastructure VPS — YouPosh

Ce document décrit l'architecture complète du serveur VPS (`youposhmaroc.com` / `84.247.184.208`) en production. Il détaille la configuration réseau, la stack technique, le flux d'une requête, la gestion des processus, le système de fichiers, ce qu'il faut éviter et la sécurité mise en place.

## 🛠️ 1. Stack Technique Utilisée (Tech Stack)

Votre boutique tourne sur une architecture **PERN** (PostgreSQL, Express, React, Node.js) moderne et robuste :

- **Frontend (Interface Utilisateur)** : React.js compilé avec Vite. TailwindCSS (probablement) pour le design.
- **Backend (Logique et API)** : Node.js avec le framework Express.js. Géré en TypeScript.
- **Base de Données** : PostgreSQL 16 (Relationnelle robuste).
- **Serveur Web / Reverse Proxy** : Nginx (Distribution du frontend et proxy pour l'API).
- **Gestionnaire de Processus** : PM2 (Gère les plantages et le multi-cœur de Node.js).
- **Sécurité et DNS** : Cloudflare (CDN et WAF) et UFW (Pare-feu Ubuntu).
- **Traitement d'Image** : Sharp.js (pour le Watermark et la compression des images).

---

## 🌐 2. La Couche Réseau et Sécurité (La Porte d'Entrée)

**Trafic Client ➔ Cloudflare ➔ UFW (Pare-feu) ➔ Fail2Ban**

*   **Cloudflare :** Tous les visiteurs passent d'abord par le CDN Cloudflare. Il met en cache les pages statiques, gère la résolution DNS et bloque les requêtes de base identifiées comme malveillantes (Mini-WAF / DDoS).
*   **UFW (Uncomplicated Firewall) :** Le pare-feu système du VPS. Il est configuré avec une politique par défaut de `DROP` (Tirer à vue sur le trafic entrant non autorisé) :
    *   `Port 80 (HTTP)` et `Port 443 (HTTPS)` : ✅ Ouverts (Profil "Nginx Full")
    *   `Port 22 (SSH)` : ✅ Ouvert pour l'administration sécurisée.
    *   `Port 5000 (Node.js API)` : ❌ Fermé de l'extérieur. Seul Nginx (`127.0.0.1`) a l'autorisation de s'y connecter.
*   **Fail2Ban :** Démon de sécurité analysant continuellement les journaux SSH (`/var/log/auth.log`). Banni instantanément (niveau IP) tout assaillant au bout de 3 tentatives de connexion échouées (`maxretry = 3`).

---

## 🚦 3. Le Serveur Web et Reverse Proxy (L'Aiguilleur)

**Nginx (Port 80 / 443)**

Logiciel frontal performant interceptant tout le trafic valide. Deux hôtes virtuels (vHosts) sont configurés :

1.  **Frontend (`youposhmaroc`)** : Hôte virtuel principal pour servir l'application React/Vite compilée au visiteur.
2.  **Backend API (`api.youposhmaroc.com`)** : 
    *   **Rate Limiting** : Limite les abus et le spam (ex: 30 requêtes par seconde par IP) grâce à la configuration de la zone de limite.
    *   **Traitement Statique (Images)** : Utilise l'instruction `location ^~ /uploads/` couplée avec `root` pour isoler les requêtes images. Si on demande `/uploads/products/image.jpeg`, Nginx interroge et distribue directement le fichier depuis le disque, sans contacter l'API (avec en-tête de Cache Navigateur `max-age=30 jours`).
    *   **Reverse Proxy** : Si la route (`/api/`) est appelée, Nginx transfère la requête sur le port `5000` au format HTTP/1.1 (Upgrade/Websockets si requis) et attache les en-têtes `X-Real-IP`.

---

## 🧠 4. La Couche Applicative (Le Cerveau)

**PM2 ➔ Node.js (Port Local 5000)**

Gestionnaire de processus (daemon) robuste assurant le maintien à 100% de l'API Node.js (`backend/src/index.ts`).
*   **Mode Cluster (x4 Workers) :** L'API s'exécute sur 4 fils de calcul distincts gérés par PM2. Chacun consomme autour de 180 Mo de RAM. Ils se partagent la charge des requêtes entrantes simultanées. Également, si une erreur fatale met fin au processus d'un *worker*, PM2 le relance en une demi-seconde sans affecter les autres *workers*.
*   **PM2-Logrotate :** Module installé automatiquement rotatif (`PID 990`). Il s'assure de purger et zipper les fichiers textes de journaux Node.js situés dans `/root/.pm2/logs/` pour sauver de l'espace disque.

---

## 🗄️ 5. La Couche de Données (La Mémoire)

**PostgreSQL 16 (Port Local 5432)**

Le moteur SQL principal du site.
*   Fermé à l'écoute extérieure. Uniquement connecté sur `127.0.0.1`.
*   Contient la base `youposh_db` incluant 14 tables cardinales (`AdminUser`, `Product`, `Order`, `Category`, `StoreSettings`, etc.).
*   Maintient un "pool" d'une vingtaine de connexions SQL actives depuis Node.js pour un temps de traitement accéléré.

---

## 📂 6. La Structure Permanente de Fichiers (72 Go)

Hiérarchie conventionnelle de votre serveur. Tout se passe dans `/var/www/youposh/`.

```text
/var/www/youposh/                 # 👈 Répertoire Racine du Projet
├── frontend/                     # ou 'dist/' - Code source de l'interface client
│   ├── index.html                
│   └── assets/                   
├── backend/                      # Logique métier et serveur API
│   ├── src/                      
│   │   ├── index.ts              # Point d'entrée de l'API (Port 5000)
│   │   ├── routes/               # API Endpoints (categories, products, auth, upload)
│   │   └── utils/                # Outils comme 'watermark.ts'
│   ├── node_modules/             # 560 Mo - Dépendances (Express, Sharp, etc.)
│   ├── uploads/                  # 🖼️ Fichiers servis directement par Nginx
│   │   ├── products/             # Images finales compressées et "watermarkées"
│   │   └── categories/           
│   ├── .originals/               # 🔒 Images sources (sans filigrane), pour pouvoir régénérer
│   ├── .env                      # 🔑 Secrets (DATABASE_URL, JWT_SECRET, ports)
│   └── package.json              
└── backups_auto/                 # 📦 (Optionnel) Là où vos scripts de sauvegarde tournent
```

---

## 🚫 7. Les Pratiques à Éviter Absolument (DANGER)

Pour maintenir la stabilité et la sécurité du serveur, voici ce qu'il **ne faut jamais faire** :

1. **Ne jamais ouvrir le port 5000 dans UFW** (`ufw allow 5000`). L'API doit rester cachée derrière Nginx. Ouvrir ce port permet à n'importe quel robot de contourner les sécurités Cloudflare et Nginx, ce qui a causé la fuite de 396 Go de bande passante.
2. **Ne jamais cloner le dossier du projet** (`/youposh-api`) pour faire des tests "en direct" sur le disque de production. Cela crée de la confusion, gâche des centaines de Mo de disque, et complique la lecture des logs. Utilisez votre PC Windows pour tester le code, puis envoyez la version finale sur le VPS (`git pull` ou `scp`).
3. **Ne jamais écrire de mot de passe faible pour l'utilisateur Root** (Exemple: `Abc12345!`). Plus de 20 000 robots tentent de deviner le mot de passe chaque jour.
4. **Ne jamais modifier les permissions du dossier `uploads/` à l'aveugle.** (`chmod 777`). Le dossier `/var/www/youposh/backend/uploads/` doit rester en lecture/exécution, sinon Nginx vous renverra des erreurs 403 (Forbidden) lors de l'affichage des images.
5. **Éviter de modifier la priorité des instructions Nginx**. L'ajout d'une directive de cache générique sans tenir compte de la priorité (comme avec `location ^~ /uploads/`) a précédemment "cassé" l'affichage natif de vos images, provoquant des "404 Not Found" que Cloudflare a mis en cache.
6. **Attention aux virus mineurs de cryptomonnaies cachés** : Étant donné que le VPS a été exposé par le passé, des logiciels malveillants ont pu s'installer (ex: processus masqué en `[mm_percpu_wq]`). Toujours surveiller la métrique "CPU Load" ; si elle atteint 100% alors que les Node Workers (`node`) sont calmes, c'est généralement le signe d'une compromission (qui a été nettoyée avec succès lors de l'incident de mars 2026).

---

## 🛡️ 8. Script Matinal : Sauvegarde Vibe Coder

Pour créer une copie physique robuste incluant le code complet et la base de données entière :

Sur le serveur VPS, exécutez et concevez ce script (ex: `nano /root/backup_complet.sh`) :

```bash
#!/bin/bash
BACKUP_DIR="/root/sauvegardes_youposh"
DB_NAME="youposh_db"
DATE=$(date +"%Y-%m-%d_%H-%M")
ARCHIVE_NAME="youposh_complet_$DATE.tar.gz"

mkdir -p "$BACKUP_DIR"

# Dump robuste de BD 
sudo -u postgres pg_dump "$DB_NAME" > "/tmp/database_$DATE.sql"

# Compression intégrale de root dir et BD
tar -czf "$BACKUP_DIR/$ARCHIVE_NAME" -C /var/www youposh/ -C /tmp "database_$DATE.sql"

rm "/tmp/database_$DATE.sql"
echo "Sauvegarde créée : $BACKUP_DIR/$ARCHIVE_NAME"
```

**Pour rapatrier le backup du VPS au PC local :**
*En PowerShell sur Windows :*
```powershell
scp root@84.247.184.208:/root/sauvegardes_youposh/*.tar.gz "C:\Users\MSI\Desktop\you shop\"
```

---

## 🚀 9. Journal de Déploiement — 27/03/2026 (Production)

### Contexte
- Déploiement réalisé sur le VPS Contabo après push GitHub de `main`.
- Passage de `5f5bee1` vers `8a56fa9`.
- Objectif principal : appliquer les nouvelles modifications frontend + backend (dont pagination boutique).

### Commandes exécutées sur le VPS
```bash
cd /var/www/youposh
git pull origin main

cd /var/www/youposh/backend
npm install
npm run build
pm2 restart all

sudo systemctl restart nginx
pm2 status
sudo systemctl status nginx --no-pager
```

### Résultats observés
- `git pull` : fast-forward réussi de `5f5bee1` vers `8a56fa9`.
- `npm install` : installation réussie (14 vulnérabilités signalées par audit, non bloquantes pour le déploiement).
- `npm run build` backend : `tsc` terminé sans erreur.
- `pm2 restart all` : 4 workers `youshop-api` online (cluster).
- `nginx` : service `active (running)` après redémarrage.

### Fichiers impactés lors de ce pull
- `backend/src/routes/products.ts`
- `src/components/layout/Header.tsx`
- `src/components/ui/ProductCard.tsx`
- `src/index.css`
- `src/lib/api.ts`
- `src/pages/HomePage.tsx`
- `src/pages/ProductPage.tsx`
- `src/pages/ShopPage.tsx`

### Check-list post-déploiement (à garder)
1. Vérifier l’API : `pm2 status` doit afficher `online` pour tous les workers.
2. Vérifier Nginx : `sudo systemctl status nginx --no-pager`.
3. Vérifier la boutique en prod : chargement des produits, pagination, images, ajout panier.
4. Si un comportement front semble ancien : purger cache Cloudflare + hard refresh navigateur.
