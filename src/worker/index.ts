import { Hono } from "hono";
import { SignJWT, importPKCS8 } from 'jose';
import { socialMetricsApp } from './social-metrics';

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
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM?: string;
  SENDGRID_TO?: string;
  STRIPE_SECRET?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  SITE_URL?: string;
  MEDUSA_URL?: string; // Base URL to Medusa backend for admin proxy
  CF_IMAGES_ACCOUNT_ID?: string;
  CF_IMAGES_API_TOKEN?: string;
  CF_IMAGES_VARIANT?: string; // e.g., 'public'
  OPENAI_API_KEY?: string;
  AI?: {
    run: (model: string, options: { prompt: string; image?: Uint8Array[] }) => Promise<{ output?: string; response?: string; text?: string }>;
  }; // Workers AI binding
}
const app = new Hono<{ Bindings: Env }>();

// Mount social metrics routes
app.route('/', socialMetricsApp);

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
	// Check cache first (guard if KV not bound in local dev build)
	const cacheKey = 'social_metrics:aggregate';
	let kvGet: ((key: string) => Promise<string | null>) | null = null;
	let kvPut: ((key: string, value: string, opts?: { expirationTtl?: number }) => Promise<void>) | null = null;
	try {
		const kv = (c.env as unknown as { SESSIONS?: KVNamespace })?.SESSIONS;
		kvGet = kv?.get?.bind(kv) ?? null;
		kvPut = kv?.put?.bind(kv) ?? null;
	} catch {
		// KV not available in local dev
	}

	if (kvGet) {
		try {
			const cached = await kvGet(cacheKey);
			if (cached) {
				return c.json(JSON.parse(cached), 200, {
					'Cache-Control': 'public, max-age=900',
					'X-Cache': 'HIT'
				});
			}
		} catch {
			// Ignore cache read errors
		}
	}

	const metrics = {
		totalReach: 0,
		platforms: [] as Array<{
			id: string;
			name: string;
			followers: number;
			engagement: number;
			lastUpdated: string;
		}>,
		topConversionSource: 'instagram'
	};

    // Fetch Instagram metrics if token available
    if (c.env.IG_OEMBED_TOKEN || (c.env.FB_APP_ID && c.env.FB_APP_SECRET)) {
      try {
        // This would typically use Instagram Business Account ID
        // For now, we'll use a placeholder approach
        const igUserId = c.env.IG_USER_ID || '17841400000000000';
        const url = new URL(`${graphBase(c.env)}/${igUserId}`);
        url.searchParams.set('fields', 'followers_count,media_count,name');
        const bearer = (await getAppAccessToken(c.env)) || c.env.IG_OEMBED_TOKEN as string;
        const igResponse = await fetch(url.toString(), bearer ? { headers: { Authorization: `Bearer ${bearer}` } } : undefined).catch(() => null);

			if (igResponse && igResponse.ok) {
				const igData = await igResponse.json() as { followers_count?: number; media_count?: number };
				const followers = typeof igData.followers_count === 'number' ? igData.followers_count : 0;
				metrics.platforms.push({
					id: 'instagram',
					name: 'Instagram',
					followers,
					engagement: 12.3, // Would calculate from insights API
					lastUpdated: new Date().toISOString()
				});
				metrics.totalReach += followers;
			}
		} catch (error) {
			console.error('Failed to fetch Instagram metrics:', error);
		}
	} else {
		// Instagram metrics not configured; skipping.
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
					metrics.platforms.push({
						id: 'spotify',
						name: 'Spotify',
						followers,
						engagement,
						lastUpdated: new Date().toISOString()
					});
					metrics.totalReach += followers;
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
				metrics.platforms.push({
					id: 'facebook',
					name: 'Facebook',
					followers,
					engagement: 0,
					lastUpdated: new Date().toISOString()
				});
				metrics.totalReach += followers;
			}
		}
	} catch (e) {
		console.error('Failed to fetch Facebook metrics:', e);
	}

	// Determine top conversion source based on engagement
	if (metrics.platforms.length > 0) {
		const topPlatform = metrics.platforms.reduce((prev, current) =>
			prev.engagement > current.engagement ? prev : current
		);
		metrics.topConversionSource = topPlatform.id;
	}

	// Cache for 15 minutes if KV available
	try {
		if (kvPut) {
			await kvPut(cacheKey, JSON.stringify(metrics), { expirationTtl: 900 });
		}
	} catch {
		// Ignore cache write errors
	}

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

		c.header('Set-Cookie', `spotify_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`);
		return c.json({ success: true });
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

