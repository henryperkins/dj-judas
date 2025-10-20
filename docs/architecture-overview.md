# DJ Lee & Voices of Judah – Architecture Overview

_Updated 2025-09-17_

This document summarizes the current technical architecture for the Cloudflare Worker storefront deployment and related React client.

## High-Level Topology

- **Client:** Vite + React storefront located in `src/react-app`, deployed as static assets to Cloudflare.
- **Edge Runtime:** Cloudflare Worker defined in `src/worker/index.ts` with Hono for routing.
- **Durable Objects:**
  - `RateLimiter` and `UserSession` (see `src/worker/durable-objects.ts`) for request throttling and authenticated session storage.
- **Persistence & Caching:**
  - **KV (`SESSIONS`):** OAuth PKCE verifiers, Spotify sessions, cached API tokens.
  - **R2 (`MEDIA_BUCKET`, `USER_ASSETS`):** Static assets served via `/static/*` with immutable caching.
  - **D1 (`DB`):** Events data store; migrations live under `migrations/d1/`.
  - **Edge Cache:** `CacheManager` (`src/worker/cache-manager.ts`) coalesces requests and fronts KV.
- **Third Parties:**
  - Medusa admin/storefront APIs proxied via Worker.
  - Spotify OAuth + public metrics.
  - Facebook/Instagram Graph API for social metrics.
  - Resend/SendGrid optional notifications.

## Request Flow

1. **Static Delivery:** Browser requests hit `/static/*`; Worker checks Cache API, then R2, then responds with immutable caching headers.
2. **Storefront API:** Client-side React components call Worker endpoints (cart, analytics, events). Worker applies CORS/security middleware before proxying or responding.
3. **Admin API Proxy:** Secure endpoints (e.g., `/api/admin/products`) validate cookies + signatures, then forward to Medusa with bearer tokens.
4. **Metrics Aggregation:** `/api/metrics` collects Instagram/Spotify/Facebook data, storing results in CacheManager for 15 minutes.

## Security Controls

- Global security middleware in `src/worker/index.ts` sets CORS, frame, referrer, and Permissions-Policy headers.
- Sensitive admin routes require signed requests (`X-Admin-Signature`, `X-Timestamp`) and a session cookie.
- Tokens and secrets are injected via Wrangler bindings:
  - Spotify, Apple Music, Facebook/Instagram, email providers.
  - Admin secret for request signing (`ADMIN_SHARED_SECRET`).
- Durable Objects hold bearer tokens and rate-limiting counters to keep secrets off the client.

## Build & Deployment

- `npm run build` emits the React bundle (`dist/`) and Worker script.
- `npm run preview` provides a local production preview of the worker + assets.
- `npm run deploy` or `wrangler deploy` publishes to Cloudflare; ensure D1 migrations are up-to-date beforehand.

## Observability

- Analytics Engine binding (`ANALYTICS`) receives request timing datapoints.
- `wrangler tail` is used for runtime logs.
- Cached metrics responses include `X-Cache` headers (`HIT`, `MISS`, `KV-HIT`) for cache diagnostics.

## Environment Variables

- Worker secrets: Spotify client/secret, Apple Music credentials, Medusa admin URL, admin signing secret, email provider keys, CORS allowlist, IG/FB tokens.
- React client envs: `VITE_MEDUSA_URL`, `VITE_MEDUSA_PUBLISHABLE_KEY`, Facebook Pixel/App IDs, optional Spotify artist ID.

## Future Enhancements

- Harden rate limiting with Durable Object SQL.
- Implement WebSocket hibernation strategies if live sessions are introduced.
- Expand Analytics Engine dashboards with success/error metrics for third-party integrations.

