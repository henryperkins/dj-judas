import { Hono } from "hono";
import { socialMetricsApp } from './social-metrics';
import { CacheManager } from './cache-manager';
import { coalesceRequest } from './kv-utils';
import { BookingSchema } from './validation';

// KVNamespace type for Cloudflare Workers
interface KVNamespace {
  get(key: string, options?: { type?: "text" | "json" | "arrayBuffer" | "stream" }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface SpotifySession {
	codeVerifier?: string;
	accessToken?: string;
	refreshToken?: string;
	expiresAt?: number;
	userId?: string;
}

// Type definitions for social posts
interface SocialPost {
  id: string;
  platform: string;
  type: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  caption?: string;
  permalink: string;
  timestamp: string;
  likes?: number;
  comments?: number;
  shares?: number;
  hashtags?: string[];
  isShoppable?: boolean;
  products?: Array<{
    id: string;
    title: string;
    price: number;
    url: string;
  }>;
}

// Type definition for Facebook event
interface FacebookEvent {
  id: string;
  name: string;
  description?: string;
  start_time: string;
  end_time?: string;
  place?: {
    name: string;
    location?: unknown;
  };
  cover?: {
    source: string;
  };
  is_online?: boolean;
  ticket_uri?: string;
  interested_count?: number;
  attending_count?: number;
  is_canceled?: boolean;
}

// Durable Object namespace binding type
interface DurableObjectNamespace {
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  get(id: DurableObjectId): DurableObjectStub;
}

interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
}

interface DurableObjectStub {
  fetch(requestOrUrl: Request | string, init?: RequestInit): Promise<Response>;
}

// D1 Database binding type
interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch<T = unknown>(statements: D1PreparedStatement[]): Promise<D1Result<T>[]>;
  exec(query: string): Promise<D1ExecResult>;
  dump(): Promise<ArrayBuffer>;
}

interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  first<T = unknown>(colName?: string): Promise<T | null>;
  run<T = unknown>(): Promise<D1Result<T>>;
  all<T = unknown>(): Promise<D1Result<T>>;
  raw<T = unknown>(): Promise<T[]>;
}

interface D1Result<T = unknown> {
  results?: T[];
  success: boolean;
  meta?: Record<string, unknown>;
  error?: string;
}

interface D1ExecResult {
  count: number;
  duration: number;
}

// Analytics Engine binding type
interface AnalyticsEngineDataset {
  writeDataPoint(event: {
    indexes?: string[];
    doubles?: number[];
    blobs?: string[];
  }): void;
}

// R2 Bucket binding type
interface R2Bucket {
  get(key: string, options?: { range?: { offset: number; length?: number } }): Promise<R2Object | null>;
  head(key: string): Promise<R2Object | null>;
  put(key: string, value: ReadableStream | ArrayBuffer | string, options?: R2PutOptions): Promise<R2Object>;
  delete(keys: string | string[]): Promise<void>;
  list(options?: R2ListOptions): Promise<R2Objects>;
}

interface R2Object {
  key: string;
  body: ReadableStream;
  etag: string;
  size: number;
  uploaded: Date;
  httpMetadata?: {
    contentType?: string;
    contentLanguage?: string;
    contentDisposition?: string;
    contentEncoding?: string;
    cacheControl?: string;
    cacheExpiry?: Date;
  };
  customMetadata?: Record<string, string>;
}

interface R2PutOptions {
  httpMetadata?: R2Object['httpMetadata'];
  customMetadata?: Record<string, string>;
  onlyIf?: {
    etagMatches?: string;
    etagDoesNotMatch?: string;
    uploadedBefore?: Date;
    uploadedAfter?: Date;
  };
}

interface R2Objects {
  objects: R2Object[];
  truncated: boolean;
  cursor?: string;
}

interface R2ListOptions {
  limit?: number;
  prefix?: string;
  cursor?: string;
  delimiter?: string;
}

interface Env {
	SESSIONS: KVNamespace;
	SPOTIFY_CLIENT_ID: string;
	SPOTIFY_CLIENT_SECRET?: string;
	SPOTIFY_ARTIST_ID?: string;
	APPLE_TEAM_ID: string;
	APPLE_KEY_ID: string;
	APPLE_PRIVATE_KEY: string; // PKCS8 format without surrounding quotes
  IG_OEMBED_TOKEN?: string; // Facebook App access token for Instagram oEmbed
  IG_USER_ID?: string; // Instagram Business User ID for Graph API calls
  FB_PAGE_ID?: string; // Facebook Page ID for Graph API
  FB_PAGE_TOKEN?: string; // Facebook Page access token
  FB_APP_ID?: string; // For App Access Token (oEmbed Read)
  FB_APP_SECRET?: string; // For App Access Token (oEmbed Read)
  GRAPH_API_VERSION?: string; // e.g., 'v21.0'
  RESEND_API_KEY?: string;
  RESEND_FROM?: string; // e.g., 'Ministry <no-reply@yourdomain>'
  RESEND_TO?: string;   // destination inbox
  ADMIN_SHARED_SECRET?: string; // HMAC shared secret for admin signing
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM?: string;
  SENDGRID_TO?: string;
  STRIPE_SECRET?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SITE_URL?: string;
  MEDUSA_URL?: string; // Base URL to Medusa backend for admin proxy
  ALLOWED_ORIGINS?: string; // Comma-separated list of allowed CORS origins
  CF_IMAGES_ACCOUNT_ID?: string;
  CF_IMAGES_API_TOKEN?: string;
  CF_IMAGES_VARIANT?: string; // e.g., 'public'
  OPENAI_API_KEY?: string;
  APPLE_METRICS_ENDPOINT?: string;
  AI?: {
    run: (model: string, options: { prompt: string; image?: Uint8Array[] }) => Promise<{ output?: string; response?: string; text?: string }>;
  }; // Workers AI binding
  // Durable Object namespace bindings (optional; configured in wrangler.toml when enabled)
  RATE_LIMITER?: DurableObjectNamespace;
  USER_SESSIONS?: DurableObjectNamespace;
  DB?: D1Database;
  ANALYTICS?: AnalyticsEngineDataset;
  // R2 Buckets
  MEDIA_BUCKET?: R2Bucket;
  USER_ASSETS?: R2Bucket;
  R2_PUBLIC_BASE?: string; // e.g., https://r2.thevoicesofjudah.com
}
const app = new Hono<{ Bindings: Env }>();

// Mount social metrics routes
app.route('/', socialMetricsApp);

 // Analytics timing middleware (best-effort)
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  try {
    const ae = c.env.ANALYTICS;
    if (ae && typeof ae.writeDataPoint === 'function') {
      ae.writeDataPoint({
        indexes: [c.req.path, c.req.method],
        doubles: [Date.now() - start, c.res?.status || 0],
        blobs: [c.req.header('CF-Connecting-IP') || '', c.req.header('User-Agent') || '']
      });
    }
  } catch { /* ignore */ }
});

// Security headers and CORS
app.use('*', async (c, next) => {
  // Get allowed origins from env or use defaults
  const defaultOrigins = ['https://djlee.com', 'https://www.djlee.com', 'http://localhost:5173'];
  const allowedOrigins = c.env.ALLOWED_ORIGINS
    ? c.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    : defaultOrigins;

  // Preflight
  if (c.req.method === 'OPTIONS') {
    const origin = c.req.header('Origin') || '';
    if (origin && allowedOrigins.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin);
      c.header('Access-Control-Allow-Credentials', 'true');
    }
    c.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Admin-Signature, X-Timestamp');
    return c.body(null, 204);
  }

  await next();

  c.header('X-Frame-Options', 'DENY');
  c.header('X-Content-Type-Options', 'nosniff');
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  const origin = c.req.header('Origin') || '';
  if (origin && allowedOrigins.includes(origin)) {
    c.header('Access-Control-Allow-Origin', origin);
    c.header('Access-Control-Allow-Credentials', 'true');
  }
});

const ADMIN_SIGNED_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

app.use('/api/admin/*', async (c, next) => {
  const method = c.req.method.toUpperCase();
  if (!ADMIN_SIGNED_METHODS.has(method)) {
    await next();
    return;
  }

  const secret = c.env.ADMIN_SHARED_SECRET;
  if (!secret) {
    console.error('ADMIN_SHARED_SECRET not configured for admin route');
    return c.json({ error: 'admin_secret_missing', message: 'ADMIN_SHARED_SECRET is not configured' }, 500);
  }

  const signature = (c.req.header('X-Admin-Signature') || '').trim().toLowerCase();
  const timestampHeader = (c.req.header('X-Timestamp') || '').trim();
  if (!signature || !timestampHeader) {
    return c.json({ error: 'admin_signature_required', message: 'Missing X-Admin-Signature or X-Timestamp header' }, 401);
  }

  const timestamp = Number(timestampHeader);
  if (!Number.isFinite(timestamp)) {
    return c.json({ error: 'invalid_timestamp', message: 'X-Timestamp must be a UNIX epoch milliseconds value' }, 401);
  }

  if (Math.abs(Date.now() - timestamp) > 5 * 60 * 1000) {
    return c.json({ error: 'timestamp_out_of_range', message: 'Timestamp is older than 5 minutes' }, 401);
  }

  const rawRequest = c.req.raw;
  const bodyText = rawRequest.body ? await rawRequest.clone().text() : '';
  try {
    const expected = await signAdminPayload(secret, `${timestampHeader}.${bodyText}`);
    if (!timingSafeEqual(signature, expected)) {
      return c.json({ error: 'invalid_signature', message: 'Signature verification failed' }, 401);
    }
  } catch (error) {
    console.error('Failed to verify admin signature', error);
    return c.json({ error: 'signature_verification_failed' }, 500);
  }

  await next();
});

// Static assets served from R2 with edge caching
app.get('/static/*', async (c) => {
  const cache = (caches as unknown as { default: Cache }).default;
  const cacheKey = new Request(c.req.url);

  let response = await cache.match(cacheKey);

  if (!response) {
    const mediaBucket = c.env.MEDIA_BUCKET;
    const userAssets = c.env.USER_ASSETS;
    const bucket = mediaBucket || userAssets;

    if (bucket && typeof bucket.get === 'function') {
      const key = c.req.path.replace(/^\/static\/+/, '');
      const object = await bucket.get(key);

      if (object) {
        response = new Response(object.body, {
          headers: {
            'Content-Type': object.httpMetadata?.contentType || 'application/octet-stream',
            'Cache-Control': 'public, max-age=31536000, immutable',
            'ETag': object.etag || ''
          }
        });
        try {
          c.executionCtx?.waitUntil?.(cache.put(cacheKey, response.clone()));
        } catch {
          // ignore
        }
      }
    }
  }

  return response || c.text('Not Found', 404);
});

// ---- Facebook/Instagram helpers ----
const DEFAULT_GRAPH_VERSION = 'v22.0';
function graphBase(env: Env) {
  return `https://graph.facebook.com/${env.GRAPH_API_VERSION || DEFAULT_GRAPH_VERSION}`;
}

