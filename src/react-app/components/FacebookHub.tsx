import React, { useEffect, useState } from 'react';
import {
  FaFacebookF,
  FaSpotify,
  FaApple,
  FaRegCalendarAlt,
  FaUsers,
  FaRegHeart,
  FaShareAlt,
  FaExternalLinkAlt,
} from 'react-icons/fa';
import { useFacebookEmbed } from './useFacebookEmbed';
import { trackSocialClick, trackMusicAction } from '../utils/socialMetrics';

interface FbEvent {
  title: string;
  date: string;
  location: string;
  ticketUrl?: string;
}

interface FacebookHubProps {
  pageUrl: string;
  spotifyArtistId?: string;
  appleMusicArtistUrl?: string;
  upcomingEvents?: FbEvent[];
  className?: string;
}

const FacebookHub: React.FC<FacebookHubProps> = ({
  pageUrl,
  spotifyArtistId,
  appleMusicArtistUrl,
  upcomingEvents = [],
  className,
}) => {
  const [tab, setTab] = useState<'timeline' | 'events' | 'music'>('timeline');
  const { ref: tlRef, loaded: tlLoaded } = useFacebookEmbed('fb-page', [
    pageUrl,
    tab === 'timeline',
  ]);
  const { ref: evRef, loaded: evLoaded } = useFacebookEmbed('fb-page', [
    pageUrl,
    tab === 'events',
  ]);

  const [followers, setFollowers] = useState<number | null>(null);
  const [showMusicPrompt, setShowMusicPrompt] = useState(false);

  useEffect(() => {
    setFollowers(1600); // demo number; replace with Graph API
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowMusicPrompt(true), 12_000);
    return () => clearTimeout(t);
  }, []);

  /* helpers */
  const open = (url: string) =>
    window.open(url, '_blank', 'noopener,noreferrer');

  const musicClick = (platform: string, url: string) => {
    trackSocialClick('facebook', 'music_cta');
    trackMusicAction(platform, 'follow');
    open(url);
  };

  /* render */
  return (
    <div className={`space-y-6 ${className}`}>
      {/* header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-lg font-medium">
          <FaFacebookF />
          Facebook
          {followers && (
            <span className="text-sm text-muted-foreground">
              {followers.toLocaleString()} followers
            </span>
          )}
        </div>
        <button
          onClick={() => open(pageUrl)}
          className="flex items-center gap-1 text-sm text-primary hover:underline"
        >
          <FaRegHeart /> Follow
        </button>
      </header>

      {/* tabs */}
      <nav className="flex gap-3 text-sm border-b">
        {(['timeline', 'events', 'music'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-2 ${tab === t
                ? 'border-primary border-b-2 font-medium'
                : 'text-muted-foreground'
              }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </nav>

      {/* timeline */}
      {tab === 'timeline' && (
        <section>
          {!tlLoaded && <p className="text-xs animate-pulse">Loading…</p>}
          <div ref={tlRef}>
            <div
              className="fb-page"
              data-href={pageUrl}
              data-tabs="timeline"
              data-height="640"
              data-hide-cover="false"
              data-show-facepile="true"
              data-lazy="true"
            />
          </div>
        </section>
      )}

      {/* events */}
      {tab === 'events' && (
        <section>
          {!evLoaded && <p className="text-xs animate-pulse">Loading…</p>}
          <div ref={evRef}>
            <div
              className="fb-page"
              data-href={pageUrl}
              data-tabs="events"
              data-height="500"
              data-hide-cover="true"
              data-show-facepile="false"
              data-small-header="true"
              data-lazy="true"
            />
          </div>
        </section>
      )}

      {/* music */}
      {tab === 'music' && showMusicPrompt && (
        <section className="space-y-4">
          <p className="text-sm">Stream our catalogue:</p>
          <div className="flex flex-col sm:flex-row gap-3">
            {spotifyArtistId && (
              <button
                className="btn-platform spotify"
                onClick={() =>
                  musicClick(
                    'spotify',
                    `https://open.spotify.com/artist/${spotifyArtistId}`
                  )
                }
              >
                <FaSpotify /> Spotify <FaExternalLinkAlt size={12} />
              </button>
            )}
            {appleMusicArtistUrl && (
              <button
                className="btn-platform apple"
                onClick={() => musicClick('apple', appleMusicArtistUrl)}
              >
                <FaApple /> Apple Music <FaExternalLinkAlt size={12} />
              </button>
            )}
          </div>
        </section>
      )}

      {/* upcoming events (static list) */}
      {upcomingEvents.length > 0 && (
        <section className="space-y-4">
          <h3 className="flex items-center gap-2 text-base font-medium">
            <FaRegCalendarAlt /> Upcoming Events
          </h3>
          <ul className="grid gap-3">
            {upcomingEvents.map((ev, i) => (
              <li
                key={i}
                onClick={() =>
                  ev.ticketUrl ? open(ev.ticketUrl) : undefined
                }
                className="rounded-md border p-3 hover:bg-muted cursor-pointer"
              >
                <time className="block text-xs text-muted-foreground">
                  {ev.date}
                </time>
                <h4 className="font-medium">{ev.title}</h4>
                <p className="text-sm">{ev.location}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* social proof */}
      <footer className="grid gap-2 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <FaUsers /> Join {followers?.toLocaleString()} others
        </span>
        <span className="flex items-center gap-1">
          <FaShareAlt /> Share the love
        </span>
      </footer>
    </div>
  );
};

export default FacebookHub;
