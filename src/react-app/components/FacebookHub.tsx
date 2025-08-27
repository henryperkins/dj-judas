import React, { useEffect, useRef, useState } from 'react';
import { Facebook, Music, Users, Calendar, ExternalLink, Heart, Share2 } from 'lucide-react';
import { metaSDK, parseFBML } from '../utils/metaSdk';
import { socialMetrics, trackSocialClick, trackMusicAction } from '../utils/socialMetrics';

interface FacebookHubProps {
  pageUrl: string;
  showMusicCTA?: boolean;
  spotifyArtistId?: string;
  appleMusicArtistUrl?: string;
  upcomingEvents?: Array<{
    title: string;
    date: string;
    location: string;
    ticketUrl?: string;
  }>;
}

interface UpcomingEvent {
  title: string;
  date: string;
  location: string;
  ticketUrl?: string;
}

const FacebookHub: React.FC<FacebookHubProps> = ({
  pageUrl,
  showMusicCTA = true,
  spotifyArtistId,
  appleMusicArtistUrl,
  upcomingEvents = []
}) => {
  const pageRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('timeline');

  useEffect(() => {
    const loadFacebook = async () => {
      await metaSDK.loadFacebookSDK();
      if (pageRef.current) {
        await parseFBML(pageRef.current);
        setIsLoaded(true);
        
        // Track page view
        socialMetrics.trackSocialInteraction('facebook', 'page_view', { pageUrl });
      }
    };

    loadFacebook();

    // Show music prompt after user engages with content
    const timer = setTimeout(() => {
      setShowMusicPrompt(true);
    }, 15000); // Show after 15 seconds

    return () => clearTimeout(timer);
  }, [pageUrl]);

  // Simulate fetching follower count (in production, use Graph API)
  useEffect(() => {
    setFollowerCount(1600);
  }, []);

  const handleMusicPlatformClick = (platform: string, url: string) => {
    trackSocialClick('facebook', 'music_cta');
    trackMusicAction(platform, 'follow');
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleEventClick = (event: UpcomingEvent & Record<string, unknown>) => {
    socialMetrics.trackSocialInteraction('facebook', 'event_interest', event);
    if (event.ticketUrl) {
      window.open(event.ticketUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFollowClick = () => {
    socialMetrics.trackSocialInteraction('facebook', 'follow_intent', { pageUrl });
    window.open(pageUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="facebook-hub">
      <div className="hub-header">
        <div className="platform-indicator">
          <Facebook size={24} />
          <span>Facebook</span>
          {followerCount && (
            <span className="follower-count">{followerCount.toLocaleString()} followers</span>
          )}
        </div>
        
        <button className="follow-btn" onClick={handleFollowClick}>
          <Heart size={16} />
          Follow on Facebook
        </button>
      </div>

      <div className="facebook-tabs">
        <button className={activeTab === 'timeline' ? 'active' : ''} onClick={() => setActiveTab('timeline')}>Timeline</button>
        <button className={activeTab === 'events' ? 'active' : ''} onClick={() => setActiveTab('events')}>Events</button>
        <button className={activeTab === 'music' ? 'active' : ''} onClick={() => setActiveTab('music')}>Music</button>
      </div>

      {/* Facebook Page Plugin with Events Tab */}
      <div className={`facebook-embed-container ${activeTab === 'timeline' ? 'active' : ''}`}>
        {!isLoaded && (
          <div className="embed-loading">
            <div className="loading-spinner"></div>
            <p>Loading Facebook content...</p>
          </div>
        )}
        
        <div ref={pageRef}>
          <div 
            className="fb-page"
            data-href={pageUrl}
            data-tabs="timeline,events,messages"
            data-height="700"
            data-small-header="false"
            data-adapt-container-width="true"
            data-hide-cover="false"
            data-show-facepile="true"
            data-lazy="false"
          />
        </div>
      </div>

      {/* Dedicated Facebook Events Plugin for better visibility */}
      <div className={`facebook-events-container ${activeTab === 'events' ? 'active' : ''}`}>
        <h3>
          <Calendar size={20} />
          Facebook Events
        </h3>
        <div ref={pageRef}>
          <div 
            className="fb-page"
            data-href={pageUrl}
            data-tabs="events"
            data-height="400"
            data-small-header="true"
            data-adapt-container-width="true"
            data-hide-cover="true"
            data-show-facepile="false"
          />
        </div>
      </div>

      {/* Music Platform CTAs */}
      {showMusicCTA && showMusicPrompt && (
        <div className={`music-cta-section ${activeTab === 'music' ? 'active' : ''}`}>
          <h3>🎵 Listen to Our Music</h3>
          <p>Enjoy our Facebook content? Stream our full catalog:</p>
          
          <div className="music-platform-buttons">
            {spotifyArtistId && (
              <button 
                className="platform-btn spotify"
                onClick={() => handleMusicPlatformClick(
                  'spotify', 
                  `https://open.spotify.com/artist/${spotifyArtistId}`
                )}
              >
                <Music size={20} />
                <span>Listen on Spotify</span>
                <ExternalLink size={14} />
              </button>
            )}
            
            {appleMusicArtistUrl && (
              <button 
                className="platform-btn apple"
                onClick={() => handleMusicPlatformClick(
                  'apple', 
                  appleMusicArtistUrl
                )}
              >
                <Music size={20} />
                <span>Listen on Apple Music</span>
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Upcoming Events */}
      {upcomingEvents.length > 0 && (
        <div className="events-section">
          <h3>
            <Calendar size={20} />
            Upcoming Events
          </h3>
          <div className="events-list">
            {upcomingEvents.map((event, index) => (
              <div 
                key={index} 
                className="event-card"
                onClick={() => handleEventClick(event)}
              >
                <div className="event-date">{event.date}</div>
                <div className="event-details">
                  <h4>{event.title}</h4>
                  <p>{event.location}</p>
                </div>
                {event.ticketUrl && (
                  <button className="ticket-btn">Get Tickets</button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Social Proof */}
      <div className="social-proof">
        <div className="proof-item">
          <Users size={20} />
          <span>Join {followerCount?.toLocaleString()} fans on Facebook</span>
        </div>
        <div className="proof-item">
          <Share2 size={20} />
          <span>Share our music with your friends</span>
        </div>
      </div>

      {/* Video Section (for live streams or featured videos) */}
      <div className="video-section">
        <h3>Featured Videos</h3>
        <p className="video-hint">Watch our performances and behind-the-scenes content</p>
        {/* Videos would be dynamically loaded here */}
      </div>
    </div>
  );
};

export default FacebookHub;
