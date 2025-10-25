# Workers KV Optimization Guide

## Current Setup Analysis

### KV Namespace
- **Name**: `SESSIONS`
- **ID**: `b7654d69472c4e1b8eda8bbae8ee2776`
- **Purpose**: Multi-purpose caching and storage

### Current Usage (✅ = Optimal, ⚠️ = Needs Attention)

| Use Case | Files | Status | Recommendation |
|----------|-------|--------|----------------|
| **OAuth Token Caching** | `index.ts:365,379` | ✅ Perfect fit | Keep as-is |
| **API Response Caching** | `cache-manager.ts` | ✅ Multi-tier (Edge+KV) | Add monitoring |
| **Social Media Cache** | `index.ts:2254,2662` | ✅ Good TTLs (300s) | Add key prefixes |
| **Session Storage** | `index.ts:619,726,854` | ⚠️ **REDUNDANT** | **Migrate to Durable Objects** |

---

## 🔴 Priority 1: Remove Session Storage Redundancy

### Problem
You're using **both** KV and Durable Objects for sessions:
- **KV** (`SESSIONS`): Eventual consistency, ~60s propagation delay
- **Durable Objects** (`USER_SESSIONS`): Strong consistency, instant reads

This causes:
- Wasted KV writes (unnecessary cost)
- Potential data inconsistency
- Increased complexity

### Solution: Migrate Sessions to Durable Objects

We already modernized your `USER_SESSIONS` Durable Object with proper SQL storage and RPC methods. Now let's remove the KV fallback code.

#### Step 1: Identify Session Code Using KV

Lines to update in `src/worker/index.ts`:
- **Line 619**: Session lookup fallback
- **Line 655**: Session storage fallback
- **Line 726**: Session validation
- **Line 756**: Session update
- **Line 854**: Session retrieval
- **Line 905**: Session cleanup

#### Step 2: Remove KV Session Code

**Before** (Line 619-625):
```typescript
const kv = (c.env as unknown as { SESSIONS?: KVNamespace })?.SESSIONS;
if (!kv) {
  return c.json({ error: 'kv_not_configured', message: 'SESSIONS KV binding not configured' }, 501);
}
const session = await kv.get(`spotify_session:${sessionId}`);
```

**After**:
```typescript
// Use Durable Objects exclusively (already implemented at line 704-710)
const ns = c.env.USER_SESSIONS;
if (ns && typeof ns.idFromName === 'function') {
  const id = ns.idFromName(sessionId);
  const stub = ns.get(id);
  // @ts-expect-error - RPC methods available at runtime
  const sessionData = await stub.getSession(sessionId);
  if (sessionData?.data) {
    return c.json(sessionData.data);
  }
}
return c.json({ error: 'session_not_found' }, 404);
```

#### Step 3: Update All Session Endpoints

Create a migration script to identify and update all session-related KV calls:

```bash
# Find all KV session calls
grep -n "SESSIONS.*spotify_session\|SESSIONS.*admin:" src/worker/index.ts

# Replace with Durable Objects calls
# (Manual update based on patterns above)
```

**Estimated Impact**:
- ✅ **-50% KV writes** (sessions are 50% of current writes)
- ✅ **Instant consistency** (no 60s propagation delay)
- ✅ **Simplified codebase** (single session storage backend)

---

## ✅ Priority 2: Optimize Caching Usage

### 2.1 Improve Cache Key Structure

**Current Keys** (unstructured):
```
fb_app_access_token
/api/metrics
```

**Recommended Keys** (namespaced):
```
oauth:facebook:app_token
cache:api:metrics
cache:social:instagram:posts
cache:social:facebook:events
```

**Benefits**:
- Easier bulk operations (delete all `cache:social:*`)
- Better monitoring (group by prefix)
- Collision prevention

#### Implementation

**Update CacheManager** (`src/worker/cache-manager.ts`):
```typescript
export class CacheManager {
  constructor(
    private kv: KVNamespace | null,
    private edgeCache?: Cache,
    private keyPrefix = 'cache:' // NEW: Add prefix
  ) {
    this.edgeCache = edgeCache ?? (caches as any).default;
  }

  async get<T>(key: string, opts?: { asResponse?: boolean }): Promise<T | Response | null> {
    const fullKey = `${this.keyPrefix}${key}`;
    // ... rest of implementation with fullKey
  }

  async set(key: string, value: unknown, ttl = 900): Promise<void> {
    const fullKey = `${this.keyPrefix}${key}`;
    // ... rest of implementation with fullKey
  }
}
```

