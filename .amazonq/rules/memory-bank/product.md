# Product Overview

## Project Purpose
DJ Judas is a full-stack React application built on Cloudflare Workers edge platform, combining a modern web presence with e-commerce capabilities, music streaming integrations, and event management features for a DJ/artist brand.

## Value Proposition
- **Edge-First Architecture**: Leverages Cloudflare Workers for global, low-latency content delivery
- **Integrated Commerce**: Full e-commerce functionality via Medusa backend with Stripe payment processing
- **Music Platform Integration**: Native Spotify and Apple Music connectivity with PKCE authentication
- **Event Management**: Booking system with email notifications and event catalog
- **Social Engagement**: Facebook Pixel tracking, social media embeds, and sharing capabilities
- **AI-Powered Features**: Workers AI integration for intelligent product suggestions and content

## Key Features

### Core Capabilities
- **Single Page Application**: React 19 with Vite for fast, modern UI
- **Server-Side Rendering**: Hono framework handles API routes and SSR on the edge
- **Real-Time Analytics**: Analytics Engine integration for custom metrics tracking
- **Session Management**: KV-based sessions with Durable Objects for rate limiting
- **Mobile-First Design**: Responsive UI optimized for mobile streaming and social sharing

### Commerce Features
- Product catalog with Medusa storefront integration
- Shopping cart with address validation and shipping calculation
- Stripe Checkout integration with tax calculation
- Order management and fulfillment workflows

### Music Integration
- Spotify OAuth (PKCE flow) for playlist saves and artist follows
- Apple Music integration with developer token generation
- Track/album saving and artist following capabilities
- Aggregated metrics endpoint for social/music analytics

### Event & Booking
- Event calendar with JSON-based content management
- Mobile-first booking form with server-side validation
- Email delivery via Resend/SendGrid
- Anti-spam measures and accessibility compliance

### Developer Experience
- TypeScript throughout (React app + Worker)
- Hot Module Replacement (HMR) for rapid development
- ESLint configuration with React hooks rules
- Playwright E2E testing suite
- Pa11y accessibility testing
- Observability with source maps enabled

## Target Users

### Primary Audience
- Fans and followers of DJ Judas seeking music, merchandise, and event information
- Mobile users streaming content and engaging on social platforms
- E-commerce customers purchasing physical goods (merchandise, tickets)

### Secondary Audience
- Event organizers booking DJ services
- Social media audiences discovering content through embeds
- Music platform users (Spotify/Apple Music) following and saving tracks

## Use Cases
1. **Fan Engagement**: Browse events, listen to mixes, follow on streaming platforms
2. **Merchandise Sales**: Purchase branded goods with integrated checkout and shipping
3. **Event Booking**: Submit booking requests with automated email notifications
4. **Social Discovery**: Share content across Facebook, Instagram, and other platforms
5. **Music Discovery**: Save tracks and follow artist on Spotify/Apple Music directly from site
