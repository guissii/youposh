import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft, Heart, Star, Plus, Minus, MessageCircle,
  ShoppingCart, Truck, RefreshCw, Shield, Check, ChevronRight,
  X, ArrowRight, User, Phone, MapPin, FileText, Package
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { fetchProduct, fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import WhatsAppButton, { generateOrderWhatsAppMessage } from '@/components/ui/WhatsAppButton';
import { useStoreSettings } from '@/data/storeSettings';

export default function ProductPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const { addToCart, addToWishlist, isInWishlist } = useStore();
  const { phone } = useStoreSettings();

  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedVariant, setSelectedVariant] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'description' | 'specs' | 'reviews'>('description');
  const [isZoomOpen, setIsZoomOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Multi-step checkout state
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerNote, setCustomerNote] = useState('');

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
    setCustomerNote('');

    // Fetch individual product details and its related products
    async function loadProductData() {
      try {
        if (!id) return;
        const p = await fetchProduct(Number(id));
        setProduct(p);

        // Fetch related products from the same category
        if (p && p.category) {
          const rel = await fetchProducts(`category=${p.category}`);
          setRelatedProducts(rel.filter((r: any) => r.id !== p.id).slice(0, 4));
        }
      } catch (error) {
        console.error('Failed to fetch product', error);
      }
    }
    loadProductData();
  }, [id]);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('productNotFound')}</h1>
          <button onClick={() => navigate('/')} className="btn-primary">
            {t('backToHome')}
          </button>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : 0;

  const subtotal = product.price * quantity;

  // Smart delivery fee: Fès = 20 dh, rest of Morocco = 50 dh
  const isFes = /^f[eèé]s$/i.test(customerCity.trim());
  const deliveryFee = customerCity.trim().length >= 2 ? (isFes ? 20 : 50) : 50;
  const grandTotal = subtotal + deliveryFee;

  const isFormValid = customerName.trim().length >= 2 && customerPhone.trim().length >= 8 && customerCity.trim().length >= 2;

  const handleConfirmWhatsApp = () => {
    const message = generateOrderWhatsAppMessage(
      product,
      quantity,
      selectedVariant || undefined,
      {
        customerName,
        phone: customerPhone,
        city: customerCity,
        note: customerNote || undefined,
      },
      deliveryFee
    );
    const cleanPhone = phone.replace(/[^\d]/g, '') || '212600000000';
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedVariant || undefined);
  };

  return (
    <div className="min-h-screen bg-[var(--yp-gray-100)]">
      <Header />

      <main className="pb-20">
        {/* Breadcrumb */}
        <div className="bg-white border-b border-[var(--yp-gray-300)]">
          <div className="max-w-7xl mx-auto px-4 py-3">
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
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-6 lg:gap-10">

              {/* ═══ Bloc 1 — Image Gallery ═══ */}
              <div className="space-y-4">
                <div className="relative aspect-square bg-white rounded-2xl overflow-hidden shadow-card">
                  <img
                    src={product.images[selectedImage]}
                    alt={isAr ? product.nameAr : product.name}
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => setIsZoomOpen(true)}
                    className="absolute bottom-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg text-sm font-bold text-[var(--yp-dark)] hover:bg-white transition-colors"
                  >
                    +{product.images.length}
                  </button>
                  {discount > 0 && (
                    <span className="absolute top-4 left-4 badge-discount text-sm px-3 py-1.5">
                      -{discount}%
                    </span>
                  )}
                  {product.inStock && (
                    <span className="absolute top-4 right-4 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-lg font-medium flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {t('inStock')}
                    </span>
                  )}
                </div>

                {/* Thumbnails */}
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {product.images?.map((img: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${selectedImage === i ? 'border-[var(--yp-blue)] shadow-md' : 'border-transparent hover:border-[var(--yp-gray-400)]'
                        }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
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
                      {variant.options?.map((option: string) => (
                        <button
                          key={option}
                          onClick={() => setSelectedVariant(option)}
                          className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${selectedVariant === option
                            ? 'border-[var(--yp-blue)] bg-[var(--yp-blue-50)] text-[var(--yp-blue)]'
                            : 'border-[var(--yp-gray-300)] hover:border-[var(--yp-blue)] text-[var(--yp-gray-700)]'
                            }`}
                        >
                          {option}
                        </button>
                      ))}
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
                        onClick={() => setQuantity(quantity + 1)}
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
                  {/* Primary CTA — Continuer la commande */}
                  <button
                    onClick={() => setShowOrderForm(true)}
                    className="w-full bg-[var(--yp-blue)] hover:bg-[var(--yp-blue-dark)] text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-[var(--yp-blue)]/20 active:scale-[0.98]"
                  >
                    {t('continueOrder') || 'Continuer la commande'}
                    <ArrowRight className="w-5 h-5" />
                  </button>

                  {/* Secondary — Cart + Wishlist */}
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={handleAddToCart}
                      className="bg-[var(--yp-gray-200)] hover:bg-[var(--yp-gray-300)] text-[var(--yp-dark)] py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors text-sm"
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
          <div className="max-w-7xl mx-auto px-4">
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
                        <td className="py-3 font-medium text-[var(--yp-dark)] text-sm">{product.category}</td>
                      </tr>
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
            <div className="max-w-7xl mx-auto px-4">
              <h2 className="text-xl font-bold text-[var(--yp-dark)] mb-6 flex items-center gap-2 font-heading">
                <ChevronRight className="w-5 h-5 text-[var(--yp-blue)]" />
                {t('relatedProducts')}
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    placeholder="Fès"
                    list="cities-list"
                    className="w-full px-4 py-3 bg-[var(--yp-gray-200)] border border-[var(--yp-gray-300)] rounded-xl text-[var(--yp-dark)] placeholder-[var(--yp-gray-500)] focus:outline-none focus:border-[var(--yp-blue)] focus:ring-2 focus:ring-[var(--yp-blue)]/20 transition-all"
                  />
                  <datalist id="cities-list">
                    {['Fès', 'Casablanca', 'Rabat', 'Marrakech', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra', 'Tétouan', 'Salé', 'Nador', 'Mohammedia', 'El Jadida', 'Béni Mellal'].map(city => (
                      <option key={city} value={city} />
                    ))}
                  </datalist>
                  {customerCity.trim().length >= 2 && (
                    <p className={`text-xs mt-1.5 flex items-center gap-1 ${isFes ? 'text-emerald-600' : 'text-[var(--yp-gray-500)]'
                      }`}>
                      <Truck className="w-3 h-3" />
                      {isFes
                        ? (t('deliveryFes') || 'Livraison Fès : 20 dh')
                        : (t('deliveryMaroc') || 'Livraison Maroc : 50 dh')}
                    </p>
                  )}
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
                  {selectedVariant && (
                    <div className="flex justify-between text-[var(--yp-gray-600)]">
                      <span>{t('variant') || 'Variante'}</span>
                      <span className="font-medium text-[var(--yp-dark)]">{selectedVariant}</span>
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
                  <div className={`flex justify-between items-center ${isFes ? 'text-emerald-600' : 'text-[var(--yp-gray-600)]'}`}>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" />
                      {t('delivery') || 'Livraison'}
                      {isFes && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-medium ml-1">Fès</span>}
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
            src={product.images[selectedImage]}
            alt=""
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
