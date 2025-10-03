/**
 * Mobile-optimized Spotify Embed with bottom sheet design
 * 2025 standards: 60px controls, swipe gestures, haptic feedback
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LuPlay, LuPause, LuSkipBack, LuSkipForward, LuHeart, LuShare2, LuExternalLink, LuChevronDown } from 'react-icons/lu';
import { socialMetrics } from '../utils/socialMetrics';
import { loadSpotifyEmbedAPI } from '@/react-app/utils/spotifyEmbedKit';
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

interface SpotifyEmbedController {
  togglePlay: () => void;
  play: () => void;
  pause: () => void;
  nextTrack: () => void;
  previousTrack: () => void;
  seek: (seconds: number) => void;
  destroy: () => void;
  addListener: (event: string, cb: (e: { data: SpotifyPlaybackData }) => void) => void;
  removeListener: (event: string, cb: (e: { data: SpotifyPlaybackData }) => void) => void;
}

const SpotifyEmbedMobile: React.FC<SpotifyEmbedMobileProps> = ({
  url,
  uri,
  autoExpand = false
}) => {
  const spotifyUri = uri || (url ? normalizeToSpotifyUri(url) : '');
  const embedRef = useRef<HTMLDivElement>(null);
  const [controller, setController] = useState<SpotifyEmbedController | null>(null);
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [isAuthed, setIsAuthed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackInfo, setTrackInfo] = useState<SpotifyPlaybackData['track_window']>(undefined);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveDone, setSaveDone] = useState(false);

  const spotifyId = spotifyUri.split(':').pop();
  const contentType = spotifyUri.includes('track') ? 'track' : spotifyUri.includes('album') ? 'album' : 'artist';
  const spotifyUrl = `https://open.spotify.com/${contentType}/${spotifyId}`;


  // Initialize Spotify Embed
  useEffect(() => {
    let localController: SpotifyEmbedController | null = null;
    let playbackHandler: ((e: { data: SpotifyPlaybackData }) => void) | null = null;

    const initEmbed = async () => {
      try {
        await loadSpotifyEmbedAPI();

        type IFrameAPIType = { createController: (el: HTMLElement, opts: Record<string, unknown>, cb: (ctrl: SpotifyEmbedController) => void) => void };
        (window as unknown as { onSpotifyIframeApiReady?: (api: IFrameAPIType) => void }).onSpotifyIframeApiReady = (IFrameAPI: IFrameAPIType) => {
          if (!embedRef.current) return;

          const options = {
            uri: spotifyUri,
            width: '100%',
            height: 80,
            theme: 0, // Dark
          };

          IFrameAPI.createController(embedRef.current, options, (EmbedController) => {
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
            EmbedController.addListener('playback_update', playbackHandler);

            // Set iframe title for accessibility
            setTimeout(() => {
              const iframe = embedRef.current?.querySelector('iframe');
              if (iframe && !iframe.getAttribute('title')) {
                iframe.setAttribute('title', 'Spotify player');
              }
            }, 0);
          });
        };
      } catch (error) {
        console.error('Failed to load Spotify Embed API:', error);
      }
    };

    initEmbed();

    return () => {
      if (localController && playbackHandler) {
        localController.removeListener('playback_update', playbackHandler);
        localController.destroy();
      }
    };
  }, [spotifyUri, seeking]);

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
    };
    check();
    return () => { cancelled = true; };
  }, []);

  const handlePlayPause = useCallback(() => {
    haptics.trigger('medium');
    controller?.togglePlay();
    socialMetrics.trackSocialInteraction('spotify', isPlaying ? 'pause' : 'play', { uri: spotifyUri });
  }, [controller, isPlaying, spotifyUri]);

  const handleNext = useCallback(() => {
    haptics.trigger('light');
    controller?.nextTrack();
    socialMetrics.trackSocialInteraction('spotify', 'skip_next', { uri: spotifyUri });
  }, [controller, spotifyUri]);

  const handlePrevious = useCallback(() => {
    haptics.trigger('light');
    controller?.previousTrack();
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

  const handleSeek = (value: number) => {
    controller?.seek(value);
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
        {isAuthed && (
          <button
            className="action-btn"
            onClick={handleSave}
            disabled={isSaving}
            aria-label="Save to library"
          >
            <LuHeart size={20} fill={saveDone ? 'currentColor' : 'none'} />
            <span>{isSaving ? 'Saving...' : saveDone ? 'Saved' : 'Save'}</span>
          </button>
        )}
        <button
          className="action-btn"
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
          className="action-btn"
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
