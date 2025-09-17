// Enhanced Durable Objects for DJ Judas Worker
// This file contains the Durable Object classes for rate limiting and session management

// Minimal local types to avoid requiring external type packages during build
type DurableObjectState = {
  storage: any;
  acceptWebSocket: (ws: any) => void;
  blockConcurrencyWhile: (fn: () => Promise<void>) => void;
};

interface DurableObject {
  fetch(request: Request): Promise<Response>;
}

// Declared globals in Workers runtime (use any for TS compile)
declare const WebSocketPair: any;
type AnalyticsEngineDataset = any;

/**
 * RateLimiter Durable Object
 * Provides distributed rate limiting across all worker instances
 */
export class RateLimiter implements DurableObject {
  private state: DurableObjectState;
  
  constructor(state: DurableObjectState, _env: any) {
    this.state = state;
  }
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/check':
        return this.checkLimit(request);
      case '/reset':
        return this.resetLimit(request);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }
  
  private async checkLimit(request: Request): Promise<Response> {
    const body = await request.json() as { ip: string; limit?: number; window?: number };
    const ip = body.ip;
    const limit = body.limit ?? 10;
    const window = body.window ?? 60;
    
    const now = Date.now();
    const windowStart = now - (window * 1000);
    
    // Clean old entries
    const requests = await this.state.storage.list({
      prefix: `req:${ip}:`,
      start: `req:${ip}:0`,
      end: `req:${ip}:${windowStart}`
    });
    
    if (requests.size > 0) {
      await this.state.storage.delete([...requests.keys()]);
    }
    
    // Count recent requests
    const recentRequests = await this.state.storage.list({
      prefix: `req:${ip}:`,
      start: `req:${ip}:${windowStart}`,
      end: `req:${ip}:${now}`
    });
    
    if (recentRequests.size >= limit) {
      return new Response(JSON.stringify({
        allowed: false,
        remaining: 0,
        resetAt: windowStart + (window * 1000)
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Record this request
    await this.state.storage.put(`req:${ip}:${now}`, now, {
      expirationTtl: window
    });
    
    return new Response(JSON.stringify({
      allowed: true,
      remaining: limit - recentRequests.size - 1,
      resetAt: windowStart + (window * 1000)
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  private async resetLimit(request: Request): Promise<Response> {
    const { ip } = await request.json() as { ip: string };
    
    const requests = await this.state.storage.list({
      prefix: `req:${ip}:`
    });
    
    if (requests.size > 0) {
      await this.state.storage.delete([...requests.keys()]);
    }
    
    return new Response(JSON.stringify({ reset: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

/**
 * UserSession Durable Object
 * Provides secure, distributed session management
 */
export class UserSession implements DurableObject {
  private state: DurableObjectState;
  private sessions: Map<string, any> = new Map();
  private websockets: Set<WebSocket> = new Set();
  
  constructor(state: DurableObjectState, _env: any) {
    this.state = state;
    
    // Restore sessions from storage
    this.state.blockConcurrencyWhile(async () => {
      const stored = await this.state.storage.get('sessions');
      if (stored) {
        this.sessions = new Map(stored as any);
      }
    });
  }
  
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    
    switch (url.pathname) {
      case '/get':
        return this.getSession(request);
      case '/set':
        return this.setSession(request);
      case '/delete':
        return this.deleteSession(request);
      case '/refresh':
        return this.refreshSession(request);
      case '/ws':
        return this.handleWebSocket(request);
      default:
        return new Response('Not Found', { status: 404 });
    }
  }
  
  private async getSession(request: Request): Promise<Response> {
    const { sessionId } = await request.json() as { sessionId: string };
    const session = this.sessions.get(sessionId);
    
    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    // Check expiration
    if (session.expiresAt && session.expiresAt < Date.now()) {
      this.sessions.delete(sessionId);
      await this.persistSessions();
      
      return new Response(JSON.stringify({ error: 'Session expired' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  private async setSession(request: Request): Promise<Response> {
    const { sessionId, data, ttl = 3600 } = await request.json() as { sessionId: string; data: any; ttl?: number };
    
    const session = {
      ...data,
      createdAt: Date.now(),
      expiresAt: Date.now() + (ttl * 1000),
      lastAccessed: Date.now()
    };
    
    this.sessions.set(sessionId, session);
    await this.persistSessions();
    
    // Notify WebSocket clients
    this.broadcastUpdate('session_updated', { sessionId });
    
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  private async deleteSession(request: Request): Promise<Response> {
    const { sessionId } = await request.json() as { sessionId: string };
    
    const deleted = this.sessions.delete(sessionId);
    if (deleted) {
      await this.persistSessions();
      this.broadcastUpdate('session_deleted', { sessionId });
    }
    
    return new Response(JSON.stringify({ deleted }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  private async refreshSession(request: Request): Promise<Response> {
    const { sessionId, ttl = 3600 } = await request.json() as { sessionId: string; ttl?: number };
    
    const session = this.sessions.get(sessionId);
    if (!session) {
      return new Response(JSON.stringify({ error: 'Session not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    session.expiresAt = Date.now() + (ttl * 1000);
    session.lastAccessed = Date.now();
    
    this.sessions.set(sessionId, session);
    await this.persistSessions();
    
    return new Response(JSON.stringify({ success: true, expiresAt: session.expiresAt }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  private handleWebSocket(request: Request): Response {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
      return new Response('Expected Upgrade: websocket', { status: 426 });
    }
    
    const pair = new WebSocketPair();
    const [client, server] = Object.values(pair) as any[];
    
    this.state.acceptWebSocket(server as any);
    this.websockets.add(server);
    
    (server as any).addEventListener('close', () => {
      this.websockets.delete(server);
    });
    
    (server as any).addEventListener('message', async (_event: any) => {
      try {
        // noop
      } catch (error) {
        (server as any).send(JSON.stringify({ error: 'Invalid message format' }));
      }
    });
    
    return new Response(null, { status: 101, webSocket: client } as any);
  }
  
  private broadcastUpdate(type: string, data: any): void {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });
    
    this.websockets.forEach(ws => {
      try {
        ws.send(message);
      } catch (error) {
        // Remove dead connections
        this.websockets.delete(ws);
      }
    });
  }
  
  private async persistSessions(): Promise<void> {
    await this.state.storage.put('sessions', Array.from(this.sessions.entries()));
  }
  
  // Clean up expired sessions periodically
  async alarm(): Promise<void> {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [sessionId, session] of this.sessions.entries()) {
      if (session.expiresAt && session.expiresAt < now) {
        this.sessions.delete(sessionId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      await this.persistSessions();
      console.log(`Cleaned ${cleaned} expired sessions`);
    }
    
    // Schedule next cleanup in 1 hour
    await this.state.storage.setAlarm(Date.now() + 3600000);
  }
}

/**
 * Cache manager utility using Cache API
 */
export class CacheManager {
  private readonly cacheApi = (caches as any).default as Cache;
  
  async get<T>(key: string): Promise<T | null> {
    const cacheKey = new Request(`https://cache.internal/${key}`);
    const cached = await this.cacheApi.match(cacheKey);
    
    if (cached) {
      const data = await cached.json() as T;
      return data;
    }
    
    return null;
  }
  
  async set<T>(key: string, value: T, ttl = 300): Promise<void> {
    const data = JSON.stringify(value);
    const cacheKey = new Request(`https://cache.internal/${key}`);
    
    await this.cacheApi.put(
      cacheKey,
      new Response(data, {
        headers: {
          'Cache-Control': `public, max-age=${ttl}`,
          'Content-Type': 'application/json'
        }
      })
    );
  }
  
  async delete(key: string): Promise<boolean> {
    const cacheKey = new Request(`https://cache.internal/${key}`);
    return await this.cacheApi.delete(cacheKey);
  }
}

/**
 * Security utilities
 */
export class SecurityUtils {
  static async hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  }
  
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    const computed = await this.hashPassword(password);
    return computed === hash;
  }
  
  static generateCSRFToken(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array))
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  
  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoded
    );
    
    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);
    
    return btoa(String.fromCharCode(...combined));
  }
  
  static async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);
    
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    
    return new TextDecoder().decode(decrypted);
  }
  
  static async generateKey(): Promise<CryptoKey> {
    return await crypto.subtle.generateKey(
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    ) as unknown as CryptoKey;
  }
}

/**
 * Analytics tracker using Analytics Engine
 */
export class AnalyticsTracker {
  constructor(private analyticsEngine: AnalyticsEngineDataset) {}
  
  track(event: {
    type: string;
    endpoint?: string;
    userId?: string;
    duration?: number;
    status?: number;
    error?: string;
  }): void {
    try {
      this.analyticsEngine.writeDataPoint({
        blobs: [event.type, event.endpoint, event.userId, event.error].filter(Boolean),
        doubles: [Date.now(), event.duration || 0, event.status || 0],
        indexes: [event.type]
      });
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }
}

// Export all Durable Objects
export { RateLimiter as DurableObjectRateLimiter };
export { UserSession as DurableObjectUserSession };
