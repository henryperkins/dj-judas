# DJ Judas Project Setup Guide

## Quick Start

1. **Clone and Install**
   ```bash
   git clone [your-repo]
   cd dj-judas
   npm install
   ```

2. **Set Up Environment Variables**
   ```bash
   # For local development
   cp .env.development .env.local
   cp .dev.vars.example .dev.vars
   # Edit both files with your actual values
   ```

3. **Start Development**
   ```bash
   npm run dev
   ```

## Required Integrations Setup

### 1. Medusa Backend (E-commerce)

**Option A: Use Medusa Cloud (Recommended)**
1. Sign up at https://cloud.medusajs.com
2. Create a new store
3. Get your API URL and publishable key
4. Update `.env.local`:
   ```
   VITE_MEDUSA_URL=https://your-store.medusa-commerce.com
   VITE_MEDUSA_PUBLISHABLE_KEY=pk_your_key
   ```

**Option B: Self-host Medusa**
1. Follow https://docs.medusajs.com/create-medusa-app
2. Start your local Medusa server
3. Update `.env.local`:
   ```
   VITE_MEDUSA_URL=http://localhost:9000
   ```

### 2. Stripe Payment Processing (via Medusa)

**Important**: Stripe is integrated through Medusa backend, not the worker. The payment flow is handled entirely by Medusa.

1. **Create Stripe Account**
   - Sign up at https://stripe.com
   - Get your test API keys from Dashboard → Developers → API keys

2. **Configure Stripe in Medusa Backend**
   
   a. **Install Stripe plugin** (if not already installed):
   ```bash
   cd medusa-backend
   npm install medusa-payment-stripe
   ```
   
   b. **Add environment variables** to `medusa-backend/.env`:
   ```
   STRIPE_API_KEY=sk_test_your_stripe_secret_key
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
   ```
   
   c. **Verify plugin configuration** in `medusa-backend/medusa-config.js`:
   ```javascript
   {
     resolve: `medusa-payment-stripe`,
     options: {
       api_key: process.env.STRIPE_API_KEY,
       webhook_secret: process.env.STRIPE_WEBHOOK_SECRET,
     },
   }
   ```

3. **Enable Stripe in Medusa Admin**
   - Log into Medusa Admin (http://localhost:7001)
   - Go to Settings → Regions
   - Select your region
   - Add "Stripe" as a payment provider
   - Save changes

4. **Test Stripe Integration**
   - Use test card: 4242 4242 4242 4242
   - Any future expiry date and any 3-digit CVC
   - The checkout will process through Medusa's Stripe integration

### 3. Email Service

**Option A: Resend (Recommended)**
1. Sign up at https://resend.com
2. Get API key from Dashboard
3. Add domain and verify
4. Update `.dev.vars`:
   ```
   RESEND_API_KEY=re_your_key
   RESEND_FROM=DJ Judas <noreply@yourdomain.com>
   RESEND_TO=your-email@domain.com
   ```

**Option B: SendGrid**
1. Sign up at https://sendgrid.com
2. Create API key with Mail Send permissions
3. Verify sender identity
4. Update `.dev.vars`:
   ```
   SENDGRID_API_KEY=SG.your_key
   SENDGRID_FROM=noreply@yourdomain.com
   SENDGRID_TO=your-email@domain.com
   ```

### 4. Social Media APIs

**Spotify**
1. Go to https://developer.spotify.com/dashboard
2. Create an app
3. Add redirect URI: `http://localhost:8787/api/spotify/callback`
4. Update `.dev.vars`:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   ```
5. Find your artist ID and update `.env.local`:
   ```
   VITE_SPOTIFY_ARTIST_ID=your_artist_id
   ```

**Apple Music**
1. Join Apple Developer Program
2. Create MusicKit identifier and private key
3. Update `.dev.vars`:
   ```
   APPLE_TEAM_ID=your_team_id
   APPLE_KEY_ID=your_key_id
   APPLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----
   your_key_content
   -----END PRIVATE KEY-----
   ```

**Instagram/Facebook**
1. Create Facebook App at https://developers.facebook.com
2. Add Instagram Basic Display or Instagram Graph API
3. Get long-lived access token
4. Update `.dev.vars`:
   ```
   IG_OEMBED_TOKEN=your_token
   ```
5. Update `.env.local` for tracking:
   ```
   VITE_FACEBOOK_APP_ID=your_app_id
   VITE_FACEBOOK_PIXEL_ID=your_pixel_id
   ```

### 5. Cloudflare Images (Product Photos)

1. **Enable Cloudflare Images**
   - Log in to Cloudflare Dashboard
   - Go to Images
   - Subscribe to Images plan

2. **Create API Token**
   - Go to My Profile → API Tokens
   - Create token with "Cloudflare Images:Edit" permission

3. **Configure Variants**
   - In Images dashboard, create variants:
     - `public` - Full size
     - `thumb` - 300x300
     - `large` - 1200x1200

4. **Update Variables**:
   ```
   CF_IMAGES_ACCOUNT_ID=your_account_id
   CF_IMAGES_API_TOKEN=your_token
   CF_IMAGES_VARIANT=public
   CF_IMAGES_VARIANT_THUMB=thumb
   CF_IMAGES_VARIANT_LARGE=large
   ```

### 6. AI Product Descriptions (Optional)

**Option A: OpenAI**
1. Get API key from https://platform.openai.com
2. Update `.dev.vars`:
   ```
   OPENAI_API_KEY=sk-your_key
   ```

**Option B: Cloudflare Workers AI**
1. Enable Workers AI in your Cloudflare account
2. No additional configuration needed (uses worker binding)

## Deployment to Production

### 1. Set Production Secrets

```bash
# Set each secret individually
wrangler secret put STRIPE_SECRET
wrangler secret put STRIPE_WEBHOOK_SECRET
wrangler secret put RESEND_API_KEY
# ... repeat for all secrets
```

### 2. Configure Production URLs

Update production environment variables:
- `SITE_URL` - Your production domain
- `VITE_MEDUSA_URL` - Production Medusa URL
- All callback URLs in OAuth providers

### 3. Deploy

```bash
npm run deploy
```

## Testing Checklist

### E-commerce Flow
- [ ] Products display correctly
- [ ] Add to cart works
- [ ] Cart persists across sessions
- [ ] Checkout form validates
- [ ] Stripe payment processes
- [ ] Success page shows order details

### Admin Features
- [ ] Admin login works
- [ ] Create new product with images
- [ ] AI suggestions generate
- [ ] Edit existing products
- [ ] Manage variants

### Integrations
- [ ] Spotify login and save
- [ ] Apple Music token generates
- [ ] Booking emails send
- [ ] Instagram embeds load
- [ ] Social metrics display

## Troubleshooting

### CORS Issues
Add your development URL to Medusa CORS settings:
```js
// medusa-config.js
store_cors: "http://localhost:5173"
admin_cors: "http://localhost:5173"
```

### Stripe Webhooks Local Testing
Use Stripe CLI for local webhook testing:
```bash
stripe listen --forward-to localhost:8787/api/stripe/webhook
```

### Images Not Uploading
Check:
1. API token has Images:Edit permission
2. Account ID is correct
3. Variants exist in dashboard

### Email Not Sending
Verify:
1. API key is valid
2. Sender domain/email is verified
3. From address matches verified sender

## Support

For issues or questions:
1. Check the CLAUDE.md file for codebase documentation
2. Review error logs: `npx wrangler tail`
3. Test with development credentials first
4. Verify all environment variables are set correctly