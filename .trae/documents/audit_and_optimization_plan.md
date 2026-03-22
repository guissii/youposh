# Plan d'Audit et d'Optimisation du Projet YouShop

Ce plan détaille les étapes pour optimiser le site YouShop afin de respecter parfaitement les normes modernes de performance, sécurité et évolutivité pour React (Frontend) et Node.js (Backend).

## 1. Analyse de l'État Actuel (Current State Analysis)

Suite à l'exploration du code, voici les points critiques identifiés qui nécessitent une optimisation :

### Backend (Node.js / Express / Prisma)
- **Calcul de popularité non scalable (O(n))** : Dans `backend/src/routes/products.ts`, la route récupère l'ensemble des produits de la base de données (`findMany` sans limite) pour les trier en mémoire (avec `getPopularityScore`) et identifier les produits populaires ou nouveaux. Si la boutique grandit (ex: 5000+ produits), cela provoquera un goulot d'étranglement majeur et une surconsommation de RAM.
- **Sécurité et Rate Limiting** : `backend/src/index.ts` ne contient pas de middlewares de sécurité de base comme `helmet` ni de limitation de débit (`express-rate-limit`). L'API est vulnérable aux attaques par force brute ou de type DDoS.
- **Gestion des logs** : Le backend utilise `console.log` et `console.error`. Il manque un logger structuré pour la production.

### Frontend (React / Vite)
- **Gestion du State Asynchrone (Caching)** : Les appels API (ex: `fetchProducts` dans `ShopPage.tsx` et `HomePage.tsx`) sont faits manuellement avec des `useEffect`. Il n'y a pas de mise en cache, ce qui entraîne des re-chargements de données inutiles lors de la navigation entre les pages (retours en arrière).
- **Mémoïsation des composants** : Le composant `ProductCard.tsx` (très utilisé dans les listes) n'est pas enveloppé dans `React.memo`. Cela provoque des re-rendus inutiles du DOM à chaque changement d'état du parent.

---

## 2. Changements Proposés (Proposed Changes)

### Étape 1 : Sécurisation du Backend (Node.js)
**Fichiers concernés :** `backend/package.json`, `backend/src/index.ts`
- **Quoi :** Ajouter `helmet` et `express-rate-limit`.
- **Pourquoi :** Protéger contre les vulnérabilités web courantes (XSS, Clickjacking) et empêcher les attaques DDoS/Brute Force.
- **Comment :** 
  - Installer les dépendances : `npm install helmet express-rate-limit` dans le dossier backend.
  - Configurer le rate limiter dans `index.ts` (ex: max 100 requêtes / 15 minutes par IP).
  - Ajouter `app.use(helmet())`.

### Étape 2 : Optimisation des requêtes Prisma (Backend)
**Fichiers concernés :** `backend/src/routes/products.ts`
- **Quoi :** Remplacer le tri en mémoire par un tri direct via la base de données PostgreSQL.
- **Pourquoi :** Éviter de charger des milliers d'enregistrements en RAM.
- **Comment :**
  - Au lieu de faire un `findMany` global et de calculer le score de popularité en JavaScript (`getPopularityScore`), nous allons utiliser `orderBy` dans Prisma en combinant `salesCount` et `viewsCount` (ex: trier par ventes puis par vues) directement dans la requête pour récupérer uniquement les 8 meilleurs (avec `take: 8`).
  - Idem pour les produits récents (`isNew`), utiliser `orderBy: { publishedAt: 'desc' }` avec `take: 8`.

### Étape 3 : Implémentation de React Query (Frontend)
**Fichiers concernés :** `package.json`, `src/App.tsx`, `src/pages/HomePage.tsx`, `src/pages/ShopPage.tsx`
- **Quoi :** Remplacer les appels API `useEffect` par `@tanstack/react-query`.
- **Pourquoi :** Mettre en cache les requêtes, éviter les chargements répétitifs, gérer automatiquement les états de chargement/erreur, et améliorer drastiquement l'UX perçue.
- **Comment :**
  - Installer : `npm install @tanstack/react-query` dans le dossier racine.
  - Ajouter le `QueryClientProvider` dans `App.tsx` ou `main.tsx`.
  - Créer des hooks personnalisés (ex: `useProducts`) et remplacer la logique de `useState` + `useEffect` dans les pages.

### Étape 4 : Optimisation des performances de rendu React
**Fichiers concernés :** `src/components/ui/ProductCard.tsx`
- **Quoi :** Envelopper `ProductCard` dans `React.memo()`.
- **Pourquoi :** Empêcher le composant de se re-rendre si ses `props` (le produit) n'ont pas changé. Cela allège la charge processeur du navigateur sur les longues listes (ShopPage).
- **Comment :** Exporter `export default React.memo(ProductCard, arePropsEqual)`.

---

## 3. Dépendances et Choix Techniques (Assumptions & Decisions)
- **Choix de React Query** : C'est le standard de l'industrie pour la gestion d'état serveur dans React. Il est léger et s'intègre parfaitement avec l'architecture actuelle.
- **Calcul de Popularité simplifié** : La formule actuelle de popularité (`getPopularityScore`) sera traduite en un tri SQL/Prisma équivalent pour garantir des performances O(1) avec index.

## 4. Étapes de Vérification (Verification Steps)
1. **Backend** : Tester les endpoints `/api/products?sort=popular` via curl ou le navigateur pour vérifier que la réponse est rapide (< 100ms) et correcte sans surcharger la RAM.
2. **Backend Sécurité** : Faire plus de 100 requêtes rapides pour vérifier que le rate limiter bloque avec un status `429 Too Many Requests`.
3. **Frontend Cache** : Naviguer de la page d'accueil vers une catégorie, puis revenir en arrière. La page d'accueil doit s'afficher instantanément (sans loader) grâce à React Query.
4. **Frontend Rendu** : Vérifier avec les React DevTools que les `ProductCard` ne clignotent pas (ne se re-rendent pas) lorsqu'on modifie un filtre global sans impact direct sur elles.