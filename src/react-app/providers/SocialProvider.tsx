import React, { createContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { metaSDK } from '../components/social/utils/metaSdk';
import { socialMetrics } from '../components/social/utils/socialMetrics';
import { isMobileDevice } from '@/react-app/utils/platformDetection';

interface SocialSDKConfig {
  meta?: {
    appId?: string;
    pixelId?: string;
    version?: string;
  };
  twitter?: {
    enabled?: boolean;
  };
  tiktok?: {
    enabled?: boolean;
  };
  apple?: {
    developerToken?: string;
  };
  spotify?: {
    clientId?: string;
  };
}

export interface SocialSDKState {
  meta: boolean;
  twitter: boolean;
  tiktok: boolean;
  apple: boolean;
  spotify: boolean;
}

interface SocialProviderContextType {
  isLoaded: SocialSDKState;
  loadSDK: (platform: keyof SocialSDKState) => Promise<void>;
  config: SocialSDKConfig;
}

export const SocialProviderContext = createContext<SocialProviderContextType | null>(null);

const DEFAULT_CONFIG: SocialSDKConfig = {
  meta: {
    appId: import.meta.env?.VITE_FACEBOOK_APP_ID,
    pixelId: import.meta.env?.VITE_FACEBOOK_PIXEL_ID,
    version: import.meta.env?.VITE_FACEBOOK_SDK_VERSION || 'v22.0'
  },
  twitter: { enabled: true },
  tiktok: { enabled: true },
  apple: {},
  spotify: {
    clientId: import.meta.env?.VITE_SPOTIFY_CLIENT_ID
  }
};

export const SocialProvider: React.FC<{ children: ReactNode; config?: SocialSDKConfig }> = ({
  children,
  config = {}
}) => {
  const [isLoaded, setIsLoaded] = useState<SocialSDKState>({
    meta: false,
    twitter: false,
    tiktok: false,
    apple: false,
    spotify: false
  });
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isMobile, setIsMobile] = useState<boolean>(false);

  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const loadMetaSDK = useCallback(async () => {
    if (isLoaded.meta || window.FB) return;

    try {
      await metaSDK.loadFacebookSDK();
      await metaSDK.loadInstagramEmbed();
      if (mergedConfig.meta?.pixelId) {
        await metaSDK.loadPixel();
      }
      setIsLoaded(prev => ({ ...prev, meta: true }));
      socialMetrics.trackSDKLoad('meta');
    } catch (error) {
      console.error('Failed to load Meta SDK:', error);
    }
  }, [isLoaded.meta, mergedConfig.meta]);

  const loadTwitterSDK = useCallback(() => {
    if (isLoaded.twitter || !mergedConfig.twitter?.enabled) return;

    return new Promise<void>((resolve) => {
      if (document.getElementById('twitter-wjs')) {
        setIsLoaded(prev => ({ ...prev, twitter: true }));
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'twitter-wjs';
      script.src = 'https://platform.twitter.com/widgets.js';
      script.async = true;
      script.onload = () => {
        setIsLoaded(prev => ({ ...prev, twitter: true }));
        socialMetrics.trackSDKLoad('twitter');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load Twitter SDK');
        resolve();
      };
      document.body.appendChild(script);
    });
  }, [isLoaded.twitter, mergedConfig.twitter]);

  const loadTikTokSDK = useCallback(() => {
    if (isLoaded.tiktok || !mergedConfig.tiktok?.enabled) return;

    return new Promise<void>((resolve) => {
      if (document.getElementById('tiktok-embed-js')) {
        setIsLoaded(prev => ({ ...prev, tiktok: true }));
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.id = 'tiktok-embed-js';
      script.src = 'https://www.tiktok.com/embed.js';
      script.async = true;
      script.onload = () => {
        setIsLoaded(prev => ({ ...prev, tiktok: true }));
        socialMetrics.trackSDKLoad('tiktok');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load TikTok SDK');
        resolve();
      };
      document.body.appendChild(script);
    });
  }, [isLoaded.tiktok, mergedConfig.tiktok]);

  const loadAppleMusicSDK = useCallback(() => {
    if (isLoaded.apple) return;

    return new Promise<void>((resolve) => {
      if (document.getElementById('apple-music-js')) {
        setIsLoaded(prev => ({ ...prev, apple: true }));
        resolve();
        return;
      }

      const initAppleMusic = async () => {
        try {
          const tokenResponse = await fetch('/api/apple/developer-token');
          if (!tokenResponse.ok) throw new Error('Failed to get Apple developer token');
          const { token } = await tokenResponse.json();

          const script = document.createElement('script');
          script.id = 'apple-music-js';
          script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
          script.async = true;
          script.onload = () => {
            if (window.MusicKit) {
              window.MusicKit.configure({
                developerToken: token,
                app: {
                  name: 'DJ Judas',
                  build: '1.0.0'
                }
              });
              setIsLoaded(prev => ({ ...prev, apple: true }));
              socialMetrics.trackSDKLoad('apple');
            }
            resolve();
          };
          script.onerror = () => {
            console.error('Failed to load Apple Music SDK');
            resolve();
          };
          document.body.appendChild(script);
        } catch (error) {
          console.error('Failed to initialize Apple Music:', error);
          resolve();
        }
      };

      initAppleMusic();
    });
  }, [isLoaded.apple]);

  const loadSpotifySDK = useCallback(() => {
    if (isLoaded.spotify) return;

    return new Promise<void>((resolve) => {
      if (!mergedConfig.spotify?.clientId) {
        console.warn('Spotify client ID not configured');
        resolve();
        return;
      }

      if (document.getElementById('spotify-player-js')) {
        setIsLoaded(prev => ({ ...prev, spotify: true }));
        resolve();
        return;
      }

      window.onSpotifyWebPlaybackSDKReady = () => {
        setIsLoaded(prev => ({ ...prev, spotify: true }));
        socialMetrics.trackSDKLoad('spotify');
        resolve();
      };

      const script = document.createElement('script');
      script.id = 'spotify-player-js';
      script.src = 'https://sdk.scdn.co/spotify-player.js';
      script.async = true;
      script.onerror = () => {
        console.error('Failed to load Spotify SDK');
        resolve();
      };
      document.body.appendChild(script);
    });
  }, [isLoaded.spotify, mergedConfig.spotify]);

  const loadSDK = useCallback(async (platform: keyof SocialSDKState) => {
    switch (platform) {
      case 'meta':
        return loadMetaSDK();
      case 'twitter':
        return loadTwitterSDK();
      case 'tiktok':
        return loadTikTokSDK();
      case 'apple':
        return loadAppleMusicSDK();
      case 'spotify':
        return loadSpotifySDK();
      default:
        console.warn(`Unknown platform: ${platform}`);
    }
  }, [loadMetaSDK, loadTwitterSDK, loadTikTokSDK, loadAppleMusicSDK, loadSpotifySDK]);

  const checkMobile = useCallback(() => {
    const mobile = isMobileDevice();
    setIsMobile(mobile);
  }, []);

  useEffect(() => {
    checkMobile();
    if (!document.getElementById('fb-root')) {
      const fbRoot = document.createElement('div');
      fbRoot.id = 'fb-root';
      document.body.appendChild(fbRoot);
    }
  }, [checkMobile]);

  const contextValue: SocialProviderContextType = {
    isLoaded,
    loadSDK,
    config: mergedConfig
  };

  return (
    <SocialProviderContext.Provider value={contextValue}>
      {children}
    </SocialProviderContext.Provider>
  );
};



declare global {
  interface Window {
    MusicKit?: {
      configure: (config: Record<string, unknown>) => void;
    };
    onSpotifyWebPlaybackSDKReady?: () => void;
  }
}
