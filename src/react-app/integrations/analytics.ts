export type AnalyticsPayload = Record<string, unknown>;

interface WindowWithAnalytics extends Window {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
  __metaPixelConsentGranted?: boolean;
}

function getMetaPixel(win: WindowWithAnalytics): ((...args: unknown[]) => void) | null {
  if (win.__metaPixelConsentGranted !== true) {
    return null;
  }
  return win.fbq || null;
}

export function track(event: string, data?: AnalyticsPayload) {
  // GA4
  const win = window as unknown as WindowWithAnalytics;
  if (typeof window !== 'undefined' && win.gtag) {
    win.gtag('event', event, data || {});
  }
  // Meta Pixel (custom)
  const fbq = typeof window !== 'undefined' ? getMetaPixel(win) : null;
  if (fbq) {
    fbq('trackCustom', event, data || {});
  }
}

export function trackStandard(event: string, data?: AnalyticsPayload) {
  const win = window as unknown as WindowWithAnalytics;
  const fbq = typeof window !== 'undefined' ? getMetaPixel(win) : null;
  if (fbq) {
    fbq('track', event, data || {});
  }
  // mirror to GA as a custom event
  track(event, data);
}
