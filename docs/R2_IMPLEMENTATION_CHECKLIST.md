# R2 Optimization - Implementation Checklist

## 📋 Overview

This checklist guides you through implementing all R2 optimizations for the DJ Judas project. Complete tasks in order for best results.

---

## ✅ Phase 1: Essential Setup (Week 1)

### 1.1 CORS Configuration
**Priority**: High
**Impact**: Enables direct browser uploads
**Time**: 5 minutes

```bash
# Apply CORS configuration
npm run r2:cors:set

# Verify
npm run r2:cors
```

**Expected Output**:
```json
{
  "CORSRules": [{
    "AllowedOrigins": ["https://thevoicesofjudah.com", "..."],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    ...
  }]
}
```

**Validation**:
- [ ] CORS configuration applied
- [ ] Test OPTIONS request from frontend
- [ ] Verify no CORS errors in browser console

---

### 1.2 Lifecycle Rules
**Priority**: High
**Impact**: 30-40% cost reduction
**Time**: 10 minutes

```bash
# Configure lifecycle rules
npm run r2:lifecycle

# Verify
npm run r2:lifecycle:list
```

**Expected Rules**:
1. Event flyers → Infrequent Access (90 days)
2. Temp uploads → Delete (7 days)
3. Product images → Infrequent Access (365 days)

**Validation**:
- [ ] All 3 lifecycle rules created
- [ ] Rules match expected prefixes
- [ ] No errors in wrangler output

---

### 1.3 Presigned URL Integration
**Priority**: Medium
**Impact**: Reduces Worker bandwidth by 70%
**Time**: 30 minutes

**Files to integrate**:
```typescript
// src/worker/index.ts
import { r2PresignedApp } from './r2-presigned';

// Add route
app.route('/', r2PresignedApp);
```

**Testing**:
```bash
# Test presigned URL generation
curl -X POST http://localhost:8787/api/r2/presigned-upload \
  -H "Content-Type: application/json" \
  -d '{"key": "test/image.jpg", "contentType": "image/jpeg"}'
```

**Expected Response**:
```json
{
  "uploadUrl": "/api/r2/direct-upload",
  "uploadToken": "...",
  "key": "test/image.jpg",
  "publicUrl": "https://r2.thevoicesofjudah.com/test/image.jpg",
  ...
}
```

**Validation**:
- [ ] Presigned URL endpoint returns valid response
- [ ] Upload token is generated
- [ ] Direct upload works with token
- [ ] Public URL is accessible

---

## ✅ Phase 2: Performance Optimization (Week 2)

### 2.1 Multipart Upload Support
**Priority**: Medium
**Impact**: Enables videos and large files (>100MB)
**Time**: 45 minutes

**Integration**:
```typescript
// src/worker/index.ts
import { r2MultipartApp } from './r2-multipart';

app.route('/', r2MultipartApp);
```

**Testing**:
```bash
# 1. Initialize
UPLOAD_ID=$(curl -X POST http://localhost:8787/api/r2/multipart/init \
  -H "Content-Type: application/json" \
  -d '{"key": "videos/test.mp4", "contentType": "video/mp4"}' \
  | jq -r '.uploadId')

# 2. Upload part
curl -X PUT "http://localhost:8787/api/r2/multipart/part?key=videos/test.mp4&uploadId=$UPLOAD_ID&partNumber=1" \
  --data-binary @part1.bin

# 3. Complete
curl -X POST http://localhost:8787/api/r2/multipart/complete \
  -H "Content-Type: application/json" \
  -d "{\"key\":\"videos/test.mp4\",\"uploadId\":\"$UPLOAD_ID\",\"parts\":[{\"partNumber\":1,\"etag\":\"...\"}]}"
```

**Validation**:
- [ ] Multipart init returns uploadId
- [ ] Part upload succeeds
- [ ] Complete assembles parts correctly
- [ ] Abort cleans up parts

---

### 2.2 Location Hints (Optional)
**Priority**: Low
**Impact**: 10-20% latency reduction
**Time**: 2 hours (includes migration)

**Current Status**: Check bucket location
```bash
npm run r2:info
```

**Migration** (if needed):
```bash
# Create new bucket with location hint
wrangler r2 bucket create dj-judas-media-v2 --location-hint enam

# Migrate data with Super Slurper (via Dashboard)
# https://dash.cloudflare.com > R2 > Data Migration
```

**Validation**:
- [ ] New bucket created with location hint
- [ ] Data migration started
- [ ] Update wrangler.json binding
- [ ] Update R2_PUBLIC_BASE env var

---

## ✅ Phase 3: Monitoring & Analytics (Week 3)

### 3.1 Usage Monitoring
**Priority**: Medium
**Impact**: Cost visibility and optimization insights
**Time**: 30 minutes

**Setup**:
```bash
# Get Cloudflare API token
# Dashboard > My Profile > API Tokens > Create Token
# Permission: Account Analytics:Read

# Set env vars
export CF_ACCOUNT_ID="your-account-id"
export CF_API_TOKEN="your-api-token"
```

**Run Analytics** (monthly):
```bash
npx tsx scripts/r2-analytics.ts
```

**Expected Output**:
```
Bucket: dj-judas-media
  Storage: 12.34 GB
  Objects: 5,432
  Class A Ops: 120,000
  Class B Ops: 8,500
  Estimated cost: $0.23/month
```

**Validation**:
- [ ] Script runs without errors
- [ ] Metrics match Dashboard numbers
- [ ] Cost estimate is reasonable

---

### 3.2 Performance Benchmarks
**Priority**: Low
**Impact**: Baseline for future optimizations
**Time**: 20 minutes