async function getAppAccessToken(env: Env): Promise<string | null> {
  const appId = env.FB_APP_ID;
  const appSecret = env.FB_APP_SECRET;
  if (!appId || !appSecret) return null;
  try {
    // Try KV cache first
    let cached: string | null = null;
    try { cached = await env.SESSIONS.get('fb_app_access_token'); } catch {
      // Ignore KV errors in local dev
    }
    if (cached) return cached;

    const u = new URL(`${graphBase(env)}/oauth/access_token`);
    u.searchParams.set('client_id', appId);
    u.searchParams.set('client_secret', appSecret);
    u.searchParams.set('grant_type', 'client_credentials');
    const res = await fetch(u.toString(), { headers: { 'accept': 'application/json' } });
    if (!res.ok) return null;
    const j = await res.json() as { access_token?: string };
    const token = j.access_token || null;
    if (token) {
      try { await env.SESSIONS.put('fb_app_access_token', token, { expirationTtl: 86400 }); } catch {
        // Ignore KV write errors
      }
    }
    return token;
  } catch {
    return null;
  }
}

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Real aggregated social metrics endpoint with caching
app.get('/api/metrics', async (c) => {
  const cache = new CacheManager(c.env.SESSIONS);
  const cacheKey = 'social_metrics:aggregate:v3';

  // L1/L2 cache
  const hit = await cache.get<Record<string, unknown>>(`/${cacheKey}`).catch(() => null);
  if (hit) {
    return c.json(hit, 200, {
      'Cache-Control': 'public, max-age=900',
      'X-Cache': 'HIT'
    });
  }

  const metrics = await coalesceRequest(cacheKey, async () => {
    const m = {
      totalReach: 0,
      platforms: [] as Array<{
        id: string;
        name: string;
        followers: number;
        engagement: number;
        lastUpdated: string;
        status?: 'ok' | 'missing_config' | 'error';
        statusMessage?: string;
      }>,
      topConversionSource: 'unknown'
    };

    const hasIgAuth = Boolean(c.env.IG_OEMBED_TOKEN || (c.env.FB_APP_ID && c.env.FB_APP_SECRET));
    if (hasIgAuth) {
      const igUserId = c.env.IG_USER_ID;
      if (!igUserId) {
        m.platforms.push({
          id: 'instagram',
          name: 'Instagram',
          followers: 0,
          engagement: 0,
          lastUpdated: new Date().toISOString(),
          status: 'missing_config',
          statusMessage: 'IG_USER_ID is not configured'
        });
      } else {
        try {
          const url = new URL(`${graphBase(c.env)}/${igUserId}`);
          url.searchParams.set('fields', 'followers_count,media_count,name');
          const bearer = (await getAppAccessToken(c.env)) || c.env.IG_OEMBED_TOKEN as string | undefined;
          const requestInit: RequestInit | undefined = bearer ? { headers: { Authorization: `Bearer ${bearer}` } } : undefined;
          const igResponse = await fetch(url.toString(), requestInit).catch(() => null);

          if (igResponse && igResponse.ok) {
            const igData = await igResponse.json() as { followers_count?: number; media_count?: number };
            const followers = typeof igData.followers_count === 'number' ? igData.followers_count : 0;
            const engagement = typeof igData.media_count === 'number' ? igData.media_count : 0;
            m.platforms.push({
              id: 'instagram',
              name: 'Instagram',
              followers,
              engagement,
              lastUpdated: new Date().toISOString(),
              status: 'ok'
            });
            m.totalReach += followers;
          } else {
            const statusMessage = igResponse
              ? `Graph API responded with ${igResponse.status}`
              : 'No response from Graph API';
            m.platforms.push({
              id: 'instagram',
              name: 'Instagram',
              followers: 0,
              engagement: 0,
              lastUpdated: new Date().toISOString(),
              status: 'error',
              statusMessage
            });
          }
        } catch (error) {
          console.error('Failed to fetch Instagram metrics:', error);
          m.platforms.push({
            id: 'instagram',
            name: 'Instagram',
            followers: 0,
            engagement: 0,
            lastUpdated: new Date().toISOString(),
            status: 'error',
            statusMessage: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }
    } else {
      m.platforms.push({
        id: 'instagram',
        name: 'Instagram',
        followers: 0,
        engagement: 0,
        lastUpdated: new Date().toISOString(),
        status: 'missing_config',
        statusMessage: 'Instagram metrics bindings are not configured'
      });
    }

    // Fetch Spotify metrics
	try {
		const clientId = c.env.SPOTIFY_CLIENT_ID;
		const clientSecret = c.env.SPOTIFY_CLIENT_SECRET;
		const artistId = c.env.SPOTIFY_ARTIST_ID || '5WICYLl8MXvOY2x3mkoSqK';
		if (clientId && clientSecret && artistId) {
			const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/x-www-form-urlencoded',
					'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
				},
				body: new URLSearchParams({ grant_type: 'client_credentials' })
			});
			if (tokenRes.ok) {
				const tokenJson = await tokenRes.json() as { access_token: string };
				const artRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
					headers: { Authorization: `Bearer ${tokenJson.access_token}` }
				});
				if (artRes.ok) {
					const art = await artRes.json() as { followers?: { total?: number }; popularity?: number };
					const followers = art.followers?.total ?? 0;
					const engagement = typeof art.popularity === 'number' ? art.popularity : 0;
					m.platforms.push({
						id: 'spotify',
						name: 'Spotify',
						followers,
						engagement,
						lastUpdated: new Date().toISOString()
					});
					m.totalReach += followers;
				}
			}
		}
	} catch (error) {
		console.error('Failed to fetch Spotify metrics:', error);
	}

	// Facebook metrics via Graph API if configured
	try {
		const fbPageId = c.env.FB_PAGE_ID;
		const fbToken = c.env.FB_PAGE_TOKEN || c.env.IG_OEMBED_TOKEN;
		if (fbPageId && fbToken) {
			const pageUrl = new URL(`${graphBase(c.env)}/${fbPageId}`);
			pageUrl.searchParams.set('fields', 'fan_count,name');
			const pageRes = await fetch(pageUrl.toString(), { headers: { Authorization: `Bearer ${fbToken}` } });
			if (pageRes.ok) {
				const page = await pageRes.json() as { fan_count?: number; name?: string };
				const followers = page.fan_count ?? 0;
				m.platforms.push({
					id: 'facebook',
					name: 'Facebook',
					followers,
					engagement: 0,
					lastUpdated: new Date().toISOString()
				});
				m.totalReach += followers;
			}
		}
	} catch (e) {
		console.error('Failed to fetch Facebook metrics:', e);
	}

    const successfulPlatforms = m.platforms.filter((platform) => platform.status === undefined || platform.status === 'ok');
    if (successfulPlatforms.length > 0) {
      const top = successfulPlatforms.reduce((prev, curr) => (prev.engagement > curr.engagement ? prev : curr));
      m.topConversionSource = top.id;
    }
    await cache.set(`/${cacheKey}`, m, 900);
    return m;
  });

  return c.json(metrics, 200, {
    'Cache-Control': 'public, max-age=900',
    'X-Cache': 'MISS'
  });
});

// Utility functions
async function sha256(input: string): Promise<ArrayBuffer> {
	const encoder = new TextEncoder();
	return crypto.subtle.digest('SHA-256', encoder.encode(input));
}

function base64UrlEncode(buffer: ArrayBuffer): string {
	const bytes = new Uint8Array(buffer);
	let binary = '';
	for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
	return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function randomString(length = 64): string {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, (b) => ('0' + (b & 0xff).toString(16)).slice(-2)).join('');
}

async function signAdminPayload(secret: string, payload: string): Promise<string> {
	const encoder = new TextEncoder();
	const key = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
	const bytes = new Uint8Array(signature);
	let hex = '';
	for (let i = 0; i < bytes.length; i++) {
		hex += bytes[i].toString(16).padStart(2, '0');
	}
	return hex;
}

function timingSafeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let result = 0;
	for (let i = 0; i < a.length; i++) {
		result |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return result === 0;
}

// Spotify OAuth - Initiate login
app.get('/api/spotify/login', async (c) => {
    const kv = (c.env as unknown as { SESSIONS?: KVNamespace })?.SESSIONS;
    const clientId = c.env.SPOTIFY_CLIENT_ID;
    if (!kv) {
      return c.json({ error: 'kv_not_configured', message: 'SESSIONS KV binding not configured' }, 501);
    }
    if (!clientId || /your_spotify_client_id/i.test(clientId)) {
      return c.json({ error: 'spotify_not_configured', message: 'SPOTIFY_CLIENT_ID is missing' }, 501);
    }

    const redirectUri = c.req.url.replace(/\/api\/spotify\/login.*/, '/api/spotify/callback');
    const state = randomString(12);
    const codeVerifier = randomString(64);
    const challenge = base64UrlEncode(await sha256(codeVerifier));

    // Store PKCE verifier in KV with 10-minute TTL for OAuth flow
    await kv.put(
      `pkce:${state}`,
      JSON.stringify({ codeVerifier }),
      { expirationTtl: 600 }
    );

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      code_challenge_method: 'S256',
      code_challenge: challenge,
      state,
      scope: 'user-library-modify user-follow-modify user-follow-read'
    });

    return c.json({ authorizeUrl: `https://accounts.spotify.com/authorize?${params.toString()}` });
});

// Spotify OAuth - Callback exchange
app.get('/api/spotify/callback', async (c) => {
  const kv = (c.env as unknown as { SESSIONS?: KVNamespace })?.SESSIONS;
  if (!kv) {
    return c.json({ error: 'kv_not_configured', message: 'SESSIONS KV binding not configured' }, 501);
  }
  const url = new URL(c.req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  if (!code || !state) return c.json({ error: 'missing_code_or_state' }, 400);
  // Retrieve PKCE verifier from KV
  const pkceData = await kv.get(`pkce:${state}`);
  if (!pkceData) return c.json({ error: 'invalid_state' }, 400);
  const { codeVerifier } = JSON.parse(pkceData) as { codeVerifier: string };

  // Clean up PKCE data
  await kv.delete(`pkce:${state}`);

	const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: url.origin + '/api/spotify/callback',
			client_id: c.env.SPOTIFY_CLIENT_ID,
			code_verifier: codeVerifier
		})
	});
	if (!tokenRes.ok) {
		return c.json({ error: 'token_exchange_failed', status: tokenRes.status }, 500);
	}
		const tokenJson = await tokenRes.json() as { access_token: string; refresh_token?: string; expires_in: number };

		// Generate unique session ID
		const sessionId = randomString(32);
		const session: SpotifySession = {
			accessToken: tokenJson.access_token,
			refreshToken: tokenJson.refresh_token,
			expiresAt: Date.now() + tokenJson.expires_in * 1000
		};

		// Store session in KV with 30-day TTL
		await kv.put(
			`spotify:${sessionId}`,
			JSON.stringify(session),
			{ expirationTtl: 60 * 60 * 24 * 30 }
		);

		// Also persist in Durable Object (if bound)
		try {
			const ns = c.env.USER_SESSIONS;
			if (ns && typeof ns.idFromName === 'function' && typeof ns.get === 'function') {
				const id = ns.idFromName(sessionId);
				const stub = ns.get(id);
				await stub.fetch('https://user-session/set', {
					method: 'POST',
					headers: { 'content-type': 'application/json' },
					body: JSON.stringify({ sessionId, data: session, ttl: 60 * 60 * 24 * 30 })
				});
			}
		} catch { /* ignore */ }

		// Conditional Secure flag for local development
		const isHttps = new URL(c.req.url).protocol === 'https:';
		const secure = isHttps ? ' Secure;' : '';
		c.header('Set-Cookie', `spotify_session=${sessionId}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);

		// Redirect back to app instead of returning JSON
		const returnUrl = c.env.SITE_URL || new URL(c.req.url).origin;
		return c.redirect(`${returnUrl}/?spotify=connected`);
});

// Session status
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

	// Check if token expired and needs refresh
	if (session.expiresAt && session.expiresAt < Date.now() + 60000) {
		if (session.refreshToken) {
			// Token expired or expiring soon, trigger refresh
			const refreshed = await refreshSpotifyToken(c, match[1], session);
			if (refreshed) {
				return c.json({ authenticated: true, expiresAt: refreshed.expiresAt });
			}
		}
		return c.json({ authenticated: false, reason: 'token_expired' });
	}

	return c.json({ authenticated: true, expiresAt: session.expiresAt });
});

// Apple Developer Token (ES256). Cache in KV for shared access across worker instances.
app.get('/api/apple/developer-token', async (c) => {
  const now = Math.floor(Date.now() / 1000);
  const kv = (c.env as unknown as { SESSIONS?: KVNamespace })?.SESSIONS;

  // Try KV cache first (shared across all worker instances)
  if (kv) {
    try {
      const cached = await kv.get('apple_music_token', { type: 'json' }) as { token: string; exp: number } | null;
      if (cached && cached.exp - 60 > now) {
        return c.json({ token: cached.token, cached: true });
      }
    } catch (error) {
      console.error('Failed to read Apple token from KV:', error);
    }
  }

  // Check if required environment variables are configured
  const teamId = c.env.APPLE_TEAM_ID;
  const keyId = c.env.APPLE_KEY_ID;
  const privateKey = c.env.APPLE_PRIVATE_KEY;

  if (!teamId || !keyId || !privateKey) {
    console.error('Apple Music configuration missing. Required: APPLE_TEAM_ID, APPLE_KEY_ID, APPLE_PRIVATE_KEY');
    return c.json({
      error: 'apple_music_not_configured',
      message: 'Apple Music developer token not configured. Please set up APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY environment variables in your .dev.vars file.',
      documentation: 'https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens'
    }, 501);
  }

  // Check if the values are still the placeholder values
  if (teamId.includes('your_apple_team_id') || keyId.includes('your_apple_key_id') || privateKey.includes('your_apple_private_key')) {
    console.error('Apple Music configuration uses placeholder values');
    return c.json({
      error: 'apple_music_not_configured',
      message: 'Apple Music developer token configuration uses placeholder values. Please replace with actual Apple Music credentials.',
      documentation: 'https://developer.apple.com/documentation/applemusicapi/getting_keys_and_creating_tokens'
    }, 501);
  }

  try {
    // Lazy import to reduce bundle size and cold starts on non-Apple routes
    const { SignJWT, importPKCS8 } = await import('jose');
    const privateKeyPem = privateKey.replace(/\\n/g, '\n');
    const alg = 'ES256';
    const iat = now;
    // SECURITY: 2h validity (Apple allows up to 6 months, but shorter is more secure)
    // Reduces attack window if token is compromised via XSS or network interception
    const exp = iat + 60 * 60 * 2; // 2h validity
    const pk = await importPKCS8(privateKeyPem, alg);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg, kid: keyId })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .setIssuer(teamId)
      .sign(pk);

    // Cache in KV for shared access across worker instances (1h 50min TTL, just under token expiry)
    if (kv) {
      try {
        await kv.put('apple_music_token', JSON.stringify({ token, exp }), {
          expirationTtl: 110 * 60 // 1h 50min (110 minutes)
        });
      } catch (error) {
        console.error('Failed to cache Apple token in KV:', error);
      }
    }

    return c.json({ token, cached: false, exp });
  } catch (error) {
    console.error('Failed to generate Apple Music developer token:', error);
    return c.json({
      error: 'token_generation_failed',
      message: 'Failed to generate Apple Music developer token. Please check your private key format.',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, 500);
  }
});

async function getSessionFromCookie(c: { env: Env }, cookieHeader: string | null): Promise<SpotifySession | null> {
	if (!cookieHeader) return null;
	const match = cookieHeader.match(/spotify_session=([^;]+)/);
	if (!match) return null;

	// Prefer Durable Object
	try {
		const ns = c.env.USER_SESSIONS;
		if (ns && typeof ns.idFromName === 'function' && typeof ns.get === 'function') {
			const id = ns.idFromName(match[1]);
			const stub = ns.get(id);
			const res = await stub.fetch('https://user-session/get', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: match[1] }) });
			if (res.ok) {
				const session = await res.json() as SpotifySession;
				if (session?.accessToken) return session;
			}
		}
	} catch { /* ignore */ }

	const kv = (c.env as unknown as { SESSIONS?: KVNamespace })?.SESSIONS;
	if (!kv) return null;
	const sessionData = await kv.get(`spotify:${match[1]}`);
	if (!sessionData) return null;

	const session = JSON.parse(sessionData) as SpotifySession;
	if (!session.accessToken) return null;

	// Check if token needs refresh
	if (session.expiresAt && session.expiresAt < Date.now() + 60000) {
		if (session.refreshToken) {
			return await refreshSpotifyToken(c, match[1], session);
		}
		return null;
	}

	return session;
}

// Refresh Spotify access token
async function refreshSpotifyToken(c: { env: Env }, sessionId: string, session: SpotifySession): Promise<SpotifySession | null> {
	if (!session.refreshToken || !c.env.SPOTIFY_CLIENT_ID) {
		console.error('Cannot refresh Spotify token: missing refresh_token or SPOTIFY_CLIENT_ID');
		return null;
	}

	try {
		const res = await fetch('https://accounts.spotify.com/api/token', {
			method: 'POST',
			headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
			body: new URLSearchParams({
				grant_type: 'refresh_token',
				refresh_token: session.refreshToken,
				client_id: c.env.SPOTIFY_CLIENT_ID
			})
		});

		if (!res.ok) {
			const errorText = await res.text().catch(() => 'Unknown error');
			console.error(`Spotify token refresh failed: ${res.status} ${res.statusText}`, errorText);
			return null;
		}

		const tokenJson = await res.json() as { access_token: string; refresh_token?: string; expires_in: number };
		session.accessToken = tokenJson.access_token;
		if (tokenJson.refresh_token) {
			session.refreshToken = tokenJson.refresh_token;
		}
		session.expiresAt = Date.now() + tokenJson.expires_in * 1000;

		// Update session in KV (if available)
		const kv = (c.env as unknown as { SESSIONS?: KVNamespace })?.SESSIONS;
		if (kv) {
			await kv.put(
				`spotify:${sessionId}`,
				JSON.stringify(session),
				{ expirationTtl: 60 * 60 * 24 * 30 }
			);
		}

		console.log('Spotify token refreshed successfully');
		return session;
	} catch (error) {
		console.error('Spotify token refresh exception:', error instanceof Error ? error.message : error);
		return null;
	}
}

// Save track/album (simplified: expects body { ids: string[], type: 'tracks'|'albums' })
app.post('/api/spotify/save', async (c) => {
	const session = await getSessionFromCookie(c, c.req.header('Cookie') ?? null);
	if (!session) return c.json({ error: 'unauthorized' }, 401);
	const body = await c.req.json<{ ids: string[]; type: 'tracks'|'albums' }>();
	const endpoint = body.type === 'albums' ? 'albums' : 'tracks';
	const res = await fetch(`https://api.spotify.com/v1/me/${endpoint}`, {
		method: 'PUT',
		headers: { 'Authorization': `Bearer ${session.accessToken}`, 'Content-Type': 'application/json' },
		body: JSON.stringify(body.ids)
	});
	if (res.status === 200 || res.status === 201 || res.status === 204) return c.json({ success: true });
	return c.json({ error: 'save_failed', status: res.status }, 500);
});

