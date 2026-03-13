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
      terms: 'Conditions générales',
      privacy: 'Politique de confidentialité',

      // Top Bar
      deliveryAllMorocco: 'Livraison partout au Maroc',
      deliveryShort: 'Livraison',
      deliveryTime: '24-48h',

      // Hero
      heroSlogan: 'UNE MARQUE MAROCAINE',
      heroBadgeTitle: 'N°1 au Maroc',
      heroTitle: 'Des produits tendance pour votre quotidien',
      heroSubtitle: 'Des accessoires utiles, modernes et soigneusement sélectionnés pour vous, livrés partout au Maroc.',
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
      promotionsTitle: 'Produits en promotion',
      promoSubtitle: 'Découvrez nos meilleures offres du moment',
      newSubtitle: 'Les derniers produits ajoutés à notre catalogue',
      bestsellerSubtitle: 'Les produits les plus appréciés par nos clients',
      bestsellerDesc: 'Les plus vendus ce mois',

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
      promo: 'PROMOTION',
      new: 'NOUVEAU',
      bestseller: 'TOP VENTES',
      save: 'Économisez',

      // Product Page
      back: 'Retour',
      quantity: 'Quantité',
      total: 'Total',
      description: 'Description',
      specs: 'Caractéristiques techniques',
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
      shippingCalculated: 'Frais de livraison calculés lors du paiement',
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
      whatsappSupport: 'Service client WhatsApp',
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
      paymentMethods: 'Moyens de paiement',
      allRightsReserved: 'Tous droits réservés',

      // Benefits
      whatsappOrder: 'Commander par WhatsApp',
      easyFast: 'Rapide & facile',
      cashOnDelivery: 'Paiement à la livraison',
      payOnReceive: 'Payez à la réception',
      easyExchange: 'Échange simplifié',
      '7daysExchange': '7 jours pour échanger',

      // Order Form
      finalizeOrder: 'Finaliser votre demande',
      fullName: 'Nom complet',
      phone: 'Téléphone',
      city: 'Ville',
      address: 'Adresse',
      addressPlaceholder: 'Rue, quartier, n° de maison...',
      note: 'Remarque',
      notePlaceholder: 'Ex: livrer le matin...',
      optional: 'facultatif',
      deliveryMaroc: 'Livraison au Maroc : 35 DH',
      orderSummary: 'Résumé de la commande',
      variant: 'Variante',
      unitPrice: 'Prix unitaire',
      confirmOnWhatsApp: 'Confirmer sur WhatsApp',
      fillRequiredFields: 'Veuillez remplir les champs obligatoires (*)',

      // Admin
      adminPanel: 'Administration',
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
      needHelp: 'Besoin d\'aide ?',
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
      newArrivals: 'جديدنا',
      wishlist: 'المفضلة',
      cart: 'عربة التسوق',
      search: 'بحث',
      account: 'حسابي',
      contact: 'تواصل معنا',
      about: 'من نحن',
      faq: 'أسئلة شائعة',
      delivery: 'التوصيل',
      returns: 'الإسترجاع',
      trackOrder: 'تتبع الطلب',
      terms: 'الشروط والأحكام',
      privacy: 'سياسة الخصوصية',

      // Top Bar
      deliveryAllMorocco: 'توصيل لجميع أنحاء المغرب',
      deliveryShort: 'توصيل',
      deliveryTime: '24-48 ساعة',

      // Hero
      heroSlogan: 'علامة تجارية مغربية',
      heroBadgeTitle: 'رقم 1 في المغرب',
      heroTitle: 'منتجات عصرية لحياتك اليومية',
      heroSubtitle: 'إكسسوارات مفيدة ومختارة بعناية، مع توصيل لجميع أنحاء المغرب.',
      specialOffer: 'عرض خاص',
      newCollection: 'تشكيلة جديدة',
      shopNow: 'تسوق الآن',
      discover: 'اكتشف',
      explore: 'تصفح',

      // Categories
      browseCategories: 'تصفح الفئات',
      electronique: 'إلكترونيات',
      maison: 'المنزل',
      beaute: 'جمال',
      mode: 'موضة',
      auto: 'سيارات',
      gaming: 'ألعاب الفيديو',
      cadeaux: 'هدايا',
      jouets: 'ألعاب أطفال',

      // Products
      allProducts: 'جميع المنتجات',
      productsFound: 'منتج تم إيجاده',
      noProducts: 'لا توجد منتجات',
      tryDifferentFilters: 'جرب تصفية مختلفة',
      productNotFound: 'المنتج غير موجود',
      backToHome: 'العودة للرئيسية',
      promotionsTitle: 'منتجات مخفضة',
      promoSubtitle: 'اكتشف أفضل عروضنا الحالية',
      newSubtitle: 'أحدث المنتجات المضافة',
      bestsellerSubtitle: 'المنتجات الأكثر طلباً من عملائنا',
      bestsellerDesc: 'الأكثر مبيعاً هذا الشهر',

      // Filters
      filters: 'تصفية',
      sort: 'ترتيب',
      all: 'الكل',
      show: 'عرض',
      mostPopular: 'الأكثر شهرة',
      newest: 'الأحدث',
      priceLowToHigh: 'السعر: من الأقل للأعلى',
      priceHighToLow: 'السعر: من الأعلى للأقل',
      biggestDiscount: 'أكبر خصم',
      onSale: 'تخفيضات',
      inStockOnly: 'متوفر فقط',

      // Product Card
      addToCart: 'أضف للعربة',
      addToWishlist: 'أضف للمفضلة',
      added: 'تمت الإضافة',
      order: 'اطلب',
      orderNow: 'اطلب الآن',
      orderViaWhatsApp: 'اطلب عبر واتساب',
      quickView: 'نظرة سريعة',
      promo: 'خصم',
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
      outOfStock: 'نفد من المخزون',
      sku: 'الرمز',
      category: 'الفئة',
      warranty: 'الضمان',
      year: 'سنة',
      origin: 'المنشأ',
      reviewText: 'منتج ممتاز جداً، أنصح به! التوصيل كان سريعاً والتغليف ممتاز.',

      // Cart
      yourCart: 'عربة التسوق',
      emptyCart: 'عربة التسوق فارغة',
      emptyCartDesc: 'أضف منتجات للبدء في التسوق',
      startShopping: 'ابدأ التسوق',
      continueShopping: 'متابعة التسوق',
      subtotal: 'المجموع الفرعي',
      shippingCalculated: 'يتم حساب الشحن عند الدفع',
      proceedCheckout: 'إتمام الطلب',

      // Search
      searchPlaceholder: 'ابحث عن منتج...',
      searchResults: 'نتائج البحث',
      popularSearches: 'الأكثر بحثاً',
      recentSearches: 'بحثت عنه مؤخراً',
      noResults: 'لم يتم العثور على نتائج',

      // Flash Sales
      flashSales: 'عروض فلاش',
      limitedTime: 'عرض محدود',
      seeAll: 'عرض الكل',

      // Popular
      popularProducts: 'منتجات شائعة',

      // Promo Banner
      promoBannerTitle: 'استفد من عروضنا',
      promoBannerDesc: 'خصم يصل إلى 50% على تشكيلة مختارة',
      discoverPromos: 'اكتشف العروض',

      // Trust Badges
      whatsappSupport: 'دعم عبر واتساب',
      whatsappSupportDesc: 'نرد في أقل من 5 دقائق',
      fastDelivery: 'توصيل سريع',
      fastDeliveryDesc: '24-48 ساعة لجميع أنحاء المغرب',
      bestPrices: 'أفضل الأسعار',
      bestPricesDesc: 'أسعار تنافسية مضمونة',
      securePayment: 'دفع آمن',
      securePaymentDesc: 'الدفع عند الاستلام',

      // Footer
      yourPremier: 'متجرك الإلكتروني لمنتجات عالية الجودة بأفضل الأسعار.',
      footerDescription: 'YOUPOSH - وجهتك المفضلة للإلكترونيات والإكسسوارات في المغرب.',
      quickLinks: 'روابط سريعة',
      help: 'مساعدة',
      aboutUs: 'من نحن',
      followUs: 'تابعنا',
      paymentMethods: 'طرق الدفع',
      allRightsReserved: 'جميع الحقوق محفوظة',

      // Benefits
      whatsappOrder: 'طلب عبر واتساب',
      easyFast: 'سريع وسهل',
      cashOnDelivery: 'الدفع عند الاستلام',
      payOnReceive: 'ادفع عند الاستلام',
      easyExchange: 'استبدال سهل',
      exchangePeriod: '7 أيام للاستبدال',

      // Order Form
      finalizeOrder: 'تأكيد الطلب',
      fullName: 'الاسم الكامل',
      phone: 'الهاتف',
      city: 'المدينة',
      address: 'العنوان',
      addressPlaceholder: 'الحي، الشارع، رقم المنزل...',
      note: 'ملاحظة',
      notePlaceholder: 'معلومات إضافية...',
      optional: 'اختياري',
      deliveryMaroc: 'توصيل للمغرب: 35 درهم',
      orderSummary: 'ملخص الطلب',
      variant: 'النوع',
      unitPrice: 'السعر',
      confirmOnWhatsApp: 'تأكيد عبر واتساب',
      fillRequiredFields: 'املأ الحقول المطلوبة (*)',

      // Admin
      adminPanel: 'لوحة التحكم',
      dashboard: 'الرئيسية',
      orders: 'الطلبات',
      products: 'المنتجات',
      customers: 'العملاء',
      settings: 'الإعدادات',
      logout: 'تسجيل خروج',
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
      cancelled: 'ملغي',

      // Misc
      loading: 'جاري التحميل...',
      error: 'خطأ',
      success: 'تم بنجاح',
      close: 'إغلاق',
      confirm: 'تأكيد',
      cancel: 'إلغاء',
      needHelp: 'هل تحتاج مساعدة؟',
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'ar',
    fallbackLng: 'ar',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

export default i18n;
