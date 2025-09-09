export type AnalyticsPayload = Record<string, unknown>;

export function track(event: string, data?: AnalyticsPayload) {
  // GA4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, data || {});
  }
  // Meta Pixel (custom)
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('trackCustom', event, data || {});
  }
}

export function trackStandard(event: string, data?: AnalyticsPayload) {
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', event, data || {});
  }
  // mirror to GA as a custom event
  track(event, data);
}

