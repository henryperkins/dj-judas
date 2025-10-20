/**
 * Spotify Embed Kit - Singleton manager for Spotify Embed IFrame API
 * Prevents multiple script loads and race conditions when using multiple embeds
 */

type SpotifyEmbedWindow = Window & {
  onSpotifyIframeApiReady?: () => void;
};

class SpotifyEmbedKitManager {
  private static instance: SpotifyEmbedKitManager;
  private embedReady = false;
  private loadingPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): SpotifyEmbedKitManager {
    if (!SpotifyEmbedKitManager.instance) {
      SpotifyEmbedKitManager.instance = new SpotifyEmbedKitManager();
    }
    return SpotifyEmbedKitManager.instance;
  }

  async loadEmbedAPI(): Promise<void> {
    if (this.embedReady) return;
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = new Promise((resolve, reject) => {
      // Check if already loaded
      const existing = document.querySelector('script[src*="spotify.com/embed/iframe-api"]');
      if (existing) {
        // Script exists, check if API is ready
        const spotifyWindow = window as SpotifyEmbedWindow;
        if (spotifyWindow.onSpotifyIframeApiReady) {
          this.embedReady = true;
          resolve();
          return;
        }
      }

      // Load Spotify Embed IFrame API
      const script = document.createElement('script');
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      script.onload = () => {
        // Script loaded successfully
        this.embedReady = true;
        resolve();
      };
      script.onerror = () => {
        reject(new Error('Failed to load Spotify Embed API'));
      };
      document.body.appendChild(script);
    });

    return this.loadingPromise;
  }

  isReady(): boolean {
    return this.embedReady;
  }
}

export const spotifyEmbedKit = SpotifyEmbedKitManager.getInstance();

// Export convenience function
export const loadSpotifyEmbedAPI = () => spotifyEmbedKit.loadEmbedAPI();
