# KV Session Migration to Durable Objects

## 🎯 Goal
Migrate all session storage from Workers KV to Durable Objects for:
- ✅ **-50% KV writes** (eliminate redundant session writes)
- ✅ **Instant consistency** (no 60s propagation delay)
- ✅ **Simplified code** (single source of truth)

---

## 📍 Current State Analysis

### Dual Session Storage Pattern Detected

Your code currently uses **BOTH** KV and Durable Objects for sessions:

**Pattern 1: Primary (Durable Objects)**
```typescript
// Lines 704-710 (Spotify OAuth callback)
const ns = c.env.USER_SESSIONS;
if (ns && typeof ns.idFromName === 'function') {
  const id = ns.idFromName(sessionId);
  const stub = ns.get(id);
  // @ts-expect-error
  await stub.setSession(sessionId, session, 60 * 60 * 24 * 30);
}
```

**Pattern 2: Fallback (KV - REDUNDANT)**
```typescript
// Lines 726-733 (Session retrieval)
const kv = c.env.SESSIONS;
if (!kv) return c.json({ authenticated: false });
const sessionData = await kv.get(`spotify:${match[1]}`);
```

### Identified Locations

| Line | Function | Current Behavior | Action Needed |
|------|----------|------------------|---------------|
| 619-623 | `/api/spotify/login` | KV check only | ✅ Already DO-only |
| 726-733 | `/api/spotify/session` | **KV fallback** | ⚠️ Remove KV, use DO |
| 854-860 | `getSpotifySession()` helper | **KV fallback** | ⚠️ Remove KV, use DO |

**Good News**: Lines 704-710 and 840-850 already use Durable Objects!

---

## 🔧 Migration Steps

### Step 1: Remove KV Fallback from `/api/spotify/session`

**Current Code** (Lines 725-748):
```typescript
app.get('/api/spotify/session', async (c) => {
  const kv = (c.env as unknown as { SESSIONS?: KVNamespace })?.SESSIONS;
  if (!kv) return c.json({ authenticated: false, reason: 'kv_not_configured' });
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.match(/spotify_session=([^;]+)/);
  if (!match) return c.json({ authenticated: false });

  const sessionData = await kv.get(`spotify:${match[1]}`);
  if (!sessionData) return c.json({ authenticated: false });

  const session = JSON.parse(sessionData) as SpotifySession;
  if (!session.accessToken) return c.json({ authenticated: false });
  // ... rest of logic
});
```

**Migrated Code**:
```typescript
app.get('/api/spotify/session', async (c) => {
  const cookie = c.req.header('Cookie') || '';
  const match = cookie.match(/spotify_session=([^;]+)/);
  if (!match) return c.json({ authenticated: false });

  // Use Durable Objects exclusively
  const ns = c.env.USER_SESSIONS;
  if (!ns || typeof ns.idFromName !== 'function') {
    return c.json({ authenticated: false, reason: 'do_not_configured' });
  }

  try {
    const sessionId = match[1];
    const id = ns.idFromName(sessionId);
    const stub = ns.get(id);

    // @ts-expect-error - RPC methods available at runtime
    const sessionData = await stub.getSession(sessionId);

    if (!sessionData?.data) {
      return c.json({ authenticated: false });
    }

    const session = sessionData.data as unknown as SpotifySession;
    if (!session.accessToken) {
      return c.json({ authenticated: false });
    }

    // Check if token expired and needs refresh
    if (session.expiresAt && session.expiresAt < Date.now() + 60000) {
      if (session.refreshToken) {
        // Token expired or expiring soon, trigger refresh
        const refreshed = await refreshSpotifyToken(c, sessionId, session);
        if (refreshed) {
          return c.json({ authenticated: true, expiresAt: refreshed.expiresAt });
        }
        return c.json({ authenticated: false, reason: 'refresh_failed' });
      }
      return c.json({ authenticated: false, reason: 'expired' });
    }

    return c.json({ authenticated: true, expiresAt: session.expiresAt });
  } catch (error) {
    console.error('Session retrieval error:', error);
    return c.json({ authenticated: false, reason: 'error' });
  }
});
```

