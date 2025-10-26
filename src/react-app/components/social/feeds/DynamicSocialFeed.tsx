import React, { useState, useEffect, useCallback } from 'react';
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
    imageUrl: string;
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
}

const DynamicSocialFeed: React.FC<DynamicSocialFeedProps> = ({
  platforms = ['instagram', 'facebook'],
  hashtags = [],
  limit = 12,
  layout = 'grid',
  enableShoppable = true,
  autoRefresh = true,
  refreshInterval = 300, // 5 minutes default
  onPostClick
}) => {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<SocialPost | null>(null);
  const [hoveredProduct, setHoveredProduct] = useState<string | null>(null);
  const [isNotConfigured, setIsNotConfigured] = useState(false); // Circuit breaker for 501 errors

  // Fetch posts from backend
  const fetchPosts = useCallback(async () => {
    // Circuit breaker: Don't retry if API is not configured
    if (isNotConfigured) {
      return;
    }

    // Skip fetch if required params are missing (API will return 400/501)
    if (platforms.length === 0 || (platforms.includes('instagram') && hashtags.length === 0)) {
      setIsNotConfigured(true);
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


  // Render based on layout
  const renderGrid = () => (
    <div className="social-feed-grid">
      {posts.map((post) => (
        <div
          key={post.id}
          className={`social-post-card ${post.isShoppable ? 'shoppable' : ''}`}
          onClick={() => onPostClick ? onPostClick(post) : setSelectedPost(post)}
        >
          {/* Platform Badge */}
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

          {/* Media */}
          <div className="post-media">
            <img
              src={post.thumbnailUrl || post.mediaUrl}
              alt={post.caption.substring(0, 50)}
              loading="lazy"
            />

            {/* Product Tags */}
            {post.isShoppable && post.products && (
              <div className="product-tags">
                {post.products.map((product) => (
                  <button
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
                        <img src={product.imageUrl} alt={product.title} />
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

            {/* Video/Reel Indicator */}
            {(post.type === 'video' || post.type === 'reel') && (
              <div className="media-type-indicator">▶</div>
            )}
          </div>

          {/* Engagement */}
          <div className="post-engagement">
            <button
              className="engagement-btn"
              onClick={(e) => {
                e.stopPropagation();
                handlePostInteraction(post, 'like');
              }}
            >
              <LuHeart size={16} />
              <span>{post.likes?.toLocaleString()}</span>
            </button>
            <button
              className="engagement-btn"
              onClick={(e) => {
                e.stopPropagation();
                handlePostInteraction(post, 'comment');
              }}
            >
              <LuMessageCircle size={16} />
              <span>{post.comments?.toLocaleString()}</span>
            </button>
            <button
              className="engagement-btn"
              onClick={(e) => {
                e.stopPropagation();
                handlePostInteraction(post, 'share');
              }}
            >
              <LuShare2 size={16} />
              <span>{post.shares?.toLocaleString()}</span>
            </button>
          </div>

          {/* Caption Preview */}
          <div className="post-caption">
            <p>{post.caption.substring(0, 100)}...</p>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMasonry = () => (
    <div className="social-feed-masonry">
      {/* Masonry layout implementation */}
      {renderGrid()} {/* Simplified for now */}
    </div>
  );

  const renderCarousel = () => (
    <div className="social-feed-carousel">
      {/* Carousel implementation */}
      {renderGrid()} {/* Simplified for now */}
    </div>
  );

  const renderStories = () => (
    <div className="social-feed-stories">
      {posts.slice(0, 10).map((post) => (
        <button
          key={post.id}
          className="story-bubble"
          onClick={() => setSelectedPost(post)}
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
    <div className={`dynamic-social-feed layout-${layout} ${refreshing ? 'is-refreshing' : ''}`}>
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
          onClick={() => setSelectedPost(null)}
        >
          <div className="lightbox-content" onClick={e => e.stopPropagation()}>
            <button
              className="close-btn"
              onClick={() => setSelectedPost(null)}
            >
              ×
            </button>
            <img src={selectedPost.mediaUrl} alt={selectedPost.caption} />
            <div className="lightbox-info">
              <p>{selectedPost.caption}</p>
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
