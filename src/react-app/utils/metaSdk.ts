import { socialMetrics } from './socialMetrics';

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: unknown;
    fbq?: (...args: unknown[]) => void;
    instgrm?: { Embeds?: { process: () => void } };
    trackMusicClick?: (platform: string) => void;
  }
}

interface MetaSDKConfig {
  appId?: string;
  version?: string;
  pixelId?: string;
  enableAnalytics?: boolean;
}

class MetaSDKLoader {
  private static instance: MetaSDKLoader;
  private fbLoaded = false;
  private igLoaded = false;
  private pixelLoaded = false;
  private config: MetaSDKConfig;

  private constructor(config: MetaSDKConfig = {}) {
    // Allow env-provided defaults (Vite exposes import.meta.env)
  const envAppId = import.meta.env?.VITE_FACEBOOK_APP_ID;
  const envPixelId = import.meta.env?.VITE_FACEBOOK_PIXEL_ID;
    this.config = {
      version: 'v18.0',
      enableAnalytics: true,
      appId: envAppId || config.appId,
      pixelId: envPixelId || config.pixelId,
      ...config
    };
  }

  static getInstance(config?: MetaSDKConfig): MetaSDKLoader {
    if (!MetaSDKLoader.instance) {
      MetaSDKLoader.instance = new MetaSDKLoader(config);
    }
    return MetaSDKLoader.instance;
  }

  async loadFacebookSDK(): Promise<void> {
    if (this.fbLoaded || document.getElementById('facebook-jssdk')) {
      return;
    }

    return new Promise((resolve) => {
      window.fbAsyncInit = () => {
        const FB = window.FB as unknown as {
          init: (cfg: Record<string, unknown>) => void;
          AppEvents: { logPageView: () => void };
          Event: { subscribe: (ev: string, cb: (url: string) => void) => void };
          XFBML?: { parse: (el?: HTMLElement) => void };
          ui?: (cfg: Record<string, unknown>, cb: (resp: unknown) => void) => void;
        };
        FB.init({
          appId: this.config.appId,
          cookie: true,
          xfbml: true,
          version: this.config.version
        });

        // Track page view
        if (this.config.enableAnalytics) {
          FB.AppEvents.logPageView();
          socialMetrics.trackEntry({ source: 'facebook', medium: 'sdk_load' });
        }

        // Subscribe to social plugin events
        FB.Event.subscribe('edge.create', (url: string) => {
          socialMetrics.trackSocialInteraction('facebook', 'like', { url });
        });

        FB.Event.subscribe('edge.remove', (url: string) => {
          socialMetrics.trackSocialInteraction('facebook', 'unlike', { url });
        });

        FB.Event.subscribe('message.send', (url: string) => {
          socialMetrics.trackSocialInteraction('facebook', 'share', { url });
        });

        this.fbLoaded = true;
        resolve();
      };

      const script = document.createElement('script');
      script.id = 'facebook-jssdk';
      script.src = 'https://connect.facebook.net/en_US/sdk.js';
      script.async = true;
      script.defer = true;
      document.body.appendChild(script);
    });
  }

