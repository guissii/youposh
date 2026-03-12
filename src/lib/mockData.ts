
export const MOCK_PRODUCTS = [
    {
        id: 1,
        name: "Pack de 5 Sacs de Rangement Sous Vide",
        description: "Optimisez votre espace de rangement avec ces sacs sous vide.",
        price: 99,
        originalPrice: 199,
        images: ["https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&w=800&q=80"],
        categorySlug: "maison",
        stock: 50,
        inStock: true,
        isVisible: true,
        isNew: true,
        isBestSeller: true,
        salesCount: 120,
        rating: 5.0,
        reviews: 24,
        variants: [],
        attributeValues: []
    },
    {
        id: 2,
        name: "Organisateur de Chaussures",
        description: "Rangez jusqu'à 12 paires de chaussures facilement.",
        price: 79,
        originalPrice: 129,
        images: ["https://images.unsplash.com/photo-1595341888016-a392ef81b7de?auto=format&fit=crop&w=800&q=80"],
        categorySlug: "maison",
        stock: 30,
        inStock: true,
        isVisible: true,
        isNew: false,
        isBestSeller: true,
        salesCount: 85,
        rating: 4.8,
        reviews: 15,
        variants: [],
        attributeValues: []
    },
    {
        id: 3,
        name: "Montre Connectée Sport",
        description: "Suivez vos performances sportives avec précision.",
        price: 299,
        originalPrice: 499,
        images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80"],
        categorySlug: "electronique",
        stock: 15,
        inStock: true,
        isVisible: true,
        isNew: true,
        isBestSeller: false,
        salesCount: 42,
        rating: 4.9,
        reviews: 8,
        variants: [],
        attributeValues: []
    },
    {
        id: 4,
        name: "Écouteurs Bluetooth Sans Fil",
        description: "Son haute fidélité et autonomie longue durée.",
        price: 149,
        originalPrice: 249,
        images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80"],
        categorySlug: "electronique",
        stock: 100,
        inStock: true,
        isVisible: true,
        isNew: false,
        isBestSeller: true,
        salesCount: 350,
        rating: 4.7,
        reviews: 120,
        variants: [],
        attributeValues: []
    },
    {
        id: 5,
        name: "Set de 3 Valises de Voyage",
        description: "Valises robustes et légères pour tous vos voyages.",
        price: 899,
        originalPrice: 1299,
        images: ["https://images.unsplash.com/photo-1565026057447-bc27a38fa0d4?auto=format&fit=crop&w=800&q=80"],
        categorySlug: "voyage",
        stock: 10,
        inStock: true,
        isVisible: true,
        isNew: true,
        isBestSeller: false,
        salesCount: 15,
        rating: 5.0,
        reviews: 5,
        variants: [],
        attributeValues: []
    }
];

export const MOCK_CATEGORIES = [
    { id: 1, name: "Maison & Rangement", slug: "maison", image: "https://images.unsplash.com/photo-1584622050111-993a426fbf0a?auto=format&fit=crop&w=400&q=80" },
    { id: 2, name: "Électronique", slug: "electronique", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80" },
    { id: 3, name: "Voyage", slug: "voyage", image: "https://images.unsplash.com/photo-1565026057447-bc27a38fa0d4?auto=format&fit=crop&w=400&q=80" },
    { id: 4, name: "Beauté & Santé", slug: "beaute", image: "https://images.unsplash.com/photo-1596462502278-27bfdd403348?auto=format&fit=crop&w=400&q=80" }
];

export const MOCK_ORDERS = [
    { id: "ORD-123456", createdAt: new Date().toISOString(), customerName: "Karim Benali", phone: "0661123456", city: "Casablanca", total: 299, status: "pending", items: [{ quantity: 1, product: MOCK_PRODUCTS[0] }] },
    { id: "ORD-789012", createdAt: new Date(Date.now() - 86400000).toISOString(), customerName: "Sarah Idrissi", phone: "0662987654", city: "Rabat", total: 149, status: "shipped", items: [{ quantity: 1, product: MOCK_PRODUCTS[3] }] }
];

export const MOCK_PROMO_CODES = [
    { id: 1, code: "WELCOME10", discountType: "percentage", discountValue: 10, isActive: true, minOrder: 0, usedCount: 5 },
    { id: 2, code: "PROMO50", discountType: "fixed", discountValue: 50, isActive: true, minOrder: 300, usedCount: 12 }
];

export const MOCK_DASHBOARD_STATS = {
    totalOrders: 150,
    totalRevenue: 15490,
    pendingOrders: 12,
    processingOrders: 5,
    completedOrders: 130,
    cancelledOrders: 3,
    totalProducts: 5
};
