import React, { useState, useEffect } from 'react';
import { LuMusic, LuExternalLink } from 'react-icons/lu';
import { SpotifyEmbed, AppleMusicEmbed } from './social';

interface Track {
  id: string;
  title: string;
  artist: string;
  spotifyUri?: string;
  appleMusicUrl?: string;
  releaseDate?: string;
  albumArt?: string;
}

interface MusicHubProps {
  tracks: Track[];
  featuredTrackId?: string;
  affiliateToken?: string;
}

const MusicHub: React.FC<MusicHubProps> = ({
  tracks,
  featuredTrackId,
  affiliateToken = ''
}) => {
  const [selectedTrack, setSelectedTrack] = useState<Track | null>(null);
  const [preferredPlatform, setPreferredPlatform] = useState<'spotify' | 'apple' | 'all'>('all');
  const [userDevice, setUserDevice] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect user's device/platform
    const detectDevice = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(userAgent)) {
        setUserDevice('ios');
        setPreferredPlatform('apple');
      } else if (/android/.test(userAgent)) {
        setUserDevice('android');
        setPreferredPlatform('spotify');
      } else {
        setUserDevice('desktop');
      }
    };
    
    detectDevice();
    
    // Set featured track or first track as default
    const featured = featuredTrackId 
      ? tracks.find(t => t.id === featuredTrackId) 
      : tracks[0];
    setSelectedTrack(featured || null);
  }, [tracks, featuredTrackId]);

  const handlePlatformDeepLink = (platform: string, track: Track) => {
    trackEngagement(`${platform}_deeplink`, { 
      trackId: track.id,
      trackTitle: track.title,
      device: userDevice 
    });

    let url = '';
    switch (platform) {
      case 'spotify':
        if (track.spotifyUri) {
          const spotifyId = track.spotifyUri.split(':').pop();
          url = userDevice === 'desktop' 
            ? `https://open.spotify.com/track/${spotifyId}`
            : `spotify:track:${spotifyId}`;
        }
        break;
      case 'apple':
        url = track.appleMusicUrl || '';
        if (userDevice === 'ios' && url) {
          url = url.replace('https://', 'music://');
        }
        break;
    }

    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  interface EngagementData {
    trackId?: string;
    trackTitle?: string;
    [key: string]: unknown;
  }

  const trackEngagement = (action: string, data: EngagementData) => {
    console.log('Track engagement:', action, data);
    // Define gtag on window interface
    const gtagWindow = window as Window & {
      gtag?: (command: string, eventName: string, parameters: Record<string, unknown>) => void;
    };
    if (typeof window !== 'undefined' && gtagWindow.gtag) {
      gtagWindow.gtag('event', action, {
        event_category: 'Music Hub',
        event_label: data.trackTitle || '',
        ...data
      });
    }
  };


  const platformButtons = [
    { 
      id: 'spotify', 
      name: 'Spotify', 
      icon: LuMusic, 
      color: 'hsl(var(--brand-spotify))',
      available: (t: Track) => !!t.spotifyUri 
    },
    { 
      id: 'apple', 
      name: 'Apple Music', 
      icon: LuMusic, 
      color: '#fc3c44',
      available: (t: Track) => !!t.appleMusicUrl 
    }
  ];

  if (!selectedTrack) return null;

  return (
    <div className="music-hub">
      <div className="hub-header">
        <h2>🎵 Stream & Support Our Music</h2>
        <p>Choose your preferred platform to listen, follow, and support</p>
      </div>

      <div className="track-selector">
        <h3>Select a Track</h3>
        <div className="track-list">
          {tracks.map(track => (
            <button
              key={track.id}
              className={`track-item ${selectedTrack?.id === track.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedTrack(track);
                trackEngagement('track_selected', { 
                  trackId: track.id, 
                  trackTitle: track.title 
                });
              }}
            >
              <div className="track-info">
                <span className="track-title">{track.title}</span>
                <span className="track-artist">{track.artist}</span>
              </div>
              {track.releaseDate && (
                <span className="track-date">{track.releaseDate}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="platform-selector">
        <button 
          className={`platform-filter ${preferredPlatform === 'all' ? 'active' : ''}`}
          onClick={() => setPreferredPlatform('all')}
        >
          All Platforms
        </button>
        <button 
          className={`platform-filter ${preferredPlatform === 'spotify' ? 'active' : ''}`}
          onClick={() => setPreferredPlatform('spotify')}
        >
          Spotify
        </button>
        <button 
          className={`platform-filter ${preferredPlatform === 'apple' ? 'active' : ''}`}
          onClick={() => setPreferredPlatform('apple')}
        >
          Apple Music
        </button>
      </div>

      <div className="embeds-container">
        {(preferredPlatform === 'all' || preferredPlatform === 'spotify') && selectedTrack.spotifyUri && (
          <SpotifyEmbed 
            uri={selectedTrack.spotifyUri}
            theme="dark"
            onPlay={() => trackEngagement('spotify_embed_play', {
              trackId: selectedTrack.id,
              trackTitle: selectedTrack.title
            })}
          />
        )}

        {(preferredPlatform === 'all' || preferredPlatform === 'apple') && selectedTrack.appleMusicUrl && (
          <AppleMusicEmbed 
            url={selectedTrack.appleMusicUrl}
            theme="dark"
            affiliateToken={affiliateToken}
          />
        )}
      </div>

      <div className="platform-links">
        <h3>Listen on Your Favorite Platform</h3>
        <div className="platform-grid">
          {platformButtons.map(platform => {
            const isAvailable = platform.available(selectedTrack);
            return (
              <button
                key={platform.id}
                className={`platform-btn ${!isAvailable ? 'disabled' : ''}`}
                onClick={() => isAvailable && handlePlatformDeepLink(platform.id, selectedTrack)}
                disabled={!isAvailable}
                style={{ 
                  '--platform-color': platform.color,
                  opacity: isAvailable ? 1 : 0.3
                } as React.CSSProperties}
              >
                <platform.icon size={24} />
                <span>{platform.name}</span>
                <LuExternalLink size={14} className="external-icon" />
              </button>
            );
          })}
        </div>
      </div>

      {/* Engagement actions centralized in CreatorMediaPanel; removing duplicates here. */}

      <div className="support-message">
        <div className="message-content">
          <h4>Support Gospel Music Ministry</h4>
          <p>Every stream, purchase, and share helps us continue our ministry through music. 
             Follow us on your preferred platform to stay updated with new releases!</p>
          <div className="support-stats">
            <div className="stat">
              <span className="stat-value">100%</span>
              <span className="stat-label">of proceeds support ministry</span>
            </div>
            <div className="stat">
              <span className="stat-value">4+</span>
              <span className="stat-label">Singles Released</span>
            </div>
            <div className="stat">
              <span className="stat-value">16+</span>
              <span className="stat-label">Years of Ministry</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MusicHub;
