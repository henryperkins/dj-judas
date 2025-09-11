export type AnalyticsPayload = Record<string, unknown>;

interface WindowWithAnalytics extends Window {
  gtag?: (...args: unknown[]) => void;
  fbq?: (...args: unknown[]) => void;
}

export function track(event: string, data?: AnalyticsPayload) {
  // GA4
  const win = window as unknown as WindowWithAnalytics;
  if (typeof window !== 'undefined' && win.gtag) {
    win.gtag('event', event, data || {});
  }
  // Meta Pixel (custom)
  if (typeof window !== 'undefined' && win.fbq) {
    win.fbq('trackCustom', event, data || {});
  }
}

export function trackStandard(event: string, data?: AnalyticsPayload) {
  const win = window as unknown as WindowWithAnalytics;
  if (typeof window !== 'undefined' && win.fbq) {
    win.fbq('track', event, data || {});
  }
  // mirror to GA as a custom event
  track(event, data);
}

