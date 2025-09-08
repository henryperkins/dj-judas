import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LuExternalLink, LuMusic, LuPlay, LuPause, LuLogIn, LuHeart, LuShare2 } from 'react-icons/lu';

interface SpotifyEmbedProps {
  url?: string; // Full Spotify URL or URI format
  uri?: string; // Legacy support for spotify:track:ID format
  compact?: boolean;
  theme?: 'light' | 'dark';
  onPlay?: () => void;
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
  onPlay
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

  interface SpotifyEmbedController {
    togglePlay: () => void;
    play: () => void;
    pause: () => void;
    resume: () => void;
    seek: (seconds: number) => void;
    destroy: () => void;
    addListener: (event: string, cb: (e: { data: SpotifyPlaybackData }) => void) => void;
    removeListener: (event: string, cb: (e: { data: SpotifyPlaybackData }) => void) => void;
  }
  const [controller, setController] = useState<SpotifyEmbedController | null>(null);
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
    const script = document.createElement('script');
    script.src = 'https://open.spotify.com/embed/iframe-api/v1';
    script.async = true;
    let localController: SpotifyEmbedController | null = null;
    let playbackHandler: ((e: { data: SpotifyPlaybackData }) => void) | null = null;
    let readyHandler: ((e: { data: SpotifyPlaybackData }) => void) | null = null;

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
          EmbedController.addListener('playback_update', playbackHandler);
          
          // Listen to ready state
          readyHandler = () => { console.log('Spotify player ready'); };
          EmbedController.addListener('ready', readyHandler);

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
      try {
        if (localController) {
          if (playbackHandler) localController.removeListener('playback_update', playbackHandler);
          if (readyHandler) localController.removeListener('ready', readyHandler);
          localController.destroy();
        }
      } catch {
        // Intentionally empty: suppress any errors during cleanup
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
      // Avoid dangling callbacks if script was loaded
      const win = window as unknown as { onSpotifyIframeApiReady?: unknown };
      if (win.onSpotifyIframeApiReady) {
        delete (win as Record<string, unknown>).onSpotifyIframeApiReady;
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
    const win = window as unknown as { gtag?: (...args: unknown[]) => void };
    if (typeof window !== 'undefined' && win.gtag) {
      win.gtag('event', action, data);
    }
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

      <div 
        className={`spotify-embed-container ${compact ? 'compact' : ''} ${theme}`}
        aria-label="Spotify player"
      >
        <div ref={embedRef} className="spotify-iframe-container">
          {!isLoaded && (
            <div className="embed-loading" style={{ height: embedHeight }}>
              <div className="spinner"></div>
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
                    controller.seek(v);
                    setSeeking(false);
                  }}
                  onTouchEnd={(e) => {
                    const v = Number((e.target as HTMLInputElement).value);
                    controller.seek(v);
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
