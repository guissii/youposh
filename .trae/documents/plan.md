# Plan d'Amélioration UI/UX : Carousel d'Images Produit

## 1. Audit de l'Existant

### État Actuel

Le fichier `src/pages/ProductPage.tsx` gère l'affichage de la page produit.

* **Affichage Principal** : Une image unique est affichée dans un conteneur `div` (ligne 311).

* **Navigation** : La navigation se fait uniquement via une liste de miniatures (thumbnails) en dessous (ligne 374).

* **État** : Une variable d'état `selectedImage` (index numérique) contrôle l'image affichée.

* **Interaction** : Le clic sur une miniature met à jour `selectedImage`. Il n'y a pas de fonctionnalité de glissement (swipe) pour les appareils tactiles.

* **Composants** : Le projet dispose déjà d'un composant `Carousel` réutilisable dans `src/components/ui/carousel.tsx` basé sur `embla-carousel-react`, mais il n'est pas utilisé sur la page produit.

### Problèmes Identifiés

* Manque de fluidité sur mobile (pas de swipe).

* Expérience utilisateur datée comparée aux standards e-commerce (Amazon, Shopify).

* Friction dans la navigation entre les images (clic obligatoire).

## 2. Objectifs

Implémenter un carousel tactile pour les images produits sans modifier le backend ni la structure globale de l'interface.

### Fonctionnalités Attendues

* **Swipe Horizontal** : Navigation tactile (gauche/droite) sur l'image principale.

* **Synchronisation Bidirectionnelle** :

  * Swipe du carousel -> Met à jour la miniature active.

  * Clic sur miniature -> Scrolle le carousel vers l'image correspondante.

* **Indicateurs Visuels** : Maintien des miniatures actives.

* **Conservation des Overlays** : Garder les badges (Promo, Stock), le filigrane (Watermark) et le bouton de zoom au-dessus du carousel.

## 3. Plan d'Implémentation

### Fichiers à Modifier

* `src/pages/ProductPage.tsx`

### Étapes Détaillées

#### Étape 1 : Importation des Composants

Importer les composants nécessaires depuis la librairie UI existante :

```typescript
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi
} from "@/components/ui/carousel";
```

#### Étape 2 : Adaptation de l'État (State)

Ajouter un état pour l'API du carousel afin de le contrôler par code :

```typescript
const [api, setApi] = useState<CarouselApi>();
```

#### Étape 3 : Logique de Synchronisation

Ajouter deux effets (`useEffect`) pour synchroniser l'état `selectedImage` et le carousel :

1. **Carousel vers État** : Écouter l'événement `select` de l'API Embla pour mettre à jour `selectedImage` quand l'utilisateur swipe.
2. **État vers Carousel** : Quand `selectedImage` change (via clic miniature), appeler `api.scrollTo(index)` pour bouger le carousel.

#### Étape 4 : Modification du Rendu (JSX)

Remplacer le conteneur de l'image principale actuelle par le composant `Carousel`.

**Structure Actuelle :**

```jsx
<div className="relative aspect-square ...">
  <LazyLoadImage src={currentImage} ... />
  {/* Overlays (Badges, Watermark, Zoom) */}
</div>
```

**Nouvelle Structure Proposée :**

```jsx
<div className="relative aspect-square ...">
  <Carousel setApi={setApi} className="w-full h-full">
    <CarouselContent>
      {galleryImages.map((img, index) => (
        <CarouselItem key={index}>
          <div className="w-full h-full flex items-center justify-center">
             <LazyLoadImage src={img} ... />
          </div>
        </CarouselItem>
      ))}
    </CarouselContent>
  </Carousel>
  
  {/* Les Overlays (Badges, Watermark, Zoom) restent ici, en position absolue par-dessus le carousel */}
</div>
```

### Contraintes Techniques & Style

* **CSS** : Utiliser les classes utilitaires Tailwind existantes (`w-full`, `h-full`) pour s'assurer que le carousel remplit le conteneur carré.

* **Performance** : Continuer d'utiliser `LazyLoadImage` pour l'optimisation.

* **Responsive** : Le comportement swipe sera natif sur mobile grâce à Embla Carousel.

## 4. Vérification

* **Test Mobile** : Simuler un appareil mobile et vérifier que le glissement (swipe) change l'image.

* **Test Desktop** : Vérifier que le clic sur les miniatures fonctionne toujours.

* **Test Synchro** : Vérifier que la bordure bleue de la miniature active suit l'image affichée dans le carousel.

* **Intégrité** : Vérifier que le zoom, les badges et le filigrane s'affichent correctement par-dessus les images.

