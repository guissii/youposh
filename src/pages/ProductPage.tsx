import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Heart, Star, Plus, Minus, MessageCircle,
  ShoppingCart, Truck, RefreshCw, Shield, Check, ChevronRight,
  X, ArrowRight, User, Phone, MapPin, FileText, Package, Ticket
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { fetchProduct, fetchProducts, createOrder, validatePromoCode } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import WhatsAppButton, { generateOrderWhatsAppMessage } from '@/components/ui/WhatsAppButton';
import { useStoreSettings } from '@/data/storeSettings';
import { getImageUrl } from '@/lib/utils';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { addToCart, addToWishlist, isInWishlist, promoCode, applyPromoCode, removePromoCode } = useStore();
  const settings = useStoreSettings();
  const { phone } = settings;

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const storeSettings = useStoreSettings();

  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Multi-step checkout state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');
  const [promoInput, setPromoInput] = useState(promoCode || '');
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoStatus, setPromoStatus] = useState<'idle' | 'loading' | 'applied' | 'error'>('idle');
  const [promoMessage, setPromoMessage] = useState('');

  const [isLoadingProduct, setIsLoadingProduct] = useState(true);
  const [productLoadError, setProductLoadError] = useState('');
  const [product, setProduct] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  const isAr = i18n.language === 'ar';

  useEffect(() => {
    window.scrollTo(0, 0);
    setIsVisible(true);
    setShowOrderForm(false);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerCity('');
    setCustomerAddress('');
    setCustomerNote('');

    // Fetch individual product details and its related products
    async function loadProductData() {
      try {
        if (!id) return;
        setIsLoadingProduct(true);
        setProductLoadError('');
        const p = await fetchProduct(Number(id));
        const normalized = {
          ...p,
          images: Array.isArray(p?.images) ? p.images : [],
          variants: Array.isArray(p?.variants) ? p.variants : [],
          attributeValues: Array.isArray(p?.attributeValues) ? p.attributeValues : [],
        };
        setProduct(normalized);
        setSelectedImage(0);
        const nextSelected: Record<string, string> = {};
        (Array.isArray(normalized?.variants) ? normalized.variants : []).forEach((v: any) => {
          const opts = Array.isArray(v?.options) ? v.options : [];
          const firstAvailable = opts.find((o: any) => {
            if (typeof o === 'string') return true;
            if (o && typeof o === 'object' && typeof o.value === 'string') {
              return typeof o.stock === 'number' ? o.stock > 0 : true;
            }
            return false;
          });
          if (!firstAvailable) return;
          nextSelected[v.name] = typeof firstAvailable === 'string' ? firstAvailable : firstAvailable.value;
        });
        setSelectedVariants(nextSelected);
        setQuantity(1);

        // Fetch related products from the same category
        const relatedCategory = normalized?.categorySlug || normalized?.category?.slug;
        if (relatedCategory) {
          const rel = await fetchProducts(`category=${relatedCategory}`);
          setRelatedProducts(rel.filter((r: any) => r.id !== normalized.id).slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to fetch product', error);
        setProduct(null);
        setRelatedProducts([]);
        setSelectedVariants({});
        setQuantity(1);
        setSelectedImage(0);
        setProductLoadError(error instanceof Error ? error.message : 'Failed to fetch product');
      } finally {
        setIsLoadingProduct(false);
      }
    }
    loadProductData();
  }, [id]);

  const subtotal = product ? product.price * quantity : 0;

  useEffect(() => {
    setPromoInput(promoCode || '');
  }, [promoCode]);

  useEffect(() => {
    if (!promoCode) {
      setPromoDiscount(0);
      setPromoStatus('idle');
      setPromoMessage('');
      return;
    }
    let cancelled = false;
    setPromoStatus('loading');
    validatePromoCode(promoCode, subtotal)
      .then((res: any) => {
        if (cancelled) return;
        setPromoDiscount(typeof res?.discount === 'number' ? res.discount : 0);
        setPromoStatus('applied');
        setPromoMessage(typeof res?.message === 'string' ? res.message : '');
      })
      .catch((e: any) => {
        if (cancelled) return;
        const msg = e instanceof Error ? e.message : 'Code promo invalide';
        setPromoDiscount(0);
        setPromoStatus('error');
        setPromoMessage(msg);
      });
    return () => { cancelled = true; };
  }, [promoCode, subtotal]);

  if (!product) {
    if (isLoadingProduct) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center text-[var(--yp-gray-600)]">
            {t('loading') || 'Chargement...'}
          </div>
        </div>
      );
    }
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('productNotFound')}</h1>
          {productLoadError ? <p className="text-sm text-[var(--yp-gray-600)] mb-4">{productLoadError}</p> : null}
          <button onClick={() => navigate('/')} className="btn-primary">
            {t('backToHome')}
          </button>
        </div>
      </div>
    );
  }

  const variantsArray = Array.isArray(product.variants) ? product.variants : [];
  const galleryImages = [product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean);

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const getOptionValue = (opt: any): string => (typeof opt === 'string' ? opt : String(opt?.value ?? ''));
  const getOptionStock = (opt: any): number | undefined => {
    if (!opt || typeof opt !== 'object') return undefined;
    return typeof opt.stock === 'number' ? opt.stock : undefined;
  };

  const selectedVariantLabel = Object.entries(selectedVariants)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' / ');

  const requiredVariantCount = variantsArray.length;
  const isVariantSelectionComplete = requiredVariantCount === 0 || Object.keys(selectedVariants).length === requiredVariantCount;

  const selectedStocks = variantsArray
    .map((v: any) => {
      const selected = selectedVariants?.[v?.name];
      if (!selected) return undefined;
      const opt = (v?.options ?? []).find((o: any) => getOptionValue(o) === selected);
      return getOptionStock(opt);
    })
    .filter((n: any) => typeof n === 'number') as number[];

  const maxQty = Math.max(0, Math.min(product.stock ?? Infinity, ...(selectedStocks.length ? selectedStocks : [Infinity])));
  const isOutOfStock = product.inStock === false || Number(product.stock ?? 0) <= 0 || maxQty <= 0;

  const attributeGroups = (() => {
    const links = Array.isArray(product.attributeValues) ? product.attributeValues : [];
    const map = new Map<string, { key: string; label: string; values: string[] }>();
    for (const link of links) {
      const attr = link?.attributeValue?.attribute;
      const attrLabel = isAr ? (attr?.nameAr || attr?.name) : (attr?.name || attr?.nameAr);
      const key = String(attr?.code || attr?.id || attrLabel || '');
      if (!key) continue;
      const value = isAr ? (link?.attributeValue?.valueAr || link?.attributeValue?.value) : (link?.attributeValue?.value || link?.attributeValue?.valueAr);
      if (!value) continue;
      const existing = map.get(key);
      if (existing) existing.values.push(String(value));
      else map.set(key, { key, label: String(attrLabel || ''), values: [String(value)] });
    }
    return [...map.values()];
  })();

  const subtotalAfterPromo = Math.max(0, subtotal - (promoStatus === 'applied' ? promoDiscount : 0));

  // Delivery fee: flat national rate
  const deliveryFee = settings.shippingFeeNational ?? 35;
  const grandTotal = subtotalAfterPromo + deliveryFee;

  const isFormValid = customerName.trim().length >= 2 && customerPhone.trim().length >= 8 && customerCity.trim().length >= 2 && customerAddress.trim().length >= 5;

  const handleConfirmWhatsApp = async () => {
    // 1) Save order to DB so it appears in admin
    try {
      await createOrder({
        customerName,
        phone: customerPhone,
        city: customerCity,
        address: customerAddress,
        notes: customerNote || '',
        promoCode: promoStatus === 'applied' && promoCode ? promoCode : undefined,
        items: [{
          productId: product.id,
          quantity,
          price: product.price,
          variant: selectedVariantLabel || undefined,
        }],
      });
    } catch (err) {
      console.error('Failed to save order:', err);
      // Still open WhatsApp even if save fails
    }

    // 2) Open WhatsApp
    const message = generateOrderWhatsAppMessage(
      product,
      quantity,
      selectedVariantLabel || undefined,
      {
        customerName,
        phone: customerPhone,
        city: customerCity,
        address: customerAddress,
        note: customerNote || undefined,
      },
      deliveryFee,
      promoStatus === 'applied' && promoCode && promoDiscount > 0 ? { code: promoCode, discount: promoDiscount } : undefined
    );
    const cleanPhone = phone.replace(/[^\d]/g, '') || '212600000000';
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariantLabel || undefined);
  };

  return (
    <div className="min-h-screen bg-[var(--yp-gray-100)]">
      <Header />

      <main className="pb-20">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[var(--yp-gray-300)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-[var(--yp-gray-600)] hover:text-[var(--yp-blue)] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('back')}
            </button>
          </div>
        </div>

        {/* Product Details */}
        <section className={`py-4 sm:py-8 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">

              {/* ═══ Bloc 1 — Image Gallery ═══ */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-card">
                  <img
                    src={`${getImageUrl(galleryImages[selectedImage])}?v=wmki`}
                    alt={isAr ? product.nameAr : product.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setIsZoomOpen(true)}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-sm font-bold text-[var(--yp-dark)] hover:bg-white transition-colors z-20"
                  >
                    +{galleryImages.length}
                  </button>

                  {/* CSS Watermark Layer */}
                  {storeSettings.watermarkEnabled && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                      <img
                        src="/images/finalwatermak.png"
                        alt="Watermark"
                        className="absolute select-none pointer-events-none drop-shadow-md filter drop-shadow-[0_2px_4px_rgba(255,255,255,0.8)]"
                        style={{
                          width: `${storeSettings.watermarkSize}%`,
                          height: 'auto',
                          opacity: storeSettings.watermarkOpacity / 100,
                          left: `${storeSettings.watermarkPosX}%`,
                          top: `${storeSettings.watermarkPosY}%`,
                          transform: 'translate(-50%, -50%)',
                          mixBlendMode: 'multiply'
                        }}
                      />
                    </div>
                  )}

                  {discount > 0 && (
                    <span className="absolute top-4 left-4 badge-discount text-sm px-3 py-1.5">
                      -{discount}%
                    </span>
                  )}
                  {product.inStock ? (
                    <span className="absolute top-4 right-4 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {t('inStock')}
                    </span>
                  ) : (
                    <span className="absolute top-4 right-4 bg-[var(--yp-red)] text-white text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                      <X className="w-3 h-3" />
                      {t('outOfStock') || 'Rupture de stock'}
                    </span>
                  )}
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {galleryImages.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-[var(--yp-blue)] shadow-md' : 'border-transparent hover:border-[var(--yp-gray-400)]'
                        }`}
                    >
                      <img src={`${getImageUrl(img)}?v=wmki`} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* ═══ Bloc 2 — Product Info ═══ */}
              <div className="space-y-5">
                {/* Badges */}
                <div className="flex flex-wrap gap-2">
                  {product.badge && (
                    <span className={`badge ${product.badge === 'promo' ? 'badge-promo' :
                      product.badge === 'new' ? 'badge-new' :
                        'badge-bestseller'
                      }`}>
                      {product.badge === 'promo' ? t('promo') : product.badge === 'new' ? t('new') : t('bestseller')}
                    </span>
                  )}
                </div>

                {/* Title + Rating */}
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--yp-dark)] font-heading leading-tight">
                    {isAr ? product.nameAr : product.name}
                  </h1>
                  <div className="flex items-center gap-3 mt-3">
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-[var(--yp-star)] text-[var(--yp-star)]' : 'fill-[var(--yp-gray-300)] text-[var(--yp-gray-300)]'}`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-[var(--yp-gray-600)]">{product.rating} ({product.reviews} {t('reviews')})</span>
                  </div>
                </div>

                {/* Price */}
                <div className="flex items-baseline gap-3 flex-wrap">
                  <span className="text-3xl sm:text-4xl font-bold text-[var(--yp-dark)]">{product.price} dh</span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-[var(--yp-gray-500)] line-through">{product.originalPrice} dh</span>
                      <span className="bg-[var(--yp-red-50)] text-[var(--yp-red)] px-3 py-1 rounded-lg text-sm font-bold">
                        {t('save') || 'Économisez'} {product.originalPrice - product.price} dh
                      </span>
                    </>
                  )}
                </div>

                {/* Short description — benefit phrase */}
                <p className="text-[var(--yp-gray-600)] leading-relaxed">
                  {isAr ? product.descriptionAr : product.description}
                </p>

                {/* ═══ Bloc 3 — Options (Color / Size / Quantity) ═══ */}
                {product.variants?.map((variant: any) => (
                  <div key={variant.name}>
                    <p className="font-semibold text-[var(--yp-dark)] mb-2.5 text-sm">
                      {isAr ? variant.nameAr : variant.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {variant.options?.map((opt: any) => {
                        const value = getOptionValue(opt);
                        const stock = getOptionStock(opt);
                        const isSelected = selectedVariants?.[variant.name] === value;
                        const isDisabled = typeof stock === 'number' && stock <= 0;
                        return (
                          <button
                            key={value}
                            onClick={() => {
                              setSelectedVariants(prev => ({ ...prev, [variant.name]: value }));
                              setQuantity(1);
                            }}
                            disabled={isDisabled}
                            title={isDisabled ? (t('outOfStock') || 'Indisponible') : undefined}
                            className={`relative px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${isSelected
                              ? 'border-[var(--yp-blue)] bg-[var(--yp-blue-50)] text-[var(--yp-blue)]'
                              : isDisabled
                                ? 'border-[var(--yp-gray-200)] bg-[var(--yp-gray-100)] text-[var(--yp-gray-500)] cursor-not-allowed opacity-70'
                                : 'border-[var(--yp-gray-300)] hover:border-[var(--yp-blue)] text-[var(--yp-gray-700)]'
                              }`}
                          >
                            <span className={`relative z-10 ${isDisabled ? 'line-through' : ''}`}>{value}</span>
                            {isDisabled && (
                              <>
                                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-[var(--yp-red)]/70" />
                                <span className="absolute left-2 right-2 top-1/2 h-px bg-[var(--yp-gray-500)]/40 -rotate-12" />
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Quantity */}
                <div>
                  <p className="font-semibold text-[var(--yp-dark)] mb-2.5 text-sm">{t('quantity')}</p>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center border-2 border-[var(--yp-gray-300)] rounded-xl overflow-hidden">
                      <button
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        className="w-11 h-11 flex items-center justify-center hover:bg-[var(--yp-gray-200)] transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-12 text-center font-bold text-[var(--yp-dark)]">{quantity}</span>
                      <button
                        onClick={() => setQuantity(Math.min(quantity + 1, Math.max(1, maxQty || 1)))}
                        className="w-11 h-11 flex items-center justify-center hover:bg-[var(--yp-gray-200)] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="text-sm text-[var(--yp-gray-600)]">
                      {t('total')}: <span className="font-bold text-[var(--yp-dark)] text-lg">{subtotal} dh</span>
                    </span>
                  </div>
                </div>

                {/* ═══ Actions ═══ */}
                <div className="space-y-3 pt-2">
                  {isOutOfStock && (
                    <div className="bg-[var(--yp-red-50)] border border-[var(--yp-red)]/20 text-[var(--yp-red)] rounded-xl px-4 py-3 text-sm font-semibold">
                      {t('outOfStock') || 'Rupture de stock'} — {isAr ? 'غير متوفر حاليا' : 'Actuellement indisponible. Revenez bientôt.'}
                    </div>
                  )}
                  {/* Primary CTA — Continuer la commande */}
                  <button
                    onClick={() => setShowOrderForm(true)}
                    disabled={isOutOfStock || !isVariantSelectionComplete || quantity > maxQty}
                    className="w-full bg-[var(--yp-blue)] hover:bg-[var(--yp-blue-dark)] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[var(--yp-blue)]/20 active:scale-[0.98]"
                  >
                    {isOutOfStock ? (t('outOfStock') || 'Rupture de stock') : (t('continueOrder') || 'Continuer la commande')}
                    {!isOutOfStock && <ArrowRight className="w-5 h-5" />}
                  </button>

                  {/* Secondary — Cart + Wishlist */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleAddToCart}
                      disabled={isOutOfStock || !isVariantSelectionComplete || quantity > maxQty}
                      className="bg-[var(--yp-blue)] hover:bg-[var(--yp-blue-dark)] text-white py-2.5 rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-xs shadow-sm hover:shadow-md active:scale-95"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      {t('addToCart')}
                    </button>
                    <button
                      onClick={() => addToWishlist(product)}
                      className={`border-2 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all text-sm ${isInWishlist(product.id)
                        ? 'border-[var(--yp-red)] text-[var(--yp-red)] bg-[var(--yp-red-50)]'
                        : 'border-[var(--yp-gray-300)] hover:border-[var(--yp-red)] hover:text-[var(--yp-red)] text-[var(--yp-gray-700)]'
                        }`}
                    >
                      <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
                      {isInWishlist(product.id) ? t('added') : t('addToWishlist')}
                    </button>
                  </div>
                </div>

                {/* Trust badges */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-[var(--yp-gray-300)]">
                  {[
                    { icon: Truck, text: t('freeDelivery'), color: 'var(--yp-blue)' },
                    { icon: RefreshCw, text: t('7daysExchange'), color: 'var(--yp-blue)' },
                    { icon: Shield, text: t('warranty'), color: 'var(--yp-blue)' },
                  ].map((item, i) => (
                    <div key={i} className="text-center">
                      <item.icon className="w-5 h-5 mx-auto mb-1" style={{ color: item.color }} />
                      <p className="text-xs text-[var(--yp-gray-600)]">{item.text}</p>
                    </div>
                  ))}
                </div>

                {/* SKU */}
                <p className="text-sm text-[var(--yp-gray-500)]">{t('sku')}: {product.sku}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <section className="py-6 border-t bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex gap-6 border-b border-[var(--yp-gray-300)] overflow-x-auto">
              {(['description', 'specs', 'reviews'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pb-3 font-medium whitespace-nowrap transition-colors relative text-sm ${activeTab === tab ? 'text-[var(--yp-blue)]' : 'text-[var(--yp-gray-600)] hover:text-[var(--yp-dark)]'
                    }`}
                >
                  {t(tab)}
                  {activeTab === tab && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--yp-blue)] rounded-full" />
                  )}
                </button>
              ))}
            </div>

            <div className="py-6">
              {activeTab === 'description' && (
                <div className="prose max-w-none">
                  <p className="text-[var(--yp-gray-600)] leading-relaxed">
                    {isAr ? product.descriptionAr : product.description}
                  </p>
                  <h3 className="text-lg font-bold text-[var(--yp-dark)] mt-6 mb-3 font-heading">{t('features')}</h3>
                  <ul className="space-y-2">
                    {product.features?.map((feature: string, i: number) => (
                      <li key={i} className="flex items-center gap-2 text-[var(--yp-gray-600)]">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {activeTab === 'specs' && (
                <div className="bg-[var(--yp-gray-200)] rounded-xl p-4">
                  <table className="w-full">
                    <tbody>
                      <tr className="border-b border-[var(--yp-gray-300)]">
                        <td className="py-3 text-[var(--yp-gray-600)] text-sm">{t('sku')}</td>
                        <td className="py-3 font-medium text-[var(--yp-dark)] text-sm">{product.sku}</td>
                      </tr>
                      <tr className="border-b border-[var(--yp-gray-300)]">
                        <td className="py-3 text-[var(--yp-gray-600)] text-sm">{t('category')}</td>
                        <td className="py-3 font-medium text-[var(--yp-dark)] text-sm">{product.category?.name || product.categorySlug || '—'}</td>
                      </tr>
                      {attributeGroups.map(g => (
                        <tr key={g.key} className="border-b border-[var(--yp-gray-300)]">
                          <td className="py-3 text-[var(--yp-gray-600)] text-sm">{g.label}</td>
                          <td className="py-3 font-medium text-[var(--yp-dark)] text-sm">{g.values.join(', ')}</td>
                        </tr>
                      ))}
                      <tr className="border-b border-[var(--yp-gray-300)]">
                        <td className="py-3 text-[var(--yp-gray-600)] text-sm">{t('warranty')}</td>
                        <td className="py-3 font-medium text-[var(--yp-dark)] text-sm">1 {t('year')}</td>
                      </tr>
                      <tr>
                        <td className="py-3 text-[var(--yp-gray-600)] text-sm">{t('origin')}</td>
                        <td className="py-3 font-medium text-[var(--yp-dark)] text-sm">Chine</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}

              {activeTab === 'reviews' && (
                <div className="space-y-4">
                  {[1, 2, 3].map((review) => (
                    <div key={review} className="bg-[var(--yp-gray-200)] rounded-xl p-4">
                      <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 bg-[var(--yp-blue-50)] rounded-full flex items-center justify-center">
                          <span className="font-bold text-[var(--yp-blue)] text-sm">U{review}</span>
                        </div>
                        <div>
                          <p className="font-medium text-[var(--yp-dark)] text-sm">Utilisateur {review}</p>
                          <div className="flex gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-[var(--yp-star)] text-[var(--yp-star)]" />
                            ))}
                          </div>
                        </div>
                      </div>
                      <p className="text-[var(--yp-gray-600)] text-sm">{t('reviewText')}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-xl font-bold text-[var(--yp-dark)] mb-6 flex items-center gap-2 font-heading">
                <ChevronRight className="w-5 h-5 text-[var(--yp-blue)]" />
                {t('relatedProducts')}
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {relatedProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppButton variant="floating" />

      {/* ═══════════════════════════════════════════════════
          ORDER FORM — Bottom Sheet (Step 2: Mini Form + Confirmation)
          ═══════════════════════════════════════════════════ */}
      {showOrderForm && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowOrderForm(false)}
          />

          {/* Bottom Sheet */}
          <div className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto animate-slide-up">
            {/* Handle bar */}
            <div className="sticky top-0 bg-white rounded-t-3xl z-10 pt-3 pb-2 px-6 border-b border-[var(--yp-gray-300)]">
              <div className="w-10 h-1 bg-[var(--yp-gray-400)] rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[var(--yp-dark)] font-heading">
                  {t('finalizeOrder') || 'Finaliser votre demande'}
                </h2>
                <button
                  onClick={() => setShowOrderForm(false)}
                  className="p-2 hover:bg-[var(--yp-gray-200)] rounded-xl transition-colors"
                >
                  <X className="w-5 h-5 text-[var(--yp-gray-600)]" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* ── Mini Form ── */}
              <div className="space-y-4">
                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--yp-dark)] mb-2">
                    <User className="w-4 h-4 text-[var(--yp-blue)]" />
                    {t('fullName') || 'Nom complet'} *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Mohammed El Amrani"
                    className="w-full px-4 py-3 bg-[var(--yp-gray-200)] border border-[var(--yp-gray-300)] rounded-xl text-[var(--yp-dark)] placeholder-[var(--yp-gray-500)] focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-[var(--yp-blue)]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--yp-dark)] mb-2">
                    <Phone className="w-4 h-4 text-[var(--yp-blue)]" />
                    {t('phone') || 'Téléphone'} *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="06XX XXX XXX"
                    className="w-full px-4 py-3 bg-[var(--yp-gray-200)] border border-[var(--yp-gray-300)] rounded-xl text-[var(--yp-dark)] placeholder-[var(--yp-gray-500)] focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-[var(--yp-blue)]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--yp-dark)] mb-2">
                    <MapPin className="w-4 h-4 text-[var(--yp-blue)]" />
                    {t('city') || 'Ville'} *
                  </label>
                  <input
                    type="text"
                    value={customerCity}
                    onChange={(e) => setCustomerCity(e.target.value)}
                    placeholder="Ex: Fès, Casablanca, Marrakech..."
                    className="w-full px-4 py-3 bg-[var(--yp-gray-200)] border border-[var(--yp-gray-300)] rounded-xl text-[var(--yp-dark)] placeholder-[var(--yp-gray-500)] focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-[var(--yp-blue)]/20 transition-all"
                  />
                  {customerCity.trim().length >= 2 && (
                    <p className="text-xs mt-1.5 flex items-center gap-1 text-[var(--yp-gray-500)]">
                      <Truck className="w-3 h-3" />
                      {t('deliveryMaroc') || 'Livraison Maroc : 35 dh'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--yp-dark)] mb-2">
                    <MapPin className="w-4 h-4 text-[var(--yp-blue)]" />
                    {t('address') || 'Adresse'} *
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    placeholder={t('addressPlaceholder') || 'Rue, quartier, n° de maison...'}
                    className="w-full px-4 py-3 bg-[var(--yp-gray-200)] border border-[var(--yp-gray-300)] rounded-xl text-[var(--yp-dark)] placeholder-[var(--yp-gray-500)] focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-[var(--yp-blue)]/20 transition-all"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-sm font-semibold text-[var(--yp-dark)] mb-2">
                    <FileText className="w-4 h-4 text-[var(--yp-gray-500)]" />
                    {t('note') || 'Remarque'} <span className="text-[var(--yp-gray-500)] font-normal">({t('optional') || 'facultatif'})</span>
                  </label>
                  <input
                    type="text"
                    value={customerNote}
                    onChange={(e) => setCustomerNote(e.target.value)}
                    placeholder={t('notePlaceholder') || 'Ex: livrer le matin...'}
                    className="w-full px-4 py-3 bg-[var(--yp-gray-200)] border border-[var(--yp-gray-300)] rounded-xl text-[var(--yp-dark)] placeholder-[var(--yp-gray-500)] focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-[var(--yp-blue)]/20 transition-all"
                  />
                </div>

                <div className="bg-[var(--yp-gray-200)] rounded-2xl p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-[var(--yp-dark)] text-sm flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-[var(--yp-blue)]" />
                        Code promo
                      </p>
                      {promoMessage && (
                        <p className={`text-xs mt-1 ${promoStatus === 'error' ? 'text-red-500' : 'text-emerald-600'}`}>
                          {promoMessage}
                        </p>
                      )}
                    </div>
                    {promoCode && promoStatus !== 'idle' && (
                      <button
                        type="button"
                        onClick={() => { removePromoCode(); setPromoInput(''); }}
                        className="text-xs font-semibold text-red-500 hover:underline whitespace-nowrap"
                      >
                        Supprimer
                      </button>
                    )}
                  </div>

                  <div className="mt-3 flex gap-2">
                    <input
                      type="text"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      placeholder="Saisissez votre code"
                      className="flex-1 px-4 py-3 bg-white border border-[var(--yp-gray-300)] rounded-xl text-[var(--yp-dark)] placeholder-[var(--yp-gray-500)] focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-[var(--yp-blue)]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        const code = String(promoInput ?? '').trim();
                        if (!code) return;
                        setPromoStatus('loading');
                        setPromoMessage('');
                        setPromoDiscount(0);
                        applyPromoCode(code, { silent: true });
                        try {
                          const res: any = await validatePromoCode(code, subtotal);
                          setPromoDiscount(typeof res?.discount === 'number' ? res.discount : 0);
                          setPromoStatus('applied');
                          setPromoMessage(typeof res?.message === 'string' ? res.message : '');
                        } catch (e) {
                          const msg = e instanceof Error ? e.message : 'Code promo invalide';
                          setPromoDiscount(0);
                          setPromoStatus('error');
                          setPromoMessage(msg);
                        }
                      }}
                      disabled={promoStatus === 'loading'}
                      className={`px-4 py-3 rounded-xl font-bold text-sm ${promoStatus === 'loading'
                        ? 'bg-[var(--yp-gray-300)] text-[var(--yp-gray-500)] cursor-not-allowed'
                        : 'bg-[var(--yp-blue)] text-white hover:opacity-95'
                        }`}
                    >
                      Appliquer le code
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Order Summary ── */}
              <div className="bg-[var(--yp-gray-200)] rounded-2xl p-4">
                <h3 className="font-semibold text-[var(--yp-dark)] text-sm mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-[var(--yp-blue)]" />
                  {t('orderSummary') || 'Résumé de la commande'}
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between text-[var(--yp-gray-700)]">
                    <span className="line-clamp-1 flex-1 mr-2">{isAr ? product.nameAr : product.name}</span>
                  </div>
                  {selectedVariantLabel && (
                    <div className="flex justify-between text-[var(--yp-gray-600)]">
                      <span>{t('variant') || 'Variante'}</span>
                      <span className="font-medium text-[var(--yp-dark)]">{selectedVariantLabel}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-[var(--yp-gray-600)]">
                    <span>{t('quantity')}</span>
                    <span className="font-medium text-[var(--yp-dark)]">{quantity}</span>
                  </div>
                  <div className="flex justify-between text-[var(--yp-gray-600)]">
                    <span>{t('unitPrice') || 'Prix unitaire'}</span>
                    <span className="font-medium text-[var(--yp-dark)]">{product.price} dh</span>
                  </div>
                  <div className="flex justify-between text-[var(--yp-gray-600)]">
                    <span>{t('subtotal') || 'Sous-total'}</span>
                    <span className="font-medium text-[var(--yp-dark)]">{subtotal} dh</span>
                  </div>
                  {promoStatus === 'applied' && promoCode && promoDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700">
                      <span>Code promo ({promoCode})</span>
                      <span className="font-semibold">- {promoDiscount} dh</span>
                    </div>
                  )}
                  {promoStatus === 'applied' && promoCode && promoDiscount > 0 && (
                    <div className="flex justify-between text-[var(--yp-gray-600)]">
                      <span>Sous-total après promo</span>
                      <span className="font-medium text-[var(--yp-dark)]">{subtotalAfterPromo} dh</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center text-[var(--yp-gray-600)]">
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      {t('delivery') || 'Livraison'}
                    </span>
                    <span className="font-medium">{deliveryFee} dh</span>
                  </div>
                  <div className="border-t border-[var(--yp-gray-300)] pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-bold text-[var(--yp-dark)]">{t('total')}</span>
                      <span className="font-bold text-[var(--yp-dark)] text-lg">{grandTotal} dh</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Final CTA — Confirmer sur WhatsApp ── */}
              <button
                onClick={handleConfirmWhatsApp}
                disabled={!isFormValid}
                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2.5 transition-all ${isFormValid
                  ? 'bg-[var(--yp-whatsapp)] hover:bg-[var(--yp-whatsapp-dark)] text-white shadow-lg shadow-green-500/20 active:scale-[0.98]'
                  : 'bg-[var(--yp-gray-300)] text-[var(--yp-gray-500)] cursor-not-allowed'
                  }`}
              >
                <MessageCircle className="w-5 h-5" />
                {t('confirmOnWhatsApp') || 'Confirmer sur WhatsApp'}
              </button>

              {!isFormValid && (
                <p className="text-xs text-[var(--yp-gray-500)] text-center">
                  {t('fillRequiredFields') || 'Veuillez remplir les champs obligatoires (*)'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Image Zoom Modal */}
      {isZoomOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setIsZoomOpen(false)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center"
            onClick={() => setIsZoomOpen(false)}
          >
            <X className="w-6 h-6 text-white" />
          </button>
          <img
            src={`${getImageUrl(galleryImages[selectedImage])}?v=wmki`}
            alt=""
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
