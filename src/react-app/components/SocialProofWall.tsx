import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlatformIcon,
  PLATFORM_COLORS,
  ACTION_ICONS,
} from './icons/PlatformIcons';
import { socialMetrics } from './social/utils/socialMetrics';
import { FaStar, FaMapMarkerAlt } from 'react-icons/fa';

const {
  users: UsersIcon,
  trending: TrendingIcon,
  heart: HeartIcon,
  play: PlayIcon,
  calendar: CalendarIcon,
  music: MusicIcon,
} = ACTION_ICONS;

interface PlatformMetric {
  platform: string;
  icon: string; // platform key for PlatformIcon
  followers: number;
  engagement: number;
  growth: number;
  color: string;
  url: string;
}

interface LiveMetric {
  label: string;
  value: number | string;
  trend?: 'up' | 'down' | 'stable';
}

interface SocialProofWallProps {
  spotifyMonthlyListeners?: number;
  appleMusicPlays?: number;
  facebookFollowers?: number;
  instagramFollowers?: number;
  totalStreams?: number;
  showLiveMetrics?: boolean;
  featuredTestimonial?: {
    text: string;
    author: string;
    platform: string;
  };
}

const SocialProofWall: React.FC<SocialProofWallProps> = ({
  spotifyMonthlyListeners = 850,
  appleMusicPlays = 1200,
  facebookFollowers = 1600,
  instagramFollowers = 2300,
  totalStreams = 15000,
  showLiveMetrics = true,
  featuredTestimonial,
}) => {
  const [totalReach, setTotalReach] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);

  const platforms: PlatformMetric[] = useMemo(
    () => [
      {
        platform: 'Spotify',
        icon: 'spotify',
        followers: spotifyMonthlyListeners,
        engagement: 45.2,
        growth: 12,
        color: PLATFORM_COLORS.spotify,
        url: 'https://open.spotify.com/artist/4ZxOuNHhpyOj3MOSE23KxR',
      },
      {
        platform: 'Apple Music',
        icon: 'apple-music',
        followers: appleMusicPlays,
        engagement: 38.5,
        growth: 8,
        color: PLATFORM_COLORS['apple-music'],
        url: 'https://music.apple.com/us/artist/dj-lee-voices-of-judah/1540816224',
      },
      {
        platform: 'Facebook',
        icon: 'facebook',
        followers: facebookFollowers,
        engagement: 8.5,
        growth: 5,
        color: PLATFORM_COLORS.facebook,
        url: 'https://www.facebook.com/MidWestScreamers',
      },
      {
        platform: 'Instagram',
        icon: 'instagram',
        followers: instagramFollowers,
        engagement: 12.3,
        growth: 15,
        color: PLATFORM_COLORS.instagram,
        url: 'https://www.instagram.com/iam_djlee',
      },
    ],
    [spotifyMonthlyListeners, appleMusicPlays, facebookFollowers, instagramFollowers]
  );

  useEffect(() => {
    const total = platforms.reduce((sum, p) => sum + p.followers, 0);
    setTotalReach(total);

    const getMetrics = async () => {
      const metrics = await socialMetrics.getAggregatedMetrics();
      setConversionRate(metrics.conversionRate);

      socialMetrics.trackSocialInteraction('social_proof', 'view', {
        totalReach: total,
        platformCount: platforms.length,
      });
    };

    getMetrics();

    if (showLiveMetrics) {
      const interval = setInterval(() => {
        setLiveMetrics([
          {
            label: 'Currently Listening',
            value: Math.floor(Math.random() * 50) + 10,
            trend: 'up',
          },
          {
            label: 'Shares Today',
            value: Math.floor(Math.random() * 20) + 5,
            trend: 'up',
          },
          {
            label: 'New Followers',
            value: `+${Math.floor(Math.random() * 10) + 1}`,
            trend: 'up',
          },
        ]);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [platforms, showLiveMetrics]);

  const handlePlatformClick = (platform: PlatformMetric) => {
    socialMetrics.trackSocialInteraction('social_proof', 'platform_click', {
      platform: platform.platform,
      followers: platform.followers,
    });
    window.open(platform.url, '_blank', 'noopener,noreferrer');
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  return (
    <div className="social-proof-wall">
      {/* Hero Stats */}
      <div className="hero-stats">
        <motion.div
          className="total-reach"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
        >
          <h2>{formatNumber(totalReach)}</h2>
          <p>Total Reach Across All Platforms</p>
        </motion.div>

        <div className="key-metrics">
          <motion.div className="metric-card streams" whileHover={{ scale: 1.05 }}>
            <PlayIcon size={24} color={PLATFORM_COLORS.spotify} />
            <div>
              <span className="metric-value">{formatNumber(totalStreams)}</span>
              <span className="metric-label">Total Streams</span>
            </div>
          </motion.div>

          <motion.div className="metric-card engagement" whileHover={{ scale: 1.05 }}>
            <HeartIcon size={24} color={PLATFORM_COLORS.instagram} />
            <div>
              <span className="metric-value">24.5%</span>
              <span className="metric-label">Avg Engagement</span>
            </div>
          </motion.div>

          <motion.div className="metric-card conversion" whileHover={{ scale: 1.05 }}>
            <TrendingIcon size={24} color={PLATFORM_COLORS.facebook} />
            <div>
              <span className="metric-value">{conversionRate.toFixed(1)}%</span>
              <span className="metric-label">Conversion Rate</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Platform Grid */}
      <div className="platforms-grid">
        {platforms.map((platform, index) => (
          <motion.button
            key={platform.platform}
            type="button"
            className="platform-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={{ y: -5 }}
            onClick={() => handlePlatformClick(platform)}
            style={{ '--platform-color': platform.color } as React.CSSProperties}
            aria-label={`Open ${platform.platform}`}
          >
            <div className="platform-header">
              <PlatformIcon platform={platform.icon} size={24} color={platform.color} />
              <span className="platform-name">{platform.platform}</span>
            </div>

            <div className="platform-stats">
              <div className="follower-count">
                <span className="count">{formatNumber(platform.followers)}</span>
                <span className="label">
                  {platform.platform.includes('Music') ? 'Listeners' : 'Followers'}
                </span>
              </div>

              <div className="platform-metrics">
                <div className="metric">
                  <span className="value">{platform.engagement}%</span>
                  <span className="label">Engagement</span>
                </div>
                <div className="metric growth">
                  <span className="value">+{platform.growth}%</span>
                  <span className="label">Growth</span>
                </div>
              </div>
            </div>

            <div className="platform-cta">
              <span>Connect →</span>
            </div>
          </motion.button>
        ))}
      </div>

      {/* Live Metrics Ticker */}
      {showLiveMetrics && (
        <div className="live-metrics-ticker">
          <div className="ticker-header">
            <span className="live-indicator"></span>
            <span>Live Activity</span>
          </div>
          <div className="ticker-content">
            <AnimatePresence mode="wait">
              {liveMetrics.map((metric, index) => (
                <motion.div
                  key={`${metric.label}-${index}`}
                  className="live-metric"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="metric-label">{metric.label}:</span>
                  <span className={`metric-value trend-${metric.trend}`}>
                    {metric.value}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Featured Testimonial */}
      {featuredTestimonial && (
        <motion.div
          className="featured-testimonial"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <FaStar size={20} />
          <blockquote>"{featuredTestimonial.text}"</blockquote>
          <cite>— {featuredTestimonial.author} via {featuredTestimonial.platform}</cite>
        </motion.div>
      )}

      {/* Call to Action */}
      <div className="social-cta-section">
        <h3>Join Our Growing Community</h3>
        <p>Be part of our ministry through music across all platforms</p>
        <div className="cta-buttons">
          <a href="#media" className="btn btn-primary">
            <MusicIcon size={20} />
            Listen Now
          </a>
        </div>
        <div className="trust-indicators">
          <span><CalendarIcon size={14} /> Active since 2008</span>
          <span><FaMapMarkerAlt size={14} /> Gary, Indiana</span>
          <span><UsersIcon size={14} /> Growing community</span>
        </div>
      </div>
    </div>
  );
};

export default SocialProofWall;
