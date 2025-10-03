/**
 * Mobile-optimized Instagram Embed with card-based layout
 * 2025 standards: Single-column cards, compact metrics, lazy loading
 */

import React, { useState, useEffect, useRef } from 'react';
import { LuInstagram, LuExternalLink, LuHeart, LuMessageCircle, LuBookmark, LuMusic, LuPlay } from 'react-icons/lu';
import { metaSDK, processInstagramEmbeds } from '../utils/metaSdk';
import { socialMetrics } from '../utils/socialMetrics';
import { haptics } from '@/react-app/utils/haptics';
import { usePullToRefresh } from '@/react-app/utils/pull-to-refresh';

interface InstagramPost {
  url: string;
  type?: 'post' | 'reel' | 'story';
  caption?: string;
  musicTrack?: string;
  engagement?: {
    likes?: number;
    comments?: number;
    saves?: number;
  };
}

interface InstagramEmbedMobileProps {
  posts: InstagramPost[];
  profileUrl?: string;
  spotifyPlaylistUrl?: string;
  appleMusicPlaylistUrl?: string;
  showMusicDiscovery?: boolean;
  onRefresh?: () => Promise<void>;
}

interface InstagramOEmbed {
  html: string;
  author_name?: string;
  title?: string;
  fallback?: boolean;
}

const oEmbedCache = new Map<string, InstagramOEmbed>();

