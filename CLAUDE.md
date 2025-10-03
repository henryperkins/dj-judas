# CLAUDE.md

Guidance for Claude Code when working in this repository.

Last updated: 2025-10-03 (Mobile UX Enhancements - Phase 2)

## Recent Updates

### Mobile UX Enhancements (Phase 2) - 2025-10-03

**What Changed**:
- ✅ Product grid horizontal card layout on mobile (<480px)
- ✅ Swipe-to-delete functionality for cart items (CSS + utility hook ready)
- ✅ Enhanced checkout mobile layout with full-bleed sections
- ✅ Improved cart item visualization (64x64 images, compact spacing)
- ✅ Loading skeleton animations for product cards
- ✅ Tablet-specific layout optimizations (641px-1023px)

**Files Added/Modified**:
- `src/react-app/index.css` - Added ~400 lines of UX enhancements (lines 2867-3255)
- `src/react-app/utils/swipe.ts` - NEW swipe gesture hook for touch interactions

**Breaking Changes**: None
**Performance Impact**: +~300 bytes CSS gzip
**Browser Support**: iOS 15+, Android 10+, Desktop evergreen browsers

**Next Steps for Full Swipe-to-Delete**:
To enable swipe-to-delete in CheckoutPage.tsx:
1. Import `useSwipe` hook from `utils/swipe.ts`
2. Wrap cart items with swipeable container
3. Add delete action handler
(See Phase 2 implementation plan for code example)

---

### Mobile Compliance (Phase 1) - 2025-10-03

**What Changed**:
- ✅ WCAG 2.2 Level AA compliance for touch targets (44×44px minimum on mobile)
- ✅ iOS Safari input zoom prevention (16px minimum font-size on all inputs)
- ✅ Mobile-first breakpoint system standardization
- ✅ Consistent spacing between interactive elements (24px minimum)

**Files Modified**:
- `src/react-app/index.css` - Added ~150 lines of mobile-first CSS (lines 2628-2873)
- `docs/PHASE1_TESTING.md` - Comprehensive testing documentation

**Testing Required**:
- Touch target audit on mobile viewports (320px-480px)
- iOS Safari input zoom verification
- Cross-browser testing (iOS Safari, Android Chrome, Desktop)
- Accessibility audit: `npm run check:a11y` (threshold ≤10 issues)

See `docs/PHASE1_TESTING.md` for detailed test procedures.

## Project Overview

- Full-stack React app (Vite + Hono on Cloudflare Workers) for DJ Lee & Voices of Judah.
- Mobile‑first UI with consolidated CSS in a single master stylesheet.
- Integrations: Spotify (PKCE), Apple Music dev token, ecommerce (Medusa storefront + optional Stripe Checkout), Medusa Admin (products), Cloudflare Images (uploads), AI (OpenAI or Workers AI) for product copy.

## Quick Commands

- Development
  - `npm run dev` – Start Vite dev server
  - `npm run preview` – Preview production build
  - `npm run build` – Type-check and build (SSR worker + client)

- Quality
  - `npm run lint` – ESLint
  - `npm run check` – TypeScript + build + deploy dry‑run + pa11y
  - `npm run check:a11y` – pa11y against local preview

- Deploy
  - `npm run deploy` – Deploy worker
  - `npm run cf-typegen` – Cloudflare types
  - `npx wrangler tail` – Tail worker logs

## Architecture

- `src/worker/` – Hono backend on Workers (OAuth, email, Stripe, oEmbed, events)
- `src/react-app/` – Frontend
  - `index.css` – Master consolidated stylesheet (imports Tailwind and all custom CSS)
  - `components/` – UI + sections
  - `pages/` – Simple SPA routes (`/checkout`, `/success`, `/book`)
  - `utils/` – Client utilities (cart, theme, nav)
- `src/components/ui/` – Radix-based primitives
- `src/lib/` – Shared utilities

## Ecommerce Additions (Sept 2025)

- Styles: Ecommerce sections 5.10–5.20 merged into `src/react-app/index.css`.
  - Product grid/cards, checkout layout, form styles, loading/skeletons, alerts, utilities, buttons, mobile/print.
  - See `docs/ECOMMERCE_CSS_GUIDE.md` for structure and examples.
