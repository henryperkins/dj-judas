# Technology Stack

## Programming Languages
- **TypeScript 5.9.2**: Primary language for both frontend and backend
- **JavaScript (ES Modules)**: Module system throughout
- **SQL**: D1 database migrations

## Frontend Stack

### Core Framework
- **React 19.2.0**: UI library with latest features
- **React DOM 19.2.0**: DOM rendering
- **Vite 6.3.6**: Build tool and dev server

### UI & Styling
- **TailwindCSS 4.1.13**: Utility-first CSS framework
- **@tailwindcss/vite 4.1.13**: Vite integration
- **Radix UI**: Accessible component primitives
  - `@radix-ui/react-dialog 1.1.15`
  - `@radix-ui/react-slot 1.2.3`
  - `@radix-ui/react-switch 1.2.6`
  - `@radix-ui/react-tabs 1.1.13`
- **Framer Motion 12.23.12**: Animation library
- **Lucide React 0.544.0**: Icon library
- **React Icons 5.5.0**: Additional icon sets

### State & Data
- **React Context API**: Global state management
- **React Intersection Observer 9.16.0**: Lazy loading and scroll effects
- **Custom hooks**: Reusable stateful logic

### Integrations
- **React Social Media Embed 2.5.18**: Social platform embeds
- **React Facebook 10.0.1**: Facebook SDK integration
- **React QR Code 2.0.18**: QR code generation

## Backend Stack

### Runtime & Framework
- **Cloudflare Workers**: Edge compute platform
- **Hono 4.9.9**: Lightweight web framework
- **Node.js Compatibility**: Via `nodejs_compat` flag

### Authentication & Security
- **Jose 6.1.0**: JWT and token handling
- **Zod 4.1.8**: Schema validation and type inference

### Payment & Commerce
- **Stripe 19.0.0**: Payment processing
- **Medusa JS SDK 2.10.1**: E-commerce backend client
- **@medusajs/types 2.10.1**: Type definitions

### Utilities
- **tslib 2.8.1**: TypeScript runtime helpers
- **clsx 2.1.1**: Conditional class names
- **class-variance-authority 0.7.1**: Component variants
- **tailwind-merge 3.3.1**: Merge Tailwind classes

## Cloudflare Platform Services

### Compute & Storage
- **Workers**: Serverless edge functions
- **KV Namespace**: Key-value storage for sessions
- **D1 Database**: SQLite-based relational database
- **Durable Objects**: Stateful serverless objects
- **Analytics Engine**: Custom metrics collection
- **Workers AI**: AI/ML capabilities

### Configuration
- **Wrangler 4.41.0**: CLI for Workers development and deployment
- **@cloudflare/vite-plugin 1.12.3**: Vite integration
- **Smart Placement**: Automatic optimal deployment locations
- **Observability**: Built-in monitoring with source maps

## Development Tools

### Build & Bundling
- **Vite 6.3.6**: Fast build tool with HMR
- **@vitejs/plugin-react 5.0.2**: React plugin for Vite
- **TypeScript Compiler**: Multi-project builds

### Code Quality
- **ESLint 9.35.0**: Linting
- **@eslint/js 9.35.0**: ESLint JavaScript rules
- **typescript-eslint 8.42.0**: TypeScript ESLint integration
- **eslint-plugin-react-hooks 6.1.0**: React hooks linting
- **eslint-plugin-react-refresh 0.4.20**: Fast refresh validation

### Testing
- **Playwright 1.55.1**: E2E testing framework
- **Pa11y 9.0.0**: Accessibility testing
- **wait-on 9.0.1**: Wait for services in test scripts

### Type Generation
- **@types/node 24.3.1**: Node.js type definitions
- **@types/react 19.1.12**: React type definitions
- **@types/react-dom 19.1.9**: React DOM type definitions
- **wrangler types**: Auto-generate Worker bindings types

## Development Commands

### Core Workflows
```bash
npm run dev              # Start Vite dev server with HMR
npm run build            # TypeScript compile + Vite build
npm run preview          # Preview production build locally
npm run deploy           # Deploy to Cloudflare Workers
```

### Build Variants
```bash
npm run build:client     # Build only client assets
npm run cf-typegen       # Generate Cloudflare bindings types
```

### Quality Checks
```bash
npm run lint             # Run ESLint
npm run check            # Full check: compile, build, dry-run, a11y
npm run check:a11y       # Accessibility testing with Pa11y
```

### Testing
```bash
npm run test:e2e         # Run Playwright tests
npm run test:e2e:ui      # Playwright UI mode
npm run test:e2e:headed  # Run tests with browser visible
npm run test:e2e:chromium # Run Chromium-only tests
npm run test:e2e:debug   # Debug mode with inspector
npm run test:e2e:report  # View test report
```

### Deployment
```bash
npm run deploy           # Deploy to Cloudflare
npm run deploy:netlify   # Deploy to Netlify (alternative)
wrangler tail            # Stream Worker logs
wrangler secret put      # Set environment secrets
```

## Configuration Files

### TypeScript
- `tsconfig.json`: Base configuration
- `tsconfig.app.json`: React app config (strict mode)
- `tsconfig.node.json`: Node scripts config
- `tsconfig.worker.json`: Worker config

### Build Tools
- `vite.config.ts`: Vite configuration with React, Tailwind, Cloudflare plugins
- `wrangler.toml`: Worker configuration, bindings, environment variables
- `components.json`: shadcn/ui component configuration

### Linting & Testing
- `eslint.config.js`: ESLint rules and plugins
- `playwright.config.ts`: E2E test configuration
- `pa11y.json`: Accessibility test rules

### Environment
- `.dev.vars`: Local development secrets (gitignored)
- `.dev.vars.example`: Template for local secrets
- `.env`: Environment variables
- `.env.example`: Template for environment variables

## External Services Integration

### Required Services
- **Cloudflare Account**: Workers, KV, D1, Analytics Engine
- **Spotify Developer**: OAuth client ID (PKCE flow)
- **Apple Developer**: Team ID, Key ID, Private Key (MusicKit)
- **Stripe**: Secret key, webhook secret
- **Medusa Backend**: Self-hosted or cloud instance

### Optional Services
- **Resend or SendGrid**: Email delivery for booking form
- **Facebook**: App ID and Pixel ID for social tracking
- **OpenAI**: API key for AI features (Workers AI alternative)

## Version Control & CI/CD
- **Git**: Version control
- **GitHub Actions**: E2E test automation (`.github/workflows/e2e-tests.yml`)
- **Wrangler**: Automated deployments
- **Railway**: Medusa backend hosting option
