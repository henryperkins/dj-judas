# Netlify Deployment Guide

This app uses a split deployment architecture:
- **Frontend**: Deploy to Netlify (React/Vite static site)
- **Backend**: Deploy to Cloudflare Workers (Hono APIs)

## Setup Steps

### 1. Deploy Backend to Cloudflare Workers

```bash
# Set your secrets
npx wrangler secret put MEDUSA_URL
npx wrangler secret put SPOTIFY_CLIENT_ID
# ... add other secrets as needed

# Deploy worker
npm run deploy
```

Note your Worker URL: `https://dj-judas.lfd.workers.dev`

### 2. Deploy Frontend to Netlify

#### Option A: Using Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize Netlify project
netlify init

# Deploy
npm run build:client
netlify deploy --prod --dir=dist/client
```

#### Option B: Using Git Integration

1. Push your code to GitHub/GitLab/Bitbucket
2. Go to [netlify.com](https://netlify.com)
3. Click "Add new site" → "Import an existing project"
4. Connect your repository
5. Configure build settings:
   - Build command: `npm run build:client`
   - Publish directory: `dist/client`

### 3. Set Environment Variables in Netlify

Go to Site Settings → Environment Variables and add:

```bash
# Medusa Configuration
VITE_MEDUSA_URL=https://your-medusa-backend.com
VITE_MEDUSA_PUBLISHABLE_KEY=pk_your_key_here

# Your Cloudflare Worker URL
VITE_WORKER_URL=https://dj-judas.lfd.workers.dev

# Optional: Other services
VITE_STRIPE_PRICE_ID=price_xxx
VITE_FACEBOOK_APP_ID=xxx
VITE_SPOTIFY_ARTIST_ID=xxx
```

### 4. Update API Endpoints

Since the frontend and backend are on different domains, update your API calls:

```typescript
// Before (relative URLs)
fetch('/api/booking')

// After (absolute URLs to Worker)
fetch(`${import.meta.env.VITE_WORKER_URL}/api/booking`)
```

Or use the proxy configuration in `netlify.toml` which redirects `/api/*` to your Worker.

## Architecture Overview

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│   Netlify   │ ──API──→│ Cloudflare Worker│ ──────→ │   Medusa    │
│  (Frontend) │         │    (Backend)     │         │   Backend   │
└─────────────┘         └──────────────────┘         └─────────────┘
     React                    Hono                    Ecommerce API
```

## Benefits of This Setup

- **Fast static hosting**: Netlify CDN for frontend assets
- **Edge computing**: Cloudflare Workers for API logic
- **Separation of concerns**: Frontend and backend can scale independently
- **Easy rollbacks**: Deploy frontend and backend separately

## Custom Domain Setup

1. **Frontend domain**: Configure in Netlify (e.g., `djjudas.com`)
2. **API subdomain**: Configure in Cloudflare (e.g., `api.djjudas.com`)
3. Update CORS settings in Worker to allow your frontend domain

## Troubleshooting

### CORS Issues
If you get CORS errors, update your Worker's CORS headers:

```typescript
// In src/worker/index.ts
app.use('*', cors({
  origin: ['https://your-netlify-site.netlify.app', 'https://djjudas.com']
}))
```

### Environment Variables Not Working
- Ensure variables are set in Netlify dashboard
- Rebuild and redeploy after changing variables
- Variables starting with `VITE_` are exposed to the frontend

### API Calls Failing
- Check the Worker URL in environment variables
- Verify Worker is deployed and running
- Check browser console for detailed error messages