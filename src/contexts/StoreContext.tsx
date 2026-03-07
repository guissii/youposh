import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { Product, CartItem, WishlistItem, Order, SortOption, FilterOption } from '@/types';
import { products, searchProducts, getProductsByCategory } from '@/data/products';
import { isActive, isNewProduct, isBestSellerProduct, getPopularityScore } from '@/lib/productLogic';

interface StoreContextType {
  // Products
  allProducts: Product[];
  getFilteredProducts: (category?: string, sort?: SortOption, filter?: FilterOption) => Product[];
  searchProducts: (query: string) => Product[];
  getProductById: (id: number) => Product | undefined;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: string) => void;
  removeFromCart: (productId: number) => void;
  updateCartQuantity: (productId: number, quantity: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Wishlist
  wishlist: WishlistItem[];
  addToWishlist: (product: Product) => void;
  removeFromWishlist: (productId: number) => void;
  isInWishlist: (productId: number) => boolean;

  // Orders
  orders: Order[];
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt'>) => Order;

  // UI
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;
  isSearchOpen: boolean;
  setIsSearchOpen: (open: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const allProducts = products;

  const getFilteredProducts = useCallback((category?: string, sort: SortOption = 'popular', filter: FilterOption = 'all') => {
    let result = category ? getProductsByCategory(category) : [...allProducts];

    // Apply filter
    switch (filter) {
      case 'promo':
        result = result.filter(p => isActive(p) && p.originalPrice != null && p.originalPrice > p.price);
        break;
      case 'new':
        result = result.filter(p => isNewProduct(p));
        break;
      case 'bestseller':
        result = result.filter(p => isBestSellerProduct(p));
        break;
      case 'in-stock':
        result = result.filter(p => p.inStock);
        break;
    }

    // Apply sort
    switch (sort) {
      case 'newest':
        result = result.sort((a, b) => {
          const dateA = new Date(a.publishedAt ?? 0).getTime();
          const dateB = new Date(b.publishedAt ?? 0).getTime();
          return dateB - dateA;
        });
        break;
      case 'price-asc':
        result = result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result = result.sort((a, b) => b.price - a.price);
        break;
      case 'promo':
        result = result.sort((a, b) => {
          const discountA = a.originalPrice ? a.originalPrice - a.price : 0;
          const discountB = b.originalPrice ? b.originalPrice - b.price : 0;
          return discountB - discountA;
        });
        break;
      case 'popular':
      default:
        result = result.sort((a, b) => getPopularityScore(b) - getPopularityScore(a));
    }

    return result;
  }, [allProducts]);

  const getProductById = useCallback((id: number) => {
    return allProducts.find(p => p.id === id);
  }, [allProducts]);

  // Cart functions
  const addToCart = useCallback((product: Product, quantity = 1, variant?: string) => {
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.variant === variant);
      if (existing) {
        toast.success('Quantité mise à jour');
        return prev.map(item =>
          item.product.id === product.id && item.variant === variant
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      toast.success('Produit ajouté au panier');
      return [...prev, { product, quantity, variant }];
    });
  }, []);

  const removeFromCart = useCallback((productId: number) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
    toast.info('Produit retiré du panier');
  }, []);

  const updateCartQuantity = useCallback((productId: number, quantity: number) => {
    if (quantity < 1) {
      removeFromCart(productId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.product.id === productId ? { ...item, quantity } : item
    ));
  }, [removeFromCart]);

  const clearCart = useCallback(() => {
    setCart([]);
    toast.info('Panier vidé');
  }, []);

  const cartTotal = useMemo(() =>
    cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cart]
  );

  const cartCount = useMemo(() =>
    cart.reduce((sum, item) => sum + item.quantity, 0),
    [cart]
  );

  // Wishlist functions
  const addToWishlist = useCallback((product: Product) => {
    setWishlist(prev => {
      if (prev.some(item => item.product.id === product.id)) {
        toast.info('Déjà dans les favoris');
        return prev;
      }
      toast.success('Ajouté aux favoris');
      return [...prev, { product, addedAt: new Date() }];
    });
  }, []);

  const removeFromWishlist = useCallback((productId: number) => {
    setWishlist(prev => prev.filter(item => item.product.id !== productId));
    toast.info('Retiré des favoris');
  }, []);

  const isInWishlist = useCallback((productId: number) => {
    return wishlist.some(item => item.product.id === productId);
  }, [wishlist]);

  // Order functions
  const createOrder = useCallback((orderData: Omit<Order, 'id' | 'createdAt'>) => {
    const order: Order = {
      ...orderData,
      id: `ORD-${Date.now()}`,
      createdAt: new Date(),
    };
    setOrders(prev => [order, ...prev]);
    return order;
  }, []);

  const value: StoreContextType = {
    allProducts,
    getFilteredProducts,
    searchProducts,
    getProductById,
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    cartCount,
    wishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    orders,
    createOrder,
    isCartOpen,
    setIsCartOpen,
    isSearchOpen,
    setIsSearchOpen,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const context = useContext(StoreContext);
  if (context === undefined) {
    throw new Error('useStore must be used within a StoreProvider');
  }
  return context;
}
