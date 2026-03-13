import { useTranslation } from 'react-i18next';

interface PremiumLoaderProps {
    message?: string;
    subMessage?: string;
    fullScreen?: boolean;
}

export default function PremiumLoader({ message, subMessage, fullScreen = true }: PremiumLoaderProps) {
    const { i18n } = useTranslation();
    const isAr = i18n.language === 'ar';

    const defaultMsg = message || (isAr ? 'جاري التحميل...' : 'Chargement en cours...');
    const defaultSub = subMessage || (isAr ? 'لحظة من فضلك، نجهز لك أفضل المنتجات ✨' : 'Veuillez patienter, nous préparons les meilleurs produits ✨');

    const content = (
        <div className="relative flex flex-col items-center justify-center p-8">
            {/* Animated Rings & Logo */}
            <div className="relative w-24 h-24 mb-8 flex items-center justify-center">
                {/* Outer pulsing ring */}
                <div className="absolute inset-0 rounded-full border-4 border-[var(--yp-blue)]/20 animate-ping" style={{ animationDuration: '2s' }}></div>

                {/* Spinning gradient ring */}
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-t-[var(--yp-blue)] border-l-[var(--yp-red)] animate-spin" style={{ animationDuration: '1.5s' }}></div>
                <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-[var(--yp-blue)] border-r-[var(--yp-red)] animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }}></div>

                {/* Inner static circle with brand logo */}
                <div className="absolute inset-5 bg-white rounded-full shadow-lg flex items-center justify-center z-10 overflow-hidden border border-gray-100 p-3">
                    <img 
                        src="/images/logo final.png" 
                        alt="Logo" 
                        className="w-full h-full object-contain animate-pulse" 
                    />
                </div>
            </div>

            {/* Animated Text */}
            <div className="flex flex-col items-center gap-3 text-center">
                <h3 className="font-bold text-xl text-[var(--yp-dark)] font-heading tracking-wide animate-pulse" dir={isAr ? 'rtl' : 'ltr'}>
                    {defaultMsg}
                </h3>
                <p className="text-sm text-[var(--yp-gray-500)] max-w-[260px] leading-relaxed" dir={isAr ? 'rtl' : 'ltr'}>
                    {defaultSub}
                </p>

                {/* Loading Dots */}
                <div className="flex gap-1.5 mt-4">
                    <div className="w-2 h-2 rounded-full bg-[var(--yp-blue)] animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--yp-red)] animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 rounded-full bg-[var(--yp-blue)] animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
            </div>
        </div>
    );

    if (fullScreen) {
        return (
            <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-b from-white to-[var(--yp-gray-100)]">
                {content}
            </div>
        );
    }

    return (
        <div className="w-full py-12 flex items-center justify-center">
            {content}
        </div>
    );
}
