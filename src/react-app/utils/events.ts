import { EventItem } from '@/react-app/components/events/EventTypes'

export type EventsData = {
  upcoming: EventItem[]
  past: EventItem[]
  total: number
  all: EventItem[]
  source: 'api' | 'static'
}

type StructuredEventOptions = {
  eventUrl?: string | null
  imageUrl?: string | null
}

function pruneRecord<T extends Record<string, unknown>>(obj: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(obj).filter(([, value]) => value !== undefined && value !== null && value !== '')
  )
}

function absoluteUrl(path?: string | null): string | undefined {
  if (!path) return undefined
  if (typeof window !== 'undefined' && window.location) {
    try {
      return new URL(path, window.location.origin).toString()
    } catch {
      return path
    }
  }
  return path
}

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

export function buildEventStructuredData(
  event: EventItem,
  options: StructuredEventOptions = {}
): Record<string, unknown> {
  const cityRegion = [event.city, event.region].filter(Boolean).join(', ')
  const absoluteImage = absoluteUrl(options.imageUrl ?? event.flyerUrl)
  const absoluteEventUrl = absoluteUrl(options.eventUrl)

  const location = pruneRecord({
    '@type': 'Place',
    name: event.venueName || cityRegion || undefined,
  }) as Record<string, unknown>

  const address = pruneRecord({
    '@type': 'PostalAddress',
    streetAddress: event.address,
    addressLocality: event.city,
    addressRegion: event.region,
    addressCountry: event.country,
  })

  if (Object.keys(address).length > 1) {
    location.address = address
  }

  if (typeof event.latitude === 'number' && typeof event.longitude === 'number') {
    location.geo = {
      '@type': 'GeoCoordinates',
      latitude: event.latitude,
      longitude: event.longitude,
    }
  }

  const schema = pruneRecord({
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: event.title,
    description: event.description || event.summary,
    startDate: event.startDateTime,
    endDate: event.endDateTime ?? event.startDateTime,
    url: absoluteEventUrl,
    image: absoluteImage ? [absoluteImage] : undefined,
    location: Object.keys(location).length > 1 ? location : undefined,
  }) as Record<string, unknown>

  const offerCandidate = pruneRecord({
    '@type': 'Offer',
    url: event.ticketUrl,
    description: event.priceText,
  })

  if (Object.keys(offerCandidate).length > 1) {
    schema.offers = offerCandidate
  }

  return schema
}

function normalizeEvents(items: EventItem[]): EventsData {
  const now = Date.now()
  const published = items
    .filter((e) => (e.status ?? 'published') === 'published')
    .sort(
      (a, b) =>
        new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime()
    )

  const upcoming = published.filter(
    (e) => new Date(e.endDateTime || e.startDateTime).getTime() >= now
  )
  const past = published
    .filter((e) => new Date(e.endDateTime || e.startDateTime).getTime() < now)
    .reverse()

  return {
    upcoming,
    past,
    total: published.length,
    all: published,
    source: 'static',
  }
}

export async function fetchEventsData(signal?: AbortSignal): Promise<EventsData> {
  try {
    const res = await fetch('/api/events', { signal })
    if (res.ok) {
      const data = await res.json() as {
        upcoming?: EventItem[]
        past?: EventItem[]
        total?: number
      }
      const upcoming = data.upcoming ?? []
      const past = data.past ?? []
      const all = [...upcoming, ...past]
      return {
        upcoming,
        past,
        total: typeof data.total === 'number' ? data.total : all.length,
        all,
        source: 'api',
      }
    }
  } catch {
    // swallow and move to static fallback
  }

  try {
    const res = await fetch('/content/events.json', { signal })
    if (!res.ok) {
      throw new Error('Static events fetch failed')
    }
    const items: EventItem[] = await res.json()
    return normalizeEvents(items)
  } catch (err) {
    console.error('Failed to load events data', err)
    return { upcoming: [], past: [], total: 0, all: [], source: 'static' }
  }
}

export function findEventBySlug(slug: string, data: EventsData): EventItem | null {
  return data.all.find((item) => item.slug === slug) ?? null
}

export async function fetchEventBySlug(
  slug: string,
  signal?: AbortSignal
): Promise<{ event: EventItem | null; data: EventsData }> {
  const data = await fetchEventsData(signal)
  const found = findEventBySlug(slug, data)

  if (found || data.source === 'static') {
    return { event: found, data }
  }

  try {
    const res = await fetch('/content/events.json', { signal })
    if (res.ok) {
      const items: EventItem[] = await res.json()
      const normalized = normalizeEvents(items)
      const combined = {
        ...data,
        upcoming: data.upcoming.length ? data.upcoming : normalized.upcoming,
        past: data.past.length ? data.past : normalized.past,
        total: normalized.total || data.total,
        all: normalized.all.length ? normalized.all : data.all,
      }
      return { event: findEventBySlug(slug, normalized), data: combined }
    }
  } catch (err) {
    console.error('Failed to fetch static events for slug lookup', err)
  }

  return { event: null, data }
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
