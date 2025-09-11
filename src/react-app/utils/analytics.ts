/**
 * Centralized Analytics Module
 * Single source of truth for all tracking events
 */

interface AnalyticsEvent {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  [key: string]: unknown;
}


interface ErrorEvent {
  error: Error;
  errorInfo?: unknown;
  fatal?: boolean;
}

class Analytics {
  private static instance: Analytics;
  private initialized = false;
  private debug = import.meta.env.DEV;
  
  private constructor() {
    this.initializeProviders();
  }
  
  static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }
  
  private initializeProviders(): void {
    if (typeof window === 'undefined') return;
    
    // Wait for providers to be available
    const checkProviders = () => {
      if (window.gtag || window.fbq) {
        this.initialized = true;
        this.log('Analytics providers initialized');
      }
    };
    
    // Check immediately and again after DOM ready
    checkProviders();
    if (!this.initialized) {
      window.addEventListener('DOMContentLoaded', checkProviders);
    }
  }
  
  private log(...args: unknown[]): void {
    if (this.debug) {
      console.log('[Analytics]', ...args);
    }
  }
  
  /**
   * Track a generic event (Google Analytics + Facebook Pixel)
   */
  track(event: AnalyticsEvent): void {
    const { action, category = 'general', label, value, ...customParams } = event;
    
    // Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', action, {
        event_category: category,
        event_label: label,
        value,
        ...customParams
      });
      this.log('GA Event:', action, { category, label, value, ...customParams });
    }
    
    // Facebook Pixel - Convert to appropriate FB event
    if (typeof window !== 'undefined' && window.fbq) {
      // Map common events to Facebook standard events
      const fbEventMap: Record<string, string> = {
        'page_view': 'PageView',
        'view_content': 'ViewContent',
        'add_to_cart': 'AddToCart',
        'purchase': 'Purchase',
        'search': 'Search',
        'lead': 'Lead',
        'complete_registration': 'CompleteRegistration'
      };
      
      const fbMethod = fbEventMap[action] ? 'track' : 'trackCustom';
      const fbEventName = fbEventMap[action] || action;
      
      window.fbq(fbMethod, fbEventName, {
        category,
        label,
        value,
        ...customParams
      });
      this.log('FB Event:', fbMethod, fbEventName, { category, label, value, ...customParams });
    }
  }
  
  /**
   * Track page views
   */
  trackPageView(path?: string, title?: string): void {
    const pageData = {
      page_path: path || window.location.pathname,
      page_title: title || document.title,
      page_location: window.location.href
    };
    
    if (window.gtag) {
      window.gtag('event', 'page_view', pageData);
      this.log('Page View:', pageData);
    }
    
    if (window.fbq) {
      window.fbq('track', 'PageView');
    }
  }
  
  /**
   * Track errors
   */
  trackError(error: ErrorEvent): void {
    const { error: err, errorInfo, fatal = false } = error;
    
    if (window.gtag) {
      window.gtag('event', 'exception', {
        description: err.message,
        fatal,
        error_stack: err.stack,
        ...(errorInfo && typeof errorInfo === 'object' ? errorInfo : {})
      });
    }
    
    if (window.fbq) {
      window.fbq('trackCustom', 'Error', {
        message: err.message,
        fatal,
        stack: err.stack,
        ...(errorInfo && typeof errorInfo === 'object' ? errorInfo : {})
      });
    }
    
    this.log('Error tracked:', err.message, { fatal, errorInfo });
  }
  
  /**
   * Track social interactions
   */
  trackSocial(platform: string, action: string, target?: string): void {
    this.track({
      action: 'social_interaction',
      category: 'social',
      label: platform,
      social_network: platform,
      social_action: action,
      social_target: target
    });
  }
  
  /**
   * Track music/platform interactions
   */
  trackMusic(platform: string, action: string, metadata?: Record<string, unknown>): void {
    this.track({
      action: `music_${action}`,
      category: 'music',
      label: platform,
      ...metadata
    });
    
    // Special Facebook Pixel event for music platforms
    if (window.fbq) {
      window.fbq('trackCustom', 'MusicPlatformClick', {
        platform,
        action,
        value: platform === 'spotify' || platform === 'apple' ? 1.0 : 0.5,
        currency: 'USD',
        ...metadata
      });
    }
  }
  
  /**
   * Track ecommerce events
   */
  trackEcommerce(action: string, data: Record<string, unknown>): void {
    const ecommerceEvents: Record<string, string> = {
      'view_item': 'view_item',
      'add_to_cart': 'add_to_cart',
      'remove_from_cart': 'remove_from_cart',
      'begin_checkout': 'begin_checkout',
      'purchase': 'purchase'
    };
    
    if (ecommerceEvents[action]) {
      // Google Analytics Enhanced Ecommerce
      if (window.gtag) {
        window.gtag('event', ecommerceEvents[action], {
          currency: data.currency || 'USD',
          value: data.value,
          items: data.items,
          ...data
        });
      }
      
      // Facebook Pixel Ecommerce
      if (window.fbq) {
        const fbEvents: Record<string, string> = {
          'view_item': 'ViewContent',
          'add_to_cart': 'AddToCart',
          'begin_checkout': 'InitiateCheckout',
          'purchase': 'Purchase'
        };
        
        window.fbq('track', fbEvents[action] || action, {
          currency: data.currency || 'USD',
          value: data.value,
          content_ids: (data.items as Array<{ id: string }> | undefined)?.map((i) => i.id),
          content_type: 'product',
          ...data
        });
      }
    } else {
      // Fallback to generic tracking
      this.track({
        action,
        category: 'ecommerce',
        ...data
      });
    }
  }
  
  /**
   * Track custom events
   */
  trackCustom(eventName: string, parameters?: Record<string, unknown>): void {
    if (window.gtag) {
      window.gtag('event', eventName, parameters);
    }
    
    if (window.fbq) {
      window.fbq('trackCustom', eventName, parameters);
    }
    
    this.log('Custom Event:', eventName, parameters);
  }
}

// Export singleton instance
export const analytics = Analytics.getInstance();

// Export convenience functions
export const trackEvent = (event: AnalyticsEvent) => analytics.track(event);
export const trackPageView = (path?: string, title?: string) => analytics.trackPageView(path, title);
export const trackError = (error: ErrorEvent) => analytics.trackError(error);
export const trackSocial = (platform: string, action: string, target?: string) => analytics.trackSocial(platform, action, target);
export const trackMusic = (platform: string, action: string, metadata?: Record<string, unknown>) => analytics.trackMusic(platform, action, metadata);
export const trackEcommerce = (action: string, data: Record<string, unknown>) => analytics.trackEcommerce(action, data);
export const trackCustom = (eventName: string, parameters?: Record<string, unknown>) => analytics.trackCustom(eventName, parameters);