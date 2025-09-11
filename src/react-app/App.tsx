// src/App.tsx

import EnhancedLandingPage from "./components/EnhancedLandingPageV2";
import ThemeToggle from './components/ThemeToggle';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useEffect, useState, lazy, Suspense } from 'react';
const BookingPage = lazy(() => import('./pages/BookingPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminHome = lazy(() => import('./pages/AdminHome'));
const AdminAddProduct = lazy(() => import('./pages/AdminAddProduct'));
const AdminProductsList = lazy(() => import('./pages/AdminProductsList'));
const AdminEditProduct = lazy(() => import('./pages/AdminEditProduct'));
import { onNavigate, navigate } from './utils/nav';
import { initMeta } from './integrations';
import { useMetaPixelPageViews } from './hooks/useMetaPixelPageViews';

function App() {
  const [path, setPath] = useState<string>(typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    const off = onNavigate(() => setPath(window.location.pathname));
    return off;
  }, []);

  // Intercept internal anchor clicks with data-nav for SPA navigation
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a[data-nav]') as HTMLAnchorElement | null;
      if (!anchor) return;
      const href = anchor.getAttribute('href') || '';
      if (!href.startsWith('/')) return;
      e.preventDefault();
      navigate(href);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
  }, []);

  // Initialize Facebook SDK and Pixel on app startup
  useEffect(() => {
    initMeta();
  }, []);

  // Fire Meta Pixel PageView on SPA route changes
  useMetaPixelPageViews(path);

  // Facebook SDK is loaded via our internal metaSDK when needed.
  // Removing react-facebook provider prevents double-initialization.
  return (
    <div className="min-h-svh admin-compact">
      <ErrorBoundary>
        <ThemeToggle />
      </ErrorBoundary>
      
      <ErrorBoundary>
        <Suspense fallback={<div className="container section-py"><div className="skeleton-title" /><div className="skeleton-text" /><div className="skeleton-text" /></div>}>
          {path === '/book' ? <BookingPage />
            : path === '/checkout' ? <CheckoutPage />
            : path === '/success' ? <SuccessPage />
            : path === '/products' ? <ProductsPage />
            : path === '/admin/login' ? <AdminLogin />
            : path === '/admin' ? <AdminHome />
            : path === '/admin/products' ? <AdminProductsList />
            : path === '/admin/products/new' ? <AdminAddProduct />
            : /^\/admin\/products\/.+/.test(path) ? <AdminEditProduct id={path.replace('/admin/products/','')} />
            : <EnhancedLandingPage />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

export default App;
