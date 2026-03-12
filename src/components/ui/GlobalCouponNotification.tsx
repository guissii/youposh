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

    // Check if already dismissed for this specific route (so it reappears on navigation)
    // "Dynamic" behavior: User wants it to appear when browsing different products
    const dismissedOnRoute = sessionStorage.getItem(`yp_dismissed_coupon_${code}_${location.pathname}`);
    if (dismissedOnRoute) {
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
        // Fetch products for thumbnails - randomized for dynamic feel
        const prods = await fetchTopProducts();
        // Shuffle array to show different products
        const shuffled = prods.sort(() => 0.5 - Math.random());
        setProducts(shuffled.slice(0, 2));

        // Validate to get details
        const res = await validatePromoCode(code, 99999);
        setPromoDetails(res);
        
        // Show after a delay (scroll/interaction simulation)
        setTimeout(() => setIsVisible(true), 2000);
      } catch (err) {
        console.error('Failed to load global coupon details', err);
      }
    };

    loadData();
  }, [settings.activeGlobalCoupon, promoCode, location.pathname]);

  const handleApply = async () => {
    if (settings.activeGlobalCoupon) {
      await applyPromoCode(settings.activeGlobalCoupon);
      setIsCartOpen(true);
      setIsVisible(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (settings.activeGlobalCoupon) {
      // Only dismiss for CURRENT route/page
      sessionStorage.setItem(`yp_dismissed_coupon_${settings.activeGlobalCoupon}_${location.pathname}`, 'true');
    }
  };

  if (!isVisible || !promoDetails) return null;

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-8 sm:right-8 z-[100] max-w-[340px] w-[calc(100%-32px)] animate-in slide-in-from-bottom-10 fade-in duration-700">
      <div className="bg-[#1A1A1A] text-white rounded-2xl shadow-2xl overflow-hidden relative border border-gray-800/50 backdrop-blur-sm">
        {/* Close button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-4 sm:p-5">
          <p className="font-medium text-sm sm:text-base pr-6 mb-4 leading-relaxed">
            Votre coupon de <span className="text-[var(--yp-color-posh)] font-bold text-lg">{promoDetails.discountValue} {promoDetails.discountType === 'percentage' ? '%' : 'MAD'}</span> vous attend
          </p>

          <div className="flex items-center gap-4">
            {/* Product Thumbnails */}
            <div className="flex -space-x-4">
              {products.map((p, i) => (
                <div key={p.id} className={`w-12 h-12 sm:w-14 sm:h-14 rounded-xl border-[3px] border-[#1A1A1A] overflow-hidden bg-white shadow-lg relative z-${10-i}`}>
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
              className="flex-1 bg-[var(--yp-color-posh)] hover:opacity-90 text-white text-sm font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-[var(--yp-color-posh)]/20 active:scale-95 whitespace-nowrap"
            >
              Aller au panier
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
