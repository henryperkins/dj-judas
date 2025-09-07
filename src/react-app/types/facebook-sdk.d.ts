declare global {
  interface Window {
    // Facebook SDK bootstrap callback
    fbAsyncInit?: () => void;

    // Facebook SDK object (subset used by app)
    FB?: {
      init: (config: {
        appId?: string;
        cookie?: boolean;
        xfbml?: boolean;
        version: string;
        status?: boolean;
        autoLogAppEvents?: boolean;
      }) => void;
      AppEvents?: { logPageView: () => void };
      Event?: { subscribe: (event: string, callback: (response: unknown) => void) => void };
      XFBML?: { parse: (element?: HTMLElement) => void };
      ui?: (config: Record<string, unknown>, callback: (response: unknown) => void) => void;
    };

    // Meta Pixel
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;

    // Google Analytics gtag
    gtag?: (...args: unknown[]) => void;

    // Instagram embed helper
    instgrm?: { Embeds?: { process: () => void } };

    // Custom helper added at runtime by metaSdk
    trackMusicClick?: (platform: string) => void;

    // Older/mobile detection helpers referenced in code
    opera?: string;
    MSStream?: unknown;
  }
}

export {};
