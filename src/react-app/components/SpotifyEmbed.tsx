import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ExternalLink, Music, Play, LogIn } from 'lucide-react';

interface SpotifyEmbedProps {
  url?: string; // Full Spotify URL or URI format
  uri?: string; // Legacy support for spotify:track:ID format
  compact?: boolean;
  theme?: 'light' | 'dark';
  onPlay?: () => void;
}

const SpotifyEmbed: React.FC<SpotifyEmbedProps> = ({
  url,
  uri,
  compact = false,
  theme = 'dark',
  onPlay
}) => {
  // Normalize input to URI format
  const spotifyUri = uri || (url ? normalizeToSpotifyUri(url) : '');
  const embedRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  interface SpotifyEmbedController {
    togglePlay: () => void;
    addListener: (event: string, cb: (e: { data: { isPaused: boolean } }) => void) => void;
  }
  const [controller, setController] = useState<SpotifyEmbedController | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  const spotifyId = spotifyUri.split(':').pop();
  const contentType = spotifyUri.includes('track') ? 'track' : spotifyUri.includes('album') ? 'album' : 'artist';

  const spotifyUrl = `https://open.spotify.com/${contentType}/${spotifyId}`;
  const embedHeight = compact ? 152 : contentType === 'album' ? 380 : 232;

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;

    script.onload = () => {
  type IFrameAPIType = { createController: (el: HTMLElement, opts: Record<string, unknown>, cb: (ctrl: SpotifyEmbedController) => void) => void };
  (window as unknown as { onSpotifyIframeApiReady?: (api: IFrameAPIType) => void }).onSpotifyIframeApiReady = (IFrameAPI: IFrameAPIType) => {
        if (!embedRef.current) return;

        const options = {
          uri: spotifyUri,
          width: '100%',
          height: embedHeight,
          theme: theme === 'dark' ? 0 : 1,
        };

        IFrameAPI.createController(embedRef.current, options, (EmbedController) => {
          setController(EmbedController);
          setIsLoaded(true);

          EmbedController.addListener('playback_update', (e) => {
            if (e.data.isPaused === false && onPlay) {
              onPlay();
              trackEngagement('spotify_play', { uri: spotifyUri, contentType });
            }
          });

          // Ensure the generated iframe has an accessible title
          setTimeout(() => {
            const iframe = embedRef.current?.querySelector('iframe');
            if (iframe && !iframe.getAttribute('title')) {
              iframe.setAttribute('title', 'Spotify player');
            }
          }, 0);
        });
      };
    };

    document.body.appendChild(script);
    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [spotifyUri, embedHeight, theme, onPlay, contentType]);

  // Fallback: try setting the iframe title when load state changes
  useEffect(() => {
    if (!isLoaded) return;
    const iframe = embedRef.current?.querySelector('iframe');
    if (iframe && !iframe.getAttribute('title')) {
      iframe.setAttribute('title', 'Spotify player');
    }
  }, [isLoaded]);

  // Check session status
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      try {
        const res = await fetch('/api/spotify/session');
        if (!cancelled) {
          const data = await res.json();
            setIsAuthed(Boolean(data.authenticated));
        }
      } catch {
        if (!cancelled) setIsAuthed(false);
      } finally {
        if (!cancelled) setAuthChecking(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const beginLogin = useCallback(async () => {
    const res = await fetch('/api/spotify/login');
    const data = await res.json();
    if (data.authorizeUrl) {
      window.location.href = data.authorizeUrl;
    }
  }, []);

  const trackEngagement = (action: string, data: Record<string, unknown>) => {
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof window !== 'undefined' && win.gtag) {
      win.gtag('event', action, data);
    }
  };

  const handleSpotifyOpen = () => {
    trackEngagement('spotify_open', { uri: spotifyUri, contentType });
    window.open(spotifyUrl, '_blank', 'noopener,noreferrer');
  };



  return (
    <div 
      className={`spotify-embed-container ${compact ? 'compact' : ''} ${theme}`}
      aria-label="Spotify player"
    >
      <div className="embed-header">
        <div className="platform-badge">
          <Music size={16} />
          <span>Spotify</span>
        </div>
        <button
          className="open-spotify-btn"
          onClick={handleSpotifyOpen}
          aria-label="Open in Spotify"
        >
          <ExternalLink size={16} />
          Open in Spotify
        </button>
      </div>

      <div ref={embedRef} className="spotify-iframe-container">
        {!isLoaded && (
          <div className="embed-loading">
            <div className="loading-spinner"></div>
            <p>Loading Spotify player...</p>
          </div>
        )}
      </div>

      <div className="embed-actions">
        {authChecking ? (
          <div className="auth-status">Checking session...</div>
        ) : !isAuthed ? (
          <button className="action-btn login-btn" onClick={beginLogin} aria-label="Login with Spotify">
            <LogIn size={18} />
            <span>Login to Enable Actions</span>
          </button>
        ) : (
          <>
            <button
              className="action-btn play-btn"
              onClick={() => controller?.togglePlay()}
              aria-label="Play on Spotify"
            >
              <Play size={18} />
              <span>Play Full Track</span>
            </button>
          </>
        )}
      </div>

      <div className="streaming-cta">
        <p>🎵 Stream on Spotify to support the artist</p>
      </div>
    </div>
  );
};

// Helper function to normalize URLs/URIs
function normalizeToSpotifyUri(urlOrUri: string): string {
  // If it's already a URI, return as-is
  if (urlOrUri.startsWith('spotify:')) {
    return urlOrUri;
  }
  
  // Convert URL to URI format
  const match = urlOrUri.match(/open\.spotify\.com\/(?:embed\/)?(\w+)\/([a-zA-Z0-9]+)/);
  if (match) {
    const [, type, id] = match;
    return `spotify:${type}:${id}`;
  }
  
  return urlOrUri;
}

export default SpotifyEmbed;
