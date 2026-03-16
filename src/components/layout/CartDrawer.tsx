import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, ShoppingBag, Trash2, MessageCircle, ArrowRight, User, Phone, MapPin, FileText, Home } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { toast } from 'sonner';

import { useStoreSettings } from '@/data/storeSettings';
import { getImageUrl } from '@/lib/utils';
import { createOrder } from '@/lib/api';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

export default function CartDrawer() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const {
    cart,
    isCartOpen,
    setIsCartOpen,
    removeFromCart,
    updateCartQuantity,
    cartTotal,
    promoCode,
    promoDiscount,
    promoStatus,
    promoMessage,
    applyPromoCode,
    removePromoCode,
  } = useStore();
  const settings = useStoreSettings();
  const { phone } = settings;

  // ── Customer form state ──
  const [showForm, setShowForm] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCity, setCustomerCity] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerNote, setCustomerNote] = useState('');

  const deliveryFee = settings.shippingFeeNational ?? 35;
  const subtotalAfterPromo = Math.max(0, cartTotal - (promoStatus === 'applied' ? promoDiscount : 0));
  const grandTotal = subtotalAfterPromo + deliveryFee;

  const isFormValid = customerName.trim().length >= 2 && customerPhone.trim().length >= 8 && customerCity.trim().length >= 2 && customerAddress.trim().length >= 5;

  const [promoInput, setPromoInput] = useState(promoCode || '');
  useEffect(() => {
    setPromoInput(promoCode || '');
  }, [promoCode]);

  const handleWhatsAppOrder = async () => {
    if (cart.length === 0 || !isFormValid) return;
    const unavailable = cart.find(item => item.product.inStock === false || (typeof (item.product as any).stock === 'number' && Number((item.product as any).stock) <= 0));
    if (unavailable) {
      toast.error(`${unavailable.product.name} : ${t('outOfStock') || 'Rupture de stock'}`);
      return;
    }

    // 1) Save order to DB
    try {
      await createOrder({
        customerName,
        phone: customerPhone,
        city: customerCity,
        address: customerAddress,
        notes: customerNote || '',
        promoCode: promoStatus === 'applied' && promoCode ? promoCode : undefined,
        items: cart.map(item => ({
          productId: item.product.id,
          quantity: item.quantity,
          price: item.product.price,
          variant: item.variant || undefined,
        })),
      });
    } catch (err) {
      console.error('Failed to save order:', err);
      toast.error('Échec de la sauvegarde de la commande. Vérifiez votre connexion puis réessayez.');
      return;
    }

    // 2) Open WhatsApp
    const itemsList = cart.map(item =>
      `- ${item.product.name} x${item.quantity} = ${item.product.price * item.quantity} dh\n  URL: ${window.location.origin}/product/${item.product.id}`
    ).join('\n');

    const message = `Bonjour, je souhaite commander :

${itemsList}

Sous-total: ${cartTotal} dh
${promoStatus === 'applied' && promoCode && promoDiscount > 0 ? `Code promo (${promoCode}): -${promoDiscount} dh\n` : ''}Livraison: ${deliveryFee} dh
Total: ${grandTotal} dh

Mes informations :
Nom: ${customerName}
Téléphone: ${customerPhone}
Ville: ${customerCity}
Adresse: ${customerAddress}${customerNote ? `\nRemarque: ${customerNote}` : ''}

Merci !`;

    const cleanPhone = phone.replace(/[^\d]/g, '') || '212690939090';
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 h-dvh">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => { setIsCartOpen(false); setShowForm(false); }}
      />

      {/* Drawer */}
      <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col ${i18n.language === 'ar' ? 'right-auto left-0' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-[var(--yp-blue)]" />
            <h2 className="text-xl font-bold">{showForm ? 'Vos informations' : t('yourCart')}</h2>
            <span className="bg-[var(--yp-blue)] text-white text-sm px-2 py-0.5 rounded-full font-bold">
              {cart.length}
            </span>
          </div>
          <button
            onClick={() => { setIsCartOpen(false); setShowForm(false); }}
            className="p-2 hover:bg-gray-100 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ShoppingBag className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-[#333] mb-2">{t('emptyCart')}</h3>
              <p className="text-[#666] mb-6">{t('emptyCartDesc')}</p>
              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigate('/shop');
                }}
                className="btn-primary"
              >
                {t('startShopping')}
              </button>
            </div>
          ) : showForm ? (
            /* ═══ CUSTOMER FORM ═══ */
            <div className="space-y-4">
              {/* Back to cart */}
              <button
                onClick={() => setShowForm(false)}
                className="text-sm text-[var(--yp-blue)] font-medium flex items-center gap-1 hover:underline"
              >
                ← Retour au panier
              </button>

              {/* Order summary */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-2">
                <h4 className="text-sm font-bold text-[#333]">Résumé de commande</h4>
                {cart.map(item => (
                  <div key={`${item.product.id}-${item.variant || ''}`} className="flex justify-between text-sm">
                    <span className="text-[#666]">{(i18n.language === 'ar' ? item.product.nameAr : item.product.name)} × {item.quantity}</span>
                    <span className="font-medium">{item.product.price * item.quantity} dh</span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 flex justify-between text-sm">
                  <span className="text-[#666]">Sous-total</span>
                  <span className="font-bold">{cartTotal} dh</span>
                </div>
                {promoStatus === 'applied' && promoCode && promoDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Code promo ({promoCode})</span>
                    <span className="font-bold text-emerald-600">- {promoDiscount} dh</span>
                  </div>
                )}
                {promoStatus === 'applied' && promoCode && promoDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Sous-total après promo</span>
                    <span className="font-bold">{subtotalAfterPromo} dh</span>
                  </div>
                )}
              </div>

              {/* Promo code */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#333]">Code promo</p>
                    {promoMessage && <p className={`text-xs mt-0.5 ${promoStatus === 'error' ? 'text-red-500' : 'text-[#666]'}`}>{promoMessage}</p>}
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
                    onChange={e => setPromoInput(e.target.value)}
                    placeholder="Saisissez votre code"
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => applyPromoCode(promoInput)}
                    disabled={promoStatus === 'loading'}
                    className={`px-4 py-2.5 rounded-xl text-sm font-semibold ${promoStatus === 'loading' ? 'bg-gray-200 text-gray-400' : 'bg-[var(--yp-blue)] text-white hover:opacity-95'}`}
                  >
                    Appliquer le code
                  </button>
                </div>
              </div>

              {/* Form fields */}
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">
                    <User className="w-3.5 h-3.5 inline mr-1" />Nom complet *
                  </label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                    placeholder="Votre nom"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">
                    <Phone className="w-3.5 h-3.5 inline mr-1" />Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={e => setCustomerPhone(e.target.value)}
                    placeholder="+212 6XX XXX XXX"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">
                    <MapPin className="w-3.5 h-3.5 inline mr-1" />Ville *
                  </label>
                  <input
                    type="text"
                    value={customerCity}
                    onChange={e => setCustomerCity(e.target.value)}
                    placeholder="Ex: Fès, Casablanca, Marrakech..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">
                    <Home className="w-3.5 h-3.5 inline mr-1" />Adresse *
                  </label>
                  <input
                    type="text"
                    value={customerAddress}
                    onChange={e => setCustomerAddress(e.target.value)}
                    placeholder="Rue, quartier, n° de maison..."
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#666] mb-1">
                    <FileText className="w-3.5 h-3.5 inline mr-1" />Note (optionnel)
                  </label>
                  <textarea
                    value={customerNote}
                    onChange={e => setCustomerNote(e.target.value)}
                    placeholder="Instructions spéciales..."
                    rows={2}
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[var(--yp-blue)] text-sm resize-none"
                  />
                </div>
              </div>

              {/* Delivery + Total */}
              <div className="bg-gray-50 rounded-xl p-3 space-y-1.5">
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">Sous-total</span>
                  <span>{cartTotal} dh</span>
                </div>
                {promoStatus === 'applied' && promoCode && promoDiscount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-[#666]">Code promo ({promoCode})</span>
                    <span className="text-emerald-600">- {promoDiscount} dh</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-[#666]">🚚 Livraison {customerCity ? `(${customerCity})` : ''}</span>
                  <span>{deliveryFee} dh</span>
                </div>
                <div className="border-t pt-1.5 flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span className="text-[var(--yp-blue)]">{grandTotal} dh</span>
                </div>
              </div>
            </div>
          ) : (
            /* ═══ CART ITEMS ═══ */
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={`${item.product.id}-${item.variant || ''}`} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                  <LazyLoadImage
                    src={getImageUrl(item.product.image)}
                    alt={i18n.language === 'ar' ? item.product.nameAr : item.product.name}
                    effect="blur"
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                    wrapperClassName="w-20 h-20 flex-shrink-0 block"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[#333] line-clamp-2 text-sm">
                      {i18n.language === 'ar' ? item.product.nameAr : item.product.name}
                    </h4>
                    {item.variant && (
                      <p className="text-xs text-[#666] mt-1">{item.variant}</p>
                    )}
                    <p className="text-[var(--yp-blue)] font-bold mt-1">
                      {item.product.price} dh
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1, item.variant)}
                          className="w-7 h-7 bg-white border rounded-lg flex items-center justify-center hover:border-[var(--yp-blue)]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1, item.variant)}
                          className="w-7 h-7 bg-white border rounded-lg flex items-center justify-center hover:border-[var(--yp-blue)]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id, item.variant)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t p-4 space-y-3 bg-white">
            {showForm ? (
              /* ═══ FORM FOOTER: Confirm on WhatsApp ═══ */
              <>
                <button
                  onClick={handleWhatsAppOrder}
                  disabled={!isFormValid}
                  className={`w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors ${isFormValid
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                >
                  <MessageCircle className="w-5 h-5" />
                  Confirmer sur WhatsApp
                </button>
                {!isFormValid && (
                  <p className="text-xs text-center text-red-400">Veuillez remplir tous les champs obligatoires *</p>
                )}
              </>
            ) : (
              /* ═══ CART FOOTER: Continue or go to form ═══ */
              <>
                <div className="flex justify-between items-center">
                  <span className="text-[#666]">{t('subtotal')}</span>
                  <span className="text-2xl font-bold text-[var(--yp-blue)]">{cartTotal} dh</span>
                </div>

                <button
                  onClick={() => setShowForm(true)}
                  className="w-full bg-[#1C1C2E] hover:bg-[#2a2a40] text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  Passer la commande
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigate('/shop');
                  }}
                  className="w-full border-2 border-[#333] text-[#333] py-3 rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-[#333] hover:text-white transition-colors"
                >
                  {t('continueShopping')}
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
