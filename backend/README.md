# YouPosh Backend - API & Infrastructure

Ce répertoire contient le cœur applicatif de la plateforme YouPosh. Conçu pour la performance et la scalabilité, il gère la logique métier, l'accès aux données et l'optimisation des ressources.

## 🛠️ Stack Technique

- **Runtime** : Node.js (Express.js)
- **Base de Données** : PostgreSQL via Prisma ORM
- **Authentification** : JWT (JSON Web Tokens)
- **Traitement d'images** : Sharp (Optimisation C++)
- **Gestion de Processus** : PM2
- **Infrastructure** : VPS Ubuntu (84.247.184.208) + Nginx

## 📂 Organisation du Code (`/src`)

- **`index.ts`** : Point d'entrée, configuration Express et middleware.
- **`routes/`** : Endpoints de l'API (Auth, Produits, Uploads, Commandes).
- **`utils/`** : Services transversaux (Cache RAM, helpers).
- **`prisma/`** : Schéma de base de données et migrations.

## 🚀 Maintenance et Monitoring

### Gestion des Processus (PM2)
```bash
# Voir l'état des services
pm2 status

# Consulter les logs en temps réel
pm2 logs backend

# Redémarrer l'API
pm2 restart backend
```

### Optimisation des Images
Le backend utilise `Sharp` pour compresser et redimensionner les images lors de l'upload, réduisant ainsi la charge réseau et améliorant le temps de chargement.

### Sécurité
Toutes les routes sensibles sont protégées par JWT. Les variables d'environnement (clés API, secrets) doivent être configurées dans le fichier `.env` à la racine de ce dossier.

---
*Backend YouPosh - Performance & Fiabilité.*
