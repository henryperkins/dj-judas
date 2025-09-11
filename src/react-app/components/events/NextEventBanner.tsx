import { useEffect, useState } from 'react';
import { LuCalendarPlus, LuMapPin } from 'react-icons/lu';
import { EventItem } from './EventTypes';
import { isIOS } from '../../utils/platformDetection';
import { googleCalUrl, firstUpcoming } from '@/react-app/utils/events';

interface EventsApiResponse {
  upcoming: EventItem[];
  past: EventItem[];
}

function firstUpcoming(items: EventItem[]): EventItem | null {
  const now = Date.now();
  const upcoming = items
    .filter(e => (e.status ?? 'published') === 'published')
    .filter(e => new Date(e.endDateTime || e.startDateTime).getTime() >= now)
    .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  return upcoming[0] || null;
}

function fmtShort(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString(undefined, { month: 'short', day: 'numeric' });
}

function formatPrimaryTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
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

function mapsUrl(ev: EventItem) {
  const q = [ev.venueName, ev.address, ev.city, ev.region].filter(Boolean).join(', ');
  return isIOS()
    ? `http://maps.apple.com/?q=${encodeURIComponent(q)}`
    : `https://maps.google.com/?q=${encodeURIComponent(q)}`;
}

export default function NextEventBanner() {
  const [event, setEvent] = useState<EventItem | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json() as EventsApiResponse;
          const next = firstUpcoming(data.upcoming || []);
          if (!cancelled && next) return setEvent(next);
        }
      } catch {
        // Ignore API errors and try static fallback
      }
      try {
        const staticRes = await fetch('/content/events.json');
        if (!staticRes.ok) return;
        const items: EventItem[] = await staticRes.json();
        if (!cancelled) setEvent(firstUpcoming(items));
      } catch {
        // Ignore static fetch errors
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);

  if (!event) return null;

  const primaryCalHref = isIOS() ? `/events/${event.slug}.ics` : googleCalUrl(event);
  const primaryCalLabel = isIOS() ? 'Add to Apple Calendar' : 'Add to Google Calendar';

  return (
    <section className="next-event-banner" aria-label="Next event">
      <div className="container">
        <div className="next-event-card">
          <div className="next-event-when">
            <div className="next-event-date">{fmtShort(event.startDateTime)}</div>
            <div className="next-event-time">{formatPrimaryTime(event.startDateTime)}</div>
          </div>
          <div className="next-event-details">
            <div className="next-event-title">{event.title}</div>
            <div className="next-event-meta">{[event.city, event.region].filter(Boolean).join(', ')}</div>
          </div>
          <div className="next-event-actions">
            <a className="btn btn-primary" href={primaryCalHref} target={isIOS() ? undefined : '_blank'} rel="noopener noreferrer">
              <LuCalendarPlus size={16} /> {primaryCalLabel}
            </a>
            <a className="btn btn-ghost" href={mapsUrl(event)} target="_blank" rel="noopener noreferrer">
              <LuMapPin size={16} /> Open in Maps
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