- Pages/components
  - `FeaturedProducts.tsx` – Product grid using `.product-card*` and small buttons.
  - `CheckoutPage.tsx` – Address form, shipping options, order summary with live Medusa totals.
  - `SuccessPage.tsx` – Success alert and order summary styling.
- Client cart utils
  - `utils/cart.ts`: `ensureCart`, `addLineItem`, `fetchProducts`, `getCart`, `formatAmount`.

### Admin Product Management

- Pages (SPA routes)
  - `/admin/login` – Authenticate against Medusa Admin; JWT stored as HttpOnly cookie.
  - `/admin` – Admin home.
  - `/admin/products` – List/search products (admin API).
  - `/admin/products/new` – Photo‑first creation: upload images, AI suggest title/description, set price, Live/Preview publish, add variants.
  - `/admin/products/:id` – Edit product fields; manage images and variants.

- Worker admin proxies (`src/worker/index.ts`)
  - `POST /api/admin/login|logout|session`
  - `GET /api/admin/products[?q=...]`, `GET /api/admin/products/:id`
  - `POST /api/admin/products` (create)
  - `PATCH /api/admin/products/:id` (update)
  - `POST /api/admin/products/:id/variants` (create variant)
  - `PATCH /api/admin/variants/:id`, `DELETE /api/admin/variants/:id`

### Image Uploads (Cloudflare Images)

- Endpoints (admin‑only)
  - `POST /api/images/direct-upload` → obtain direct upload URL
  - `DELETE /api/images/:id` → delete uploaded image by ID (used for unused cleanup)
- UI
  - Drag‑and‑drop uploader with per‑file progress bars.
  - Multi‑image grid, reorder, pick thumbnail, remove; bulk delete of unused uploads.
  - Uses delivery variants (e.g., `public`, `thumb`, `large`).

### AI‑Assisted Titles/Descriptions

- Endpoint (admin‑only): `POST /api/ai/suggest-product { image_url }`
  - Uses OpenAI `gpt-4o-mini` if `OPENAI_API_KEY` set.
  - Falls back to Cloudflare Workers AI (`@cf/meta/llama-3.2-11b-vision-instruct`, then `@cf/llava-hf/llava-1.5-7b-hf`) via `[ai]` binding in `wrangler.toml`.
  - Returns strict JSON `{ title, description }`.

### Config Needed

- Client `.env`
  - `VITE_MEDUSA_URL=https://your-medusa-store` (required for cart)
  - `VITE_MEDUSA_PUBLISHABLE_KEY=...` (set if your store requires it)
  - `VITE_STRIPE_PRICE_ID=price_xxx` (for demo Stripe checkout)

- Admin & uploads
  - Worker: `MEDUSA_URL=https://your-medusa-store` (admin proxy base)
  - Worker: `CF_IMAGES_ACCOUNT_ID`, `CF_IMAGES_API_TOKEN` (Images:Edit token)
  - Worker (optional): `CF_IMAGES_VARIANT=public`, `CF_IMAGES_VARIANT_THUMB=thumb`, `CF_IMAGES_VARIANT_LARGE=large`
  - Client (optional): `VITE_CF_IMAGES_VARIANT=public`, `VITE_CF_IMAGES_VARIANT_THUMB=thumb`, `VITE_CF_IMAGES_VARIANT_LARGE=large`
  - AI (optional): `OPENAI_API_KEY`; otherwise Workers AI is used (requires `[ai]` binding in `wrangler.toml`).

- Worker secrets (Wrangler)
  - `STRIPE_SECRET` – Required to enable `/api/stripe/checkout`
  - `STRIPE_WEBHOOK_SECRET` – For `/api/stripe/webhook` (optional locally)
  - `SITE_URL` – Used for success/cancel redirects

### Flows

- Featured → Add to cart → Checkout uses Medusa cart id persisted in `localStorage` (`medusa_cart_id`).
- Shipping options request tries both `GET /store/shipping-options/:cart_id` and `GET /store/shipping-options?cart_id=...` for compatibility.
- Totals come from `GET /store/carts/:id` and render in the right sidebar.
- Optional Stripe handoff: `POST /api/stripe/checkout` returns a redirect URL.

