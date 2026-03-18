# Plan de Résolution des Bugs

## Résumé
Ce plan détaille les modifications nécessaires pour corriger les deux problèmes signalés sur le front-end du site :
1. La suppression des points à la fin des phrases (particulièrement en arabe) qui s'affichent de manière incorrecte à cause du sens de lecture RTL (Right-To-Left).
2. La limitation de la quantité maximale d'un produit à 10 articles lors de la sélection.

## Analyse de l'état actuel
- **Problème des points (.) :** Les fichiers de traduction (`src/i18n/index.ts`) et les données mockées (`src/data/products.ts`) contiennent des chaînes de caractères avec des points à la fin (ex: `descriptionAr: '...صوت عالي الجودة.'`). En arabe, cela provoque un affichage défectueux où le point apparaît au début de la phrase à gauche au lieu de la fin.
- **Problème de quantité :** Dans `src/pages/ProductPage.tsx`, le bouton `+` pour augmenter la quantité limite la valeur par rapport au stock (`maxQty`), mais si le stock est infini, il n'y a pas de limite stricte de 10 appliquée directement sur le bouton. Bien que `StoreContext.tsx` protège le panier à 10 maximum, le formulaire direct WhatsApp contourne cette vérification.

## Modifications Proposées

### 1. Suppression des points à la fin des phrases
Nous allons retirer les points finaux des descriptions et textes pour éviter le bug d'affichage.

- **Fichier ciblé :** `src/i18n/index.ts`
  - *Quoi/Comment :* Parcourir les chaînes de traduction (ex: `footerDescription`, `yourPremier`, `reviewText`, etc.) et supprimer le `.` à la fin des valeurs. Les `...` (points de suspension) seront conservés car ils s'affichent généralement bien ou ont un sens différent.

- **Fichier ciblé :** `src/data/products.ts`
  - *Quoi/Comment :* Retirer le `.` à la fin de tous les champs `descriptionAr` et `description`.

### 2. Limitation de la quantité à 10 produits
Nous allons empêcher l'utilisateur de sélectionner plus de 10 articles pour un même produit.

- **Fichier ciblé :** `src/pages/ProductPage.tsx`
  - *Quoi/Comment :* Modifier l'événement `onClick` du bouton `+` (ligne ~495) pour inclure une limite stricte de 10.
  - *Code actuel :* `onClick={() => setQuantity(Math.min(quantity + 1, Math.max(1, maxQty || 1)))}`
  - *Nouveau code :* `onClick={() => setQuantity(Math.min(quantity + 1, 10, Math.max(1, maxQty || 1)))}`

- **Fichier ciblé :** `src/components/layout/CartDrawer.tsx`
  - *Quoi/Comment :* Désactiver le bouton `+` si `item.quantity >= 10` ou limiter visuellement, bien que la logique backend de `StoreContext` bloque déjà l'ajout au-delà de 10.

## Hypothèses et Décisions
- **Backend non touché :** Conformément à vos instructions, aucune modification ne sera apportée au dossier `backend/`.
- **Points de suspension :** Les `...` comme dans `Chargement...` ne seront pas supprimés car ils ne posent généralement pas le même problème esthétique qu'un point final isolé.

## Étapes de Vérification
1. Changer la langue du site en arabe et vérifier le pied de page, les descriptions de produits et les avis pour confirmer qu'aucun point n'apparaît au début des phrases.
2. Aller sur la page d'un produit, cliquer sur le bouton `+` de quantité et s'assurer qu'il se bloque à 10.
3. Cliquer sur "Continuer la commande" avec la quantité de 10 pour vérifier que le résumé de la commande affiche bien 10 articles.