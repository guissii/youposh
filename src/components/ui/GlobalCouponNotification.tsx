import { useState, useEffect } from 'react';
import { useStoreSettings } from '@/data/storeSettings';
import { useStore } from '@/contexts/StoreContext';
import { validatePromoCode, fetchTopProducts } from '@/lib/api';
import { X } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { getImageUrl } from '@/lib/utils';

export function GlobalCouponNotification() {
  const settings = useStoreSettings();
  const { applyPromoCode, promoCode, setIsCartOpen } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [promoDetails, setPromoDetails] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const location = useLocation();

  useEffect(() => {
    // Only show on shop/product/home pages, not admin
    if (location.pathname.startsWith('/admin')) {
      setIsVisible(false);
      return;
    }

    const code = settings.activeGlobalCoupon;
    if (!code) {
      setIsVisible(false);
      return;
    }

    // Check if already dismissed in session
    const dismissed = sessionStorage.getItem(`yp_dismissed_coupon_${code}`);
    if (dismissed) {
      return;
    }

    // Check if already applied
    if (promoCode === code) {
      setIsVisible(false);
      return;
    }

    // Fetch details and products
    const loadData = async () => {
      try {
        // Fetch products for thumbnails
        const prods = await fetchTopProducts();
        setProducts(prods.slice(0, 2));

        // Validate to get details (using a high amount to bypass min order check for display)
        const res = await validatePromoCode(code, 99999);
        setPromoDetails(res);
        
        // Show after a small delay
        setTimeout(() => setIsVisible(true), 1500);
      } catch (err) {
        console.error('Failed to load global coupon details', err);
      }
    };

    loadData();
  }, [settings.activeGlobalCoupon, promoCode, location.pathname]);

  const handleApply = async () => {
    if (settings.activeGlobalCoupon) {
      await applyPromoCode(settings.activeGlobalCoupon);
      setIsCartOpen(true); // Open cart to show it applied
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (settings.activeGlobalCoupon) {
      sessionStorage.setItem(`yp_dismissed_coupon_${settings.activeGlobalCoupon}`, 'true');
    }
  };

  if (!isVisible || !promoDetails) return null;

  return (
    <div className="fixed bottom-24 right-4 z-[40] max-w-[320px] w-full animate-in slide-in-from-bottom-5 fade-in duration-500">
      <div className="bg-[#1A1A1A] text-white rounded-xl shadow-2xl overflow-hidden relative border border-gray-800">
        {/* Close button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-4">
          <p className="font-medium text-sm pr-6 mb-3">
            Votre coupon de <span className="text-[var(--yp-color-posh)] font-bold">{promoDetails.discountValue} {promoDetails.discountType === 'percentage' ? '%' : 'MAD'}</span> vous attend
          </p>

          <div className="flex items-center gap-3">
            {/* Product Thumbnails */}
            <div className="flex -space-x-3">
              {products.map((p, i) => (
                <div key={p.id} className={`w-12 h-12 rounded-lg border-2 border-[#1A1A1A] overflow-hidden bg-white z-${10-i}`}>
                  <img 
                    src={getImageUrl(p.image)} 
                    alt="" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>

            {/* CTA Button */}
            <button
              onClick={handleApply}
              className="flex-1 bg-[var(--yp-color-posh)] hover:opacity-90 text-white text-xs font-bold py-2.5 px-3 rounded-lg transition-all shadow-lg active:scale-95 whitespace-nowrap"
            >
              Aller au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
