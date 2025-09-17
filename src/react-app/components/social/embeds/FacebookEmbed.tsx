import React, { useEffect, useRef, useState } from 'react';
import { LuFacebook, LuExternalLink, LuCalendar, LuUsers, LuHeart, LuShare2, LuMusic } from 'react-icons/lu';
import { FaSpotify, FaApple } from 'react-icons/fa';
import { metaSDK } from '../utils/metaSdk';
import { trackSocialClick, trackMusicAction, socialMetrics } from '../utils/socialMetrics';
import type { FacebookEmbedConfig } from '../types';

interface FacebookEvent {
  title: string;
  date: string;
  location: string;
  ticketUrl?: string;
}

interface FacebookEmbedProps extends Partial<FacebookEmbedConfig> {
  // Common props
  url?: string;
  pageUrl?: string;
  videoUrl?: string;
  postUrl?: string;
  className?: string;
  title?: string;
  
  // Page-specific props
  tabs?: string | string[];
  smallHeader?: boolean;
  hideCover?: boolean;
  showFacepile?: boolean;
  hideCta?: boolean;
  adaptContainerWidth?: boolean;
  
  // Video-specific props
  allowfullscreen?: boolean;
  autoplay?: boolean;
  showCaptions?: boolean;
  
  // Hub-specific props
  spotifyArtistId?: string;
  appleMusicArtistUrl?: string;
  upcomingEvents?: FacebookEvent[];
  showMusicDiscovery?: boolean;
  showEngagementStats?: boolean;
  followers?: number;
}

/**
 * Unified hook for Facebook embeds
 */
function useFacebookEmbed(
  selector: 'fb-page' | 'fb-video' | 'fb-post',
  deps: unknown[] = []
) {
  const ref = useRef<HTMLDivElement>(null);
  const stillMounted = useRef(true);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    stillMounted.current = true;

    async function run() {
      try {
        await metaSDK.loadFacebookSDK();
        await new Promise((r) => setTimeout(r, 60));
        if (stillMounted.current && ref.current) {
          await metaSDK.parseFBML(ref.current);
          setLoaded(true);
          
          // Accessibility: ensure SDK-injected iframes get a title
          setTimeout(() => {
            try {
              const container = ref.current;
              if (!container) return;
              const fbPage = container.querySelector('.fb-page') as HTMLElement | null;
              const tab = fbPage?.getAttribute('data-tabs') || '';
              const iframes = container.querySelectorAll('iframe');
              iframes.forEach((iframe) => {
                if (!iframe.getAttribute('title')) {
                  const label = tab.includes('events') 
                    ? 'Facebook events feed' 
                    : selector === 'fb-video' 
                    ? 'Facebook video'
                    : 'Facebook timeline';
                  iframe.setAttribute('title', label);
                }
              });
            } catch {
              // no-op
            }
          }, 0);
        }
      } catch (err) {
        if (stillMounted.current) {
          setError('Failed to load Facebook content');
          console.warn(`${selector} error (non-critical):`, err);
        }
      }
    }

    setLoaded(false);
    setError(null);
    run();

    return () => {
      stillMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, selector]);

  return { ref, loaded, error };
}