const InstagramEmbedMobile: React.FC<InstagramEmbedMobileProps> = ({
  posts,
  profileUrl,
  spotifyPlaylistUrl,
  appleMusicPlaylistUrl,
  showMusicDiscovery = false,
  onRefresh
}) => {
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);

  // Pull to refresh
  const { state: refreshState, containerRef } = usePullToRefresh({
    onRefresh: async () => {
      haptics.trigger('light');
      await onRefresh?.();
    },
    enabled: !!onRefresh
  });

  // Track view
  useEffect(() => {
    if (posts.length > 0) {
      socialMetrics.trackSocialInteraction('instagram', 'feed_view', {
        postCount: posts.length
      });
    }
  }, [posts]);

  // Show music prompt after scrolling
  useEffect(() => {
    if (!showMusicDiscovery) return;

    const handleScroll = () => {
      const scrolled = window.scrollY;
      if (scrolled > 300 && !showMusicPrompt) {
        setShowMusicPrompt(true);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [showMusicDiscovery, showMusicPrompt]);

  const handleMusicClick = (platform: 'spotify' | 'apple') => {
    haptics.trigger('medium');
    socialMetrics.trackSocialInteraction('instagram', 'music_discovery', { platform });
    const url = platform === 'spotify' ? spotifyPlaylistUrl : appleMusicPlaylistUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePostClick = (url: string) => {
    haptics.trigger('light');
    socialMetrics.trackSocialInteraction('instagram', 'post_click', { url });
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className="instagram-feed-mobile"
      ref={(el) => {
        (containerRef as React.MutableRefObject<HTMLElement | null>).current = el;
      }}
    >
      {/* Pull-to-refresh indicator */}
      {refreshState.isPulling && (
        <div
          className="pull-refresh-indicator"
          style={{ transform: `translateY(${refreshState.pullDistance}px)` }}
        >
          <div className="refresh-spinner" />
          <p>{refreshState.canRefresh ? 'Release to refresh' : 'Pull to refresh'}</p>
        </div>
      )}

      {refreshState.isRefreshing && (
        <div className="refreshing-banner">
          <div className="refresh-spinner" />
          <p>Refreshing...</p>
        </div>
      )}

      {/* Header */}
      <div className="feed-header">
        <div className="feed-header__badge">
          <LuInstagram size={20} />
          <span>Instagram</span>
        </div>
        {profileUrl && (
          <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="feed-header__link"
            onClick={() => {
              haptics.trigger('light');
              socialMetrics.trackSocialInteraction('instagram', 'profile_click', {});
            }}
          >
            View Profile
          </a>
        )}
      </div>

      {/* Post cards (vertical stack, no carousel) */}
      <div className="instagram-cards">
        {posts.map((post) => (
          <InstagramCard
            key={post.url}
            post={post}
            onPostClick={handlePostClick}
          />
        ))}
      </div>

      {/* Music discovery prompt (bottom action sheet) */}
      {showMusicPrompt && showMusicDiscovery && (spotifyPlaylistUrl || appleMusicPlaylistUrl) && (
        <div className="music-discovery-sheet">
          <button
            className="discovery-sheet__close"
            onClick={() => {
              haptics.trigger('light');
              setShowMusicPrompt(false);
            }}
            aria-label="Close"
          >
            ×
          </button>
          <div className="discovery-sheet__content">
            <LuMusic size={32} />
            <h3>Discover the music from these posts</h3>
            <div className="discovery-sheet__actions">
              {spotifyPlaylistUrl && (
                <button
                  className="discovery-btn discovery-btn--spotify"
                  onClick={() => handleMusicClick('spotify')}
                >
                  <LuPlay size={18} />
                  Listen on Spotify
                </button>
              )}
              {appleMusicPlaylistUrl && (
                <button
                  className="discovery-btn discovery-btn--apple"
                  onClick={() => handleMusicClick('apple')}
                >
                  <LuPlay size={18} />
                  Listen on Apple Music
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Individual Instagram Card Component
const InstagramCard: React.FC<{
  post: InstagramPost;
  onPostClick: (url: string) => void;
}> = ({ post, onPostClick }) => {
  const [embedData, setEmbedData] = useState<InstagramOEmbed | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true);
          }
        });
      },
      { rootMargin: '100px' } // Load 100px before visible
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, [isVisible]);

  // Fetch oEmbed when visible
  useEffect(() => {
    if (!isVisible) return;

    let cancelled = false;
    const fetchEmbed = async () => {
      try {
        const key = `${post.url}|540|true`;

        if (oEmbedCache.has(key)) {
          if (!cancelled) {
            setEmbedData(oEmbedCache.get(key)!);
            setIsLoaded(true);
            // Processing of embeds is handled in the isLoaded effect below
          }
          return;
        }

        const params = new URLSearchParams({
          url: post.url,
          maxwidth: '540',
          omitscript: 'true',
          hidecaption: 'false'
        });

        const response = await fetch(`/api/instagram/oembed?${params.toString()}`);
        const data = await response.json() as InstagramOEmbed;

        if (!response.ok && !data.fallback) {
          throw new Error(`oEmbed fetch failed: ${response.status}`);
        }

        oEmbedCache.set(key, data);
        if (!cancelled) {
          setEmbedData(data);
          setIsLoaded(true);
        }
      } catch (err) {
        if (!cancelled) setError('Failed to load post');
        console.error('Instagram embed error:', err);
      }
    };

    fetchEmbed();
    return () => { cancelled = true; };
  }, [isVisible, post.url]);

  // Process Instagram embeds with SDK
  useEffect(() => {
    let active = true;
    const process = async () => {
      if (!isLoaded || !embedData || !cardRef.current) return;
      await metaSDK.loadInstagramEmbed();
      if (active) await processInstagramEmbeds();
    };
    process();
    return () => { active = false; };
  }, [isLoaded, embedData]);

  if (error) {
    return (
      <div className="instagram-card instagram-card--error" ref={cardRef}>
        <p>{error}</p>
        <button
          className="card-error__link"
          onClick={() => {
            haptics.trigger('light');
            onPostClick(post.url);
          }}
        >
          <LuExternalLink size={16} />
          View on Instagram
        </button>
      </div>
    );
  }

  return (
    <div className="instagram-card" ref={cardRef}>
      {/* Music track indicator */}
      {post.musicTrack && (
        <div className="card-music-badge">
          <LuMusic size={14} />
          <span>{post.musicTrack}</span>
        </div>
      )}

      {/* Embed content */}
      <div className="card-embed">
        {!isLoaded && (
          <div className="card-skeleton" role="status" aria-live="polite">
            <div className="skeleton-spinner" />
            <p>Loading...</p>
          </div>
        )}
        {isLoaded && embedData && !embedData.fallback && (
          <div
            className="card-embed__content"
            dangerouslySetInnerHTML={{ __html: embedData.html }}
          />
        )}
        {embedData?.fallback && (
          <div className="card-fallback">
            <LuInstagram size={32} />
            <p>Preview unavailable</p>
            <button
              className="fallback-link"
              onClick={() => {
                haptics.trigger('light');
                onPostClick(post.url);
              }}
            >
              <LuExternalLink size={16} />
              View on Instagram
            </button>
          </div>
        )}
      </div>

      {/* Compact engagement metrics */}
      {post.engagement && (
        <div className="card-metrics">
          {post.engagement.likes && (
            <span className="metric">
              <LuHeart size={14} />
              {formatNumber(post.engagement.likes)}
            </span>
          )}
          {post.engagement.comments && (
            <span className="metric">
              <LuMessageCircle size={14} />
              {formatNumber(post.engagement.comments)}
            </span>
          )}
          {post.engagement.saves && (
            <span className="metric">
              <LuBookmark size={14} />
              {formatNumber(post.engagement.saves)}
            </span>
          )}
        </div>
      )}

      {/* Caption preview */}
      {post.caption && (
        <div className="card-caption">
          <p>{post.caption.length > 100 ? `${post.caption.slice(0, 100)}...` : post.caption}</p>
        </div>
      )}
    </div>
  );
};

export default InstagramEmbedMobile;
