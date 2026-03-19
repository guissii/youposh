# Audit de Performance et Optimisation des Ressources (VPS)

Cet audit évalue l'état actuel de l'application YouShop en termes d'optimisation des performances et propose des solutions concrètes pour maximiser l'utilisation des ressources de votre VPS Contabo (Cloud VPS 10, NVMe).

## 1. Frontend (React / Vite)

### État actuel : **Excellent**
Le frontend est déjà très bien optimisé grâce à la configuration `vite.config.ts`.
*   **Compression Avancée** : Les plugins `vite-plugin-compression` génèrent des fichiers Gzip (`.gz`) et Brotli (`.br`). Cela réduit la taille du code téléchargé par les clients de plus de 70%.
*   **Code Splitting** : Le code est séparé en plusieurs morceaux (`vendor`, `ui`). Si vous modifiez un composant, le navigateur des clients n'aura pas à retélécharger React ou les autres grosses librairies.
*   **Lazy Loading des Images** : L'utilisation de `react-lazy-load-image-component` avec l'effet de flou (`effect="blur"`) est implémentée partout (Produits, Panier, Recherche). Cela économise énormément de bande passante.

### Recommandations Frontend
*   *Rien à faire dans l'immédiat.* L'architecture actuelle est robuste et prête pour la production.

---

## 2. Backend (Node.js / Express)

### État actuel : **Bon**
*   **Compression HTTP** : Le middleware `compression()` est activé, ce qui réduit la taille des réponses JSON envoyées par l'API.
*   **Base de données** : PostgreSQL (Prisma) tourne localement ou via un pooler efficace, ce qui limite la latence réseau.

### Recommandation Backend : PM2 Cluster Mode (Très Important)
Actuellement, votre serveur Node.js tourne en mode "Fork" (un seul processus). Node.js est "single-threaded" par défaut, ce qui signifie qu'il n'utilise qu'un seul cœur (CPU) de votre VPS, même si vous en avez plusieurs !

**La solution : Le mode Cluster de PM2.**
Ce mode va créer un processus Node.js pour *chaque* cœur de votre CPU. Si votre VPS a 4 cœurs, PM2 lancera 4 instances de votre backend qui se partageront le travail, multipliant par 4 la capacité de votre serveur à encaisser des visiteurs simultanés.

---

## 3. Plan d'Action (À exécuter sur le VPS)

Pour appliquer ces optimisations et corriger les statistiques (comme discuté précédemment), veuillez copier et coller ces commandes sur votre VPS :

### Étape 1 : Mettre à jour et compiler le code
```bash
cd /var/www/youposh
git reset --hard
git pull origin main
cd backend
npm install
npx prisma generate
npx prisma db push
npm run build
```

### Étape 2 : Activer le Mode Cluster PM2
Nous allons supprimer l'ancien processus simple et lancer le nouveau en mode cluster maximum :

```bash
# 1. Supprimer l'ancien processus
pm2 delete youshop-api

# 2. Relancer en mode Cluster (utilise tous les cœurs CPU disponibles)
pm2 start dist/index.js --name "youshop-api" -i max

# 3. Sauvegarder la configuration pour qu'elle redémarre en cas de reboot du VPS
pm2 save
```

## Résultat attendu après ces commandes :
1.  **Vitesse** : Le site sera plus rapide à répondre car la charge sera répartie sur tous les processeurs de votre VPS.
2.  **Stabilité** : Si un processus crash (erreur mémoire), les autres continuent de fonctionner, garantissant un "Zero Downtime".
3.  **Statistiques** : Le bug des vues "gonflées" (dû aux robots et aux rafraîchissements) sera corrigé grâce au nouveau code que vous viendrez de `pull`.