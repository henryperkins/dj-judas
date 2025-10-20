# Remediation & Hardening Plan

_Updated 2025-09-17_

This plan captures outstanding technical debt and hardening tasks for the Cloudflare Worker storefront.

## Immediate Priorities (0-2 Days)

- ✅ **Validate D1 schema** – run `npx -y wrangler d1 execute dj-judas-db --command "SELECT name FROM sqlite_master WHERE type='table' AND name='events';"`.
- ✅ **Apply migrations** – execute `npx -y wrangler d1 execute dj-judas-db --file=./migrations/d1/0001_events.sql` if the events table is missing.
- 🔒 **Admin request signing** – enforce HMAC-SHA256 verification for all `/api/admin/*` writes using `ADMIN_SHARED_SECRET`, rejecting stale timestamps (>5 minutes).
- 📊 **Instagram analytics** – require a configured `IG_USER_ID`; surface partial metrics state when the Graph API fails instead of returning placeholder data.

## Near Term (This Week)

- 🔁 **Durable Object rate limiter upgrade** – migrate to a SQL-backed counter for higher throughput and atomicity.
- 💤 **WebSocket hibernation readiness** – design hibernation-aware handlers for `UserSession` DO if live features are pursued.
- 🧾 **Audit CORS allowlist** – restrict production deployments to `https://djlee.com` domains; move localhost hosts to Wrangler dev overrides only.

## Optional Enhancements

- 🕸️ **Tiered Cache** – enable Cloudflare account-level tiered caching for origin optimization.
- 📨 **Queue integrations** – add Workers Queues if background fan-out jobs become necessary.
- 📈 **Expanded analytics** – ship dashboard tiles for third-party API success/failure counts using the Analytics Engine dataset.

## Tracking & Reporting

- Update this file after each remediation to keep the scope current.
- Reference `docs/architecture-overview.md` for component ownership and flow diagrams when planning future work.

