# Medusa Backend Deployment Guide

Your complete architecture requires THREE components:
1. **Frontend** → Netlify (React app)
2. **API Layer** → Cloudflare Workers (Hono)
3. **Medusa Backend** → Need to deploy this!

## Medusa Deployment Options

### Option 1: Railway (Easiest)
Railway provides one-click Medusa deployment with PostgreSQL.

```bash
# Deploy using Railway template
# Visit: https://railway.app/new/template/medusa

# Or use CLI
npm install -g @railway/cli
railway login
railway new
railway up
```

**Pros:** 
- One-click deployment
- Includes PostgreSQL, Redis
- SSL certificates included
- $5/month starter plan

### Option 2: Render
Free tier available with PostgreSQL.

1. Create `render.yaml` in medusa-backend:
```yaml
services:
  - type: web
    name: medusa-backend
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm run start
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: medusa-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true
      - key: COOKIE_SECRET
        generateValue: true
      - key: STORE_CORS
        value: https://your-site.netlify.app
      - key: ADMIN_CORS
        value: https://your-site.netlify.app

databases:
  - name: medusa-db
    plan: free
```

2. Deploy: Connect GitHub repo on render.com

### Option 3: DigitalOcean App Platform

```yaml
# app.yaml
name: medusa-backend
region: nyc
services:
  - name: medusa
    github:
      repo: your-username/medusa-backend
      branch: main
    build_command: npm install && npm run build
    run_command: npm start
    environment_slug: node-js
    instance_size_slug: basic-xxs
    instance_count: 1
    http_port: 9000
    envs:
      - key: DATABASE_URL
        scope: RUN_TIME
        value: ${db.DATABASE_URL}
      - key: STORE_CORS
        scope: RUN_TIME
        value: "https://your-site.netlify.app"
      - key: ADMIN_CORS
        scope: RUN_TIME  
        value: "https://your-site.netlify.app"
databases:
  - name: db
    engine: PG
    version: "14"
```

Deploy: `doctl apps create --spec app.yaml`

### Option 4: Heroku

```json
// app.json
{
  "name": "medusa-backend",
  "scripts": {
    "postdeploy": "npm run migrate && npm run seed"
  },
  "env": {
    "DATABASE_URL": {
      "description": "PostgreSQL connection string"
    },
    "JWT_SECRET": {
      "generator": "secret"
    },
    "COOKIE_SECRET": {
      "generator": "secret"
    },
    "STORE_CORS": {
      "value": "https://your-site.netlify.app"
    }
  },
  "addons": [
    "heroku-postgresql:mini",
    "heroku-redis:mini"
  ]
}
```

Deploy:
```bash
heroku create your-medusa-app
heroku addons:create heroku-postgresql:mini
git push heroku main
```

### Option 5: Medusa Cloud (Official)
Managed hosting by Medusa team.

Visit: [medusajs.com/cloud](https://medusajs.com/cloud)

**Pros:**
- Fully managed
- Automatic updates
- Built-in monitoring
- Support included

## Quick Start with Railway (Recommended)

1. **Deploy Medusa to Railway:**
```bash
# Clone Medusa starter
git clone https://github.com/medusajs/medusa-starter-default medusa-backend
cd medusa-backend

# Deploy to Railway
railway login
railway new
railway link
railway up
```

2. **Get your Medusa URL:**
```bash
railway open
# Copy the URL, e.g., https://medusa-backend.up.railway.app
```

3. **Update Environment Variables:**

**In Netlify (Frontend):**
```
VITE_MEDUSA_URL=https://medusa-backend.up.railway.app
VITE_MEDUSA_PUBLISHABLE_KEY=pk_xxx  # From Medusa admin
```

**In Cloudflare Workers (API Layer):**
```bash
npx wrangler secret put MEDUSA_URL
# Enter: https://medusa-backend.up.railway.app
```

4. **Configure CORS in Medusa:**

Edit `medusa-config.js` in your Medusa backend:
```javascript
module.exports = {
  projectConfig: {
    store_cors: process.env.STORE_CORS || "https://your-site.netlify.app",
    admin_cors: process.env.ADMIN_CORS || "https://your-site.netlify.app",
    // ...
  }
}
```

## Complete Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Netlify    │────▶│  Cloudflare  │────▶│   Railway    │
│  (React UI)  │     │   Workers    │     │   (Medusa)   │
│              │     │ (Hono APIs)  │     │              │
│ djjudas.com  │     │   /api/*     │     │ PostgreSQL   │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │   External   │
                    │   Services   │
                    │              │
                    │ • Stripe     │
                    │ • Spotify    │
                    │ • SendGrid   │
                    └──────────────┘
```

## Environment Variable Summary

### Netlify (Frontend)
```bash
VITE_MEDUSA_URL=https://medusa-backend.railway.app
VITE_MEDUSA_PUBLISHABLE_KEY=pk_xxx
VITE_WORKER_URL=https://dj-judas.workers.dev
```

### Cloudflare Workers (API)
```bash
MEDUSA_URL=https://medusa-backend.railway.app
SPOTIFY_CLIENT_ID=xxx
STRIPE_SECRET=sk_xxx
# ... other API keys
```

### Railway/Render (Medusa)
```bash
DATABASE_URL=postgresql://...
STORE_CORS=https://djjudas.netlify.app
ADMIN_CORS=https://djjudas.netlify.app
JWT_SECRET=xxx
COOKIE_SECRET=xxx
```

## Testing Your Setup

1. **Test Medusa:**
```bash
curl https://your-medusa.railway.app/store/products
```

2. **Test Worker API:**
```bash
curl https://your-worker.workers.dev/api/
```

3. **Test Frontend:**
Visit your Netlify URL and check browser console for any errors.

## Cost Estimates

- **Netlify**: Free tier (100GB bandwidth)
- **Cloudflare Workers**: Free tier (100k requests/day)
- **Railway**: $5/month (includes PostgreSQL)
- **Total**: ~$5/month for production

## Next Steps

1. Deploy Medusa to Railway/Render
2. Get publishable key from Medusa admin
3. Update all environment variables
4. Test the complete flow