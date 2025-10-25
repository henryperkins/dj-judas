// RPC Type Declarations for Durable Objects
// This file provides TypeScript type inference for RPC methods on Durable Object stubs

/**
 * SessionData structure stored in UserSession
 */
export interface SessionData {
  sessionId: string;
  data: Record<string, unknown>;
  createdAt: number;
  expiresAt: number;
  lastAccessed: number;
}

/**
 * RateLimiter RPC methods
 * Distributed rate limiting using SQLite storage (sharded per-IP)
 */
export interface RateLimiterRpc {
  /**
   * Check if a request is allowed under the rate limit
   * @param ip - IP address to check
   * @param limit - Maximum requests allowed (default: 10)
   * @param windowSeconds - Time window in seconds (default: 60)
   * @returns Whether request is allowed, remaining quota, and reset time
   */
  checkLimit(ip: string, limit?: number, windowSeconds?: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetAt: number;
  }>;

  /**
   * Reset rate limit for an IP address
   * @param ip - IP address to reset
   */
  resetLimit(ip: string): Promise<{ reset: boolean }>;

  /**
   * Get current rate limit status for an IP
   * @param ip - IP address to check
   * @param windowSeconds - Time window in seconds (default: 60)
   */
  getStatus(ip: string, windowSeconds?: number): Promise<{
    count: number;
    oldestRequest: number | null;
  }>;
}

/**
 * UserSession RPC methods
 * Secure session management with WebSocket Hibernation support
 */
export interface UserSessionRpc {
  /**
   * Get session data
   * @param sessionId - Session identifier
   * @returns Session data or null if not found/expired
   */
  getSession(sessionId: string): Promise<SessionData | null>;

  /**
   * Store or update session data
   * @param sessionId - Session identifier
   * @param data - Session data to store
   * @param ttlSeconds - Time-to-live in seconds (default: 3600)
   */
  setSession(
    sessionId: string,
    data: Record<string, unknown>,
    ttlSeconds?: number
  ): Promise<{ success: boolean }>;

  /**
   * Delete a session
   * @param sessionId - Session identifier
   */
  deleteSession(sessionId: string): Promise<{ deleted: boolean }>;

  /**
   * Get count of active sessions
   */
  getSessionCount(): Promise<{ count: number }>;
}

/**
 * Note on TypeScript RPC Type Inference:
 *
 * Due to a TypeScript limitation, DurableObjectStub is defined as a type alias
 * (not an interface) in worker-configuration.d.ts, which prevents declaration merging.
 *
 * Solution: We use @ts-expect-error comments at RPC call sites since the methods
 * are available at runtime. The interfaces above serve as documentation and can be
 * used for manual type assertions if needed.
 *
 * Example usage with type assertion:
 *   const stub = ns.get(id) as unknown as UserSessionRpc;
 *   await stub.getSession(sessionId); // Fully typed
 */
