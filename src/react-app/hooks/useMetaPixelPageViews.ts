import { useEffect, useRef } from 'react';
import { pageView } from '@/react-app/integrations';

export function useMetaPixelPageViews(pathname: string) {
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      // Skip initial mount to avoid double-firing with Pixel init
      first.current = false;
      return;
    }
    pageView();
  }, [pathname]);
}

