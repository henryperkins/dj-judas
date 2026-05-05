import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LuInstagram, LuFacebook, LuShoppingBag, LuHeart, LuMessageCircle, LuShare2, LuRefreshCw } from 'react-icons/lu';
import { socialMetrics } from '../utils/socialMetrics';

interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook';
  type: 'photo' | 'video' | 'carousel' | 'reel';
  mediaUrl: string;
  thumbnailUrl?: string;
  caption: string;
  permalink: string;
  timestamp: string;
  likes?: number;
  comments?: number;
  shares?: number;
  isShoppable?: boolean;
  products?: Array<{
    id: string;
    title: string;
    price: number;
    imageUrl?: string;
    productUrl: string;
    x: number; // Position percentage for tagging
    y: number;
  }>;
  hashtags?: string[];
  mentions?: string[];
}

interface DynamicSocialFeedProps {
  platforms?: ('instagram' | 'facebook')[];
  hashtags?: string[];
  limit?: number;
  layout?: 'grid' | 'masonry' | 'carousel' | 'stories';
  enableShoppable?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  onPostClick?: (post: SocialPost) => void;
  onAvailabilityChange?: (available: boolean) => void;
}

const DynamicSocialFeed: React.FC<DynamicSocialFeedProps> = ({
  platforms = ['instagram', 'facebook'],
  hashtags = [],
  limit = 12,
  layout = 'grid',
  enableShoppable = true,
  autoRefresh = true,
  refreshInterval = 300, // 5 minutes default
  onPostClick,
  onAvailabilityChange
}) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [isNotConfigured, setIsNotConfigured] = useState(false); // Circuit breaker for 501 errors
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const lightboxRef = useRef<HTMLDivElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const platformKey = platforms.join(',');
  const hashtagKey = hashtags.join(',');

  useEffect(() => {
    if (loading) return;
    onAvailabilityChange?.(posts.length > 0);
  }, [loading, onAvailabilityChange, posts.length]);

  // Allow retries if requested feed filters change.
  useEffect(() => {
    setIsNotConfigured(false);
    setHasLoaded(false);
  }, [platformKey, hashtagKey]);

  // Fetch posts from backend
  const fetchPosts = useCallback(async () => {
    // Circuit breaker: Don't retry if API is not configured
    if (isNotConfigured) {
      return;
    }

    // Skip fetch if required params are missing.
    if (platforms.length === 0) {
      setPosts([]);
      setError(null);
      setLoading(false);
      setHasLoaded(true);
      return;
    }

    const isInitialLoad = !hasLoaded;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }
    try {
      const params = new URLSearchParams({
        platforms: platforms.join(','),
        hashtags: hashtags.join(','),
        limit: limit.toString(),
        shoppable: enableShoppable.toString()
      });

      const response = await fetch(`/api/social/feed?${params.toString()}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({})) as { error?: string; message?: string };

        // Handle configuration errors specially - activate circuit breaker
        if (response.status === 501 && errorData.error === 'not_configured') {
          setIsNotConfigured(true); // Prevent further retries
          setPosts([]);
          setError(null); // Don't show error, just hide the feed
          if (isInitialLoad) setHasLoaded(true);
          return;
        }

        throw new Error(errorData.message || 'Failed to fetch social feed');
      }

      const data = await response.json() as { posts?: SocialPost[] };
      if (!data?.posts?.length) {
        setPosts([]);
        setError(null); // No error, just no posts
      } else {
        setPosts(data.posts);
        setError(null);
      }
    } catch (err) {
      console.error('Social feed error:', err);
      setPosts([]);
      setError('Unable to load social feed');
    } finally {
      if (isInitialLoad) {
        setLoading(false);
        setHasLoaded(true);
      } else {
        setRefreshing(false);
      }
    }
  }, [platforms, hashtags, limit, enableShoppable, hasLoaded, isNotConfigured]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    // Skip if API is not configured
    if (isNotConfigured) {
      return;
    }

    fetchPosts();

    // Don't set up auto-refresh if API is not configured
    if (autoRefresh && refreshInterval > 0 && !isNotConfigured) {
      const interval = setInterval(fetchPosts, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchPosts, autoRefresh, refreshInterval, isNotConfigured]);

  // Track engagement
  const handlePostInteraction = (post: SocialPost, action: 'like' | 'comment' | 'share' | 'product_click') => {
    socialMetrics.trackSocialInteraction(post.platform, action, {
      postId: post.id,
      postType: post.type,
      hasProducts: post.isShoppable
    });

    if (action === 'product_click' && post.isShoppable) {
      socialMetrics.trackMusicConversion('website', 'product_view', {
        source: post.platform,
        postId: post.id
      });
    }
  };

  const openPost = useCallback((post: SocialPost) => {
    if (onPostClick) {
      onPostClick(post);
    } else {
      setSelectedPost(post);
    }
  }, [onPostClick]);

  const closeLightbox = useCallback(() => {
    setSelectedPost(null);
  }, []);

  useEffect(() => {
    if (!selectedPost) return;

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeLightbox();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
      previousFocusRef.current?.focus();
    };
  }, [closeLightbox, selectedPost]);

  useEffect(() => {
    if (carouselIndex >= posts.length) {
      setCarouselIndex(0);
    }
  }, [carouselIndex, posts.length]);

  const handleLightboxKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return;

    const focusable = lightboxRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const renderPostCard = (post: SocialPost) => (
    <article
      key={post.id}
      className={`social-post-card ${post.isShoppable ? 'shoppable' : ''}`}
      data-testid="social-post-card"
    >
      <div className="post-header">
        <span className={`platform-badge ${post.platform}`}>
          {post.platform === 'instagram' ? <LuInstagram size={14} /> : <LuFacebook size={14} />}
          {post.platform}
        </span>
        {post.isShoppable && (
          <span className="shoppable-badge">
            <LuShoppingBag size={14} />
            Shop
          </span>
        )}
      </div>

      <div className="post-media">
        <button
          type="button"
          className="post-media-open"
          onClick={() => openPost(post)}
          aria-label={`Open ${post.platform} post`}
        >
          <img
            src={post.thumbnailUrl || post.mediaUrl}
            alt={post.caption.substring(0, 50)}
            loading="lazy"
          />

          {(post.type === 'video' || post.type === 'reel') && (
            <span className="media-type-indicator" aria-hidden="true">▶</span>
          )}
        </button>

        {post.isShoppable && post.products && (
          <div className="product-tags">
            {post.products.map((product) => (
              <button
                type="button"
                key={product.id}
                className={`product-tag ${hoveredProduct === product.id ? 'active' : ''}`}
                style={{ left: `${product.x}%`, top: `${product.y}%` }}
                aria-label={`View ${product.title} for $${product.price}`}
                onMouseEnter={() => setHoveredProduct(product.id)}
                onMouseLeave={() => setHoveredProduct(null)}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePostInteraction(post, 'product_click');
                  window.location.href = product.productUrl;
                }}
              >
                <LuShoppingBag size={16} aria-hidden />
                <span className="sr-only">{`View ${product.title} for $${product.price}`}</span>
                {hoveredProduct === product.id && (
                  <div className="product-tooltip">
                    {product.imageUrl && <img src={product.imageUrl} alt={product.title} />}
                    <div className="product-info">
                      <p className="product-title">{product.title}</p>
                      <p className="product-price">${product.price}</p>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="post-engagement">
        <button
          type="button"
          className="engagement-btn"
          aria-label={`Like ${post.platform} post${post.likes != null ? ` (${post.likes.toLocaleString()} likes)` : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handlePostInteraction(post, 'like');
          }}
        >
          <LuHeart size={16} />
          <span>{post.likes?.toLocaleString()}</span>
        </button>
        <button
          type="button"
          className="engagement-btn"
          aria-label={`Comment on ${post.platform} post${post.comments != null ? ` (${post.comments.toLocaleString()} comments)` : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handlePostInteraction(post, 'comment');
          }}
        >
          <LuMessageCircle size={16} />
          <span>{post.comments?.toLocaleString()}</span>
        </button>
        <button
          type="button"
          className="engagement-btn"
          aria-label={`Share ${post.platform} post${post.shares != null ? ` (${post.shares.toLocaleString()} shares)` : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            handlePostInteraction(post, 'share');
          }}
        >
          <LuShare2 size={16} />
          <span>{post.shares?.toLocaleString()}</span>
        </button>
      </div>

      <div className="post-caption">
        <p>{post.caption.substring(0, 100)}...</p>
        <button type="button" className="post-open-link" onClick={() => openPost(post)}>
          View post
        </button>
      </div>
    </article>
  );

  // Render based on layout
  const renderGrid = () => (
    <div className="social-feed-grid">
      {posts.map(renderPostCard)}
    </div>
  );

  const renderMasonry = () => (
    <div className="social-feed-masonry">
      {posts.map(renderPostCard)}
    </div>
  );

  const renderCarousel = () => {
    const activePost = posts[carouselIndex];
    if (!activePost) return null;

    const previous = () => setCarouselIndex(index => (index - 1 + posts.length) % posts.length);
    const next = () => setCarouselIndex(index => (index + 1) % posts.length);

    return (
      <div className="social-feed-carousel" aria-roledescription="carousel" aria-label="Latest social posts">
        <div className="social-feed-carousel__viewport" aria-live="polite">
          {renderPostCard(activePost)}
        </div>
        {posts.length > 1 && (
          <div className="social-feed-carousel__controls">
            <button type="button" className="btn btn-ghost btn-sm" onClick={previous} aria-label="Previous social post">
              Previous
            </button>
            <span className="social-feed-carousel__count">
              {carouselIndex + 1} / {posts.length}
            </span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={next} aria-label="Next social post">
              Next
            </button>
          </div>
        )}
      </div>
    );
  };

  const renderStories = () => (
    <div className="social-feed-stories">
      {posts.slice(0, 10).map((post) => (
        <button
          type="button"
          key={post.id}
          className="story-bubble"
          onClick={() => setSelectedPost(post)}
          aria-label={`Open ${post.platform} story`}
        >
          <img src={post.thumbnailUrl || post.mediaUrl} alt="" />
          <span className="story-platform">
            {post.platform === 'instagram' ? <LuInstagram /> : <LuFacebook />}
          </span>
        </button>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="social-feed-loading">
        <div className="loading-spinner loading-spinner--large" aria-hidden />
        <p>Loading social feed...</p>
      </div>
    );
  }

  // Hide component entirely if no posts and no error (not configured or genuinely empty)
  if (!posts.length && !error) {
    return null;
  }

  return (
    <div
      className={`dynamic-social-feed layout-${layout} ${refreshing ? 'is-refreshing' : ''}`}
      data-testid="dynamic-social-feed"
    >
      {refreshing && (
        <div className="social-feed-refresh-overlay" aria-hidden="true">
          <div className="loading-spinner" />
          <span>Updating…</span>
        </div>
      )}
      {/* Header */}
      <div className="feed-header">
        <h3>Latest from Social</h3>
        <button
          className="btn btn-ghost"
          onClick={fetchPosts}
          disabled={loading || refreshing}
        >
          <LuRefreshCw size={16} className={loading || refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="feed-notice">
          <p>{error}</p>
        </div>
      )}

      {/* Feed Content */}
      {posts.length > 0 && (
        <>
          {layout === 'grid' && renderGrid()}
          {layout === 'masonry' && renderMasonry()}
          {layout === 'carousel' && renderCarousel()}
          {layout === 'stories' && renderStories()}
        </>
      )}

      {/* Lightbox Modal */}
      {selectedPost && (
        <div
          className="social-post-lightbox"
          onClick={closeLightbox}
        >
          <div
            ref={lightboxRef}
            className="lightbox-content"
            role="dialog"
            aria-modal="true"
            aria-labelledby="social-post-lightbox-title"
            aria-describedby="social-post-lightbox-caption"
            onClick={e => e.stopPropagation()}
            onKeyDown={handleLightboxKeyDown}
          >
            <button
              ref={closeButtonRef}
              type="button"
              className="close-btn"
              onClick={closeLightbox}
              aria-label="Close social post"
            >
              <span aria-hidden="true">×</span>
            </button>
            <img src={selectedPost.mediaUrl} alt={selectedPost.caption} />
            <div className="lightbox-info">
              <h3 id="social-post-lightbox-title">Latest from {selectedPost.platform}</h3>
              <p id="social-post-lightbox-caption">{selectedPost.caption}</p>
              <a
                href={selectedPost.permalink}
                target="_blank"
                rel="noopener noreferrer"
                className="view-original"
              >
                View on {selectedPost.platform}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DynamicSocialFeed;
