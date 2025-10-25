#!/bin/bash
# Find all KV session usage that needs migration to Durable Objects

set -e

echo "🔍 Scanning for KV session usage..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

FILE="src/worker/index.ts"

echo -e "${BLUE}📄 Analyzing: $FILE${NC}"
echo ""

# Find KV session reads
echo -e "${YELLOW}⚠️  KV Session READS (need migration):${NC}"
grep -n "SESSIONS.*get.*spotify\|kv\.get.*spotify" "$FILE" | while read -r line; do
  line_num=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2-)
  echo -e "  ${RED}Line $line_num:${NC} $code"
done
echo ""

# Find KV session writes
echo -e "${YELLOW}⚠️  KV Session WRITES (need migration):${NC}"
grep -n "SESSIONS.*put.*spotify\|kv\.put.*spotify" "$FILE" | while read -r line; do
  line_num=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2-)
  echo -e "  ${RED}Line $line_num:${NC} $code"
done
echo ""

# Find KV checks
echo -e "${YELLOW}⚠️  KV Availability CHECKS (can be removed):${NC}"
grep -n "SESSIONS?: KVNamespace\|if (!kv)" "$FILE" | while read -r line; do
  line_num=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2-)
  echo -e "  ${RED}Line $line_num:${NC} $code"
done
echo ""

# Find Durable Objects usage (already migrated)
echo -e "${GREEN}✅ Durable Objects session usage (already good):${NC}"
grep -n "USER_SESSIONS\|stub\.getSession\|stub\.setSession" "$FILE" | while read -r line; do
  line_num=$(echo "$line" | cut -d: -f1)
  code=$(echo "$line" | cut -d: -f2-)
  echo -e "  ${GREEN}Line $line_num:${NC} $code"
done
echo ""

# Summary
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📊 Summary:${NC}"
echo ""

KV_READS=$(grep -c "kv\.get.*spotify" "$FILE" 2>/dev/null || echo "0")
KV_WRITES=$(grep -c "kv\.put.*spotify" "$FILE" 2>/dev/null || echo "0")
DO_USAGE=$(grep -c "stub\.getSession\|stub\.setSession" "$FILE" 2>/dev/null || echo "0")

echo "  KV Session Reads:  $KV_READS (need migration)"
echo "  KV Session Writes: $KV_WRITES (need migration)"
echo "  DO Session Calls:  $DO_USAGE (already migrated)"
echo ""

if [ "$KV_READS" -eq 0 ] && [ "$KV_WRITES" -eq 0 ]; then
  echo -e "${GREEN}✅ Migration complete! No KV session code found.${NC}"
else
  echo -e "${YELLOW}⚠️  Action needed: $((KV_READS + KV_WRITES)) locations to migrate${NC}"
  echo ""
  echo "📚 See migration guide: scripts/migrate-sessions-to-do.md"
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
