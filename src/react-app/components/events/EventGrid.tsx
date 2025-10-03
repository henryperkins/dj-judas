import { useEffect, useState } from 'react';
import EventCard from './EventCard';
import EventCalendar from './EventCalendar';
import { EventItem } from './EventTypes';
import { LuCalendar, LuList } from 'react-icons/lu';
import { isMobileDevice } from '../../utils/platformDetection';

interface EventsApiResponse {
  upcoming: EventItem[];
  past: EventItem[];
}

export default function EventGrid() {
  const [upcoming, setUpcoming] = useState<EventItem[]>([]);
  const [past, setPast] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>(() => {
    const saved = localStorage.getItem('eventViewMode');
    return (saved === 'calendar' && !isMobileDevice()) ? 'calendar' : 'list';
  });

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        // Primary: try the API endpoint (served by the Worker in dev/prod)
        const res = await fetch('/api/events');
        if (res.ok) {
          const data = await res.json() as EventsApiResponse;
          // If API returns an empty payload (can happen if assets aren't wired), fall back to static JSON
          const isEmpty = (!data?.upcoming || data.upcoming.length === 0) && (!data?.past || data.past.length === 0);
          if (!cancelled && !isEmpty) {
            setUpcoming(data.upcoming || []);
            setPast(data.past || []);
            return;
          }
        }

        // Fallback: load static events file and split into upcoming/past on the client.
        // This covers static preview or misconfigured Worker assets.
        const staticRes = await fetch('/content/events.json');
        if (!staticRes.ok) throw new Error(`events.json ${staticRes.status}`);
        const items: EventItem[] = await staticRes.json();
        const now = Date.now();
        const published = items.filter(e => (e.status ?? 'published') === 'published');
        const upcoming = published.filter(e => new Date(e.endDateTime || e.startDateTime).getTime() >= now)
          .sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
        const past = published.filter(e => new Date(e.endDateTime || e.startDateTime).getTime() < now)
          .sort((a, b) => new Date(b.startDateTime).getTime() - new Date(a.startDateTime).getTime());
        if (!cancelled) {
          setUpcoming(upcoming);
          setPast(past);
          // Helpful for admins: signal that fallback path was used
          if (typeof window !== 'undefined' && window.console) {
            console.warn('[events] Using static fallback from /content/events.json');
          }
        }
      } catch {
        if (!cancelled) setError('Failed to load events');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, []);
  
  const toggleView = (mode: 'list' | 'calendar') => {
    setViewMode(mode);
    localStorage.setItem('eventViewMode', mode);
  };

  if (loading) return <div className="events-section"><p>Loading events…</p></div>;
  if (error) return <div className="events-section"><p>{error}</p></div>;

  return (
    <section id="events" className="events-section">
      <div className="container">
        <div className="events-header">
          <h2 className="section-title">Upcoming Events</h2>
          {upcoming.length > 0 && !isMobileDevice() && (
            <div className="view-toggle">
              <button 
                className={`btn ${viewMode === 'list' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => toggleView('list')}
                aria-label="List view"
              >
                <LuList size={18} /> List
              </button>
              <button 
                className={`btn ${viewMode === 'calendar' ? 'btn-secondary' : 'btn-ghost'}`}
                onClick={() => toggleView('calendar')}
                aria-label="Calendar view"
              >
                <LuCalendar size={18} /> Calendar
              </button>
            </div>
          )}
        </div>
        
        {upcoming.length === 0 ? (
          <p>No upcoming events yet. Check back soon!</p>
        ) : viewMode === 'calendar' ? (
          <EventCalendar events={[...upcoming, ...past]} />
        ) : (
          <div className="events-list">
            {upcoming.map(ev => <EventCard key={ev.id} ev={ev} />)}
          </div>
        )}

        {upcoming.length > 1 && (
          <div className="events-bulk-actions">
            <a href="/events.ics" className="btn btn-secondary">Add All Upcoming to Calendar (ICS)</a>
          </div>
        )}

        {past.length > 0 && (
          <div className="events-past-section">
            <h3 className="section-title">Past Events</h3>
            <div className="events-list">
              {past.map(ev => <EventCard key={ev.id} ev={ev} />)}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