  async loadInstagramEmbed(): Promise<void> {
    if (this.igLoaded || document.querySelector('script[src*="instagram.com/embed.js"]')) {
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://www.instagram.com/embed.js';
      script.async = true;
      script.onload = () => {
        this.igLoaded = true;

        // Track Instagram embed loads
        if (this.config.enableAnalytics) {
          socialMetrics.trackEntry({ source: 'instagram', medium: 'embed_load' });
        }

        resolve();
      };
      script.onerror = () => reject(new Error('Failed to load Instagram embed.js'));
      document.body.appendChild(script);
    });
  }

  async loadPixel(): Promise<void> {
    if (!this.config.pixelId || this.pixelLoaded) {
      return;
    }

    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.innerHTML = `
        !function(f,b,e,v,n,t,s)
        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
        n.queue=[];t=b.createElement(e);t.async=!0;
        t.src=v;s=b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t,s)}(window, document,'script',
        'https://connect.facebook.net/en_US/fbevents.js');

        fbq('init', '${this.config.pixelId}');
        fbq('track', 'PageView');
      `;
      document.head.appendChild(script);

      this.pixelLoaded = true;

      // Set up custom conversion tracking
      this.setupConversionTracking();

      resolve();
    });
  }

  private setupConversionTracking(): void {
  if (!window.fbq) return;

    // Track music platform clicks as valuable actions
    const trackMusicClick = (platform: string) => {
  if (!window.fbq) return;
  window.fbq('trackCustom', 'MusicPlatformClick', {
        platform,
        value: platform === 'spotify' || platform === 'apple' ? 1.0 : 0.5,
        currency: 'USD'
      });
    };

    // Make it globally available
  window.trackMusicClick = trackMusicClick;
  }

  async parseFBML(element?: HTMLElement): Promise<void> {
    await this.loadFacebookSDK();
  const FB = window.FB as unknown as { XFBML?: { parse: (el?: HTMLElement) => void } };
    if (FB && FB.XFBML) {
      FB.XFBML.parse(element);
    }
  }

  async processInstagramEmbeds(): Promise<void> {
    await this.loadInstagramEmbed();
  const instgrm = window.instgrm;
    if (instgrm && instgrm.Embeds) {
      instgrm.Embeds.process();
    }
  }

  // Helper to track video engagement
  trackVideoEngagement(videoId: string, action: 'play' | 'pause' | 'complete', progress?: number): void {
    if (window.fbq) {
      window.fbq('trackCustom', 'VideoEngagement', {
        videoId,
        action,
        progress: progress || 0
      });
    }

    socialMetrics.trackSocialInteraction('facebook', `video_${action}`, {
      videoId,
      progress
    });
  }

  // Helper to track social proof views
  trackSocialProofView(metrics: Record<string, unknown>): void {
    if (window.fbq) {
      window.fbq('trackCustom', 'SocialProofView', metrics);
    }

    socialMetrics.trackSocialInteraction('aggregated', 'social_proof_view', metrics);
  }

  // Share with attribution tracking
  async shareWithTracking(data: {
    url: string;
    quote?: string;
    hashtag?: string;
    source: string;
  }): Promise<void> {
    await this.loadFacebookSDK();
  const FB = window.FB as unknown as { ui?: (cfg: Record<string, unknown>, cb: (resp: unknown) => void) => void };

    if (!FB) return;

    // Add UTM parameters to track shares
    const shareUrl = new URL(data.url);
    shareUrl.searchParams.set('utm_source', 'facebook');
    shareUrl.searchParams.set('utm_medium', 'share');
    shareUrl.searchParams.set('utm_campaign', data.source);

  if (!FB || !FB.ui) return;
  FB.ui({
      method: 'share',
      href: shareUrl.toString(),
      quote: data.quote,
      hashtag: data.hashtag
    }, (response: unknown) => {
      const r = response as { error_message?: string } | undefined;
      if (r && !r.error_message) {
        socialMetrics.trackSocialInteraction('facebook', 'share_complete', {
          url: shareUrl.toString(),
          source: data.source
        });
      }
    });
  }
}

export const metaSDK = MetaSDKLoader.getInstance();

// Optional runtime reconfigure (e.g., after fetching remote config)
export const configureMetaSDK = (cfg: Partial<MetaSDKConfig>) => {
  // @ts-expect-error accessing private for runtime reconfigure
  metaSDK.config = { ...metaSDK.config, ...cfg };
};

// Export convenience functions
export const loadFacebookSDK = () => metaSDK.loadFacebookSDK();
export const loadInstagramEmbed = () => metaSDK.loadInstagramEmbed();
export const parseFBML = (element?: HTMLElement) => metaSDK.parseFBML(element);
export const processInstagramEmbeds = () => metaSDK.processInstagramEmbeds();
export const shareWithTracking = (data: { url: string; quote?: string; hashtag?: string; source: string }) => metaSDK.shareWithTracking(data);
