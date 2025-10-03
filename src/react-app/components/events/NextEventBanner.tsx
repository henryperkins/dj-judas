import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import {
  LuArrowRight,
  LuCalendarPlus,
  LuCopy,
  LuDownload,
  LuExternalLink,
  LuMapPin,
  LuShare2,
} from 'react-icons/lu';

import { EventItem } from './EventTypes';
import { isIOS } from '../../utils/platformDetection';
import {
  buildEventStructuredData,
  fetchEventsData,
  firstUpcoming,
  googleCalUrl,
} from '@/react-app/utils/events';
import {
  eventOffsetMinutes,
  formatPrimaryTime,
  formatShortDate,
  formatUserLocalTime,
  userOffsetMinutes,
} from '@/react-app/utils/dateTime';

type CopyState = 'idle' | 'copied' | 'error';

type NextEventBannerProps = {
  imageMode?: 'cover' | 'contain';
};

const DEFAULT_IMAGE_WIDTH = 768;
const DEFAULT_IMAGE_HEIGHT = 960;

function buildSnippet(event?: EventItem | null): string | null {
  if (!event) return null;
  const summary = event.summary?.trim();
  const description = !summary ? event.description?.trim() : undefined;
  const price = event.priceSummary?.trim() || event.priceText?.trim();
  const parts = [summary || description, price].filter(Boolean) as string[];
  if (!parts.length) return null;
  const joined = parts.join(' • ');
  return joined.length > 160 ? `${joined.slice(0, 157)}…` : joined;
}

