import React, { useEffect, useRef, useState } from 'react';
import { LuInstagram, LuMusic, LuPlay, LuHeart, LuMessageCircle, LuBookmark, LuTrendingUp } from 'react-icons/lu';
import { metaSDK, processInstagramEmbeds } from '../utils/metaSdk';
import { socialMetrics, trackSocialClick, trackMusicAction, generateSocialLink } from '../utils/socialMetrics';

interface InstagramPost {
  url: string;
  type: 'post' | 'reel' | 'story';
  caption?: string;
  musicTrack?: string;
  engagement?: {
    likes: number;
    comments: number;
    saves: number;
  };
}

interface InstagramHubProps {
  posts: InstagramPost[];
  profileUrl: string;
  spotifyPlaylistUrl?: string;
  appleMusicPlaylistUrl?: string;
  showMusicDiscovery?: boolean;
}

const InstagramHub: React.FC<InstagramHubProps> = ({
  posts,
  profileUrl,
  spotifyPlaylistUrl,
  appleMusicPlaylistUrl,
  showMusicDiscovery = true
}) => {
  const embedRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [loadedPosts] = useState<Set<number>>(new Set());
  const [selectedPost, setSelectedPost] = useState<number>(0);
  const [showPlaylistPrompt, setShowPlaylistPrompt] = useState(false);
  const [engagementScore, setEngagementScore] = useState<number>(0);
  const [activeTab, setActiveTab] = useState('grid');

  useEffect(() => {
    const loadInstagram = async () => {
      await metaSDK.loadInstagramEmbed();
      
      // Process all embeds
      await processInstagramEmbeds();
      
      // Track view
      socialMetrics.trackSocialInteraction('instagram', 'feed_view', {
        postCount: posts.length
      });
    };

    loadInstagram();

    // Calculate engagement score
    const totalEngagement = posts.reduce((sum, post) => {
      if (post.engagement) {
        return sum + post.engagement.likes + (post.engagement.comments * 2) + (post.engagement.saves * 3);
      }
      return sum;
    }, 0);
    
    setEngagementScore(Math.round(totalEngagement / posts.length));

    // Show playlist prompt after viewing content
    const timer = setTimeout(() => {
      if (showMusicDiscovery) {
        setShowPlaylistPrompt(true);
      }
    }, 20000); // 20 seconds

    return () => clearTimeout(timer);
  }, [posts, showMusicDiscovery]);

  const handlePostInteraction = (index: number, action: string) => {
    const post = posts[index];
    socialMetrics.trackSocialInteraction('instagram', action, {
      postUrl: post.url,
      postType: post.type,
      hasMusic: !!post.musicTrack
    });

    // If post has music, prompt music discovery
    if (post.musicTrack && action === 'view') {
      setTimeout(() => {
        setShowPlaylistPrompt(true);
      }, 5000);
    }
  };

  const handleMusicDiscovery = (platform: string, url: string) => {
    const trackingUrl = generateSocialLink(url, 'instagram', 'music_discovery', 'ig_hub');
    trackSocialClick('instagram', 'playlist_cta');
    trackMusicAction(platform, 'follow');
    window.open(trackingUrl, '_blank', 'noopener,noreferrer');
  };

  const handleProfileClick = () => {
    socialMetrics.trackSocialInteraction('instagram', 'profile_visit', { profileUrl });
    window.open(profileUrl, '_blank', 'noopener,noreferrer');
  };

  const renderInstagramEmbed = (post: InstagramPost, index: number) => {
    const isLoaded = loadedPosts.has(index);
    
    return (
      <div 
        key={index}
        className={`instagram-post-container ${post.type} ${selectedPost === index ? 'selected' : ''}`}
        onClick={() => {
          setSelectedPost(index);
          handlePostInteraction(index, 'view');
        }}
      >
        {post.type === 'reel' && (
          <div className="reel-indicator">
            <LuPlay size={16} />
            Reel
          </div>
        )}
        
        {!isLoaded && (
          <div className="embed-loading">
            <div className="spinner"></div>
          </div>
        )}
        
        <div 
          ref={el => { embedRefs.current[index] = el; }}
          className="instagram-embed-wrapper"
        >
          <blockquote
            className="instagram-media"
            data-instgrm-permalink={post.url}
            data-instgrm-version="14"
            style={{ 
              background: '#FFF',
              border: '0',
              borderRadius: '3px',
              boxShadow: '0 0 1px 0 rgba(0,0,0,0.5),0 1px 10px 0 rgba(0,0,0,0.15)',
              margin: '1px',
              maxWidth: '540px',
              minWidth: '326px',
              padding: '0',
              width: '99.375%',
              maxHeight: '100%'
            }}
          />
        </div>

        {post.engagement && (
          <div className="engagement-stats">
            <span><LuHeart size={14} /> {post.engagement.likes.toLocaleString()}</span>
            <span><LuMessageCircle size={14} /> {post.engagement.comments}</span>
            <span><LuBookmark size={14} /> {post.engagement.saves}</span>
          </div>
        )}

        {post.musicTrack && (
          <div className="music-track-indicator">
            <LuMusic size={14} />
            <span>{post.musicTrack}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="instagram-hub">
      <div className="hub-header">
        <div className="platform-indicator">
          <LuInstagram size={24} />
          <span>Instagram</span>
          {engagementScore > 0 && (
            <span className="engagement-badge">
              <LuTrendingUp size={14} />
              {engagementScore} engagement
            </span>
          )}
        </div>
        
        <button className="btn btn-secondary" onClick={handleProfileClick}>
          <LuInstagram size={16} />
          View Profile
        </button>
      </div>

      <div className="hub-tabs">
        <button className={activeTab === 'grid' ? 'active' : ''} onClick={() => setActiveTab('grid')}>Grid</button>
        <button className={activeTab === 'music' ? 'active' : ''} onClick={() => setActiveTab('music')}>Music</button>
        <button className={activeTab === 'explore' ? 'active' : ''} onClick={() => setActiveTab('explore')}>Explore</button>
        <button className={activeTab === 'connect' ? 'active' : ''} onClick={() => setActiveTab('connect')}>Connect</button>
      </div>

      {/* Instagram Grid */}
      <div className={`instagram-grid ${activeTab === 'grid' ? 'active' : ''}`}>
        {posts.map((post, index) => renderInstagramEmbed(post, index))}
      </div>

      {/* Music Discovery Section */}
      {showMusicDiscovery && showPlaylistPrompt && (
        <div className={`music-discovery-section ${activeTab === 'music' ? 'active' : ''}`}>
          <h3>🎵 Discover Our Music</h3>
          <p>Love our Instagram content? Listen to the full tracks:</p>
          
          <div className="playlist-buttons">
            {spotifyPlaylistUrl && (
              <button 
                className="platform-btn spotify"
                onClick={() => handleMusicDiscovery('spotify', spotifyPlaylistUrl)}
              >
                <LuMusic size={20} />
                <span>Spotify Playlist</span>
              </button>
            )}
            
            {appleMusicPlaylistUrl && (
              <button 
                className="platform-btn apple"
                onClick={() => handleMusicDiscovery('apple', appleMusicPlaylistUrl)}
              >
                <LuMusic size={20} />
                <span>Apple Music Playlist</span>
              </button>
            )}
          </div>

          <div className="discovery-stats">
            <p>📊 Posts with music get 3x more engagement!</p>
          </div>
        </div>
      )}

      {/* Content Categories */}
      <div className={`content-categories ${activeTab === 'explore' ? 'active' : ''}`}>
        <h3>Explore Content</h3>
        <div className="category-tags">
          <button className="tag" onClick={() => handlePostInteraction(0, 'filter_performances')}>
            #Performances
          </button>
          <button className="tag" onClick={() => handlePostInteraction(0, 'filter_behindscenes')}>
            #BehindTheScenes
          </button>
          <button className="tag" onClick={() => handlePostInteraction(0, 'filter_worship')}>
            #Worship
          </button>
          <button className="tag" onClick={() => handlePostInteraction(0, 'filter_community')}>
            #Community
          </button>
        </div>
      </div>

      {/* Call to Action */}
      <div className={`instagram-cta ${activeTab === 'connect' ? 'active' : ''}`}>
        <h4>Stay Connected</h4>
        <p>Follow us on Instagram for exclusive content, live performances, and ministry updates</p>
        <div className="cta-buttons">
          <button className="btn btn-primary" onClick={handleProfileClick}>
            <LuHeart size={18} />
            Follow on Instagram
          </button>
          {/* Share centralized in CreatorMediaPanel */}
        </div>
      </div>
    </div>
  );
};

export default InstagramHub;
