import ThemeToggle from './components/ThemeToggle';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useEffect, useState, Suspense } from 'react';
import { onNavigate, navigate } from './utils/nav';
import { SocialProvider } from './providers/SocialProvider';
import { useMetaPixelPageViews } from './hooks/useMetaPixelPageViews';
import Router from './Router';

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

  // SDK initialization now handled by SocialProvider

  // Fire Meta Pixel PageView on SPA route changes
  useMetaPixelPageViews(path);

  // SDK initialization handled by SocialProvider for all platforms
  return (
    <SocialProvider>
      <div className="min-h-svh admin-compact">
        <ErrorBoundary>
          <ThemeToggle />
        </ErrorBoundary>
        
        <ErrorBoundary>
          <Suspense fallback={<div className="container section-py"><div className="skeleton-title" /><div className="skeleton-text" /><div className="skeleton-text" /></div>}>
            <Router path={path} />
          </Suspense>
        </ErrorBoundary>
      </div>
    </SocialProvider>
  );
}

export default App;
