/**
 * Centralized platform configuration
 * Consolidates all platform IDs, URLs, and settings in one place
 */

// Platform IDs and core configuration
export const PLATFORM_CONFIG = {
  spotify: {
    name: 'Spotify',
    color: '#1DB954',
    artistId: import.meta.env.VITE_SPOTIFY_ARTIST_ID || '5WICYLl8MXvOY2x3mkoSqK',
    clientId: import.meta.env.VITE_SPOTIFY_CLIENT_ID,
    deepLinkPrefix: 'spotify:artist:',
    webLinkPrefix: 'https://open.spotify.com/artist/',
    embedBaseUrl: 'https://open.spotify.com/embed/',
  },
  appleMusic: {
    name: 'Apple Music',
    color: '#FC3C44',
    artistId: '1540816224', // DJ Lee & Voices of Judah Apple Music ID
    deepLinkPrefix: 'music://music.apple.com/artist/',
    webLinkPrefix: 'https://music.apple.com/us/artist/',
    embedBaseUrl: 'https://embed.music.apple.com/',
    affiliateToken: '',
    campaignToken: 'voices-of-judah',
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    appId: import.meta.env.VITE_FACEBOOK_APP_ID,
    pixelId: import.meta.env.VITE_FACEBOOK_PIXEL_ID,
    pageId: import.meta.env.VITE_FACEBOOK_PAGE || 'MidWestScreamers',
    deepLinkPrefix: 'fb://page/',
    webLinkPrefix: 'https://www.facebook.com/',
    oembedEndpoint: 'https://graph.facebook.com/v18.0/oembed_page',
  },
  instagram: {
    name: 'Instagram',
    color: '#E4405F',
    username: import.meta.env.VITE_INSTAGRAM_HANDLE || 'iam_djlee',
    deepLinkPrefix: 'instagram://user?username=',
    webLinkPrefix: 'https://www.instagram.com/',
    oembedEndpoint: '/api/instagram/oembed',
  },
  soundcloud: {
    name: 'SoundCloud',
    color: '#FF5500',
    url: import.meta.env.VITE_SOUNDCLOUD_URL || 'https://soundcloud.com/dj-lee-voices-of-judah',
    embedBaseUrl: 'https://w.soundcloud.com/player/',
  },
  youtube: {
    name: 'YouTube',
    color: '#FF0000',
    channelId: '', // Add when available
    embedBaseUrl: 'https://www.youtube.com/embed/',
  },
  tiktok: {
    name: 'TikTok',
    color: '#000000',
    username: '', // Add when available
    embedBaseUrl: 'https://www.tiktok.com/embed/',
  },
  twitter: {
    name: 'X (Twitter)',
    color: '#000000',
    username: '', // Add when available
    embedBaseUrl: 'https://platform.twitter.com/embed/',
  },
} as const;

// Share platform configurations
export const SHARE_PLATFORMS = {
  facebook: {
    id: 'facebook',
    name: 'Facebook',
    color: PLATFORM_CONFIG.facebook.color,
    shareUrl: 'https://www.facebook.com/sharer/sharer.php',
    params: (url: string, title?: string) => ({
      u: url,
      quote: title,
    }),
  },
  twitter: {
    id: 'twitter',
    name: 'X',
    color: '#000000',
    shareUrl: 'https://twitter.com/intent/tweet',
    params: (url: string, title?: string) => ({
      url,
      text: title,
    }),
  },
  whatsapp: {
    id: 'whatsapp',
    name: 'WhatsApp',
    color: '#25D366',
    shareUrl: 'https://wa.me/',
    params: (url: string, title?: string) => ({
      text: title ? `${title} ${url}` : url,
    }),
  },
  messenger: {
    id: 'messenger',
    name: 'Messenger',
    color: '#006AFF',
    shareUrl: 'https://www.facebook.com/dialog/send',
    params: (url: string) => ({
      app_id: PLATFORM_CONFIG.facebook.appId,
      link: url,
      redirect_uri: url,
    }),
  },
} as const;

// Analytics configuration
export const ANALYTICS_CONFIG = {
  google: {
    enabled: typeof window !== 'undefined' && !!(window as unknown as { gtag?: unknown }).gtag,
    measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
  },
  facebook: {
    enabled: typeof window !== 'undefined' && !!(window as unknown as { fbq?: unknown }).fbq,
    pixelId: PLATFORM_CONFIG.facebook.pixelId,
  },
} as const;

