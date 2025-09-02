import React, { useState, useEffect, useCallback } from 'react';
import { Music, ExternalLink, Plus, Play, LogIn } from 'lucide-react';
import './index.css';

interface AppleMusicEmbedProps {
  url: string; // Full Apple Music URL
  height?: number;
  theme?: 'light' | 'dark';
  affiliateToken?: string;
  campaignToken?: string;
}

const AppleMusicEmbed: React.FC<AppleMusicEmbedProps> = ({
  url,
  height = 450,
  theme = 'dark',
  affiliateToken = '',
  campaignToken = 'voices-of-judah'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [musicKitReady] = useState(false); // MusicKit disabled until token configured
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Extract the path from Apple Music URL
  const embedPath = url.replace('https://music.apple.com/', '');
  const embedSrc = `https://embed.music.apple.com/${embedPath}`;

  // Build affiliate link
  const buildAffiliateLink = (action: string) => {
    const link = url;
    const params = new URLSearchParams();

    if (affiliateToken) params.append('at', affiliateToken);
    if (campaignToken) params.append('ct', campaignToken);
    params.append('action', action);

    const queryString = params.toString();
    return queryString ? `${link}?${queryString}` : link;
  };

  const trackEngagement = (action: string, data: Record<string, unknown>) => {
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof window !== 'undefined' && win.gtag) {
      win.gtag('event', action, data);
    }
  };

  const handleOpenInAppleMusic = () => {
    trackEngagement('apple_music_open', { url });
    window.open(buildAffiliateLink('open'), '_blank', 'noopener,noreferrer');
  };

  const handleAddToLibrary = () => {
    trackEngagement('apple_music_add_library', { url });
    if (!isAuthorized || !musicKitReady) {
      window.open(buildAffiliateLink('add'), '_blank', 'noopener,noreferrer');
      return;
    }
    // Placeholder MusicKit library add (requires valid song/album IDs)
    setActionLoading(true);
    // Placeholder: MusicKit addToLibrary call would go here when IDs available
    Promise.resolve().finally(() => setActionLoading(false));
  };


  const handleSubscribe = () => {
    trackEngagement('apple_music_subscribe', { url });
    window.open('https://music.apple.com/subscribe', '_blank', 'noopener,noreferrer');
  };

  // Lazy-load MusicKit script (only if we might have a token)
  useEffect(() => {
    // Skip MusicKit loading if we know there's no token configured
    // This prevents the console error when Apple Music isn't set up
    const existing = document.querySelector('script[src*="musickit.js"]');
    if (existing) return;
    
    // Only load MusicKit if user wants to authorize (optional enhancement)
    // For now, we'll skip loading to prevent errors
    // const script = document.createElement('script');
    // script.src = 'https://js-cdn.music.apple.com/musickit/v1/musickit.js';
    // script.async = true;
    // script.onload = () => setMusicKitReady(true);
    // document.body.appendChild(script);
  }, []);

  // Initialize MusicKit when ready
  useEffect(() => {
  interface MKGlobal { MusicKit?: { configure: (cfg: Record<string, unknown>) => void; getInstance: () => { isAuthorized: boolean; authorize: () => Promise<string> } }; }
  const win = window as unknown as MKGlobal;
    if (!musicKitReady || !win.MusicKit) return;
    
    // Configure MusicKit with error handling
    try {
      win.MusicKit.configure({
        developerTokenFetcher: async () => {
          try {
            const res = await fetch('/api/apple/developer-token');
            if (!res.ok) {
              console.error('Failed to fetch Apple Music developer token:', res.status);
              throw new Error('Developer token unavailable');
            }
            const data = await res.json();
            if (!data.token) {
              console.error('Apple Music developer token is missing. Please configure APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY environment variables.');
              throw new Error('Developer token not configured');
            }
            return data.token;
          } catch (error) {
            console.error('Apple Music token fetch error:', error);
            throw error;
          }
        },
        app: { name: 'DJ Judas', build: '1.0.0' }
      });
      const mk = win.MusicKit.getInstance();
      setIsAuthorized(mk.isAuthorized);
    } catch (error) {
      console.error('Failed to configure MusicKit:', error);
      // MusicKit configuration failed, but don't break the component
    }
  }, [musicKitReady]);

  const beginAuthorize = useCallback(async () => {
  interface MKGlobal { MusicKit?: { getInstance: () => { authorize: () => Promise<string> } } }
  const win = window as unknown as MKGlobal;
    if (!win.MusicKit) return;
    setAuthLoading(true);
    try {
      const mk = win.MusicKit.getInstance();
      await mk.authorize();
      setIsAuthorized(true);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return (
    <div className={`apple-music-embed-container ${theme}`}>
      <div className="embed-header">
        <div className="platform-badge">
          <Music size={16} />
          <span>Apple Music</span>
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleOpenInAppleMusic}
          aria-label="Open in Apple Music"
        >
          <ExternalLink size={16} />
          Open in Apple Music
        </button>
      </div>

      <div className="apple-iframe-container">
        {!isLoaded && (
          <div className="embed-loading">
            <div className="spinner"></div>
            <p>Loading Apple Music player...</p>
          </div>
        )}
        <iframe
          allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
          height={height}
          style={{
            width: '100%',
            maxWidth: '100%',
            overflow: 'hidden',
            background: 'transparent',
            borderRadius: '8px'
          }}
          sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
          src={embedSrc}
          title="Apple Music player"
          loading="lazy"
          onLoad={() => setIsLoaded(true)}
        />
      </div>

      <div className="embed-actions">
        {musicKitReady && !isAuthorized && (
          <button
            className="action-btn login-btn"
            onClick={beginAuthorize}
            aria-label="Authorize Apple Music"
            disabled={authLoading}
          >
            <LogIn size={18} />
            <span>{authLoading ? 'Authorizing...' : 'Authorize'}</span>
          </button>
        )}
        <button
          className="action-btn add-library-btn"
          onClick={handleAddToLibrary}
          aria-label="Add to Library"
          disabled={actionLoading}
        >
          <Plus size={18} />
          <span>{actionLoading ? 'Adding...' : 'Add to Library'}</span>
        </button>

        <button
          className="action-btn play-btn"
          onClick={handleOpenInAppleMusic}
          aria-label="Play in Apple Music"
        >
          <Play size={18} />
          <span>Play Full Track</span>
        </button>

      </div>

      <div className="subscription-cta">
        <p>Not an Apple Music subscriber?</p>
        <button
          className="subscribe-btn"
          onClick={handleSubscribe}
        >
          Try Free for 3 Months
        </button>
      </div>

      <div className="streaming-cta">
        <p>🎵 Stream or purchase to support the artist</p>
      </div>
    </div>
  );
};

export default AppleMusicEmbed;
