// Edge-plus-KV multi-tier cache abstraction
// ----------------------------------------
// This utility stores responses in both the Cache API (edge) for near-instant
// hits on the same POP and in KV for global persistence. It also supports
// stale-while-revalidate behaviour.
//
// Usage:
//
//   const cache = new CacheManager(env.SESSIONS);
//   const key = '/api/metrics';
//   const cached = await cache.get<Response>(key);
//   if (cached) return cached;
//
//   const fresh = await fetchOrigin();
//   await cache.set(key, fresh, 900);
//   return fresh;
//

interface KVNamespace {
  get (key: string, opts?: { type?: 'text' }): Promise<string | null>;
  put (key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  delete (key: string): Promise<void>;
}

export class CacheManager {
  private readonly kv: KVNamespace | null;
  private readonly edgeCache: Cache;

  constructor (kv: KVNamespace | undefined | null, edgeCache?: Cache) {
    this.kv = kv ?? null;
    // `caches.default` is available at runtime; cast for TS
    this.edgeCache = (edgeCache ?? ((caches as unknown as { default: Cache }).default));
  }

  /**
   * Attempt to retrieve a cached Response or JSON value.
   *
   * If `asResponse` is true, returns a Response; otherwise parses JSON.
   */
  async get<T = unknown> (
    key: string,
    { asResponse = false }: { asResponse?: boolean } = {}
  ): Promise<T | Response | null> {
    // L1: Edge cache
    try {
      const edgeReq = new Request(`https://cache.edge${key}`);
      const edgeHit = await this.edgeCache.match(edgeReq);
      if (edgeHit) {
        return asResponse ? edgeHit.clone() : await edgeHit.clone().json();
      }
    } catch { /* ignore */ }

    // L2: KV
    if (this.kv) {
      try {
        const kvHit = await this.kv.get(key);
        if (kvHit !== null) {
          const resp = new Response(kvHit, {
            headers: { 'content-type': 'application/json', 'X-Cache': 'KV-HIT' }
          });
          // populate edge cache for future hits
          this.edgeCache.put(
            new Request(`https://cache.edge${key}`),
            resp.clone()
          ).catch(() => {});
          return asResponse ? resp : JSON.parse(kvHit) as T;
        }
      } catch { /* ignore */ }
    }

    return null;
  }

  /**
   * Store data in both edge cache and KV.
   *
   * @param ttl seconds to keep in cache (default 900)
   */
  async set (
    key: string,
    value: unknown,
    ttl = 900
  ): Promise<void> {
    const body = typeof value === 'string' ? value : JSON.stringify(value);

    const resp = new Response(body, {
      headers: {
        'content-type': 'application/json',
        'Cache-Control': `public, max-age=${ttl}, s-maxage=${ttl}`,
        'CDN-Cache-Control': `max-age=${ttl}`,
        'Cloudflare-CDN-Cache-Control': `max-age=${ttl}`,
        'X-Cache': 'MISS'
      }
    });

    // L1: Edge
    try {
      await this.edgeCache.put(
        new Request(`https://cache.edge${key}`),
        resp.clone()
      );
    } catch { /* ignore */ }

    // L2: KV
    if (this.kv) {
      try {
        await this.kv.put(key, body, { expirationTtl: ttl });
      } catch { /* ignore */ }
    }
  }

  /**
   * Delete cached entry.
   */
  async delete (key: string): Promise<void> {
    try {
      await this.edgeCache.delete(new Request(`https://cache.edge${key}`));
    } catch { /* ignore */ }
    if (this.kv) {
      try { await this.kv.delete(key); } catch { /* ignore */ }
    }
  }
}
