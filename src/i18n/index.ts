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
      specialOffer: 'Offre spéciale',
      newCollection: 'Nouvelle collection',
      shopNow: 'Acheter maintenant',
      discover: 'Découvrir',
      explore: 'Explorer',
      
      // Categories
      browseCategories: 'Parcourir les catégories',
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
      footerDescription: 'ChinaShop - Votre destination privilégiée pour les produits électroniques, accessoires et gadgets au Maroc.',
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
      shop: 'المتجر',
      categories: 'الفئات',
      promotions: 'التخفيضات',
      bestsellers: 'الأكثر مبيعاً',
      newArrivals: 'وصل حديثاً',
      wishlist: 'المفضلة',
      cart: 'سلة التسوق',
      search: 'بحث',
      account: 'حسابي',
      contact: 'اتصل بنا',
      about: 'من نحن',
      faq: 'الأسئلة الشائعة',
      delivery: 'التوصيل',
      returns: 'الإرجاع',
      trackOrder: 'تتبع الطلب',
      terms: 'الشروط',
      privacy: 'الخصوصية',
      
      // Top Bar
      deliveryAllMorocco: 'توصيل لجميع أنحاء المغرب',
      deliveryShort: 'التوصيل',
      deliveryTime: '24-48 ساعة',
      
      // Hero
      specialOffer: 'عرض خاص',
      newCollection: 'تشكيلة جديدة',
      shopNow: 'تسوق الآن',
      discover: 'اكتشف',
      explore: 'استكشف',
      
      // Categories
      browseCategories: 'تصفح الفئات',
      electronique: 'إلكترونيات',
      maison: 'منزل',
      beaute: 'جمال',
      mode: 'أزياء',
      auto: 'سيارات',
      gaming: 'ألعاب',
      cadeaux: 'هدايا',
      jouets: 'ألعاب أطفال',
      
      // Products
      allProducts: 'جميع المنتجات',
      productsFound: 'منتجات تم العثور عليها',
      noProducts: 'لا توجد منتجات',
      tryDifferentFilters: 'جرب مرشحات أخرى',
      productNotFound: 'المنتج غير موجود',
      backToHome: 'العودة للرئيسية',
      
      // Filters
      filters: 'الفلاتر',
      sort: 'ترتيب',
      all: 'الكل',
      show: 'عرض',
      mostPopular: 'الأكثر شعبية',
      newest: 'الأحدث',
      priceLowToHigh: 'السعر: من الأقل للأعلى',
      priceHighToLow: 'السعر: من الأعلى للأقل',
      biggestDiscount: 'أكبر خصم',
      onSale: 'تخفيضات',
      inStockOnly: 'متوفر فقط',
      
      // Product Card
      addToCart: 'أضف للسلة',
      addToWishlist: 'أضف للمفضلة',
      added: 'تمت الإضافة',
      order: 'اطلب',
      orderNow: 'اطلب الآن',
      orderViaWhatsApp: 'اطلب عبر واتساب',
      quickView: 'نظرة سريعة',
      promo: 'تخفيض',
      new: 'جديد',
      bestseller: 'الأكثر مبيعاً',
      save: 'وفر',
      
      // Product Page
      back: 'رجوع',
      quantity: 'الكمية',
      total: 'المجموع',
      description: 'الوصف',
      specs: 'المواصفات',
      reviews: 'التقييمات',
      features: 'المميزات',
      relatedProducts: 'منتجات مشابهة',
      inStock: 'متوفر',
      outOfStock: 'غير متوفر',
      sku: 'الرمز',
      category: 'الفئة',
      warranty: 'الضمان',
      year: 'سنة',
      origin: 'الأصل',
      reviewText: 'منتج ممتاز، أنصح به بشدة! توصيل سريع وتغليف جيد.',
      
      // Cart
      yourCart: 'سلة التسوق',
      emptyCart: 'سلة التسوق فارغة',
      emptyCartDesc: 'أضف منتجات للبدء في التسوق',
      startShopping: 'ابدأ التسوق',
      continueShopping: 'مواصلة التسوق',
      subtotal: 'المجموع الفرعي',
      shippingCalculated: 'الشحن يحسب عند الدفع',
      proceedCheckout: 'إتمام الشراء',
      
      // Search
      searchPlaceholder: 'ابحث عن منتج...',
      searchResults: 'نتائج البحث',
      popularSearches: 'عمليات البحث الشائعة',
      recentSearches: 'عمليات البحث الأخيرة',
      noResults: 'لم يتم العثور على نتائج',
      
      // Flash Sales
      flashSales: 'تخفيضات فلاش',
      limitedTime: 'عرض محدود',
      seeAll: 'عرض الكل',
      
      // Popular
      popularProducts: 'المنتجات الشائعة',
      
      // Promo Banner
      promoBannerTitle: 'استفد من عروضنا',
      promoBannerDesc: 'خصم يصل إلى 50% على مجموعة مختارة من المنتجات',
      discoverPromos: 'اكتشف العروض',
      
      // Trust Badges
      whatsappSupport: 'دعم واتساب',
      whatsappSupportDesc: 'رد في أقل من 5 دقائق',
      fastDelivery: 'توصيل سريع',
      fastDeliveryDesc: '24-48 ساعة في جميع أنحاء المغرب',
      bestPrices: 'أفضل الأسعار',
      bestPricesDesc: 'أسعار تنافسية مضمونة',
      securePayment: 'دفع آمن',
      securePaymentDesc: 'الدفع عند الاستلام',
      
      // Footer
      yourPremier: 'متجرك الإلكتروني للمنتجات عالية الجودة بأفضل سعر.',
      footerDescription: 'ChinaShop - وجهتك المفضلة للإلكترونيات والإكسسوارات والأدوات في المغرب.',
      quickLinks: 'روابط سريعة',
      help: 'المساعدة',
      aboutUs: 'من نحن',
      followUs: 'تابعنا',
      paymentMethods: 'طرق الدفع',
      allRightsReserved: 'جميع الحقوق محفوظة',
      
      // Benefits
      whatsappOrder: 'طلب واتساب',
      easyFast: 'سريع وسهل',
      cashOnDelivery: 'الدفع عند الاستلام',
      payOnReceive: 'ادفع عند الاستلام',
      easyExchange: 'استبدال سهل',
      exchangePeriod: '7 أيام للاستبدال',
      
      // Admin
      adminPanel: 'لوحة التحكم',
      dashboard: 'لوحة المعلومات',
      orders: 'الطلبات',
      products: 'المنتجات',
      customers: 'العملاء',
      settings: 'الإعدادات',
      logout: 'تسجيل الخروج',
      totalOrders: 'إجمالي الطلبات',
      totalRevenue: 'إجمالي الإيرادات',
      pendingOrders: 'طلبات قيد الانتظار',
      completedOrders: 'طلبات مكتملة',
      orderId: 'رقم الطلب',
      customer: 'العميل',
      date: 'التاريخ',
      status: 'الحالة',
      actions: 'إجراءات',
      viewDetails: 'عرض التفاصيل',
      markComplete: 'تحديد كمكتمل',
      pending: 'قيد الانتظار',
      processing: 'قيد المعالجة',
      shipped: 'تم الشحن',
      delivered: 'تم التوصيل',
      cancelled: 'ملغاة',
      
      // Misc
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'نجاح',
      close: 'إغلاق',
      confirm: 'تأكيد',
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
