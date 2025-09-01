# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a full-stack React application for DJ Lee & Voices of Judah gospel music ministry, built with React + Vite + Hono + Cloudflare Workers. The project uses a mobile-first design approach and integrates with Spotify and Apple Music APIs.

## Common Development Commands

### Development
```bash
npm run dev                    # Start development server (http://localhost:5173)
npm run build                  # Build for production (runs tsc -b && vite build)
npm run preview               # Preview production build locally
```

### Code Quality
```bash
npm run lint                   # Run ESLint
npm run check                 # Full check: TypeScript + build + deploy dry-run + accessibility
npm run check:a11y            # Accessibility testing with pa11y
```

### Deployment
```bash
npm run deploy               # Deploy to Cloudflare Workers
npm run cf-typegen          # Generate Cloudflare Worker types
npx wrangler tail           # Monitor deployed worker logs
```

### Testing Single Components
When working with individual components, use Vite's development server with hot module replacement for rapid iteration.

## Architecture

### Directory Structure
- `src/worker/` - Hono backend server running on Cloudflare Workers
- `src/react-app/` - React frontend application
  - `components/` - React components including sections and UI components
  - `utils/` - Utility functions including platform detection
  - `styles/` - CSS styles
  - `assets/` - Static assets
- `src/components/ui/` - Shared UI components (Radix UI based)
- `src/lib/` - Shared utility functions

### Key Technologies
- **Frontend**: React 19, Vite, TailwindCSS 4.1, Framer Motion, Radix UI
- **Backend**: Hono framework on Cloudflare Workers
- **APIs**: Spotify OAuth (PKCE), Apple Music (MusicKit)
- **Styling**: Mobile-first TailwindCSS with custom CSS for animations
- **TypeScript**: Strict TypeScript configuration with path aliases (`@/*`)

### Backend API Structure
The Hono server (`src/worker/index.ts`) provides:
- `/api/metrics` - Mock aggregated social metrics
- `/api/spotify/*` - Spotify OAuth and API integration (login, callback, save, follow)
- `/api/apple/developer-token` - Apple Music developer token generation

### Frontend Architecture
- **Main App**: Single-page application centered around `EnhancedLandingPageV2`
- **Lazy Loading**: Heavy components (MusicHub, PhotoGallery, BookingForm) are lazy-loaded
- **Mobile-First**: Uses `isMobileDevice()` utility for responsive behavior
- **Sections**: Modular sections (Hero, About, Services, Stats) for organized content

## Environment Variables

### Required Secrets (Cloudflare Workers)
```bash
wrangler secret put SPOTIFY_CLIENT_ID
wrangler secret put APPLE_TEAM_ID
wrangler secret put APPLE_KEY_ID  
wrangler secret put APPLE_PRIVATE_KEY  # PKCS8 PEM format, escape newlines for CLI
```

### Client Environment Variables (.env)
```
VITE_FACEBOOK_APP_ID=
VITE_FACEBOOK_PIXEL_ID=
VITE_SPOTIFY_ARTIST_ID=  # Optional
```

## Development Patterns

### Component Creation
- Follow existing component patterns in `src/react-app/components/`
- Use TypeScript interfaces for props
- Implement mobile-first responsive design
- Utilize Radix UI components from `src/components/ui/` when possible

### Styling Approach
- Primary: TailwindCSS classes with mobile-first breakpoints
- Custom CSS: Place in component-specific CSS files or `src/react-app/styles/`
- Animations: Use Framer Motion for complex animations
- Mobile-first: Always design for mobile first, then scale up

### API Integration
- Backend API calls go through Hono routes in `src/worker/index.ts`
- Use proper TypeScript interfaces for request/response types
- Implement proper error handling and HTTP status codes
- Session management uses HTTP-only cookies for security

### Code Quality Requirements
- All TypeScript must pass `tsc` compilation
- ESLint rules must pass (includes React hooks and refresh rules)
- Accessibility testing with pa11y (threshold: 10 issues max)
- Build must succeed before deployment

## Path Aliases
- `@/*` maps to `./src/*` for clean imports
- Use absolute imports with the `@/` alias rather than relative paths when possible

## Security Notes
- Never expose Apple private keys or Spotify secrets to client-side code
- Use PKCE flow for Spotify OAuth (no client secret required)
- Server-side token minting for Apple Music integration
- HTTP-only cookies for session management