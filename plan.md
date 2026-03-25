# Plan d'Audit : Problème d'affichage des images sur Mobile

## Objectif
Identifier pourquoi les images des produits disparaissent sur la version mobile du site `youposhmaroc.com` (sur la page de détails du produit) alors qu'elles s'affichent correctement sur PC.

## Hypothèses
1. **Problème Frontend (Le plus probable) :** Le composant galerie/carrousel d'images spécifique à la version mobile (React/CSS/Tailwind) contient un bug (ex: attribut `display: none`, erreur de rendu du composant, ou format d'image non géré par le navigateur mobile comme Safari).
2. **Problème Backend/API (Moins probable) :** Le frontend demande une taille d'image spécifique pour mobile (miniature) que le backend sur le VPS ne parvient pas à trouver ou à générer.
3. **Problème Nginx/Réseau :** Blocage CORS ou problème de cache spécifique aux requêtes mobiles.

## Étapes de l'Audit sur le VPS

### 1. Audit de la structure du Backend
Vérifier l'organisation des fichiers et où sont stockées les images (si elles sont stockées sur le VPS et non sur un service cloud tiers).
- `ls -la /var/www/youposh/backend`
- `ls -la /var/www/youposh/backend/uploads` (ou le dossier contenant les images)

### 2. Audit des logs du Backend (PM2)
Observer en temps réel s'il y a des erreurs API (code 500) lorsqu'un utilisateur clique sur un produit depuis son téléphone.
- `pm2 logs youshop-api --lines 50`

### 3. Audit des logs Nginx (Réseau)
Vérifier les erreurs d'accès réseau pour s'assurer que Nginx ne bloque pas certaines requêtes.
- `tail -n 50 /var/log/nginx/error.log`
- `tail -n 50 /var/log/nginx/access.log`

## Actions Suivantes
Si l'audit du VPS ne révèle aucune erreur (ce qui confirme que le backend envoie correctement les données), nous devrons basculer l'investigation sur le **code source Frontend** (le projet hébergé sur Vercel), particulièrement sur le composant de la page produit responsable de l'affichage mobile.