# Project Structure

## Directory Organization

### Root Configuration
```
/home/azureuser/dj-judas/
├── package.json              # Main project dependencies and scripts
├── wrangler.toml            # Cloudflare Workers configuration
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript base configuration
├── tsconfig.app.json        # React app TypeScript config
├── tsconfig.worker.json     # Worker TypeScript config
├── playwright.config.ts     # E2E test configuration
├── eslint.config.js         # Linting rules
└── worker-configuration.d.ts # Worker bindings type definitions
```

### Source Code (`/src`)
```
src/
├── react-app/               # React frontend application
│   ├── components/          # React components
│   ├── pages/              # Page-level components
│   ├── hooks/              # Custom React hooks
│   ├── providers/          # Context providers
│   ├── integrations/       # Third-party integrations (Spotify, Apple Music)
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript type definitions
│   ├── config/             # Configuration files
│   ├── data/               # Static data
│   ├── lib/                # Shared libraries
│   ├── assets/             # Images, fonts, etc.
│   ├── App.tsx             # Root component
│   ├── Router.tsx          # Route definitions
│   └── main.tsx            # Application entry point
├── worker/                  # Cloudflare Worker backend
│   ├── index.ts            # Worker entry point with Hono routes
│   ├── cache-manager.ts    # Cache control utilities
│   ├── durable-objects.ts  # Rate limiter and session DO classes
│   ├── kv-utils.ts         # KV namespace helpers
│   ├── social-metrics.ts   # Social analytics aggregation
│   └── validation.ts       # Server-side validation schemas
├── components/ui/           # Shared UI components (shadcn/ui)
├── lib/utils.ts            # Shared utility functions
└── types/                   # Global type definitions
```

### Medusa Backend (`/medusa-backend`)
```
medusa-backend/
├── src/
│   ├── admin/              # Admin dashboard customizations
│   ├── api/                # Custom API routes
│   ├── jobs/               # Background job definitions
│   ├── links/              # Entity relationship links
│   ├── modules/            # Custom Medusa modules
│   ├── scripts/            # Database seeding and utilities
│   ├── subscribers/        # Event subscribers
│   └── workflows/          # Custom workflows
├── medusa-config.ts        # Medusa configuration
├── package.json            # Medusa dependencies
└── docker-compose.db.yml   # PostgreSQL for local dev
```

### Testing (`/e2e`)
```
e2e/
├── fixtures/               # Test data
├── helpers/                # Test utilities
├── apple-music.spec.ts     # Apple Music integration tests
├── checkout-flow.spec.ts   # E-commerce flow tests
└── spotify-oauth.spec.ts   # Spotify OAuth tests
```

### Documentation (`/docs`)
```
docs/
├── architecture-overview.md           # System architecture
├── remediation-plan.md               # Security hardening plan
├── IMPLEMENTATION_SUMMARY.md         # Feature implementation status
├── MOBILE_STREAMING_SOCIAL_COMPONENTS.md  # Mobile/social features
└── PHASE_4_QUICK_REFERENCE.md        # Development phase guide
```

### Public Assets (`/public`)
```
public/
├── content/
│   ├── events.json         # Event data
│   ├── gallery.json        # Gallery metadata
│   └── flyers/             # Event flyer images
└── vite.svg                # Favicon
```

### Infrastructure
```
migrations/d1/              # D1 database migrations
scripts/                    # Deployment and setup scripts
.wrangler/                  # Wrangler build artifacts
```

## Core Components and Relationships

### Frontend Architecture
- **React App**: SPA built with React 19, Vite, and TailwindCSS
- **Routing**: Client-side routing with React Router
- **State Management**: React Context API for global state
- **UI Components**: Radix UI primitives with custom styling
- **Animations**: Framer Motion for transitions

### Backend Architecture
- **Worker Entry**: Hono framework handles all HTTP requests
- **API Routes**: RESTful endpoints for Spotify, Apple Music, Stripe, Medusa
- **Durable Objects**: RateLimiter and UserSession for stateful operations
- **KV Storage**: Session data and caching
- **D1 Database**: Event data and analytics
- **Analytics Engine**: Custom metrics collection

### Integration Flow
```
Client Request → Cloudflare Worker (Hono) → API Routes
                      ↓
    ┌─────────────────┼─────────────────┐
    ↓                 ↓                 ↓
KV Sessions    Durable Objects    External APIs
                                  (Spotify, Stripe, Medusa)
```

### Build Process
1. **Client Build**: Vite bundles React app → `dist/client/`
2. **Worker Build**: TypeScript compiles worker → `dist/worker/`
3. **Deployment**: Wrangler deploys worker + static assets to Cloudflare

## Architectural Patterns

### Edge-First Design
- Static assets served from Cloudflare CDN
- API logic runs on Workers (edge compute)
- Smart placement for optimal global performance

### Separation of Concerns
- React app handles UI/UX
- Worker handles API, auth, validation
- Medusa backend manages commerce logic
- External services handle payments, email, music APIs

### Type Safety
- Shared types between client and worker
- Worker bindings typed via `worker-configuration.d.ts`
- Zod schemas for runtime validation

### Progressive Enhancement
- Core functionality works without JavaScript
- Social embeds load asynchronously
- Lazy loading for images and components

### Security Layers
- PKCE flow for OAuth (no client secrets)
- Server-side token generation for Apple Music
- Rate limiting via Durable Objects
- Input validation on client and server
- CORS and CSP headers configured
