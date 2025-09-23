import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  LuArrowLeft,
  LuCalendarPlus,
  LuCopy,
  LuDownload,
  LuExternalLink,
  LuMapPin,
  LuShare2,
} from 'react-icons/lu';

import EventCard from '@/react-app/components/events/EventCard';
import type { EventItem } from '@/react-app/components/events/EventTypes';
import {
  buildEventStructuredData,
  fetchEventBySlug,
  googleCalUrl,
  type EventsData,
} from '@/react-app/utils/events';
import {
  eventOffsetMinutes,
  formatFullDate,
  formatPrimaryTime,
  formatRelativeTime,
  formatShortDate,
  formatUserLocalTime,
  userOffsetMinutes,
} from '@/react-app/utils/dateTime';
import { isIOS } from '@/react-app/utils/platformDetection';

const descriptionToParagraphs = (description?: string) => {
  if (!description) return [];
  return description
    .split(/\n+/)
    .map((segment) => segment.trim())
    .filter(Boolean);
};

type CopyState = 'idle' | 'copied' | 'error';

type EventDetailsPageProps = {
  slug: string;
};

export default function EventDetailsPage({ slug }: EventDetailsPageProps) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [eventsData, setEventsData] = useState<EventsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  const faqItems = event?.faq ?? [];

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { event: foundEvent, data } = await fetchEventBySlug(slug, controller.signal);
        if (!cancelled) {
          setEvent(foundEvent);
          setEventsData(data);
          if (!foundEvent) {
            setError('Event not found.');
          }
        }
      } catch (err) {
        if (!cancelled) {
          if (!(err instanceof DOMException && err.name === 'AbortError')) {
            console.error('Failed to load event details', err);
          }
          setError('Unable to load this event.');
          setEvent(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [slug]);

  useEffect(() => {
    setCopyState('idle');
    setShareMessage(null);
    setImageFailed(false);
  }, [slug]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!shareMessage && copyState !== 'copied' && copyState !== 'error') return;
    const timeout = window.setTimeout(() => {
      setShareMessage(null);
      if (copyState !== 'idle') setCopyState('idle');
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState, shareMessage]);

  const eventUrl = useMemo(() => {
    if (!event?.slug) return null;
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/events/${event.slug}`;
    }
    return `/events/${event.slug}`;
  }, [event?.slug]);

  const icsHref = useMemo(() => {
    if (!event?.slug) return undefined;
    return `/events/${event.slug}.ics`;
  }, [event?.slug]);

  useEffect(() => {
    if (!event) return;
    if (!icsHref || typeof document === 'undefined') return;
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = icsHref;
    link.as = 'fetch';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, [event, icsHref]);

  const flyerSrc = useMemo(() => {
    if (!event) return undefined;
    if (event.flyerUrl) return event.flyerUrl;
    if (event.slug) return `/content/flyers/${event.slug}.jpg`;
    return undefined;
  }, [event]);

  const mapsHref = useMemo(() => {
    if (!event) return undefined;
    if (event.latitude != null && event.longitude != null) {
      const q = `${event.latitude},${event.longitude}`;
      return isIOS() ? `http://maps.apple.com/?q=${q}` : `https://maps.google.com/?q=${q}`;
    }
    const q = [event.venueName, event.address, event.city, event.region].filter(Boolean).join(', ');
    if (!q) return undefined;
    return isIOS()
      ? `http://maps.apple.com/?q=${encodeURIComponent(q)}`
      : `https://maps.google.com/?q=${encodeURIComponent(q)}`;
  }, [event]);

  const calendarHref = useMemo(() => {
    if (!event) return '#';
    return isIOS() ? (icsHref ?? '#') : googleCalUrl(event);
  }, [event, icsHref]);

  const calendarLabel = isIOS() ? 'Add to Apple Calendar' : 'Add to Google Calendar';

  const relativeTime = event ? formatRelativeTime(event.startDateTime) : null;
  const showUserTime = useMemo(() => {
    if (!event) return false;
    const eventOffset = eventOffsetMinutes(event.startDateTime);
    return eventOffset !== null && eventOffset !== userOffsetMinutes();
  }, [event]);

  const cityRegion = useMemo(
    () => (event ? [event.city, event.region].filter(Boolean).join(', ') : ''),
    [event]
  );

  const flyerAspectValue = useMemo(() => {
    if (!event?.flyerWidth || !event?.flyerHeight) return undefined;
    if (event.flyerWidth <= 0 || event.flyerHeight <= 0) return undefined;
    return `${event.flyerWidth} / ${event.flyerHeight}`;
  }, [event?.flyerWidth, event?.flyerHeight]);

  const structuredData = useMemo(() => {
    if (!event) return null;
    return buildEventStructuredData(event, { eventUrl, imageUrl: flyerSrc });
  }, [event, eventUrl, flyerSrc]);

  const descriptionParagraphs = useMemo(
    () => descriptionToParagraphs(event?.description),
    [event?.description]
  );

  const otherUpcoming = useMemo(() => {
    if (!eventsData) return [] as EventItem[];
    return eventsData.upcoming.filter((item) => item.slug !== event?.slug).slice(0, 3);
  }, [event?.slug, eventsData]);

  const otherPast = useMemo(() => {
    if (!eventsData) return [] as EventItem[];
    return eventsData.past.filter((item) => item.slug !== event?.slug).slice(0, 3);
  }, [event?.slug, eventsData]);

  const showOtherEvents = otherUpcoming.length > 0 || otherPast.length > 0;

  const mapEmbedSrc = useMemo(() => {
    if (!event) return null;
    if (event.mapEmbedUrl) return event.mapEmbedUrl;
    if (event.latitude != null && event.longitude != null) {
      const lat = Number(event.latitude.toFixed(6));
      const lng = Number(event.longitude.toFixed(6));
      return `https://www.google.com/maps?q=${lat},${lng}&z=15&output=embed`;
    }
    const q = [event.venueName, event.address, event.city, event.region, event.country]
      .filter(Boolean)
      .join(', ');
    if (q) {
      return `https://www.google.com/maps?q=${encodeURIComponent(q)}&z=15&output=embed`;
    }
    return null;
  }, [event]);

  const skeleton = (
    <div className="event-details-card event-details-card--loading">
      <div className="event-details-hero">
        <div className="event-details-flyer skeleton-block" />
        <div className="event-details-summary">
          <div className="skeleton-pill" aria-hidden="true" />
          <div className="skeleton-line skeleton-line--title" aria-hidden="true" />
          <div className="skeleton-line" aria-hidden="true" />
          <div className="skeleton-line skeleton-line--short" aria-hidden="true" />
          <div className="skeleton-button-row">
            <span className="skeleton-button" />
            <span className="skeleton-button" />
            <span className="skeleton-button" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="event-details-page" aria-labelledby="event-details-heading">
      <div className="container">
        <a className="event-details-back" href="/#events">
          <LuArrowLeft size={18} aria-hidden="true" /> Back to events
        </a>

        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}

        {loading && skeleton}

        {!loading && error && (
          <div className="event-details-empty" role="status">
            <h1 id="event-details-heading">Event unavailable</h1>
            <p>{error}</p>
          </div>
        )}

        {!loading && !error && event && (
          <article className="event-details-card" aria-labelledby="event-details-heading">
            <div className="event-details-hero">
              {flyerSrc && !imageFailed ? (
                <div
                  className="event-details-flyer"
                  style={
                    flyerAspectValue
                      ? ({ '--event-flyer-aspect': flyerAspectValue } as CSSProperties)
                      : undefined
                  }
                >
                  <img
                    src={flyerSrc}
                    alt={`${event.title} flyer`}
                    width={event.flyerWidth ?? undefined}
                    height={event.flyerHeight ?? undefined}
                    loading="eager"
                    decoding="async"
                    onError={() => setImageFailed(true)}
                  />
                </div>
              ) : (
                <div className="event-details-flyer event-details-flyer--placeholder" role="presentation">
                  <span>{formatShortDate(event.startDateTime)}</span>
                  <span>{event.title}</span>
                </div>
              )}

              <div className="event-details-summary">
                <h1 id="event-details-heading">{event.title}</h1>
                <p className="event-details-when">
                  <time dateTime={event.startDateTime}>
                    {formatFullDate(event.startDateTime)} • {formatPrimaryTime(event.startDateTime)}
                  </time>
                  {relativeTime ? ` • ${relativeTime}` : ''}
                </p>
                {cityRegion && (
                  <p className="event-details-location">
                    <LuMapPin size={16} aria-hidden="true" /> {cityRegion}
                  </p>
                )}
                {event.venueName && (
                  <p className="event-details-venue">Venue: {event.venueName}</p>
                )}
                {showUserTime && (
                  <p className="event-details-user-time">Your time: {formatUserLocalTime(event.startDateTime)}</p>
                )}
                {(event.priceSummary || event.priceText) && (
                  <p className="event-details-price">{event.priceSummary || event.priceText}</p>
                )}

                {event.summary && (
                  <p className="event-details-summary-text">{event.summary}</p>
                )}

                <div className="event-details-actions" role="group" aria-label="Event actions">
                  {event.ticketUrl && (
                    <a
                      className="btn btn-primary"
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Tickets"
                    >
                      <LuExternalLink size={16} aria-hidden="true" /> Tickets
                    </a>
                  )}

                  {mapsHref && (
                    <a
                      className="btn btn-secondary"
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="Directions"
                    >
                      <LuMapPin size={16} aria-hidden="true" /> Directions
                    </a>
                  )}

                  <a
                    className="btn btn-ghost"
                    href={calendarHref}
                    target={isIOS() ? undefined : '_blank'}
                    rel={isIOS() ? undefined : 'noopener noreferrer'}
                    aria-label={calendarLabel}
                  >
                    <LuCalendarPlus size={16} aria-hidden="true" /> {calendarLabel}
                  </a>

                  {icsHref && !isIOS() && (
                    <a className="btn btn-ghost" href={icsHref} aria-label="Download ICS file">
                      <LuDownload size={16} aria-hidden="true" /> Download ICS
                    </a>
                  )}

                  {eventUrl && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={async () => {
                        if (!eventUrl) return;
                        if (typeof navigator === 'undefined') {
                          setShareMessage('Sharing not supported');
                          return;
                        }

                        if (navigator.share) {
                          try {
                            await navigator.share({
                              title: event.title,
                              text: event.description,
                              url: eventUrl,
                            });
                            setShareMessage('Shared');
                          } catch (err) {
                            if (err instanceof DOMException && err.name === 'AbortError') return;
                            setShareMessage('Sharing failed');
                          }
                          return;
                        }

                        if (navigator.clipboard?.writeText) {
                          try {
                            await navigator.clipboard.writeText(eventUrl);
                            setShareMessage('Link copied');
                          } catch {
                            setShareMessage('Unable to share');
                          }
                        } else {
                          setShareMessage('Sharing not supported');
                        }
                      }}
                      aria-label="Share event"
                    >
                      <LuShare2 size={16} aria-hidden="true" /> Share
                    </button>
                  )}

                  {eventUrl && (
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={async () => {
                        if (!eventUrl) return;
                        if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
                          setCopyState('error');
                          return;
                        }
                        try {
                          await navigator.clipboard.writeText(eventUrl);
                          setCopyState('copied');
                        } catch {
                          setCopyState('error');
                        }
                      }}
                      aria-label="Copy event link"
                    >
                      <LuCopy size={16} aria-hidden="true" />
                      {copyState === 'copied' ? 'Copied' : 'Copy link'}
                    </button>
                  )}
                </div>

                {(shareMessage || copyState === 'copied' || copyState === 'error') && (
                  <p className="event-details-feedback" role="status" aria-live="polite">
                    {shareMessage ||
                      (copyState === 'copied'
                        ? 'Event link copied to clipboard'
                        : copyState === 'error'
                          ? 'Unable to copy event link'
                          : '')}
                  </p>
                )}
              </div>
            </div>

            {descriptionParagraphs.length > 0 && (
              <section className="event-details-description" aria-label="Event description">
                <h2>About this event</h2>
                {descriptionParagraphs.map((para, idx) => (
                  <p key={idx}>{para}</p>
                ))}
              </section>
            )}

            <section className="event-details-meta" aria-label="Event information">
              <h2>Event information</h2>
              <dl>
                <div>
                  <dt>Date</dt>
                  <dd>
                    <time dateTime={event.startDateTime}>
                      {formatFullDate(event.startDateTime)} at {formatPrimaryTime(event.startDateTime)}
                    </time>
                  </dd>
                </div>
                {event.endDateTime && (
                  <div>
                    <dt>Ends</dt>
                    <dd>
                      <time dateTime={event.endDateTime}>
                        {formatFullDate(event.endDateTime)} at {formatPrimaryTime(event.endDateTime)}
                      </time>
                    </dd>
                  </div>
                )}
                {showUserTime && (
                  <div>
                    <dt>Your time</dt>
                    <dd>{formatUserLocalTime(event.startDateTime)}</dd>
                  </div>
                )}
                {event.venueName && (
                  <div>
                    <dt>Venue</dt>
                    <dd>{event.venueName}</dd>
                  </div>
                )}
                {(event.address || cityRegion || event.country) && (
                  <div>
                    <dt>Location</dt>
                    <dd>
                      {[event.address, cityRegion, event.country].filter(Boolean).map((line, index) => (
                        <span key={index} className="event-details-location-line">
                          {line}
                        </span>
                      ))}
                    </dd>
                  </div>
                )}
                {event.tags?.length ? (
                  <div>
                    <dt>Tags</dt>
                    <dd className="event-details-tags">
                      {event.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </dd>
                  </div>
                ) : null}
              </dl>
            </section>

            {event.mediaEmbedUrl && (
              <section className="event-details-media" aria-label="Event preview">
                <h2>Preview</h2>
                <div className="event-details-media-frame">
                  <iframe
                    title={`${event.title} preview`}
                    src={event.mediaEmbedUrl}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    loading="lazy"
                  />
                </div>
              </section>
            )}

            {mapEmbedSrc && (
              <section className="event-details-map" aria-label="Map">
                <h2>Where to find us</h2>
                <div className="event-details-map-frame">
                  <iframe
                    title={`${event.title} location map`}
                    src={mapEmbedSrc}
                    loading="lazy"
                    allowFullScreen
                  />
                </div>
              </section>
            )}

            {event.galleryImages?.length ? (
              <section className="event-details-gallery" aria-label="Gallery">
                <h2>Moments from tour</h2>
                <div className="event-details-gallery-grid">
                  {event.galleryImages.map((src, idx) => (
                    <figure key={src} className="event-details-gallery-item">
                      <img src={src} alt={`Gallery image ${idx + 1} for ${event.title}`} loading="lazy" />
                    </figure>
                  ))}
                </div>
              </section>
            ) : null}

            {faqItems.length > 0 && (
              <section className="event-details-faq" aria-label="Frequently asked questions">
                <h2>Frequently asked questions</h2>
                <div className="event-details-faq-list">
                  {faqItems.map((item, idx) => (
                    <details key={idx} className="event-details-faq-item">
                      <summary>{item.question}</summary>
                      <p>{item.answer}</p>
                    </details>
                  ))}
                </div>
              </section>
            )}
          </article>
        )}

        {!loading && !error && showOtherEvents && (
          <section className="event-details-related" aria-label="More events">
            <h2>More events</h2>
            <div className="event-details-related-grid">
              {(otherUpcoming.length ? otherUpcoming : otherPast).map((item) => (
                <EventCard key={item.id} ev={item} />
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
