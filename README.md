# React + Vite + Hono + Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/cloudflare/templates/tree/main/vite-react-template)

This template provides a minimal setup for building a React application with TypeScript and Vite, designed to run on Cloudflare Workers. It features hot module replacement, ESLint integration, and the flexibility of Workers deployments.

![React + TypeScript + Vite + Cloudflare Workers](https://imagedelivery.net/wSMYJvS3Xw-n339CbDyDIA/fc7b4b62-442b-4769-641b-ad4422d74300/public)

<!-- dash-content-start -->

🚀 Supercharge your web development with this powerful stack:

- [**React**](https://react.dev/) - A modern UI library for building interactive interfaces
- [**Vite**](https://vite.dev/) - Lightning-fast build tooling and development server
- [**Hono**](https://hono.dev/) - Ultralight, modern backend framework
- [**Cloudflare Workers**](https://developers.cloudflare.com/workers/) - Edge computing platform for global deployment

### ✨ Key Features

- 🔥 Hot Module Replacement (HMR) for rapid development
- 📦 TypeScript support out of the box
- 🛠️ ESLint configuration included
- ⚡ Zero-config deployment to Cloudflare's global network
- 🎯 API routes with Hono's elegant routing
- 🔄 Full-stack development setup
- 🔎 Built-in Observability to monitor your Worker

Get started in minutes with local development or deploy directly via the Cloudflare dashboard. Perfect for building modern, performant web applications at the edge.

<!-- dash-content-end -->

## Getting Started

To start a new project with this template, run:

```bash
npm create cloudflare@latest -- --template=cloudflare/templates/vite-react-template
```

A live deployment of this template is available at:
[https://react-vite-template.templates.workers.dev](https://react-vite-template.templates.workers.dev)

## Development

Install dependencies:

```bash
npm install
```

Start the development server with:

```bash
npm run dev
```

Your application will be available at [http://localhost:5173](http://localhost:5173).

### Environment Variables (Integrations)

Configure these for social & music integrations:

Server (Worker bindings / secrets):
- `SPOTIFY_CLIENT_ID` — Spotify application client ID
- `APPLE_TEAM_ID` — Apple Developer Team ID
- `APPLE_KEY_ID` — MusicKit private key ID
- `APPLE_PRIVATE_KEY` — MusicKit private key (PKCS8 PEM, newline escaped if set via CLI)

Client (Vite-exposed):
- `VITE_FACEBOOK_APP_ID`
- `VITE_FACEBOOK_PIXEL_ID`
- `VITE_SPOTIFY_ARTIST_ID` (optional)

Endpoints:
- Spotify PKCE: `/api/spotify/login` → `/api/spotify/callback` (sets `spotify_session` cookie)
- Session check: `/api/spotify/session`
- Save track: `POST /api/spotify/save` { ids: string[], type: 'tracks'|'albums' }
- Follow artist: `POST /api/spotify/follow` { artistIds: string[] }
- Apple developer token: `GET /api/apple/developer-token`
- Aggregated metrics: `GET /api/metrics`

Notes:
- Never expose Apple private key or Spotify secrets to the client; this template uses PKCE (no client secret) and server-side token minting for Apple.
- Add secrets with `wrangler secret put <NAME>`.

## Production

Build your project for production:

```bash
npm run build
```

Preview your build locally:

```bash
npm run preview
```

Deploy your project to Cloudflare Workers:

```bash
npm run build && npm run deploy
```

Monitor your workers:

```bash
npx wrangler tail
```

## Additional Resources

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Vite Documentation](https://vitejs.dev/guide/)
- [React Documentation](https://reactjs.org/)
- [Hono Documentation](https://hono.dev/)
- [Repository Guidelines](AGENTS.md)
- [Architecture Overview](docs/architecture-overview.md)
- [Remediation & Hardening Plan](docs/remediation-plan.md)

## Commerce Quickstart

Selling tangible goods? See docs/COMMERCE_QUICKSTART.md for a ready-to-use flow:

- Medusa storefront for catalog/cart (address → shipping → complete)
- Optional Stripe Checkout handoff with shipping + Stripe Tax
- SPA routes: `/checkout`, `/success`
- Worker endpoints: `/api/stripe/*`

Environment additions:

Client (Vite)
- `VITE_MEDUSA_URL`, `VITE_MEDUSA_PUBLISHABLE_KEY`, `VITE_STRIPE_PRICE_ID`

Server (Wrangler)
- `STRIPE_SECRET`, `STRIPE_WEBHOOK_SECRET`, `SITE_URL`

## Booking Form

The app includes a mobile‑first booking page at `/book` with server‑side email delivery and validation. See docs/BOOKING.md for:

- UX and accessibility details
- Client + server validation rules
- Email provider setup (Resend/SendGrid)
- Anti‑spam measures and customization tips
