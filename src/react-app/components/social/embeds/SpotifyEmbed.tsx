import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LuExternalLink, LuMusic, LuPlay, LuPause, LuLogIn, LuHeart, LuShare2 } from 'react-icons/lu';
import { socialMetrics } from '../utils/socialMetrics';
import { loadSpotifyEmbedAPI, type SpotifyIFrameController } from '@/react-app/utils/spotifyEmbedKit';

interface SpotifyEmbedProps {
  url?: string; // Full Spotify URL or URI format
  uri?: string; // Legacy support for spotify:track:ID format
  compact?: boolean;
  theme?: 'light' | 'dark';
  onPlay?: () => void;
  hideHeader?: boolean; // when true, omit the internal header so parent can supply brand CTA
}

interface SpotifySessionResponse {
  authenticated: boolean;
}

interface SpotifyLoginResponse {
  authorizeUrl?: string;
}

const SpotifyEmbed: React.FC<SpotifyEmbedProps> = ({
  url,
  uri,
  compact = false,
  theme = 'dark',
  onPlay,
  hideHeader = false
}) => {
  // Normalize input to URI format
  const spotifyUri = uri || (url ? normalizeToSpotifyUri(url) : '');
  const embedRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  interface SpotifyPlaybackData {
    isPaused: boolean;
    position?: number;
    duration?: number;
    track_window?: {
      current_track?: {
        name: string;
        duration_ms?: number;
        artists?: Array<{ name: string }>;
      };
    };
  }

  const [controller, setController] = useState<SpotifyIFrameController | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  interface TrackInfo {
    name: string;
    artists?: Array<{ name: string }>;
    duration_ms?: number;
  }
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDone, setFollowDone] = useState(false);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const spotifyId = spotifyUri.split(':').pop();
  const contentType = spotifyUri.includes('track') ? 'track' : spotifyUri.includes('album') ? 'album' : 'artist';

  const spotifyUrl = `https://open.spotify.com/${contentType}/${spotifyId}`;
  const embedHeight = compact ? 152 : contentType === 'album' ? 380 : 232;

  useEffect(() => {
    let cancelled = false;
    let localController: SpotifyIFrameController | null = null;
    let playbackHandler: ((e: { data: SpotifyPlaybackData }) => void) | null = null;
    let readyHandler: ((e: { data: SpotifyPlaybackData }) => void) | null = null;

    const initEmbed = async () => {
      try {
        const iframeApi = await loadSpotifyEmbedAPI();
        if (!embedRef.current || cancelled) return;

        const options = {
          uri: spotifyUri,
          width: '100%',
          height: embedHeight,
          theme: theme === 'dark' ? 0 : 1,
        };

        iframeApi.createController(embedRef.current, options, (EmbedController) => {
          if (cancelled) {
            EmbedController.destroy();
            return;
          }

          setController(EmbedController);
          localController = EmbedController;
          setIsLoaded(true);

          // Listen to playback updates
          playbackHandler = (e) => {
            setIsPlaying(!e.data.isPaused);
            setTrackInfo(e.data.track_window?.current_track || null);
            // Try reading position/duration from event (ms), fallback to track info
            const posMs = (e.data.position ?? 0) as number;
            const durMs = (e.data.duration ?? e.data.track_window?.current_track?.duration_ms ?? 0) as number;
            if (!seeking) setPositionSec(Math.max(0, Math.floor(posMs / 1000)));
            setDurationSec(Math.max(0, Math.floor(durMs / 1000)));
            if (e.data.isPaused === false && onPlay) {
              onPlay();
              trackEngagement('spotify_play', { uri: spotifyUri, contentType });
            }
          };
          EmbedController.addListener('playback_update', playbackHandler as (e: { data: unknown }) => void);

          // Listen to ready state
          readyHandler = () => { console.log('Spotify player ready'); };
          EmbedController.addListener('ready', readyHandler as (e: { data: unknown }) => void);

          // Ensure the generated iframe has an accessible title
          setTimeout(() => {
            const iframe = embedRef.current?.querySelector('iframe');
            if (iframe && !iframe.getAttribute('title')) {
              iframe.setAttribute('title', 'Spotify player');
            }
          }, 0);
        });
      } catch (error) {
        console.error('Failed to load Spotify Embed API:', error);
      }
    };

    initEmbed();

    return () => {
      cancelled = true;
      try {
        if (localController) {
          if (playbackHandler) localController.removeListener('playback_update', playbackHandler as (e: { data: unknown }) => void);
          if (readyHandler) localController.removeListener('ready', readyHandler as (e: { data: unknown }) => void);
          localController.destroy();
        }
      } catch {
        // Intentionally empty: suppress any errors during cleanup
      }
    };
  }, [spotifyUri, embedHeight, theme, onPlay, contentType, seeking]);

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
          const data = await res.json() as SpotifySessionResponse;
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
    const data = await res.json() as SpotifyLoginResponse;
    if (data.authorizeUrl) {
      window.location.href = data.authorizeUrl;
    }
  }, []);

  const trackEngagement = (action: string, data: Record<string, unknown>) => {
    // Use centralized socialMetrics instead of direct gtag
    socialMetrics.trackSocialInteraction('spotify', action, data);
  };

  const handleSpotifyOpen = () => {
    trackEngagement('spotify_open', { uri: spotifyUri, contentType });
    window.open(spotifyUrl, '_blank', 'noopener,noreferrer');
  };

  const handleSave = async () => {
    if (!spotifyId) return;
    setIsSaving(true);
    setSaveDone(false);
    try {
      const type = contentType === 'album' ? 'albums' : 'tracks';
      const res = await fetch('/api/spotify/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [spotifyId], type })
      });
      if (!res.ok) throw new Error(`save_failed_${res.status}`);
      setSaveDone(true);
      trackEngagement('spotify_save', { uri: spotifyUri, contentType });
    } catch (e) {
      console.error('Spotify save error:', e);
      alert('Could not save on Spotify. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFollow = async () => {
    if (contentType !== 'artist' || !spotifyId) return;
    setIsFollowing(true);
    setFollowDone(false);
    try {
      const res = await fetch('/api/spotify/follow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistIds: [spotifyId] })
      });
      if (!res.ok) throw new Error(`follow_failed_${res.status}`);
      setFollowDone(true);
      trackEngagement('spotify_follow', { uri: spotifyUri });
    } catch (e) {
      console.error('Spotify follow error:', e);
      alert('Could not follow on Spotify. Please try again.');
    } finally {
      setIsFollowing(false);
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };



  return (
    <div className="spotify-embed-wrapper">
      {!hideHeader && (
      <div className="embed-header">
        <div className="platform-badge">
          <LuMusic size={16} />
          <span>Spotify</span>
        </div>
        <button
          className="btn btn-ghost"
          onClick={handleSpotifyOpen}
          aria-label="Open in Spotify"
        >
          <LuExternalLink size={16} />
          <span>Open in Spotify</span>
        </button>
      </div>
      )}

      <div 
        className={`spotify-embed-container ${compact ? 'compact' : ''} ${theme}`}
      >
        <div ref={embedRef} className="spotify-iframe-container">
          {!isLoaded && (
            <div className="embed-loading" style={{ height: embedHeight }} role="status" aria-live="polite">
              <div className="loading-spinner loading-spinner--large" aria-hidden="true" />
              <p>Loading Spotify player...</p>
            </div>
          )}
        </div>

        {isLoaded && controller && (
          <>
            <div className="embed-controls">
              <button
                className="control-btn play-pause"
                onClick={() => controller?.togglePlay()}
                aria-label="Toggle playback"
              >
                {isPlaying ? <LuPause size={20} /> : <LuPlay size={20} />}
              </button>
            </div>

            {durationSec > 0 && (
              <div className="progress-container" aria-label="Playback progress">
                <div className="progress-time">
                  <span className="current">{formatTime(positionSec)}</span>
                  <span className="duration">{formatTime(durationSec)}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={Math.max(1, durationSec)}
                  value={Math.min(positionSec, durationSec)}
                  onChange={(e) => setPositionSec(Number((e.target as HTMLInputElement).value))}
                  onMouseDown={() => setSeeking(true)}
                  onTouchStart={() => setSeeking(true)}
                  onMouseUp={(e) => {
                    const v = Number((e.target as HTMLInputElement).value);
                    controller.seek(v * 1000);
                    setSeeking(false);
                  }}
                  onTouchEnd={(e) => {
                    const v = Number((e.target as HTMLInputElement).value);
                    controller.seek(v * 1000);
                    setSeeking(false);
                  }}
                  aria-valuemin={0}
                  aria-valuemax={durationSec}
                  aria-valuenow={positionSec}
                />
              </div>
            )}
          </>
        )}
      </div>

      <div className="embed-actions">
        {authChecking ? (
          <div className="auth-status">Checking session...</div>
        ) : !isAuthed ? (
          <button className="action-btn login-btn" onClick={beginLogin} aria-label="Login with Spotify">
            <LuLogIn size={18} />
            <span>Connect Spotify Account</span>
          </button>
        ) : (
          <div className="spotify-actions">
            <button
              className="action-btn save-btn"
              onClick={handleSave}
              aria-label="Save to library"
              disabled={isSaving}
            >
              <LuHeart size={18} />
              <span>{isSaving ? 'Saving…' : saveDone ? 'Saved' : 'Save'}</span>
            </button>
            {contentType === 'artist' && (
              <button
                className="action-btn follow-btn"
                onClick={handleFollow}
                aria-label="Follow artist"
                disabled={isFollowing}
              >
                <LuHeart size={18} />
                <span>{isFollowing ? 'Following…' : followDone ? 'Following' : 'Follow'}</span>
              </button>
            )}
            <button 
              className="action-btn share-btn"
              onClick={() => {
                navigator.clipboard.writeText(spotifyUrl);
                trackEngagement('spotify_share', { uri: spotifyUri });
              }}
              aria-label="Share"
            >
              <LuShare2 size={18} />
              <span>Share</span>
            </button>
          </div>
        )}
      </div>
      
      {trackInfo && (
        <div className="track-metadata">
          <p className="track-name">{trackInfo.name}</p>
          <p className="artist-name">{trackInfo.artists?.map((a: { name: string }) => a.name).join(', ')}</p>
        </div>
      )}

      <div className="streaming-cta">
        <p>Stream on Spotify to support the artist</p>
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
