# Copilot Instructions for AI Agents

## Project Overview
- Full-stack React app (Vite + Hono on Cloudflare Workers) for DJ Lee & Voices of Judah.
- Mobile-first UI, consolidated CSS in `src/react-app/index.css` (imports Tailwind and custom styles).
- Integrations: Spotify (PKCE), Apple Music, Medusa (storefront + admin), Stripe, Cloudflare Images, AI (OpenAI/Workers AI).

## Key Architecture
- `src/worker/`: Hono backend (OAuth, email, Stripe, oEmbed, events, admin proxies).
- `src/react-app/`: Frontend SPA
  - `components/`: UI, social, ecommerce, admin, sharing
  - `components/social/`: Platform embeds, feeds, sharing, analytics
  - `config/platforms.ts`: Centralized platform config (recommended)
  - `index.css`: Master stylesheet (sections 5.10–5.20 for ecommerce)
- `medusa-backend/`: Medusa server (custom scripts, jobs, subscribers)

## Developer Workflows
- **Dev server:** `npm run dev` (Vite)
- **Build:** `npm run build` (SSR worker + client)
- **Preview:** `npm run preview`
- **Lint:** `npm run lint`
- **Type-check & a11y:** `npm run check` / `npm run check:a11y`
- **Deploy:** `npm run deploy` (Cloudflare Workers)
- **Medusa custom script:** `npx medusa exec ./src/scripts/my-script.ts`

## Conventions & Patterns
- Use `@/*` path alias for imports.
- All interactive elements must have focus-visible states (WCAG AA).
- SPA navigation: internal anchors with `data-nav` are hijacked in `index.html`.
- Prefer BEM-ish CSS class naming, avoid inline styles.
- Social sharing/analytics: Use centralized modules (`integrations/analytics.ts`, `social/utils/socialMetrics.ts`).
- Remove deprecated social components (see SOCIAL_AUDIT_REPORT.md).
- Centralize platform config in `config/platforms.ts` (see audit recommendations).
- All Medusa jobs, scripts, and subscribers must default export a function and a config object (see medusa-backend/src/*/README.md).

## Integration Points
- Spotify, Apple Music, Facebook, Instagram: Use environment variables for IDs/tokens.
- Medusa Admin: SPA routes `/admin/*`, backend proxies in worker.
- Stripe: Worker endpoints for checkout/webhook.
- Cloudflare Images: Direct upload endpoints, delivery variants.
- AI: OpenAI or Workers AI via backend endpoints.

## Code Quality
- TypeScript strict mode required.
- ESLint must pass.
- Accessibility baseline enforced via pa11y.
- Build must succeed before deploy.

## References
- See `CLAUDE.md`, `SOCIAL_AUDIT_REPORT.md`, and `docs/ECOMMERCE_CSS_GUIDE.md` for architecture, audit, and style details.
- For Medusa backend conventions, see `medusa-backend/src/scripts/README.md`, `medusa-backend/src/jobs/README.md`, `medusa-backend/src/subscribers/README.md`.

---

**Example: Social Embed Pattern**
```tsx
// src/react-app/components/social/embeds/SpotifyEmbed.tsx
import { track } from '@/react-app/integrations/analytics';
// ...
```

**Example: Medusa Custom Script**
```ts
// medusa-backend/src/scripts/my-script.ts
export default async function myScript({ container }) {
  // ...
}
```