const FacebookEmbed: React.FC<FacebookEmbedProps> = ({
  type = 'page',
  url,
  pageUrl,
  videoUrl,
  postUrl,
  className = '',
  title = 'Facebook',
  width = type === 'video' ? 500 : 340,
  height = type === 'video' ? 280 : 500,
  
  // Page props
  tabs = 'timeline',
  smallHeader = false,
  hideCover = false,
  showFacepile = true,
  hideCta = false,
  adaptContainerWidth = true,
  
  // Video props
  allowfullscreen = true,
  autoplay = false,
  showCaptions = true,
  
  // Hub props
  spotifyArtistId,
  appleMusicArtistUrl,
  upcomingEvents = [],
  showMusicDiscovery = false,
  showEngagementStats = false,
  followers
}) => {
  // Determine the actual URL and type
  const embedUrl = url || pageUrl || videoUrl || postUrl || '';
  const embedType: 'page' | 'video' | 'post' = 
    videoUrl || type === 'video' ? 'video' : 
    postUrl || type === 'post' ? 'post' : 
    'page';
  
  const selector = embedType === 'video' ? 'fb-video' : 
                   embedType === 'post' ? 'fb-post' : 
                   'fb-page';
  
  // State for advanced features
  const [activeTab, setActiveTab] = useState<'timeline' | 'events' | 'music'>('timeline');
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);
  
  // Use the unified hook
  const { ref, loaded, error } = useFacebookEmbed(selector, [embedUrl, tabs, activeTab]);
  
  // Track view
  useEffect(() => {
    if (loaded) {
      socialMetrics.trackSocialInteraction('facebook', `${embedType}_view`, {
        url: embedUrl,
        type: embedType
      });
    }
  }, [loaded, embedUrl, embedType]);
  
  // Show music prompt after viewing content
  useEffect(() => {
    if (!showMusicDiscovery) return;
    const timer = setTimeout(() => {
      setShowMusicPrompt(true);
    }, 20000); // 20 seconds
    return () => clearTimeout(timer);
  }, [showMusicDiscovery]);
  
  const handleMusicClick = (platform: 'spotify' | 'apple') => {
    trackSocialClick('facebook', 'music_cta');
    // Use canonical action taxonomy for conversions
    trackMusicAction(platform, 'follow');
    const musicUrl = platform === 'spotify' 
      ? `https://open.spotify.com/artist/${spotifyArtistId}`
      : appleMusicArtistUrl;
    if (musicUrl) window.open(musicUrl, '_blank', 'noopener,noreferrer');
  };
  
  const handleExternalView = () => {
    trackSocialClick('facebook', 'external_view');
  };
  
  if (error) {
    return (
      <div className="facebook-embed-error">
        <p>{error}</p>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent hover:underline"
          onClick={handleExternalView}
        >
          View on Facebook
        </a>
      </div>
    );
  }
  
  // Advanced hub mode with tabs
  if (showMusicDiscovery || upcomingEvents.length > 0) {
    return (
      <div className={`facebook-embed-wrapper facebook-hub ${className}`}>
        <div className="embed-header">
          <div className="platform-badge">
            <LuFacebook size={16} />
            <span>{title}</span>
            {followers && showEngagementStats && (
              <span className="followers-count">
                <LuUsers size={14} />
                {followers.toLocaleString()}
              </span>
            )}
          </div>
          <div className="embed-actions">
            <a
              href={embedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
              onClick={handleExternalView}
            >
              <LuHeart size={14} />
              Follow
            </a>
          </div>
        </div>
        
        {/* Tabs */}
        <nav className="embed-tabs">
          {(['timeline', 'events', 'music'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`tab ${activeTab === t ? 'active' : ''}`}
            >
              {t === 'events' && <LuCalendar size={14} />}
              {t === 'music' && <LuMusic size={14} />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </nav>
        
        {/* Timeline/Events content */}
        {(activeTab === 'timeline' || activeTab === 'events') && (
          <div className="facebook-embed-container">
            {!loaded && (
              <div className="embed-loading" role="status" aria-live="polite">
                <div className="loading-spinner loading-spinner--large" aria-hidden="true" />
                <p>Loading Facebook {activeTab}...</p>
              </div>
            )}
            <div ref={ref} className="facebook-embed-content">
              <div
                className="fb-page"
                data-href={embedUrl}
                data-tabs={activeTab === 'events' ? 'events' : 'timeline'}
                data-width={width}
                data-height={height}
                data-small-header={activeTab === 'events' ? 'true' : String(smallHeader)}
                data-adapt-container-width={String(adaptContainerWidth)}
                data-hide-cover={activeTab === 'events' ? 'true' : String(hideCover)}
                data-show-facepile={activeTab === 'events' ? 'false' : String(showFacepile)}
                data-hide-cta={String(hideCta)}
                data-lazy="true"
              />
            </div>
          </div>
        )}
        
        {/* Music tab */}
        {activeTab === 'music' && showMusicPrompt && (
          <div className="music-discovery">
            <p>🎵 Stream our music catalog</p>
            <div className="music-buttons">
              {spotifyArtistId && (
                <button 
                  className="btn btn-spotify"
                  onClick={() => handleMusicClick('spotify')}
                >
                  <FaSpotify size={16} />
                  Listen on Spotify
                </button>
              )}
              {appleMusicArtistUrl && (
                <button 
                  className="btn btn-apple"
                  onClick={() => handleMusicClick('apple')}
                >
                  <FaApple size={16} />
                  Listen on Apple Music
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Upcoming events */}
        {upcomingEvents.length > 0 && activeTab === 'events' && (
          <div className="upcoming-events">
            <h3>
              <LuCalendar size={16} />
              Upcoming Events
            </h3>
            <ul>
              {upcomingEvents.map((event, i) => (
                <li
                  key={i}
                  onClick={() => event.ticketUrl && window.open(event.ticketUrl, '_blank')}
                  className={event.ticketUrl ? 'clickable' : ''}
                >
                  <time>{event.date}</time>
                  <h4>{event.title}</h4>
                  <p>{event.location}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Engagement stats */}
        {showEngagementStats && followers && (
          <div className="engagement-footer">
            <span>
              <LuUsers size={14} />
              Join {followers.toLocaleString()} followers
            </span>
            <span>
              <LuShare2 size={14} />
              Share the love
            </span>
          </div>
        )}
      </div>
    );
  }
  
  // Simple embed mode
  return (
    <div className={`facebook-embed-wrapper ${className}`}>
      <div className="embed-header">
        <div className="platform-badge">
          <LuFacebook size={16} />
          <span>{title}</span>
        </div>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-ghost"
          onClick={handleExternalView}
        >
          <LuExternalLink size={16} />
          <span>View on Facebook</span>
        </a>
      </div>
      
      <div className="facebook-embed-container">
        {!loaded && (
          <div className="embed-loading" role="status" aria-live="polite">
            <div className="loading-spinner loading-spinner--large" aria-hidden="true" />
            <p>Loading Facebook {embedType}...</p>
          </div>
        )}
        
        <div ref={ref} className="facebook-embed-content">
          {embedType === 'video' ? (
            <div
              className="fb-video"
              data-href={embedUrl}
              data-width={width}
              data-height={height}
              data-allowfullscreen={String(allowfullscreen)}
              data-autoplay={String(autoplay)}
              data-show-captions={String(showCaptions)}
              data-lazy="true"
            />
          ) : embedType === 'post' ? (
            <div
              className="fb-post"
              data-href={embedUrl}
              data-width={width}
              data-show-text="true"
              data-lazy="true"
            />
          ) : (
            <div
              className="fb-page"
              data-href={embedUrl}
              data-tabs={Array.isArray(tabs) ? tabs.join(',') : tabs}
              data-width={width}
              data-height={height}
              data-small-header={String(smallHeader)}
              data-adapt-container-width={String(adaptContainerWidth)}
              data-hide-cover={String(hideCover)}
              data-show-facepile={String(showFacepile)}
              data-hide-cta={String(hideCta)}
              data-lazy="true"
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default FacebookEmbed;
