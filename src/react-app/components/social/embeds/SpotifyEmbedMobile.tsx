/**
 * Simplified Mobile Spotify Embed - Bottom sheet player (no auth)
 * 2025 standards: 60px controls, haptic feedback, smooth animations
 * Focus: Beautiful player + "Open in Spotify" link
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { LuPlay, LuPause, LuSkipBack, LuSkipForward, LuShare2, LuExternalLink, LuChevronDown } from 'react-icons/lu';
import { socialMetrics } from '../utils/socialMetrics';
import { loadSpotifyEmbedAPI, type SpotifyIFrameController } from '@/react-app/utils/spotifyEmbedKit';
import { haptics } from '@/react-app/utils/haptics';

interface SpotifyEmbedMobileProps {
  url?: string;
  uri?: string;
  autoExpand?: boolean;
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackInfo, setTrackInfo] = useState<SpotifyPlaybackData['track_window']>(undefined);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const spotifyId = spotifyUri.split(':').pop();
  const contentType = spotifyUri.includes('track') ? 'track' : spotifyUri.includes('album') ? 'album' : 'artist';
  const spotifyUrl = `https://open.spotify.com/${contentType}/${spotifyId}`;

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
          }, 100);
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
  }, [spotifyUri, seeking]);

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

  const handleShare = useCallback(() => {
    haptics.trigger('light');
    navigator.clipboard.writeText(spotifyUrl);
    socialMetrics.trackSocialInteraction('spotify', 'share', { uri: spotifyUri });
  }, [spotifyUrl, spotifyUri]);

  const handleOpenSpotify = useCallback(() => {
    haptics.trigger('light');
    socialMetrics.trackSocialInteraction('spotify', 'open_external', { uri: spotifyUri });
  }, [spotifyUri]);

  const handleSeek = useCallback((value: number) => {
    controller?.seek(value * 1000);
    setSeeking(false);
  }, [controller]);

  const handleExpand = useCallback(() => {
    haptics.trigger('light');
    setIsExpanded(true);
  }, []);

  const handleCollapse = useCallback(() => {
    haptics.trigger('light');
    setIsExpanded(false);
  }, []);

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
        onClick={handleExpand}
        role="button"
        tabIndex={0}
        aria-label="Expand Spotify player"
        onKeyDown={(e) => e.key === 'Enter' && handleExpand()}
      >
        <div className="mini-player__art">
          {albumArt && <img src={albumArt} alt={trackName} loading="lazy" />}
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
          onClick={handleCollapse}
          aria-label="Collapse player"
        >
          <LuChevronDown size={28} />
        </button>
      </div>

      {/* Album art */}
      <div className="bottom-sheet__art">
        {albumArt ? (
          <img src={albumArt} alt={trackName} loading="lazy" />
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

      {/* Simple actions - 48px touch targets */}
      <div className="bottom-sheet__actions">
        <button
          className="bottom-sheet-action"
          onClick={handleShare}
          aria-label="Copy link to clipboard"
        >
          <LuShare2 size={20} />
          <span>Share</span>
        </button>
        <a
          href={spotifyUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="bottom-sheet-action bottom-sheet-action--primary"
          onClick={handleOpenSpotify}
        >
          <LuExternalLink size={20} />
          <span>Open in Spotify</span>
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
