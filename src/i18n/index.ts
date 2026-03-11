import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  fr: {
    translation: {
      // Navigation
      home: 'Accueil',
      shop: 'Boutique',
      categories: 'Catégories',
      promotions: 'Promotions',
      bestsellers: 'Meilleures ventes',
      newArrivals: 'Nouveautés',
      wishlist: 'Favoris',
      cart: 'Panier',
      search: 'Recherche',
      account: 'Compte',
      contact: 'Contact',
      about: 'À propos',
      faq: 'FAQ',
      delivery: 'Livraison',
      returns: 'Retours',
      trackOrder: 'Suivi commande',
      terms: 'Conditions',
      privacy: 'Confidentialité',

      // Top Bar
      deliveryAllMorocco: 'Livraison partout au Maroc',
      deliveryShort: 'Livraison',
      deliveryTime: '24-48h',

      // Hero
      heroSlogan: 'UNE MARQUE MAROCAINE',
      heroBadgeTitle: 'N°1 au Maroc',
      heroTitle: 'Des produits tendance pour votre quotidien',
      heroSubtitle: 'Des accessoires utiles, modernes et soigneusement sélectionnés pour vous partout au Maroc.',
      specialOffer: 'Offre spéciale',
      newCollection: 'Nouvelle collection',
      shopNow: 'Acheter maintenant',
      discover: 'Découvrir',
      explore: 'Explorer',

      // Categories
      browseCategories: 'Découvrez nos catégories',
      electronique: 'Électronique',
      maison: 'Maison',
      beaute: 'Beauté',
      mode: 'Mode',
      auto: 'Auto',
      gaming: 'Gaming',
      cadeaux: 'Cadeaux',
      jouets: 'Jouets',

      // Products
      allProducts: 'Tous les produits',
      productsFound: 'produits trouvés',
      noProducts: 'Aucun produit',
      tryDifferentFilters: 'Essayez d\'autres filtres',
      productNotFound: 'Produit non trouvé',
      backToHome: 'Retour à l\'accueil',

      // Filters
      filters: 'Filtres',
      sort: 'Trier',
      all: 'Tous',
      show: 'Afficher',
      mostPopular: 'Plus populaires',
      newest: 'Nouveautés',
      priceLowToHigh: 'Prix croissant',
      priceHighToLow: 'Prix décroissant',
      biggestDiscount: 'Meilleures réductions',
      onSale: 'En promotion',
      inStockOnly: 'En stock uniquement',

      // Product Card
      addToCart: 'Ajouter au panier',
      addToWishlist: 'Ajouter aux favoris',
      added: 'Ajouté',
      order: 'Commander',
      orderNow: 'Commander maintenant',
      orderViaWhatsApp: 'Commander sur WhatsApp',
      quickView: 'Aperçu rapide',
      promo: 'PROMO',
      new: 'NOUVEAU',
      bestseller: 'TOP',
      save: 'Économisez',

      // Product Page
      back: 'Retour',
      quantity: 'Quantité',
      total: 'Total',
      description: 'Description',
      specs: 'Spécifications',
      reviews: 'Avis',
      features: 'Caractéristiques',
      relatedProducts: 'Produits similaires',
      inStock: 'En stock',
      outOfStock: 'Rupture de stock',
      sku: 'Référence',
      category: 'Catégorie',
      warranty: 'Garantie',
      year: 'an',
      origin: 'Origine',
      reviewText: 'Excellent produit, je recommande vivement ! Livraison rapide et emballage soigné.',

      // Cart
      yourCart: 'Votre panier',
      emptyCart: 'Votre panier est vide',
      emptyCartDesc: 'Ajoutez des produits pour commencer vos achats',
      startShopping: 'Commencer les achats',
      continueShopping: 'Continuer les achats',
      subtotal: 'Sous-total',
      shippingCalculated: 'Livraison calculée à la caisse',
      proceedCheckout: 'Passer la commande',

      // Search
      searchPlaceholder: 'Rechercher un produit...',
      searchResults: 'Résultats de recherche',
      popularSearches: 'Recherches populaires',
      recentSearches: 'Recherches récentes',
      noResults: 'Aucun résultat trouvé',

      // Flash Sales
      flashSales: 'Ventes flash',
      limitedTime: 'Offre limitée',
      seeAll: 'Voir tout',

      // Popular
      popularProducts: 'Produits populaires',

      // Promo Banner
      promoBannerTitle: 'Profitez de nos promotions',
      promoBannerDesc: 'Jusqu\'à 50% de réduction sur une sélection de produits',
      discoverPromos: 'Découvrir les promos',

      // Trust Badges
      whatsappSupport: 'Support WhatsApp',
      whatsappSupportDesc: 'Réponse en moins de 5 min',
      fastDelivery: 'Livraison rapide',
      fastDeliveryDesc: '24-48h partout au Maroc',
      bestPrices: 'Meilleurs prix',
      bestPricesDesc: 'Prix compétitifs garantis',
      securePayment: 'Paiement sécurisé',
      securePaymentDesc: 'Paiement à la livraison',

      // Footer
      yourPremier: 'Votre boutique en ligne de produits de qualité au meilleur prix.',
      footerDescription: 'YOUPOSH - Votre destination privilégiée pour les produits électroniques, accessoires et gadgets au Maroc.',
      quickLinks: 'Liens rapides',
      help: 'Aide',
      aboutUs: 'Qui sommes-nous',
      followUs: 'Suivez-nous',
      paymentMethods: 'Paiement',
      allRightsReserved: 'Tous droits réservés',

      // Benefits
      whatsappOrder: 'Commande WhatsApp',
      easyFast: 'Rapide & facile',
      cashOnDelivery: 'Paiement à la livraison',
      payOnReceive: 'Payez à la réception',
      easyExchange: 'Échange facile',
      '7daysExchange': '7 jours pour échanger',

      // Admin
      adminPanel: 'Panneau Admin',
      dashboard: 'Tableau de bord',
      orders: 'Commandes',
      products: 'Produits',
      customers: 'Clients',
      settings: 'Paramètres',
      logout: 'Déconnexion',
      totalOrders: 'Total commandes',
      totalRevenue: 'Revenu total',
      pendingOrders: 'Commandes en attente',
      completedOrders: 'Commandes terminées',
      orderId: 'N° Commande',
      customer: 'Client',
      date: 'Date',
      status: 'Statut',
      actions: 'Actions',
      viewDetails: 'Voir détails',
      markComplete: 'Marquer comme terminée',
      pending: 'En attente',
      processing: 'En traitement',
      shipped: 'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',

      // Misc
      loading: 'Chargement...',
      error: 'Erreur',
      success: 'Succès',
      close: 'Fermer',
      confirm: 'Confirmer',
      cancel: 'Annuler',
    }
  },
  ar: {
    translation: {
      // Navigation
      home: 'الرئيسية',
      shop: 'الماگازان',
      categories: 'الكاتيگوريات',
      promotions: 'التخفيضات',
      bestsellers: 'لي كيتباعو بزاف',
      newArrivals: 'جداد',
      wishlist: 'المفضلين',
      cart: 'البانيي',
      search: 'قلّب',
      account: 'حسابي',
      contact: 'تواصل معانا',
      about: 'شكون حنا',
      faq: 'أسئلة شائعة',
      delivery: 'التوصيل',
      returns: 'الترجاع',
      trackOrder: 'تتبع الطلب',
      terms: 'الشروط',
      privacy: 'الخصوصية',

      // Top Bar
      deliveryAllMorocco: 'توصيل لكامل المغرب',
      deliveryShort: 'توصيل',
      deliveryTime: '24-48 ساعة',

      // Hero
      heroSlogan: 'ماركة مغربية',
      heroBadgeTitle: 'رقم 1 فالمغرب',
      heroTitle: 'منتوجات عصرية لحياتك اليومية',
      heroSubtitle: 'إكسسوارات مفيدة ومختارين بعناية، والتوصيل فالمغرب كامل.',
      specialOffer: 'عرض خاص',
      newCollection: 'تشكيلة جديدة',
      shopNow: 'شري دابا',
      discover: 'شوف',
      explore: 'تقلّب',

      // Categories
      browseCategories: 'شوف الكاتيگوريات ديالنا',
      electronique: 'إلكترونيات',
      maison: 'دار',
      beaute: 'جمال',
      mode: 'موضة',
      auto: 'طوموبيل',
      gaming: 'گيمينگ',
      cadeaux: 'كادوات',
      jouets: 'لعب ديال الدراري',

      // Products
      allProducts: 'كاع المنتوجات',
      productsFound: 'منتوج لقيناهم',
      noProducts: 'ما كاين حتى منتوج',
      tryDifferentFilters: 'جرّب فيلتر آخر',
      productNotFound: 'المنتوج ما لقيناهش',
      backToHome: 'رجع للرئيسية',

      // Filters
      filters: 'الفيلتر',
      sort: 'رتّب',
      all: 'الكل',
      show: 'وري',
      mostPopular: 'لي عندهم سوق بزاف',
      newest: 'الجداد',
      priceLowToHigh: 'الثمن: من الرخيص للغالي',
      priceHighToLow: 'الثمن: من الغالي للرخيص',
      biggestDiscount: 'أكبر تخفيض',
      onSale: 'فيهم تخفيض',
      inStockOnly: 'غير لي كاينين',

      // Product Card
      addToCart: 'زيد للبانيي',
      addToWishlist: 'زيد للمفضلين',
      added: 'تزاد',
      order: 'طلب',
      orderNow: 'طلب دابا',
      orderViaWhatsApp: 'طلب فالواتساب',
      quickView: 'شوف بزربة',
      promo: 'تخفيض',
      new: 'جديد',
      bestseller: 'الأكثر مبيعاً',
      save: 'وفّر',

      // Product Page
      back: 'رجع',
      quantity: 'الكمية',
      total: 'المجموع',
      description: 'الوصف',
      specs: 'المواصفات',
      reviews: 'الآراء',
      features: 'المميزات',
      relatedProducts: 'منتوجات قريبين',
      inStock: 'كاين',
      outOfStock: 'سالي',
      sku: 'الكود',
      category: 'الكاتيگوري',
      warranty: 'الگارانتي',
      year: 'عام',
      origin: 'الأصل',
      reviewText: 'منتوج مزيان بزاف، كنصحكم بيه! التوصيل كان سريع والتغليف نقي.',

      // Cart
      yourCart: 'البانيي ديالك',
      emptyCart: 'البانيي خاوية',
      emptyCartDesc: 'زيد شي منتوجات باش تبدا التسوق',
      startShopping: 'بدا التسوق',
      continueShopping: 'كمّل التسوق',
      subtotal: 'المجموع',
      shippingCalculated: 'التوصيل كيتحسب فالكيس',
      proceedCheckout: 'كمّل الطلب',

      // Search
      searchPlaceholder: 'قلّب على شي منتوج...',
      searchResults: 'نتائج البحث',
      popularSearches: 'لي كيقلّبو عليهم بزاف',
      recentSearches: 'لي قلّبتي عليهم أخيراً',
      noResults: 'ما لقينا والو',

      // Flash Sales
      flashSales: 'تخفيضات فلاش',
      limitedTime: 'عرض محدود',
      seeAll: 'شوف الكل',

      // Popular
      popularProducts: 'المنتوجات لي عندهم سوق',

      // Promo Banner
      promoBannerTitle: 'استافد من العروض ديالنا',
      promoBannerDesc: 'تخفيض حتى لـ 50% على مجموعة مختارة',
      discoverPromos: 'شوف العروض',

      // Trust Badges
      whatsappSupport: 'دعم فالواتساب',
      whatsappSupportDesc: 'كنجاوبو فأقل من 5 دقايق',
      fastDelivery: 'توصيل سريع',
      fastDeliveryDesc: '24-48 ساعة فكامل المغرب',
      bestPrices: 'أحسن الأثمان',
      bestPricesDesc: 'أثمان مناسبة ومضمونة',
      securePayment: 'الخلاص مضمون',
      securePaymentDesc: 'خلّص منين يوصلك',

      // Footer
      yourPremier: 'الماگازان ديالك أونلاين ديال منتوجات بجودة عالية بأحسن ثمن.',
      footerDescription: 'YOUPOSH - المكان ديالك للإلكترونيات والإكسسوارات فالمغرب.',
      quickLinks: 'روابط سريعة',
      help: 'مساعدة',
      aboutUs: 'شكون حنا',
      followUs: 'تابعنا',
      paymentMethods: 'طرق الخلاص',
      allRightsReserved: 'جميع الحقوق محفوظة',

      // Benefits
      whatsappOrder: 'طلب فالواتساب',
      easyFast: 'سريع وساهل',
      cashOnDelivery: 'خلّص منين يوصلك',
      payOnReceive: 'خلّص فالتسليم',
      easyExchange: 'التبديل ساهل',
      exchangePeriod: '7 أيام للتبديل',

      // Admin
      adminPanel: 'لوحة التحكم',
      dashboard: 'الداشبورد',
      orders: 'الطلبات',
      products: 'المنتوجات',
      customers: 'الكليان',
      settings: 'الإعدادات',
      logout: 'خروج',
      totalOrders: 'مجموع الطلبات',
      totalRevenue: 'مجموع الدخل',
      pendingOrders: 'طلبات كتسنا',
      completedOrders: 'طلبات كملو',
      orderId: 'رقم الطلب',
      customer: 'الكليان',
      date: 'التاريخ',
      status: 'الحالة',
      actions: 'الأكسيونات',
      viewDetails: 'شوف التفاصيل',
      markComplete: 'ماركيها كمكتملة',
      pending: 'كتسنا',
      processing: 'كتعالج',
      shipped: 'تصيفطات',
      delivered: 'وصلات',
      cancelled: 'ملغية',

      // Misc
      loading: 'كيتحمل...',
      error: 'خطأ',
      success: 'مزيان',
      close: 'سدّ',
      confirm: 'أكّد',
      cancel: 'إلغاء',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'fr',
    fallbackLng: 'fr',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
