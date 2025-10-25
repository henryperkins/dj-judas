#!/bin/bash
# Configure R2 bucket lifecycle rules for cost optimization
# Moves old assets to Infrequent Access storage class

set -e

BUCKET="dj-judas-media"

echo "🔄 Configuring lifecycle rules for $BUCKET..."

# Rule 1: Move event flyers older than 90 days to Infrequent Access
# (Events are typically not accessed after they've passed)
wrangler r2 bucket lifecycle add "$BUCKET" "event-flyers-to-ia" "events/" \
  --ia-transition-days 90 \
  -y

echo "✅ Event flyers will transition to IA after 90 days"

# Rule 2: Delete temporary uploads older than 7 days
# (Cleanup incomplete/abandoned uploads)
wrangler r2 bucket lifecycle add "$BUCKET" "cleanup-temp-uploads" "temp/" \
  --expire-days 7 \
  -y

echo "✅ Temporary uploads will expire after 7 days"

# Rule 3: Move old product images to IA after 1 year
# (Popular products will still be cached in CDN)
wrangler r2 bucket lifecycle add "$BUCKET" "old-products-to-ia" "products/" \
  --ia-transition-days 365 \
  -y

echo "✅ Product images will transition to IA after 1 year"

# Rule 4: Move old gallery photos to IA after 1 year
wrangler r2 bucket lifecycle add "$BUCKET" "old-gallery-to-ia" "gallery/" \
  --ia-transition-days 365 \
  -y

echo "✅ Gallery photos will transition to IA after 1 year"

# Verify configuration
echo ""
echo "📋 Current lifecycle rules:"
wrangler r2 bucket lifecycle list "$BUCKET"

echo ""
echo "💡 Estimated savings:"
echo "   - Infrequent Access storage: 50% cheaper than Standard"
echo "   - Cleanup of temp files: Reduces wasted storage"
