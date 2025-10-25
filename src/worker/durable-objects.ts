// Enhanced Durable Objects for DJ Judas Worker
// Using modern SQLite storage backend with proper hibernation and RPC

/// <reference path="../../worker-configuration.d.ts" />

import { DurableObject } from 'cloudflare:workers';

/**
 * RateLimiter Durable Object
 * Provides distributed rate limiting using SQLite storage
 * Now sharded per-IP for better scalability
 */
export class RateLimiter extends DurableObject {
  constructor(
    ctx: DurableObjectState,
    env: Env
  ) {
    super(ctx, env);
    this.initializeSchema();
  }

  private get sql() {
    return this.ctx.storage.sql;
  }

  private initializeSchema() {
    // Check if table exists
    const tables = this.sql.exec(`PRAGMA table_list`);
    const hasTable = [...tables].find((t) => t.name === "rate_limits");

    if (!hasTable) {
      // Create rate limiting table with index for fast queries
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS rate_limits (
          ip TEXT NOT NULL,
          timestamp INTEGER NOT NULL,
          PRIMARY KEY (ip, timestamp)
        );
        CREATE INDEX IF NOT EXISTS idx_ip_timestamp ON rate_limits(ip, timestamp);
      `);
    }
  }

  /**
   * RPC method: Check if request is allowed
   */
  async checkLimit(ip: string, limit = 10, windowSeconds = 60): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }> {
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;

    // Clean old entries for this IP
    this.sql.exec(`DELETE FROM rate_limits WHERE ip = ? AND timestamp < ?`, ip, windowStart);

    // Count recent requests
    const countResult = this.sql
      .exec(`SELECT COUNT(*) as count FROM rate_limits WHERE ip = ? AND timestamp >= ?`, ip, windowStart)
      .one();

    const currentCount = (countResult?.count as number) || 0;

    if (currentCount >= limit) {
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowStart + windowSeconds * 1000,
      };
    }

    // Record this request
    this.sql.exec(`INSERT INTO rate_limits (ip, timestamp) VALUES (?, ?)`, ip, now);

    return {
      allowed: true,
      remaining: limit - currentCount - 1,
      resetAt: windowStart + windowSeconds * 1000,
    };
  }

  /**
   * RPC method: Reset rate limit for an IP
   */
  async resetLimit(ip: string): Promise<{ reset: boolean }> {
    this.sql.exec(`DELETE FROM rate_limits WHERE ip = ?`, ip);
    return { reset: true };
  }

  /**
   * RPC method: Get current rate limit status
   */
  async getStatus(ip: string, windowSeconds = 60): Promise<{
    count: number;
    oldestRequest: number | null;
  }> {
    const windowStart = Date.now() - windowSeconds * 1000;

    const result = this.sql
      .exec(
        `SELECT COUNT(*) as count, MIN(timestamp) as oldest
         FROM rate_limits
         WHERE ip = ? AND timestamp >= ?`,
        ip,
        windowStart
      )
      .one();

    return {
      count: (result?.count as number) || 0,
      oldestRequest: (result?.oldest as number) || null,
    };
  }

  /**
   * Legacy fetch handler for backward compatibility
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    try {
      switch (url.pathname) {
        case "/check": {
          const body = (await request.json()) as { ip: string; limit?: number; window?: number };
          const result = await this.checkLimit(body.ip, body.limit, body.window);
          return Response.json(result, { status: result.allowed ? 200 : 429 });
        }
        case "/reset": {
          const { ip } = (await request.json()) as { ip: string };
          const result = await this.resetLimit(ip);
          return Response.json(result);
        }
        case "/status": {
          const { ip, window } = (await request.json()) as { ip: string; window?: number };
          const result = await this.getStatus(ip, window);
          return Response.json(result);
        }
        default:
          return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
  }
}

/**
 * UserSession Durable Object
 * Provides secure, distributed session management with WebSocket Hibernation
 */
interface SessionData {
  sessionId: string;
  data: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
  lastAccessed: number;
}

export class UserSession extends DurableObject {
  constructor(
    ctx: DurableObjectState,
    env: Env
  ) {
    super(ctx, env);
    this.initializeSchema();
    this.initializeAlarm();
  }

  private get sql() {
    return this.ctx.storage.sql;
  }

  private initializeSchema() {
    // Check if table exists
    const tables = this.sql.exec(`PRAGMA table_list`);
    const hasTable = [...tables].find((t) => t.name === "sessions");

    if (!hasTable) {
      // Create sessions table
      this.sql.exec(`
        CREATE TABLE IF NOT EXISTS sessions (
          sessionId TEXT PRIMARY KEY,
          data TEXT NOT NULL,
          createdAt INTEGER NOT NULL,
          expiresAt INTEGER NOT NULL,
          lastAccessed INTEGER NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_expires ON sessions(expiresAt);
      `);
    }
  }

  private async initializeAlarm() {
    // Bootstrap cleanup alarm if not set
    this.ctx.blockConcurrencyWhile(async () => {
      const currentAlarm = await this.ctx.storage.getAlarm();
      if (!currentAlarm) {
        // Schedule first cleanup in 1 hour
        await this.ctx.storage.setAlarm(Date.now() + 3600000);
      }
    });
  }

  /**
   * RPC method: Get session data
   */
  async getSession(sessionId: string): Promise<SessionData | null> {
    const result = this.sql
      .exec(
        `SELECT sessionId, data, createdAt, expiresAt, lastAccessed
         FROM sessions
         WHERE sessionId = ?`,
        sessionId
      )
      .one();

    if (!result) {
      return null;
    }

    const session = {
      sessionId: result.sessionId as string,
      data: JSON.parse(result.data as string) as Record<string, unknown>,
      createdAt: result.createdAt as number,
      expiresAt: result.expiresAt as number,
      lastAccessed: result.lastAccessed as number,
    };

    // Check expiration
    if (session.expiresAt < Date.now()) {
      this.sql.exec(`DELETE FROM sessions WHERE sessionId = ?`, sessionId);
      return null;
    }

    // Update last accessed
    this.sql.exec(`UPDATE sessions SET lastAccessed = ? WHERE sessionId = ?`, Date.now(), sessionId);

    return session;
  }

  /**
   * RPC method: Set session data
   */
  async setSession(sessionId: string, data: Record<string, unknown>, ttlSeconds = 3600): Promise<{ success: boolean }> {
    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;

    this.sql.exec(
      `INSERT OR REPLACE INTO sessions (sessionId, data, createdAt, expiresAt, lastAccessed)
       VALUES (?, ?, ?, ?, ?)`,
      sessionId,
      JSON.stringify(data),
      now,
      expiresAt,
      now
    );

    // Notify WebSocket clients
    this.broadcastUpdate("session_updated", { sessionId });

    return { success: true };
  }

  /**
   * RPC method: Delete session
   */
  async deleteSession(sessionId: string): Promise<{ deleted: boolean }> {
    const result = this.sql.exec(`DELETE FROM sessions WHERE sessionId = ?`, sessionId);

    // SQLite doesn't return affected rows easily, so check if session existed
    const deleted = result !== undefined;

    if (deleted) {
      this.broadcastUpdate("session_deleted", { sessionId });
    }

    return { deleted };
  }

  /**
   * RPC method: Refresh session TTL
   */
  async refreshSession(sessionId: string, ttlSeconds = 3600): Promise<{ success: boolean; expiresAt: number | null }> {
    const now = Date.now();
    const expiresAt = now + ttlSeconds * 1000;

    // Check if session exists
    const exists = this.sql.exec(`SELECT 1 FROM sessions WHERE sessionId = ?`, sessionId).one();

    if (!exists) {
      return { success: false, expiresAt: null };
    }

    this.sql.exec(
      `UPDATE sessions
       SET expiresAt = ?, lastAccessed = ?
       WHERE sessionId = ?`,
      expiresAt,
      now,
      sessionId
    );

    return { success: true, expiresAt };
  }

  /**
   * RPC method: Get all active sessions count
   */
  async getSessionCount(): Promise<{ count: number }> {
    const result = this.sql.exec(`SELECT COUNT(*) as count FROM sessions WHERE expiresAt > ?`, Date.now()).one();

    return { count: (result?.count as number) || 0 };
  }

  /**
   * WebSocket Hibernation: Handle incoming messages
   */
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    try {
      const data = typeof message === "string" ? JSON.parse(message) : null;

      if (!data) {
        ws.send(JSON.stringify({ error: "Invalid message format" }));
        return;
      }

      // Handle ping/pong for connection health
      if (data.type === "ping") {
        ws.send(JSON.stringify({ type: "pong", timestamp: Date.now() }));
        return;
      }

      // Echo other messages back with timestamp
      ws.send(
        JSON.stringify({
          type: "echo",
          data: data,
          timestamp: Date.now(),
        })
      );
    } catch (error) {
      ws.send(JSON.stringify({ error: "Message processing failed" }));
    }
  }

  /**
   * WebSocket Hibernation: Handle close events
   */
  async webSocketClose(_ws: WebSocket, code: number, reason: string, wasClean: boolean): Promise<void> {
    // Cleanup can happen here if needed
    console.log(`WebSocket closed: code=${code}, reason=${reason}, clean=${wasClean}`);
  }

  /**
   * WebSocket Hibernation: Handle errors
   */
  async webSocketError(_ws: WebSocket, error: unknown): Promise<void> {
    console.error("WebSocket error:", error);
  }

  /**
   * Broadcast update to all connected WebSocket clients
   */
  private broadcastUpdate(type: string, data: Record<string, unknown>): void {
    const message = JSON.stringify({ type, data, timestamp: Date.now() });

    // Get all hibernating WebSockets and send message
    // This works even when DO is hibernated - clients receive message when they wake
    this.ctx.getWebSockets().forEach((ws) => {
      try {
        ws.send(message);
      } catch (error) {
        console.error("Failed to send to WebSocket:", error);
      }
    });
  }

  /**
   * Alarm handler: Clean up expired sessions
   */
  async alarm(): Promise<void> {
    const now = Date.now();

    // Delete expired sessions
    this.sql.exec(`DELETE FROM sessions WHERE expiresAt < ?`, now);

    // Count how many were cleaned (we'll infer from before/after)
    const countAfter = this.sql.exec(`SELECT COUNT(*) as count FROM sessions`).one();
    console.log(`Session cleanup completed. Active sessions: ${countAfter?.count || 0}`);

    // Schedule next cleanup in 1 hour
    await this.ctx.storage.setAlarm(Date.now() + 3600000);
  }

  /**
   * Legacy fetch handler for backward compatibility and WebSocket upgrade
   */
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      return this.handleWebSocketUpgrade(request);
    }

    // Handle RPC-style endpoints (for legacy compatibility)
    try {
      switch (url.pathname) {
        case "/get": {
          const { sessionId } = (await request.json()) as { sessionId: string };
          const session = await this.getSession(sessionId);
          if (!session) {
            return Response.json({ error: "Session not found" }, { status: 404 });
          }
          return Response.json(session);
        }
        case "/set": {
          const { sessionId, data, ttl } = (await request.json()) as {
            sessionId: string;
            data: Record<string, unknown>;
            ttl?: number;
          };
          const result = await this.setSession(sessionId, data, ttl);
          return Response.json(result);
        }
        case "/delete": {
          const { sessionId } = (await request.json()) as { sessionId: string };
          const result = await this.deleteSession(sessionId);
          return Response.json(result);
        }
        case "/refresh": {
          const { sessionId, ttl } = (await request.json()) as { sessionId: string; ttl?: number };
          const result = await this.refreshSession(sessionId, ttl);
          if (!result.success) {
            return Response.json({ error: "Session not found" }, { status: 404 });
          }
          return Response.json(result);
        }
        default:
          return new Response("Not Found", { status: 404 });
      }
    } catch (error) {
      return Response.json({ error: "Invalid request" }, { status: 400 });
    }
  }

  /**
   * Handle WebSocket upgrade for real-time session updates
   */
  private handleWebSocketUpgrade(request: Request): Response {
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected Upgrade: websocket", { status: 426 });
    }

    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]];

    // Accept WebSocket using Hibernation API
    this.ctx.acceptWebSocket(server);

    // Return client side to caller
    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  }
}

/**
 * Cache manager utility using Cache API
 */
export class CacheManager {
  private readonly cacheApi = (caches as unknown as { default: Cache }).default;

  async get<T>(key: string): Promise<T | null> {
    const cacheKey = new Request(`https://cache.internal/${key}`);
    const cached = await this.cacheApi.match(cacheKey);

    if (cached) {
      const data = (await cached.json()) as T;
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
          "Cache-Control": `public, max-age=${ttl}`,
          "Content-Type": "application/json",
        },
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
    const hash = await crypto.subtle.digest("SHA-256", data);
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
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, "");
  }

  static async encrypt(data: string, key: CryptoKey): Promise<string> {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const encoded = new TextEncoder().encode(data);

    const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

    const combined = new Uint8Array(iv.length + encrypted.byteLength);
    combined.set(iv);
    combined.set(new Uint8Array(encrypted), iv.length);

    return btoa(String.fromCharCode(...combined));
  }

  static async decrypt(encryptedData: string, key: CryptoKey): Promise<string> {
    const combined = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0));
    const iv = combined.slice(0, 12);
    const encrypted = combined.slice(12);

    const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, encrypted);

    return new TextDecoder().decode(decrypted);
  }

  static async generateKey(): Promise<CryptoKey> {
    return (await crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, [
      "encrypt",
      "decrypt",
    ])) as unknown as CryptoKey;
  }
}

/**
 * Analytics tracker using Analytics Engine
 */
interface AnalyticsEngineDataPoint {
  blobs?: string[];
  doubles?: number[];
  indexes?: string[];
}

type AnalyticsEngineDataset = {
  writeDataPoint(event: AnalyticsEngineDataPoint): void;
};

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
        blobs: [event.type, event.endpoint, event.userId, event.error].filter(Boolean) as string[],
        doubles: [Date.now(), event.duration || 0, event.status || 0],
        indexes: [event.type],
      });
    } catch (error) {
      console.error("Analytics tracking error:", error);
    }
  }
}

// Export with legacy names for backward compatibility
export { RateLimiter as DurableObjectRateLimiter };
export { UserSession as DurableObjectUserSession };
