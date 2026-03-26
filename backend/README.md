# YOUPOSH Backend - Documentation et Architecture

Bienvenue dans le code source du backend API de YOUPOSH. Ce backend est le cœur applicatif de votre plateforme E-commerce, conçu pour la vitesse, la fiabilité, et la sécurité.

Ce serveur Node.js est hébergé en production sur votre serveur **VPS distant (IP: 84.247.184.208)**.

---

## 🛠️ Stack Technologique & Sécurité

*   **Serveur HTTP:** `Express.js` (sécurisé via Nginx Https Reverse Proxy)
*   **Base de Données:** `PostgreSQL` via `Prisma ORM`
*   **Authentification Admin:** JWT (JSON Web Tokens)
*   **Stockage de Fichiers:** Local Storage avec gestion d'Optimisation par l'Intelligence Artificielle C++ (`Sharp`).
*   **Infrastructure Système:**
    *   **OS :** Ubuntu Linux (Sur VPS 84.247.184.208)
    *   **Process Manager :** `PM2` (Redémarre le backend instantanément s'il y a un plantage)
    *   **Firewall & CDN :** Cloudflare Edge Caching (Les images sont gardées en cache 1 mois)

---

## 📂 Structure du Code Source (`/backend/src`)

Voici comment les dossiers sont structurés :

*   **`src/index.ts` :** Le ficher Principal. Contient la toute première configuration du serveur Express, le lancement du port réseau, et le branchement des Routes.
*   **`src/routes/` :** Contient la logique des URL accessibles par le frontend :
    *   *`auth.ts` :* Connexion Administrateur et génération de JWT.
    *   *`products.ts` :* Listing du catalogue, ajout et suppression des produits côté Admin.
    *   *`upload.ts` :* Gère l'encodage des images envoyées depuis le navigateur web, et utilise `Sharp` pour les compresser avant la sauvegarde sur le disque (`/uploads/`).
*   **`src/utils/`** : Utilitaires et fonctions d'aide.
    *   *`cache.ts` :* L'ultime secret de la vitesse de votre site. Le Caching RAM Node.js qui intercepte les requêtes répétitives de base de données.
*   **`prisma/` :** Configuration de la Base de Données.
    *   *`schema.prisma` :* Contient l'infrastructure intégrale de vos tables de données (Utilisateurs, Commandes, Produits).

---

## 🚀 Guide de Surveillance (Crash ou Plantage)

### 1. Que se passe-t-il si une image Fantôme (Corrompue) survient ?
Votre dossier en production recevant les images se trouve ici :
`/var/www/youposh/backend/uploads/products/`

Si Cloudflare enregistrait par accident une image en "404", une étiquette **[ IMAGE FANTÔME ] rouge vif** apparaîtra instantanément dans votre Espace Admin sur React. Vous n'avez qu'à cliquer sur la petite croix sur l'image dans l'onglet Admin pour la détruire de la base de données.

### 2. Comment vérifier la santé temps-réel du backend ?
Dans le nouvel onglet **"Serveur (VPS)"** du panneau d'administration, le paramètre qui garantit un fonctionnement sain est l'utilisation Mémoire de la base de données (PostgreSQL), et la disponibilité continue de PM2 (🟢 UP).

### 3. Comment consulter les véritables logs d'erreurs bruts ?
Si un développeur doit analyser une panne technique profonde, voici les commandes vitales depuis votre ordinateur Windows vers le Terminal :

1. Entrer dans le VPS : `ssh root@84.247.184.208`
2. Aller dans le dossier : `cd /var/www/youposh/backend`
3. Afficher en direct les erreurs de code : `pm2 logs backend`
