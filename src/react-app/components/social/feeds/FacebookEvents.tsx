import React, { useState, useEffect, useCallback } from 'react';
import { LuFacebook, LuCalendar, LuMapPin, LuClock, LuUsers, LuTicket, LuExternalLink, LuRefreshCw } from 'react-icons/lu';
import { socialMetrics } from '../utils/socialMetrics';

interface FacebookEvent {
  id: string;
  name: string;
  description?: string;
  startTime: string;
  endTime?: string;
  place?: {
    name: string;
    location?: {
      city?: string;
      country?: string;
      latitude?: number;
      longitude?: number;
      street?: string;
      zip?: string;
    };
  };
  coverPhoto?: string;
  eventUrl: string;
  isOnline?: boolean;
  ticketUri?: string;
  interestedCount?: number;
  attendingCount?: number;
  isCanceled?: boolean;
  category?: string;
}

interface FacebookEventsProps {
  pageId?: string;
  limit?: number;
  showPastEvents?: boolean;
  layout?: 'list' | 'grid' | 'timeline' | 'compact';
  autoRefresh?: boolean;
  refreshInterval?: number; // in seconds
  onEventClick?: (event: FacebookEvent) => void;
}

const FacebookEvents: React.FC<FacebookEventsProps> = ({
  pageId,
  limit = 10,
  showPastEvents = false,
  layout = 'list',
  autoRefresh = true,
  refreshInterval = 3600, // 1 hour default
  onEventClick
}) => {
  const [events, setEvents] = useState<FacebookEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<FacebookEvent | null>(null);

  // Fetch events from backend
  const fetchEvents = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page_id: pageId || '',
        limit: limit.toString(),
        include_past: showPastEvents.toString()
      });

      const response = await fetch(`/api/facebook/events?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch Facebook events');
      
      const data = await response.json();
      if (!data?.events?.length) {
        setEvents(generateDemoEvents());
        setError('Using demo data - API connection pending');
      } else {
        setEvents(data.events);
        setError(null);
      }
    } catch (err) {
      console.error('Facebook events error:', err);
      // Use fallback demo data
      setEvents(generateDemoEvents());
      setError('Using demo data - API connection pending');
    } finally {
      setLoading(false);
    }
  }, [pageId, limit, showPastEvents]);

  // Initial fetch and auto-refresh
  useEffect(() => {
    fetchEvents();
    
    if (autoRefresh && refreshInterval > 0) {
      const interval = setInterval(fetchEvents, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [fetchEvents, autoRefresh, refreshInterval]);

  // Generate demo events
  const generateDemoEvents = (): FacebookEvent[] => {
    const now = new Date();
    return [
      {
        id: 'demo1',
        name: 'DJ Lee & Voices of Judah - Live Concert',
        description: 'Experience an unforgettable night of worship and praise with DJ Lee & Voices of Judah!',
        startTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        endTime: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
        place: {
          name: 'Grace Cathedral',
          location: {
            city: 'San Francisco',
            street: '1100 California St',
            zip: '94108'
          }
        },
        coverPhoto: '/api/placeholder/800/400',
        eventUrl: 'https://facebook.com/events/demo1',
        ticketUri: 'https://tickets.example.com/event1',
        interestedCount: 234,
        attendingCount: 89,
        category: 'MUSIC_EVENT'
      },
      {
        id: 'demo2',
        name: 'Worship Night - Special Guest Performance',
        description: 'Join us for a powerful evening of worship and ministry.',
        startTime: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
        place: {
          name: 'Community Church',
          location: {
            city: 'Oakland',
            street: '2501 Harrison St'
          }
        },
        coverPhoto: '/api/placeholder/800/400',
        eventUrl: 'https://facebook.com/events/demo2',
        interestedCount: 156,
        attendingCount: 67,
        category: 'RELIGIOUS_EVENT'
      },
      {
        id: 'demo3',
        name: 'Virtual Worship Session',
        description: 'Join us online for an intimate worship experience.',
        startTime: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        isOnline: true,
        coverPhoto: '/api/placeholder/800/400',
        eventUrl: 'https://facebook.com/events/demo3',
        interestedCount: 512,
        attendingCount: 203,
        category: 'ONLINE_EVENT'
      }
    ];
  };

  // Format date for display
  const formatEventDate = (date: string) => {
    const d = new Date(date);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    };
    return d.toLocaleString('en-US', options);
  };

  // Track event interaction
  const handleEventInteraction = (event: FacebookEvent, action: 'view' | 'ticket' | 'rsvp') => {
    socialMetrics.trackSocialInteraction('facebook', `event_${action}`, {
      eventId: event.id,
      eventName: event.name,
      isOnline: event.isOnline
    });
  };

  // Render list layout
  const renderList = () => (
    <div className="fb-events-list">
      {events.map((event) => (
        <div 
          key={event.id} 
          className={`event-card ${event.isCanceled ? 'canceled' : ''}`}
          onClick={() => {
            handleEventInteraction(event, 'view');
            onEventClick ? onEventClick(event) : setSelectedEvent(event);
          }}
        >
          {event.coverPhoto && (
            <div className="event-cover">
              <img src={event.coverPhoto} alt={event.name} loading="lazy" />
              {event.isCanceled && (
                <div className="canceled-overlay">CANCELED</div>
              )}
            </div>
          )}
          
          <div className="event-details">
            <div className="event-date">
              <LuCalendar size={16} />
              <span>{formatEventDate(event.startTime)}</span>
            </div>
            
            <h3 className="event-name">{event.name}</h3>
            
            {event.description && (
              <p className="event-description">
                {event.description.substring(0, 150)}...
              </p>
            )}
            
            <div className="event-meta">
              {event.place && (
                <div className="event-location">
                  <LuMapPin size={14} />
                  <span>{event.place.name}</span>
                  {event.place.location?.city && (
                    <span className="city">, {event.place.location.city}</span>
                  )}
                </div>
              )}
              
              {event.isOnline && (
                <div className="event-online">
                  <span className="online-badge">Online Event</span>
                </div>
              )}
              
              <div className="event-stats">
                {event.attendingCount && (
                  <span className="stat">
                    <LuUsers size={14} />
                    {event.attendingCount} going
                  </span>
                )}
                {event.interestedCount && (
                  <span className="stat">
                    {event.interestedCount} interested
                  </span>
                )}
              </div>
            </div>
            
            <div className="event-actions">
              {event.ticketUri && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventInteraction(event, 'ticket');
                    window.open(event.ticketUri, '_blank');
                  }}
                >
                  <LuTicket size={14} />
                  Get Tickets
                </button>
              )}
              <a
                href={event.eventUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-ghost btn-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEventInteraction(event, 'rsvp');
                }}
              >
                <LuExternalLink size={14} />
                View on Facebook
              </a>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render grid layout
  const renderGrid = () => (
    <div className="fb-events-grid">
      {events.map((event) => (
        <div 
          key={event.id} 
          className={`event-grid-card ${event.isCanceled ? 'canceled' : ''}`}
          onClick={() => {
            handleEventInteraction(event, 'view');
            onEventClick ? onEventClick(event) : setSelectedEvent(event);
          }}
        >
          <div className="event-grid-cover">
            <img src={event.coverPhoto || '/api/placeholder/400/200'} alt={event.name} />
            {event.isCanceled && (
              <div className="canceled-badge">CANCELED</div>
            )}
            {event.isOnline && (
              <div className="online-indicator">Online</div>
            )}
          </div>
          
          <div className="event-grid-content">
            <div className="event-grid-date">
              {formatEventDate(event.startTime)}
            </div>
            <h4 className="event-grid-name">{event.name}</h4>
            <div className="event-grid-location">
              {event.place ? event.place.name : 'Online Event'}
            </div>
            <div className="event-grid-stats">
              <span>{event.attendingCount || 0} going</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render timeline layout
  const renderTimeline = () => (
    <div className="fb-events-timeline">
      {events.map((event, index) => (
        <div key={event.id} className="timeline-item">
          <div className="timeline-marker">
            <LuCalendar size={16} />
          </div>
          {index < events.length - 1 && <div className="timeline-line" />}
          
          <div className="timeline-content">
            <div className="timeline-date">
              {formatEventDate(event.startTime)}
            </div>
            <div 
              className={`timeline-card ${event.isCanceled ? 'canceled' : ''}`}
              onClick={() => {
                handleEventInteraction(event, 'view');
                onEventClick ? onEventClick(event) : setSelectedEvent(event);
              }}
            >
              <h4>{event.name}</h4>
              {event.place && (
                <p className="timeline-location">
                  <LuMapPin size={14} />
                  {event.place.name}
                </p>
              )}
              {event.ticketUri && (
                <button
                  className="btn btn-accent btn-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEventInteraction(event, 'ticket');
                    window.open(event.ticketUri, '_blank');
                  }}
                >
                  Get Tickets
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render compact layout
  const renderCompact = () => (
    <div className="fb-events-compact">
      {events.slice(0, 5).map((event) => (
        <a
          key={event.id}
          href={event.eventUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="compact-event"
          onClick={() => handleEventInteraction(event, 'view')}
        >
          <div className="compact-date">
            <span className="day">{new Date(event.startTime).getDate()}</span>
            <span className="month">{new Date(event.startTime).toLocaleString('en', { month: 'short' })}</span>
          </div>
          <div className="compact-info">
            <h5>{event.name}</h5>
            <p>{event.place?.name || 'Online'}</p>
          </div>
        </a>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="fb-events-loading">
        <div className="spinner"></div>
        <p>Loading events...</p>
      </div>
    );
  }

  return (
    <div className={`facebook-events layout-${layout}`}>
      {/* Header */}
      <div className="events-header">
        <h3>
          <LuFacebook size={20} />
          Upcoming Events
        </h3>
        <button 
          className="btn btn-ghost"
          onClick={fetchEvents}
          disabled={loading}
        >
          <LuRefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="events-notice">
          <p>{error}</p>
        </div>
      )}

      {/* Events Content */}
      {events.length === 0 ? (
        <div className="events-empty">
          <p>No upcoming events</p>
        </div>
      ) : (
        <>
          {layout === 'list' && renderList()}
          {layout === 'grid' && renderGrid()}
          {layout === 'timeline' && renderTimeline()}
          {layout === 'compact' && renderCompact()}
        </>
      )}

      {/* Event Detail Modal */}
      {selectedEvent && (
        <div 
          className="event-modal"
          onClick={() => setSelectedEvent(null)}
        >
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button 
              className="modal-close"
              onClick={() => setSelectedEvent(null)}
            >
              ×
            </button>
            
            {selectedEvent.coverPhoto && (
              <img 
                src={selectedEvent.coverPhoto} 
                alt={selectedEvent.name}
                className="modal-cover"
              />
            )}
            
            <div className="modal-body">
              <h2>{selectedEvent.name}</h2>
              
              <div className="modal-meta">
                <div>
                  <LuClock size={16} />
                  {formatEventDate(selectedEvent.startTime)}
                  {selectedEvent.endTime && (
                    <> - {formatEventDate(selectedEvent.endTime)}</>
                  )}
                </div>
                
                {selectedEvent.place && (
                  <div>
                    <LuMapPin size={16} />
                    {selectedEvent.place.name}
                    {selectedEvent.place.location && (
                      <div className="address">
                        {selectedEvent.place.location.street}<br />
                        {selectedEvent.place.location.city}, {selectedEvent.place.location.zip}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {selectedEvent.description && (
                <p className="modal-description">{selectedEvent.description}</p>
              )}
              
              <div className="modal-actions">
                {selectedEvent.ticketUri && (
                  <a
                    href={selectedEvent.ticketUri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-primary"
                    onClick={() => handleEventInteraction(selectedEvent, 'ticket')}
                  >
                    <LuTicket size={16} />
                    Get Tickets
                  </a>
                )}
                <a
                  href={selectedEvent.eventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-ghost"
                  onClick={() => handleEventInteraction(selectedEvent, 'rsvp')}
                >
                  <LuFacebook size={16} />
                  View on Facebook
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FacebookEvents;
