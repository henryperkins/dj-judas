// Unified social-to-music conversion tracking system

interface SocialPlatform {
  id: string;
  name: string;
  followers: number;
  engagement: number;
  lastUpdated: Date;
}

interface ConversionPath {
  source: 'facebook' | 'instagram' | 'direct' | 'organic';
  medium: string;
  destination: 'spotify' | 'apple' | 'website';
  action: 'stream' | 'follow' | 'save' | 'purchase' | 'share';
}

class SocialMetricsTracker {
  private static instance: SocialMetricsTracker;
  private sessionId: string;
  private conversionPaths: ConversionPath[] = [];

  private constructor() {
    this.sessionId = this.generateSessionId();
    this.initializeTracking();
  }

  static getInstance(): SocialMetricsTracker {
    if (!SocialMetricsTracker.instance) {
      SocialMetricsTracker.instance = new SocialMetricsTracker();
    }
    return SocialMetricsTracker.instance;
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeTracking(): void {
    // Track UTM parameters from social sources
    const params = new URLSearchParams(window.location.search);
    const source = params.get('utm_source');
    const medium = params.get('utm_medium');
    const campaign = params.get('utm_campaign');

    if (source || medium || campaign) {
      this.trackEntry({
  source: (source as 'facebook' | 'instagram' | 'direct' | 'organic') || 'direct',
  medium: (medium as string) || 'organic',
        campaign
      });
    }

    // Set up visibility tracking for engagement time
    this.setupVisibilityTracking();
  }

  private setupVisibilityTracking(): void {
    let startTime = Date.now();
    let totalEngagementTime = 0;

    const trackEngagement = () => {
      if (document.visibilityState === 'visible') {
        startTime = Date.now();
      } else {
        totalEngagementTime += Date.now() - startTime;
        this.sendAnalytics('engagement_time', {
          duration: totalEngagementTime,
          session: this.sessionId
        });
      }
    };

    document.addEventListener('visibilitychange', trackEngagement);
    window.addEventListener('beforeunload', () => {
      totalEngagementTime += Date.now() - startTime;
      this.sendAnalytics('session_end', {
        totalEngagement: totalEngagementTime,
        conversions: this.conversionPaths.length
      });
    });
  }

  trackEntry(data: Record<string, unknown>): void {
    this.sendAnalytics('social_entry', {
      ...data,
      session: this.sessionId,
      timestamp: new Date().toISOString()
    });
  }

  trackSocialInteraction(platform: string, action: string, content?: Record<string, unknown>): void {
    const data = {
      platform,
      action,
      content,
      session: this.sessionId,
      timestamp: new Date().toISOString()
    };

    this.sendAnalytics('social_interaction', data);

    // Store interaction for conversion attribution
    if (typeof window !== 'undefined') {
      const interactions = JSON.parse(
        sessionStorage.getItem('social_interactions') || '[]'
      );
      interactions.push(data);
      sessionStorage.setItem('social_interactions', JSON.stringify(interactions));
    }
  }

  /**
   * Back-compat wrapper for generic social event tracking.
   * Re-implements the legacy `trackEvent` API expected by ShareButton
   * while routing through `trackSocialInteraction` to keep logic centralized.
   */
  trackEvent(data: { action: string; category: string; label: string; platform: string }): void {
    this.trackSocialInteraction(data.platform, data.action, {
      category: data.category,
      label: data.label
    });
  }

  trackMusicConversion(
    destination: string,
    action: string,
  trackInfo?: Record<string, unknown>
  ): void {
    // Get the last social interaction for attribution
    const interactions = JSON.parse(
      sessionStorage.getItem('social_interactions') || '[]'
    );
    const lastInteraction = interactions[interactions.length - 1];

    const conversion: ConversionPath = {
      source: (lastInteraction?.platform as ConversionPath['source']) || 'direct',
      medium: (lastInteraction?.action as string) || 'organic',
      destination: destination as ConversionPath['destination'],
      action: action as ConversionPath['action']
    };

    this.conversionPaths.push(conversion);

    this.sendAnalytics('music_conversion', {
      ...conversion,
      trackInfo,
      session: this.sessionId,
      interactionToConversion: lastInteraction
        ? Date.now() - new Date(lastInteraction.timestamp).getTime()
        : null
    });
  }

  calculateEngagementScore(metrics: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
    saves: number;
  }): number {
    // Weighted engagement score optimized for music discovery
    const weights = {
      views: 1,
      likes: 3,
      shares: 10, // Shares are most valuable for reach
      comments: 5,
      saves: 8    // Saves indicate intent to return
    };

    const score =
      (metrics.views * weights.views) +
      (metrics.likes * weights.likes) +
      (metrics.shares * weights.shares) +
      (metrics.comments * weights.comments) +
      (metrics.saves * weights.saves);

    return Math.round(score / metrics.views * 100) / 100; // Normalize by views
  }

  getConversionRate(): number {
    const interactions = JSON.parse(
      sessionStorage.getItem('social_interactions') || '[]'
    ).length;

    if (interactions === 0) return 0;
    return (this.conversionPaths.length / interactions) * 100;
  }

  private sendAnalytics(event: string, data: Record<string, unknown>): void {
    // Import analytics at runtime to avoid circular dependency
    import('../../../utils/analytics').then(({ trackCustom }) => {
      trackCustom(event, {
        event_category: 'Social to Music Funnel',
        ...data
      });
    }).catch(err => {
      console.error('Failed to load analytics:', err);
    });

    // Log for debugging
    console.log(`[Analytics] ${event}:`, data);
  }

  // Get aggregated social proof metrics
  async getAggregatedMetrics(): Promise<{
    totalReach: number;
    platforms: SocialPlatform[];
    topConversionSource: string;
    conversionRate: number;
  }> {
    try {
      const res = await fetch('/api/metrics', { headers: { 'Accept': 'application/json' } });
      if (!res.ok) throw new Error('Failed metrics fetch');
      const data = await res.json() as { platforms?: unknown[]; totalReach?: number; topConversionSource?: string };
      const platforms: SocialPlatform[] = (data.platforms || []).map((p) => {
        const item = p as { id: string; name: string; followers: number; engagement: number; lastUpdated: string };
        return {
          id: item.id,
          name: item.name,
            followers: item.followers,
          engagement: item.engagement,
          lastUpdated: new Date(item.lastUpdated)
        };
      });
      return {
        totalReach: data.totalReach || 0,
        platforms,
        topConversionSource: data.topConversionSource || 'unknown',
        conversionRate: this.getConversionRate()
      };
  } catch {
      // Fallback to minimal defaults
      return {
        totalReach: 0,
        platforms: [],
        topConversionSource: 'unknown',
        conversionRate: this.getConversionRate()
      };
    }
  }
}

export const socialMetrics = SocialMetricsTracker.getInstance();

// Helper functions for common tracking patterns
export const trackSocialClick = (platform: string, contentType: string) => {
  socialMetrics.trackSocialInteraction(platform, 'click', { contentType });
};

export const trackMusicAction = (
  platform: string,
  action: 'play' | 'save' | 'follow' | 'purchase',
  track?: string
) => {
  socialMetrics.trackMusicConversion(platform, action, { track });
};

export const generateSocialLink = (
  destination: string,
  source: string,
  medium: string,
  campaign?: string
): string => {
  const params = new URLSearchParams({
    utm_source: source,
    utm_medium: medium,
    ...(campaign && { utm_campaign: campaign })
  });

  return `${destination}?${params.toString()}`;
};
