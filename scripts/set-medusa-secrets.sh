#!/bin/bash

# Script to set Medusa-related secrets for Cloudflare Workers
# Usage: ./scripts/set-medusa-secrets.sh

echo "Setting Medusa secrets for Cloudflare Workers..."

# Worker-side secret (for admin proxy)
echo "Setting MEDUSA_URL (backend URL for admin proxy)..."
echo "Enter your Medusa backend URL (e.g., https://your-medusa-backend.com):"
read MEDUSA_URL
npx wrangler secret put MEDUSA_URL --input "$MEDUSA_URL"

echo ""
echo "✅ Worker secret set successfully!"
echo ""
echo "📝 For client-side environment variables, create a .env file with:"
echo ""
echo "VITE_MEDUSA_URL=$MEDUSA_URL"
echo "VITE_MEDUSA_PUBLISHABLE_KEY=pk_... # Get from Medusa Admin"
echo ""
echo "These client-side variables are used during build time (npm run build)."
echo ""
echo "🚀 To deploy with secrets:"
echo "1. Set client variables in .env"
echo "2. Run: npm run build"
echo "3. Run: npm run deploy"