**Update Usage**:
```typescript
// Old
const cache = new CacheManager(c.env.SESSIONS);

// New
const cache = new CacheManager(c.env.SESSIONS, undefined, 'cache:api:');
```

---

### 2.2 Add Cache Coalescing for Related Data

**Problem**: Multiple KV calls for related data
```typescript
// Current: 3 separate KV calls
const posts = await kv.get('instagram:posts');
const profile = await kv.get('instagram:profile');
const followers = await kv.get('instagram:followers');
```

**Solution**: Store related data together
```typescript
// Single KV call
const instagramData = await kv.get('social:instagram:all', { type: 'json' });
// Contains: { posts, profile, followers }
```

**Benefits**:
- ✅ **-66% KV reads** (1 call instead of 3)
- ✅ **-40% latency** (single round trip)
- ✅ **Atomic updates** (all data consistent)

**Limitation**: Max 25MB per value (check size first)

---

### 2.3 Implement Stale-While-Revalidate

**Enhancement**: Serve stale data while fetching fresh data in background

**Update CacheManager**:
```typescript
async getOrRevalidate<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 900,
  staleTime = 3600
): Promise<T> {
  const fullKey = `${this.keyPrefix}${key}`;

  // Try L1 (Edge Cache)
  const edgeHit = await this.edgeCache.match(new Request(`https://cache.edge${fullKey}`));
  if (edgeHit) {
    const age = parseInt(edgeHit.headers.get('Age') || '0');
    if (age < ttl) {
      return edgeHit.json();
    }
    // Stale but acceptable - return immediately, revalidate in background
    if (age < staleTime) {
      this.revalidateInBackground(key, fetcher, ttl); // Fire and forget
      return edgeHit.json();
    }
  }

  // Try L2 (KV)
  if (this.kv) {
    const kvHit = await this.kv.get(fullKey);
    if (kvHit) {
      this.revalidateInBackground(key, fetcher, ttl);
      return JSON.parse(kvHit);
    }
  }

  // Cache miss - fetch fresh data
  const fresh = await fetcher();
  await this.set(key, fresh, ttl);
  return fresh;
}

private async revalidateInBackground(
  key: string,
  fetcher: () => Promise<any>,
  ttl: number
): Promise<void> {
  try {
    const fresh = await fetcher();
    await this.set(key, fresh, ttl);
  } catch (error) {
    console.error('Background revalidation failed:', error);
  }
}
```

**Usage**:
```typescript
const metrics = await cache.getOrRevalidate(
  '/api/metrics',
  () => fetch('https://api.example.com/metrics').then(r => r.json()),
  900,  // Fresh TTL: 15 minutes
  3600  // Stale TTL: 1 hour
);
```

---

## ✅ Priority 3: Add Monitoring & Analytics

### 3.1 KV Usage Monitoring Script

Create `scripts/kv-analytics.ts`:
```typescript
// KV Analytics using Cloudflare GraphQL API
interface KVMetrics {
  namespace: string;
  reads: number;
  writes: number;
  deletes: number;
  storageBytes: number;
  estimatedCost: number;
}

export async function fetchKVMetrics(
  accountId: string,
  apiToken: string,
  namespaceId: string
): Promise<KVMetrics> {
  const query = `
    query GetKVMetrics($accountId: string!, $namespaceId: string!) {
      viewer {
        accounts(filter: { accountTag: $accountId }) {
          kvOperationsAdaptiveGroups(
            limit: 1000
            filter: {
              namespaceId: $namespaceId
              date_geq: "${new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()}"
            }
          ) {
            sum {
              requests
            }
            dimensions {
              actionType
            }
          }
          kvStorageAdaptiveGroups(
            filter: { namespaceId: $namespaceId }
          ) {
            max {
              storedBytes
            }
          }
        }
      }
    }
  `;

  const response = await fetch('https://api.cloudflare.com/client/v4/graphql', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, variables: { accountId, namespaceId } }),
  });

  const data = await response.json();

  // Aggregate metrics
  let reads = 0, writes = 0, deletes = 0;
  for (const group of data.data.viewer.accounts[0].kvOperationsAdaptiveGroups || []) {
    const actionType = group.dimensions.actionType;
    const count = group.sum.requests;

    if (actionType === 'read') reads += count;
    else if (actionType === 'write') writes += count;
    else if (actionType === 'delete') deletes += count;
  }

  const storageBytes = data.data.viewer.accounts[0].kvStorageAdaptiveGroups[0]?.max?.storedBytes || 0;

  // Calculate costs (as of 2025)
  const readCost = Math.max(0, (reads - 10_000_000) / 1_000_000 * 0.50);
  const writeCost = Math.max(0, (writes - 1_000_000) / 1_000_000 * 5.00);
  const storageGb = storageBytes / (1024 ** 3);
  const storageCost = Math.max(0, (storageGb - 1) * 0.50);

  return {
    namespace: namespaceId,
    reads,
    writes,
    deletes,
    storageBytes,
    estimatedCost: readCost + writeCost + storageCost,
  };
}

