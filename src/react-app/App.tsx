// src/App.tsx

import EnhancedLandingPage from "./components/EnhancedLandingPageV2";
import ThemeToggle from './components/ThemeToggle';
import { useEffect, useState } from 'react';
import BookingPage from './pages/BookingPage';
import CheckoutPage from './pages/CheckoutPage';
import SuccessPage from './pages/SuccessPage';
import { onNavigate } from './utils/nav';

function App() {
  const [path, setPath] = useState<string>(typeof window !== 'undefined' ? window.location.pathname : '/');

  useEffect(() => {
    const off = onNavigate(() => setPath(window.location.pathname));
    return off;
  }, []);

  // Facebook SDK is loaded via our internal metaSDK when needed.
  // Removing react-facebook provider prevents double-initialization.
  return (
    <div className="min-h-svh">
      <ThemeToggle />
      {path === '/book' ? <BookingPage />
        : path === '/checkout' ? <CheckoutPage />
        : path === '/success' ? <SuccessPage />
        : <EnhancedLandingPage />}
    </div>
  );
}

export default App;
