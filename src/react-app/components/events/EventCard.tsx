import { EventItem } from './EventTypes';
import { LuMapPin, LuCalendarPlus, LuExternalLink, LuShare2, LuCopy } from 'react-icons/lu';
import { useMemo, useState } from 'react';
import { isIOS } from '../../utils/platformDetection';
import { googleCalUrl } from '@/react-app/utils/events';
import {
  eventOffsetMinutes,
  formatFullDate,
  formatPrimaryTime,
  formatRelativeTime,
  formatUserLocalTime,
  monthDayBadge,
  userOffsetMinutes,
} from '@/react-app/utils/dateTime';

export default function EventCard({ ev }: { ev: EventItem }) {
  const [copied, setCopied] = useState(false);
  const badge = monthDayBadge(ev.startDateTime);
  const mapsHref = useMemo(() => {
    if (ev.latitude && ev.longitude) {
      const q = `${ev.latitude},${ev.longitude}`;
      return isIOS() ? `http://maps.apple.com/?q=${q}` : `https://maps.google.com/?q=${q}`;
    }
    const q = [ev.venueName, ev.address, ev.city, ev.region].filter(Boolean).join(', ');
    return isIOS() ? `http://maps.apple.com/?q=${encodeURIComponent(q)}` : `https://maps.google.com/?q=${encodeURIComponent(q)}`;
  }, [ev.latitude, ev.longitude, ev.venueName, ev.address, ev.city, ev.region]);

  const eventUrl = `${window.location.origin}/events/${ev.slug}`;
  const fbShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(eventUrl)}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(eventUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const primaryCalHref = isIOS() ? `/events/${ev.slug}.ics` : googleCalUrl(ev);
  const primaryCalTarget = isIOS() ? undefined : '_blank';
  const primaryCalRel: 'noopener noreferrer' | undefined = isIOS() ? undefined : 'noopener noreferrer';
  const primaryCalLabel = isIOS() ? 'Add to Apple Calendar' : 'Add to Google Calendar';

  const eventOffset = eventOffsetMinutes(ev.startDateTime);
  const userOffset = userOffsetMinutes();
  const showUserLocal = eventOffset !== null && eventOffset !== userOffset;
  const relativeStr = formatRelativeTime(ev.startDateTime);

  return (
    <article className="local-event-card">
      {/* Image-first layout */}
      {ev.flyerUrl && (
        <div className="event-flyer">
          <img
            src={ev.flyerUrl}
            alt={`${ev.title} flyer`}
            loading="lazy"
          />
        </div>
      )}

      <div className="event-meta-row">
        <div className="event-date" aria-hidden="true">
          <div className="month">{badge.month}</div>
          <div className="day">{badge.day}</div>
        </div>
        <div className="event-info">
          <h3>{ev.title}</h3>
          <p className="event-time">
            <time dateTime={ev.startDateTime}>{formatFullDate(ev.startDateTime)} • {formatPrimaryTime(ev.startDateTime)}</time>
            {` • ${relativeStr}`}
            {ev.city ? ` • ${ev.city}${ev.region ? ', ' + ev.region : ''}` : ''}
          </p>
          {showUserLocal && (
            <p className="event-user-time">Your time: {formatUserLocalTime(ev.startDateTime)}</p>
          )}
          {ev.summary && (
            <p className="event-summary">{ev.summary}</p>
          )}
          {(ev.priceSummary || ev.priceText) && (
            <p className="event-price">{ev.priceSummary || ev.priceText}</p>
          )}
        </div>
      </div>

      <div className="event-actions-row">
        {ev.ticketUrl && (
          <a href={ev.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" aria-label="Tickets">
            <LuExternalLink size={16} /> Tickets
          </a>
        )}
        <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" aria-label="Directions">
          <LuMapPin size={16} /> Directions
        </a>
        <a href={primaryCalHref} target={primaryCalTarget} rel={primaryCalRel} className="btn btn-ghost" aria-label={primaryCalLabel}>
          <LuCalendarPlus size={16} /> {primaryCalLabel}
        </a>
        <a href={fbShareUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" aria-label="Share on Facebook">
          <LuShare2 size={16} /> Share
        </a>
        <button onClick={copyLink} className="btn btn-ghost" aria-label="Copy event link">
          <LuCopy size={16} /> {copied ? 'Copied!' : 'Copy Link'}
        </button>
        {!isIOS() && (
          <a href={`/events/${ev.slug}.ics`} className="btn btn-ghost" aria-label="Download ICS">
            ICS
          </a>
        )}
      </div>
    </article>
  );
}
