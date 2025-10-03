/**
 * Mobile-optimized Listen Tabs with bottom sheet player
 * 2025 standards: Mini player with swipe-up expansion, platform quick-switch
 */

import { useEffect, useMemo, useState } from 'react';
import { FaSpotify, FaApple } from 'react-icons/fa';
import { LuChevronUp, LuChevronDown } from 'react-icons/lu';
import SpotifyEmbedMobile from './social/embeds/SpotifyEmbedMobile';
import AppleMusicEmbedMobile from './social/embeds/AppleMusicEmbedMobile';
import { haptics } from '@/react-app/utils/haptics';

type Provider = 'spotify' | 'apple';

export interface ListenTabsMobileProps {
  spotifyUrl?: string;
  appleMusicUrl?: string;
  defaultProvider?: Provider;
  autoExpand?: boolean;
}

const SPOTIFY_COLOR = '#1DB954';
const APPLE_COLOR = '#FC3C44';

export default function ListenTabsMobile({
  spotifyUrl,
  appleMusicUrl,
  defaultProvider,
  autoExpand = false
}: ListenTabsMobileProps) {
  const spotifyArtistId = import.meta.env?.VITE_SPOTIFY_ARTIST_ID;
  const defaultSpotifyUrl = spotifyArtistId
    ? `https://open.spotify.com/artist/${spotifyArtistId}`
    : undefined;

  const initial = useMemo<Provider>(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('preferredProvider')) as Provider | null;
    if (stored === 'spotify' || stored === 'apple') return stored;
    return defaultProvider || 'spotify';
  }, [defaultProvider]);

  const [active, setActive] = useState<Provider>(initial);
  const [isExpanded, setIsExpanded] = useState(autoExpand);

  useEffect(() => {
    try {
      localStorage.setItem('preferredProvider', active);
    } catch {
      // Ignore localStorage errors
    }
  }, [active]);

  const resolvedSpotify = spotifyUrl || defaultSpotifyUrl;
  const hasSpotify = Boolean(resolvedSpotify);
  const hasApple = Boolean(appleMusicUrl);

  // If one provider missing, force to available one
  useEffect(() => {
    if (active === 'spotify' && !hasSpotify && hasApple) setActive('apple');
    if (active === 'apple' && !hasApple && hasSpotify) setActive('spotify');
  }, [active, hasSpotify, hasApple]);

  const handleToggleExpand = () => {
    haptics.trigger('light');
    setIsExpanded(!isExpanded);
  };

  const handlePlatformSwitch = (provider: Provider) => {
    if (provider === active) return;
    haptics.trigger('medium');
    setActive(provider);
  };

  // Mini player (collapsed state)
  if (!isExpanded) {
    return (
      <div className="listen-mini-player">
        {/* Platform indicator */}
        <div className="mini-player__platform">
          {active === 'spotify' ? (
            <FaSpotify size={20} style={{ color: SPOTIFY_COLOR }} />
          ) : (
            <FaApple size={20} style={{ color: APPLE_COLOR }} />
          )}
        </div>

        {/* Quick expand button */}
        <button
          className="mini-player__expand-btn"
          onClick={handleToggleExpand}
          aria-label="Expand music player"
        >
          <div className="expand-btn__info">
            <p className="expand-btn__label">Now Playing</p>
            <p className="expand-btn__platform">
              {active === 'spotify' ? 'Spotify' : 'Apple Music'}
            </p>
          </div>
          <LuChevronUp size={24} />
        </button>

        {/* Platform quick-switch (collapsed state) */}
        <div className="mini-player__switch">
          {hasSpotify && (
            <button
              className={`switch-btn ${active === 'spotify' ? 'active' : ''}`}
              onClick={() => handlePlatformSwitch('spotify')}
              aria-label="Switch to Spotify"
              style={{
                backgroundColor: active === 'spotify' ? SPOTIFY_COLOR : 'transparent',
                borderColor: SPOTIFY_COLOR
              }}
            >
              <FaSpotify size={16} />
            </button>
          )}
          {hasApple && (
            <button
              className={`switch-btn ${active === 'apple' ? 'active' : ''}`}
              onClick={() => handlePlatformSwitch('apple')}
              aria-label="Switch to Apple Music"
              style={{
                backgroundColor: active === 'apple' ? APPLE_COLOR : 'transparent',
                borderColor: APPLE_COLOR
              }}
            >
              <FaApple size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

  // Full player (expanded bottom sheet)
  return (
    <div className="listen-bottom-sheet">
      {/* Header with platform switcher */}
      <div className="listen-sheet__header">
        <button
          className="sheet-header__collapse"
          onClick={handleToggleExpand}
          aria-label="Collapse player"
        >
          <LuChevronDown size={28} />
        </button>

        <div className="sheet-header__platforms">
          {hasSpotify && (
            <button
              className={`platform-tab ${active === 'spotify' ? 'active' : ''}`}
              onClick={() => handlePlatformSwitch('spotify')}
              disabled={!hasSpotify}
              style={{
                color: active === 'spotify' ? SPOTIFY_COLOR : 'inherit',
                borderBottomColor: active === 'spotify' ? SPOTIFY_COLOR : 'transparent'
              }}
            >
              <FaSpotify size={20} />
              <span>Spotify</span>
            </button>
          )}
          {hasApple && (
            <button
              className={`platform-tab ${active === 'apple' ? 'active' : ''}`}
              onClick={() => handlePlatformSwitch('apple')}
              disabled={!hasApple}
              style={{
                color: active === 'apple' ? APPLE_COLOR : 'inherit',
                borderBottomColor: active === 'apple' ? APPLE_COLOR : 'transparent'
              }}
            >
              <FaApple size={20} />
              <span>Apple Music</span>
            </button>
          )}
        </div>
      </div>

      {/* Player content - only mount active provider */}
      <div className="listen-sheet__content">
        {active === 'spotify' && hasSpotify && (
          <SpotifyEmbedMobile
            url={resolvedSpotify!}
            autoExpand={true}
          />
        )}

        {active === 'apple' && hasApple && (
          <AppleMusicEmbedMobile
            url={appleMusicUrl!}
            autoExpand={true}
          />
        )}

        {!hasSpotify && !hasApple && (
          <EmptyProvider text="No streaming platforms configured" />
        )}
      </div>
    </div>
  );
}

function EmptyProvider({ text }: { text: string }) {
  return (
    <div className="empty-provider">
      <p>{text}</p>
    </div>
  );
}