// Follow artist(s) (body { artistIds: string[] })
app.post('/api/spotify/follow', async (c) => {
	const session = await getSessionFromCookie(c, c.req.header('Cookie') ?? null);
	if (!session) return c.json({ error: 'unauthorized' }, 401);
	const body = await c.req.json<{ artistIds: string[] }>();
	const params = new URLSearchParams({ type: 'artist', ids: body.artistIds.join(',') });
	const res = await fetch(`https://api.spotify.com/v1/me/following?${params.toString()}`, {
		method: 'PUT',
		headers: { 'Authorization': `Bearer ${session.accessToken}` }
	});
	if (res.status === 200 || res.status === 204) return c.json({ success: true });
	return c.json({ error: 'follow_failed', status: res.status }, 500);
});

export default app;

// Re-export Durable Object classes so wrangler can bind them by class_name
export { RateLimiter, UserSession } from './durable-objects';

// --- Medusa Admin proxy (login + create products) ---
function getAdminTokenFromCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null;
  const m = cookieHeader.match(/medusa_admin_jwt=([^;]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

function getMedusaUrl(c: { env: Env }): string | null {
  const base = c.env.MEDUSA_URL;
  if (!base || !/^https?:\/\//.test(base)) return null;
  return base.replace(/\/$/, '');
}

app.post('/api/admin/login', async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: 'not_configured', message: 'MEDUSA_URL not set' }, 501);
  try {
    const body = await c.req.json<{ email: string; password: string }>();
    const res = await fetch(`${MEDUSA}/admin/auth`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: body.email, password: body.password })
    });
    if (!res.ok) {
      return c.json({ error: 'invalid_credentials', status: res.status }, 401);
    }
    interface MedusaAuthResponse {
      token?: string;
      access_token?: string;
      jwt?: string;
      data?: { token?: string };
    }
    const json = await res.json() as MedusaAuthResponse;
    const token: string | undefined = json?.token || json?.access_token || json?.jwt || json?.data?.token;
    if (!token) return c.json({ error: 'no_token_in_response' }, 500);
    // HttpOnly cookie (avoid Secure in http local dev)
    const isHttps = new URL(c.req.url).protocol === 'https:';
    const secure = isHttps ? ' Secure;' : ' ';
    c.header('Set-Cookie', `medusa_admin_jwt=${encodeURIComponent(token)}; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=${60 * 60 * 6}`);
    // Track session in DO (best-effort), keyed by token
    try {
      const ns = c.env.USER_SESSIONS;
      if (ns && typeof ns.idFromName === 'function' && typeof ns.get === 'function') {
        const key = `admin:${token.slice(0, 16)}`; // avoid full token in key
        const id = ns.idFromName(key);
        const stub = ns.get(id);
        await stub.fetch('https://user-session/set', {
          method: 'POST', headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ sessionId: key, data: { active: true }, ttl: 60 * 60 * 6 })
        });
      }
    } catch { /* ignore */ }
    return c.json({ ok: true });
  } catch {
    return c.json({ error: 'bad_request' }, 400);
  }
});

app.post('/api/admin/logout', (c) => {
  const isHttps = new URL(c.req.url).protocol === 'https:';
  const secure = isHttps ? ' Secure;' : ' ';
  c.header('Set-Cookie', `medusa_admin_jwt=; Path=/; HttpOnly;${secure} SameSite=Lax; Max-Age=0`);
  return c.json({ ok: true });
});

app.get('/api/admin/session', async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ authenticated: false, reason: 'not_configured' }, 200);
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ authenticated: false }, 200);
  // Prefer DO session check first
  try {
    const ns = c.env.USER_SESSIONS;
    if (ns && typeof ns.idFromName === 'function' && typeof ns.get === 'function') {
      const key = `admin:${token.slice(0, 16)}`;
      const id = ns.idFromName(key);
      const stub = ns.get(id);
      const res = await stub.fetch('https://user-session/get', {
        method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ sessionId: key })
      });
      if (res.ok) {
        return c.json({ authenticated: true });
      }
    }
  } catch { /* ignore */ }
  // Try a lightweight call to verify token
  try {
    const res = await fetch(`${MEDUSA}/admin/products?limit=1`, { headers: { 'Authorization': `Bearer ${token}` } });
    return c.json({ authenticated: res.ok });
  } catch {
    return c.json({ authenticated: false });
  }
});

// Proxy create product (body forwarded as-is)
app.post('/api/admin/products', async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: 'not_configured' }, 501);
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  try {
    const json = await c.req.json();
    const upstream = await fetch(`${MEDUSA}/admin/products`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify(json)
    });
    const text = await upstream.text();
    return new Response(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' } });
  } catch {
    return c.json({ error: 'bad_request' }, 400);
  }
});

// List products (admin)
app.get('/api/admin/products', async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: 'not_configured' }, 501);
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const url = new URL(`${MEDUSA}/admin/products`);
  const reqUrl = new URL(c.req.url);
  reqUrl.searchParams.forEach((v, k) => url.searchParams.set(k, v));
  const upstream = await fetch(url.toString(), { headers: { 'Authorization': `Bearer ${token}` } });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' } });
});

// Get product
app.get('/api/admin/products/:id', async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: 'not_configured' }, 501);
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const id = c.req.param('id');
  const upstream = await fetch(`${MEDUSA}/admin/products/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' } });
});

// Update product
app.patch('/api/admin/products/:id', async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: 'not_configured' }, 501);
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const id = c.req.param('id');
  const body = await c.req.text();
  const upstream = await fetch(`${MEDUSA}/admin/products/${id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'content-type': 'application/json' }, body });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' } });
});

// Create variant
app.post('/api/admin/products/:id/variants', async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: 'not_configured' }, 501);
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const id = c.req.param('id');
  const body = await c.req.text();
  const upstream = await fetch(`${MEDUSA}/admin/products/${id}/variants`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'content-type': 'application/json' }, body });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' } });
});

// Update variant (Medusa often uses POST/PATCH on /admin/variants/:id)
app.patch('/api/admin/variants/:id', async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: 'not_configured' }, 501);
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const id = c.req.param('id');
  const body = await c.req.text();
  const upstream = await fetch(`${MEDUSA}/admin/variants/${id}`, { method: 'PATCH', headers: { 'Authorization': `Bearer ${token}`, 'content-type': 'application/json' }, body });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' } });
});

