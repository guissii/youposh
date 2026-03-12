import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { Suspense, lazy } from 'react';
import './i18n';
import './App.css';

import { StoreProvider } from '@/contexts/StoreContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Lazy load pages for better performance
const HomePage = lazy(() => import('@/pages/HomePage'));
const ShopPage = lazy(() => import('@/pages/ShopPage'));
const ProductPage = lazy(() => import('@/pages/ProductPage'));
const AdminPage = lazy(() => import('@/pages/AdminPage'));
const FAQPage = lazy(() => import('@/pages/FAQPage'));
const ShippingPage = lazy(() => import('@/pages/ShippingPage'));

// Loading component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--yp-blue)]"></div>
  </div>
);

function App() {
  return (
    <LanguageProvider>
      <StoreProvider>
        <Router>
          <Toaster
            position="top-center"
            toastOptions={{
              style: {
                background: '#333',
                color: '#fff',
                borderRadius: '12px',
              },
            }}
          />
          <ErrorBoundary>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<HomePage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/category/:slug" element={<ShopPage />} />
                <Route path="/search" element={<ShopPage />} />
                <Route path="/promotions" element={<ShopPage />} />
                <Route path="/bestsellers" element={<ShopPage />} />
                <Route path="/new" element={<ShopPage />} />
                <Route path="/product/:id" element={<ProductPage />} />
                <Route path="/admin" element={<AdminPage />} />

                {/* Fallback routes */}
                <Route path="/wishlist" element={<HomePage />} />
                <Route path="/track-order" element={<HomePage />} />
                <Route path="/faq" element={<FAQPage />} />
                <Route path="/delivery" element={<ShippingPage />} />
                <Route path="/shipping" element={<ShippingPage />} />
                <Route path="/returns" element={<HomePage />} />
                <Route path="/about" element={<HomePage />} />
                <Route path="/contact" element={<HomePage />} />
                <Route path="/terms" element={<HomePage />} />
                <Route path="/privacy" element={<HomePage />} />
              </Routes>
            </Suspense>
          </ErrorBoundary>
        </Router>
      </StoreProvider>
    </LanguageProvider>
  );
}

export default App;
