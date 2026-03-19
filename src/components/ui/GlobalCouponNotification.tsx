import { useState, useEffect } from 'react';
import { useStore } from '@/contexts/StoreContext';
import { X, Tag, ArrowLeft } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { toast } from 'sonner';

export function GlobalCouponNotification() {
  const { applyPromoCode, promoCode, promoStatus, setIsCartOpen } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Only show on home page and not on admin routes
    if (location.pathname !== '/') {
      setIsVisible(false);
      return;
    }

    // Force show every time for now as requested "MUST APPEAR ON ALL PAGES"
    // To make it less annoying in production we might want to uncomment the dismissal check later
    // const dismissKey = `yp_dismissed_coupon_v2_${location.pathname}`;
    // if (sessionStorage.getItem(dismissKey)) return;

    if (promoCode && promoStatus === 'applied') {
      setIsVisible(false);
      return;
    }

    setTimeout(() => setIsVisible(true), 2500);
  }, [promoCode, promoStatus, location.pathname]);

  const handleApply = async () => {
    const code = couponInput.trim();
    if (!code) {
      toast.error('أدخل كود الكوبون');
      return;
    }
    setIsApplying(true);
    try {
      await applyPromoCode(code);
      setIsCartOpen(true);
      setIsVisible(false);
    } catch {
      // handled by applyPromoCode
    } finally {
      setIsApplying(false);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    // sessionStorage.setItem(`yp_dismissed_coupon_v2_${location.pathname}`, 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-24 right-4 sm:right-6 sm:bottom-24 z-[60] max-w-[240px] w-auto animate-in slide-in-from-right-10 fade-in duration-700">
      <div className="bg-transparent text-gray-800 rounded-xl relative">
        <button
          onClick={handleDismiss}
          className="absolute -top-2 -right-2 p-1 text-gray-400 hover:text-gray-600 bg-white shadow-sm rounded-full transition-all z-10 border border-gray-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="p-2 sm:p-3">
          <div className="flex items-center gap-2 mb-2 pr-2">
            <p className="font-bold text-sm leading-snug drop-shadow-sm text-[#FF5722]" dir="rtl">
              🎁 إستفد دابا !
            </p>
          </div>

          <div className="flex gap-1.5">
            <input
              type="text"
              value={couponInput}
              onChange={e => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleApply()}
              placeholder="Code..."
              dir="rtl"
              className="w-24 bg-white/90 border border-gray-200 text-gray-800 placeholder-gray-400 text-xs font-medium px-2 py-1.5 rounded-lg focus:outline-none focus:border-[#FF5722] focus:ring-1 focus:ring-[#FF5722]/30 transition-all shadow-sm"
            />
            <button
              onClick={handleApply}
              disabled={isApplying || !couponInput.trim()}
              className="bg-[#FF5722] hover:bg-[#F4511E] disabled:opacity-50 text-white text-xs font-bold py-1.5 px-3 rounded-lg transition-all shadow-md active:scale-95 whitespace-nowrap flex items-center gap-1"
            >
              {isApplying ? (
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  تأكيد
                  <ArrowLeft className="w-3 h-3" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