// E-commerce configuration
export const ECOMMERCE_CONFIG = {
  medusa: {
    url: import.meta.env.VITE_MEDUSA_URL,
    publishableKey: import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY,
  },
  stripe: {
    priceId: import.meta.env.VITE_STRIPE_PRICE_ID,
  },
  cloudflareImages: {
    variant: import.meta.env.VITE_CF_IMAGES_VARIANT || 'public',
    variantThumb: import.meta.env.VITE_CF_IMAGES_VARIANT_THUMB || 'thumb',
    variantLarge: import.meta.env.VITE_CF_IMAGES_VARIANT_LARGE || 'large',
  },
} as const;

// Contact configuration
export const CONTACT_CONFIG = {
  email: import.meta.env.VITE_CONTACT_EMAIL || 'V.O.J@icloud.com',
} as const;

// Helper functions
export function getPlatformById(id: keyof typeof PLATFORM_CONFIG) {
  return PLATFORM_CONFIG[id];
}

export function getSharePlatformById(id: keyof typeof SHARE_PLATFORMS) {
  return SHARE_PLATFORMS[id];
}

export function buildShareUrl(platformId: keyof typeof SHARE_PLATFORMS, url: string, title?: string): string {
  const platform = SHARE_PLATFORMS[platformId];
  if (!platform) return url;

  const params = new URLSearchParams(platform.params(url, title) as Record<string, string>);
  return `${platform.shareUrl}?${params.toString()}`;
}

export function getPlatformDeepLink(platformId: keyof typeof PLATFORM_CONFIG): string | undefined {
  switch (platformId) {
    case 'spotify': {
      const p = PLATFORM_CONFIG.spotify;
      return `${p.deepLinkPrefix}${p.artistId}`;
    }
    case 'appleMusic': {
      const p = PLATFORM_CONFIG.appleMusic;
      return `${p.deepLinkPrefix}${p.artistId}`;
    }
    case 'facebook': {
      const p = PLATFORM_CONFIG.facebook;
      return `${p.deepLinkPrefix}${p.pageId}`;
    }
    case 'instagram': {
      const p = PLATFORM_CONFIG.instagram;
      return `${p.deepLinkPrefix}${p.username}`;
    }
    default:
      return undefined;
  }
}

export function getPlatformWebLink(platformId: keyof typeof PLATFORM_CONFIG): string | undefined {
  switch (platformId) {
    case 'spotify': {
      const p = PLATFORM_CONFIG.spotify;
      return `${p.webLinkPrefix}${p.artistId}`;
    }
    case 'appleMusic': {
      const p = PLATFORM_CONFIG.appleMusic;
      return `${p.webLinkPrefix}djlee/${p.artistId}`;
    }
    case 'facebook': {
      const p = PLATFORM_CONFIG.facebook;
      return `${p.webLinkPrefix}${p.pageId}`;
    }
    case 'instagram': {
      const p = PLATFORM_CONFIG.instagram;
      return `${p.webLinkPrefix}${p.username}`;
    }
    case 'soundcloud': {
      const p = PLATFORM_CONFIG.soundcloud;
      return p.url;
    }
    default:
      return undefined;
  }
}

/**
 * Platform alias normalization
 * Canonical internal ids are PLATFORM_CONFIG keys (camelCase).
 * This map accepts legacy/external ids and normalizes them.
 */
export const PLATFORM_ALIASES: Record<string, keyof typeof PLATFORM_CONFIG> = {
  // Apple Music aliases
  'apple-music': 'appleMusic',
  'apple_music': 'appleMusic',
  // Meta aliases
  'fb': 'facebook',
  // Instagram shorthand
  'ig': 'instagram',
  // X/Twitter
  'x': 'twitter',
};

/**
 * Returns a canonical PlatformId from any alias, or undefined if unknown.
 */
export function normalizePlatformId(id: string | undefined | null): keyof typeof PLATFORM_CONFIG | undefined {
  if (!id) return undefined;
  // Exact match first
  if (id in PLATFORM_CONFIG) return id as keyof typeof PLATFORM_CONFIG;
  // Lowercase alias lookup
  const lower = id.toLowerCase();
  return PLATFORM_ALIASES[lower];
}

/**
 * Convenience helper: given any platform id or alias, return deep/web links.
 */
export function getPlatformLinksAny(id: string): {
  platformId?: keyof typeof PLATFORM_CONFIG;
  deepLink?: string;
  webLink?: string;
} {
  const platformId = normalizePlatformId(id);
  if (!platformId) return {};
  return {
    platformId,
    deepLink: getPlatformDeepLink(platformId),
    webLink: getPlatformWebLink(platformId),
  };
}

// Type exports
export type PlatformId = keyof typeof PLATFORM_CONFIG;
export type SharePlatformId = keyof typeof SHARE_PLATFORMS;
export type PlatformConfig = typeof PLATFORM_CONFIG[PlatformId];
export type SharePlatform = typeof SHARE_PLATFORMS[SharePlatformId];
