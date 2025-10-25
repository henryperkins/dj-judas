# R2 Storage Optimization Guide

## Current Setup Summary

### Buckets
- **dj-judas-media**: Primary media storage (images, flyers, gallery photos)
- **user-assets**: User-uploaded content (fallback)

### Current Implementation ✅
- ✅ Streaming uploads (no memory buffer)
- ✅ Range request support for large files
- ✅ Cache-Control headers (`max-age=31536000`)
- ✅ Custom domain (`https://r2.thevoicesofjudah.com`)
- ✅ HEAD requests for existence checks
- ✅ Admin-protected upload/delete endpoints

### Use Cases
| Use Case | Implementation | File/Lines |
|----------|---------------|------------|
| Static Assets | Edge caching + CDN redirects | `index.ts:316-340` |
| Product Images | Streaming uploads + metadata | `index.ts:1144-1220` |
| Gallery Photos | Full CRUD with R2+D1 | `index.ts:2733-3070` |
| Event Flyers | Automated upload on import | `index.ts:1454-1520` |
| Generic R2 API | Upload/Read/Delete/List | `index.ts:1247-1440` |

---

## Recommended Improvements

### 1. CORS Configuration (High Priority)

**Why**: Enables direct browser uploads, reduces Worker bandwidth.

**Implementation**:
```bash
# Apply CORS configuration
wrangler r2 bucket cors put dj-judas-media --file r2-cors-config.json

# Verify
wrangler r2 bucket cors get dj-judas-media
```

**Configuration** (`r2-cors-config.json`):
```json
{
  "CORSRules": [{
    "AllowedOrigins": [
      "https://thevoicesofjudah.com",
      "http://localhost:5173"
    ],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }]
}
```

---

### 2. Presigned URLs (Medium Priority)

**Why**: Allow direct browser uploads without Worker intermediation.

**Files Created**:
- `src/worker/r2-presigned.ts` - Presigned URL generation
- Endpoints:
  - `POST /api/r2/presigned-upload` - Generate upload URL
  - `POST /api/r2/direct-upload` - Validate and upload

**Integration**:
```typescript
// In your Worker index.ts
import { r2PresignedApp } from './r2-presigned';
app.route('/', r2PresignedApp);
```

**Client Usage**:
```typescript
// React component
const { uploadUrl, uploadToken } = await fetch('/api/r2/presigned-upload', {
  method: 'POST',
  body: JSON.stringify({ key: 'products/image.jpg', contentType: 'image/jpeg' })
}).then(r => r.json());

// Upload file directly
await fetch(uploadUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'image/jpeg',
    'X-Upload-Token': uploadToken
  },
  body: fileData
});
```

---

### 3. Multipart Uploads (Medium Priority)

**Why**: Reliable uploads for files >100MB (videos, high-res images).

**Files Created**:
- `src/worker/r2-multipart.ts` - Multipart upload handlers
- Endpoints:
  - `POST /api/r2/multipart/init` - Start upload
  - `PUT /api/r2/multipart/part` - Upload part
  - `POST /api/r2/multipart/complete` - Finish upload
  - `DELETE /api/r2/multipart/abort` - Cancel upload

**Integration**:
```typescript
// In your Worker index.ts
import { r2MultipartApp } from './r2-multipart';
app.route('/', r2MultipartApp);
```

**Client Usage**:
```typescript
// 1. Initialize
const { uploadId } = await fetch('/api/r2/multipart/init', {
  method: 'POST',
  body: JSON.stringify({ key: 'videos/large.mp4', contentType: 'video/mp4' })
}).then(r => r.json());

// 2. Upload parts (5MB - 5GB each)
const parts = [];
for (let i = 0; i < totalParts; i++) {
  const part = file.slice(i * PART_SIZE, (i + 1) * PART_SIZE);
  const { partNumber, etag } = await fetch(
    `/api/r2/multipart/part?key=videos/large.mp4&uploadId=${uploadId}&partNumber=${i + 1}`,
    { method: 'PUT', body: part }
  ).then(r => r.json());
  parts.push({ partNumber, etag });
}

// 3. Complete
await fetch('/api/r2/multipart/complete', {
  method: 'POST',
  body: JSON.stringify({ key: 'videos/large.mp4', uploadId, parts })
});
```

---

### 4. Lifecycle Rules (High Priority - Cost Savings)

**Why**: Automatically transition old assets to cheaper storage classes.

**Implementation**:
```bash
# Run the configuration script
./scripts/configure-r2-lifecycle.sh
```

**Rules**:
1. **Event Flyers** → Infrequent Access after 90 days (50% cheaper)
2. **Temp Uploads** → Delete after 7 days (cleanup)
3. **Old Product Images** → Infrequent Access after 1 year

**Estimated Savings**: 30-40% reduction in storage costs for old assets.

---

### 5. Location Hints (Low Priority)

**Why**: Place data closer to users for faster access.

**Recommendation**:
```bash
# If most users are in North America
wrangler r2 bucket create dj-judas-media-v2 --location-hint enam

# If global audience
wrangler r2 bucket create dj-judas-media-v2 --location-hint wnam
```

