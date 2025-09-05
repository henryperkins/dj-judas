import { useEffect, useState } from 'react';
import EventCard from './EventCard';
import EventCalendar from './EventCalendar';
import { EventItem } from './EventTypes';
import { LuCalendar, LuList } from 'react-icons/lu';
import { isMobileDevice } from '../../utils/platformDetection';

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
        const res = await fetch('/api/events');
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        if (!cancelled) {
          setUpcoming(data.upcoming || []);
          setPast(data.past || []);
        }
      } catch (e) {
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

        <div style={{ marginTop: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
          <a href="/events.ics" className="btn btn-secondary">Add All Upcoming to Calendar (ICS)</a>
        </div>

        {past.length > 0 && (
          <div style={{ marginTop: 40 }}>
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
