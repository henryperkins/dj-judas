/**
 * Simplified Spotify Embed - Clean music showcase (no auth)
 * Focus: Beautiful player + "Open in Spotify" link
 */

import React, { useEffect, useRef, useState } from 'react';
import { LuExternalLink, LuMusic, LuPlay, LuPause, LuShare2 } from 'react-icons/lu';
import { socialMetrics } from '../utils/socialMetrics';
import { loadSpotifyEmbedAPI, type SpotifyIFrameController } from '@/react-app/utils/spotifyEmbedKit';

interface SpotifyEmbedProps {
  url?: string;
  uri?: string;
  compact?: boolean;
  theme?: 'light' | 'dark';
  onPlay?: () => void;
  hideHeader?: boolean;
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
    };
  };
}

interface TrackInfo {
  name: string;
  artists?: Array<{ name: string }>;
  duration_ms?: number;
}

const SpotifyEmbed: React.FC<SpotifyEmbedProps> = ({
  url,
  uri,
  compact = false,
  theme = 'dark',
  onPlay,
  hideHeader = false
}) => {
  const spotifyUri = uri || (url ? normalizeToSpotifyUri(url) : '');
  const embedRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [controller, setController] = useState<SpotifyIFrameController | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [trackInfo, setTrackInfo] = useState<TrackInfo | null>(null);
  const [positionSec, setPositionSec] = useState(0);
  const [durationSec, setDurationSec] = useState(0);
  const [seeking, setSeeking] = useState(false);

  const spotifyId = spotifyUri.split(':').pop();
  const contentType = spotifyUri.includes('track') ? 'track' : spotifyUri.includes('album') ? 'album' : 'artist';
  const spotifyUrl = `https://open.spotify.com/${contentType}/${spotifyId}`;
  const embedHeight = compact ? 152 : contentType === 'album' ? 380 : 232;

  // Initialize Spotify Embed
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

            const posMs = (e.data.position ?? 0) as number;
            const durMs = (e.data.duration ?? e.data.track_window?.current_track?.duration_ms ?? 0) as number;
            if (!seeking) setPositionSec(Math.max(0, Math.floor(posMs / 1000)));
            setDurationSec(Math.max(0, Math.floor(durMs / 1000)));

            if (e.data.isPaused === false && onPlay) {
              onPlay();
              socialMetrics.trackSocialInteraction('spotify', 'play', { uri: spotifyUri, contentType });
            }
          };
          EmbedController.addListener('playback_update', playbackHandler as (e: { data: unknown }) => void);

          // Listen to ready state (optional)
          readyHandler = () => { /* Player ready */ };
          EmbedController.addListener('ready', readyHandler as (e: { data: unknown }) => void);

          // Ensure iframe has accessible title
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
      try {
        if (localController) {
          if (playbackHandler) localController.removeListener('playback_update', playbackHandler as (e: { data: unknown }) => void);
          if (readyHandler) localController.removeListener('ready', readyHandler as (e: { data: unknown }) => void);
          localController.destroy();
        }
      } catch {
        // Suppress cleanup errors
      }
    };
  }, [spotifyUri, embedHeight, theme, onPlay, contentType, seeking]);

  // Set iframe title when loaded
  useEffect(() => {
    if (!isLoaded) return;
    const iframe = embedRef.current?.querySelector('iframe');
    if (iframe && !iframe.getAttribute('title')) {
      iframe.setAttribute('title', 'Spotify player');
    }
  }, [isLoaded]);

  const handleSpotifyOpen = () => {
    socialMetrics.trackSocialInteraction('spotify', 'open', { uri: spotifyUri, contentType });
    window.open(spotifyUrl, '_blank', 'noopener,noreferrer');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(spotifyUrl);
    socialMetrics.trackSocialInteraction('spotify', 'share', { uri: spotifyUri });
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

      <div className={`spotify-embed-container ${compact ? 'compact' : ''} ${theme}`}>
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

      {/* Simple actions bar */}
      <div className="embed-actions">
        <button
          className="action-btn share-btn"
          onClick={handleShare}
          aria-label="Copy link to clipboard"
        >
          <LuShare2 size={18} />
          <span>Share</span>
        </button>
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

export default SpotifyEmbed;
