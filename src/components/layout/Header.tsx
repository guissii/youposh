import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ShoppingBag, Search, Menu, X, ChevronDown, ChevronRight, Heart,
  MapPin, Phone, ArrowLeft, Globe,
  Home, Percent, TrendingUp, Sparkles, Grid3X3,
  Truck, MessageCircle, HelpCircle,
  Smartphone, Home as HomeIcon, Sparkles as SparklesIcon, Shirt, Car, Gamepad2, Gift, Baby
} from 'lucide-react';
import { useStore } from '@/contexts/StoreContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { categories } from '@/data/products';
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

  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [mobileCatsOpen, setMobileCatsOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isHome = location.pathname === '/';

  return (
    <>
      {/* Top Bar — Premium dark bar with blue accent */}
      <div className="bg-[var(--yp-dark)] text-white text-xs py-2.5 px-4 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 text-[var(--yp-blue-light)]" />
            <span className="hidden sm:inline text-gray-300">{t('deliveryAllMorocco')}</span>
            <span className="sm:hidden text-gray-300">{t('deliveryShort')}</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="tel:+212600000000" className="flex items-center gap-1.5 text-gray-300 hover:text-[var(--yp-blue-light)] transition-colors">
              <Phone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">+212 6XX XXX XXX</span>
            </a>
            <div className="w-px h-3 bg-white/20" />
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 text-gray-300 hover:text-[var(--yp-blue-light)] transition-colors"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="font-medium">{language === 'fr' ? 'العربية' : 'FR'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Header — Glass effect on scroll */}
      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${isScrolled
          ? 'glass shadow-lg border-b border-white/10'
          : 'bg-white'
          }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16 sm:h-[72px]">
            {/* Left — Menu / Back */}
            <div className="flex items-center gap-2 min-w-[80px]">
              {!isHome ? (
                <button
                  onClick={() => navigate(-1)}
                  className="p-2.5 hover:bg-[var(--yp-blue-50)] rounded-xl transition-colors"
                >
                  <ArrowLeft className="w-5 h-5 text-[var(--yp-dark)]" />
                </button>
              ) : (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="lg:hidden p-2.5 hover:bg-[var(--yp-blue-50)] rounded-xl transition-colors"
                >
                  <Menu className="w-5 h-5 text-[var(--yp-dark)]" />
                </button>
              )}
            </div>

            {/* Center — Logo + Brand */}
            <button
              onClick={() => navigate('/')}
              className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 group"
            >
              <img
                src="/images/categories/logo final.png"
                alt="YouPosh"
                className="h-10 sm:h-12 w-auto object-contain group-hover:scale-105 transition-transform"
              />
              <div className="flex items-baseline">
                <span className="font-bold text-xl sm:text-2xl text-[var(--yp-blue)] tracking-tight font-heading">YOU</span>
                <span className="font-bold text-xl sm:text-2xl text-[var(--yp-red)] tracking-tight font-heading">POSH</span>
              </div>
            </button>

            {/* Right — Actions */}
            <div className="flex items-center gap-1 sm:gap-2 min-w-[80px] justify-end">
              <button
                onClick={() => setIsSearchOpen(true)}
                className="p-2.5 hover:bg-[var(--yp-blue-50)] rounded-xl transition-colors"
                aria-label={t('search')}
              >
                <Search className="w-5 h-5 text-[var(--yp-dark)]" />
              </button>

              <button
                onClick={() => navigate('/wishlist')}
                className="hidden sm:flex p-2.5 hover:bg-[var(--yp-red-50)] rounded-xl transition-colors"
              >
                <Heart className="w-5 h-5 text-[var(--yp-dark)]" />
              </button>

              <button
                onClick={() => setIsCartOpen(true)}
                className="p-2.5 hover:bg-[var(--yp-blue-50)] rounded-xl relative transition-colors"
              >
                <ShoppingBag className="w-5 h-5 text-[var(--yp-dark)]" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-[var(--yp-red)] text-white text-[10px] rounded-full flex items-center justify-center font-bold shadow-sm animate-scale-in">
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

            {/* ═══ HEADER — Branded ═══ */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[var(--yp-gray-300)] bg-gradient-to-r from-white to-[var(--yp-gray-100)]">
              <div className="flex items-center gap-2">
                <img
                  src="/images/categories/logo final.png"
                  alt="YouPosh"
                  className="h-12 w-auto object-contain"
                />
              </div>
              <button
                onClick={() => { setIsMobileMenuOpen(false); setMobileCatsOpen(false); }}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-[var(--yp-gray-200)] hover:bg-[var(--yp-gray-300)] transition-colors"
                aria-label="Fermer le menu"
              >
                <X className="w-4.5 h-4.5 text-[var(--yp-gray-700)]" />
              </button>
            </div>

            {/* ═══ SCROLLABLE CONTENT ═══ */}
            <div className="flex-1 overflow-y-auto overscroll-contain">

              {/* ── Navigation Principale ── */}
              <div className="px-3 pt-4 pb-2">
                <nav className="space-y-0.5">
                  {[
                    { path: '/', label: t('home') || 'Accueil', icon: Home, active: location.pathname === '/' },
                    { path: '/shop?filter=promo', label: t('promotions') || 'Promotions', icon: Percent, highlight: true, badge: 'HOT' },
                    { path: '/shop?sort=popular', label: t('bestsellers') || 'Meilleures ventes', icon: TrendingUp },
                    { path: '/shop?filter=new', label: t('newArrivals') || 'Nouveautés', icon: Sparkles },
                    { path: '/wishlist', label: t('wishlist') || 'Favoris', icon: Heart, iconColor: 'var(--yp-red)' },
                  ].map((item, i) => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); setMobileCatsOpen(false); }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.98] ${item.active
                        ? 'bg-[var(--yp-blue-50)] text-[var(--yp-blue)]'
                        : item.highlight
                          ? 'text-[var(--yp-red)] hover:bg-[var(--yp-red-50)]'
                          : 'text-[var(--yp-dark)] hover:bg-[var(--yp-gray-200)]'
                        }`}
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${item.active
                        ? 'bg-[var(--yp-blue)]/10'
                        : item.highlight
                          ? 'bg-[var(--yp-red-50)]'
                          : 'bg-[var(--yp-gray-200)]'
                        }`}>
                        <item.icon className="w-[18px] h-[18px]" style={{ color: item.iconColor || (item.active ? 'var(--yp-blue)' : item.highlight ? 'var(--yp-red)' : 'var(--yp-gray-600)') }} />
                      </div>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <span className="text-[10px] font-bold bg-[var(--yp-red)] text-white px-2 py-0.5 rounded-md">
                          {item.badge}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-[var(--yp-gray-400)]" />
                    </button>
                  ))}
                </nav>
              </div>

              {/* ── Separator ── */}
              <div className="mx-5 my-1">
                <div className="h-px bg-[var(--yp-gray-300)]" />
              </div>

              {/* ── Catégories — Accordion ── */}
              <div className="px-3 py-2">
                <button
                  onClick={() => setMobileCatsOpen(!mobileCatsOpen)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-[var(--yp-gray-200)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-[var(--yp-blue-50)] flex items-center justify-center">
                      <Grid3X3 className="w-[18px] h-[18px] text-[var(--yp-blue)]" />
                    </div>
                    <span className="text-sm font-semibold text-[var(--yp-dark)]">{t('categories') || 'Catégories'}</span>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-[var(--yp-gray-500)] transition-transform duration-300 ${mobileCatsOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Categories list */}
                <div className={`overflow-hidden transition-all duration-300 ease-out ${mobileCatsOpen ? 'max-h-[500px] opacity-100 mt-1' : 'max-h-0 opacity-0'
                  }`}>
                  <div className="pl-4 pr-2 space-y-0.5 pb-1">
                    {categories.map((cat) => {
                      const CatIcon = categoryIconMap[cat.icon] || Smartphone;
                      return (
                        <button
                          key={cat.id}
                          onClick={() => { navigate(`/shop?category=${cat.slug}`); setIsMobileMenuOpen(false); setMobileCatsOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[var(--yp-gray-700)] hover:bg-[var(--yp-blue-50)] hover:text-[var(--yp-blue)] transition-all duration-200 active:scale-[0.98]"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[var(--yp-gray-200)] flex items-center justify-center flex-shrink-0">
                            <CatIcon className="w-4 h-4 text-[var(--yp-gray-600)]" />
                          </div>
                          <span className="flex-1 text-left font-medium">{i18n.language === 'ar' ? cat.nameAr : cat.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-[var(--yp-gray-400)]" />
                        </button>
                      );
                    })}
                    {/* View all */}
                    <button
                      onClick={() => { navigate('/shop'); setIsMobileMenuOpen(false); setMobileCatsOpen(false); }}
                      className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold text-[var(--yp-blue)] hover:bg-[var(--yp-blue-50)] transition-colors mt-1"
                    >
                      {t('seeAll') || 'Voir tout'}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Separator ── */}
              <div className="mx-5 my-1">
                <div className="h-px bg-[var(--yp-gray-300)]" />
              </div>

              {/* ── Services ── */}
              <div className="px-3 py-2">
                <p className="px-4 pb-2 text-[10px] font-semibold uppercase tracking-widest text-[var(--yp-gray-500)]">{t('services') || 'Services'}</p>
                <nav className="space-y-0.5">
                  {[
                    { path: '/faq', label: t('faq') || 'FAQ', icon: HelpCircle },
                    { path: '/shipping', label: t('deliveryInfo') || 'Livraison', icon: Truck },
                  ].map(item => (
                    <button
                      key={item.path}
                      onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); setMobileCatsOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[var(--yp-gray-700)] hover:bg-[var(--yp-gray-200)] font-medium transition-all duration-200 active:scale-[0.98]"
                    >
                      <item.icon className="w-[18px] h-[18px] text-[var(--yp-gray-500)]" />
                      <span className="flex-1 text-left">{item.label}</span>
                    </button>
                  ))}

                  {/* WhatsApp Contact — Highlighted */}
                  <button
                    onClick={() => {
                      window.open('https://wa.me/212600000000?text=' + encodeURIComponent('Bonjour, je suis intéressé par vos produits.'), '_blank');
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--yp-whatsapp-dark)] hover:bg-emerald-50 transition-all duration-200 active:scale-[0.98]"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[var(--yp-whatsapp)]/10 flex items-center justify-center">
                      <MessageCircle className="w-[18px] h-[18px] text-[var(--yp-whatsapp)]" />
                    </div>
                    <span className="flex-1 text-left">Contact WhatsApp</span>
                    <span className="text-[10px] font-semibold bg-[var(--yp-whatsapp)]/10 text-[var(--yp-whatsapp-dark)] px-2 py-0.5 rounded-md">En ligne</span>
                  </button>
                </nav>
              </div>
            </div>

            {/* ═══ FOOTER ═══ */}
            <div className="border-t border-[var(--yp-gray-300)] bg-[var(--yp-gray-100)] px-5 py-4 space-y-3">
              {/* Language toggle */}
              <button
                onClick={() => { toggleLanguage(); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white text-sm text-[var(--yp-gray-700)] font-medium transition-colors"
              >
                <Globe className="w-4 h-4 text-[var(--yp-gray-500)]" />
                <span>{language === 'fr' ? 'العربية' : 'Français'}</span>
              </button>

              {/* Info strip */}
              <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white border border-[var(--yp-gray-300)]">
                <Truck className="w-4 h-4 text-[var(--yp-blue)] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-[var(--yp-dark)] truncate">{t('deliveryAllMorocco') || 'Livraison partout au Maroc'}</p>
                  <p className="text-[10px] text-[var(--yp-gray-600)]">{t('cashOnDelivery') || 'Paiement à la livraison'}</p>
                </div>
              </div>

              {/* Phone */}
              <a
                href="tel:+212600000000"
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white text-sm text-[var(--yp-gray-600)] transition-colors"
              >
                <Phone className="w-4 h-4" />
                <span className="text-xs">+212 6XX XXX XXX</span>
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