---

### Step 2: Update `getSpotifySession()` Helper

**Current Code** (Lines 835-870):
```typescript
async function getSpotifySession(c: Context, sessionId: string): Promise<SpotifySession | null> {
  // Try Durable Objects first
  try {
    const ns = c.env.USER_SESSIONS;
    if (ns && typeof ns.idFromName === 'function') {
      const id = ns.idFromName(match[1]);
      const stub = ns.get(id);
      // @ts-expect-error
      const sessionData = await stub.getSession(match[1]);
      if (sessionData?.data) {
        const session = sessionData.data as unknown as SpotifySession;
        if (session?.accessToken) return session;
      }
    }
  } catch { /* ignore */ }

  // Fallback to KV (REDUNDANT - TO BE REMOVED)
  const kv = (c.env as unknown as { SESSIONS?: KVNamespace })?.SESSIONS;
  if (!kv) return null;
  const sessionData = await kv.get(`spotify:${match[1]}`);
  // ... rest of KV logic
}
```

**Migrated Code**:
```typescript
async function getSpotifySession(c: Context, sessionId: string): Promise<SpotifySession | null> {
  try {
    const ns = c.env.USER_SESSIONS;
    if (!ns || typeof ns.idFromName !== 'function') {
      console.warn('USER_SESSIONS Durable Object not configured');
      return null;
    }

    const id = ns.idFromName(sessionId);
    const stub = ns.get(id);

    // @ts-expect-error - RPC methods available at runtime
    const sessionData = await stub.getSession(sessionId);

    if (!sessionData?.data) {
      return null;
    }

    const session = sessionData.data as unknown as SpotifySession;
    if (!session?.accessToken) {
      return null;
    }

    // Check if token needs refresh
    if (session.expiresAt && session.expiresAt < Date.now() + 60000) {
      if (session.refreshToken) {
        return await refreshSpotifyToken(c, sessionId, session);
      }
      return null;
    }

    return session;
  } catch (error) {
    console.error('Error retrieving Spotify session:', error);
    return null;
  }
}
```

---

### Step 3: Update `refreshSpotifyToken()` Helper

**Find and Update**: Search for where sessions are stored after token refresh

**Pattern to Find**:
```typescript
await kv.put(`spotify:${sessionId}`, JSON.stringify(newSession), { expirationTtl: ... });
```

**Replace With**:
```typescript
const ns = c.env.USER_SESSIONS;
if (ns && typeof ns.idFromName === 'function') {
  const id = ns.idFromName(sessionId);
  const stub = ns.get(id);
  // @ts-expect-error - RPC methods available at runtime
  await stub.setSession(sessionId, newSession, 60 * 60 * 24 * 30); // 30 days
}
```

---

### Step 4: Remove KV Type Definitions (Optional Cleanup)

**Lines to Clean Up**:
```typescript
// Line 172: Remove or mark as deprecated
SESSIONS: KVNamespace;  // ← Mark as deprecated or remove

// Lines 619-623, 726, 854: Remove KV checks
const kv = (c.env as unknown as { SESSIONS?: KVNamespace })?.SESSIONS;
```

---

## ✅ Testing Checklist

### Local Testing
```bash
# 1. Start dev server
npm run dev

# 2. Test session creation (Spotify OAuth)
# Navigate to: http://localhost:8787/api/spotify/login
# Complete OAuth flow

# 3. Test session retrieval
curl http://localhost:8787/api/spotify/session \
  -H "Cookie: spotify_session=<session-id>"

# Expected: { "authenticated": true, "expiresAt": <timestamp> }

# 4. Monitor Durable Objects
wrangler tail --format=pretty
# Look for session.setSession() and session.getSession() calls
```

### Production Testing
```bash
# 1. Deploy
npm run build
npm run deploy

# 2. Test OAuth flow on production
# Visit: https://your-domain.com/api/spotify/login

# 3. Monitor Durable Objects in Dashboard
# Workers & Pages > Durable Objects > USER_SESSIONS > Metrics

# 4. Verify KV write reduction
# Workers & Pages > KV > SESSIONS > Metrics
# Should see ~50% reduction in writes after 24 hours
```