// Delete variant
app.delete('/api/admin/variants/:id', async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: 'not_configured' }, 501);
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const id = c.req.param('id');
  const upstream = await fetch(`${MEDUSA}/admin/variants/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
  const text = await upstream.text();
  return new Response(text, { status: upstream.status, headers: { 'content-type': upstream.headers.get('content-type') || 'application/json' } });
});

// --- Admin: Upload product image to R2 and attach to Medusa product ---
app.post('/api/admin/products/:id/images/upload', async (c) => {
  const MEDUSA = getMedusaUrl(c);
  if (!MEDUSA) return c.json({ error: 'not_configured' }, 501);
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);

  try {
    const { url, path } = await c.req.json<{ url: string; path?: string }>();
    if (!url) return c.json({ error: 'missing_url' }, 400);

    // Upload to R2 (prefer MEDIA_BUCKET + custom domain)
    const mediaBucket = c.env.MEDIA_BUCKET;
    const userAssets = c.env.USER_ASSETS;
    const bucket = mediaBucket || userAssets;
    if (!bucket || typeof bucket.put !== 'function') return c.json({ error: 'r2_not_configured' }, 501);

    const upstream = await fetch(url);
    if (!upstream.ok) return c.json({ error: 'fetch_failed', status: upstream.status }, 400);
    if (!upstream.body) return c.json({ error: 'no_body' }, 400);

    const ct = upstream.headers.get('content-type') || 'application/octet-stream';
    const key = `${(path || 'products').replace(/\/$/, '')}/${crypto.randomUUID()}`;

    // Extract filename from URL
    const filename = url.split('/').pop()?.split('?')[0] || 'upload';

    // ✅ FIX: Stream directly to R2 instead of loading into memory
    const result = await bucket.put(key, upstream.body, {
      httpMetadata: {
        contentType: ct,
        cacheControl: 'public, max-age=31536000'
      },
      customMetadata: {
        uploadedBy: 'admin',
        uploadedAt: new Date().toISOString(),
        originalUrl: url,
        originalFilename: filename,
        source: 'product-upload'
      }
    });
    const base = (c.env.R2_PUBLIC_BASE && c.env.R2_PUBLIC_BASE.trim()) || (mediaBucket ? 'https://r2.thevoicesofjudah.com' : '');
    const publicUrl = base ? `${base.replace(/\/$/, '')}/${key}` : null;

    const id = c.req.param('id');

    // Fetch current product to merge images
    const pRes = await fetch(`${MEDUSA}/admin/products/${id}`, { headers: { 'Authorization': `Bearer ${token}` } });
    let currentImages: string[] = [];
    if (pRes.ok) {
      const pj = await pRes.json() as { product?: { images?: unknown[] } } | { images?: unknown[] };
      const product: { images?: unknown[] } = ('product' in pj && pj?.product ? pj.product : pj) as { images?: unknown[] }; // v1 sometimes returns { product }
      const imgs = product?.images || [];
      // Normalize to array of URLs
      currentImages = (Array.isArray(imgs) ? imgs : []).map((x: unknown) => (typeof x === 'string' ? x : ((x as Record<string, unknown>)?.url || (x as Record<string, unknown>)?.src || (x as Record<string, unknown>)?.original_url) as string)).filter(Boolean);
    }
    // Append new image if not present
    const next = publicUrl ? Array.from(new Set([...currentImages, publicUrl])) : currentImages;

    // Patch product with merged images if we have a URL
    let patchStatus = 0;
    if (publicUrl) {
      const patch = await fetch(`${MEDUSA}/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}`, 'content-type': 'application/json' },
        body: JSON.stringify({ images: next })
      });
      patchStatus = patch.status;
    }

    return c.json({
      ok: true,
      publicUrl,
      images: next,
      patched: patchStatus > 0 ? patchStatus : undefined,
      r2: {
        key: result.key,
        etag: result.etag,
        size: result.size,
        uploaded: result.uploaded.toISOString()
      }
    });
  } catch (e) {
    return c.json({ error: 'bad_request', message: (e as Error).message }, 400);
  }
});

// --- Cloudflare Images: Direct Upload (admin only) ---
app.post('/api/images/direct-upload', async (c) => {
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const accountId = c.env.CF_IMAGES_ACCOUNT_ID;
  const apiToken = c.env.CF_IMAGES_API_TOKEN;
  if (!accountId || !apiToken) return c.json({ error: 'not_configured' }, 501);
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v2/direct_upload`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiToken}` }
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
});

// --- R2: Basic upload (admin only) and read proxy ---
app.post('/api/r2/upload', async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!admin) return c.json({ error: 'unauthorized' }, 401);
  const mediaBucket = c.env.MEDIA_BUCKET;
  const userAssets = c.env.USER_ASSETS;
  const bucket = mediaBucket || userAssets;
  if (!bucket || typeof bucket.put !== 'function') return c.json({ error: 'not_configured' }, 501);
  try {
    const { url, path, preventOverwrite } = await c.req.json<{ url: string; path?: string; preventOverwrite?: boolean }>();
    if (!url) return c.json({ error: 'missing_url' }, 400);
    const upstream = await fetch(url);
    if (!upstream.ok) return c.json({ error: 'fetch_failed', status: upstream.status }, 400);
    if (!upstream.body) return c.json({ error: 'no_body' }, 400);

    const ct = upstream.headers.get('content-type') || 'application/octet-stream';
    const key = `${(path || 'uploads').replace(/\/$/, '')}/${crypto.randomUUID()}`;

    // Extract filename from URL
    const filename = url.split('/').pop()?.split('?')[0] || 'upload';

    // ✅ FIX: Stream directly to R2 instead of loading into memory
    const result = await bucket.put(key, upstream.body, {
      httpMetadata: {
        contentType: ct,
        cacheControl: 'public, max-age=31536000'
      },
      customMetadata: {
        uploadedBy: 'admin',
        uploadedAt: new Date().toISOString(),
        originalUrl: url,
        originalFilename: filename,
        source: 'r2-upload'
      },
      // ✅ Prevent accidental overwrites if requested
      onlyIf: preventOverwrite ? { etagDoesNotMatch: '*' } : undefined
    });

    const base = (c.env.R2_PUBLIC_BASE && c.env.R2_PUBLIC_BASE.trim()) || (mediaBucket ? 'https://r2.thevoicesofjudah.com' : '');
    const publicUrl = base ? `${base.replace(/\/$/, '')}/${key}` : null;

    return c.json({
      key: result.key,
      etag: result.etag,
      size: result.size,
      contentType: ct,
      publicUrl,
      uploaded: result.uploaded.toISOString(),
      customMetadata: result.customMetadata
    });
  } catch (error) {
    const err = error as Error;
    if (err.message?.includes('etag')) {
      return c.json({ error: 'conflict', message: 'File already exists at this key' }, 409);
    }
    return c.json({ error: 'bad_request', message: err.message }, 400);
  }
});

// ✅ GET/HEAD: Read R2 object with Range request support
app.on(['GET', 'HEAD'], '/api/r2/*', async (c) => {
  const key = c.req.path.replace(/^\/api\/r2\//, '');
  const mediaBucket = c.env.MEDIA_BUCKET;
  const userAssets = c.env.USER_ASSETS;
  const bucket = mediaBucket || userAssets;
  const isHead = c.req.method === 'HEAD';
  if (!bucket || typeof bucket.get !== 'function') return c.json({ error: 'not_configured' }, 501);

  // If a public base is configured (or we know MEDIA_BUCKET custom domain), redirect to CDN
  const base = (c.env.R2_PUBLIC_BASE && c.env.R2_PUBLIC_BASE.trim()) || (mediaBucket ? 'https://r2.thevoicesofjudah.com' : '');
  if (base) {
    return Response.redirect(`${base.replace(/\/$/,'')}/${key}`, 302);
  }

  // ✅ HEAD: Return metadata only
  if (isHead) {
    const obj = await bucket.head(key);
    if (!obj) return new Response(null, { status: 404 });

    return new Response(null, {
      status: 200,
      headers: {
        'content-type': obj.httpMetadata?.contentType || 'application/octet-stream',
        'content-length': obj.size.toString(),
        'etag': obj.etag,
        'last-modified': obj.uploaded.toUTCString(),
        'cache-control': 'public, max-age=31536000',
        'accept-ranges': 'bytes'
      }
    });
  }

  // ✅ GET: Support Range requests for video/audio streaming
  const rangeHeader = c.req.header('range');
  let obj: R2Object | null = null;

  if (rangeHeader) {
    // Parse: "bytes=0-1023" or "bytes=1024-"
    const match = rangeHeader.match(/bytes=(\d+)-(\d*)/);
    if (match) {
      const offset = parseInt(match[1]);
      const end = match[2] ? parseInt(match[2]) : undefined;
      const length = end !== undefined ? end - offset + 1 : undefined;

      obj = await bucket.get(key, { range: { offset, length } });

      if (obj) {
        const ct = obj.httpMetadata?.contentType || 'application/octet-stream';
        const contentLength = obj.size;
        const rangeEnd = end !== undefined ? end : offset + contentLength - 1;

        return new Response(obj.body, {
          status: 206, // Partial Content
          headers: {
            'content-type': ct,
            'content-range': `bytes ${offset}-${rangeEnd}/${obj.size}`,
            'accept-ranges': 'bytes',
            'content-length': contentLength.toString(),
            'cache-control': 'public, max-age=31536000'
          }
        });
      }
    }
  }

  // Full object request
  if (!obj) {
    obj = await bucket.get(key);
  }

  if (!obj) return c.json({ error: 'not_found' }, 404);

  const ct = obj.httpMetadata?.contentType || 'application/octet-stream';
  return new Response(obj.body, {
    headers: {
      'content-type': ct,
      'cache-control': 'public, max-age=31536000',
      'accept-ranges': 'bytes',
      'etag': obj.etag,
      'last-modified': obj.uploaded.toUTCString()
    }
  });
});

// ✅ DELETE: Remove R2 object (admin only)
app.delete('/api/r2/*', async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!admin) return c.json({ error: 'unauthorized' }, 401);

  const key = c.req.path.replace(/^\/api\/r2\//, '');
  const mediaBucket = c.env.MEDIA_BUCKET;
  const userAssets = c.env.USER_ASSETS;
  const bucket = mediaBucket || userAssets;
  if (!bucket || typeof bucket.delete !== 'function') return c.json({ error: 'not_configured' }, 501);

  try {
    // Check if object exists first
    const obj = await bucket.head(key);
    if (!obj) return c.json({ error: 'not_found' }, 404);

    await bucket.delete(key);
    return c.json({
      ok: true,
      deleted: key,
      size: obj.size,
      etag: obj.etag
    });
  } catch (error) {
    return c.json({ error: 'delete_failed', message: (error as Error).message }, 500);
  }
});

// ✅ LIST: Browse R2 bucket contents (admin only)
app.get('/api/admin/r2/list', async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!admin) return c.json({ error: 'unauthorized' }, 401);

  const mediaBucket = c.env.MEDIA_BUCKET;
  const userAssets = c.env.USER_ASSETS;
  const bucket = mediaBucket || userAssets;
  if (!bucket || typeof bucket.list !== 'function') return c.json({ error: 'not_configured' }, 501);

  try {
    const prefix = c.req.query('prefix') || undefined;
    const cursor = c.req.query('cursor') || undefined;
    const limitStr = c.req.query('limit');
    const limit = limitStr ? Math.min(parseInt(limitStr), 1000) : 100;

    const result = await bucket.list({ prefix, cursor, limit });

    return c.json({
      objects: result.objects.map(obj => ({
        key: obj.key,
        size: obj.size,
        etag: obj.etag,
        uploaded: obj.uploaded.toISOString(),
        httpMetadata: obj.httpMetadata,
        customMetadata: obj.customMetadata
      })),
      truncated: result.truncated,
      cursor: result.cursor,
      count: result.objects.length
    });
  } catch (error) {
    return c.json({ error: 'list_failed', message: (error as Error).message }, 500);
  }
});

// --- Admin: Event flyer upload to R2 and D1 update ---
app.post('/api/admin/events/:slug/flyer/upload', async (c) => {
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const db = c.env.DB;
  if (!db || typeof db.prepare !== 'function') return c.json({ error: 'd1_not_configured' }, 501);
  const mediaBucket = c.env.MEDIA_BUCKET;
  const userAssets = c.env.USER_ASSETS;
  const bucket = mediaBucket || userAssets;
  if (!bucket || typeof bucket.put !== 'function') return c.json({ error: 'r2_not_configured' }, 501);
  try {
    const { url } = await c.req.json<{ url: string }>();
    if (!url) return c.json({ error: 'missing_url' }, 400);
    const slug = c.req.param('slug');
    const upstream = await fetch(url);
    if (!upstream.ok) return c.json({ error: 'fetch_failed', status: upstream.status }, 400);
    if (!upstream.body) return c.json({ error: 'no_body' }, 400);

    const ct = upstream.headers.get('content-type') || 'application/octet-stream';
    const key = `events/${slug}/${crypto.randomUUID()}`;

    // Extract filename from URL
    const filename = url.split('/').pop()?.split('?')[0] || 'flyer';

    // ✅ FIX: Stream directly to R2 instead of loading into memory
    const result = await bucket.put(key, upstream.body, {
      httpMetadata: {
        contentType: ct,
        cacheControl: 'public, max-age=31536000'
      },
      customMetadata: {
        uploadedBy: 'admin',
        uploadedAt: new Date().toISOString(),
        eventSlug: slug,
        originalUrl: url,
        originalFilename: filename,
        source: 'event-flyer'
      }
    });

    const base = (c.env.R2_PUBLIC_BASE && c.env.R2_PUBLIC_BASE.trim()) || (mediaBucket ? 'https://r2.thevoicesofjudah.com' : '');
    const publicUrl = base ? `${base.replace(/\/$/, '')}/${key}` : null;

    if (publicUrl) {
      await db.prepare(`UPDATE events SET flyer_url = ?, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now') WHERE slug = ?`).bind(publicUrl, slug).run();
    }
    // Return updated event if available
    const { results } = await db.prepare(`SELECT * FROM events WHERE slug = ?`).bind(slug).all();
    return c.json({
      ok: true,
      publicUrl,
      event: results?.[0] || null,
      r2: {
        key: result.key,
        etag: result.etag,
        size: result.size,
        uploaded: result.uploaded.toISOString()
      }
    });
  } catch (e) {
    return c.json({ error: 'bad_request', message: (e as Error).message }, 400);
  }
});

