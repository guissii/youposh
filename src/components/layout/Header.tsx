import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag, Search, X, ChevronDown, Heart,
  Phone, Globe, Menu,
  Home, Percent, TrendingUp, Sparkles, Grid3X3,
  Truck, MessageCircle, CircleHelp,
  Smartphone, Home as HomeIcon, Sparkles as SparklesIcon, Shirt, Car, Gamepad2, Gift, Baby
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useStoreSettings } from '@/data/storeSettings';
import { fetchCategories } from '@/lib/api';
import { toWhatsAppPhone } from '@/lib/utils';
import SearchModal from './SearchModal';

const categoryIconMap: Record<string, React.ElementType> = {
  Smartphone, Home: HomeIcon, Sparkles: SparklesIcon, Shirt, Car, Gamepad2, Gift, Baby
};

export default function Header() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, setIsCartOpen } = useStore();
  const { language, toggleLanguage, isRTL } = useLanguage();
  const storeSettings = useStoreSettings();
  const { phone: rawPhone } = storeSettings;
  const phone = rawPhone || '+212 690-939090';
  const waPhone = toWhatsAppPhone(phone);

  const [isScrolled, setIsScrolled] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<'up' | 'down'>('up');
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    fetchCategories().then(setCategories).catch(console.error);
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      setIsScrolled(currentScrollY > 10);
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setScrollDirection('down');
      } else if (currentScrollY < lastScrollY) {
        setScrollDirection('up');
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Top Bar — Collapsible on scroll down */}
      <div
        className={`bg-[var(--yp-blue)] text-white text-[12px] py-1.5 px-4 sm:py-2.5 sm:px-6 lg:px-8 transition-transform duration-300 ${
          scrollDirection === 'down' ? '-translate-y-full absolute w-full' : 'translate-y-0 relative'
        } z-[45] pt-[max(0.5rem,env(safe-area-inset-top))]`}
        dir="ltr"
      >
        <div className="max-w-7xl mx-auto flex justify-center items-center gap-2">
          <span className="text-center font-medium">Livraison partout au Maroc 35 Dhs | Gratuite dès 599 Dhs ✓</span>
        </div>
      </div>

      {/* Main Header */}
      <header
        className={`sticky top-0 z-40 transition-all duration-300 ${
          isScrolled || scrollDirection === 'down'
            ? 'bg-white/95 backdrop-blur-md shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-b border-gray-200'
            : 'bg-white'
        } ${scrollDirection === 'down' ? '-mt-[32px] sm:-mt-[40px]' : ''}`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-[56px] sm:h-[70px]">
            {/* Left — Logo and Menu */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden p-1.5 hover:bg-[var(--yp-blue-50)] rounded-xl transition-colors"
                aria-label="Menu"
              >
                <Menu className="w-6 h-6 text-[var(--yp-dark)]" />
              </button>

              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1.5 sm:gap-2 group"
                dir="ltr"
              >
                <img
                  src="/images/categories/logo final.png"
                  alt={storeSettings.storeName}
                  className="h-7 sm:h-9 w-auto object-contain group-hover:scale-105 transition-transform"
                />
                <div className="flex items-baseline hidden xs:flex">
                  <span
                    className="font-bold text-lg sm:text-2xl tracking-tight font-heading"
                  >
                    <span className="text-[var(--yp-blue)]">YOU</span>
                    <span className="text-[var(--yp-red)]">POSH</span>
                  </span>
                </div>
              </button>
            </div>

            {/* Center — Desktop Search & Nav (Hidden on mobile) */}
            <div className="hidden lg:flex flex-1 items-center justify-center px-8">
              {/* Mega menu placeholder / Categories */}
            </div>

            {/* Right — Actions */}
            <div className="flex items-center gap-2 sm:gap-4 justify-end">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="flex items-center gap-1.5 p-1.5 sm:p-2 hover:bg-[var(--yp-gray-100)] rounded-xl transition-colors font-semibold text-xs sm:text-sm text-[var(--yp-gray-700)]"
              >
                <Globe className="w-4 h-4 text-[var(--yp-blue)]" />
                {language === 'fr' ? 'AR' : 'FR'}
              </button>

              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-1.5 sm:p-2.5 hover:bg-[var(--yp-blue-50)] rounded-xl transition-colors"
                aria-label={t('search')}
              >
                <Search className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--yp-blue)]" />
              </button>

              <button
                onClick={() => navigate('/wishlist')}
                className="hidden sm:flex p-2.5 hover:bg-[var(--yp-red-50)] rounded-xl transition-colors"
              >
                <Heart className="w-5 h-5 text-[var(--yp-dark)]" />
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="p-1.5 sm:p-2.5 hover:bg-[var(--yp-blue-50)] rounded-xl relative transition-colors"
              >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--yp-dark)]" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 sm:top-1 sm:right-1 w-4 h-4 sm:w-5 sm:h-5 bg-[var(--yp-red)] text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm animate-scale-in">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Desktop Navigation — Elegant underline hover */}
          <nav className="hidden lg:flex items-center justify-center gap-10 pb-3 border-t border-[var(--yp-gray-300)] pt-3">
            {[
              { path: '/', label: t('home') },
            ].map(({ path, label }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className={`relative text-sm font-medium transition-colors py-1 ${location.pathname === path
                  ? 'text-[var(--yp-blue)]'
                  : 'text-[var(--yp-gray-700)] hover:text-[var(--yp-blue)]'
                  }`}
              >
                {label}
                {location.pathname === path && (
                  <span className="absolute -bottom-3 left-0 right-0 h-0.5 bg-[var(--yp-blue)] rounded-full" />
                )}
              </button>
            ))}

            <div className="relative">
              <button
                onClick={() => setShowCategories(!showCategories)}
                className="flex items-center gap-1.5 text-sm font-medium text-[var(--yp-gray-700)] hover:text-[var(--yp-blue)] transition-colors py-1"
              >
                {t('categories')}
                <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${showCategories ? 'rotate-180' : ''}`} />
              </button>

              {showCategories && (
                <div className="absolute top-full left-0 mt-4 w-64 bg-white rounded-2xl shadow-xl border border-[var(--yp-gray-300)] p-2 z-50 animate-fade-in">
                  {categories.map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        navigate(`/category/${cat.slug}`);
                        setShowCategories(false);
                      }}
                      className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-[var(--yp-blue-50)] text-sm text-[var(--yp-gray-700)] hover:text-[var(--yp-blue)] transition-colors"
                    >
                      {i18n.language === 'ar' ? cat.nameAr : cat.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={() => navigate('/promotions')}
              className="text-sm font-medium text-[var(--yp-red)] hover:text-[var(--yp-red-dark)] transition-colors py-1 flex items-center gap-1"
            >
              <span className="relative">
                {t('promotions')}
                <span className="absolute -top-1 -right-2 w-1.5 h-1.5 bg-[var(--yp-red)] rounded-full" />
              </span>
            </button>

            <button
              onClick={() => navigate('/bestsellers')}
              className="text-sm font-medium text-[var(--yp-gray-700)] hover:text-[var(--yp-blue)] transition-colors py-1"
            >
              {t('bestsellers')}
            </button>

            <button
              onClick={() => navigate('/new')}
              className="text-sm font-medium text-[var(--yp-gray-700)] hover:text-[var(--yp-blue)] transition-colors py-1"
            >
              {t('newArrivals')}
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu — Premium slide-in drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[55] lg:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => { setIsMobileMenuOpen(false); setMobileCatsOpen(false); }}
          />

          {/* Drawer Panel */}
          <div
            className={`absolute top-0 ${isRTL ? 'right-0' : 'left-0'} w-80 max-w-[85vw] h-full bg-white shadow-2xl flex flex-col`}
            style={{ animation: 'sidebar-slide-in 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards' }}
          >

            {/* ── HEADER ── */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--yp-gray-300)]">
              <button onClick={() => navigate('/')} className="flex items-center gap-2" dir="ltr">
                <img
                  src="/images/categories/logo final.png"
                  alt={storeSettings.storeName}
                  className="h-10 w-auto object-contain"
                />
              </button>
              <button
                onClick={() => { setIsMobileMenuOpen(false); setMobileCatsOpen(false); }}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--yp-gray-200)] transition-colors"
                aria-label="Fermer"
              >
                <X className="w-4 h-4 text-[var(--yp-gray-700)]" />
              </button>
            </div>

            {/* ── SCROLLABLE CONTENT ── */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* ZONE 1 — Navigation */}
              <nav className="px-2 pt-3 pb-1">
                {[
                  { path: '/', label: t('home') || 'Accueil', icon: Home, active: location.pathname === '/' },
                  { path: '/shop?filter=promo', label: t('promotions') || 'Promotions', icon: Percent, highlight: true, badge: 'HOT' },
                  { path: '/shop?sort=popular', label: t('bestsellers') || 'Meilleures ventes', icon: TrendingUp },
                  { path: '/shop?filter=new', label: t('newArrivals') || 'Nouveautés', icon: Sparkles },
                  { path: '/wishlist', label: t('wishlist') || 'Favoris', icon: Heart },
                ].map((item) => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); setMobileCatsOpen(false); }}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${item.active
                      ? 'bg-[var(--yp-blue-50)] text-[var(--yp-blue)]'
                      : item.highlight
                        ? 'text-[var(--yp-red)] hover:bg-[var(--yp-red-50)]'
                        : 'text-[var(--yp-dark)] hover:bg-[var(--yp-gray-200)]'
                      }`}
                  >
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" style={{ color: item.active ? 'var(--yp-blue)' : item.highlight ? 'var(--yp-red)' : 'var(--yp-gray-600)' }} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && (
                      <span className="text-[10px] font-bold bg-[var(--yp-red)] text-white px-1.5 py-0.5 rounded">
                        {item.badge}
                      </span>
                    )}
                  </button>
                ))}

                {/* Categories — Collapsible */}
                <button
                  onClick={() => setMobileCatsOpen(!mobileCatsOpen)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--yp-dark)] hover:bg-[var(--yp-gray-200)] transition-colors"
                >
                  <Grid3X3 className="w-[18px] h-[18px] text-[var(--yp-gray-600)] flex-shrink-0" />
                  <span className="flex-1 text-left">{t('categories') || 'Catégories'}</span>
                  <ChevronDown className={`w-4 h-4 text-[var(--yp-gray-400)] transition-transform duration-200 ${mobileCatsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Sub-categories */}
                <div className={`overflow-hidden transition-all duration-250 ease-out ${mobileCatsOpen ? 'max-h-[400px] opacity-100' : 'max-h-0 opacity-0'}`}>
                  <div className="ml-10 mr-2 py-1 space-y-0.5">
                    {categories.map((cat) => {
                      const CatIcon = categoryIconMap[cat.icon] || Smartphone;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => { navigate(`/shop?category=${cat.slug}`); setIsMobileMenuOpen(false); setMobileCatsOpen(false); }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-[var(--yp-gray-700)] hover:bg-[var(--yp-blue-50)] hover:text-[var(--yp-blue)] transition-colors"
                        >
                          <CatIcon className="w-4 h-4 text-[var(--yp-gray-500)] flex-shrink-0" />
                          <span className="flex-1 text-left">{i18n.language === 'ar' ? cat.nameAr : cat.name}</span>
                        </button>
                      );
                    })}
                    <button
                      onClick={() => { navigate('/shop'); setIsMobileMenuOpen(false); setMobileCatsOpen(false); }}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm font-semibold text-[var(--yp-blue)] hover:bg-[var(--yp-blue-50)] transition-colors"
                    >
                      {t('seeAll') || 'Voir tout'} →
                    </button>
                  </div>
                </div>
              </nav>

              {/* Separator */}
              <div className="mx-5 my-2"><div className="h-px bg-[var(--yp-gray-300)]" /></div>

              {/* ZONE 2 — Services */}
              <div className="px-2 py-1">
                <p className="px-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-[var(--yp-gray-500)]">Services</p>
                {[
                  { path: '/faq', label: t('faq') || 'FAQ', icon: CircleHelp, action: 'navigate' as const },
                  { path: '/shipping', label: t('deliveryInfo') || 'Livraison', icon: Truck, action: 'navigate' as const },
                ].map(item => (
                  <button
                    key={item.path}
                    onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-[var(--yp-gray-700)] hover:bg-[var(--yp-gray-200)] font-medium transition-colors"
                  >
                    <item.icon className="w-[18px] h-[18px] text-[var(--yp-gray-500)] flex-shrink-0" />
                    <span className="flex-1 text-left">{item.label}</span>
                  </button>
                ))}
                {/* WhatsApp — Simple line */}
                <button
                  onClick={() => {
                    window.open(`https://wa.me/${waPhone}?text=` + encodeURIComponent('Bonjour, je suis intéressé par vos produits.'), '_blank');
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-[var(--yp-whatsapp-dark)] hover:bg-emerald-50 transition-colors"
                >
                  <MessageCircle className="w-[18px] h-[18px] text-[var(--yp-whatsapp)] flex-shrink-0" />
                  <span className="flex-1 text-left">Contact WhatsApp</span>
                  <span className="text-[10px] text-[var(--yp-whatsapp-dark)] font-medium">En ligne</span>
                </button>
              </div>
            </div>

            {/* ── FOOTER — Compact ── */}
            <div className="border-t border-[var(--yp-gray-300)] px-4 py-3 space-y-1.5 bg-[var(--yp-gray-100)]">
              <button
                onClick={toggleLanguage}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white text-sm text-[var(--yp-gray-700)] font-medium transition-colors"
              >
                <Globe className="w-4 h-4 text-[var(--yp-gray-500)]" />
                <span>{language === 'fr' ? 'العربية' : 'Français'}</span>
              </button>
              <a
                href={`tel:${phone.replace(/[^\d+]/g, '')}`}
                className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-white text-sm text-[var(--yp-gray-600)] transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-xs">{phone}</span>
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Search Modal */}
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
    </>
  );
}