// Apple Developer Token (ES256). Cache in memory until near expiry.
let cachedAppleToken: { token: string; exp: number } | null = null;
app.get('/api/apple/developer-token', async (c) => {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAppleToken && cachedAppleToken.exp - 60 > now) {
    return c.json({ token: cachedAppleToken.token, cached: true });
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
    const privateKeyPem = privateKey.replace(/\\n/g, '\n');
    const alg = 'ES256';
    const iat = now;
    const exp = iat + 60 * 60 * 12; // 12h validity (max 6 months allowed; keep shorter)
    const pk = await importPKCS8(privateKeyPem, alg);
    const token = await new SignJWT({})
      .setProtectedHeader({ alg, kid: keyId })
      .setIssuedAt(iat)
      .setExpirationTime(exp)
      .setIssuer(teamId)
      .sign(pk);
    cachedAppleToken = { token, exp };
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
	if (!session.refreshToken || !c.env.SPOTIFY_CLIENT_ID) return null;

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

		if (!res.ok) return null;

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

		return session;
	} catch {
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
    const now = Date.now();
    const bucket = rateMap.get(ip);
    if (!bucket || bucket.reset < now) {
      rateMap.set(ip, { count: 1, reset: now + 60_000 });
    } else if (bucket.count > 10) {
      return c.json({ error: 'rate_limited', message: 'Too many requests. Please try again in a minute.' }, 429);
    } else {
      bucket.count += 1;
    }

    const body = await c.req.json<{
      name: string;
      email: string;
      phone: string;
      eventType: string;
      eventDate: string;
      eventTime: string;
      location: string;
      message?: string;
      website?: string; // honeypot
    }>();

    // Honeypot: if present, reject silently
    if (body.website && String(body.website).trim() !== '') {
      return c.json({ ok: true, ignored: true });
    }

    const required = ['name','email','phone','eventType','eventDate','eventTime','location'] as const;
    for (const k of required) {
      if (!body[k] || String(body[k]).trim() === '') {
        return c.json({ error: `missing_${k}` }, 400);
      }
    }

    // Normalize and validate fields
    const email = String(body.email).trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return c.json({ error: 'invalid_email' }, 400);
    }

    // Phone: strip non-digits except leading + and basic length check
    const phoneRaw = String(body.phone).trim();
    const phone = phoneRaw.replace(/(?!^\+)\D+/g, '');
    if (phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) {
      return c.json({ error: 'invalid_phone' }, 400);
    }

    const eventTypes = new Set(['worship','concert','wedding','funeral','conference','community','other']);
    if (!eventTypes.has(String(body.eventType))) {
      return c.json({ error: 'invalid_event_type' }, 400);
    }

    // Date/time sanity: require future time in UTC comparison
    const isoDate = String(body.eventDate);
    const isoTime = String(body.eventTime);
    const eventDateTime = new Date(`${isoDate}T${isoTime}`);
    if (Number.isNaN(eventDateTime.getTime())) {
      return c.json({ error: 'invalid_datetime' }, 400);
    }
    if (eventDateTime.getTime() < Date.now()) {
      return c.json({ error: 'datetime_in_past' }, 400);
    }

    // Bounds
    const name = String(body.name).trim().slice(0, 100);
    const location = String(body.location).trim().slice(0, 200);
    const message = (body.message ? String(body.message) : '').trim().slice(0, 2000);

    const summary = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone}`,
      `Event Type: ${body.eventType}`,
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
          subject: `Booking Request: ${body.eventType} on ${isoDate}`,
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
          subject: `Booking Request: ${body.eventType} on ${isoDate}`,
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

    // Create cache key from parameters
    const cacheKey = `ig:${url}:${maxwidth || ''}:${omitscript || ''}:${hidecaption || ''}`;

    // Check KV cache first
    const cached = await c.env.SESSIONS.get(cacheKey);
    if (cached) {
      const data = JSON.parse(cached) as OEmbedJSON;
      return c.json(data, 200, {
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

          // Cache in KV for 1 hour
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

    // Cache successful response in KV for 1 hour
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

    // Check cache first
    const cacheKey = `ig_media:${igUserId}:${limit}:${fields}`;
    const cached = await c.env.SESSIONS.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached), 200, {
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

    // Cache for 15 minutes
    await c.env.SESSIONS.put(
      cacheKey,
      JSON.stringify(data),
      { expirationTtl: 900 }
    );

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
        post.isShoppable = true;
        if (medusaProducts.length > 0) {
          // Simple mapping: try to match by hashtag to product title; else take first few
          const tags = (post.hashtags || []).map((h: string) => h.replace(/^#/, '').toLowerCase());
          const matched = medusaProducts.filter(p => tags.some((t: string) => p.title.toLowerCase().includes(t)));
          const chosen = (matched.length > 0 ? matched : medusaProducts).slice(0, 2);
          post.products = chosen.map((p) => toTagged(p));
        } else {
          // Fallback demo product
          post.products = [
            {
              id: 'prod_demo_1',
              title: 'Limited Edition Vinyl',
              price: 39.99,
              url: '/products'
            }
          ];
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
async function loadEvents(c: { env: Env; req: { url: string } }): Promise<EventItem[]> {
  const now = Date.now();
  if (eventsCache && eventsCache.exp > now) return eventsCache.data;
  const url = new URL('/content/events.json', c.req.url).toString();
  const res = await fetch(url, {});
  if (!res.ok) return [];
  const json = await res.json() as EventItem[];
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
