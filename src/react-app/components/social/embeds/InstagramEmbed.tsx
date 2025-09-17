import React, { useState, useEffect, useRef } from 'react';
import AppleMusicBadge from '@/react-app/components/badges/AppleMusicBadge';
import { LuInstagram, LuExternalLink, LuChevronLeft, LuChevronRight, LuMusic, LuHeart, LuMessageCircle, LuBookmark, LuTrendingUp } from 'react-icons/lu';
import { metaSDK, processInstagramEmbeds } from '../utils/metaSdk';
import { socialMetrics, trackSocialClick, trackMusicAction } from '../utils/socialMetrics';
import type { InstagramEmbedConfig } from '../types';

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

interface InstagramEmbedProps extends Partial<InstagramEmbedConfig> {
  url: string;
  urls?: string[];
  posts?: InstagramPost[];
  profileUrl?: string;
  spotifyPlaylistUrl?: string;
  appleMusicPlaylistUrl?: string;
  showMusicDiscovery?: boolean;
  showEngagementStats?: boolean;
  skeletonHeight?: number;
}

interface InstagramOEmbed {
  html: string;
  author_name?: string;
  title?: string;
  fallback?: boolean;
}

const oEmbedCache = new Map<string, InstagramOEmbed>();

const InstagramEmbed: React.FC<InstagramEmbedProps> = ({
  url,
  urls,
  posts,
  profileUrl,
  spotifyPlaylistUrl,
  appleMusicPlaylistUrl,
  showMusicDiscovery = false,
  showEngagementStats = false,
  maxWidth = 540,
  hideCaption = false,
  skeletonHeight = 600,
  className
}) => {
  const [embedData, setEmbedData] = useState<InstagramOEmbed | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [containerWidth, setContainerWidth] = useState<number | null>(null);
  const [showPlaylistPrompt, setShowPlaylistPrompt] = useState(false);
  const [engagementScore, setEngagementScore] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Get the current URL and post data
  const postList: InstagramPost[] =
    (posts && posts.length > 0)
      ? posts
      : (urls && urls.length > 0)
        ? urls.map((u): InstagramPost => ({ url: u }))
        : [{ url } as InstagramPost];
  const currentPost = postList[activeIndex];
  const currentUrl = currentPost.url;
  const hasCarousel = postList.length > 1;

  // Observe container size for responsive maxWidth
  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    let raf = 0;
    const ro = new ResizeObserver(entries => {
      const w = Math.floor(entries[0].contentRect.width);
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => setContainerWidth(w));
    });
    ro.observe(el);
    setContainerWidth(Math.floor(el.clientWidth));
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  // Calculate engagement score if posts have engagement data
  useEffect(() => {
    if (!posts || !showEngagementStats) return;
    
    const totalEngagement = posts.reduce((sum, post) => {
      if (post.engagement) {
        return sum + (post.engagement.likes || 0) + 
               ((post.engagement.comments || 0) * 2) + 
               ((post.engagement.saves || 0) * 3);
      }
      return sum;
    }, 0);
    
    setEngagementScore(Math.round(totalEngagement / posts.length));
    
    // Track view
    socialMetrics.trackSocialInteraction('instagram', 'feed_view', {
      postCount: posts.length,
      engagementScore
    });
  }, [posts, showEngagementStats, engagementScore]);

  // Fetch oEmbed data
  useEffect(() => {
    let cancelled = false;
    const fetchEmbed = async () => {
      try {
        const effectiveWidth = Math.min(540, Math.max(320, containerWidth || Number(maxWidth)));
        const key = `${currentUrl}|${Math.round(effectiveWidth)}|${hideCaption}`;

        if (oEmbedCache.has(key)) {
          if (!cancelled) {
            setEmbedData(oEmbedCache.get(key)!);
            setIsLoaded(true);
          }
          return;
        }

        const params = new URLSearchParams({
          url: currentUrl,
          maxwidth: String(Math.round(effectiveWidth)),
          omitscript: 'true',
          hidecaption: String(hideCaption)
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
        if (!cancelled) setError('Failed to load Instagram post');
        console.error('Instagram embed error:', err);
      }
    };

    fetchEmbed();
    return () => { cancelled = true; };
  }, [currentUrl, containerWidth, maxWidth, hideCaption]);

  // Process embeds with Meta SDK
  useEffect(() => {
    let active = true;
    const process = async () => {
      if (!isLoaded || !embedData || !containerRef.current) return;
      await metaSDK.loadInstagramEmbed();
      if (active) await processInstagramEmbeds();
    };
    process();
    return () => { active = false; };
  }, [isLoaded, embedData]);

  // Accessibility: ensure SDK-inserted iframes have meaningful titles
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const setTitles = () => {
      try {
        const iframes = el.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
          if (!iframe.getAttribute('title')) {
            iframe.setAttribute('title', 'Instagram post');
          }
        });
      } catch {
        // no-op
      }
    };
    setTitles();
    const mo = new MutationObserver(() => setTitles());
    mo.observe(el, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, [isLoaded, embedData]);

  // Show playlist prompt after viewing content
  useEffect(() => {
    if (!showMusicDiscovery) return;
    const timer = setTimeout(() => {
      setShowPlaylistPrompt(true);
    }, 20000); // 20 seconds
    return () => clearTimeout(timer);
  }, [showMusicDiscovery]);

  const handlePostInteraction = (action: string) => {
    socialMetrics.trackSocialInteraction('instagram', action, {
      postUrl: currentPost.url,
      postType: currentPost.type,
      hasMusic: !!currentPost.musicTrack
    });
  };

  const handlePlaylistClick = (platform: 'spotify' | 'apple') => {
    // Normalize to canonical action taxonomy
    trackMusicAction(platform, 'play');
    const url = platform === 'spotify' ? spotifyPlaylistUrl : appleMusicPlaylistUrl;
    if (url) window.open(url, '_blank', 'noopener,noreferrer');
  };

  const goPrev = () => {
    setActiveIndex(i => Math.max(0, i - 1));
    handlePostInteraction('carousel_prev');
  };
  
  const goNext = () => {
    setActiveIndex(i => Math.min(postList.length - 1, i + 1));
    handlePostInteraction('carousel_next');
  };

  if (error) {
    return (
      <div className="instagram-embed-error">
        <p>{error}</p>
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
        >
          View on Instagram
        </a>
      </div>
    );
  }

  return (
    <div className={`instagram-embed-wrapper ${className || ''}`}>
      <div className="embed-header">
        <div className="platform-badge">
          <LuInstagram size={16} />
          <span>Instagram</span>
          {showEngagementStats && engagementScore > 0 && (
            <span className="engagement-badge">
              <LuTrendingUp size={14} />
              {engagementScore}
            </span>
          )}
        </div>
        <div className="embed-actions">
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              onClick={() => trackSocialClick('instagram', 'profile')}
            >
              View Profile
            </a>
          )}
          <a
            href={currentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            onClick={() => handlePostInteraction('external_view')}
          >
            <LuExternalLink size={16} />
            <span>View on Instagram</span>
          </a>
        </div>
      </div>

      {/* Engagement stats */}
      {showEngagementStats && currentPost.engagement && (
        <div className="engagement-stats">
          {currentPost.engagement.likes && (
            <span className="stat">
              <LuHeart size={14} />
              {currentPost.engagement.likes.toLocaleString()}
            </span>
          )}
          {currentPost.engagement.comments && (
            <span className="stat">
              <LuMessageCircle size={14} />
              {currentPost.engagement.comments.toLocaleString()}
            </span>
          )}
          {currentPost.engagement.saves && (
            <span className="stat">
              <LuBookmark size={14} />
              {currentPost.engagement.saves.toLocaleString()}
            </span>
          )}
        </div>
      )}

      {/* Music discovery */}
      {currentPost.musicTrack && (
        <div className="music-track-info">
          <LuMusic size={14} />
          <span>{currentPost.musicTrack}</span>
        </div>
      )}

      <div className={`instagram-embed-container${hasCarousel ? ' has-carousel' : ''}`} ref={containerRef}>
        {!isLoaded && (
          <div className="embed-loading" style={{ height: skeletonHeight }} role="status" aria-live="polite">
            <div className="loading-spinner loading-spinner--large" aria-hidden="true" />
            <p>Loading Instagram post...</p>
          </div>
        )}

        {isLoaded && embedData && (
          <>
            {embedData.fallback ? (
              <div className="instagram-fallback-container" role="region" aria-label="Instagram preview unavailable">
                <div className="instagram-fallback-header">
                  <LuInstagram size={20} />
                  <span>Instagram</span>
                </div>
                <div className="instagram-fallback-body">
                  <p>Preview unavailable</p>
                  <a
                    href={currentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="instagram-fallback-link"
                  >
                    <LuExternalLink size={16} aria-hidden />
                    View on Instagram
                  </a>
                </div>
              </div>
            ) : (
              <div
                className="instagram-embed-content"
                dangerouslySetInnerHTML={{ __html: embedData.html }}
              />
            )}
          </>
        )}

        {hasCarousel && (
          <div className="ig-carousel-nav">
            <button className="nav prev" onClick={goPrev} aria-label="Previous post" disabled={activeIndex === 0}>
              <LuChevronLeft size={18} />
            </button>
            <div className="dots" aria-label="Slide position">
              {postList.map((_, i) => (
                <span key={i} className={`dot ${i === activeIndex ? 'active' : ''}`} />
              ))}
            </div>
            <button className="nav next" onClick={goNext} aria-label="Next post" disabled={activeIndex === (postList.length - 1)}>
              <LuChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {isLoaded && embedData && (
        <div className="embed-metadata">
          <p className="author-name">{embedData.author_name}</p>
          {embedData.title && (
            <p className="post-title">{embedData.title}</p>
          )}
          {currentPost.caption && (
            <p className="post-caption">{currentPost.caption}</p>
          )}
        </div>
      )}

      {/* Playlist prompt */}
      {showPlaylistPrompt && showMusicDiscovery && (spotifyPlaylistUrl || appleMusicPlaylistUrl) && (
        <div className="playlist-prompt">
          <p>🎵 Discover the music from these posts</p>
          <div className="playlist-buttons">
            {spotifyPlaylistUrl && (
              <button 
                className="btn btn-spotify"
                onClick={() => handlePlaylistClick('spotify')}
              >
                Listen on Spotify
              </button>
            )}
            {appleMusicPlaylistUrl && (
              <AppleMusicBadge href={appleMusicPlaylistUrl} />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InstagramEmbed;
