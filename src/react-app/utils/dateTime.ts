/**
 * Format a short month/day label such as "Jan 5" using the user's locale.
 */
export function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Format a primary time label (e.g. "7:00 PM") in the user's locale.
 */
export function formatPrimaryTime(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

/**
 * Format a short full date including year for verbose contexts.
 */
export function formatFullDate(iso: string): string {
  const date = new Date(iso);
  const opts: Intl.DateTimeFormatOptions = {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  };
  return new Intl.DateTimeFormat(undefined, opts).format(date);
}

/**
 * Build a badge-style structure for month/day displays.
 */
export function monthDayBadge(iso: string): { month: string; day: number } {
  const date = new Date(iso);
  return {
    month: date.toLocaleString(undefined, { month: 'short' }).toUpperCase(),
    day: date.getDate(),
  };
}

/**
 * Format a relative time string (e.g. "in 2 days") from now.
 */
export function formatRelativeTime(iso: string): string {
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

/**
 * Extract the timezone offset minutes encoded in an ISO timestamp.
 */
export function eventOffsetMinutes(iso: string): number | null {
  const match = iso.match(/[+-]\d{2}:\d{2}$/);
  if (!match) {
    // Zulu or no offset provided; treat as UTC for comparison purposes.
    return 0;
  }
  const sign = match[0][0] === '-' ? -1 : 1;
  const [hours, minutes] = match[0].slice(1).split(':').map(Number);
  return sign * (hours * 60 + minutes);
}

/**
 * The user's current timezone offset, expressed like ISO (+/- minutes).
 */
export function userOffsetMinutes(): number {
  return -new Date().getTimezoneOffset();
}

/**
 * Whether the event's timezone offset differs from the user's local offset.
 */
export function hasDifferentTimezone(iso: string): boolean {
  const eventOffset = eventOffsetMinutes(iso);
  if (eventOffset === null) return false;
  return eventOffset !== userOffsetMinutes();
}

/**
 * Format the event time in the user's locale (for "Your time" displays).
 */
export function formatUserLocalTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}
