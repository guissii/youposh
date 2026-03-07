import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingBag, Instagram, Facebook, MessageCircle,
  MapPin, Phone, Mail, Truck, RefreshCw, CreditCard, ArrowRight,
  ChevronDown
} from 'lucide-react';

export default function Footer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [openSection, setOpenSection] = useState<string | null>(null);

  const toggle = (section: string) =>
    setOpenSection(openSection === section ? null : section);

  const footerLinks = {
    shop: [
      { label: t('allProducts'), href: '/shop' },
      { label: t('promotions'), href: '/promotions' },
      { label: t('bestsellers'), href: '/bestsellers' },
      { label: t('newArrivals'), href: '/new' },
    ],
    help: [
      { label: t('faq'), href: '/faq' },
      { label: t('delivery'), href: '/delivery' },
      { label: t('returns'), href: '/returns' },
      { label: t('trackOrder'), href: '/track-order' },
    ],
    about: [
      { label: t('aboutUs'), href: '/about' },
      { label: t('contact'), href: '/contact' },
      { label: t('terms'), href: '/terms' },
      { label: t('privacy'), href: '/privacy' },
    ],
  };

  const linkSections = [
    { key: 'shop', title: t('shop'), links: footerLinks.shop },
    { key: 'help', title: t('help'), links: footerLinks.help },
    { key: 'about', title: t('about'), links: footerLinks.about },
  ];

  return (
    <footer className="bg-gradient-to-b from-[var(--yp-dark)] to-[#0B1120] text-white">

      {/* ── Reassurance — Compact 2×2 grid on mobile ── */}
      <div className="border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-5 sm:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
            {[
              { icon: Truck, title: t('deliveryAllMorocco') || 'Livraison Maroc', color: 'var(--yp-blue)' },
              { icon: MessageCircle, title: t('whatsappOrder') || 'WhatsApp', color: 'var(--yp-whatsapp)' },
              { icon: CreditCard, title: t('cashOnDelivery') || 'Paiement livraison', color: 'var(--yp-red)' },
              { icon: RefreshCw, title: t('easyExchange') || 'Échange facile', color: 'var(--yp-blue-light)' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 sm:gap-4">
                <div
                  className="w-9 h-9 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: `${item.color}20` }}
                >
                  <item.icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: item.color }} />
                </div>
                <p className="font-medium text-xs sm:text-sm text-white leading-tight">{item.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Newsletter — Ultra compact on mobile, hidden or minimal ── */}
      <div className="border-b border-white/10 hidden sm:block">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 rounded-2xl p-5">
            <div>
              <h3 className="font-heading font-bold text-base">{t('stayUpdated') || 'Restez informé'}</h3>
              <p className="text-xs text-gray-400 mt-0.5">{t('newsletterDesc') || 'Recevez nos offres exclusives'}</p>
            </div>
            <div className="flex w-full sm:w-auto gap-2">
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 sm:w-56 bg-white/10 border border-white/10 rounded-xl px-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[var(--yp-blue)] transition-colors"
              />
              <button className="bg-[var(--yp-blue)] hover:bg-[var(--yp-blue-dark)] text-white px-4 py-2 rounded-xl font-semibold text-sm transition-colors">
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Footer ── */}
      <div className="max-w-7xl mx-auto px-4 py-6 sm:py-12">

        {/* Top row: Brand + Contact — always visible */}
        <div className="flex flex-col sm:flex-row sm:gap-10 mb-6 sm:mb-10">
          {/* Brand + contact */}
          <div className="flex-1 mb-4 sm:mb-0">
            <button onClick={() => navigate('/')} className="flex items-center gap-2 mb-3 group">
              <img
                src="/images/categories/logo final.png"
                alt="YouPosh"
                className="h-10 w-auto object-contain group-hover:scale-105 transition-transform"
              />
            </button>
            <p className="text-gray-400 text-xs leading-relaxed mb-3 line-clamp-2 max-w-xs">
              {t('footerDescription')}
            </p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
              <a href="tel:+212600000000" className="flex items-center gap-1.5 hover:text-[var(--yp-blue-light)] transition-colors">
                <Phone className="w-3.5 h-3.5" /> +212 6XX XXX XXX
              </a>
              <a href="mailto:contact@youposh.ma" className="flex items-center gap-1.5 hover:text-[var(--yp-blue-light)] transition-colors">
                <Mail className="w-3.5 h-3.5" /> contact@youposh.ma
              </a>
              <a href="https://maps.app.goo.gl/x4Ksr4TRyLTyn3k78" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-[var(--yp-blue-light)] transition-colors">
                <MapPin className="w-3.5 h-3.5" /> Fès
              </a>
            </div>

            {/* Embedded Google Map */}
            <div className="mt-4 rounded-xl overflow-hidden w-full max-w-xs sm:max-w-sm border border-white/10">
              <iframe
                src="https://maps.google.com/maps?q=Fès,+Morocco&t=&z=13&ie=UTF8&iwloc=&output=embed"
                width="100%"
                height="120"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              ></iframe>
            </div>
          </div>

          {/* Desktop links — visible on sm+ only */}
          <div className="hidden sm:grid sm:grid-cols-3 gap-8 flex-1">
            {linkSections.map((section) => (
              <div key={section.key}>
                <h4 className="font-heading font-semibold mb-4 text-white text-sm">{section.title}</h4>
                <ul className="space-y-2">
                  {section.links.map(link => (
                    <li key={link.href}>
                      <button
                        onClick={() => navigate(link.href)}
                        className="text-xs text-gray-400 hover:text-[var(--yp-blue-light)] transition-colors"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile accordion links — sm:hidden */}
        <div className="sm:hidden space-y-0 border-t border-white/10 pt-3 mb-4">
          {linkSections.map((section) => (
            <div key={section.key} className="border-b border-white/5">
              <button
                onClick={() => toggle(section.key)}
                className="w-full flex items-center justify-between py-3 text-sm font-medium text-white"
              >
                {section.title}
                <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${openSection === section.key ? 'rotate-180' : ''
                  }`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-out ${openSection === section.key ? 'max-h-[200px] opacity-100 pb-2' : 'max-h-0 opacity-0'
                }`}>
                <ul className="space-y-1.5 pl-1">
                  {section.links.map(link => (
                    <li key={link.href}>
                      <button
                        onClick={() => navigate(link.href)}
                        className="text-xs text-gray-400 hover:text-[var(--yp-blue-light)] transition-colors py-0.5"
                      >
                        {link.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* ── Social & Payment — single compact row ── */}
        <div className="border-t border-white/10 pt-4 sm:pt-6">
          <div className="flex items-center justify-between gap-4">
            {/* Social */}
            <div className="flex items-center gap-2">
              {[
                { icon: Instagram, href: '#', hoverColor: 'hover:bg-gradient-to-br hover:from-purple-500 hover:to-pink-500' },
                { icon: Facebook, href: '#', hoverColor: 'hover:bg-[var(--yp-blue)]' },
                { icon: MessageCircle, href: '#', hoverColor: 'hover:bg-[var(--yp-whatsapp)]' },
              ].map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className={`w-8 h-8 sm:w-9 sm:h-9 bg-white/5 ${social.hoverColor} rounded-lg flex items-center justify-center transition-all duration-300 hover:scale-110`}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>

            {/* Payment */}
            <div className="flex items-center gap-1.5">
              {['Cash', 'Card'].map((method) => (
                <div key={method} className="h-7 px-3 bg-white/5 border border-white/10 rounded-md flex items-center justify-center text-[10px] text-gray-400">
                  {method}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Copyright ── */}
        <div className="border-t border-white/10 mt-4 pt-3 sm:pt-5">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-xs text-gray-500">
              © {new Date().getFullYear()} YouPosh. {t('allRightsReserved')}
            </p>
            <div className="flex items-center gap-1">
              <span className="w-5 h-0.5 bg-[var(--yp-blue)] rounded-full" />
              <span className="w-2.5 h-0.5 bg-[var(--yp-red)] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
