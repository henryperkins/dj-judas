# Cloudflare Infrastructure Verification Script for Windows
# Run this script to verify and optimize your Cloudflare Workers setup

Write-Host "🔍 Cloudflare Infrastructure Verification" -ForegroundColor Blue
Write-Host ""

# Function to check command availability
function Test-Command {
    param($Command)
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check if Wrangler is installed
Write-Host "Checking Wrangler installation..." -ForegroundColor Cyan
if (Test-Command "wrangler") {
    $wranglerVersion = wrangler --version 2>$null
    Write-Host "✅ Wrangler installed: $wranglerVersion" -ForegroundColor Green
} else {
    Write-Host "❌ Wrangler not installed. Install with: npm install -g wrangler" -ForegroundColor Red
    exit 1
}

# Check authentication
Write-Host "`nChecking Cloudflare authentication..." -ForegroundColor Cyan
try {
    $whoami = wrangler whoami 2>&1
    if ($whoami -match "Not logged in") {
        Write-Host "❌ Not authenticated. Please run: wrangler login" -ForegroundColor Red
        exit 1
    } else {
        Write-Host "✅ Authenticated successfully" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠️ Could not verify authentication" -ForegroundColor Yellow
}

# Verify KV Namespaces
Write-Host "`n📦 Verifying KV Namespaces..." -ForegroundColor Cyan
try {
    $kvList = wrangler kv namespace list 2>&1 | ConvertFrom-Json
    $sessionsNamespace = $kvList | Where-Object { $_.id -eq "b7654d69472c4e1b8eda8bbae8ee2776" }
    
    if ($sessionsNamespace) {
        Write-Host "✅ SESSIONS namespace exists: $($sessionsNamespace.title)" -ForegroundColor Green
    } else {
        Write-Host "⚠️ SESSIONS namespace not found. You may need to update wrangler.toml" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠️ Could not verify KV namespaces" -ForegroundColor Yellow
}

# Check for .dev.vars file
Write-Host "`n🔐 Checking environment variables..." -ForegroundColor Cyan
$devVarsPath = ".\.dev.vars"
$devVarsExamplePath = ".\.dev.vars.example"

if (-not (Test-Path $devVarsPath)) {
    if (Test-Path $devVarsExamplePath) {
        Write-Host "Creating .dev.vars from example..." -ForegroundColor Yellow
        Copy-Item $devVarsExamplePath $devVarsPath
        Write-Host "✅ Created .dev.vars - Please update with your actual values" -ForegroundColor Green
    } else {
        Write-Host "❌ .dev.vars file not found" -ForegroundColor Red
    }
} else {
    Write-Host "✅ .dev.vars file exists" -ForegroundColor Green
    
    # Check for placeholder values
    $content = Get-Content $devVarsPath -Raw
    if ($content -match "your_") {
        Write-Host "⚠️ Found placeholder values in .dev.vars - update with actual values" -ForegroundColor Yellow
    }
}

# Generate optimized wrangler.toml
Write-Host "`n📝 Generating optimized configuration..." -ForegroundColor Cyan

$optimizedConfig = @'
name = "dj-judas"
main = "./src/worker/index.ts"
compatibility_date = "2025-04-01"
compatibility_flags = ["nodejs_compat"]
account_id = "a77e479f6736120eadd99973dbeb705e"

# Performance optimizations
[placement]
mode = "smart"

[observability]
enabled = true

upload_source_maps = true

[assets]
directory = "./dist/client"
not_found_handling = "single-page-application"

# KV Namespace for sessions
[[kv_namespaces]]
binding = "SESSIONS"
id = "b7654d69472c4e1b8eda8bbae8ee2776"

# AI binding for product suggestions
[ai]
binding = "AI"

# Optional: D1 Database for structured data
# [[d1_databases]]
# binding = "DB"
# database_name = "dj-judas-db"
# database_id = "YOUR_DATABASE_ID"

# Optional: R2 for media storage
# [[r2_buckets]]
# binding = "MEDIA_BUCKET"
# bucket_name = "media-bucket"

# Optional: Queue for background processing
# [[queues.producers]]
# binding = "EMAIL_QUEUE"
# queue = "email-queue"

# Optional: Durable Objects for real-time features
# [[durable_objects.bindings]]
# name = "USER_SESSIONS"
# class_name = "UserSession"
# script_name = "dj-judas"

# Optional: Analytics Engine
# [[analytics_engine_datasets]]
# binding = "ANALYTICS"
'@

$optimizedConfig | Out-File -FilePath ".\wrangler.toml.optimized" -Encoding UTF8
Write-Host "✅ Generated optimized configuration at wrangler.toml.optimized" -ForegroundColor Green

# Compare with current configuration
Write-Host "`n📊 Configuration Analysis..." -ForegroundColor Cyan
$currentConfig = Get-Content ".\wrangler.toml" -Raw

$missingFeatures = @()

if ($currentConfig -notmatch "\[placement\]") {
    $missingFeatures += "Smart Placement (performance optimization)"
}
if ($currentConfig -notmatch "d1_databases") {
    $missingFeatures += "D1 Database (structured data storage)"
}
if ($currentConfig -notmatch "r2_buckets") {
    $missingFeatures += "R2 Storage (media files)"
}
if ($currentConfig -notmatch "queues") {
    $missingFeatures += "Queues (background processing)"
}
if ($currentConfig -notmatch "durable_objects") {
    $missingFeatures += "Durable Objects (real-time features)"
}
if ($currentConfig -notmatch "analytics_engine") {
    $missingFeatures += "Analytics Engine (observability)"
}

if ($missingFeatures.Count -gt 0) {
    Write-Host "`n⚠️ Missing optimizations:" -ForegroundColor Yellow
    foreach ($feature in $missingFeatures) {
        Write-Host "   - $feature" -ForegroundColor Yellow
    }
}

# Create quick update script
$updateScript = @'
# Quick update script to apply optimizations

# Backup current configuration
Copy-Item wrangler.toml wrangler.toml.backup

# Apply smart placement optimization
$config = Get-Content wrangler.toml -Raw
if ($config -notmatch "\[placement\]") {
    $config += "`n[placement]`nmode = `"smart`"`n"
    $config | Out-File wrangler.toml -Encoding UTF8
    Write-Host "Added smart placement configuration" -ForegroundColor Green
}

Write-Host "Configuration updated. Run 'wrangler deploy' to apply changes." -ForegroundColor Cyan
'@

$updateScript | Out-File -FilePath ".\apply-optimizations.ps1" -Encoding UTF8
Write-Host "`n✅ Created apply-optimizations.ps1 script" -ForegroundColor Green

# Summary
Write-Host "`n✨ Verification Complete!" -ForegroundColor Green
Write-Host "`n📚 Recommendations:" -ForegroundColor Cyan
Write-Host "1. Review wrangler.toml.optimized for suggested improvements" -ForegroundColor Yellow
Write-Host "2. Run .\apply-optimizations.ps1 to apply basic optimizations" -ForegroundColor Yellow
Write-Host "3. Update .dev.vars with actual API keys and tokens" -ForegroundColor Yellow
Write-Host "4. Consider adding D1 database for events and products" -ForegroundColor Yellow
Write-Host "5. Add R2 bucket for media storage" -ForegroundColor Yellow
Write-Host "6. Implement Durable Objects for session management" -ForegroundColor Yellow
Write-Host "7. Deploy with: wrangler deploy" -ForegroundColor Yellow

Write-Host "`n🎯 Quick Actions:" -ForegroundColor Cyan
Write-Host "• Apply optimizations: .\apply-optimizations.ps1" -ForegroundColor White
Write-Host "• Deploy worker: wrangler deploy" -ForegroundColor White
Write-Host "• View logs: wrangler tail" -ForegroundColor White
Write-Host "• Test locally: npm run dev" -ForegroundColor White
