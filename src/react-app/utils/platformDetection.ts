export interface PlatformLink {
  // Use canonical camelCase platform ids that match PLATFORM_CONFIG keys
  platform: 'spotify' | 'appleMusic' | 'facebook' | 'instagram';
  deepLink?: string;
  webLink: string;
  label: string;
  icon?: string;
}

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || window.opera || '';
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;

  return mobileRegex.test(userAgent.toLowerCase()) || window.innerWidth < 768;
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || '';
  return /iPad|iPhone|iPod/.test(userAgent) && !window.MSStream;
};

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;

  const userAgent = navigator.userAgent || navigator.vendor || '';
  return /android/i.test(userAgent);
};

export const hasNativeApp = (platform: string): boolean => {
  if (!isMobileDevice()) return false;

  switch (platform) {
    case 'spotify':
      return true; // Spotify has apps on all mobile platforms
    case 'appleMusic':
      return isIOS(); // Apple Music native app only on iOS
    case 'facebook':
    case 'instagram':
      return true; // Meta apps available on all platforms
    default:
      return false;
  }
};

export const getPlatformUrl = (link: PlatformLink): string => {
  const shouldUseDeepLink = isMobileDevice() && link.deepLink && hasNativeApp(link.platform);

  if (shouldUseDeepLink && link.deepLink) {
    // For iOS, we'll use a fallback mechanism
    if (isIOS()) {
      // Try deep link first, fallback to web
      setTimeout(() => {
        window.location.href = link.webLink;
      }, 2500);
      return link.deepLink;
    }

    // For Android, deep links usually work directly
    return link.deepLink;
  }

  return link.webLink;
};

export const openPlatform = (link: PlatformLink, trackingCallback?: () => void): void => {
  if (trackingCallback) {
    trackingCallback();
  }

  const url = getPlatformUrl(link);

  if (isMobileDevice() && link.deepLink) {
    // For mobile with deep links, try to open in new context
    const newWindow = window.open(url, '_blank');

    // Fallback if deep link fails
    if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
      window.location.href = link.webLink;
    }
  } else {
    // Desktop or no deep link - open in new tab
    window.open(url, '_blank', 'noopener,noreferrer');
  }
};

// Platform configurations
import { getPlatformDeepLink, getPlatformWebLink } from '../config/platforms';

export const generatePlatformLinks = (): PlatformLink[] => {
  return [
    {
      platform: 'spotify',
      deepLink: getPlatformDeepLink('spotify'),
      webLink: getPlatformWebLink('spotify')!,
      label: 'Listen on Spotify',
      icon: 'spotify'
    },
    {
      platform: 'appleMusic',
      deepLink: getPlatformDeepLink('appleMusic'),
      webLink: getPlatformWebLink('appleMusic')!,
      label: 'Listen on Apple Music',
      icon: 'apple-music'
    },
    {
      platform: 'facebook',
      deepLink: getPlatformDeepLink('facebook'),
      webLink: getPlatformWebLink('facebook')!,
      label: 'Follow on Facebook',
      icon: 'facebook'
    },
    {
      platform: 'instagram',
      deepLink: getPlatformDeepLink('instagram'),
      webLink: getPlatformWebLink('instagram')!,
      label: 'Follow on Instagram',
      icon: 'instagram'
    }
  ];
};

// Analytics helper
import { trackMusic } from './analytics';

export const trackPlatformClick = (platform: string, context: string = 'launcher'): void => {
  // normalize legacy keys to canonical
  const normalized = platform === 'apple-music' || platform === 'apple_music' ? 'appleMusic' : platform;
  trackMusic(normalized, 'click', {
    context,
    is_mobile: isMobileDevice(),
    device_type: isIOS() ? 'ios' : isAndroid() ? 'android' : 'desktop'
  });
};