// Delete an image by id
app.delete('/api/images/:id', async (c) => {
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  const accountId = c.env.CF_IMAGES_ACCOUNT_ID;
  const apiToken = c.env.CF_IMAGES_API_TOKEN;
  if (!accountId || !apiToken) return c.json({ error: 'not_configured' }, 501);
  const id = c.req.param('id');
  const res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${apiToken}` }
  });
  const text = await res.text();
  return new Response(text, { status: res.status, headers: { 'content-type': res.headers.get('content-type') || 'application/json' } });
});

// --- AI: Suggest product title/description from image (admin only) ---
app.post('/api/ai/suggest-product', async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!admin) return c.json({ error: 'unauthorized' }, 401);
  const key = c.env.OPENAI_API_KEY;
  try {
    const { image_url, prompt } = await c.req.json<{ image_url: string; prompt?: string }>();
    if (!image_url) return c.json({ error: 'missing_image' }, 400);
    const system = 'You generate concise, compelling e-commerce titles and descriptions from product photos. Keep titles under 70 characters; descriptions 2–3 sentences. Return strict JSON with keys title, description.'
    const userPrompt = prompt || 'Create a product title and description for this image.'

    // Prefer OpenAI if configured
    if (key) {
      const payload = {
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: [
            { type: 'text', text: userPrompt },
            { type: 'image_url', image_url: { url: image_url } }
          ]}
        ],
        response_format: { type: 'json_object' }
      };
      const upstream = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!upstream.ok) {
        const t = await upstream.text();
        return c.json({ error: 'upstream_error', status: upstream.status, body: t }, 502);
      }
      interface OpenAIResponse {
        choices?: Array<{ message?: { content?: string } }>;
      }
      const json = await upstream.json() as OpenAIResponse;
      const content = json?.choices?.[0]?.message?.content || '{}';
      interface ParsedContent {
        title?: string;
        description?: string;
      }
      let parsed: ParsedContent = {};
      try { parsed = JSON.parse(content) } catch { parsed = { title: content?.slice?.(0, 70) || '', description: content || '' } }
      return c.json({ title: parsed.title || '', description: parsed.description || '' });
    }

    // Workers AI fallback
    if (!c.env.AI) return c.json({ error: 'not_configured', provider: 'workers_ai' }, 501);
    const imgRes = await fetch(image_url);
    if (!imgRes.ok) return c.json({ error: 'image_fetch_failed' }, 400);
    const buf = await imgRes.arrayBuffer();
    const image = new Uint8Array(buf);
    const models = ['@cf/meta/llama-3.2-11b-vision-instruct', '@cf/llava-hf/llava-1.5-7b-hf'];
    for (const model of models) {
      try {
        const out = await c.env.AI!.run(model, { prompt: `${system}\n\n${userPrompt}\nRespond with JSON: {"title":"...","description":"..."}.`, image: [image] });
        const text = out?.output || out?.response || out?.text || JSON.stringify(out || {});
        interface ParsedAI {
          title?: string;
          description?: string;
        }
        let parsed: ParsedAI = {};
        try { parsed = JSON.parse(typeof text === 'string' ? text : JSON.stringify(text)) } catch { parsed = { title: String(text).slice(0,70), description: String(text) } }
        return c.json({ title: parsed.title || '', description: parsed.description || '' });
      } catch { /* try next model */ }
    }
    return c.json({ error: 'ai_failed' }, 500);
  } catch {
    return c.json({ error: 'bad_request' }, 400);
  }
});

// --- Booking endpoint ---
// Basic in-memory rate limit per IP (best-effort, ephemeral)
const rateMap = new Map<string, { count: number; reset: number }>();

app.post('/api/booking', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    // Prefer DO-based rate limiter if bound; fallback to in-memory
    const allowed = await (async () => {
      try {
        const ns = c.env.RATE_LIMITER;
        if (ns && typeof ns.idFromName === 'function' && typeof ns.get === 'function') {
          const id = ns.idFromName('global');
          const stub = ns.get(id);
          const res = await stub.fetch('https://rate/check', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ ip, limit: 10, window: 60 })
          });
          if (res.status === 429) return false;
          const j = await res.json().catch(() => ({ allowed: true })) as { allowed?: boolean };
          return !!j.allowed;
        }
      } catch {
        // Ignore rate limiter errors, fall back to in-memory
      }
      const now = Date.now();
      const bucket = rateMap.get(ip);
      if (!bucket || bucket.reset < now) {
        rateMap.set(ip, { count: 1, reset: now + 60_000 });
        return true;
      }
      if (bucket.count > 10) return false;
      bucket.count += 1;
      return true;
    })();

    if (!allowed) {
      return c.json({ error: 'rate_limited', message: 'Too many requests. Please try again in a minute.' }, 429);
    }

    const body = await c.req.json();
    const parsed = BookingSchema.safeParse(body);
    if (!parsed.success) {
      return c.json({ error: 'validation_failed', issues: parsed.error.issues }, 400);
    }
    const input = parsed.data;

    // Honeypot: if present, reject silently
    if (input.website && String(input.website).trim() !== '') {
      return c.json({ ok: true, ignored: true });
    }

    // Normalize values for downstream use
    const email = String(input.email).trim().toLowerCase();
    const phoneRaw = String(input.phone).trim();
    const phone = phoneRaw.replace(/(?!^\+)\D+/g, '');

    // Date/time sanity: require future time in UTC comparison
    const isoDate = String(input.eventDate);
    const isoTime = String(input.eventTime);
    const eventDateTime = new Date(`${isoDate}T${isoTime}`);
    if (Number.isNaN(eventDateTime.getTime())) {
      return c.json({ error: 'invalid_datetime' }, 400);
    }
    if (eventDateTime.getTime() < Date.now()) {
      return c.json({ error: 'datetime_in_past' }, 400);
    }

    // Bounds
    const name = String(input.name).trim().slice(0, 100);
    const location = String(input.location).trim().slice(0, 200);
    const message = (input.message ? String(input.message) : '').trim().slice(0, 2000);

    const summary = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Event Type: ${input.eventType}`,
      `Date: ${isoDate} ${isoTime}`,
      `Location: ${location}`,
      '',
      'Message:',
      message || '(none)'
    ].join('\n');

    // Create confirmation email template for customer
    const customerConfirmation = `Dear ${name},

Thank you for your booking request with DJ Lee & Voices of Judah!

We have received your request with the following details:

EVENT DETAILS
Event Type: ${body.eventType}
Date: ${isoDate}
Time: ${isoTime}
Location: ${location}

YOUR CONTACT INFORMATION
Name: ${name}
Email: ${email}
Phone: ${phone}

${message ? `Your Message:\n${message}\n\n` : ''}We will review your request and respond within 24-48 hours to confirm availability and discuss further details.

If you need immediate assistance, please feel free to call us directly.

Blessings,
DJ Lee & Voices of Judah Team

---
This is an automated confirmation email. Please do not reply directly to this message.`;

    // Prefer Resend if configured
    const toResend = c.env.RESEND_TO || 'V.O.J@icloud.com';
    const fromResend = c.env.RESEND_FROM || 'DJ Lee Website <no-reply@djlee.local>';
    if (c.env.RESEND_API_KEY) {
      // Send to admin
      const adminRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: fromResend,
          to: [toResend],
          subject: `Booking Request: ${input.eventType} on ${isoDate}`,
          text: summary
        })
      });

      // Send confirmation to customer
      if (adminRes.ok) {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            from: fromResend,
          to: [email],
          subject: `Booking Confirmation - DJ Lee & Voices of Judah`,
          text: customerConfirmation
        })
      });
      return c.json({ ok: true, provider: 'resend' });
    }
      // fall through to SendGrid if available
    }

    // Fallback: SendGrid
    if (c.env.SENDGRID_API_KEY) {
      const to = c.env.SENDGRID_TO || 'V.O.J@icloud.com';
      const from = c.env.SENDGRID_FROM || 'no-reply@djlee.local';

      // Send to admin
      const adminRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: from, name: 'DJ Lee Website' },
          subject: `Booking Request: ${input.eventType} on ${isoDate}`,
          content: [{ type: 'text/plain', value: summary }]
        })
      });

      if (!adminRes.ok) {
        return c.json({ error: 'email_send_failed', provider: 'sendgrid', status: adminRes.status }, 500);
      }

      // Send confirmation to customer
      await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${c.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email }] }],
          from: { email: from, name: 'DJ Lee & Voices of Judah' },
          subject: `Booking Confirmation - DJ Lee & Voices of Judah`,
          content: [{ type: 'text/plain', value: customerConfirmation }]
        })
      });

      return c.json({ ok: true, provider: 'sendgrid' });
    }

    // If no provider configured, instruct client to fallback
    return c.json({ ok: false, error: 'no_email_provider' }, 501);
  } catch {
    return c.json({ error: 'invalid_request' }, 400);
  }
});



// --- Instagram oEmbed proxy with KV cache ---
type OEmbedJSON = Record<string, unknown>;

app.get('/api/instagram/oembed', async (c) => {
  try {
    const url = c.req.query('url');
    const maxwidth = c.req.query('maxwidth');
    const omitscript = c.req.query('omitscript');
    const hidecaption = c.req.query('hidecaption');

    if (!url) {
      return c.json({ error: 'URL parameter is required' }, 400);
    }

    // Multi-tier cache key
    const cacheKey = `ig:${url}:${maxwidth || ''}:${omitscript || ''}:${hidecaption || ''}`;
    const cache = new CacheManager(c.env.SESSIONS);
    const edgeKey = `/oembed:${cacheKey}`;
    const l1 = await cache.get<Record<string, unknown>>(edgeKey).catch(() => null);
    if (l1) {
      return c.json(l1, 200, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT'
      });
    }

    // First, try with Instagram's Graph API if token is available
    // Prefer App Access Token if app is configured (requires "oEmbed Read" approval)
    const appToken = await getAppAccessToken(c.env);
    const igToken = appToken || c.env.IG_OEMBED_TOKEN;
    if (igToken) {
      try {
        const graphUrl = new URL(`${graphBase(c.env)}/instagram_oembed`);
        graphUrl.searchParams.append('url', url);
        if (maxwidth) graphUrl.searchParams.append('maxwidth', maxwidth);
        if (omitscript) graphUrl.searchParams.append('omitscript', omitscript);
        if (hidecaption) graphUrl.searchParams.append('hidecaption', hidecaption);
        const graphResponse = await fetch(graphUrl.toString(), {
          headers: { Authorization: `Bearer ${igToken}` }
        });
        if (graphResponse.ok) {
          const data = await graphResponse.json() as OEmbedJSON;

          // Cache for 1 hour in both tiers
          await cache.set(edgeKey, data, 3600);

          return c.json(data, 200, {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600',
            'X-Cache': 'MISS'
          });
        }
      } catch (graphError) {
        console.error('Instagram Graph API error:', graphError);
        // Fall through to public API
      }
    }

    // Fallback to Instagram's public oEmbed endpoint
    const oembedUrl = new URL('https://api.instagram.com/oembed');
    oembedUrl.searchParams.append('url', url);
    if (maxwidth) oembedUrl.searchParams.append('maxwidth', maxwidth);
    if (omitscript !== undefined) oembedUrl.searchParams.append('omitscript', omitscript);
    if (hidecaption !== undefined) oembedUrl.searchParams.append('hidecaption', hidecaption);

    // Add headers to mimic a browser request
    const response = await fetch(oembedUrl.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': c.req.header('Referer') || 'https://dj-judas.com/'
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Instagram oEmbed API error:', response.status, errorText);

      // If Instagram API fails, return a structured fallback response
      if (response.status === 404 || response.status === 400) {
        return c.json({
          error: 'Invalid Instagram URL',
          message: 'The Instagram post could not be found. It may be private or deleted.'
        }, 404);
      }

      // For rate limiting or server errors, provide a fallback embed structure
      if (response.status >= 500 || response.status === 429) {
        // Extract username from URL if possible
        const match = url.match(/instagram\.com\/([^/]+)/);
        const username = match ? match[1] : 'iam_djlee';

        // Return a minimal fallback structure that the frontend can handle
        return c.json({
          fallback: true,
          html: `<div class="instagram-fallback"><a href="${url}" target="_blank" rel="noopener noreferrer">View on Instagram @${username}</a></div>`,
          author_name: username,
          author_url: `https://www.instagram.com/${username}/`,
          provider_name: 'Instagram',
          provider_url: 'https://www.instagram.com',
          type: 'rich',
          version: '1.0'
        }, 200, {
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=300' // Cache fallback for 5 minutes
        });
      }

      const status = response.status as 400 | 401 | 403 | 404 | 500 | 502 | 503;
      return c.json({
        error: 'Failed to fetch Instagram embed',
        status: response.status,
        details: errorText
      }, status);
    }

    const data = await response.json() as OEmbedJSON;

    // Cache successful response in both tiers for 1 hour
    await cache.set(edgeKey, data, 3600);

    return c.json(data, 200, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'MISS'
    });

  } catch (error) {
    console.error('Instagram oEmbed handler error:', error);

    // Last resort fallback
    const url = c.req.query('url') || '';
    const match = url.match(/instagram\.com\/([^/]+)/);
    const username = match ? match[1] : 'iam_djlee';

    return c.json({
      fallback: true,
      html: `<div class="instagram-fallback"><a href="${url}" target="_blank" rel="noopener noreferrer">View on Instagram @${username}</a></div>`,
      author_name: username,
      author_url: `https://www.instagram.com/${username}/`,
      provider_name: 'Instagram',
      provider_url: 'https://www.instagram.com',
      type: 'rich',
      version: '1.0'
    }, 200, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=300'
    });
  }
});

