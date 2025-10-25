# Cloudflare Platform Optimizations - Quick Start

## 🚀 Quick Commands

### Check Current Status
```bash
# R2 bucket info
npm run r2:info

# KV namespace stats
npm run kv:list

# View current configuration
cat wrangler.json
```

### Apply Optimizations (Week 1 - 15 minutes)
```bash
# 1. Apply R2 CORS (enables browser uploads)
npm run r2:cors:set

# 2. Configure lifecycle rules (saves 30-40% storage costs)
npm run r2:lifecycle

# 3. Check KV usage baseline
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
export CLOUDFLARE_API_TOKEN="your-api-token"
npm run kv:analytics

# 4. Deploy
npm run deploy

# 5. Monitor
wrangler tail
```

---

## 📚 Documentation

All comprehensive guides are in `docs/`:

| Document | Purpose |
|----------|---------|
| **CLOUDFLARE_OPTIMIZATION_SUMMARY.md** | High-level overview, impact estimates |
| **R2_OPTIMIZATION_GUIDE.md** | Complete R2 implementation guide |
| **R2_IMPLEMENTATION_CHECKLIST.md** | Step-by-step R2 tasks |
| **KV_OPTIMIZATION_GUIDE.md** | Complete KV implementation guide |

---

## 📊 What Was Optimized

### ✅ Durable Objects (COMPLETE)
- Migrated to SQL API
- Added WebSocket Hibernation
- Implemented RPC methods
- Sharded rate limiting

**Files**: `src/worker/durable-objects.ts`, `src/types/rpc.d.ts`

### ✅ R2 Storage (READY)
- CORS configuration
- Presigned URLs
- Multipart uploads
- Lifecycle rules
- Analytics

**Files**: `src/worker/r2-*.ts`, `scripts/r2-*.{ts,sh}`

### ✅ Workers KV (READY)
- Session migration plan
- Cache optimizations
- Analytics
- Cleanup scripts

**Files**: `scripts/kv-*.{ts,sh}`

---

## 💰 Expected Impact

| Optimization | Savings | Status |
|-------------|---------|--------|
| DO Hibernation | ~80% duration costs | ✅ Deployed |
| R2 Lifecycle | 30-40% storage costs | ⏳ Ready to apply |
| R2 Presigned URLs | 70% Worker bandwidth | ⏳ Ready to integrate |
| KV Session Migration | 50% KV writes | ⏳ Ready to implement |
| **TOTAL** | **$50-100/month** | **In progress** |

---

## 🛠️ Implementation Timeline

### Week 1 (2-3 hours) - QUICK WINS
Apply CORS, lifecycle rules, establish baselines

### Week 2 (4-6 hours) - SESSION MIGRATION
Migrate sessions from KV to Durable Objects

### Week 3 (6-8 hours) - ADVANCED R2
Add presigned URLs and multipart uploads

### Week 4 (3-4 hours) - MONITORING
Set up analytics, optimize caching

**Total**: 15-20 hours over 4 weeks

---

## 🆘 Troubleshooting

### CORS Issues
```bash
# Verify CORS is applied
npm run r2:cors

# Reapply if needed
npm run r2:cors:set
```

### Lifecycle Rules
```bash
# Check rules
npm run r2:lifecycle:list

# Remove rule
wrangler r2 bucket lifecycle remove dj-judas-media --rule-id <rule-name>
```

### KV Analytics Not Working
```bash
# Ensure env vars are set
echo $CLOUDFLARE_ACCOUNT_ID
echo $CLOUDFLARE_API_TOKEN

# Get API token from Dashboard > My Profile > API Tokens
```

---

## 📞 Support

1. **Read Documentation**: See `docs/` folder
2. **Check Logs**: `wrangler tail --format=pretty`
3. **Rollback**: Each guide includes rollback instructions
4. **Community**: [Cloudflare Discord](https://discord.cloudflare.com)

---

## ✅ Next Steps

**Choose your path**:

**Option A: Start Now** (Recommended)
```bash
npm run r2:cors:set && npm run r2:lifecycle && npm run deploy
```

**Option B: Test Locally First**
```bash
npm run dev
# Test endpoints at http://localhost:8787
```

**Option C: Review Documentation**
```bash
open docs/CLOUDFLARE_OPTIMIZATION_SUMMARY.md
```

---

**Last Updated**: 2025-10-25
**Status**: ✅ Ready for implementation
**Quick Start Time**: 15 minutes (Week 1 tasks)
