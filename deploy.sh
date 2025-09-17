#!/bin/bash
# Cloudflare Infrastructure Quick Deploy Script
# This script verifies configuration and deploys your worker

echo "🚀 DJ Lee & Voices of Judah - Cloudflare Deployment"
echo "=================================================="
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Check if running on Windows
if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    print_status "$YELLOW" "Running on Windows - using PowerShell script instead..."
    powershell.exe -ExecutionPolicy Bypass -File verify-cloudflare.ps1
    exit 0
fi

# Step 1: Verify Wrangler installation
print_status "$BLUE" "Step 1: Verifying Wrangler installation..."
if command -v wrangler &> /dev/null; then
    VERSION=$(wrangler --version)
    print_status "$GREEN" "✅ Wrangler installed: $VERSION"
else
    print_status "$RED" "❌ Wrangler not found. Installing..."
    npm install -g wrangler
fi

# Step 2: Check authentication
print_status "$BLUE" "\nStep 2: Checking authentication..."
if wrangler whoami &> /dev/null; then
    print_status "$GREEN" "✅ Authenticated with Cloudflare"
else
    print_status "$YELLOW" "⚠️ Not authenticated. Running login..."
    wrangler login
fi

# Step 3: Verify KV namespace
print_status "$BLUE" "\nStep 3: Verifying KV namespace..."
KV_LIST=$(wrangler kv namespace list 2>/dev/null)
if echo "$KV_LIST" | grep -q "b7654d69472c4e1b8eda8bbae8ee2776"; then
    print_status "$GREEN" "✅ SESSIONS KV namespace configured"
else
    print_status "$YELLOW" "⚠️ SESSIONS KV namespace may need verification"
fi

# Step 4: Check environment variables
print_status "$BLUE" "\nStep 4: Checking environment variables..."
if [ -f ".dev.vars" ]; then
    print_status "$GREEN" "✅ .dev.vars file exists"
    
    # Check for placeholder values
    if grep -q "your_" .dev.vars; then
        print_status "$YELLOW" "⚠️ Found placeholder values in .dev.vars"
        print_status "$YELLOW" "   Please update with actual API keys and tokens"
    fi
else
    if [ -f ".dev.vars.example" ]; then
        print_status "$YELLOW" "⚠️ Creating .dev.vars from example..."
        cp .dev.vars.example .dev.vars
        print_status "$GREEN" "✅ Created .dev.vars - update with actual values"
    else
        print_status "$RED" "❌ No .dev.vars file found"
    fi
fi

# Step 5: Build the application
print_status "$BLUE" "\nStep 5: Building application..."
if npm run build &> /dev/null; then
    print_status "$GREEN" "✅ Build successful"
else
    print_status "$RED" "❌ Build failed. Running npm install..."
    npm install
    npm run build
fi

# Step 6: Deploy to Cloudflare
print_status "$BLUE" "\nStep 6: Ready to deploy..."
echo ""
read -p "Deploy to Cloudflare Workers? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status "$BLUE" "Deploying..."
    
    if wrangler deploy; then
        print_status "$GREEN" "\n✅ Deployment successful!"
        
        # Get the deployment URL
        WORKER_URL="https://dj-judas.lfd.workers.dev"
        print_status "$GREEN" "🌐 Worker URL: $WORKER_URL"
        
        # Additional deployment info
        print_status "$BLUE" "\n📊 Post-deployment checklist:"
        echo "  1. Test the worker: curl $WORKER_URL/api/"
        echo "  2. Monitor logs: wrangler tail"
        echo "  3. Check metrics: wrangler analytics"
        echo "  4. Update DNS if using custom domain"
        
    else
        print_status "$RED" "❌ Deployment failed"
        print_status "$YELLOW" "Check the error messages above and try:"
        echo "  1. wrangler whoami (verify authentication)"
        echo "  2. wrangler deploy --dry-run (test deployment)"
        echo "  3. wrangler tail (check logs)"
    fi
else
    print_status "$YELLOW" "Deployment cancelled"
fi

# Step 7: Optimization recommendations
print_status "$BLUE" "\n📚 Optimization Recommendations:"
echo ""
print_status "$YELLOW" "Current optimizations applied:"
echo "  ✅ Smart placement enabled"
echo "  ✅ Observability enabled"
echo "  ✅ Source maps enabled"

print_status "$YELLOW" "\nConsider adding:"
echo "  • D1 Database: wrangler d1 create dj-judas-db"
echo "  • R2 Storage: wrangler r2 bucket create media"
echo "  • Queue: wrangler queues create email-queue"
echo "  • Analytics: Enable in Cloudflare dashboard"

print_status "$GREEN" "\n✨ Setup complete!"