- Admin create/edit product:
  1) Login at `/admin/login` (Medusa admin credentials) → HttpOnly JWT cookie
  2) `/admin/products/new` → upload images → optional AI suggest → set price and publish state → create
  3) `/admin/products/:id` → edit fields; add/reorder/remove images; manage variants

### Next Steps (if you’re continuing ecommerce work)

- Wire quantity controls to Medusa line‑item update/delete endpoints.
- Display shipping option prices and selection state; recompute totals after select.
- Persist and show line‑level and order‑level discounts if present.

## Styling Approach

- Single‑file CSS: `src/react-app/index.css` is the source of truth.
  - Sections are numbered. Ecommerce lives under 5.10–5.20.
  - Prefer BEM‑ish class naming from the guide (e.g., `.product-card__title`).
  - Avoid inline styles in components; use utilities and component classes.
- Tailwind is available (via `@tailwindcss/vite` + `@import "tailwindcss";`), but most styles are plain CSS classes for predictability and bundle control.
- Accessibility: All interactive elements must have focus-visible states; follow WCAG AA contrast using theme tokens.

### Mobile / Compact Mode

- Global compact class `.admin-compact` applied at app root to reduce paddings and font sizes across buttons and inputs.
- Admin pages and storefront share the compact sizing for better mobile ergonomics.

## Backend APIs

- Spotify PKCE: `/api/spotify/login|callback|session|save|follow`
- Apple Music developer token: `/api/apple/developer-token`
- Email (Resend preferred, SendGrid fallback): `/api/booking`
- Stripe Checkout (optional): `/api/stripe/checkout`, `/api/stripe/webhook`
- Instagram oEmbed proxy: `/api/instagram/oembed`
- Medusa Admin proxies: see “Admin Product Management”.
- Cloudflare Images: `/api/images/*`; AI suggest: `/api/ai/suggest-product`.
- Events + ICS feed: `/api/events`, `/events.ics`, `/events/:slug.ics`

## Environment Variables (Full)

- Worker (required for features you use)
  - `SPOTIFY_CLIENT_ID`, `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY`
  - `IG_OEMBED_TOKEN` (Instagram oEmbed)
  - `RESEND_API_KEY`, `RESEND_FROM`, `RESEND_TO` or `SENDGRID_*`
  - `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`
  - `MEDUSA_URL`
  - `CF_IMAGES_ACCOUNT_ID`, `CF_IMAGES_API_TOKEN`, `CF_IMAGES_VARIANT*`
  - `OPENAI_API_KEY` or Workers `[ai]` binding

- Client `.env`
  - `VITE_FACEBOOK_APP_ID`, `VITE_FACEBOOK_PIXEL_ID` (optional)
  - `VITE_SPOTIFY_ARTIST_ID` (optional)
  - `VITE_MEDUSA_URL`, `VITE_MEDUSA_PUBLISHABLE_KEY` (cart)
  - `VITE_STRIPE_PRICE_ID` (demo checkout)
  - `VITE_CF_IMAGES_VARIANT*` (optional)

## Code Quality Requirements

- TypeScript must compile with strict settings (`tsc -b`).
- ESLint must pass.
- Accessibility baseline enforced via `npm run check:a11y` (pa11y threshold <= 10).
- The build must succeed before deployment.

## Build & Deploy

- Build locally: `npm run build`
- Preview locally: `npm run preview`
- Deploy to Cloudflare Workers: `npm run deploy`
  - Requires `wrangler` auth (`wrangler login`) and valid `account_id` in `wrangler.toml`.
  - Ensure all required env vars/secrets are set in your Cloudflare project (KV not used; just plain vars).

## Conventions & Tips

- Use the `@/*` path alias for imports.
- SPA navigation: internal anchors with `data-nav` are hijacked in `index.html`.
- When adding CSS, keep specificity low and follow the numbered section layout.
- Keep components small, typed, mobile‑first, and avoid inline styles.

## Known Notes

- Medusa requires CORS to allow calls from the dev origin; configure your store accordingly.
- Stripe worker code is bundled; the `stripe` package is installed and ready. If you need to externalize it later, update `vite.config.ts`.
