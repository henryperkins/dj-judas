import React, { lazy } from 'react';

const BookingPage = lazy(() => import('./pages/BookingPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const SuccessPage = lazy(() => import('./pages/SuccessPage'));
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const AdminLogin = lazy(() => import('./pages/AdminLogin'));
const AdminHome = lazy(() => import('./pages/AdminHome'));
const AdminAddProduct = lazy(() => import('./pages/AdminAddProduct'));
const AdminProductsList = lazy(() => import('./pages/AdminProductsList'));
const AdminEditProduct = lazy(() => import('./pages/AdminEditProduct'));
const EnhancedLandingPage = lazy(() => import('./components/EnhancedLandingPageV2'));

interface RouterProps {
  path: string;
}

const Router: React.FC<RouterProps> = ({ path }) => {
  switch (path) {
    case '/book':
      return <BookingPage />;
    case '/checkout':
      return <CheckoutPage />;
    case '/success':
      return <SuccessPage />;
    case '/products':
      return <ProductsPage />;
    case '/admin/login':
      return <AdminLogin />;
    case '/admin':
      return <AdminHome />;
    case '/admin/products':
      return <AdminProductsList />;
    case '/admin/products/new':
      return <AdminAddProduct />;
    default:
      if (/^\/admin\/products\/.+/.test(path)) {
        return <AdminEditProduct id={path.replace('/admin/products/', '')} />;
      }
      return <EnhancedLandingPage />;
  }
};

export default Router;
