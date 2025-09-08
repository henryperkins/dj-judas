#!/bin/bash

echo "🚀 Full Stack Deployment Script for DJ Judas"
echo "==========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}This will deploy your app to:${NC}"
echo "1. Medusa Backend → Railway"
echo "2. API Layer → Cloudflare Workers"
echo "3. Frontend → Netlify"
echo ""

read -p "Continue? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Step 1: Deploy Medusa to Railway
echo -e "\n${GREEN}Step 1: Deploying Medusa to Railway...${NC}"
cd medusa-backend
if command -v railway &> /dev/null; then
    railway up
    MEDUSA_URL=$(railway open --json | jq -r '.url')
    echo "Medusa deployed to: $MEDUSA_URL"
else
    echo "Railway CLI not installed. Install with: npm install -g @railway/cli"
    echo "Then run: railway login && railway new"
fi
cd ..

# Step 2: Deploy Worker to Cloudflare
echo -e "\n${GREEN}Step 2: Deploying API to Cloudflare Workers...${NC}"
if [ ! -z "$MEDUSA_URL" ]; then
    echo "Setting MEDUSA_URL secret..."
    echo "$MEDUSA_URL" | npx wrangler secret put MEDUSA_URL
fi
npm run deploy
WORKER_URL="https://dj-judas.lfd.workers.dev"
echo "Worker deployed to: $WORKER_URL"

# Step 3: Build and Deploy Frontend to Netlify
echo -e "\n${GREEN}Step 3: Deploying Frontend to Netlify...${NC}"

# Update .env with production URLs
cat > .env.production << EOF
VITE_MEDUSA_URL=${MEDUSA_URL:-http://localhost:9000}
VITE_MEDUSA_PUBLISHABLE_KEY=${VITE_MEDUSA_PUBLISHABLE_KEY:-pk_xxx}
VITE_WORKER_URL=$WORKER_URL
EOF

# Build frontend
npm run build:client

# Deploy to Netlify
if command -v netlify &> /dev/null; then
    netlify deploy --prod --dir=dist/client
else
    echo "Netlify CLI not installed. Install with: npm install -g netlify-cli"
    echo "Then run: netlify login && netlify init"
fi

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "Your app is deployed to:"
echo "• Medusa Backend: ${MEDUSA_URL:-Not deployed}"
echo "• API Layer: $WORKER_URL"
echo "• Frontend: Check Netlify dashboard for URL"
echo ""
echo "Next steps:"
echo "1. Get publishable key from Medusa admin: ${MEDUSA_URL}/app"
echo "2. Update environment variables in Netlify dashboard"
echo "3. Configure custom domains if needed"