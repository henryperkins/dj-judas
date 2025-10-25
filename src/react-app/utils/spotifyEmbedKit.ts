/**
 * Spotify Embed Kit - Singleton manager for Spotify Embed IFrame API
 * Prevents multiple script loads and race conditions when using multiple embeds
 */

export interface SpotifyIFrameController {
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  resume?: () => void;
  seek: (milliseconds: number) => void;
  nextTrack?: () => void;
  previousTrack?: () => void;
  destroy: () => void;
  addListener: (event: string, cb: (e: { data: unknown }) => void) => void;
  removeListener: (event: string, cb: (e: { data: unknown }) => void) => void;
}

export interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: Record<string, unknown>,
    callback: (controller: SpotifyIFrameController) => void
  ) => void;
}

type SpotifyEmbedWindow = Window & {
  onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  SpotifyIframe?: SpotifyIFrameAPI;
};

class SpotifyEmbedKitManager {
  private static instance: SpotifyEmbedKitManager;
  private embedReady = false;
  private loadingPromise: Promise<SpotifyIFrameAPI> | null = null;
  private api: SpotifyIFrameAPI | null = null;

  private constructor() {}

  static getInstance(): SpotifyEmbedKitManager {
    if (!SpotifyEmbedKitManager.instance) {
      SpotifyEmbedKitManager.instance = new SpotifyEmbedKitManager();
    }
    return SpotifyEmbedKitManager.instance;
  }

  async loadEmbedAPI(): Promise<SpotifyIFrameAPI> {
    if (this.api) return Promise.resolve(this.api);
    if (this.loadingPromise) return this.loadingPromise;

    this.loadingPromise = new Promise((resolve, reject) => {
      const spotifyWindow = window as SpotifyEmbedWindow;

      const resolveWithApi = (api: SpotifyIFrameAPI) => {
        this.api = api;
        this.embedReady = true;
        this.loadingPromise = Promise.resolve(api);
        spotifyWindow.onSpotifyIframeApiReady = undefined;
        resolve(api);
      };

      // If the API is already present on the window, resolve immediately.
      if (spotifyWindow.SpotifyIframe) {
        resolveWithApi(spotifyWindow.SpotifyIframe);
        return;
      }

      spotifyWindow.onSpotifyIframeApiReady = (api) => {
        resolveWithApi(api);
      };

      const existingScript = document.querySelector<HTMLScriptElement>('script[src*="spotify.com/embed/iframe-api"]');
      if (existingScript) {
        // Script is already loading/loaded; the ready handler above will resolve when it fires.
        return;
      }

      // Append the Spotify IFrame API script once.
      const script = document.createElement('script');
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      script.onerror = () => {
        this.loadingPromise = null;
        spotifyWindow.onSpotifyIframeApiReady = undefined;
        reject(new Error('Failed to load Spotify Embed API'));
      };
      document.body.appendChild(script);
    });

    return this.loadingPromise;
  }

  isReady(): boolean {
    return this.embedReady;
  }

  getAPI(): SpotifyIFrameAPI | null {
    return this.api;
  }
}

export const spotifyEmbedKit = SpotifyEmbedKitManager.getInstance();

// Export convenience function
export const loadSpotifyEmbedAPI = () => spotifyEmbedKit.loadEmbedAPI();
