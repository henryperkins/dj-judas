/**
 * Mobile-optimized Apple Music Embed with native-style controls
 * 2025 standards: 60px play button, haptic feedback, offline support
 */

import React, { useState, useEffect, useCallback } from 'react';
import { LuPlay, LuPause, LuPlus, LuExternalLink, LuChevronDown, LuWifi, LuWifiOff } from 'react-icons/lu';
import { appleMusicKit } from '@/react-app/utils/appleMusicKit';
import { socialMetrics } from '../utils/socialMetrics';
import { haptics } from '@/react-app/utils/haptics';

interface AppleMusicEmbedMobileProps {
  url: string;
  height?: number;
  affiliateToken?: string;
  campaignToken?: string;
  autoExpand?: boolean;
}

const AppleMusicEmbedMobile: React.FC<AppleMusicEmbedMobileProps> = ({
  url,
  affiliateToken = '',
  campaignToken = 'voices-of-judah',
  autoExpand = false
}) => {
  const [isExpanded, setIsExpanded] = useState(autoExpand);
  const [musicKitReady, setMusicKitReady] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [musicKitError, setMusicKitError] = useState<string | null>(null);

  // Extract content from URL
  const content = appleMusicKit.extractIdFromUrl(url);

  // Build affiliate link
  const buildAffiliateLink = () => {
    const params = new URLSearchParams();
    if (affiliateToken) params.append('at', affiliateToken);
    if (campaignToken) params.append('ct', campaignToken);
    const queryString = params.toString();
    return queryString ? `${url}?${queryString}` : url;
  };

  // Monitor online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize MusicKit
  useEffect(() => {
    const initMusicKit = async () => {
      try {
        await appleMusicKit.loadMusicKit();
        setMusicKitReady(true);
        setIsAuthorized(appleMusicKit.isAuthorized());
      } catch (error) {
        console.error('MusicKit initialization failed:', error);
        setMusicKitError('Apple Music unavailable');
      }
    };

    initMusicKit();

    const unsubscribe = appleMusicKit.onAuthChange((authorized) => {
      setIsAuthorized(authorized);
    });

    return unsubscribe;
  }, []);

  const handleAuthorize = useCallback(async () => {
    haptics.trigger('light');
    setAuthLoading(true);
    try {
      const authorized = await appleMusicKit.authorize();
      if (!authorized) {
        setMusicKitError('Authorization failed');
        haptics.trigger('error');
      } else {
        haptics.trigger('success');
      }
    } catch (error) {
      console.error('Authorization error:', error);
      setMusicKitError('Failed to authorize');
      haptics.trigger('error');
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const handleAddToLibrary = async () => {
    haptics.trigger('medium');
    socialMetrics.trackSocialInteraction('appleMusic', 'add_library', { url });

    if (!musicKitReady || !isOnline) {
      window.open(buildAffiliateLink(), '_blank', 'noopener,noreferrer');
      return;
    }

    setActionLoading(true);
    try {
      if (!content) {
        window.open(buildAffiliateLink(), '_blank', 'noopener,noreferrer');
        return;
      }

      await appleMusicKit.addToLibrary([content]);
      haptics.trigger('success');
    } catch (error) {
      console.error('Failed to add to library:', error);
      haptics.trigger('error');
      window.open(buildAffiliateLink(), '_blank', 'noopener,noreferrer');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePlayPause = async () => {
    haptics.trigger('medium');
    if (!musicKitReady || !content) {
      window.open(buildAffiliateLink(), '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      if (isPlaying) {
        appleMusicKit.pause();
        setIsPlaying(false);
      } else {
        await appleMusicKit.play(content.id, content.type === 'songs' ? 'song' : content.type === 'albums' ? 'album' : 'playlist');
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Playback error:', error);
      haptics.trigger('error');
    }
  };

  const handleOpenExternal = () => {
    haptics.trigger('light');
    socialMetrics.trackSocialInteraction('appleMusic', 'open_external', { url });
    window.open(buildAffiliateLink(), '_blank', 'noopener,noreferrer');
  };

  // Mini player (collapsed)
  if (!isExpanded) {
    return (
      <div
        className="apple-mini-player"
        onClick={() => {
          haptics.trigger('light');
          setIsExpanded(true);
        }}
        role="button"
        tabIndex={0}
        aria-label="Expand Apple Music player"
      >
        <div className="mini-player__icon">
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M23.994 6.124c0-.738-.034-1.47-.098-2.198-.065-.73-.164-1.455-.296-2.174-.13-.723-.302-1.437-.512-2.142C22.872-.558 22.571-.94 22.25-1.339c-.322-.398-.665-.758-1.027-1.08-.362-.322-.742-.606-1.138-.85-.396-.245-.81-.454-1.24-.627-.43-.174-.87-.315-1.32-.422-.448-.107-.905-.187-1.37-.24-.465-.053-.93-.08-1.396-.085a41.73 41.73 0 0 0-1.415 0c-.485.006-.97.032-1.455.084-.484.052-.965.131-1.444.237-.48.106-.955.244-1.427.41-.473.167-.936.37-1.39.61-.454.24-.894.517-1.318.83-.425.313-.828.66-1.21 1.04-.382.38-.735.79-1.057 1.23a8.75 8.75 0 0 0-.748 1.315c-.21.455-.38.924-.51 1.406a13.76 13.76 0 0 0-.272 1.456c-.057.486-.08.974-.073 1.462.007.489.05.975.13 1.458.08.482.194.96.338 1.433.144.473.32.938.527 1.394.207.456.448.898.722 1.325.274.427.583.835.926 1.223s.71.753 1.096 1.096c.387.343.798.659 1.234.947.435.289.893.55 1.373.783.48.234.977.44 1.494.617a15.66 15.66 0 0 0 1.615.412c.552.113 1.109.198 1.67.256.562.058 1.127.09 1.693.098.566.008 1.133-.003 1.699-.03.565-.028 1.13-.075 1.693-.14.563-.066 1.123-.15 1.68-.252.558-.101 1.113-.221 1.664-.36.552-.139 1.1-.297 1.644-.473.544-.176 1.083-.37 1.617-.58.534-.211 1.063-.44 1.586-.688a18.55 18.55 0 0 0 1.543-.844c.503-.29.993-.603 1.47-.938.478-.335.944-.69 1.397-1.065.454-.375.89-.77 1.31-1.184.42-.415.82-.85 1.2-1.305.38-.455.74-.93 1.08-1.423.34-.493.66-1.003.96-1.53.3-.527.58-1.068.84-1.624.26-.556.5-1.124.72-1.704.22-.58.42-1.174.598-1.78.18-.608.33-1.225.455-1.853.125-.627.22-1.262.286-1.903.067-.642.105-1.29.112-1.943z"/>
          </svg>
        </div>
        <div className="mini-player__info">
          <p className="mini-player__track">Apple Music</p>
          <p className="mini-player__artist">{isOnline ? 'Tap to play' : 'Offline'}</p>
        </div>
        {!isOnline && <LuWifiOff size={20} className="mini-player__status" />}
        {isOnline && <LuWifi size={20} className="mini-player__status" />}
      </div>
    );
  }

  // Full player (expanded)
  return (
    <div className="apple-bottom-sheet">
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

      {/* Offline indicator */}
      {!isOnline && (
        <div className="bottom-sheet__offline-banner">
          <LuWifiOff size={18} />
          <span>You're offline. Some features unavailable.</span>
        </div>
      )}

      {/* Album art placeholder (would be fetched from MusicKit API) */}
      <div className="bottom-sheet__art apple-art">
        <div className="apple-art__placeholder">
          <svg viewBox="0 0 24 24" fill="currentColor" width="80" height="80">
            <path d="M23.994 6.124a9.23 9.23 0 0 0-.112-1.943 11.75 11.75 0 0 0-.286-1.903 10.1 10.1 0 0 0-.455-1.853c-.18-.606-.38-1.2-.598-1.78a15.6 15.6 0 0 0-.72-1.704 13.5 13.5 0 0 0-.84-1.624c-.3-.527-.62-1.037-.96-1.53-.34-.493-.7-.968-1.08-1.423-.38-.455-.78-.89-1.2-1.305a16.3 16.3 0 0 0-1.31-1.184 17.4 17.4 0 0 0-1.397-1.065c-.477-.335-.967-.648-1.47-.938a18.55 18.55 0 0 0-1.543-.844 21.27 21.27 0 0 0-1.586-.688 19.97 19.97 0 0 0-1.617-.58 18.24 18.24 0 0 0-1.644-.473c-.55-.139-1.106-.259-1.664-.36a21.17 21.17 0 0 0-1.68-.252 20.6 20.6 0 0 0-1.693-.14 19.64 19.64 0 0 0-1.699-.03c-.566-.008-1.131-.04-1.693-.098a17.07 17.07 0 0 1-1.67-.256 15.66 15.66 0 0 1-1.615-.412 13.88 13.88 0 0 1-1.494-.617 12.32 12.32 0 0 1-1.373-.783 10.47 10.47 0 0 1-1.234-.947 9.6 9.6 0 0 1-1.096-1.096 8.97 8.97 0 0 1-.926-1.223 8.11 8.11 0 0 1-.722-1.325 7.55 7.55 0 0 1-.527-1.394 6.84 6.84 0 0 1-.338-1.433 6.28 6.28 0 0 1-.13-1.458c-.007-.488.016-.976.073-1.462a13.76 13.76 0 0 1 .272-1.456c.13-.482.3-.951.51-1.406a8.75 8.75 0 0 1 .748-1.315c.322-.44.675-.85 1.057-1.23.382-.38.785-.727 1.21-1.04.424-.313.864-.59 1.318-.83.454-.24.917-.443 1.39-.61.472-.166.947-.304 1.427-.41.479-.106.96-.185 1.444-.237.485-.052.97-.078 1.455-.084a41.73 41.73 0 0 1 1.415 0c.466.006.931.032 1.396.085.465.053.922.133 1.37.24.45.107.89.248 1.32.422.43.173.844.382 1.24.627.396.244.776.528 1.138.85.362.322.705.682 1.027 1.08.321.399.622.781.903 1.148.28.367.54.75.78 1.15.24.4.46.814.66 1.244.2.43.38.875.54 1.333.16.458.298.926.414 1.403.116.477.21.962.28 1.455.07.493.117.992.138 1.496.02.504.018 1.012-.01 1.52-.03.508-.08 1.017-.15 1.527a12.01 12.01 0 0 1-.296 1.532c-.12.51-.26 1.02-.42 1.527-.16.507-.34 1.01-.54 1.508a13.8 13.8 0 0 1-.66 1.485c-.24.49-.5.976-.78 1.455-.28.48-.58.952-.9 1.417-.32.465-.66.92-1.02 1.366a16.5 16.5 0 0 1-1.13 1.297 17.4 17.4 0 0 1-1.24 1.214c-.42.393-.86.77-1.31 1.13-.45.36-.92.706-1.397 1.036-.478.33-.968.643-1.47.938a18.55 18.55 0 0 1-1.543.844c-.523.248-1.052.477-1.586.688-.534.21-1.073.404-1.617.58a18.24 18.24 0 0 1-1.644.473c-.55.139-1.106.259-1.664.36a21.17 21.17 0 0 1-1.68.252c-.563.065-1.128.112-1.693.14a19.64 19.64 0 0 1-1.699.03c-.566.008-1.131.04-1.693.098a17.07 17.07 0 0 1-1.67.256 15.66 15.66 0 0 1-1.615.412c-.517.117-1.027.26-1.494.617-.467.357-.92.677-1.373.783-.452.106-.913.186-1.234.947-.32.76-.636 1.096-1.096 1.096s-.776-.336-1.096-1.096c-.32-.76-.782-.84-1.234-.947-.453-.106-.906-.426-1.373-.783-.467-.357-.977-.5-1.494-.617a15.66 15.66 0 0 1-1.615-.412 17.07 17.07 0 0 1-1.67-.256c-.562-.058-1.127-.09-1.693-.098a19.64 19.64 0 0 1-1.699-.03 20.6 20.6 0 0 1-1.693-.14 21.17 21.17 0 0 1-1.68-.252c-.558-.101-1.113-.221-1.664-.36a18.24 18.24 0 0 1-1.644-.473c-.544-.176-1.083-.37-1.617-.58-.534-.211-1.063-.44-1.586-.688a18.55 18.55 0 0 1-1.543-.844c-.502-.295-.992-.608-1.47-.938-.477-.33-.947-.676-1.397-1.036-.45-.36-.89-.737-1.31-1.13-.42-.393-.82-.8-1.24-1.214a16.5 16.5 0 0 1-1.13-1.297 15.8 15.8 0 0 1-1.02-1.366 13.5 13.5 0 0 1-.9-1.417c-.28-.48-.54-.965-.78-1.455a13.8 13.8 0 0 1-.66-1.485c-.2-.498-.38-1-.54-1.508-.16-.507-.3-1.017-.42-1.527a12.01 12.01 0 0 1-.296-1.532 11.52 11.52 0 0 1-.15-1.527c-.028-.508-.03-1.016-.01-1.52.02-.504.068-1.003.138-1.496.07-.493.164-.978.28-1.455.116-.477.254-.945.414-1.403.16-.458.34-.903.54-1.333.2-.43.42-.844.66-1.244.24-.4.5-.783.78-1.15.28-.367.58-.749.903-1.148.32-.398.622-.781.903-1.148.28-.367.58-.75.78-1.15.2-.4.42-.814.66-1.244.24-.43.46-.875.54-1.333.08-.458.22-.926.414-1.403.194-.477.41-.948.654-1.41.244-.462.51-.917.798-1.365.288-.448.598-.886.927-1.315.33-.43.68-.85 1.048-1.26.368-.41.755-.81 1.16-1.196.405-.386.83-.758 1.272-1.115.442-.357.902-.698 1.38-1.023.478-.325.973-.633 1.485-.924a18.3 18.3 0 0 1 1.586-.79c.54-.252 1.092-.484 1.655-.697.563-.213 1.137-.406 1.72-.58.583-.174 1.175-.328 1.775-.462.6-.134 1.208-.248 1.823-.342.615-.094 1.237-.168 1.865-.222.628-.054 1.262-.088 1.9-.102.638-.014 1.28-.008 1.924.018.644.026 1.29.072 1.938.138.648.066 1.298.152 1.95.258.652.106 1.305.232 1.96.378.655.146 1.31.312 1.967.498.657.186 1.314.392 1.97.618.656.226 1.31.472 1.963.738.653.266 1.304.552 1.952.858.648.306 1.293.632 1.933.978.64.346 1.276.712 1.906 1.098a21.1 21.1 0 0 1 1.87 1.26c.607.438 1.205.896 1.792 1.374.587.478 1.162.976 1.724 1.494.562.518 1.11 1.056 1.643 1.614.533.558 1.05 1.136 1.55 1.734.5.598.983 1.216 1.447 1.854.464.638.91 1.296 1.335 1.974.425.678.828 1.376 1.208 2.094.38.718.736 1.456 1.067 2.214.33.758.636 1.536.917 2.334.28.798.535 1.616.764 2.454.23.838.433 1.696.608 2.574.175.878.323 1.776.442 2.694.12.918.21 1.856.272 2.814.062.958.095 1.936.098 2.934z"/>
          </svg>
        </div>
      </div>

      {/* Track metadata */}
      <div className="bottom-sheet__metadata">
        <h2 className="bottom-sheet__track-name">Apple Music</h2>
        <p className="bottom-sheet__artist-name">Tap to listen</p>
      </div>

      {/* Primary controls - 60px touch target */}
      <div className="bottom-sheet__controls">
        <button
          className="control-btn control-btn--primary apple-play-btn"
          onClick={handlePlayPause}
          disabled={!isOnline || !musicKitReady}
          aria-label={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <LuPause size={36} /> : <LuPlay size={36} />}
        </button>
      </div>

      {/* Secondary actions - 48px touch targets */}
      <div className="bottom-sheet__actions">
        {musicKitReady && isAuthorized ? (
          <button
            className="action-btn"
            onClick={handleAddToLibrary}
            disabled={actionLoading || !isOnline}
            aria-label="Add to Library"
          >
            <LuPlus size={20} />
            <span>{actionLoading ? 'Adding...' : 'Add to Library'}</span>
          </button>
        ) : musicKitReady ? (
          <button
            className="action-btn action-btn--primary"
            onClick={handleAuthorize}
            disabled={authLoading || !isOnline}
            aria-label="Authorize Apple Music"
          >
            <span>{authLoading ? 'Authorizing...' : 'Connect Apple Music'}</span>
          </button>
        ) : null}

        <button
          className="action-btn"
          onClick={handleOpenExternal}
          aria-label="Open in Apple Music"
        >
          <LuExternalLink size={20} />
          <span>Open</span>
        </button>
      </div>

      {/* Error message */}
      {musicKitError && (
        <div className="bottom-sheet__error">
          <p>{musicKitError}</p>
        </div>
      )}

      {/* Subscribe CTA */}
      <div className="bottom-sheet__cta">
        <p>Stream or purchase to support the artist</p>
      </div>
    </div>
  );
};

export default AppleMusicEmbedMobile;
