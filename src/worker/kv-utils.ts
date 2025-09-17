// Utility helpers for Cloudflare Workers KV interactions with retry & cache abstractions
// -----------------------------------------------------------------------------
// NOTE: Imported by src/worker/index.ts and other worker modules.
//
// Usage example:
//
//   import { kvGetWithRetry, getCachedOrFetch } from './kv-utils';
//
//   const value = await kvGetWithRetry(env.SESSIONS, 'my-key');
//   const data  = await getCachedOrFetch(env.SESSIONS, 'social_metrics', () => fetchRemote(), 900);
// -----------------------------------------------------------------------------

// Local minimal KV type to avoid relying on global types during build
interface KVNamespace {
  get (key: string): Promise<string | null>;
  put (key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete (key: string): Promise<void>;
}

/**
 * Retrieve a key from KV with exponential-backoff retry.
 *
 * @param kv         Cloudflare KV namespace binding
 * @param key        Key to fetch
 * @param maxRetries Maximum retry attempts (default 3)
 */
export async function kvGetWithRetry<T = string>(
  kv: KVNamespace,
  key: string,
  maxRetries = 3
): Promise<T | null> {
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      const resp = await kv.get(key);
      if (resp === null) return null;
      return JSON.parse(resp) as T;
    } catch (err) {
      if (++attempt >= maxRetries) throw err;
      // back-off (100ms, 200ms, 400ms …)
      await new Promise((r) => setTimeout(r, 100 * 2 ** (attempt - 1)));
    }
  }
}

/**
 * Store a value in KV with retries (best effort).
 */
export async function kvPutWithRetry(
  kv: KVNamespace,
  key: string,
  value: unknown,
  ttl = 900,
  maxRetries = 3
): Promise<void> {
  const body = typeof value === 'string' ? value : JSON.stringify(value);
  let attempt = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      await kv.put(key, body, { expirationTtl: ttl });
      return;
    } catch (err) {
      if (++attempt >= maxRetries) throw err;
      await new Promise((r) => setTimeout(r, 100 * 2 ** (attempt - 1)));
    }
  }
}

/**
 * Read-through cache helper: fetches from KV first, falls back to fetcher(),
 * then writes fresh value back to KV.
 *
 * @param kv       KV namespace
 * @param key      Cache key
 * @param fetcher  Callback producing fresh value
 * @param ttl      Time-to-live in seconds (default 900 = 15 min)
 */
export async function getCachedOrFetch<T>(
  kv: KVNamespace,
  key: string,
  fetcher: () => Promise<T>,
  ttl = 900
): Promise<T> {
  try {
    const cached = await kvGetWithRetry<T>(kv, key);
    if (cached !== null) return cached;
  } catch {
    /* ignore read errors */
  }

  const fresh = await fetcher();
  try {
    await kvPutWithRetry(kv, key, fresh, ttl);
  } catch {
    /* ignore write errors */
  }
  return fresh;
}

// -----------------------------------------------------------------------------
// Request coalescing: deduplicate in-flight calls by key
// -----------------------------------------------------------------------------
const inflight = new Map<string, Promise<any>>();

export function coalesceRequest<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  if (!inflight.has(key)) {
    const p = (async () => {
      try {
        return await fetcher();
      } finally {
        // Ensure cleanup even on rejection
        inflight.delete(key);
      }
    })();
    inflight.set(key, p);
  }
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  return inflight.get(key)! as Promise<T>;
}
