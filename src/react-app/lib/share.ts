export function shareTo(platform: 'spotify' | 'apple', url: string) {
  try {
    (window as any).fbq?.('trackCustom', 'Share', { platform, url });
  } catch {
    // ignore
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

