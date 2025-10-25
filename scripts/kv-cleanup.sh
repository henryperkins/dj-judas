#!/bin/bash
# KV Namespace Cleanup Script
# Removes stale cache entries and orphaned data

set -e

BINDING="SESSIONS"
PREFIX=${1:-"cache:temp:"}

echo "🧹 KV Cleanup Script"
echo "─────────────────────────────────────"
echo "Namespace: $BINDING"
echo "Prefix: $PREFIX"
echo "─────────────────────────────────────"
echo ""

# Step 1: List keys with prefix
echo "📋 Step 1: Listing keys with prefix '$PREFIX'..."
KEY_COUNT=$(wrangler kv key list --binding="$BINDING" --prefix="$PREFIX" | jq '. | length')
echo "   Found: $KEY_COUNT keys"
echo ""

if [ "$KEY_COUNT" -eq 0 ]; then
  echo "✅ No keys to clean up!"
  exit 0
fi

# Step 2: Show sample keys
echo "📝 Step 2: Sample keys to be deleted (first 5):"
wrangler kv key list --binding="$BINDING" --prefix="$PREFIX" --limit=5 | jq -r '.[].name' | sed 's/^/   - /'
echo ""

# Step 3: Confirm deletion
read -p "⚠️  Delete $KEY_COUNT keys? (yes/no): " CONFIRM
if [ "$CONFIRM" != "yes" ]; then
  echo "❌ Cleanup cancelled"
  exit 0
fi

# Step 4: Delete keys
echo ""
echo "🗑️  Step 3: Deleting keys..."

# Get all keys as JSON array
KEYS=$(wrangler kv key list --binding="$BINDING" --prefix="$PREFIX" | jq -r '.[].name')

# Delete keys one by one (no bulk delete in wrangler CLI yet)
DELETED=0
for KEY in $KEYS; do
  wrangler kv key delete --binding="$BINDING" "$KEY" > /dev/null 2>&1
  DELETED=$((DELETED + 1))
  echo "   Deleted: $KEY ($DELETED/$KEY_COUNT)"
done

echo ""
echo "✅ Cleanup complete!"
echo "   Total deleted: $DELETED keys"
echo ""

# Step 5: Show updated stats
echo "📊 Updated namespace stats:"
TOTAL_KEYS=$(wrangler kv key list --binding="$BINDING" | jq '. | length')
echo "   Total keys remaining: $TOTAL_KEYS"
