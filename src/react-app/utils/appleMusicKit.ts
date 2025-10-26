import { socialMetrics } from '../components/social/utils/socialMetrics';

interface MusicKitInstance {
  isAuthorized: boolean;
  musicUserToken?: string;
  authorize(): Promise<string>;
  unauthorize(): Promise<void>;
  addEventListener(eventName: string, handler: () => void): void;
  removeEventListener(eventName: string, handler: () => void): void;
  api: {
    music: (
      path: string,
      params?: Record<string, string | number>
    ) => Promise<unknown>;
    library: {
      add: (items: { id: string; type: string }[]) => Promise<void>;
      remove: (items: { id: string; type: string }[]) => Promise<void>;
    };
  };
  player: {
    play(): Promise<void>;
    pause(): void;
    stop(): void;
    queue: {
      prepend: (items: unknown) => Promise<void>;
    };
  };
}

interface MusicKitGlobal {
  MusicKit?: {
    configure(config: {
      developerTokenFetcher: () => Promise<string>;
      app: { name: string; build: string };
      storefrontId?: string;
    }): void;
    getInstance(): MusicKitInstance;
    Events?: {
      authorizationStatusDidChange: string;
      playbackStateDidChange: string;
    };
  };
}

class AppleMusicKitManager {
  private static instance: AppleMusicKitManager;
  private musicKitReady = false;
  private musicKit: MusicKitInstance | null = null;
  private developerToken: string | null = null;
  private tokenExpiry: number | null = null;
  private loadingPromise: Promise<void> | null = null;
  private authCallbacks: Set<(authorized: boolean) => void> = new Set();

  private constructor() {}

  static getInstance(): AppleMusicKitManager {
    if (!AppleMusicKitManager.instance) {
      AppleMusicKitManager.instance = new AppleMusicKitManager();
    }
    return AppleMusicKitManager.instance;
  }

