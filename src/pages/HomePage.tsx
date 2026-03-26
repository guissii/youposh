import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import {
  ArrowRight,
  Flame, TrendingUp, Percent, Sparkles,
} from 'lucide-react';
import { fetchProducts } from '@/lib/api';
import ProductCard from '@/components/ui/ProductCard';
import WhatsAppButton from '@/components/ui/WhatsAppButton';
import PromoCodeSection from '@/components/ui/PromoCodeSection';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/layout/CartDrawer';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { useHeroSettings } from '@/data/heroSettings';
import { useStoreSettings } from '@/data/storeSettings';



export default function HomePage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const heroSettings = useHeroSettings();
  const storeSettings = useStoreSettings();
  const [isHeroVideoReady, setIsHeroVideoReady] = useState(false);

  const flashRef = useScrollReveal();
  const bestsellersRef = useScrollReveal();
  const exclusivesRef = useScrollReveal();
  const discoverRef = useScrollReveal();

  // Use React Query for data fetching
  const { data: featuredRaw = [], isFetching: featuredLoading, isError: featuredError } = useQuery({
    queryKey: ['products', 'featured'],
    queryFn: () => fetchProducts('badge=featured&limit=8'),
  });

  const { data: popularRaw = [], isFetching: popularLoading, isError: popularError } = useQuery({
    queryKey: ['products', 'popular'],
    queryFn: () => fetchProducts('sort=popular&limit=8'),
  });

  const { data: latestRaw = [], isFetching: newLoading, isError: newError } = useQuery({
    queryKey: ['products', 'newest'],
    queryFn: () => fetchProducts('sort=newest&limit=8'),
  });

  const isAnyLoading = featuredLoading || popularLoading || newLoading;

  // Priorité 1: Produits sélectionnés manuellement "Offres du jour" (isFeatured === true)
  let promoProducts = featuredRaw.filter((p: any) => p.isVisible !== false);

  // Workflow Fallback: Si l'admin a oublié ou n'a pas sélectionné assez de produits (< 4),
  // on remplit la section dynamiquement avec les produits populaires pour éviter une section vide.
  if (promoProducts.length < 4) {
    const fillerProducts = popularRaw
      .filter((p: any) => p.isVisible !== false && !promoProducts.some((fp: any) => fp.id === p.id))
      .slice(0, 4 - promoProducts.length);
    promoProducts = [...promoProducts, ...fillerProducts];
  }

  promoProducts = promoProducts.slice(0, 6); // Max 6 (4 en affichage bureau, scroll sur mobile)

  const bestsellers = popularRaw.filter((p: any) => p.isVisible !== false).slice(0, 4);
  const newArrivals = latestRaw.filter((p: any) => p.isVisible !== false).slice(0, 4);
  const isHeroVideoEnabled = heroSettings.videoEnabled !== false;

  useEffect(() => {
    setIsHeroVideoReady(false);
  }, [heroSettings.videoUrl, isHeroVideoEnabled]);

  const error = (popularError || newError || featuredError) ? "Impossible de charger les produits. Veuillez vérifier votre connexion." : null;

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--yp-gray-100)] flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center bg-white p-8 rounded-2xl shadow-sm max-w-md w-full">
            <h2 className="text-xl font-bold text-red-600 mb-2">Oups !</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 bg-blue-600 text-white px-6 py-2 rounded-xl font-medium"
            >
              Réessayer
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--yp-gray-100)]">
      <Header />

      <main className="pb-20">
        {/* ══════════════════════════════════════════════
            HERO — Compact Mobile-First
            ══════════════════════════════════════════════ */}
        <section className="relative h-[220px] sm:h-[400px] flex items-center justify-center overflow-hidden">

          {/* Hero Video Background */}
          <div
            className="absolute inset-0 w-full h-full overflow-hidden"
            style={{ background: 'linear-gradient(145deg, #04153A 0%, #0A2D73 45%, #1D4ED8 100%)' }}
          >
            <div
              className={`absolute inset-0 transition-opacity duration-700 ${isHeroVideoEnabled && isHeroVideoReady ? 'opacity-0' : 'opacity-100'}`}
              style={{ background: 'radial-gradient(circle at 20% 20%, #3B82F6 0%, transparent 40%), radial-gradient(circle at 80% 10%, #1E40AF 0%, transparent 35%), linear-gradient(145deg, #04153A 0%, #0A2D73 45%, #1D4ED8 100%)' }}
            />
            {isHeroVideoEnabled ? (
              <video
                autoPlay={heroSettings.videoAutoplay !== false}
                loop={heroSettings.videoLoop !== false}
                muted={heroSettings.videoMuted !== false}
                playsInline
                onCanPlay={() => setIsHeroVideoReady(true)}
                onLoadedData={() => setIsHeroVideoReady(true)}
                className={`w-full h-full object-cover transition-opacity duration-700 ${isHeroVideoReady ? 'opacity-80' : 'opacity-0'}`}
              >
                <source src={heroSettings.videoUrl || "/videos/hero video.mp4"} type="video/mp4" />
              </video>
            ) : heroSettings.videoPosterUrl ? (
              <img
                src={heroSettings.videoPosterUrl}
                alt="Hero Background"
                className="w-full h-full object-cover opacity-60"
              />
            ) : null}
            {Number(heroSettings.overlayOpacity ?? 0) > 0 && (
              <div
                className="absolute inset-0 bg-black"
                style={{ opacity: Math.max(0, Math.min(100, Number(heroSettings.overlayOpacity ?? 0))) / 100 }}
              />
            )}
          </div>

          {/* Content Container */}
          <div className="relative z-10 w-full max-w-5xl mx-auto px-4 sm:px-8 text-center flex flex-col items-center">
            
            {/* Badge: "PROMO" */}
            <div className="mb-2 sm:mb-4 animate-fade-in-up">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] sm:text-sm font-bold bg-[var(--yp-red)] text-white shadow-lg">
                PROMO
              </span>
            </div>

            {/* Main Title */}
            <h1 className="text-2xl sm:text-5xl font-black font-heading text-white leading-tight mb-2 sm:mb-4 drop-shadow-md">
              {t('heroTitle').replace('YOUPOSH ', '')}
            </h1>

            {/* Subtitle */}
            <p className="text-[12px] sm:text-xl text-white/90 font-medium max-w-xl mx-auto mb-4 sm:mb-8 drop-shadow-md">
              {t('heroSubtitle')}
            </p>

            {/* CTA Button */}
            <button
              onClick={() => navigate(heroSettings.primaryCtaLink)}
              className="bg-white text-[var(--yp-blue)] px-6 py-2 sm:px-8 sm:py-3 rounded-full font-bold text-sm sm:text-lg shadow-lg hover:bg-blue-50 transition-all"
            >
              Voir l'offre
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            CATÉGORIES RAPIDES (Horizontal Scroll)
            ══════════════════════════════════════════════ */}
        <section className="py-4 bg-white">
          <div className="max-w-7xl mx-auto px-0 sm:px-6 lg:px-8">
            <div className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory px-4 gap-4">
              {[
                { name: 'iPhone', icon: '📱', link: '/category/iphone' },
                { name: 'Samsung', icon: '📱', link: '/category/samsung' },
                { name: 'Xiaomi', icon: '📱', link: '/category/xiaomi' },
                { name: 'Écouteurs', icon: '🎧', link: '/category/audio' },
                { name: 'Batteries', icon: '🔋', link: '/category/power' },
                { name: 'Tablettes', icon: '💻', link: '/category/tablets' },
                { name: 'Accessoires', icon: '📷', link: '/category/accessories' },
                { name: 'Coques', icon: '🛡️', link: '/category/cases' },
              ].map((cat, i) => (
                <button
                  key={i}
                  onClick={() => navigate(cat.link)}
                  className="snap-start shrink-0 flex flex-col items-center gap-2 w-[72px]"
                >
                  <div className="w-14 h-14 bg-[var(--yp-blue-50)] rounded-full flex items-center justify-center text-2xl shadow-sm">
                    {cat.icon}
                  </div>
                  <span className="text-[11px] font-medium text-[var(--yp-dark)] text-center leading-tight">
                    {cat.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            BANDEAU DE CONFIANCE
            ══════════════════════════════════════════════ */}
        <section className="bg-[var(--yp-blue-50)] py-3 sm:py-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4">
              {[
                "Livraison rapide",
                "Paiement à la livraison",
                "Retour 7 jours",
                "Produits garantis"
              ].map((text, i) => (
                <div key={i} className="flex items-center gap-1.5 sm:gap-2 justify-center sm:justify-start">
                  <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[var(--yp-blue)] text-white flex items-center justify-center text-[10px] sm:text-xs">✓</div>
                  <span className="text-[10px] sm:text-xs font-semibold text-[var(--yp-dark)]">{text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════
            PROMO CODE ENTRY — 3D Moroccan Style
            ══════════════════════════════════════════════ */}
        {storeSettings.promoSectionEnabled !== false && <PromoCodeSection />}

        {/* ══════════════════════════════════════════════
            QUICK HIGHLIGHTS — 3 blocks: Promos / Nouveautés / Best-sellers
            ══════════════════════════════════════════════ */}
        <section className="py-4 sm:py-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
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
                  className={`${item.bg} border ${item.border} rounded-xl sm:rounded-2xl p-2.5 sm:p-6 text-left group hover:shadow-md transition-all`}
                >
                  <item.icon className="w-4 h-4 sm:w-6 sm:h-6 mb-1.5 sm:mb-3" style={{ color: item.color }} />
                  <h3 className="font-bold text-[var(--yp-dark)] text-[11px] sm:text-base font-heading leading-tight">{item.title}</h3>
                  <p className="text-[9px] sm:text-sm text-[var(--yp-gray-600)] mt-0.5 sm:mt-1 hidden sm:block">{item.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>


        {/* ══════════════════════════════════════════════
            FLASH SALES — Red Gradient 3D Premium Card
            ══════════════════════════════════════════════ */}
        <section className="py-4 sm:py-8" ref={flashRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
            <div className="rounded-3xl overflow-hidden bg-gradient-to-br from-[var(--yp-red)] to-[#991B1B] shadow-2xl shadow-[var(--yp-red)]/20 border border-white/10 relative">
              {/* Decorative background elements for 3D effect */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none"></div>

              <div className="p-4 sm:p-8 relative z-10">

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6">
                  <div className="flex items-center gap-3 sm:gap-4">
                    <div className="w-10 h-10 sm:w-14 sm:h-14 shrink-0 bg-white rounded-2xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform duration-300">
                      <Flame className="w-5 h-5 sm:w-7 sm:h-7 text-[var(--yp-red)] fill-[var(--yp-red)]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="inline-flex rounded-full h-1.5 w-1.5 bg-white animate-pulse" />
                        <span className="text-[10px] sm:text-xs font-bold tracking-widest text-white/90">
                          استافد دابا من أحسن العروض
                        </span>
                      </div>
                      <h2 className="text-xl sm:text-3xl font-extrabold font-heading text-white leading-tight tracking-tight drop-shadow-sm">
                        Nos meilleures offres du jour
                      </h2>
                    </div>
                  </div>

                  <button
                    onClick={() => navigate('/shop?filter=promo')}
                    className="group w-full sm:w-auto text-xs sm:text-sm font-bold flex justify-center items-center gap-2 bg-white text-[var(--yp-red)] hover:bg-white/90 px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl shadow-lg transition-all duration-300 active:scale-95"
                  >
                    Voir Toutes les Offres
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

                <div className="mt-2 sm:mt-4">
                  {isAnyLoading ? (
                    <div className="flex justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                    </div>
                  ) : promoProducts.length === 0 ? (
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 p-8 text-center">
                      <p className="text-base font-semibold text-white">Aucune offre flash pour le moment</p>
                      <p className="text-sm text-white/70 mt-1">Revenez bientôt, de nouvelles promos arrivent.</p>
                    </div>
                  ) : (
                    <>
                      {/* Mobile Horizontal Scroll */}
                      <div className="sm:hidden -mx-4 px-4 overflow-x-auto scrollbar-hide pb-4">
                        <div className="flex gap-3 snap-x snap-mandatory">
                          {promoProducts.map(product => (
                            <div key={product.id} className="snap-start shrink-0 w-[160px]">
                              <div className="bg-white rounded-2xl overflow-hidden shadow-lg h-full transform transition-transform hover:scale-[1.02]">
                                <ProductCard product={product} variant="compact" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Desktop Grid */}
                      <div className="hidden sm:grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                        {promoProducts.slice(0, 4).map(product => (
                          <div key={product.id} className="bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                            <ProductCard product={product} variant="compact" />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════
            BESTSELLERS
            ══════════════════════════════════════════════ */}
        <section className="py-4 sm:py-6" ref={bestsellersRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 reveal">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-[var(--yp-blue-50)] rounded-lg sm:rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 text-[var(--yp-blue)]" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-[var(--yp-dark)] tracking-tight font-heading">{t('bestsellers')}</h2>
                  <p className="text-[var(--yp-gray-600)] text-xs sm:text-base mt-0.5">{t('bestsellerDesc') || 'Les plus vendus ce mois'}</p>
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
            {isAnyLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--yp-blue)]"></div>
              </div>
            ) : bestsellers.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
                {bestsellers.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <p className="text-center text-[var(--yp-gray-500)] py-8">{t('noProducts') || "Aucun produit trouvé."}</p>
            )}
          </div>
        </section>

        {/* Section supprimée pour page épurée */}

        {/* Sections produits supprimées pour page épurée */}


        {/* ══════════════════════════════════════════════
            DEUX CATÉGORIES PRINCIPALES - Section Premium
            ══════════════════════════════════════════════ */}

        {/* Section 1: Exclusivités YOUPOSH */}
        <section className="py-5 sm:py-8 reveal" ref={exclusivesRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-2.5 sm:gap-3">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-[var(--yp-blue)] to-[var(--yp-blue-dark)] rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-base sm:text-2xl font-extrabold bg-gradient-to-r from-[var(--yp-dark)] to-[var(--yp-blue)] bg-clip-text text-transparent">
                    Exclusivités YOUPOSH
                  </h2>
                  <p className="text-sm text-[var(--yp-gray-600)]">Des pièces uniques disponibles nulle part ailleurs</p>
                </div>
              </div>
              <button
                onClick={() => navigate('/shop?filter=exclusive')}
                className="text-sm text-[var(--yp-blue)] font-semibold flex items-center gap-1.5 hover:gap-2.5 transition-all"
              >
                Voir tout
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {isAnyLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--yp-blue)]"></div>
              </div>
            ) : newArrivals.length > 0 ? (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4 lg:gap-6">
                {newArrivals.map(product => (
                  <ProductCard key={product.id} product={product} variant="compact" />
                ))}
              </div>
            ) : (
              <p className="text-center text-[var(--yp-gray-500)] py-8">{t('noProducts') || "Aucun produit trouvé."}</p>
            )}
          </div>
        </section>

        {/* Sections supprimées pour une page épurée */}

        {/* ══════════════════════════════════════════════
            DISCOVER MORE — Bottom CTA
            ══════════════════════════════════════════════ */}
        <section className="py-6 sm:py-12 reveal" ref={discoverRef}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="border-t border-[var(--yp-gray-300)]" />
            <div className="pt-6 sm:pt-10 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-5">
              <div>
                <p className="text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-[var(--yp-blue)] mb-1">
                  YOUPOSH Collection
                </p>
                <h2 className="text-base sm:text-xl font-bold text-[var(--yp-dark)] leading-snug">
                  Vous n'avez pas encore tout vu
                </h2>
                <p className="text-sm text-[var(--yp-gray-600)] mt-1.5 max-w-md">
                  Découvrez le reste de notre collection et trouvez ce qu'il vous faut.
                </p>
              </div>
              <button
                onClick={() => navigate('/shop')}
                className="bg-[#202442] hover:bg-[#1A1D38] text-white pl-5 sm:pl-6 pr-4 sm:pr-5 py-2.5 sm:py-3 rounded-xl font-semibold text-[13px] sm:text-sm transition-all active:scale-[0.97] inline-flex items-center gap-2 sm:gap-2.5 shadow-sm whitespace-nowrap"
              >
                Explorer la boutique
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Page épurée - Pas de sections supplémentaires */}
      </main>

      <Footer />
      <CartDrawer />
      <WhatsAppButton variant="floating" />
    </div>
  );
}
