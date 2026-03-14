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

    const dismissKey = `yp_dismissed_coupon_${location.pathname}`;
    if (sessionStorage.getItem(dismissKey)) return;

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
    sessionStorage.setItem(`yp_dismissed_coupon_${location.pathname}`, 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-6 right-4 sm:right-6 z-40 max-w-[320px] w-[calc(100%-32px)] animate-in slide-in-from-right-10 fade-in duration-700">
      <div className="bg-[#1A1A1A] text-white rounded-2xl shadow-2xl overflow-hidden relative border border-gray-800/50">
        <button
          onClick={handleDismiss}
          className="absolute top-2.5 right-2.5 p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3 pr-6">
            <Tag className="w-5 h-5 text-[var(--yp-color-posh)] flex-shrink-0" />
            <p className="font-bold text-base sm:text-lg leading-snug" dir="rtl">
              🎁 عندك كوبون؟ دخلو هنا واستافد!
            </p>
          </div>

          <div className="flex gap-2">
            <input
              type="text"
              value={couponInput}
              onChange={e => setCouponInput(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleApply()}
              placeholder="أدخل الكوبون هنا..."
              dir="rtl"
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-500 text-sm font-medium px-3 py-2.5 rounded-xl focus:outline-none focus:border-[var(--yp-color-posh)] focus:ring-1 focus:ring-[var(--yp-color-posh)]/30 transition-all"
            />
            <button
              onClick={handleApply}
              disabled={isApplying || !couponInput.trim()}
              className="bg-[var(--yp-color-posh)] hover:opacity-90 disabled:opacity-50 text-white text-sm font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg shadow-[var(--yp-color-posh)]/20 active:scale-95 whitespace-nowrap flex items-center gap-1.5"
            >
              {isApplying ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  تأكيد
                  <ArrowLeft className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
