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
    if (location.pathname.startsWith('/admin')) {
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
    <div className="fixed bottom-24 right-4 sm:right-6 sm:bottom-24 z-[60] max-w-[280px] sm:max-w-[320px] w-[calc(100%-32px)] animate-in slide-in-from-right-10 fade-in duration-700">
      <div className="bg-black/30 backdrop-blur-md text-white rounded-xl shadow-xl overflow-hidden relative border border-white/10">
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        <div className="p-3 sm:p-5">
          <div className="flex items-center gap-2 mb-2 pr-5">
            <Tag className="w-4 h-4 text-[var(--yp-color-posh)] flex-shrink-0" />
            <p className="font-bold text-sm sm:text-lg leading-snug" dir="rtl">
              🎁 عندك كوبون؟
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={e => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleApply()}
              placeholder="Code..."
              dir="rtl"
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-xs sm:text-sm font-medium px-2.5 py-2 rounded-lg focus:outline-none focus:border-[var(--yp-color-posh)] focus:ring-1 focus:ring-[var(--yp-color-posh)]/30 transition-all"
            />
            <button
              onClick={handleApply}
              disabled={isApplying || !couponInput.trim()}
              className="bg-[var(--yp-color-posh)] hover:opacity-90 disabled:opacity-50 text-white text-xs sm:text-sm font-bold py-2 px-3 rounded-lg transition-all shadow-lg shadow-[var(--yp-color-posh)]/20 active:scale-95 whitespace-nowrap flex items-center gap-1"
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
