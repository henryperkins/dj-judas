import { EventItem } from './EventTypes';
import { LuMapPin, LuCalendarPlus, LuExternalLink, LuShare2, LuCopy } from 'react-icons/lu';
import { useMemo, useState } from 'react';
import { isIOS } from '../../utils/platformDetection';

function fmtDate(iso: string) {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  return new Intl.DateTimeFormat(undefined, opts).format(d);
}
function fmtTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function monthDayBadge(iso: string) {
  const d = new Date(iso);
  return {
    month: d.toLocaleString(undefined, { month: 'short' }).toUpperCase(),
    day: d.getDate(),
  };
}

function googleCalUrl(ev: EventItem) {
  const start = new Date(ev.startDateTime);
  const end = new Date(ev.endDateTime || ev.startDateTime);
  const pad = (n: number) => String(n).padStart(2, '0');
  const utc = (d: Date) => `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;
  const dates = `${utc(start)}/${utc(end)}`;
  const details = encodeURIComponent(ev.description || '');
  const location = encodeURIComponent([ev.venueName, ev.address, ev.city, ev.region].filter(Boolean).join(', '));
  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(ev.title)}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`;
}

function eventOffsetMinutes(iso: string): number | null {
  const m = iso.match(/[+-]\d{2}:\d{2}$/);
  if (!m) return 0; // Z or unspecified => treat as UTC
  const sign = m[0][0] === '-' ? -1 : 1;
  const [hh, mm] = m[0].slice(1).split(':').map(Number);
  return sign * (hh * 60 + mm);
}

function userOffsetMinutes(): number {
  return -new Date().getTimezoneOffset(); // convert to ISO-style sign
}

function formatRelative(iso: string): string {
  const now = Date.now();
  const start = new Date(iso).getTime();
  const diffMs = start - now;

  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });

  const byDay = Math.round(diffMs / day);
  if (Math.abs(byDay) >= 1) return rtf.format(byDay, 'day');

  const byHour = Math.round(diffMs / hour);
  if (Math.abs(byHour) >= 1) return rtf.format(byHour, 'hour');

  const byMinute = Math.round(diffMs / minute);
  return rtf.format(byMinute, 'minute');
}

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
  const relativeStr = formatRelative(ev.startDateTime);

  return (
    <article className="event-card">
      {/* Image-first layout */}
      {ev.flyerUrl && (
        <div className="event-flyer">
          <img
            src={ev.flyerUrl}
            alt={`${ev.title} flyer`}
            style={{ width: '100%', borderRadius: 8, maxHeight: 540, objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      )}

      <div className="event-meta-row" style={{ display: 'flex', gap: 16, marginTop: ev.flyerUrl ? 12 : 0 }}>
        <div className="event-date" aria-hidden="true">
          <div className="month">{badge.month}</div>
          <div className="day">{badge.day}</div>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>{ev.title}</h3>
          <p style={{ margin: '4px 0', opacity: 0.9 }}>
            <time dateTime={ev.startDateTime}>{fmtDate(ev.startDateTime)} • {fmtTime(ev.startDateTime)}</time>
            {` • ${relativeStr}`}
            {ev.city ? ` • ${ev.city}${ev.region ? ', ' + ev.region : ''}` : ''}
          </p>
          {showUserLocal && (
            <p style={{ margin: '4px 0', opacity: 0.8 }}>Your time: {fmtTime(ev.startDateTime)}</p>
          )}
          {ev.priceText && <p style={{ margin: '4px 0' }}>{ev.priceText}</p>}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8, alignItems: 'center' }}>
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
