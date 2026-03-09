import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { X, Plus, Minus, ShoppingBag, Trash2, MessageCircle, ArrowRight } from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { generateCartWhatsAppMessage } from '@/components/ui/WhatsAppButton';
import { useStoreSettings } from '@/data/storeSettings';

export default function CartDrawer() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { cart, isCartOpen, setIsCartOpen, removeFromCart, updateCartQuantity, cartTotal } = useStore();
  const { phone } = useStoreSettings();

  const handleWhatsAppOrder = () => {
    if (cart.length === 0) return;
    const message = generateCartWhatsAppMessage(cart);
    const cleanPhone = phone.replace(/[^\d]/g, '') || '212600000000';
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={() => setIsCartOpen(false)}
      />

      {/* Drawer */}
      <div className={`absolute top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col ${i18n.language === 'ar' ? 'right-auto left-0' : ''}`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-3">
            <ShoppingBag className="w-6 h-6 text-[#f5a623]" />
            <h2 className="text-xl font-bold">{t('yourCart')}</h2>
            <span className="bg-[#f5a623] text-white text-sm px-2 py-0.5 rounded-full font-bold">
              {cart.length}
            </span>
          </div>
          <button
            onClick={() => setIsCartOpen(false)}
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
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div key={item.product.id} className="flex gap-3 bg-gray-50 rounded-xl p-3">
                  <img
                    src={item.product.image}
                    alt={i18n.language === 'ar' ? item.product.nameAr : item.product.name}
                    className="w-20 h-20 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-[#333] line-clamp-2 text-sm">
                      {i18n.language === 'ar' ? item.product.nameAr : item.product.name}
                    </h4>
                    {item.variant && (
                      <p className="text-xs text-[#666] mt-1">{item.variant}</p>
                    )}
                    <p className="text-[#f5a623] font-bold mt-1">
                      {item.product.price} dh
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 bg-white border rounded-lg flex items-center justify-center hover:border-[#f5a623]"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 bg-white border rounded-lg flex items-center justify-center hover:border-[#f5a623]"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
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
          <div className="border-t p-4 space-y-4 bg-white">
            <div className="flex justify-between items-center">
              <span className="text-[#666]">{t('subtotal')}</span>
              <span className="text-2xl font-bold text-[#f5a623]">{cartTotal} dh</span>
            </div>

            <p className="text-xs text-[#666]">{t('shippingCalculated')}</p>

            <button
              onClick={handleWhatsAppOrder}
              className="w-full bg-green-500 hover:bg-green-600 text-white py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors"
            >
              <MessageCircle className="w-5 h-5" />
              {t('orderViaWhatsApp')}
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
          </div>
        )}
      </div>
    </div>
  );
}