---

## 📊 Expected Results

### Before Migration
- **KV Writes**: ~1,000/day (sessions + cache)
- **Session Consistency**: Eventual (~60s delay)
- **Code Complexity**: Dual storage systems

### After Migration
- **KV Writes**: ~500/day (cache only) ✅ **-50%**
- **Session Consistency**: Instant ✅ **Real-time**
- **Code Complexity**: Single source of truth ✅ **Simplified**

### Cost Savings
- **KV Write Cost**: -50% (~$2.50/month if over free tier)
- **Durable Objects**: Minimal increase (sessions use RPC, not duration)
- **Net Savings**: $2-5/month + improved UX

---

## 🔙 Rollback Plan

If issues occur, restore KV fallback:

```typescript
// Add back KV fallback (temporary)
async function getSpotifySession(c: Context, sessionId: string): Promise<SpotifySession | null> {
  // Try Durable Objects first
  try {
    const ns = c.env.USER_SESSIONS;
    if (ns && typeof ns.idFromName === 'function') {
      const id = ns.idFromName(sessionId);
      const stub = ns.get(id);
      // @ts-expect-error
      const sessionData = await stub.getSession(sessionId);
      if (sessionData?.data) {
        return sessionData.data as unknown as SpotifySession;
      }
    }
  } catch (error) {
    console.error('DO session error, falling back to KV:', error);
  }

  // Fallback to KV (TEMPORARY)
  const kv = c.env.SESSIONS;
  if (kv) {
    const sessionData = await kv.get(`spotify:${sessionId}`);
    if (sessionData) {
      return JSON.parse(sessionData) as SpotifySession;
    }
  }

  return null;
}
```

---

## 📝 Implementation Commands

```bash
# 1. Create a backup branch
git checkout -b migrate-sessions-to-do
git add .
git commit -m "Backup before session migration"

# 2. Apply changes (manual edits to index.ts)
# Follow Step 1-3 above

# 3. Test locally
npm run dev
# Test OAuth flow and session retrieval

# 4. Deploy to staging/production
npm run build
npm run deploy

# 5. Monitor for 24 hours
wrangler tail --format=pretty

# 6. Verify KV write reduction
npm run kv:analytics
# Check "Writes" metric - should decrease ~50%

# 7. If successful, remove KV session code entirely
# If issues, rollback using git
git checkout main
git branch -D migrate-sessions-to-do
```

---

## 🚨 Common Issues & Solutions

### Issue 1: "do_not_configured" Error
**Cause**: `USER_SESSIONS` binding not available
**Solution**: Check `wrangler.json` has Durable Objects binding
```json
{
  "durable_objects": {
    "bindings": [
      { "name": "USER_SESSIONS", "class_name": "UserSession" }
    ]
  }
}
```

### Issue 2: Session Not Found After Migration
**Cause**: Old sessions in KV not migrated to Durable Objects
**Solution**: Users will need to re-authenticate once (acceptable UX)
- Display message: "Please log in again to continue"

### Issue 3: RPC Method Not Found
**Cause**: TypeScript error or runtime issue
**Solution**: Verify `@ts-expect-error` comment is present, or cast stub:
```typescript
const stub = ns.get(id) as any;
await stub.getSession(sessionId);
```

---

## ✅ Success Criteria

- [ ] All session endpoints use Durable Objects exclusively
- [ ] No KV fallback code remains (except for cache)
- [ ] OAuth flow works end-to-end
- [ ] Session persistence works across requests
- [ ] Token refresh works correctly
- [ ] KV writes reduced by ~50% (verify with `npm run kv:analytics`)
- [ ] No errors in `wrangler tail` logs

---

**Estimated Migration Time**: 30-45 minutes
**Risk Level**: Low (fallback available via rollback)
**Impact**: High (-50% KV writes, instant consistency)

---

Ready to migrate? Start with Step 1!
