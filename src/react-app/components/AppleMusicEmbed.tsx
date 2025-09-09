import React, { useState, useEffect, useCallback } from 'react';
import { LuMusic, LuExternalLink, LuPlus, LuPlay, LuLogIn } from 'react-icons/lu';
import { appleMusicKit } from '../utils/appleMusicKit';

interface AppleMusicEmbedProps {
  url: string; // Full Apple Music URL
  height?: number;
  theme?: 'light' | 'dark';
  affiliateToken?: string;
  campaignToken?: string;
}

const AppleMusicEmbed: React.FC<AppleMusicEmbedProps> = ({
  url,
  height = 360,
  theme = 'dark',
  affiliateToken = '',
  campaignToken = 'voices-of-judah'
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [musicKitReady, setMusicKitReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [musicKitError, setMusicKitError] = useState<string | null>(null);

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

  const handleAddToLibrary = async () => {
    trackEngagement('apple_music_add_library', { url });
    
    if (!musicKitReady) {
      // Fallback to web if MusicKit not available
      window.open(buildAffiliateLink('add'), '_blank', 'noopener,noreferrer');
      return;
    }

    setActionLoading(true);
    try {
      // Extract content ID from URL
      const content = appleMusicKit.extractIdFromUrl(url);
      if (!content) {
        // Fallback if we can't parse the URL
        window.open(buildAffiliateLink('add'), '_blank', 'noopener,noreferrer');
        return;
      }

      // Add to library using MusicKit
      await appleMusicKit.addToLibrary([content]);
      
      // Optional: Show success message
      console.log('Successfully added to Apple Music library');
    } catch (error) {
      console.error('Failed to add to library:', error);
      // Fallback to web on error
      window.open(buildAffiliateLink('add'), '_blank', 'noopener,noreferrer');
    } finally {
      setActionLoading(false);
    }
  };


  const handleSubscribe = () => {
    trackEngagement('apple_music_subscribe', { url });
    window.open('https://music.apple.com/subscribe', '_blank', 'noopener,noreferrer');
  };

  // If the embed doesn't finish loading within a grace window,
  // switch to a graceful fallback so we don't show an empty panel.
  useEffect(() => {
    const t = window.setTimeout(() => {
      if (!isLoaded) setShowFallback(true);
    }, 8000); // Increased timeout to 8 seconds for slower connections
    return () => window.clearTimeout(t);
  }, [isLoaded]);

  // Initialize MusicKit
  useEffect(() => {
    const initMusicKit = async () => {
      try {
        await appleMusicKit.loadMusicKit();
        setMusicKitReady(true);
        setIsAuthorized(appleMusicKit.isAuthorized());
      } catch (error) {
        console.error('MusicKit initialization failed:', error);
        setMusicKitError('Apple Music features unavailable');
      }
    };

    initMusicKit();

    // Listen for auth changes
    const unsubscribe = appleMusicKit.onAuthChange((authorized) => {
      setIsAuthorized(authorized);
    });

    return unsubscribe;
  }, []);


  const beginAuthorize = useCallback(async () => {
    setAuthLoading(true);
    try {
      const authorized = await appleMusicKit.authorize();
      if (!authorized) {
        setMusicKitError('Authorization failed');
      }
    } catch (error) {
      console.error('Authorization error:', error);
      setMusicKitError('Failed to authorize Apple Music');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  return (
    <div className={`apple-music-embed-container ${theme}`}>
      <div className="embed-header">
        <div className="platform-badge">
          <LuMusic size={16} />
          <span>Apple Music</span>
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleOpenInAppleMusic}
          aria-label="Open in Apple Music"
        >
          <LuExternalLink size={16} />
          Open in Apple Music
        </button>
      </div>

      <div className="apple-iframe-container">
        {!isLoaded && !showFallback && (
          <div className="embed-loading">
            <div className="spinner"></div>
            <p>Loading Apple Music player...</p>
          </div>
        )}
        {!showFallback && (
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
        )}

        {showFallback && (
          <div
            role="region"
            aria-label="Apple Music fallback"
            style={{
              display: 'grid',
              placeItems: 'center',
              height,
              background: 'hsl(var(--muted) / 0.35)',
              borderRadius: 8,
            }}
          >
            <div style={{ textAlign: 'center', color: 'hsl(var(--muted-foreground))' }}>
              <LuMusic size={36} />
              <p style={{ marginTop: 8 }}>Preview unavailable here.</p>
              <button className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleOpenInAppleMusic}>
                <LuExternalLink size={16} /> Open in Apple Music
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="embed-actions">
        {musicKitReady && !isAuthorized && (
          <button
            className="action-btn login-btn"
            onClick={beginAuthorize}
            aria-label="Authorize Apple Music"
            disabled={authLoading}
          >
            <LuLogIn size={18} />
            <span>{authLoading ? 'Authorizing...' : 'Authorize'}</span>
          </button>
        )}
        <button
          className="action-btn add-library-btn"
          onClick={handleAddToLibrary}
          aria-label="Add to Library"
          disabled={actionLoading}
        >
          <LuPlus size={18} />
          <span>{actionLoading ? 'Adding...' : 'Add to Library'}</span>
        </button>

        <button
          className="action-btn play-btn"
          onClick={handleOpenInAppleMusic}
          aria-label="Play in Apple Music"
        >
          <LuPlay size={18} />
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
        <p>Stream or purchase to support the artist</p>
        {musicKitError && (
          <p className="error-message" style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
            {musicKitError}
          </p>
        )}
      </div>
    </div>
  );
};

export default AppleMusicEmbed;
