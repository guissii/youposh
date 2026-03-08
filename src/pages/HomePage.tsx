import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight, Star,
  Flame, TrendingUp, Percent, Sparkles,
  Smartphone, Home, Sparkles as SparklesIcon, Shirt, Car, Gamepad2, Gift, Baby,
  Truck, Shield, Package, CreditCard
} from 'lucide-react';
import { fetchCategories, fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { loadHeroSettings } from '@/data/heroSettings';
import { Play, Pause, Volume2, VolumeX } from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Smartphone, Home, Sparkles: SparklesIcon, Shirt, Car, Gamepad2, Gift, Baby
};

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isAr = i18n.language === 'ar';
  const heroSettings = loadHeroSettings();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(heroSettings.videoAutoplay);
  const [isMuted, setIsMuted] = useState(heroSettings.videoMuted);

  const categoriesRef = useScrollReveal();
  const flashRef = useScrollReveal();
  const bestsellersRef = useScrollReveal();
  const popularRef = useScrollReveal();
  const newArrivalsRef = useScrollReveal();
  const promoRef = useScrollReveal();
  const trustRef = useScrollReveal();

  const [categories, setCategories] = useState<any[]>([]);
  const [popularProducts, setPopularProducts] = useState<any[]>([]);
  const [newProducts, setNewProducts] = useState<any[]>([]);
  const [promoProducts, setPromoProducts] = useState<any[]>([]);
  const [bestsellers, setBestsellers] = useState<any[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        // On effectue toutes les requêtes en parallèle vers l'API Backend
        const [cats, pop, news, promos, bests] = await Promise.all([
          fetchCategories(),
          fetchProducts('badge=popular'), // Optionnel: ou filtrer coté front si la route ne gère pas exactement le badge
          fetchProducts('sort=newest'),
          fetchProducts('badge=promo'),
          fetchProducts('sort=bestsellers'),
        ]);

        setCategories(cats);
        // fallback filtering si l'API retourne tout par défaut
        setPopularProducts(pop.filter((p: any) => p.isPopular).slice(0, 8));
        setNewProducts(news.filter((p: any) => p.isNew).slice(0, 4));
        setPromoProducts(promos.filter((p: any) => p.originalPrice > p.price).slice(0, 4));
        setBestsellers(bests.filter((p: any) => p.isBestSeller).slice(0, 4));
      } catch (error) {
        console.error("Erreur chargement page accueil:", error);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen bg-[var(--yp-gray-100)]">
      <Header />

      <main className="pb-20">
        {/* ══════════════════════════════════════════════
            HERO — Full-bleed immersive video background
            ══════════════════════════════════════════════ */}
        <section className="relative min-h-[85vh] sm:min-h-[70vh] lg:min-h-[80vh] flex items-center overflow-hidden bg-black">
          {/* Video / Poster background */}
          {heroSettings.videoEnabled ? (
            <video
              ref={videoRef}
              src={heroSettings.videoUrl}
              poster={heroSettings.videoPosterUrl}
              autoPlay={heroSettings.videoAutoplay}
              muted={isMuted}
              loop={heroSettings.videoLoop}
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <img
              src={heroSettings.videoPosterUrl}
              alt="YouPosh Hero"
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}

          {/* Dark overlay — opacity controlled by admin */}
          <div
            className="absolute inset-0 bg-black"
            style={{ opacity: heroSettings.overlayOpacity / 100 }}
          />

          {/* Gradient overlays for extra depth */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20" />

          {/* Video controls — top right */}
          {heroSettings.videoEnabled && (
            <div className="absolute top-4 right-4 flex gap-2 z-20">
              <button
                onClick={() => {
                  if (videoRef.current) {
                    if (isPlaying) videoRef.current.pause();
                    else videoRef.current.play();
                    setIsPlaying(!isPlaying);
                  }
                }}
                className="w-8 h-8 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:bg-white/25 transition-colors"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => {
                  if (videoRef.current) videoRef.current.muted = !isMuted;
                  setIsMuted(!isMuted);
                }}
                className="w-8 h-8 bg-white/15 backdrop-blur-md rounded-full flex items-center justify-center text-white/80 hover:bg-white/25 transition-colors"
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}

          {/* Content — superimposed over video */}
          <div className="relative z-10 w-full max-w-7xl mx-auto px-5 sm:px-8 py-16 sm:py-20 text-center">
            {/* Slogan */}
            <p className="text-[10px] sm:text-xs uppercase tracking-[0.25em] text-white/70 font-medium mb-3">
              {heroSettings.slogan}
            </p>

            {/* Badge */}
            <span className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium border border-white/20 mb-5">
              <Shield className="w-3.5 h-3.5" />
              {heroSettings.badgeText}
            </span>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-bold text-white leading-tight font-heading max-w-3xl mx-auto mb-4 drop-shadow-lg">
              {heroSettings.title}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg text-white/80 max-w-xl mx-auto leading-relaxed mb-8 drop-shadow">
              {heroSettings.subtitle}
            </p>

            {/* CTA buttons */}
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => navigate(heroSettings.primaryCtaLink)}
                className="bg-white hover:bg-white/90 text-[var(--yp-dark)] px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-all shadow-xl hover:shadow-2xl active:scale-[0.97]"
              >
                {heroSettings.primaryCtaText}
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => navigate(heroSettings.secondaryCtaLink)}
                className="bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white px-7 py-3.5 rounded-xl font-semibold flex items-center gap-2 text-sm transition-all border border-white/25"
              >
                <Percent className="w-4 h-4" />
                {heroSettings.secondaryCtaText}
              </button>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            TRUST STRIP — 4 pillars under hero
            ══════════════════════════════════════════════ */}
        <section className="relative z-10 -mt-2 sm:-mt-4">
          <div className="max-w-7xl mx-auto px-4">
            <div className="bg-white rounded-2xl shadow-card border border-[var(--yp-gray-300)] p-3 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
              {[
                { icon: Truck, title: t('deliveryAllMorocco') || 'Livraison Maroc', desc: '24-48h', color: 'var(--yp-blue)' },
                { icon: CreditCard, title: t('cashOnDelivery') || 'Paiement livraison', desc: 'Payez à la réception', color: 'var(--yp-dark)' },
                { icon: Package, title: 'Produits certifiés', desc: 'Qualité garantie', color: 'var(--yp-blue)' },
                { icon: Shield, title: 'Support client', desc: 'Réactif & disponible', color: 'var(--yp-dark)' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2.5 sm:gap-3 group">
                  <div
                    className="w-9 h-9 sm:w-11 sm:h-11 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 bg-[var(--yp-gray-200)] group-hover:scale-105 transition-transform"
                  >
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: item.color }} />
                  </div>
                  <div>
                    <p className="font-semibold text-xs sm:text-sm text-[var(--yp-dark)] leading-tight">{item.title}</p>
                    <p className="text-[10px] sm:text-xs text-[var(--yp-gray-600)] hidden sm:block">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            QUICK HIGHLIGHTS — 3 blocks: Promos / Nouveautés / Best-sellers
            ══════════════════════════════════════════════ */}
        <section className="py-5 sm:py-10">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-3 gap-2.5 sm:gap-4">
              {[
                {
                  title: t('promotions') || 'Promos',
                  desc: "Jusqu'à -40%",
                  icon: Percent,
                  color: 'var(--yp-red)',
                  bg: 'bg-[var(--yp-red-50)]',
                  border: 'border-[var(--yp-red)]/10',
                  link: '/shop?filter=promo'
                },
                {
                  title: t('newArrivals') || 'Nouveautés',
                  desc: 'Fraîchement ajoutés',
                  icon: Sparkles,
                  color: 'var(--yp-blue)',
                  bg: 'bg-[var(--yp-blue-50)]',
                  border: 'border-[var(--yp-blue)]/10',
                  link: '/shop?filter=new'
                },
                {
                  title: t('bestsellers') || 'Best-sellers',
                  desc: 'Les plus appréciés',
                  icon: TrendingUp,
                  color: 'var(--yp-dark)',
                  bg: 'bg-[var(--yp-gray-200)]',
                  border: 'border-[var(--yp-gray-300)]',
                  link: '/shop?sort=popular'
                },
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => navigate(item.link)}
                  className={`${item.bg} border ${item.border} rounded-xl sm:rounded-2xl p-3 sm:p-6 text-left group hover:shadow-md transition-all`}
                >
                  <item.icon className="w-5 h-5 sm:w-6 sm:h-6 mb-2 sm:mb-3" style={{ color: item.color }} />
                  <h3 className="font-bold text-[var(--yp-dark)] text-xs sm:text-base font-heading leading-tight">{item.title}</h3>
                  <p className="text-[10px] sm:text-sm text-[var(--yp-gray-600)] mt-0.5 sm:mt-1 hidden sm:block">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            CATEGORIES — Card grid
            ══════════════════════════════════════════════ */}
        <section className="py-6" ref={categoriesRef}>
          <div className="max-w-7xl mx-auto px-4 reveal">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-[var(--yp-blue-50)] rounded-xl flex items-center justify-center">
                <SparklesIcon className="w-5 h-5 text-[var(--yp-blue)]" />
              </div>
              <h2 className="section-title">{t('browseCategories')}</h2>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 sm:gap-5">
              {categories.map((cat, i) => {
                const Icon = iconMap[cat.icon] || Smartphone;
                return (
                  <button
                    key={cat.id}
                    onClick={() => navigate(`/shop?category=${cat.slug}`)}
                    className={`flex flex-col items-center gap-2.5 group reveal reveal-delay-${Math.min(i + 1, 4)}`}
                  >
                    <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white rounded-2xl flex items-center justify-center group-hover:bg-[var(--yp-blue-50)] group-hover:shadow-md transition-all duration-300 group-hover:scale-105 border border-[var(--yp-gray-300)]">
                      <Icon className="w-6 h-6 sm:w-7 sm:h-7 text-[var(--yp-gray-600)] group-hover:text-[var(--yp-blue)] transition-colors" />
                    </div>
                    <span className="text-[10px] sm:text-xs text-[var(--yp-gray-700)] text-center line-clamp-2 font-medium">
                      {isAr ? cat.nameAr : cat.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            FLASH SALES — Contained red card
            ══════════════════════════════════════════════ */}
        <section className="py-6" ref={flashRef}>
          <div className="max-w-7xl mx-auto px-4 reveal">
            <div className="bg-gradient-to-br from-[var(--yp-red)] via-[var(--yp-red-dark)] to-[#991B1B] rounded-2xl p-5 sm:p-7 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center">
                      <Flame className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold font-heading">{t('flashSales')}</h2>
                      <p className="text-sm text-white/70">{t('limitedTime')}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => navigate('/shop?filter=promo')}
                    className="text-sm font-semibold flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-4 py-2 rounded-xl transition-colors backdrop-blur-sm"
                  >
                    {t('seeAll')}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                  {promoProducts.map(product => (
                    <ProductCard key={product.id} product={product} variant="compact" />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            BESTSELLERS
            ══════════════════════════════════════════════ */}
        <section className="py-6" ref={bestsellersRef}>
          <div className="max-w-7xl mx-auto px-4 reveal">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--yp-blue-50)] rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-[var(--yp-blue)]" />
                </div>
                <div>
                  <h2 className="section-title">{t('bestsellers')}</h2>
                  <p className="section-subtitle">{t('bestsellerDesc') || 'Les plus vendus ce mois'}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/shop?sort=popular')}
                className="text-sm text-[var(--yp-blue)] font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all"
              >
                {t('seeAll')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {bestsellers.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            POPULAR PRODUCTS
            ══════════════════════════════════════════════ */}
        <section className="py-6" ref={popularRef}>
          <div className="max-w-7xl mx-auto px-4 reveal">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[var(--yp-red-50)] rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-[var(--yp-red)]" />
                </div>
                <div>
                  <h2 className="section-title">{t('popularProducts')}</h2>
                  <p className="section-subtitle">{t('popularDesc') || 'Sélection populaire'}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/shop')}
                className="text-sm text-[var(--yp-blue)] font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all"
              >
                {t('seeAll')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {popularProducts.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            PROMO BANNER — Subtle, not aggressive
            ══════════════════════════════════════════════ */}
        <section className="py-6" ref={promoRef}>
          <div className="max-w-7xl mx-auto px-4 reveal">
            <div className="bg-[var(--yp-dark)] rounded-2xl p-8 sm:p-12 text-white text-center relative overflow-hidden">
              <div className="absolute top-4 left-4 w-20 h-20 border border-white/5 rounded-full" />
              <div className="absolute bottom-4 right-4 w-28 h-28 border border-white/5 rounded-full" />

              <div className="relative z-10">
                <div className="inline-flex items-center justify-center w-14 h-14 bg-white/10 rounded-2xl mb-5">
                  <Percent className="w-7 h-7" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold mb-3 font-heading">{t('promoBannerTitle')}</h2>
                <p className="text-white/60 mb-8 max-w-md mx-auto">{t('promoBannerDesc')}</p>
                <button
                  onClick={() => navigate('/shop?filter=promo')}
                  className="bg-white text-[var(--yp-dark)] px-7 py-3.5 rounded-xl font-bold hover:bg-white/90 transition-all shadow-lg active:scale-[0.98]"
                >
                  {t('discoverPromos')}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            NEW ARRIVALS
            ══════════════════════════════════════════════ */}
        <section className="py-6" ref={newArrivalsRef}>
          <div className="max-w-7xl mx-auto px-4 reveal">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h2 className="section-title">{t('newArrivals')}</h2>
                  <p className="section-subtitle">{t('newArrivalsDesc') || 'Derniers produits ajoutés'}</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/shop?filter=new')}
                className="text-sm text-[var(--yp-blue)] font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all"
              >
                {t('seeAll')}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {newProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            TRUST BADGES — Bottom advantage cards
            ══════════════════════════════════════════════ */}
        <section className="py-5 sm:py-8" ref={trustRef}>
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
              {[
                { icon: Truck, title: 'Livraison rapide', desc: '24-72h partout au Maroc', color: 'var(--yp-blue)' },
                { icon: CreditCard, title: 'Paiement à la livraison', desc: 'Payez à la réception', color: 'var(--yp-dark)' },
                { icon: Percent, title: 'Meilleurs prix', desc: 'Qualité au meilleur prix', color: 'var(--yp-red)' },
                { icon: Shield, title: 'Achat sécurisé', desc: 'Échange facile garanti', color: 'var(--yp-blue)' },
              ].map((item, i) => (
                <div key={i} className={`reveal reveal-delay-${i + 1} bg-white rounded-xl sm:rounded-2xl p-3 sm:p-5 text-center border border-[var(--yp-gray-300)] hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 group`}>
                  <div className="w-9 h-9 sm:w-12 sm:h-12 bg-[var(--yp-gray-200)] rounded-xl sm:rounded-2xl flex items-center justify-center mx-auto mb-2 sm:mb-3 group-hover:scale-110 transition-transform">
                    <item.icon className="w-4 h-4 sm:w-6 sm:h-6" style={{ color: item.color }} />
                  </div>
                  <h3 className="font-semibold text-[var(--yp-dark)] text-xs sm:text-sm mb-0.5 sm:mb-1">{item.title}</h3>
                  <p className="text-[10px] sm:text-xs text-[var(--yp-gray-600)] leading-relaxed hidden sm:block">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppButton variant="floating" />
    </div>
  );
}
