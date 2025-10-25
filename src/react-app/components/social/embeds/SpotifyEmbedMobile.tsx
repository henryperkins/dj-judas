/**
 * Mobile-optimized Spotify Embed with bottom sheet design
 * 2025 standards: 60px controls, swipe gestures, haptic feedback
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LuPlay, LuPause, LuSkipBack, LuSkipForward, LuHeart, LuShare2, LuExternalLink, LuChevronDown, LuLogIn, LuUserPlus } from 'react-icons/lu';
import { socialMetrics } from '../utils/socialMetrics';
import { loadSpotifyEmbedAPI, type SpotifyIFrameController } from '@/react-app/utils/spotifyEmbedKit';
import { haptics } from '@/react-app/utils/haptics';

interface SpotifyEmbedMobileProps {
  url?: string;
  uri?: string;
  autoExpand?: boolean;
}

interface SpotifySessionResponse {
  authenticated: boolean;
}

interface SpotifyPlaybackData {
  isPaused: boolean;
  position?: number;
  duration?: number;
  track_window?: {
    current_track?: {
      name: string;
      duration_ms?: number;
      artists?: Array<{ name: string }>;
      album?: {
        images?: Array<{ url: string }>;
      };
    };
  };
}

const SpotifyEmbedMobile: React.FC<SpotifyEmbedMobileProps> = ({
  url,
  uri,
  autoExpand = false
}) => {
  const spotifyUri = uri || (url ? normalizeToSpotifyUri(url) : '');
  const embedRef = useRef<HTMLDivElement>(null);
  const [controller, setController] = useState<SpotifyIFrameController | null>(null);
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackInfo, setTrackInfo] = useState<SpotifyPlaybackData['track_window']>(undefined);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDone, setSaveDone] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followDone, setFollowDone] = useState(false);
  const [authLoaded, setAuthLoaded] = useState(false);

  const spotifyId = spotifyUri.split(':').pop();
  const contentType = spotifyUri.includes('track') ? 'track' : spotifyUri.includes('album') ? 'album' : 'artist';
  const spotifyUrl = `https://open.spotify.com/${contentType}/${spotifyId}`;
  const isArtist = contentType === 'artist';


  // Initialize Spotify Embed
  useEffect(() => {
    let cancelled = false;
    let localController: SpotifyIFrameController | null = null;
    let playbackHandler: ((e: { data: SpotifyPlaybackData }) => void) | null = null;

    const initEmbed = async () => {
      try {
        const iframeApi = await loadSpotifyEmbedAPI();
        if (!embedRef.current || cancelled) return;

        const options = {
          uri: spotifyUri,
          width: '100%',
          height: 80,
          theme: 0, // Dark
        };

        iframeApi.createController(embedRef.current, options, (EmbedController) => {
          if (cancelled) {
            EmbedController.destroy();
            return;
          }

          setController(EmbedController);
          localController = EmbedController;

          playbackHandler = (e) => {
            setIsPlaying(!e.data.isPaused);
            setTrackInfo(e.data.track_window);
            const posMs = (e.data.position ?? 0) as number;
            const durMs = (e.data.duration ?? e.data.track_window?.current_track?.duration_ms ?? 0) as number;
            if (!seeking) setPositionSec(Math.max(0, Math.floor(posMs / 1000)));
            setDurationSec(Math.max(0, Math.floor(durMs / 1000)));
          };
          EmbedController.addListener('playback_update', playbackHandler as (e: { data: unknown }) => void);

          // Set iframe title for accessibility
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
      if (localController && playbackHandler) {
        localController.removeListener('playback_update', playbackHandler as (e: { data: unknown }) => void);
        localController.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spotifyUri]); // NOT seeking - transient UI state should not reinit embed

  // Check auth session
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
      }
      if (!cancelled) setAuthLoaded(true);
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const handleLogin = useCallback(async () => {
    try {
      haptics.trigger('medium');
      const res = await fetch('/api/spotify/login');
      const data = await res.json() as { authorizeUrl?: string };
      if (data.authorizeUrl) {
        socialMetrics.trackSocialInteraction('spotify', 'login_start', { uri: spotifyUri });
        window.location.href = data.authorizeUrl;
      }
    } catch (error) {
      console.error('Spotify login error:', error);
      haptics.trigger('error');
    }
  }, [spotifyUri]);

  const handlePlayPause = useCallback(() => {
    haptics.trigger('medium');
    controller?.togglePlay();
    socialMetrics.trackSocialInteraction('spotify', isPlaying ? 'pause' : 'play', { uri: spotifyUri });
  }, [controller, isPlaying, spotifyUri]);

  const handleNext = useCallback(() => {
    haptics.trigger('light');
    controller?.nextTrack?.();
    socialMetrics.trackSocialInteraction('spotify', 'skip_next', { uri: spotifyUri });
  }, [controller, spotifyUri]);

  const handlePrevious = useCallback(() => {
    haptics.trigger('light');
    controller?.previousTrack?.();
    socialMetrics.trackSocialInteraction('spotify', 'skip_previous', { uri: spotifyUri });
  }, [controller, spotifyUri]);

  const handleSave = async () => {
    if (!spotifyId || !isAuthed) return;
    haptics.trigger('success');
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
      socialMetrics.trackSocialInteraction('spotify', 'save', { uri: spotifyUri });
    } catch (e) {
      console.error('Spotify save error:', e);
      haptics.trigger('error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = () => {
    haptics.trigger('light');
    navigator.clipboard.writeText(spotifyUrl);
    socialMetrics.trackSocialInteraction('spotify', 'share', { uri: spotifyUri });
  };

  const handleFollow = async () => {
    if (!isArtist || !spotifyId || !isAuthed) return;
    haptics.trigger('medium');
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
      socialMetrics.trackSocialInteraction('spotify', 'follow', { uri: spotifyUri });
    } catch (err) {
      console.error('Spotify follow error:', err);
      haptics.trigger('error');
    } finally {
      setIsFollowing(false);
    }
  };

  const handleSeek = (value: number) => {
    controller?.seek(value * 1000);
    setSeeking(false);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const albumArt = trackInfo?.current_track?.album?.images?.[0]?.url;
  const trackName = trackInfo?.current_track?.name || 'Loading...';
  const artistName = trackInfo?.current_track?.artists?.map(a => a.name).join(', ') || '';

  // Mini player (collapsed)
  if (!isExpanded) {
    return (
      <div
        className="spotify-mini-player"
        onClick={() => {
          haptics.trigger('light');
          setIsExpanded(true);
        }}
        role="button"
        tabIndex={0}
        aria-label="Expand Spotify player"
      >
        <div className="mini-player__art">
          {albumArt && <img src={albumArt} alt={trackName} />}
        </div>
        <div className="mini-player__info">
          <p className="mini-player__track">{trackName}</p>
          <p className="mini-player__artist">{artistName}</p>
        </div>
        <button
          className="mini-player__play-btn"
          onClick={(e) => {
            e.stopPropagation();
            handlePlayPause();
          }}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <LuPause size={24} /> : <LuPlay size={24} />}
        </button>
      </div>
    );
  }

  // Full player (expanded bottom sheet)
  return (
    <div className="spotify-bottom-sheet">
      {/* Drag handle */}
      <div className="bottom-sheet__handle-container">
        <button
          className="bottom-sheet__handle"
          onClick={() => {
            haptics.trigger('light');
            setIsExpanded(false);
          }}
          aria-label="Collapse player"
        >
          <LuChevronDown size={28} />
        </button>
      </div>

      {/* Album art */}
      <div className="bottom-sheet__art">
        {albumArt ? (
          <img src={albumArt} alt={trackName} />
        ) : (
          <div className="bottom-sheet__art-placeholder" />
        )}
      </div>

      {/* Track metadata */}
      <div className="bottom-sheet__metadata">
        <h2 className="bottom-sheet__track-name">{trackName}</h2>
        <p className="bottom-sheet__artist-name">{artistName}</p>
      </div>

      {/* Progress bar - 48px touch target */}
      <div className="bottom-sheet__progress">
        <span className="progress__time">{formatTime(positionSec)}</span>
        <input
          type="range"
          className="progress__slider"
          min={0}
          max={Math.max(1, durationSec)}
          value={Math.min(positionSec, durationSec)}
          onChange={(e) => setPositionSec(Number(e.target.value))}
          onMouseDown={() => setSeeking(true)}
          onTouchStart={() => setSeeking(true)}
          onMouseUp={(e) => handleSeek(Number(e.currentTarget.value))}
          onTouchEnd={(e) => handleSeek(Number(e.currentTarget.value))}
          aria-valuemin={0}
          aria-valuemax={durationSec}
          aria-valuenow={positionSec}
          aria-label="Playback progress"
        />
        <span className="progress__time">{formatTime(durationSec)}</span>
      </div>

      {/* Primary controls - 60px touch targets */}
      <div className="bottom-sheet__controls">
        <button
          className="control-btn control-btn--secondary"
          onClick={handlePrevious}
          aria-label="Previous track"
        >
          <LuSkipBack size={28} />
        </button>

        <button
          className="control-btn control-btn--primary"
          onClick={handlePlayPause}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <LuPause size={36} /> : <LuPlay size={36} />}
        </button>

        <button
          className="control-btn control-btn--secondary"
          onClick={handleNext}
          aria-label="Next track"
        >
          <LuSkipForward size={28} />
        </button>
      </div>

      {/* Secondary actions - 48px touch targets */}
      <div className="bottom-sheet__actions">
        {!authLoaded ? (
          <button className="bottom-sheet-action" disabled>
            <span>Checking account…</span>
          </button>
        ) : !isAuthed ? (
          <button
            className="bottom-sheet-action bottom-sheet-action--primary"
            onClick={handleLogin}
            aria-label="Connect Spotify account"
          >
            <LuLogIn size={20} />
            <span>Connect Spotify</span>
          </button>
        ) : (
          <>
            <button
              className="bottom-sheet-action"
              onClick={handleSave}
              disabled={isSaving}
              aria-label="Save to library"
            >
              <LuHeart size={20} fill={saveDone ? 'currentColor' : 'none'} />
              <span>{isSaving ? 'Saving…' : saveDone ? 'Saved' : 'Save'}</span>
            </button>
            {isArtist && (
              <button
                className="bottom-sheet-action"
                onClick={handleFollow}
                disabled={isFollowing}
                aria-label="Follow artist"
              >
                <LuUserPlus size={20} />
                <span>{isFollowing ? 'Following…' : followDone ? 'Following' : 'Follow'}</span>
              </button>
            )}
          </>
        )}
        <button
          className="bottom-sheet-action"
          onClick={handleShare}
          aria-label="Share"
        >
          <LuShare2 size={20} />
          <span>Share</span>
        </button>
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bottom-sheet-action"
          onClick={() => {
            haptics.trigger('light');
            socialMetrics.trackSocialInteraction('spotify', 'open_external', { uri: spotifyUri });
          }}
        >
          <LuExternalLink size={20} />
          <span>Open</span>
        </a>
      </div>

      {/* Hidden embed for SDK control */}
      <div ref={embedRef} style={{ display: 'none' }} />
    </div>
  );
};

function normalizeToSpotifyUri(urlOrUri: string): string {
  if (urlOrUri.startsWith('spotify:')) {
    return urlOrUri;
  }
  const match = urlOrUri.match(/open\.spotify\.com\/(?:embed\/)?(\w+)\/([a-zA-Z0-9]+)/);
  if (match) {
    const [, type, id] = match;
    return `spotify:${type}:${id}`;
  }
  return urlOrUri;
}

export default SpotifyEmbedMobile;
