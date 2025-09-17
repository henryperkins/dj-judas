import { EventItem } from '@/react-app/components/events/EventTypes'

/**
 * Build a Google Calendar “add event” URL for the given event.
 * Shared across components that need calendar links.
 */
export function googleCalUrl(ev: EventItem): string {
  const start = new Date(ev.startDateTime)
  const end = new Date(ev.endDateTime || ev.startDateTime)

  const pad = (n: number) => String(n).padStart(2, '0')
  const utc = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(
      d.getUTCHours()
    )}${pad(d.getUTCMinutes())}00Z`

  const dates = `${utc(start)}/${utc(end)}`
  const details = encodeURIComponent(ev.description || '')
  const location = encodeURIComponent(
    [ev.venueName, ev.address, ev.city, ev.region].filter(Boolean).join(', ')
  )

  return `https://www.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(
    ev.title
  )}&dates=${dates}&details=${details}&location=${location}&sf=true&output=xml`
}

/**
 * Return the first upcoming published event from a list.
 */
export function firstUpcoming(items: EventItem[]): EventItem | null {
  const now = Date.now()

  const upcoming = items
    .filter((e) => (e.status ?? 'published') === 'published')
    .filter((e) => new Date(e.endDateTime || e.startDateTime).getTime() >= now)
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    )

  return upcoming[0] || null
}