**Run Lighthouse**:
```bash
npx lighthouse https://thevoicesofjudah.com/gallery \
  --only-categories=performance \
  --output=json \
  --output-path=./lighthouse-r2-before.json
```

**Target Metrics**:
- **LCP** (Largest Contentful Paint): < 2.5s
- **Cache Hit Rate**: > 80%
- **TTFB** (Time to First Byte): < 600ms

**Validation**:
- [ ] Baseline metrics recorded
- [ ] LCP is under 2.5s
- [ ] Images are cached properly

---

## ✅ Phase 4: Security & Best Practices (Week 4)

### 4.1 Rate Limiting for Uploads
**Priority**: High
**Impact**: Prevents abuse
**Time**: 15 minutes

**Integration**:
```typescript
// src/worker/r2-presigned.ts (already in file)
// Uncomment the TODO sections:

// Before generating presigned URL
const rateLimitOk = await checkRateLimit(ip, 'upload', 100, 3600);
if (!rateLimitOk) {
  return c.json({ error: 'rate_limit_exceeded' }, 429);
}
```

**Testing**:
```bash
# Send 101 upload requests in 1 hour
for i in {1..101}; do
  curl -X POST http://localhost:8787/api/r2/presigned-upload \
    -H "Content-Type: application/json" \
    -d "{\"key\": \"test/$i.jpg\"}"
  sleep 35  # ~36 seconds between requests
done
```

**Validation**:
- [ ] First 100 requests succeed
- [ ] 101st request returns 429
- [ ] Rate limit resets after 1 hour

---

### 4.2 File Type Validation
**Priority**: Medium
**Impact**: Prevents malicious uploads
**Time**: 10 minutes

**Add to presigned upload handler**:
```typescript
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'video/mp4',
  'video/webm',
  'application/pdf'
];

const { contentType } = await c.req.json();
if (!ALLOWED_TYPES.includes(contentType)) {
  return c.json({ error: 'unsupported_file_type' }, 400);
}
```

**Validation**:
- [ ] Allowed file types upload successfully
- [ ] Disallowed types return 400 error
- [ ] Error message is clear

---

### 4.3 Admin Authentication
**Priority**: High
**Impact**: Security
**Time**: 20 minutes

**Uncomment auth checks**:
```typescript
// src/worker/r2-presigned.ts
// src/worker/r2-multipart.ts

// Uncomment:
const session = await getAdminSession(c);
if (!session) return c.json({ error: 'unauthorized' }, 401);
```

**Testing**:
```bash
# Without auth token
curl -X POST http://localhost:8787/api/r2/presigned-upload \
  -H "Content-Type: application/json" \
  -d '{"key": "test.jpg"}'
# Expected: 401 Unauthorized

# With admin token
curl -X POST http://localhost:8787/api/r2/presigned-upload \
  -H "Cookie: medusa_admin_jwt=..." \
  -H "Content-Type: application/json" \
  -d '{"key": "test.jpg"}'
# Expected: 200 OK
```

**Validation**:
- [ ] Unauthenticated requests return 401
- [ ] Admin requests succeed
- [ ] Session validation works correctly

---

## 📊 Success Metrics

Track these metrics monthly:

| Metric | Before | After | Target |
|--------|--------|-------|--------|
| **Storage Cost** | $? | $? | 30% reduction |
| **Bandwidth Cost** | $? | $? | 50% reduction |
| **Upload Success Rate** | ?% | ?% | >99% |
| **Average Upload Time** | ?s | ?s | <2s for 1MB |
| **Cache Hit Rate** | ?% | ?% | >80% |
| **LCP (Performance)** | ?s | ?s | <2.5s |

**How to Track**:
```bash
# Run monthly
npm run r2:analytics  # Storage & operations
npx lighthouse https://thevoicesofjudah.com  # Performance
```

---

## 🔧 Rollback Plan

If issues occur, rollback in reverse order:

### Rollback Multipart Uploads
```typescript
// Comment out in index.ts:
// import { r2MultipartApp } from './r2-multipart';
// app.route('/', r2MultipartApp);
```

### Rollback Presigned URLs
```typescript
// Comment out in index.ts:
// import { r2PresignedApp } from './r2-presigned';
// app.route('/', r2PresignedApp);
```

### Rollback Lifecycle Rules
```bash
# List rules
npm run r2:lifecycle:list

# Delete specific rule
wrangler r2 bucket lifecycle remove dj-judas-media --rule-id event-flyers-to-ia
```

### Rollback CORS
```bash
# Remove CORS configuration
wrangler r2 bucket cors delete dj-judas-media
```

---

## 📝 Notes

- **Backup**: Before making changes, backup critical data
- **Testing**: Test each phase in staging/dev before production
- **Monitoring**: Watch logs and metrics closely after each deployment
- **Documentation**: Update this checklist as you complete tasks

---

## ✅ Final Checklist

**Phase 1: Essential Setup**
- [ ] CORS configured and verified
- [ ] Lifecycle rules applied
- [ ] Presigned URLs integrated and tested

**Phase 2: Performance**
- [ ] Multipart uploads working
- [ ] Location hints optimized (if needed)

**Phase 3: Monitoring**
- [ ] Analytics script running monthly
- [ ] Baseline metrics recorded

**Phase 4: Security**
- [ ] Rate limiting enabled
- [ ] File type validation added
- [ ] Admin auth enforced

**Deployment**
- [ ] All changes tested locally
- [ ] Staging deployment successful
- [ ] Production deployment complete
- [ ] Metrics improving as expected

---

**Last Updated**: 2025-10-25
**Status**: Ready for implementation
**Estimated Total Time**: 8-10 hours spread over 4 weeks
