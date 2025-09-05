import { EventItem } from './EventTypes';
import { LuMapPin, LuCalendarPlus, LuExternalLink, LuShare2, LuCopy } from 'react-icons/lu';
import { useState } from 'react';

function fmtDateTime(iso: string) {
  const d = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric', 
    hour: 'numeric', 
    minute: '2-digit',
    timeZoneName: 'short'
  };
  return new Intl.DateTimeFormat(undefined, opts).format(d);
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

export default function EventCard({ ev }: { ev: EventItem }) {
  const [copied, setCopied] = useState(false);
  const badge = monthDayBadge(ev.startDateTime);
  const directionsUrl = (ev.latitude && ev.longitude)
    ? `https://maps.google.com/?q=${ev.latitude},${ev.longitude}`
    : `https://maps.google.com/?q=${encodeURIComponent([ev.venueName, ev.address, ev.city, ev.region].filter(Boolean).join(', '))}`;
  
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

  return (
    <article className="event-card">
      <div style={{ display: 'flex', gap: 16 }}>
        <div className="event-date" aria-label={fmtDateTime(ev.startDateTime)}>
          <div style={{ fontSize: 12 }}>{badge.month}</div>
          <div style={{ fontSize: 20, lineHeight: '22px' }}>{badge.day}</div>
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ margin: 0 }}>{ev.title}</h3>
          <p style={{ margin: '4px 0', opacity: 0.9 }}>{fmtDateTime(ev.startDateTime)}{ev.city ? ` • ${ev.city}${ev.region ? ', ' + ev.region : ''}` : ''}</p>
          {ev.priceText && <p style={{ margin: '4px 0' }}>{ev.priceText}</p>}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
            <a href={googleCalUrl(ev)} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" aria-label="Add to Google Calendar">
              <LuCalendarPlus size={16} /> Add to Calendar
            </a>
            <a href={`/events/${ev.slug}.ics`} className="btn btn-ghost" aria-label="Download ICS">
              ICS
            </a>
            <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" aria-label="Get directions">
              <LuMapPin size={16} /> Directions
            </a>
            {ev.ticketUrl && (
              <a href={ev.ticketUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary" aria-label="Tickets">
                <LuExternalLink size={16} /> Tickets
              </a>
            )}
            <a href={fbShareUrl} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" aria-label="Share on Facebook">
              <LuShare2 size={16} /> Share
            </a>
            <button onClick={copyLink} className="btn btn-ghost" aria-label="Copy event link">
              <LuCopy size={16} /> {copied ? 'Copied!' : 'Copy Link'}
            </button>
          </div>
        </div>
      </div>
      {ev.flyerUrl && (
        <div style={{ marginTop: 12 }}>
          <img
            src={ev.flyerUrl}
            alt={`${ev.title} flyer`}
            style={{ width: '100%', borderRadius: 8, maxHeight: 540, objectFit: 'cover' }}
            loading="lazy"
          />
        </div>
      )}
    </article>
  );
}