  async loadMusicKit(): Promise<void> {
    if (this.musicKitReady) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      const existing = document.querySelector('script[src*="musickit.js"]');
      if (existing) {
        this.initializeMusicKit().then(resolve).catch(reject);
        return;
      }

      // Load MusicKit.js
      const script = document.createElement('script');
      script.src = 'https://js-cdn.music.apple.com/musickit/v3/musickit.js';
      script.async = true;
      script.onload = () => {
        this.initializeMusicKit().then(resolve).catch(reject);
      };
      script.onerror = () => {
        reject(new Error('Failed to load MusicKit.js'));
      };
      document.head.appendChild(script);
    });

    return this.loadingPromise;
  }

  /**
   * Fetch with exponential backoff retry logic
   */
  private async fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const res = await fetch(url);

        // If successful or client error (4xx), return immediately
        if (res.ok || (res.status >= 400 && res.status < 500)) {
          return res;
        }

        // Server error (5xx) - retry if not last attempt
        if (res.status >= 500 && attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000); // Max 5 second delay
          console.warn(`Apple Music token fetch failed (${res.status}), retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }

        return res;
      } catch (error) {
        // Network error - retry if not last attempt
        if (attempt < maxRetries - 1) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 5000);
          console.warn(`Network error fetching Apple Music token, retrying in ${delay}ms...`, error);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw error;
      }
    }

    throw new Error('Max retries exceeded');
  }

  private async fetchDeveloperToken(): Promise<string> {
    // Check cached token
    if (this.developerToken && this.tokenExpiry && Date.now() < this.tokenExpiry) {
      return this.developerToken;
    }

    try {
      const res = await this.fetchWithRetry('/api/apple/developer-token', 3);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({})) as { message?: string };
        throw new Error(errorData.message || `Failed to fetch developer token: ${res.status}`);
      }

      const data = await res.json() as { token?: string; error?: string; message?: string };

      if (data.error) {
        throw new Error(data.message || 'Apple Music configuration error');
      }

      if (!data.token) {
        throw new Error('Developer token not configured on server');
      }

      // SECURITY: Validate JWT structure before using
      const parts = data.token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT token format received from server');
      }

      try {
        // Decode JWT payload to check expiry (without verifying signature - server already signed it)
        const payload = JSON.parse(atob(parts[1]));

        if (!payload.exp || typeof payload.exp !== 'number') {
          throw new Error('Invalid JWT: missing expiry claim');
        }

        // Check if token is expired or expiring soon (within 1 minute)
        const expiryMs = payload.exp * 1000;
        if (expiryMs < Date.now() + 60000) {
          throw new Error('Token expired or expiring soon');
        }

        this.developerToken = data.token;
        // Cache for 1h 50min (token is valid for 2 hours, cache slightly less to avoid edge cases)
        this.tokenExpiry = expiryMs - 60000; // Use actual expiry minus 1min buffer

        return data.token;
      } catch (error) {
        if (error instanceof Error && error.message.includes('Token expired')) {
          throw error;
        }
        throw new Error('Failed to parse JWT token from server');
      }
    } catch (error) {
      console.error('Apple Music developer token fetch error:', error);
      // Provide more user-friendly error message
      if (error instanceof Error) {
        if (error.message.includes('not configured')) {
          throw new Error('Apple Music integration is not configured. Please contact the site administrator.');
        }
        if (error.message.includes('placeholder values')) {
          throw new Error('Apple Music credentials need to be set up. Please contact the site administrator.');
        }
      }
      throw new Error('Failed to initialize Apple Music. Please try again later.');
    }
  }

  private async initializeMusicKit(): Promise<void> {
    const win = window as unknown as MusicKitGlobal;

    if (!win.MusicKit) {
      throw new Error('MusicKit not available');
    }

    try {
      win.MusicKit.configure({
        developerTokenFetcher: () => this.fetchDeveloperToken(),
        app: {
          name: 'DJ Lee & Voices of Judah',
          build: '1.0.0'
        }
      });

      this.musicKit = win.MusicKit.getInstance();

      // Only proceed if we successfully got the instance
      if (!this.musicKit) {
        throw new Error('Failed to get MusicKit instance');
      }

      this.musicKitReady = true;

      // Listen for authorization changes - check Events exists and musicKit is valid
      if (win.MusicKit.Events && this.musicKit.addEventListener) {
        this.musicKit.addEventListener(
          win.MusicKit.Events.authorizationStatusDidChange,
          this.handleAuthChange.bind(this)
        );
      }

      // Track initialization
      socialMetrics.trackEntry({ source: 'appleMusic', medium: 'sdk_load' });
    } catch (error) {
      console.error('Failed to configure MusicKit:', error);
      // Clear any partial initialization state
      this.musicKit = null;
      this.musicKitReady = false;
      throw error;
    }
  }

  private handleAuthChange(): void {
    const authorized = this.musicKit?.isAuthorized || false;
    this.authCallbacks.forEach(cb => cb(authorized));

    if (authorized) {
      socialMetrics.trackSocialInteraction('appleMusic', 'authorize', {});
    }
  }

  onAuthChange(callback: (authorized: boolean) => void): () => void {
    this.authCallbacks.add(callback);
    return () => this.authCallbacks.delete(callback);
  }

  async authorize(): Promise<boolean> {
    if (!this.musicKit) {
      await this.loadMusicKit();
    }

    if (!this.musicKit) {
      throw new Error('MusicKit not initialized');
    }

    if (this.musicKit.isAuthorized) {
      return true;
    }

    try {
      await this.musicKit.authorize();
      return true;
    } catch (error) {
      console.error('Apple Music authorization failed:', error);
      return false;
    }
  }

  async unauthorize(): Promise<void> {
    if (!this.musicKit) return;

    try {
      await this.musicKit.unauthorize();
    } catch (error) {
      console.error('Failed to unauthorize:', error);
    }
  }

  isAuthorized(): boolean {
    return this.musicKit?.isAuthorized || false;
  }

  async addToLibrary(items: { id: string; type: 'songs' | 'albums' | 'playlists' }[]): Promise<void> {
    if (!this.musicKit) {
      throw new Error('MusicKit not initialized');
    }

    if (!this.musicKit.isAuthorized) {
      const authorized = await this.authorize();
      if (!authorized) {
        throw new Error('User authorization required');
      }
    }

    try {
      await this.musicKit.api.library.add(items);

      // Track successful library addition
      socialMetrics.trackSocialInteraction('appleMusic', 'add_library', {
        items: items.map(i => `${i.type}:${i.id}`).join(',')
      });
    } catch (error) {
      console.error('Failed to add to library:', error);
      throw error;
    }
  }

  async removeFromLibrary(items: { id: string; type: 'songs' | 'albums' | 'playlists' }[]): Promise<void> {
    if (!this.musicKit || !this.musicKit.isAuthorized) {
      throw new Error('Not authorized');
    }

    try {
      await this.musicKit.api.library.remove(items);
    } catch (error) {
      console.error('Failed to remove from library:', error);
      throw error;
    }
  }

  async play(contentId?: string, contentType?: 'song' | 'album' | 'playlist'): Promise<void> {
    if (!this.musicKit) {
      throw new Error('MusicKit not initialized');
    }

    try {
      if (contentId && contentType) {
        // Queue specific content
        await this.musicKit.player.queue.prepend({
          [contentType]: contentId
        });
      }

      await this.musicKit.player.play();

      // Track playback
      socialMetrics.trackSocialInteraction('appleMusic', 'play', {
        contentId,
        contentType
      });
    } catch (error) {
      console.error('Failed to play:', error);
      throw error;
    }
  }

  pause(): void {
    if (!this.musicKit) return;
    this.musicKit.player.pause();
  }

  stop(): void {
    if (!this.musicKit) return;
    this.musicKit.player.stop();
  }

  // Extract Apple Music ID from URL
  extractIdFromUrl(url: string): { id: string; type: 'songs' | 'albums' | 'playlists' } | null {
    // Strip query parameters first to handle URLs like ?i=456&at=1000l3K
    const cleanUrl = url.split('?')[0];
    const match = cleanUrl.match(/music\.apple\.com\/[^/]+\/(album|playlist|song)\/[^/]+\/(?:pl\.)?([a-zA-Z0-9]+)/);
    if (!match) return null;

    let type: 'songs' | 'albums' | 'playlists';
    switch (match[1]) {
      case 'song':
        type = 'songs';
        break;
      case 'album':
        type = 'albums';
        break;
      case 'playlist':
        type = 'playlists';
        break;
      default:
        return null;
    }

    return { id: match[2], type };
  }

  // Search Apple Music catalog
  async search(term: string, types: string[] = ['songs', 'albums', 'artists']): Promise<unknown> {
    if (!this.musicKit) {
      throw new Error('MusicKit not initialized');
    }

    try {
      const results = await this.musicKit.api.music('/v1/catalog/us/search', {
        term,
        types: types.join(','),
        limit: 25
      });

      return results;
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }
}

export const appleMusicKit = AppleMusicKitManager.getInstance();

// Export convenience functions
export const loadAppleMusicKit = () => appleMusicKit.loadMusicKit();
export const authorizeAppleMusic = () => appleMusicKit.authorize();
export const addToAppleMusicLibrary = (items: { id: string; type: 'songs' | 'albums' | 'playlists' }[]) =>
  appleMusicKit.addToLibrary(items);
export const playAppleMusic = (contentId?: string, contentType?: 'song' | 'album' | 'playlist') =>
  appleMusicKit.play(contentId, contentType);