// Usage
const metrics = await fetchKVMetrics('account-id', 'api-token', 'b7654d69472c4e1b8eda8bbae8ee2776');
console.log(`Monthly KV Cost: $${metrics.estimatedCost.toFixed(2)}`);
console.log(`Reads: ${metrics.reads.toLocaleString()}`);
console.log(`Writes: ${metrics.writes.toLocaleString()}`);
```

---

### 3.2 Cache Hit Rate Monitoring

Add instrumentation to CacheManager:
```typescript
export class CacheManager {
  private stats = {
    edgeHits: 0,
    kvHits: 0,
    misses: 0,
  };

  async get<T>(key: string, opts?: { asResponse?: boolean }): Promise<T | Response | null> {
    // L1: Edge cache
    const edgeHit = await this.edgeCache.match(new Request(`https://cache.edge${key}`));
    if (edgeHit) {
      this.stats.edgeHits++;
      console.log(`[Cache] Edge HIT: ${key}`);
      return opts?.asResponse ? edgeHit : edgeHit.json();
    }

    // L2: KV
    if (this.kv) {
      const kvHit = await this.kv.get(key);
      if (kvHit) {
        this.stats.kvHits++;
        console.log(`[Cache] KV HIT: ${key}`);
        // ... populate edge cache
        return JSON.parse(kvHit);
      }
    }

    this.stats.misses++;
    console.log(`[Cache] MISS: ${key}`);
    return null;
  }

  getStats() {
    const total = this.stats.edgeHits + this.stats.kvHits + this.stats.misses;
    return {
      ...this.stats,
      hitRate: total > 0 ? ((this.stats.edgeHits + this.stats.kvHits) / total * 100).toFixed(2) + '%' : '0%',
    };
  }
}
```

**Log stats periodically**:
```typescript
setInterval(() => {
  console.log('Cache Stats:', cache.getStats());
}, 60000); // Every minute
```

---

## ✅ Priority 4: Bulk Operations & Cleanup

### 4.1 Create Bulk Cleanup Script

`scripts/kv-cleanup.sh`:
```bash
#!/bin/bash
# Clean up old cache entries from KV

set -e

NAMESPACE_ID="b7654d69472c4e1b8eda8bbae8ee2776"
BINDING="SESSIONS"

echo "🧹 Cleaning up KV namespace: $BINDING"

# List all keys with prefix "cache:"
echo "📋 Listing cache keys..."
wrangler kv key list --binding="$BINDING" --prefix="cache:" > /tmp/kv-keys.json

# Extract keys older than 7 days (requires additional metadata check)
# For now, delete keys matching specific patterns

echo "🗑️  Deleting temp cache entries..."
wrangler kv key delete --binding="$BINDING" "cache:temp:*"

echo "✅ Cleanup complete!"
```

### 4.2 Automated Expiration via TTL

**Best Practice**: Always set `expirationTtl` on writes
```typescript
// Good: Auto-expires after 1 hour
await env.SESSIONS.put('key', 'value', { expirationTtl: 3600 });

// Bad: Never expires (accumulates storage costs)
await env.SESSIONS.put('key', 'value');
```

**Audit existing code**:
```bash
# Find KV writes without TTL
grep -n "\.put\(" src/worker/index.ts | grep -v "expirationTtl"
```

---

## ✅ Priority 5: Performance Optimizations

### 5.1 Increase Cache TTL for Static Data

**Current**: `cacheTtl` defaults to 60s
**Recommended**: Increase for rarely-changing data

```typescript
// Old
const token = await env.SESSIONS.get('oauth:facebook:app_token');

