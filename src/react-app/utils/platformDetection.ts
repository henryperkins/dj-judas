export interface PlatformLink {
  platform: 'spotify' | 'apple-music' | 'facebook' | 'instagram';
  deepLink?: string;
  webLink: string;
  label: string;
  icon?: string;
}

export const isMobileDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  
  return mobileRegex.test(userAgent.toLowerCase()) || window.innerWidth < 768;
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor;
  return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
};

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent || navigator.vendor;
  return /android/i.test(userAgent);
};

export const hasNativeApp = (platform: string): boolean => {
  if (!isMobileDevice()) return false;
  
  switch (platform) {
    case 'spotify':
      return true; // Spotify has apps on all mobile platforms
    case 'apple-music':
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
export const PLATFORM_CONFIGS = {
  spotify: {
    name: 'Spotify',
    color: '#1DB954',
    icon: '🎵',
    artistId: '4ZxOuNHhpyOj3MOSE23KxR', // DJ Lee & Voices of Judah Spotify ID
    deepLinkPrefix: 'spotify:artist:',
    webLinkPrefix: 'https://open.spotify.com/artist/'
  },
  appleMusic: {
    name: 'Apple Music',
    color: '#FA233B',
    icon: '🎧',
    artistId: '1540816224', // DJ Lee & Voices of Judah Apple Music ID
    deepLinkPrefix: 'music://music.apple.com/artist/',
    webLinkPrefix: 'https://music.apple.com/us/artist/'
  },
  facebook: {
    name: 'Facebook',
    color: '#1877F2',
    icon: '👥',
    pageId: 'MidWestScreamers', // Facebook page ID
    deepLinkPrefix: 'fb://page/',
    webLinkPrefix: 'https://www.facebook.com/'
  },
  instagram: {
    name: 'Instagram',
    color: '#E4405F',
    icon: '📷',
    username: 'iam_djlee', // Instagram username
    deepLinkPrefix: 'instagram://user?username=',
    webLinkPrefix: 'https://www.instagram.com/'
  }
};

export const generatePlatformLinks = (): PlatformLink[] => {
  return [
    {
      platform: 'spotify',
      deepLink: `${PLATFORM_CONFIGS.spotify.deepLinkPrefix}${PLATFORM_CONFIGS.spotify.artistId}`,
      webLink: `${PLATFORM_CONFIGS.spotify.webLinkPrefix}${PLATFORM_CONFIGS.spotify.artistId}`,
      label: 'Listen on Spotify',
      icon: PLATFORM_CONFIGS.spotify.icon
    },
    {
      platform: 'apple-music',
      deepLink: `${PLATFORM_CONFIGS.appleMusic.deepLinkPrefix}${PLATFORM_CONFIGS.appleMusic.artistId}`,
      webLink: `${PLATFORM_CONFIGS.appleMusic.webLinkPrefix}djlee/${PLATFORM_CONFIGS.appleMusic.artistId}`,
      label: 'Listen on Apple Music',
      icon: PLATFORM_CONFIGS.appleMusic.icon
    },
    {
      platform: 'facebook',
      deepLink: `fb://profile/${PLATFORM_CONFIGS.facebook.pageId}`,
      webLink: `${PLATFORM_CONFIGS.facebook.webLinkPrefix}${PLATFORM_CONFIGS.facebook.pageId}`,
      label: 'Follow on Facebook',
      icon: PLATFORM_CONFIGS.facebook.icon
    },
    {
      platform: 'instagram',
      deepLink: `${PLATFORM_CONFIGS.instagram.deepLinkPrefix}${PLATFORM_CONFIGS.instagram.username}`,
      webLink: `${PLATFORM_CONFIGS.instagram.webLinkPrefix}${PLATFORM_CONFIGS.instagram.username}`,
      label: 'Follow on Instagram',
      icon: PLATFORM_CONFIGS.instagram.icon
    }
  ];
};

// Analytics helper
export const trackPlatformClick = (platform: string, context: string = 'launcher'): void => {
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'platform_click', {
      platform,
      context,
      is_mobile: isMobileDevice(),
      device_type: isIOS() ? 'ios' : isAndroid() ? 'android' : 'desktop'
    });
  }
  
  // Also track with Meta Pixel if available
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'ViewContent', {
      content_name: `Platform: ${platform}`,
      content_category: context
    });
  }
};