// --- Instagram Graph API for media feeds ---
app.get('/api/instagram/media', async (c) => {
  const igToken = c.env.IG_OEMBED_TOKEN;
  if (!igToken) {
    return c.json({
      error: 'not_configured',
      message: 'Instagram Graph API not configured'
    }, 501);
  }

  try {
    // Instagram Business Account ID (this should be fetched from token or configured)
    const igUserId = c.req.query('user_id') || c.env.IG_USER_ID || 'me';
    const limit = c.req.query('limit') || '12';
    const fields = c.req.query('fields') || 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username';

    // L1 + L2 cache
    const cache = new CacheManager(c.env.SESSIONS);
    const cacheKey = `/ig_media:${igUserId}:${limit}:${fields}`;
    const cached = await cache.get<Record<string, unknown>>(cacheKey).catch(() => null);
    if (cached) {
      return c.json(cached, 200, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=900',
        'X-Cache': 'HIT'
      });
    }

    // Fetch from Instagram Graph API
    const graphUrl = new URL(`${graphBase(c.env)}/${igUserId}/media`);
    graphUrl.searchParams.append('fields', fields);
    graphUrl.searchParams.append('limit', limit);
    const response = await fetch(graphUrl.toString(), { headers: { Authorization: `Bearer ${igToken}` } });
    if (!response.ok) {
      const error = await response.json() as { error: { message: string } };
      console.error('Instagram Graph API error:', error);
      return c.json({
        error: 'api_error',
        message: error.error?.message || 'Failed to fetch Instagram media',
        details: error
      }, 500);
    }

    const data = await response.json() as { data: [] };
    await cache.set(cacheKey, data, 900);

    return c.json(data, 200, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=900',
      'X-Cache': 'MISS'
    });
  } catch (error) {
    console.error('Instagram media handler error:', error);
    return c.json({
      error: 'internal_error',
      message: 'Failed to fetch Instagram media'
    }, 500);
  }
});

// --- Dynamic Social Feed API ---
app.get('/api/social/feed', async (c) => {
  try {
    const platforms = c.req.query('platforms')?.split(',') || ['instagram', 'facebook'];
    const hashtags: string[] = c.req.query('hashtags')?.split(',').filter(Boolean) || [];
    const limit = parseInt(c.req.query('limit') || '12');
    const shoppable = c.req.query('shoppable') === 'true';

    // Configuration guard: return 501 if none of the requested platforms are configured
    const wantsIg = platforms.includes('instagram');
    const wantsFb = platforms.includes('facebook');
    const igConfigured = !!c.env.IG_OEMBED_TOKEN;
    const fbConfigured = !!(c.env.FB_PAGE_ID && (c.env.FB_PAGE_TOKEN || c.env.IG_OEMBED_TOKEN));
    const anyRequestedConfigured = (wantsIg && igConfigured) || (wantsFb && fbConfigured);
    if (!anyRequestedConfigured) {
      return c.json({ error: 'not_configured', message: 'Social APIs not configured' }, 501);
    }

    const posts: SocialPost[] = [];
    const errors: Array<{ platform: string; error: string }> = [];

    // Fetch Instagram posts if requested
    if (platforms.includes('instagram')) {
      const igToken = c.env.IG_OEMBED_TOKEN;
      if (igToken) {
        try {
          // Get Instagram Business Account ID
          const igUserId = c.req.query('ig_user_id') || '17841400000000000'; // Placeholder
          const fields = 'id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count';

          const graphUrl = new URL(`${graphBase(c.env)}/${igUserId || c.env.IG_USER_ID || 'me'}/media`);
          graphUrl.searchParams.append('fields', fields);
          graphUrl.searchParams.append('limit', limit.toString());
          const response = await fetch(graphUrl.toString(), {
            headers: { Authorization: `Bearer ${igToken}` }
          });
          if (response.ok) {
            const data = await response.json() as { data?: Array<{
              id: string;
              media_type: string;
              media_url: string;
              thumbnail_url?: string;
              permalink: string;
              caption?: string;
              timestamp: string;
              like_count?: number;
              comments_count?: number;
            }> };

            if (data.data) {
              for (const item of data.data) {
                const post = {
                  id: `ig_${item.id}`,
                  platform: 'instagram' as const,
                  type: item.media_type.toLowerCase() as 'photo' | 'video' | 'carousel' | 'reel',
                  mediaUrl: item.media_url,
                  thumbnailUrl: item.thumbnail_url,
                  caption: item.caption || '',
                  permalink: item.permalink,
                  timestamp: item.timestamp,
                  likes: item.like_count,
                  comments: item.comments_count,
                  shares: 0, // Instagram doesn't provide share count via API
                  isShoppable: false,
                  products: undefined,
                  hashtags: item.caption ? item.caption.match(/#\w+/g) || [] : [],
                  mentions: item.caption ? item.caption.match(/@\w+/g) || [] : []
                };

                // Filter by hashtags if specified
                if (hashtags.length === 0) {
                  posts.push(post);
                } else {
                  const postHashtags = post.hashtags as string[];
                  if (postHashtags && hashtags.some(tag => postHashtags.includes(`#${tag}`))) {
                    posts.push(post);
                  }
                }
              }
            }
          }
        } catch (err) {
          errors.push({ platform: 'instagram', error: (err as Error).message });
        }
      }
    }

    // Fetch Facebook posts if requested
    if (platforms.includes('facebook')) {
      const fbPageId = c.env.FB_PAGE_ID;
      const fbToken = c.env.FB_PAGE_TOKEN || c.env.IG_OEMBED_TOKEN; // Can use same token

      if (fbPageId && fbToken) {
        try {
          const fields = 'id,message,full_picture,permalink_url,created_time,likes.summary(true),comments.summary(true),shares';
          const graphUrl = new URL(`${graphBase(c.env)}/${fbPageId}/posts`);
          graphUrl.searchParams.append('fields', fields);
          graphUrl.searchParams.append('limit', limit.toString());
          const response = await fetch(graphUrl.toString(), {
            headers: { Authorization: `Bearer ${fbToken}` }
          });
          if (response.ok) {
            const data = await response.json() as { data?: Array<{
              id: string;
              message?: string;
              full_picture?: string;
              permalink_url: string;
              created_time: string;
              likes?: { summary: { total_count: number } };
              comments?: { summary: { total_count: number } };
              shares?: { count: number };
            }> };

            if (data.data) {
              for (const item of data.data) {
                const post = {
                  id: `fb_${item.id}`,
                  platform: 'facebook' as const,
                  type: 'photo' as const, // Simplified - would need additional logic for video detection
                  mediaUrl: item.full_picture || '',
                  thumbnailUrl: item.full_picture,
                  caption: item.message || '',
                  permalink: item.permalink_url,
                  timestamp: item.created_time,
                  likes: item.likes?.summary.total_count,
                  comments: item.comments?.summary.total_count,
                  shares: item.shares?.count,
                  isShoppable: false,
                  products: undefined,
                  hashtags: item.message ? item.message.match(/#\w+/g) || [] : [],
                  mentions: item.message ? item.message.match(/@\w+/g) || [] : []
                };

                // Filter by hashtags if specified
                if (hashtags.length === 0) {
                  posts.push(post);
                } else {
                  const postHashtags = post.hashtags as string[];
                  if (postHashtags && hashtags.some(tag => postHashtags.includes(`#${tag}`))) {
                    posts.push(post);
                  }
                }
              }
            }
          }
        } catch (err) {
          errors.push({ platform: 'facebook', error: (err as Error).message });
        }
      }
    }

  // Add shoppable data if requested (would integrate with Medusa)
  if (shoppable && posts.length > 0) {
      // Try Medusa storefront API first
      type MedusaProduct = { id: string; title: string; handle?: string; thumbnail?: string; variants?: Array<{ prices?: Array<{ amount: number; currency_code: string }> }> };
      let medusaProducts: MedusaProduct[] = [];
      if (c.env.MEDUSA_URL) {
        try {
          const base = c.env.MEDUSA_URL.replace(/\/$/, '');
          const res = await fetch(`${base}/store/products?limit=10`, { headers: { 'accept': 'application/json' } });
          if (res.ok) {
            const data = await res.json() as { products?: MedusaProduct[] };
            medusaProducts = data.products || [];
          }
        } catch {
          // ignore – fall back to demo data
        }
      }

      const pickPrice = (p: MedusaProduct): number => {
        const cents = p.variants?.[0]?.prices?.[0]?.amount;
        return typeof cents === 'number' ? Math.round(cents) / 100 : 39.99;
      };

      const toTagged = (p: MedusaProduct) => ({
        id: p.id,
        title: p.title,
        price: pickPrice(p),
        url: p.handle ? `/products#${p.handle}` : '/products'
      });

  const shoppablePosts = posts.slice(0, Math.min(3, posts.length));
  for (const post of shoppablePosts) {
    if (medusaProducts.length > 0) {
      // Simple mapping: try to match by hashtag to product title; else take first few
      const tags = (post.hashtags || []).map((h: string) => h.replace(/^#/, '').toLowerCase());
      const matched = medusaProducts.filter(p => tags.some((t: string) => p.title.toLowerCase().includes(t)));
      const chosen = (matched.length > 0 ? matched : medusaProducts).slice(0, 2);
      if (chosen.length > 0) {
        post.isShoppable = true;
        post.products = chosen.map((p) => toTagged(p));
      }
    }
  }
  }

    // Sort by timestamp (newest first)
    posts.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Limit results
    const limitedPosts = posts.slice(0, limit);

    return c.json({
      posts: limitedPosts,
      errors: errors.length > 0 ? errors : undefined,
      nextCursor: posts.length > limit ? posts[limit].id : null
    });
  } catch (error) {
    console.error('Social feed error:', error);
    return c.json({
      posts: [],
      error: 'Failed to fetch social feed'
    }, 500);
  }
});

// Get Instagram account insights
app.get('/api/instagram/insights', async (c) => {
  const igToken = c.env.IG_OEMBED_TOKEN;
  if (!igToken) {
    return c.json({
      error: 'not_configured',
      message: 'Instagram Graph API not configured'
    }, 501);
  }

  try {
    const igUserId = c.req.query('user_id') || c.env.IG_USER_ID || 'me';
    const metrics = c.req.query('metrics') || 'impressions,reach,profile_views';
    const period = c.req.query('period') || 'day';

    // Check cache
    const cacheKey = `ig_insights:${igUserId}:${metrics}:${period}`;
    const cached = await c.env.SESSIONS.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached), 200, {
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
        'X-Cache': 'HIT'
      });
    }

  // Fetch insights from Instagram Graph API
  const graphUrl = new URL(`${graphBase(c.env)}/${igUserId}/insights`);
  graphUrl.searchParams.append('metric', metrics);
  graphUrl.searchParams.append('period', period);

  const response = await fetch(graphUrl.toString(), {
    headers: { Authorization: `Bearer ${igToken}` }
  });
    if (!response.ok) {
      const error = await response.json() as { error: { message: string } };
      console.error('Instagram Insights API error:', error);
      return c.json({
        error: 'api_error',
        message: error.error?.message || 'Failed to fetch Instagram insights',
        details: error
      }, 500);
    }

    const data = await response.json() as { data: [] };

    // Cache for 1 hour
    await c.env.SESSIONS.put(
      cacheKey,
      JSON.stringify(data),
      { expirationTtl: 3600 }
    );

    return c.json(data, 200, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
      'X-Cache': 'MISS'
    });
  } catch (error) {
    console.error('Instagram insights handler error:', error);
    return c.json({
      error: 'internal_error',
      message: 'Failed to fetch Instagram insights'
    }, 500);
  }
});

