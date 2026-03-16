# Plan — Nettoyage contacts publics (YOUPOSH)

## Résumé
Nettoyer le projet pour que, dans les pages publiques (Accueil + pages visibles + SEO), le seul numéro affiché/utilisé soit `+212 690-939090` et le seul email affiché soit `Youposh.ys@gmail.com` (en pratique `youposh.ys@gmail.com` tel qu’il est stocké). Remplacer les liens WhatsApp codés en dur par une valeur dérivée de `storeSettings.phone`, et retirer les placeholders “email/phone” qui contiennent d’autres valeurs.

## Analyse de l’état actuel (constats)
- Le contact “officiel” est déjà centralisé dans `defaultStoreSettings` (front) et dans `StoreSettings` (Prisma) : téléphone `+212 690-939090`, email `youposh.ys@gmail.com`.
- Plusieurs écrans publics utilisent encore des duplications “en dur” pour WhatsApp (`https://wa.me/212690939090`) et des fallbacks (`'212690939090'`), ce qui multiplie les endroits à maintenir.
- Il existe des emails différents dans le code (ex: placeholder login admin, seeds/admins, exports). D’après votre précision (“Accueil et ce qui apparaît dans le moteur de recherche”) et vos choix:
  - vous souhaitez **garder 2 admins** (donc on ne refond pas l’authentification),
  - vous souhaitez **garder les exports tels quels**,
  - vous souhaitez **ignorer les fichiers .env**.
  => Le scope de ce plan est donc **le public/SEO** (ce qui peut être crawlé/visible) + retirer les placeholders côté UI pour éviter d’exposer des emails différents.

## Objectif & critères de succès
- Sur les pages publiques et dans les métadonnées SEO, aucun email ne doit apparaître sauf `youposh.ys@gmail.com`.
- Sur les pages publiques, aucun numéro de téléphone ne doit apparaître sauf `+212 690-939090`.
- Les liens WhatsApp (Header/Footer/boutons/pages) doivent utiliser le numéro dérivé de `storeSettings.phone` (et fonctionner même si le format change avec espaces).
- Les placeholders UI ne doivent pas contenir d’adresses email “différentes” (ex: `admin@…`) ni de numéros “exemples” type `+212 6XX…`.

## Changements proposés (fichiers et modifications)

### 1) Centraliser la normalisation WhatsApp (front)
**Fichier**
- [utils.ts](file:///c:/Users/MSI/Desktop/you%20shop/src/lib/utils.ts)

**Changement**
- Ajouter une fonction utilitaire (sans commentaire) pour calculer un numéro compatible `wa.me` à partir d’un téléphone “humain”:
  - entrée: `'+212 690-939090'`, sortie: `'212690939090'`
  - fallback: si vide/invalid => dériver depuis `defaultStoreSettings.phone`
  - règle simple: conserver seulement les chiffres; si le résultat commence par `0` et fait ~10 chiffres, le convertir en `212` + reste (option de robustesse).

**Pourquoi**
- Supprimer la duplication de `212690939090` dispersée dans plusieurs composants.

### 2) Remplacer les liens WhatsApp codés en dur par la valeur dérivée
**Fichiers**
- [Header.tsx](file:///c:/Users/MSI/Desktop/you%20shop/src/components/layout/Header.tsx)
- [Footer.tsx](file:///c:/Users/MSI/Desktop/you%20shop/src/components/layout/Footer.tsx)

**Changements**
- Construire les URLs WhatsApp avec la fonction utilitaire: `https://wa.me/${waPhone}`.
- Garder `phone` affiché au format settings, mais utiliser `waPhone` pour les liens.

### 3) Supprimer les fallbacks “numéro” différents (string) dans les pages publiques
**Fichiers**
- [ProductPage.tsx](file:///c:/Users/MSI/Desktop/you%20shop/src/pages/ProductPage.tsx)
- [ShippingPage.tsx](file:///c:/Users/MSI/Desktop/you%20shop/src/pages/ShippingPage.tsx)
- [FAQPage.tsx](file:///c:/Users/MSI/Desktop/you%20shop/src/pages/FAQPage.tsx)
- [WhatsAppButton.tsx](file:///c:/Users/MSI/Desktop/you%20shop/src/components/ui/WhatsAppButton.tsx)
- [CartDrawer.tsx](file:///c:/Users/MSI/Desktop/you%20shop/src/components/layout/CartDrawer.tsx)

**Changements**
- Remplacer les fallbacks `|| '212690939090'` par `|| normalizeWhatsAppPhone(phone)` (ou équivalent) pour ne plus avoir le numéro “format digits” en dur.
- Sur `FAQPage`, remplacer le texte “+212 6XX XXX XXX” par le numéro officiel `+212 690-939090` (ou enlever le numéro du texte si nécessaire).

### 4) Retirer les placeholders d’emails/numéros non conformes (UI)
**Fichiers**
- [LoginPage.tsx](file:///c:/Users/MSI/Desktop/you%20shop/src/pages/LoginPage.tsx)
- [Footer.tsx](file:///c:/Users/MSI/Desktop/you%20shop/src/components/layout/Footer.tsx)
- [AdminPage.tsx](file:///c:/Users/MSI/Desktop/you%20shop/src/pages/AdminPage.tsx)

**Changements**
- `LoginPage`: remplacer le placeholder `admin@youposh.ys@gmail.com` par un texte sans email (ex: `Email admin`).
- `Footer`: remplacer `placeholder="votre@email.com"` par un texte sans pattern email (ex: `Votre email`).
- `AdminPage`: remplacer le placeholder téléphone `+212 6XX XXX XXX` par `+212 690-939090` (ou un texte neutre sans numéro si vous préférez).

### 5) Contrôle SEO (Accueil + moteur de recherche)
**Fichier**
- [index.html](file:///c:/Users/MSI/Desktop/you%20shop/index.html)

**Changements**
- Pas de changement attendu (le numéro officiel est déjà présent). Vérifier qu’aucun autre email/numéro n’y apparaît.

## Hypothèses & décisions (verrouillées par vos réponses)
- Les emails/n° présents dans les seeds/exemples/exports backend restent tels quels (non modifiés), car vous avez choisi “Garder tel quel”.
- Les fichiers `.env/.env.local` ne sont pas modifiés (“Ignorer”).
- On ne refond pas l’auth admin (vous souhaitez garder 2 admins). On supprime seulement l’exposition d’emails “différents” dans l’UI publique/SEO.

## Vérification (après implémentation)
- Recherche globale (regex email) sur `src/` + `index.html` pour confirmer que le seul email “réel” restant est `youposh.ys@gmail.com` (les `@media` CSS ne comptent pas; utiliser une regex email).
- Recherche globale sur `src/` + `index.html` pour confirmer qu’aucun autre numéro `+212` n’est présent hors `+212 690-939090` (et qu’aucun placeholder `+212 6XX` ne reste).
- Build front: `npm run build` (racine).
- Lint front: `npm run lint` (racine).

