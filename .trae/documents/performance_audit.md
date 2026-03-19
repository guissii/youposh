# Plan d'Optimisation des Performances (Audit VPS)  ne t

Ce plan vise à rendre le site "You Posh" extrêmement rapide et efficace sur votre VPS, en se concentrant sur le frontend et la configuration du serveur web, sans toucher à la logique backend.

## 1. Optimisation des Assets (Images & Vidéo)

C'est le levier le plus important pour la vitesse de chargement.

* **Images** : Conversion de toutes les images statiques (`public/images`) en format **WebP** (plus léger et meilleure qualité).

  * *Action* : Créer un script utilitaire utilisant `sharp` (déjà installé) pour convertir automatiquement les images.

  * *Modification* : Mettre à jour les références d'images dans le code pour utiliser `.webp`.

* **Vidéo Hero** : La vidéo `hero video.mp4` est chargée immédiatement.

  * *Action* : Générer une "image poster" (miniature) légère pour l'afficher pendant le chargement de la vidéo.

  * *Optimisation* : S'assurer que la vidéo est compressée pour le web (Handbrake ou ffmpeg, mais nous ferons ce que nous pouvons via code/config).

* **Lazy Loading** : Vérifier que toutes les images sous la ligne de flottaison utilisent `loading="lazy"` (déjà partiellement en place avec `react-lazy-load-image-component`).

## 2. Configuration du Serveur Nginx (Spécial VPS)

Pour un VPS, la configuration du serveur web est cruciale pour ne pas gaspiller la bande passante et servir les fichiers instantanément.

* **Compression** : Activer **Gzip** et **Brotli** au niveau de Nginx pour réduire la taille des fichiers texte (HTML, CSS, JS) de 70%.

* **Mise en cache (Caching)** : Configurer des en-têtes `Cache-Control` agressifs pour les assets statiques (images, JS, CSS) afin qu'ils soient stockés dans le navigateur du visiteur pendant 1 an (`immutable`).

* **HTTP/2** : Activer HTTP/2 pour le chargement parallèle des ressources.

## 3. Optimisation du Code Frontend (Vite & React)

* **Préchargement (Preloading)** : Ajouter des balises `<link rel="preload">` dans `index.html` pour les ressources critiques (police principale, image/vidéo hero) afin d'éliminer le délai d'affichage.

* **Analyse du Bundle** : Vérifier que les bibliothèques lourdes (`xlsx`) ne sont chargées que sur les pages qui en ont besoin (Admin).

* **Nettoyage** : S'assurer que les dépendances backend (`@google-cloud/storage`) ne sont pas incluses dans le bundle client.

## 4. Stratégie de Cache Avancée (Service Worker)

* Mettre en place une stratégie de cache simple pour les assets statiques via un Service Worker (PWA) pour que le site se charge instantanément lors des visites répétées.

***

## Étapes d'implémentation

1. **Créer le script d'optimisation d'images** : `scripts/optimize-images.js`.
2. **Mettre à jour** **`index.html`** : Ajouter les balises de préchargement (fonts, hero).
3. **Configurer Nginx** : Fournir le fichier `nginx.conf` optimisé à déployer sur le VPS.
4. **Optimiser** **`vite.config.ts`** : Affiner le découpage du code (Code Splitting).
5. **Mise à jour des composants** : Adapter `HomePage.tsx` pour utiliser l'image poster de la vidéo.

Ce plan respecte la contrainte "ne pas toucher au backend" et se concentre purement sur la performance perçue et réelle pour l'utilisateur.
