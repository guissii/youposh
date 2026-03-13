import { createContext, useContext, useState, useCallback, useMemo, useEffect, type ReactNode } from 'react';
import { toast } from 'sonner';
import type { Product, CartItem, WishlistItem, Order } from '@/types';
import { validatePromoCode } from '@/lib/api';
import { useStoreSettings } from '@/data/storeSettings';

interface StoreContextType {
  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, variant?: string) => void;
  removeFromCart: (productId: number, variant?: string) => void;
  updateCartQuantity: (productId: number, quantity: number, variant?: string) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;

  // Promo
  promoCode: string;
  promoDiscount: number;
  promoStatus: 'idle' | 'loading' | 'applied' | 'error';
  promoMessage: string;
  applyPromoCode: (code: string, options?: { silent?: boolean }) => Promise<void>;
  removePromoCode: (options?: { silent?: boolean }) => void;

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
  // Load global store settings and apply theme
  useStoreSettings();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [wishlist, setWishlist] = useState<WishlistItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'applied' | 'error'>('idle');
  const [promoMessage, setPromoMessage] = useState('');

  const parseVariantSelection = useCallback((label: any): Record<string, string> => {
    if (typeof label !== 'string') return {};
    const parts = label.split('/').map((p: string) => p.trim()).filter(Boolean);
    const out: Record<string, string> = {};
    for (const part of parts) {
      const idx = part.indexOf(':');
      if (idx === -1) continue;
      const key = part.slice(0, idx).trim();
      const value = part.slice(idx + 1).trim();
      if (key && value) out[key] = value;
    }
    return out;
  }, []);

  const getMaxAllowedForVariant = useCallback((product: Product, variantLabel?: string): number => {
    let allowed = typeof product.stock === 'number' ? product.stock : Infinity;
    const selection = parseVariantSelection(variantLabel);
    const variants = Array.isArray((product as any).variants) ? (product as any).variants : [];
    for (const v of variants) {
      const selected = selection?.[v?.name];
      if (!selected) continue;
      const options = Array.isArray(v?.options) ? v.options : [];
      const match = options.find((o: any) => {
        const value = typeof o === 'string' ? o : (typeof o?.value === 'string' ? o.value : '');
        return value === selected;
      });
      const stock = match && typeof match === 'object' && typeof match.stock === 'number' ? match.stock : undefined;
      if (typeof stock === 'number') allowed = Math.min(allowed, stock);
    }
    return allowed;
  }, [parseVariantSelection]);

  // Cart functions
  const addToCart = useCallback((product: Product, quantity = 1, variant?: string) => {
    if (product.inStock === false || (typeof product.stock === 'number' && product.stock <= 0)) {
      toast.error('Produit en rupture de stock');
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id && item.variant === variant);
      const maxAllowed = getMaxAllowedForVariant(product, variant);
      if (!Number.isFinite(maxAllowed) && maxAllowed !== Infinity) {
        toast.error('Stock invalide');
        return prev;
      }
      if (maxAllowed <= 0) {
        toast.error('Variante en rupture de stock');
        return prev;
      }
      if (existing) {
        if (existing.quantity + quantity > maxAllowed) {
          toast.error(`Stock insuffisant (max ${maxAllowed})`);
          return prev;
        }
        toast.success('Quantité mise à jour');
        return prev.map(item =>
          item.product.id === product.id && item.variant === variant
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      if (quantity > maxAllowed) {
        toast.error(`Stock insuffisant (max ${maxAllowed})`);
        return prev;
      }
      toast.success('Produit ajouté au panier');
      return [...prev, { product, quantity, variant }];
    });
  }, [getMaxAllowedForVariant]);

  const removeFromCart = useCallback((productId: number, variant?: string) => {
    setCart(prev => prev.filter(item => {
      if (item.product.id !== productId) return true;
      if (typeof variant === 'string') return item.variant !== variant;
      return false;
    }));
    toast.info('Produit retiré du panier');
  }, []);

  const updateCartQuantity = useCallback((productId: number, quantity: number, variant?: string) => {
    if (quantity < 1) {
      removeFromCart(productId, variant);
      return;
    }
    setCart(prev => prev.map(item => {
      if (item.product.id !== productId) return item;
      if (typeof variant === 'string' && item.variant !== variant) return item;

      const maxAllowed = getMaxAllowedForVariant(item.product, item.variant);
      const nextQty = Math.min(quantity, maxAllowed);
      if (nextQty !== quantity) toast.error(`Stock insuffisant (max ${maxAllowed})`);
      return { ...item, quantity: nextQty };
    }));
  }, [getMaxAllowedForVariant, removeFromCart]);

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

  const persistPromoCode = (nextCode: string) => {
    try {
      if (!nextCode) localStorage.removeItem('yp_promo_code');
      else localStorage.setItem('yp_promo_code', nextCode);
    } catch {
    }
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('yp_promo_code');
      if (saved && typeof saved === 'string') setPromoCode(saved);
    } catch {
    }
  }, []);

  const applyPromoCode = useCallback(async (code: string, options?: { silent?: boolean }) => {
    const normalized = String(code ?? '').trim();
    if (!normalized) {
      if (!options?.silent) toast.error('Veuillez entrer un code promo');
      return;
    }

    setPromoStatus('loading');
    setPromoMessage('');
    setPromoDiscount(0);

    try {
      const res = await validatePromoCode(normalized, cartTotal > 0 ? cartTotal : undefined);
      setPromoCode(normalized);
      persistPromoCode(normalized);
      setPromoDiscount(typeof res?.discount === 'number' ? res.discount : 0);
      setPromoStatus('applied');
      setPromoMessage(typeof res?.message === 'string' ? res.message : 'Code promo appliqué');
      if (!options?.silent) toast.success(typeof res?.message === 'string' ? res.message : 'Code promo appliqué');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erreur de validation du code promo';
      setPromoCode(normalized);
      persistPromoCode(normalized);
      setPromoDiscount(0);
      setPromoStatus('error');
      setPromoMessage(message);
      if (!options?.silent) toast.error(message);
    }
  }, [cartTotal]);

  const removePromoCode = useCallback((options?: { silent?: boolean }) => {
    setPromoCode('');
    setPromoDiscount(0);
    setPromoStatus('idle');
    setPromoMessage('');
    persistPromoCode('');
    if (!options?.silent) toast.info('Code promo retiré');
  }, []);

  useEffect(() => {
    if (!promoCode) return;
    applyPromoCode(promoCode, { silent: true });
  }, [promoCode, cartTotal, applyPromoCode]);

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
    cart,
    addToCart,
    removeFromCart,
    updateCartQuantity,
    clearCart,
    cartTotal,
    cartCount,
    promoCode,
    promoDiscount,
    promoStatus,
    promoMessage,
    applyPromoCode,
    removePromoCode,
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