// Helper: get IG Business account id/username for the token
app.get('/api/instagram/me', async (c) => {
  const token = (await getAppAccessToken(c.env)) || c.env.IG_OEMBED_TOKEN;
  if (!token) return c.json({ error: 'not_configured', message: 'Missing FB_APP_ID/FB_APP_SECRET or IG_OEMBED_TOKEN' }, 501);
  try {
    const url = new URL(`${graphBase(c.env)}/me`);
    url.searchParams.set('fields', 'id,username');
    const res = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json() as Record<string, unknown>;
    return new Response(JSON.stringify(json), {
      status: res.status,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  } catch (e) {
    return c.json({ error: 'failed_request', message: (e as Error).message }, 500);
  }
});

// Resolve IG Business Account ID linked to a Facebook Page
// Requires a Page Access Token with pages_show_list / pages_read_engagement
app.get('/api/instagram/linked-account', async (c) => {
  const pageId = c.req.query('page_id') || c.env.FB_PAGE_ID;
  const token = c.env.FB_PAGE_TOKEN || c.env.IG_OEMBED_TOKEN; // page token preferred
  if (!pageId || !token) {
    return c.json({ error: 'not_configured', message: 'Missing FB_PAGE_ID or FB_PAGE_TOKEN' }, 501);
  }
  try {
    const u = new URL(`${graphBase(c.env)}/${pageId}`);
    u.searchParams.set('fields', 'instagram_business_account{id,username}' );
    const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const json = await res.json() as Record<string, unknown>;
    return new Response(JSON.stringify(json), {
      status: res.status,
      headers: { 'content-type': 'application/json; charset=utf-8' }
    });
  } catch (e) {
    return c.json({ error: 'failed_request', message: (e as Error).message }, 500);
  }
});

// Health check for oEmbed configuration
// Usage: /api/health/oembed?url=<public_instagram_or_fb_url>
app.get('/api/health/oembed', async (c) => {
  const testUrl = c.req.query('url');
  if (!testUrl) return c.json({ ok: false, error: 'missing_url' }, 400);

  try {
    const appToken = await getAppAccessToken(c.env);
    const token = appToken || c.env.IG_OEMBED_TOKEN;
    if (!token) return c.json({ ok: false, error: 'missing_token', hint: 'Set FB_APP_ID/FB_APP_SECRET or IG_OEMBED_TOKEN' }, 501);

    const u = new URL(`${graphBase(c.env)}/instagram_oembed`);
    u.searchParams.set('url', testUrl);
    u.searchParams.set('omitscript', 'true');
    const res = await fetch(u.toString(), { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.text();
    const ok = res.ok;
    return c.json({ ok, status: res.status, body: ok ? undefined : body.slice(0, 400) });
  } catch (e) {
    return c.json({ ok: false, error: 'exception', message: (e as Error).message }, 500);
  }
});

// --- Events API + ICS feed ---
type EventItem = {
  id: string;
  slug: string;
  title: string;
  description?: string;
  flyerUrl?: string;
  startDateTime: string; // ISO
  endDateTime?: string | null;
  venueName?: string;
  address?: string;
  city?: string;
  region?: string;
  country?: string;
  latitude?: number | null;
  longitude?: number | null;
  ticketUrl?: string;
  rsvpUrl?: string;
  priceText?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
};

let eventsCache: { data: EventItem[]; exp: number } | null = null;
// Minimal built-in fallback so the site has an event banner when D1 is empty
const STATIC_EVENTS_FALLBACK: EventItem[] = [
  {
    id: 'reunion-12-chicago-2026',
    slug: 'reunion-12-chicago-2026',
    title: '12th Anniversary Reunion Concert',
    description: 'A special night with DJ Lee & The Voices of Judah celebrating 12 years of ministry.',
    flyerUrl: '/content/flyers/reunion-12-chicago-2026.jpg',
    startDateTime: '2026-01-10T18:00:00-06:00',
    endDateTime: '2026-01-10T21:00:00-06:00',
    venueName: 'TBD',
    address: '',
    city: 'Chicago',
    region: 'IL',
    country: 'US',
    latitude: null,
    longitude: null,
    ticketUrl: '',
    rsvpUrl: '',
    priceText: '',
    tags: ['concert'],
    status: 'published'
  }
];
async function loadEventsFromD1(c: { env: Env }): Promise<EventItem[] | null> {
  try {
    const db = c.env.DB;
    if (!db || typeof db.prepare !== 'function') return null;
    const sql = `SELECT id, slug, title, description, flyer_url as flyerUrl,
      start_time as startDateTime, end_time as endDateTime, venue_name as venueName,
      address, city, region, country, latitude, longitude, ticket_url as ticketUrl,
      rsvp_url as rsvpUrl, price_text as priceText, tags, status
      FROM events WHERE status = 'published' ORDER BY datetime(start_time) ASC`;
    const { results } = await db.prepare(sql).all();
    if (!results || results.length === 0) return [];
    return (results as Array<Record<string, unknown>>).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      slug: r.slug as string,
      title: r.title as string,
      description: (r.description as string) || undefined,
      flyerUrl: (r.flyerUrl as string) || undefined,
      startDateTime: r.startDateTime,
      endDateTime: r.endDateTime || undefined,
      venueName: r.venueName || undefined,
      address: r.address || undefined,
      city: r.city || undefined,
      region: r.region || undefined,
      country: r.country || undefined,
      latitude: typeof r.latitude === 'number' ? r.latitude : null,
      longitude: typeof r.longitude === 'number' ? r.longitude : null,
      ticketUrl: r.ticketUrl || undefined,
      rsvpUrl: r.rsvpUrl || undefined,
      priceText: r.priceText || undefined,
      tags: r.tags ? JSON.parse(r.tags as string) : [],
      status: r.status || 'published'
    })) as EventItem[];
  } catch {
    return null;
  }
}

async function loadEvents(c: { env: Env; req: { url: string } }): Promise<EventItem[]> {
  const now = Date.now();
  if (eventsCache && eventsCache.exp > now && (eventsCache.data?.length ?? 0) > 0) return eventsCache.data;
  // Prefer D1 if available
  const fromD1 = await loadEventsFromD1(c).catch(() => null);
  if (fromD1 && fromD1.length > 0) {
    eventsCache = { data: fromD1, exp: now + 5 * 60 * 1000 };
    return fromD1;
  }
  // Fallback to baked-in static events (cannot fetch assets from within Worker reliably)
  const json = STATIC_EVENTS_FALLBACK;
  const sorted = [...json].sort((a, b) => new Date(a.startDateTime).getTime() - new Date(b.startDateTime).getTime());
  eventsCache = { data: sorted, exp: now + 5 * 60 * 1000 };
  return sorted;
}

app.get('/api/events', async (c) => {
  const items = await loadEvents(c);
  const now = Date.now();
  const published = items.filter(e => (e.status ?? 'published') === 'published');
  const upcoming = published.filter(e => new Date(e.endDateTime || e.startDateTime).getTime() >= now);
  const past = published.filter(e => new Date(e.endDateTime || e.startDateTime).getTime() < now).reverse();
  return c.json({ upcoming, past, total: published.length });
});

// Temporary debug endpoint to verify static events accessibility from within Worker
app.get('/api/debug/events-source', async (c) => {
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  try {
    const url = new URL('/content/events.json', c.req.url).toString();
    const res = await fetch(url);
    const body = await res.text();
    return c.json({ ok: res.ok, status: res.status, length: body.length, sample: body.slice(0, 120), url });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message });
  }
});

// --- Admin: Import events into D1 (from body or external URL) ---
app.post('/api/admin/events/import', async (c) => {
  const token = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  try {
    const db = c.env.DB;
    if (!db || typeof db.prepare !== 'function') return c.json({ error: 'd1_not_configured' }, 501);
    const mediaBucket = c.env.MEDIA_BUCKET;
    const userAssets = c.env.USER_ASSETS;
    const bucket = mediaBucket || userAssets;

    const body = await c.req.json<{ url?: string; events?: EventItem[]; replace?: boolean; uploadFlyersToR2?: boolean }>();
    let list: EventItem[] | null = null;

    if (Array.isArray(body?.events) && body.events.length > 0) {
      list = body.events as EventItem[];
    } else if (body?.url) {
      // Only allow external URLs (not the same worker host), since internal asset fetch won't work
      try {
        const u = new URL(body.url);
        const self = new URL(c.req.url);
        if (u.host === self.host) {
          return c.json({ error: 'invalid_source', message: 'Use an external URL or provide events array directly.' }, 400);
        }
        const res = await fetch(u.toString(), { headers: { 'accept': 'application/json' } });
        if (!res.ok) return c.json({ error: 'source_fetch_failed', status: res.status }, 400);
        list = await res.json() as EventItem[];
      } catch (e) {
        return c.json({ error: 'bad_source', message: (e as Error).message }, 400);
      }
    } else {
      list = STATIC_EVENTS_FALLBACK;
    }

    if (!Array.isArray(list) || list.length === 0) return c.json({ imported: 0, message: 'no events found' });

    // Optionally clear table first
    if (body?.replace) {
      await db.prepare('DELETE FROM events').run();
    }

    let uploaded = 0;
    let upserts = 0;
    const base = (c.env.R2_PUBLIC_BASE && c.env.R2_PUBLIC_BASE.trim()) || (mediaBucket ? 'https://r2.thevoicesofjudah.com' : '');
    const wantR2 = !!body?.uploadFlyersToR2 && bucket && typeof bucket.put === 'function' && base;

    for (const ev of list) {
      let flyerUrl = ev.flyerUrl || (ev as Record<string, unknown>).flyer_url as string || '';
      // Upload flyer to R2 if requested and flyerUrl is http(s) or relative
      if (wantR2 && flyerUrl) {
        try {
          const absolute = /^https?:\/\//i.test(flyerUrl) ? flyerUrl : new URL(flyerUrl, c.req.url).toString();
          const r = await fetch(absolute);
          if (r.ok) {
            const ct = r.headers.get('content-type') || 'image/jpeg';
            const key = `events/${(ev.slug || ev.id).replace(/[^a-z0-9_-]/gi,'-')}/${crypto.randomUUID()}`;
            const buf = await r.arrayBuffer();
            await bucket.put(key, buf, { httpMetadata: { contentType: ct, cacheControl: 'public, max-age=31536000' } });
            flyerUrl = `${String(base).replace(/\/$/, '')}/${key}`;
            uploaded++;
          }
        } catch { /* ignore upload errors; keep original flyerUrl */ }
      }

      const id = ev.id || crypto.randomUUID();
      const slug = (ev.slug || id).toLowerCase();
      const start = ev.startDateTime;
      const end = ev.endDateTime || null;
      const insert = await db.prepare(`INSERT OR REPLACE INTO events (
        id, slug, title, description, flyer_url, start_time, end_time,
        venue_name, address, city, region, country, latitude, longitude,
        ticket_url, rsvp_url, price_text, tags, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, strftime('%Y-%m-%dT%H:%M:%fZ','now'), strftime('%Y-%m-%dT%H:%M:%fZ','now'))`).bind(
        id,
        slug,
        ev.title,
        ev.description || null,
        flyerUrl || null,
        start,
        end,
        ev.venueName || null,
        ev.address || null,
        ev.city || null,
        ev.region || 'IL',
        ev.country || 'US',
        typeof ev.latitude === 'number' ? ev.latitude : null,
        typeof ev.longitude === 'number' ? ev.longitude : null,
        ev.ticketUrl || null,
        ev.rsvpUrl || null,
        ev.priceText || null,
        JSON.stringify(ev.tags || []),
        ev.status || 'published'
      ).run();
      if ((insert as { success?: boolean })?.success !== false) upserts++;
    }

    // Invalidate cache
    eventsCache = null;
    return c.json({ imported: list.length, upserts, uploadedToR2: uploaded, usedR2: Boolean(wantR2) });
  } catch (e) {
    return c.json({ error: 'bad_request', message: (e as Error).message }, 400);
  }
});

function toICSDate(dt: string): string {
  const d = new Date(dt);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
}

function buildICS(events: EventItem[], origin: string): string {
  const lines: string[] = [];
  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//DJ Judas//Events//EN');
  for (const ev of events) {
    const uid = `${ev.slug}@${new URL(origin).host}`;
    const start = toICSDate(ev.startDateTime);
    const end = toICSDate(ev.endDateTime || ev.startDateTime);
    const url = new URL("/#events", origin).toString();
    const loc = [ev.venueName, ev.address, ev.city, ev.region].filter(Boolean).join(', ');
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTAMP:${toICSDate(new Date().toISOString())}`);
    lines.push(`DTSTART:${start}`);
    lines.push(`DTEND:${end}`);
    lines.push(`SUMMARY:${(ev.title || '').replace(/\n/g, ' ')}`);
    if (loc) lines.push(`LOCATION:${loc.replace(/\n/g, ' ')}`);
    if (ev.description) lines.push(`DESCRIPTION:${ev.description.replace(/\n/g, ' ')}`);
    lines.push(`URL:${url}`);
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

app.get('/events.ics', async (c) => {
  const items = await loadEvents(c);
  const now = Date.now();
  const upcoming = items.filter(e => (e.status ?? 'published') === 'published').filter(e => new Date(e.endDateTime || e.startDateTime).getTime() >= now).slice(0, 50);
  const ics = buildICS(upcoming, c.req.url);
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': 'attachment; filename="events.ics"' } });
});

app.get('/events/:slug.ics', async (c) => {
  const slug = c.req.param('slug');
  const items = await loadEvents(c);
  const match = items.find(e => e.slug === slug);
  if (!match) return c.text('Not Found', 404);
  const ics = buildICS([match], c.req.url);
  return new Response(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Content-Disposition': `attachment; filename="${slug}.ics"` } });
});

// Facebook Events proxy (Graph API) with graceful fallback
app.get('/api/facebook/events', async (c) => {
  try {
    const pageId = c.req.query('page_id') || c.env.FB_PAGE_ID;
    const token = c.env.FB_PAGE_TOKEN || c.env.IG_OEMBED_TOKEN;
    const includePast = c.req.query('include_past') === 'true';
    const limit = parseInt(c.req.query('limit') || '10');

    // If not configured, instruct client to use demo or local fallback
    if (!pageId || !token) {
      return c.json({ error: 'not_configured', message: 'Facebook Events API not configured' }, 501);
    }

    // Try cache first (if KV bound in this environment)
    const cacheKey = `fb_events:${pageId}:${includePast ? 'all' : 'upcoming'}:${limit}`;
    try {
      const cached = await (c.env.SESSIONS as KVNamespace | undefined)?.get?.(cacheKey);
      if (cached) {
        return c.json(JSON.parse(cached), 200, { 'Cache-Control': 'public, max-age=300', 'X-Cache': 'HIT' });
      }
    } catch {
      // Ignore cache read errors
    }

    // Build Graph API request
    const graphUrl = new URL(`${graphBase(c.env)}/${pageId}/events`);
    graphUrl.searchParams.set('time_filter', includePast ? 'all' : 'upcoming');
    graphUrl.searchParams.set('limit', String(Math.min(Math.max(limit, 1), 50)));
    graphUrl.searchParams.set(
      'fields',
      [
        'id',
        'name',
        'description',
        'start_time',
        'end_time',
        'place{ name, location{ city, country, latitude, longitude, street, zip } }',
        'is_online',
        'is_canceled',
        'ticket_uri',
        'interested_count',
        'attending_count',
        'cover{ source }',
        'event_times'
      ].join(',')
    );
    const fbRes = await fetch(graphUrl.toString(), {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!fbRes.ok) {
      const error = await fbRes.json().catch(() => ({}));
      console.error('Facebook Events API error:', error);
      return c.json({ error: 'facebook_api_error', details: error }, 502);
    }

    const payload = await fbRes.json() as { data?: FacebookEvent[] };
    const events = (payload.data || []).map((ev) => ({
      id: ev.id,
      name: ev.name,
      description: ev.description,
      startTime: ev.start_time,
      endTime: ev.end_time,
      place: ev.place ? { name: ev.place.name, location: ev.place.location } : undefined,
      coverPhoto: ev.cover?.source,
      eventUrl: `https://facebook.com/events/${ev.id}`,
      isOnline: !!ev.is_online,
      ticketUri: ev.ticket_uri,
      interestedCount: ev.interested_count,
      attendingCount: ev.attending_count,
      isCanceled: !!ev.is_canceled,
      category: undefined
    }));

    const result = { events };
    try {
      await (c.env.SESSIONS as KVNamespace | undefined)?.put?.(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
    } catch {
      // Ignore cache write errors
    }
    return c.json(result, 200, { 'Cache-Control': 'public, max-age=300', 'X-Cache': 'MISS' });
  } catch (err) {
    console.error('facebook_events_handler_error', err);
    return c.json({ error: 'internal_error' }, 500);
  }
});

