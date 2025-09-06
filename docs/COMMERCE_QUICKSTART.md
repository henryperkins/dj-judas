# Commerce Quickstart (React + Vite + Cloudflare Workers)

This repo includes a minimal, production‑oriented path to sell tangible goods using a Medusa Storefront for catalog/cart and an optional Stripe Checkout handoff for payments, shipping, and Stripe Tax.

Use this as a copy‑paste quick reference to enable end‑to‑end checkout quickly.

---

## Architecture Overview

- UI: React (Vite) SPA with lightweight History‑API routing
  - `FeaturedProducts` teaser on the landing page (optional)
  - `CheckoutPage` at `/checkout` for address → shipping → payment
- API (Workers/Hono): server endpoints under `/api/*`
  - `/api/stripe/checkout` creates Stripe Checkout Sessions
  - `/api/stripe/session` fetches a sanitized session for the success page
  - `/api/stripe/webhook` verifies Stripe webhooks (placeholder to fulfill)
- Deploy: SPA assets served from Workers `[assets]`, SPA fallback enabled

Code map:
- UI
  - `src/react-app/pages/CheckoutPage.tsx`
  - `src/react-app/components/FeaturedProducts.tsx`
  - `src/react-app/utils/cart.ts` (Medusa helpers)
  - `src/react-app/pages/SuccessPage.tsx`
- Worker
  - `src/worker/index.ts` (Stripe routes and other APIs)

---

## Environment Variables

Add these to `.env` (for Vite) and Wrangler secrets (for the Worker):

Client (Vite):
- `VITE_MEDUSA_URL` — https://api.your-medusa.com
- `VITE_MEDUSA_PUBLISHABLE_KEY` — Medusa publishable key (adds `x-publishable-api-key`)
- `VITE_STRIPE_PRICE_ID` — a Stripe Price ID for the demo “Pay with Stripe” button

Server (Wrangler secrets / env):
- `STRIPE_SECRET` — Stripe secret key (sk_live_… or sk_test_…)
- `STRIPE_WEBHOOK_SECRET` — Webhook signing secret (from your Stripe webhook endpoint)
- `SITE_URL` — Public site origin (used for success/cancel URLs)

Optional (already present for other features):
- Email providers for booking (Resend/SendGrid), IG oEmbed token, etc.

Sample additions are in `.env.example`.

---

## Medusa Integration (Catalog + Cart)

Medusa Store API powers products, carts, and checkout under `/store/*`. This repo uses fetch‑based helpers (no extra deps) to:

- Create/recover a cart (stored in `localStorage`)
- Add line items by variant ID
- Update shipping address
- List cart‑scoped shipping options
- Add a shipping method
- Complete the cart (Medusa‑native payment flow)

Key files:
- `src/react-app/utils/cart.ts` — `ensureCart`, `addLineItem`, `fetchProducts`
- `src/react-app/pages/CheckoutPage.tsx` — address → options → add method → complete
- `src/react-app/components/FeaturedProducts.tsx` — product teaser + “Add to cart”

Notes:
- Changing the shipping address may invalidate selected shipping/payment and require re‑selection (expected Medusa behavior).
- Set `country_code` and email on the cart early so prices/shipping options match the buyer’s region.

---

## Stripe Checkout (Handoff)

When you prefer Stripe‑hosted checkout with Shipping + Stripe Tax:

Worker routes (`src/worker/index.ts`):
- `POST /api/stripe/checkout` — creates a Checkout Session
  - Shipping address collection restricted to `US` and `CA`
  - Two example shipping rates (standard/express)
  - `automatic_tax.enabled=true`
  - Success/cancel URLs built from `SITE_URL`
- `POST /api/stripe/webhook` — verifies events using SubtleCrypto provider
  - Add fulfillment logic on `checkout.session.completed`
- `GET /api/stripe/session?session_id=…` — returns minimal session data for the success page

Client pages:
- `/checkout` — contains “Pay with Stripe” button calling the above endpoint
- `/success` — displays a friendly confirmation using `/api/stripe/session`

API version:
- The Worker pins Stripe’s `apiVersion` to a modern date (`2025-08-27.basil`). Adjust if/when upgrading `stripe`.

Webhook setup:
1) Create a Webhook endpoint in Stripe pointing to your Worker `/api/stripe/webhook`.
2) Store the signing secret in Wrangler: `wrangler secret put STRIPE_WEBHOOK_SECRET`.
3) In local dev, you can forward events with Stripe CLI:
   ```bash
   stripe listen --forward-to http://127.0.0.1:8787/api/stripe/webhook
   ```

---

## SPA Routing & Deployment

Vite builds to `dist/client`. Wrangler serves these as static assets with SPA fallback:

`wrangler.toml`
```toml
[assets]
directory = "./dist/client"
not_found_handling = "single-page-application"
```

Routes used by this repo:
- `/` — Landing page (music, services, featured products)
- `/book` — Casual booking form
- `/checkout` — Shipping + payment
- `/success` — Post‑payment confirmation

---

## Common Gotchas

- Cart invalidation: updating address can clear shipping/payment. Re‑list options and re‑select accordingly.
- Inventory: Medusa v2 uses Inventory + Stock Location for real stock. Expose variant availability to storefront if needed.
- Taxes: when using Stripe Checkout, prefer Stripe Tax. When using Medusa‑native checkout, configure tax in the Region.
- Price/catalog in Checkout: The demo uses `VITE_STRIPE_PRICE_ID`. In production, compute dynamic line items from the cart on the Worker before creating a Session.

---

## Quick Test Plan

1) Set env values in `.env` and Wrangler secrets.
2) Build: `npm run build` then preview: `vite preview`.
3) Visit `/` → Featured products appear (if Medusa env is set).
4) Click “Add to cart” → `/checkout`.
5) Enter address → Load options → Add a method.
6) Click “Pay with Stripe” → complete payment on hosted page.
7) Land on `/success` and verify status and total.

For Medusa‑native completion, click “Pay (Medusa provider)” after adding a shipping method (requires a provider configured on your Medusa backend).

