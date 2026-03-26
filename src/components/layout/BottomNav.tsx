import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Home, Smartphone, Search, Heart, User } from 'lucide-react';

export default function BottomNav() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  // Cache la BottomNav sur desktop et sur les pages d'administration
  if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/login')) {
    return null;
  }

  const navItems = [
    { path: '/', label: t('home') || 'Accueil', icon: Home },
    { path: '/shop', label: t('phones') || 'Boutique', icon: Smartphone },
    { path: '/search', label: t('search') || 'Chercher', icon: Search },
    { path: '/wishlist', label: t('wishlist') || 'Favoris', icon: Heart },
    { path: '/account', label: t('account') || 'Compte', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 w-full bg-white border-t border-[var(--yp-border-color)] z-[999] pb-[env(safe-area-inset-bottom)] lg:hidden shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex items-center justify-around h-[60px] px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          
          return (
            <button
              key={item.path}
              onClick={() => {
                if (item.path === '/search') {
                  // For now navigate to shop if no search modal trigger available here, or you can implement a search page
                  navigate('/shop');
                } else {
                  navigate(item.path);
                }
              }}
              className={`flex flex-col items-center justify-center min-w-[60px] h-full gap-1 relative ${
                isActive ? 'text-[var(--yp-blue)]' : 'text-[var(--yp-gray-500)]'
              }`}
            >
              <item.icon className={`w-5 h-5 ${isActive ? 'fill-current' : ''}`} />
              <span className="text-[10px] font-medium">{item.label}</span>
              {isActive && (
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-1 bg-[var(--yp-blue)] rounded-t-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}