/* ═══════════════════════════════════════════════════════════════════════
 * GALLERY PHOTO MANAGEMENT (R2 + D1)
 * ═══════════════════════════════════════════════════════════════════════ */

// --- Public: List all published gallery photos ---
app.get('/api/gallery', async (c) => {
  const db = c.env.DB;
  if (!db || typeof db.prepare !== 'function') return c.json({ error: 'd1_not_configured' }, 501);

  try {
    const { results } = await db
      .prepare(`
        SELECT id, src, alt, caption, category, sort_order, width, height
        FROM gallery_photos
        WHERE is_published = 1
        ORDER BY sort_order ASC, created_at DESC
      `)
      .all();

    return c.json({ photos: results || [] });
  } catch (error) {
    return c.json({ error: 'query_failed', message: (error as Error).message }, 500);
  }
});

// --- Admin: List all gallery photos (including drafts) ---
app.get('/api/admin/gallery', async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!admin) return c.json({ error: 'unauthorized' }, 401);

  const db = c.env.DB;
  if (!db || typeof db.prepare !== 'function') return c.json({ error: 'd1_not_configured' }, 501);

  try {
    const { results } = await db
      .prepare(`
        SELECT id, r2_key, src, alt, caption, category, sort_order, is_published,
               width, height, file_size, created_at, updated_at
        FROM gallery_photos
        ORDER BY sort_order ASC, created_at DESC
      `)
      .all();

    return c.json({ photos: results || [] });
  } catch (error) {
    return c.json({ error: 'query_failed', message: (error as Error).message }, 500);
  }
});

// --- Admin: Get single gallery photo ---
app.get('/api/admin/gallery/:id', async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!admin) return c.json({ error: 'unauthorized' }, 401);

  const db = c.env.DB;
  if (!db || typeof db.prepare !== 'function') return c.json({ error: 'd1_not_configured' }, 501);

  const id = c.req.param('id');

  try {
    const { results } = await db
      .prepare(`SELECT * FROM gallery_photos WHERE id = ?`)
      .bind(id)
      .all();

    const photo = results?.[0];
    if (!photo) return c.json({ error: 'not_found' }, 404);

    return c.json({ photo });
  } catch (error) {
    return c.json({ error: 'query_failed', message: (error as Error).message }, 500);
  }
});

// --- Admin: Create new gallery photo (upload to R2) ---
app.post('/api/admin/gallery', async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!admin) return c.json({ error: 'unauthorized' }, 401);

  const db = c.env.DB;
  if (!db || typeof db.prepare !== 'function') return c.json({ error: 'd1_not_configured' }, 501);

  const mediaBucket = c.env.MEDIA_BUCKET;
  const bucket = mediaBucket || c.env.USER_ASSETS;
  if (!bucket || typeof bucket.put !== 'function') return c.json({ error: 'r2_not_configured' }, 501);

  try {
    const body = await c.req.json<{
      url: string;
      alt: string;
      caption: string;
      category: string;
      is_published?: boolean;
      width?: number;
      height?: number;
    }>();

    if (!body.url || !body.alt || !body.caption || !body.category) {
      return c.json({ error: 'missing_fields' }, 400);
    }

    // Fetch the image
    const upstream = await fetch(body.url);
    if (!upstream.ok) return c.json({ error: 'fetch_failed', status: upstream.status }, 400);
    if (!upstream.body) return c.json({ error: 'no_body' }, 400);

    // Validate content type (only allow images)
    const ct = upstream.headers.get('content-type') || '';
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.some(type => ct.toLowerCase().includes(type))) {
      return c.json({
        error: 'invalid_file_type',
        message: `Only image files are allowed. Received: ${ct}`,
        allowed: allowedTypes
      }, 400);
    }

    // Validate file size (max 10MB)
    const contentLength = upstream.headers.get('content-length');
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (contentLength && parseInt(contentLength, 10) > maxSize) {
      return c.json({
        error: 'file_too_large',
        message: `File size exceeds 10MB limit. Size: ${(parseInt(contentLength, 10) / 1024 / 1024).toFixed(2)}MB`,
        max_size_mb: 10
      }, 400);
    }

    const id = crypto.randomUUID();
    const r2Key = `gallery/${id}.${ct.includes('png') ? 'png' : ct.includes('webp') ? 'webp' : ct.includes('gif') ? 'gif' : 'jpg'}`;

    // TODO: Image Optimization
    // Consider adding automatic image optimization:
    // 1. Resize to maximum dimensions (e.g., 1920x1080 for web display)
    // 2. Compress to reduce file size while maintaining quality
    // 3. Generate multiple sizes/variants for responsive loading
    // Options: Cloudflare Images, sharp library, or Workers AI image processing

    // Get max sort_order
    const { results: maxResults } = await db
      .prepare(`SELECT COALESCE(MAX(sort_order), 0) as max_order FROM gallery_photos`)
      .all();
    const maxOrder = (maxResults?.[0] as { max_order: number })?.max_order || 0;

    // ✅ Stream upload to R2
    const result = await bucket.put(r2Key, upstream.body, {
      httpMetadata: {
        contentType: ct,
        cacheControl: 'public, max-age=31536000'
      },
      customMetadata: {
        uploadedBy: 'admin',
        uploadedAt: new Date().toISOString(),
        alt: body.alt,
        category: body.category,
        source: 'gallery-upload'
      }
    });

    const base = (c.env.R2_PUBLIC_BASE && c.env.R2_PUBLIC_BASE.trim()) || (mediaBucket ? 'https://r2.thevoicesofjudah.com' : '');
    const src = base ? `${base.replace(/\/$/, '')}/${r2Key}` : r2Key;

    // Insert into D1
    await db
      .prepare(`
        INSERT INTO gallery_photos (id, r2_key, src, alt, caption, category, sort_order, is_published, width, height, file_size, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        id,
        r2Key,
        src,
        body.alt,
        body.caption,
        body.category,
        maxOrder + 1,
        body.is_published !== false ? 1 : 0,
        body.width || null,
        body.height || null,
        result.size,
        new Date().toISOString(),
        new Date().toISOString()
      )
      .run();

    return c.json({
      ok: true,
      photo: {
        id,
        r2_key: r2Key,
        src,
        alt: body.alt,
        caption: body.caption,
        category: body.category,
        sort_order: maxOrder + 1,
        is_published: body.is_published !== false ? 1 : 0,
        width: body.width || null,
        height: body.height || null,
        file_size: result.size,
        r2: {
          etag: result.etag,
          uploaded: result.uploaded.toISOString()
        }
      }
    });
  } catch (error) {
    return c.json({ error: 'create_failed', message: (error as Error).message }, 500);
  }
});

// --- Admin: Reorder gallery photos ---
// NOTE: This must come BEFORE /api/admin/gallery/:id to avoid route conflict
app.patch('/api/admin/gallery/reorder', async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!admin) return c.json({ error: 'unauthorized' }, 401);

  const db = c.env.DB;
  if (!db || typeof db.prepare !== 'function') return c.json({ error: 'd1_not_configured' }, 501);

  try {
    const body = await c.req.json<{ order: { id: string; sort_order: number }[] }>();

    if (!Array.isArray(body.order)) {
      return c.json({ error: 'invalid_order' }, 400);
    }

    // Update all in a batch
    for (const item of body.order) {
      await db
        .prepare(`UPDATE gallery_photos SET sort_order = ?, updated_at = ? WHERE id = ?`)
        .bind(item.sort_order, new Date().toISOString(), item.id)
        .run();
    }

    return c.json({ ok: true, updated: body.order.length });
  } catch (error) {
    return c.json({ error: 'reorder_failed', message: (error as Error).message }, 500);
  }
});

// --- Admin: Update gallery photo metadata ---
app.patch('/api/admin/gallery/:id', async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!admin) return c.json({ error: 'unauthorized' }, 401);

  const db = c.env.DB;
  if (!db || typeof db.prepare !== 'function') return c.json({ error: 'd1_not_configured' }, 501);

  const id = c.req.param('id');

  try {
    const body = await c.req.json<{
      alt?: string;
      caption?: string;
      category?: string;
      is_published?: boolean;
      sort_order?: number;
    }>();

    const updates: string[] = [];
    const bindings: (string | number)[] = [];

    if (body.alt !== undefined) {
      updates.push('alt = ?');
      bindings.push(body.alt);
    }
    if (body.caption !== undefined) {
      updates.push('caption = ?');
      bindings.push(body.caption);
    }
    if (body.category !== undefined) {
      updates.push('category = ?');
      bindings.push(body.category);
    }
    if (body.is_published !== undefined) {
      updates.push('is_published = ?');
      bindings.push(body.is_published ? 1 : 0);
    }
    if (body.sort_order !== undefined) {
      updates.push('sort_order = ?');
      bindings.push(body.sort_order);
    }

    if (updates.length === 0) {
      return c.json({ error: 'no_updates' }, 400);
    }

    updates.push(`updated_at = ?`);
    bindings.push(new Date().toISOString());
    bindings.push(id);

    await db
      .prepare(`UPDATE gallery_photos SET ${updates.join(', ')} WHERE id = ?`)
      .bind(...bindings)
      .run();

    // Fetch updated photo
    const { results } = await db
      .prepare(`SELECT * FROM gallery_photos WHERE id = ?`)
      .bind(id)
      .all();

    return c.json({ ok: true, photo: results?.[0] || null });
  } catch (error) {
    return c.json({ error: 'update_failed', message: (error as Error).message }, 500);
  }
});

// --- Admin: Delete gallery photo (remove from R2 + D1) ---
app.delete('/api/admin/gallery/:id', async (c) => {
  const admin = getAdminTokenFromCookie(c.req.header('Cookie') || null);
  if (!admin) return c.json({ error: 'unauthorized' }, 401);

  const db = c.env.DB;
  if (!db || typeof db.prepare !== 'function') return c.json({ error: 'd1_not_configured' }, 501);

  const mediaBucket = c.env.MEDIA_BUCKET;
  const bucket = mediaBucket || c.env.USER_ASSETS;
  if (!bucket || typeof bucket.delete !== 'function') return c.json({ error: 'r2_not_configured' }, 501);

  const id = c.req.param('id');

  try {
    // Get photo details
    const { results } = await db
      .prepare(`SELECT * FROM gallery_photos WHERE id = ?`)
      .bind(id)
      .all();

    const photo = results?.[0] as { r2_key: string } | undefined;
    if (!photo) return c.json({ error: 'not_found' }, 404);

    // Delete from R2
    await bucket.delete(photo.r2_key);

    // Delete from D1
    await db.prepare(`DELETE FROM gallery_photos WHERE id = ?`).bind(id).run();

    return c.json({ ok: true, deleted: id });
  } catch (error) {
    return c.json({ error: 'delete_failed', message: (error as Error).message }, 500);
  }
});
