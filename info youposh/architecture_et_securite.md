# Documentation Technique : YouShop

Ce document détaille l'architecture complète de votre projet e-commerce (YouShop), les technologies utilisées, ainsi que les informations de sécurité (identifiants et mots de passe) nécessaires à la gestion de votre serveur.

---

## 1. Technologies Utilisées (Stack Technique)

Votre application est divisée en deux grandes parties : le Frontend (ce que le client voit) et le Backend (le moteur caché).

### Frontend (L'interface utilisateur)
*   **React.js & TypeScript** : Langage principal pour créer les interfaces.
*   **Vite** : Outil de compilation ultra-rapide (remplace Webpack/Create React App).
*   **Tailwind CSS** : Pour le design et la mise en page responsive.
*   **Zustand** : Gestion de l'état global (Panier, Paramètres de la boutique).
*   **Lucide React** : Bibliothèque d'icônes.

### Backend (Le serveur)
*   **Node.js & Express.js** : Serveur API robuste et performant.
*   **TypeScript** : Pour un code sécurisé et typé.
*   **Prisma ORM** : Outil pour interagir facilement avec la base de données.
*   **PostgreSQL** : Base de données relationnelle puissante (hébergée localement sur le VPS).
*   **PM2** : Gestionnaire de processus. Il maintient le serveur allumé 24/7 et utilise le **Mode Cluster** pour exploiter les 10 cœurs du serveur.

### Intégrations Externes
*   **Google Sheets API** : Pour synchroniser les commandes avec un tableau Google.
*   **Supabase** : Utilisé précédemment/actuellement pour le stockage d'images ou base de données distante de secours.
*   **WhatsApp** : Redirection pour la confirmation des commandes.

---

## 2. Architecture du Serveur (VPS Contabo)

Votre serveur est un **Cloud VPS 10 (NVMe)** chez Contabo, situé en Europe.
*   **Adresse IP** : `84.247.184.208`
*   **Système d'exploitation** : Ubuntu 24.04.1 LTS (Linux)

### Structure des dossiers
L'intégralité du code de votre projet se trouve dans ce dossier principal sur le serveur :
*   `📁 /var/www/youposh`
    *   `📁 /backend` : Contient le code du serveur Node.js, la configuration Prisma, et le fichier caché `.env`.
    *   `📁 /dist` : (Dans le frontend) Contient le site web compilé prêt à être envoyé aux visiteurs.

### Services en cours d'exécution
1.  **Nginx** : Le serveur web principal (Reverse Proxy). Il intercepte les requêtes des visiteurs (port 80 et 443 pour le HTTPS) et les envoie au backend Node.js.
2.  **PM2 (youshop-api)** : Gère le backend Node.js. Il tourne en *Cluster Mode* avec 4 instances (ou plus selon les cœurs) pour répartir la charge de calcul.
3.  **PostgreSQL** : La base de données qui tourne sur le port local `5432`.

---

## 3. Informations de Sécurité et Mots de passe

*⚠️ Ce document contient des informations sensibles. Gardez-le en sécurité et ne le partagez pas publiquement.*

### Accès VPS (Serveur Contabo)
Pour vous connecter au terminal de votre serveur depuis votre ordinateur (via PowerShell ou Terminal) :
*   **Commande SSH** : `ssh root@84.247.184.208`
*   **Nom d'utilisateur** : `root`
*   **Mot de passe** : `[À COMPLÉTER - Celui choisi lors de la commande Contabo]`

### Base de données (PostgreSQL Local)
Ces identifiants permettent à l'application de lire et écrire les produits et commandes.
*   **Base de données** : `youposh_db`
*   **Utilisateur** : `youshop`
*   **Mot de passe** : `YoushopLocal2026_`
*   **URL de connexion (dans le .env)** : `postgresql://youshop:YoushopLocal2026_@localhost:5432/youposh_db`

### Sécurité API (JWT)
Clé secrète utilisée pour chiffrer les sessions de connexion au panneau d'administration.
*   **JWT_SECRET** : `CHANGE_ME_LONG_RANDOM` *(Note : Il est conseillé de changer cela par une chaîne de caractères complexe dans le futur pour plus de sécurité).*

### Accès Google Sheets
Le compte de service qui permet à votre boutique d'écrire dans le fichier Excel.
*   **Email de service** : `yousposh-sheets@youshop-prod.iam.gserviceaccount.com`
*   **ID du Spreadsheet** : `1k76HdtTH4mVY13rK1l3xafpHRjS4cckbYdyo3t8jUl0`

### Supabase (Optionnel / Images)
*   **URL** : `https://siuwyqzukrjhpaynjbcy.supabase.co`
*   **Clé de service (Service Role Key)** : *(Présente dans le .env du serveur, commence par eyJhbG...)*

### Panneau d'administration (Frontend)
Il s'agit des identifiants pour vous connecter à l'interface `votresite.com/login` (ou `/admin`).
*   **Email Admin** : `[À COMPLÉTER - Votre email d'administrateur]`
*   **Mot de passe Admin** : `[À COMPLÉTER - Votre mot de passe d'administrateur]`

---

## 4. Commandes Utiles (Cheatsheet)

Si vous devez faire des mises à jour ou réparer le serveur, connectez-vous via SSH et utilisez ces commandes :

**Mettre à jour le code depuis GitHub :**
```bash
cd /var/www/youposh
git reset --hard
git pull origin main
```

**Recompiler et mettre à jour le backend :**
```bash
cd /var/www/youposh/backend
npm install
npx prisma generate
npx prisma db push
npm run build
pm2 restart youshop-api
pm2 save
```

**Voir les erreurs du serveur en direct :**
```bash
pm2 logs youshop-api
```

**Réinitialiser le mot de passe de la base de données (en cas de problème de connexion) :**
```bash
sudo -u postgres psql
ALTER USER youshop WITH PASSWORD 'YoushopLocal2026_';
\q
```