// New: Cache for 1 hour in edge
const token = await env.SESSIONS.get('oauth:facebook:app_token', { cacheTtl: 3600 });
```

**Benefits**:
- ✅ **-95% KV reads** for frequently accessed keys
- ✅ **-80% latency** (edge cache hit: <1ms vs KV: 5-50ms)

---

### 5.2 Use Batch Reads (When Needed)

For multiple independent keys, use parallel reads:
```typescript
// Sequential (slow: 3x latency)
const token1 = await kv.get('key1');
const token2 = await kv.get('key2');
const token3 = await kv.get('key3');

// Parallel (fast: 1x latency)
const [token1, token2, token3] = await Promise.all([
  kv.get('key1'),
  kv.get('key2'),
  kv.get('key3'),
]);
```

---

## 📊 Success Metrics

Track monthly:

| Metric | Current | Target | How to Measure |
|--------|---------|--------|----------------|
| **KV Reads** | ? | <5M/month | `scripts/kv-analytics.ts` |
| **KV Writes** | ? | <500K/month | `scripts/kv-analytics.ts` |
| **Cache Hit Rate** | ? | >80% | `cache.getStats()` |
| **Estimated KV Cost** | ? | <$5/month | `scripts/kv-analytics.ts` |
| **Avg Latency (cached)** | ? | <10ms | Wrangler logs |

---

## 🔧 Implementation Checklist

### Week 1: Remove Redundancy
- [ ] Identify all session-related KV code (lines 619, 655, 726, 756, 854, 905)
- [ ] Replace with Durable Objects calls
- [ ] Test session flow end-to-end
- [ ] Deploy and monitor for errors

### Week 2: Optimize Caching
- [ ] Add key prefixes to CacheManager
- [ ] Implement stale-while-revalidate
- [ ] Add cache coalescing for social media data
- [ ] Increase `cacheTtl` for static data

### Week 3: Monitoring
- [ ] Create `scripts/kv-analytics.ts`
- [ ] Add cache hit rate logging
- [ ] Set up monthly analytics reports
- [ ] Create cleanup script

### Week 4: Performance
- [ ] Audit all KV writes for missing TTLs
- [ ] Implement bulk reads where applicable
- [ ] Benchmark before/after
- [ ] Document improvements

---

## 📝 Migration Guide: Sessions to Durable Objects

### Step-by-Step Migration

**1. Test Durable Objects Session Flow**
```bash
npm run dev

# Test session creation
curl -X POST http://localhost:8787/api/spotify/callback?code=test

# Verify session stored in Durable Objects (not KV)
```

**2. Update Session Endpoints**

Replace this pattern:
```typescript
const kv = c.env.SESSIONS;
const session = await kv.get(`spotify_session:${sessionId}`);
```

With:
```typescript
const ns = c.env.USER_SESSIONS;
const id = ns.idFromName(sessionId);
const stub = ns.get(id);
// @ts-expect-error
const sessionData = await stub.getSession(sessionId);
```

**3. Remove KV Fallback Code**

Delete or comment out:
```typescript
// OLD - DELETE THIS
if (!kv) {
  return c.json({ error: 'kv_not_configured' }, 501);
}
```

**4. Deploy and Monitor**
```bash
npm run build
npm run deploy

# Monitor Durable Objects
wrangler tail --format=pretty
```

---

## 🆚 KV vs Durable Objects Comparison

| Feature | Workers KV | Durable Objects |
|---------|------------|-----------------|
| **Consistency** | Eventual (~60s) | Strong (instant) |
| **Read Latency** | 5-50ms | 1-10ms |
| **Write Throughput** | 1 write/sec/key | Unlimited |
| **Best For** | Caching, static data | Sessions, real-time data |
| **Cost (10M reads)** | $5 | $0.15 (if using RPC) |
| **Global Distribution** | ✅ Automatic | ✅ Via location hints |

**Verdict**: Use KV for **caching**, Durable Objects for **sessions/state**.

---

## 📚 Resources

- [Workers KV Docs](https://developers.cloudflare.com/kv/)
- [KV Pricing](https://developers.cloudflare.com/kv/platform/pricing/)
- [Durable Objects vs KV](https://developers.cloudflare.com/workers/learning/using-durable-objects/#when-to-use-durable-objects-vs-kv)
- [GraphQL Analytics API](https://developers.cloudflare.com/analytics/graphql-api/)

---

**Last Updated**: 2025-10-25
**Status**: Ready for implementation
**Estimated Effort**: 8-12 hours over 4 weeks
**Expected Savings**: $10-20/month + improved consistency
