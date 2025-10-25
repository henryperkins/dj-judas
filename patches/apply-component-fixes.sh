#!/bin/bash
###############################################################################
# PHASE 4 COMPONENT CLASS RENAME SCRIPT
# Automatically renames .action-btn → .bottom-sheet-action in mobile components
#
# Usage: bash patches/apply-component-fixes.sh
# Generated: 2025-10-25
###############################################################################

set -e  # Exit on error

echo "========================================================================="
echo "Phase 4 Component Class Rename Script"
echo "========================================================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# File paths
SPOTIFY_MOBILE="src/react-app/components/social/embeds/SpotifyEmbedMobile.tsx"
APPLE_MOBILE="src/react-app/components/social/embeds/AppleMusicEmbedMobile.tsx"

# Check if files exist
if [ ! -f "$SPOTIFY_MOBILE" ]; then
    echo -e "${RED}ERROR: $SPOTIFY_MOBILE not found${NC}"
    exit 1
fi

if [ ! -f "$APPLE_MOBILE" ]; then
    echo -e "${RED}ERROR: $APPLE_MOBILE not found${NC}"
    exit 1
fi

echo "Files found ✓"
echo ""

# Backup files
echo "Creating backups..."
cp "$SPOTIFY_MOBILE" "$SPOTIFY_MOBILE.backup"
cp "$APPLE_MOBILE" "$APPLE_MOBILE.backup"
echo -e "${GREEN}Backups created:${NC}"
echo "  - $SPOTIFY_MOBILE.backup"
echo "  - $APPLE_MOBILE.backup"
echo ""

# Count occurrences before
echo "Analyzing current usage..."
spotify_before=$(grep -c 'action-btn' "$SPOTIFY_MOBILE" || true)
apple_before=$(grep -c 'action-btn' "$APPLE_MOBILE" || true)
echo "  SpotifyEmbedMobile: $spotify_before occurrences of 'action-btn'"
echo "  AppleMusicEmbedMobile: $apple_before occurrences of 'action-btn'"
echo ""

# Apply replacements
echo "Applying replacements..."

# SpotifyEmbedMobile.tsx
echo "  Processing $SPOTIFY_MOBILE..."
sed -i 's/className="action-btn action-btn--primary"/className="bottom-sheet-action bottom-sheet-action--primary"/g' "$SPOTIFY_MOBILE"
sed -i 's/className="action-btn"/className="bottom-sheet-action"/g' "$SPOTIFY_MOBILE"

# AppleMusicEmbedMobile.tsx
echo "  Processing $APPLE_MOBILE..."
sed -i 's/className="action-btn action-btn--primary"/className="bottom-sheet-action bottom-sheet-action--primary"/g' "$APPLE_MOBILE"
sed -i 's/className="action-btn"/className="bottom-sheet-action"/g' "$APPLE_MOBILE"

echo -e "${GREEN}Replacements complete${NC}"
echo ""

# Verify replacements
echo "Verifying replacements..."
spotify_after_old=$(grep -c 'action-btn' "$SPOTIFY_MOBILE" || true)
apple_after_old=$(grep -c 'action-btn' "$APPLE_MOBILE" || true)
spotify_after_new=$(grep -c 'bottom-sheet-action' "$SPOTIFY_MOBILE" || true)
apple_after_new=$(grep -c 'bottom-sheet-action' "$APPLE_MOBILE" || true)

echo "  SpotifyEmbedMobile:"
echo "    - 'action-btn' remaining: $spotify_after_old (should be 0)"
echo "    - 'bottom-sheet-action' found: $spotify_after_new (should be 6)"

echo "  AppleMusicEmbedMobile:"
echo "    - 'action-btn' remaining: $apple_after_old (should be 0)"
echo "    - 'bottom-sheet-action' found: $apple_after_new (should be 3)"
echo ""

# Check results
success=true

if [ "$spotify_after_old" -ne 0 ]; then
    echo -e "${RED}✗ SpotifyEmbedMobile still has 'action-btn' occurrences${NC}"
    success=false
fi

if [ "$apple_after_old" -ne 0 ]; then
    echo -e "${RED}✗ AppleMusicEmbedMobile still has 'action-btn' occurrences${NC}"
    success=false
fi

if [ "$spotify_after_new" -ne 6 ]; then
    echo -e "${YELLOW}⚠ SpotifyEmbedMobile has $spotify_after_new 'bottom-sheet-action' (expected 6)${NC}"
fi

if [ "$apple_after_new" -ne 3 ]; then
    echo -e "${YELLOW}⚠ AppleMusicEmbedMobile has $apple_after_new 'bottom-sheet-action' (expected 3)${NC}"
fi

if [ "$success" = true ]; then
    echo -e "${GREEN}=========================================================================${NC}"
    echo -e "${GREEN}SUCCESS! All replacements completed successfully${NC}"
    echo -e "${GREEN}=========================================================================${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Review changes: git diff $SPOTIFY_MOBILE"
    echo "  2. Review changes: git diff $APPLE_MOBILE"
    echo "  3. Test in browser: npm run dev"
    echo "  4. If issues occur, restore: mv *.backup back to original names"
    echo ""
    echo "To remove backups after verification:"
    echo "  rm $SPOTIFY_MOBILE.backup"
    echo "  rm $APPLE_MOBILE.backup"
else
    echo -e "${RED}=========================================================================${NC}"
    echo -e "${RED}ERRORS DETECTED - Please review output above${NC}"
    echo -e "${RED}=========================================================================${NC}"
    echo ""
    echo "To restore backups:"
    echo "  mv $SPOTIFY_MOBILE.backup $SPOTIFY_MOBILE"
    echo "  mv $APPLE_MOBILE.backup $APPLE_MOBILE"
    exit 1
fi
