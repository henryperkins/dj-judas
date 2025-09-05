import { EventItem } from './EventTypes';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';
import { useState, useMemo } from 'react';

type EventCalendarProps = {
  events: EventItem[];
};

function getDaysInMonth(date: Date): Date[] {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const days: Date[] = [];
  
  // Add padding days from previous month
  const startPadding = firstDay.getDay();
  for (let i = startPadding - 1; i >= 0; i--) {
    days.push(new Date(year, month, -i));
  }
  
  // Add all days of current month
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }
  
  // Add padding days from next month to fill grid
  const endPadding = 42 - days.length; // 6 weeks * 7 days
  for (let i = 1; i <= endPadding; i++) {
    days.push(new Date(year, month + 1, i));
  }
  
  return days;
}

function isSameDay(d1: Date, d2: Date): boolean {
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

export default function EventCalendar({ events }: EventCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  const days = useMemo(() => getDaysInMonth(currentMonth), [currentMonth]);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Map events to dates
  const eventsByDate = useMemo(() => {
    const map = new Map<string, EventItem[]>();
    events.forEach(event => {
      const date = new Date(event.startDateTime);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      if (!map.has(key)) {
        map.set(key, []);
      }
      map.get(key)!.push(event);
    });
    return map;
  }, [events]);
  
  const selectedEvents = selectedDate 
    ? eventsByDate.get(`${selectedDate.getFullYear()}-${selectedDate.getMonth()}-${selectedDate.getDate()}`) || []
    : [];
  
  const navigateMonth = (direction: number) => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + direction));
    setSelectedDate(null);
  };
  
  const monthYear = currentMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  return (
    <div className="event-calendar">
      <div className="calendar-header">
        <button 
          onClick={() => navigateMonth(-1)} 
          className="btn btn-ghost"
          aria-label="Previous month"
        >
          <LuChevronLeft size={20} />
        </button>
        <h3 className="calendar-title">{monthYear}</h3>
        <button 
          onClick={() => navigateMonth(1)} 
          className="btn btn-ghost"
          aria-label="Next month"
        >
          <LuChevronRight size={20} />
        </button>
      </div>
      
      <div className="calendar-grid">
        {weekDays.map(day => (
          <div key={day} className="calendar-weekday">
            {day}
          </div>
        ))}
        
        {days.map((day, idx) => {
          const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(day, today);
          const isSelected = selectedDate && isSameDay(day, selectedDate);
          const dayKey = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`;
          const dayEvents = eventsByDate.get(dayKey) || [];
          const hasEvents = dayEvents.length > 0;
          
          return (
            <button
              key={idx}
              className={`calendar-day ${!isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvents ? 'has-events' : ''}`}
              onClick={() => hasEvents ? setSelectedDate(day) : null}
              disabled={!hasEvents}
              aria-label={`${day.getDate()} ${hasEvents ? `- ${dayEvents.length} event${dayEvents.length > 1 ? 's' : ''}` : ''}`}
            >
              <span className="day-number">{day.getDate()}</span>
              {hasEvents && (
                <div className="event-indicators">
                  {dayEvents.slice(0, 3).map((_, i) => (
                    <span key={i} className="event-dot" />
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      {selectedDate && selectedEvents.length > 0 && (
        <div className="calendar-selected-events">
          <h4>Events on {selectedDate.toLocaleDateString()}</h4>
          <div className="selected-events-list">
            {selectedEvents.map(event => (
              <div key={event.id} className="calendar-event-item">
                <div className="event-time">
                  {new Date(event.startDateTime).toLocaleTimeString(undefined, { 
                    hour: 'numeric', 
                    minute: '2-digit' 
                  })}
                </div>
                <div className="event-details">
                  <strong>{event.title}</strong>
                  {event.venueName && <div className="event-venue">{event.venueName}</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}