export default function NextEventBanner({ imageMode = 'contain' }: NextEventBannerProps) {
  const [event, setEvent] = useState<EventItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const [shareMessage, setShareMessage] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      try {
        const data = await fetchEventsData(controller.signal);
        const nextEvent =
          firstUpcoming(data.upcoming) ?? data.upcoming[0] ?? data.past[0] ?? null;
        if (!cancelled) {
          setEvent(nextEvent ?? null);
        }
      } catch (err) {
        if (!cancelled) {
          if (!(err instanceof DOMException && err.name === 'AbortError')) {
            console.error('Failed to load next event', err);
          }
          setEvent(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, []);

  useEffect(() => {
    setCopyState('idle');
    setShareMessage(null);
    setImageFailed(false);
  }, [event?.id]);

  const icsHref = useMemo(() => {
    if (!event?.slug) return undefined;
    return `/events/${event.slug}.ics`;
  }, [event?.slug]);

  const flyerSrc = useMemo(() => {
    if (!event) return undefined;
    if (event.flyerUrl) return event.flyerUrl;
    if (event.slug) return `/content/flyers/${event.slug}.jpg`;
    return undefined;
  }, [event]);

  useEffect(() => {
    if (!event) return undefined;

    const cleanupLinks: HTMLLinkElement[] = [];

    if (icsHref && typeof document !== 'undefined') {
      const link = document.createElement('link');
      link.rel = 'prefetch';
      link.href = icsHref;
      link.as = 'fetch';
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
      cleanupLinks.push(link);
    }

    if (flyerSrc) {
      const img = new Image();
      img.src = flyerSrc;
    }

    return () => {
      cleanupLinks.forEach((link) => {
        if (link.parentNode) link.parentNode.removeChild(link);
      });
    };
  }, [event, flyerSrc, icsHref]);

  const eventUrl = useMemo(() => {
    if (!event?.slug) return null;
    if (typeof window !== 'undefined' && window.location) {
      return `${window.location.origin}/events/${event.slug}`;
    }
    return `/events/${event.slug}`;
  }, [event?.slug]);

  const calendarHref = useMemo(() => {
    if (!event) return '#';
    return isIOS() ? icsHref ?? '#' : googleCalUrl(event);
  }, [event, icsHref]);

  const calendarLabel = isIOS() ? 'Add to Apple Calendar' : 'Add to Google Calendar';

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

  const resolvedImageMode = event?.imageMode ?? imageMode;
  const hasFlyer = Boolean(flyerSrc) && !imageFailed;
  const cityRegion = useMemo(
    () => (event ? [event.city, event.region].filter(Boolean).join(', ') : ''),
    [event]
  );
  const snippet = useMemo(() => buildSnippet(event), [event]);

  const eventOffset = event ? eventOffsetMinutes(event.startDateTime) : null;
  const showUserTime = eventOffset !== null && eventOffset !== userOffsetMinutes();

  const flyerAspectValue = useMemo(() => {
    if (!event?.flyerWidth || !event?.flyerHeight) return undefined;
    if (event.flyerWidth <= 0 || event.flyerHeight <= 0) return undefined;
    return `${event.flyerWidth} / ${event.flyerHeight}`;
  }, [event?.flyerWidth, event?.flyerHeight]);

  const flyerFrameStyle = useMemo(
    () =>
      flyerAspectValue
        ? ({ '--next-event-flyer-aspect': flyerAspectValue } as CSSProperties)
        : undefined,
    [flyerAspectValue]
  );

  const structuredData = useMemo(() => {
    if (!event) return null;
    return buildEventStructuredData(event, { eventUrl: eventUrl ?? undefined, imageUrl: flyerSrc });
  }, [event, eventUrl, flyerSrc]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!shareMessage && copyState !== 'copied') return;
    const timeout = window.setTimeout(() => {
      setShareMessage(null);
      if (copyState === 'copied') setCopyState('idle');
    }, 2500);
    return () => window.clearTimeout(timeout);
  }, [copyState, shareMessage]);

  const skeleton = (
    <section className="next-event-banner" aria-label="Next event loading">
      <div className="container">
        <div className="next-event-card next-event-card--loading">
          <div className="next-event-flyer skeleton-block" />
          <div className="next-event-info">
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
    </section>
  );

  if (loading && !event) return skeleton;
  if (!event) return null;

  return (
    <section className="next-event-banner" aria-label="Next event">
      <div className="container">
        {structuredData && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
          />
        )}

        <div className="next-event-card" data-hoverable="true">
          {hasFlyer ? (
            <figure className="next-event-flyer" data-mode={resolvedImageMode}>
              <div
                className="next-event-flyer-frame"
                data-mode={resolvedImageMode}
                style={flyerFrameStyle}
              >
                <img
                  src={flyerSrc}
                  alt={`${event.title} flyer`}
                  width={event.flyerWidth ?? DEFAULT_IMAGE_WIDTH}
                  height={event.flyerHeight ?? DEFAULT_IMAGE_HEIGHT}
                  loading="eager"
                  decoding="async"
                  fetchPriority="high"
                  style={{ objectFit: resolvedImageMode === 'cover' ? 'cover' : 'contain' }}
                  onError={() => setImageFailed(true)}
                />
              </div>
              <figcaption className="sr-only">Promotional artwork for {event.title}</figcaption>
            </figure>
          ) : (
            <div className="next-event-flyer-placeholder" role="presentation">
              <span>{formatShortDate(event.startDateTime)}</span>
              <span>{event.title}</span>
            </div>
          )}

          <div className="next-event-info">
            <h2 className="next-event-heading">Next Event</h2>
            <div className="next-event-when">
              <div className="next-event-date">
                <span className="next-event-date-label">{formatShortDate(event.startDateTime)}</span>
                <time dateTime={event.startDateTime}>{formatPrimaryTime(event.startDateTime)}</time>
              </div>
              <div className="next-event-location">
                <LuMapPin size={16} aria-hidden="true" />
                <span>{cityRegion || event.venueName || 'Location TBA'}</span>
              </div>
            </div>

            <div className="next-event-title">{event.title}</div>

            {snippet && <p className="next-event-snippet">{snippet}</p>}

            {showUserTime && (
              <p className="next-event-user-time">Your time: {formatUserLocalTime(event.startDateTime)}</p>
            )}

            <div className="next-event-actions" role="group" aria-label="Event actions">
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
                  aria-label="Open in maps"
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
                <a
                  className="btn btn-ghost"
                  href={icsHref}
                  aria-label="Download ICS file"
                >
                  <LuDownload size={16} aria-hidden="true" /> Download ICS
                </a>
              )}

              {eventUrl && (
                <a className="next-event-details-link" href={eventUrl} aria-label="View event details">
                  View details <LuArrowRight size={16} aria-hidden="true" />
                </a>
              )}
            </div>

            <div className="next-event-share-row" role="group" aria-label="Share actions">
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

              <span className="sr-only" aria-live="polite">
                {copyState === 'copied' && 'Event link copied to clipboard'}
                {copyState === 'error' && 'Unable to copy event link'}
                {shareMessage}
              </span>
            </div>

            {(shareMessage || copyState === 'copied' || copyState === 'error') && (
              <p className="next-event-feedback" role="status" aria-live="polite">
                {shareMessage ||
                  (copyState === 'copied'
                    ? 'Event link copied to clipboard'
                    : 'Unable to copy event link')}
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