**Migration**: Use [Super Slurper](https://developers.cloudflare.com/r2/data-migration/super-slurper/) to migrate existing data.

---

### 6. Monitoring & Analytics (Medium Priority)

**Files Created**:
- `scripts/r2-analytics.ts` - GraphQL-based usage monitoring

**Usage**:
```typescript
import { fetchR2Metrics, calculateMonthlyCost } from './scripts/r2-analytics';

const metrics = await fetchR2Metrics('your-account-id', 'your-api-token');
for (const bucket of metrics) {
  console.log(`Bucket: ${bucket.bucketName}`);
  console.log(`  Storage: ${(bucket.storageBytes / (1024**3)).toFixed(2)} GB`);
  const cost = calculateMonthlyCost(bucket);
  console.log(`  Estimated cost: $${cost.total.toFixed(2)}/month`);
}
```

---

## Performance Optimizations

### Current Optimizations ✅
1. **Streaming Uploads**: No memory buffering (lines 1172, 1268, 1479, 2877)
2. **Cache Headers**: `max-age=31536000, immutable` for static assets
3. **CDN Redirects**: Direct to custom domain for public URLs
4. **Range Requests**: Partial content delivery for videos

### Additional Recommendations

#### A. Add Tiered Cache for Global Audience
```toml
# wrangler.toml
[cache]
tiered = true
```

#### B. Optimize Image Delivery with Variants
Use Cloudflare Images variants instead of storing multiple sizes:
```typescript
// Instead of storing thumb.jpg, medium.jpg, large.jpg
// Store one image and use variants:
const thumbUrl = `https://imagedelivery.net/${accountHash}/${imageId}/thumb`;
const largeUrl = `https://imagedelivery.net/${accountHash}/${imageId}/large`;
```

#### C. Batch Operations for Cleanup
Delete multiple objects in one API call:
```typescript
// Instead of individual deletes
await Promise.all(keys.map(key => bucket.delete(key)));

// Use batch delete (when available in R2 Workers API)
await bucket.deleteObjects(keys);
```

---

## Security Best Practices

### Current Implementation ✅
- ✅ Admin-only upload/delete endpoints
- ✅ Path validation (no `..` traversal)

### Additional Recommendations

#### A. Rate Limiting for Uploads
```typescript
// Use your existing RateLimiter Durable Object
const rateLimitOk = await checkRateLimit(ip, 'upload', 100, 3600); // 100 uploads/hour
if (!rateLimitOk) {
  return c.json({ error: 'rate_limit_exceeded' }, 429);
}
```

#### B. File Type Validation
```typescript
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4'];
const contentType = c.req.header('Content-Type');
if (!ALLOWED_TYPES.includes(contentType)) {
  return c.json({ error: 'unsupported_file_type' }, 400);
}
```

#### C. Server-Side Encryption (Optional)
For sensitive data:
```typescript
await bucket.put(key, data, {
  customMetadata: {
    encrypted: 'true',
  },
  // R2 supports SSE-C (customer-provided keys)
});
```

---

## Cost Optimization Checklist

- [x] Streaming uploads (no memory buffer)
- [x] Cache-Control headers
- [ ] Lifecycle rules (transition to IA)
- [ ] Delete unused temp files
- [ ] Presigned URLs (reduce Worker bandwidth)
- [ ] Multipart uploads for large files
- [ ] Monitor usage with GraphQL API
- [ ] Batch operations for cleanup

**Estimated Savings**: 40-60% reduction in R2 costs with full implementation.

---

## Testing Recommendations

### 1. CORS Testing
```bash
curl -X OPTIONS https://r2.thevoicesofjudah.com/test.jpg \
  -H "Origin: https://thevoicesofjudah.com" \
  -H "Access-Control-Request-Method: PUT"
```

### 2. Range Request Testing
```bash
curl -I https://r2.thevoicesofjudah.com/large-file.mp4 \
  -H "Range: bytes=0-1023"
```

### 3. Lifecycle Rules Verification
```bash
wrangler r2 bucket lifecycle list dj-judas-media
```

### 4. Performance Testing
Use [Lighthouse](https://developers.google.com/web/tools/lighthouse) to test image delivery:
- Target: LCP < 2.5s
- Cache hit rate: >80%

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| **CORS errors** | Verify `AllowedOrigins` includes your domain |
| **403 Forbidden** | Check API token has `Admin Read & Write` permission |
| **Slow uploads** | Use multipart uploads for files >100MB |
| **High costs** | Enable lifecycle rules, monitor usage |
| **Cache misses** | Verify `Cache-Control` headers, enable Tiered Cache |

---

## Next Steps

1. **Week 1**: Apply CORS configuration, test direct uploads
2. **Week 2**: Implement lifecycle rules, monitor savings
3. **Week 3**: Add multipart upload support for videos
4. **Week 4**: Set up analytics dashboard, optimize based on metrics

---

## Resources

- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [R2 Pricing](https://developers.cloudflare.com/r2/pricing/)
- [R2 API Reference](https://developers.cloudflare.com/r2/api/workers/)
- [GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)
- [Super Slurper (Migration)](https://developers.cloudflare.com/r2/data-migration/super-slurper/)

---

**Last Updated**: 2025-10-25
**Status**: Ready for implementation
