import { Hono } from "hono";
import { SignJWT, importPKCS8 } from 'jose';
import Stripe from 'stripe';

interface SpotifySession {
	codeVerifier: string;
	accessToken?: string;
	refreshToken?: string;
	expiresAt?: number;
}

const pkceStore: Map<string, SpotifySession> = new Map();

interface Env {
	SPOTIFY_CLIENT_ID: string;
	APPLE_TEAM_ID: string;
	APPLE_KEY_ID: string;
	APPLE_PRIVATE_KEY: string; // PKCS8 format without surrounding quotes
  IG_OEMBED_TOKEN?: string; // Facebook App access token for Instagram oEmbed
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

app.get("/api/", (c) => c.json({ name: "Cloudflare" }));

// Mock aggregated social metrics endpoint (replace with real data source later)
app.get('/api/metrics', (c) => {
	return c.json({
		totalReach: 15000,
		platforms: [
			{ id: 'facebook', name: 'Facebook', followers: 1600, engagement: 8.5, lastUpdated: new Date().toISOString() },
			{ id: 'instagram', name: 'Instagram', followers: 2300, engagement: 12.3, lastUpdated: new Date().toISOString() },
			{ id: 'spotify', name: 'Spotify', followers: 850, engagement: 45.2, lastUpdated: new Date().toISOString() }
		],
		topConversionSource: 'instagram'
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
		const clientId = c.env.SPOTIFY_CLIENT_ID;
	const redirectUri = c.req.url.replace(/\/api\/spotify\/login.*/, '/api/spotify/callback');
	const state = randomString(12);
	const codeVerifier = randomString(64);
	const challenge = base64UrlEncode(await sha256(codeVerifier));

	pkceStore.set(state, { codeVerifier });

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
	const url = new URL(c.req.url);
	const code = url.searchParams.get('code');
	const state = url.searchParams.get('state');
	if (!code || !state) return c.json({ error: 'missing_code_or_state' }, 400);
	const session = pkceStore.get(state);
	if (!session) return c.json({ error: 'invalid_state' }, 400);

	const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			grant_type: 'authorization_code',
			code,
			redirect_uri: url.origin + '/api/spotify/callback',
			client_id: c.env.SPOTIFY_CLIENT_ID,
			code_verifier: session.codeVerifier
		})
	});
	if (!tokenRes.ok) {
		return c.json({ error: 'token_exchange_failed', status: tokenRes.status }, 500);
	}
		const tokenJson = await tokenRes.json() as { access_token: string; refresh_token?: string; expires_in: number };
		session.accessToken = tokenJson.access_token;
		session.refreshToken = tokenJson.refresh_token;
		session.expiresAt = Date.now() + tokenJson.expires_in * 1000;
	const sessionId = state; // use state as session id
		c.header('Set-Cookie', `spotify_session=${sessionId}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${60 * 60 * 24}`);
		return c.json({ success: true });
});

// Session status
app.get('/api/spotify/session', (c) => {
	const cookie = c.req.header('Cookie') || '';
	const match = cookie.match(/spotify_session=([^;]+)/);
	if (!match) return c.json({ authenticated: false });
	const session = pkceStore.get(match[1]);
	if (!session || !session.accessToken) return c.json({ authenticated: false });
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
			message: 'Apple Music developer token not configured. Please set up APPLE_TEAM_ID, APPLE_KEY_ID, and APPLE_PRIVATE_KEY environment variables.'
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
			message: 'Failed to generate Apple Music developer token'
		}, 500);
	}
});

function getSessionFromCookie(cookieHeader: string | null): SpotifySession | null {
	if (!cookieHeader) return null;
	const match = cookieHeader.match(/spotify_session=([^;]+)/);
	if (!match) return null;
	const session = pkceStore.get(match[1]);
	if (!session || !session.accessToken) return null;
	if (session.expiresAt && session.expiresAt < Date.now()) return null;
	return session;
}

// Save track/album (simplified: expects body { ids: string[], type: 'tracks'|'albums' })
app.post('/api/spotify/save', async (c) => {
		const session = getSessionFromCookie(c.req.header('Cookie') ?? null);
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
		const session = getSessionFromCookie(c.req.header('Cookie') ?? null);
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

    // Prefer Resend if configured
    const toResend = c.env.RESEND_TO || 'V.O.J@icloud.com';
    const fromResend = c.env.RESEND_FROM || 'DJ Lee Website <no-reply@djlee.local>';
    if (c.env.RESEND_API_KEY) {
      const res = await fetch('https://api.resend.com/emails', {
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
      if (res.ok) {
        return c.json({ ok: true, provider: 'resend' });
      }
      // fall through to SendGrid if available
    }

    // Fallback: SendGrid
    if (c.env.SENDGRID_API_KEY) {
      const to = c.env.SENDGRID_TO || 'V.O.J@icloud.com';
      const from = c.env.SENDGRID_FROM || 'no-reply@djlee.local';
      const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
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
      if (!res.ok) {
        return c.json({ error: 'email_send_failed', provider: 'sendgrid', status: res.status }, 500);
      }
      return c.json({ ok: true, provider: 'sendgrid' });
    }

    // If no provider configured, instruct client to fallback
    return c.json({ ok: false, error: 'no_email_provider' }, 501);
  } catch {
    return c.json({ error: 'invalid_request' }, 400);
  }
});

// --- Stripe Checkout (optional handoff) ---
app.post('/api/stripe/checkout', async (c) => {
  if (!c.env.STRIPE_SECRET) return c.json({ error: 'not_configured' }, 501);
  const stripe = new Stripe(c.env.STRIPE_SECRET, {
    apiVersion: '2025-08-27.basil',
    httpClient: Stripe.createFetchHttpClient(),
  });
  const { priceId, quantity = 1, cartId } = await c.req.json<{ priceId: string; quantity?: number; cartId?: string }>();
  if (!priceId) return c.json({ error: 'missing_price' }, 400);
  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: priceId, quantity }],
    shipping_address_collection: { allowed_countries: ['US', 'CA'] },
    shipping_options: [
      { shipping_rate_data: { display_name: 'Standard (5–7 days)', type: 'fixed_amount', fixed_amount: { amount: 799, currency: 'usd' } } },
      { shipping_rate_data: { display_name: 'Express (2–3 days)', type: 'fixed_amount', fixed_amount: { amount: 1599, currency: 'usd' } } },
    ],
    automatic_tax: { enabled: true },
    success_url: `${c.env.SITE_URL || ''}/success?session_id={CHECKOUT_SESSION_ID}&cart=${cartId || ''}`,
    cancel_url: `${c.env.SITE_URL || ''}/checkout`,
    client_reference_id: cartId,
  });
  return c.json({ url: session.url });
});

app.post('/api/stripe/webhook', async (c) => {
  if (!c.env.STRIPE_SECRET || !c.env.STRIPE_WEBHOOK_SECRET) return c.json({ error: 'not_configured' }, 501);
  const sig = c.req.header('stripe-signature');
  if (!sig) return c.json({ error: 'missing_signature' }, 400);
  const body = await c.req.text();
  const stripe = new Stripe(c.env.STRIPE_SECRET, {
    apiVersion: '2025-08-27.basil',
    httpClient: Stripe.createFetchHttpClient(),
  });
  let event;
  try {
    event = await stripe.webhooks.constructEventAsync(
      body,
      sig,
      c.env.STRIPE_WEBHOOK_SECRET,
      undefined,
      Stripe.createSubtleCryptoProvider()
    );
  } catch {
    return c.json({ error: 'invalid_signature' }, 400);
  }
  if (event.type === 'checkout.session.completed') {
    // const session = event.data.object as Stripe.Checkout.Session
    // TODO: mark order/cart as paid
  }
  return c.json({ received: true });
});

// Minimal session lookup used by success page (server-side secret)
app.get('/api/stripe/session', async (c) => {
  const id = c.req.query('session_id')
  if (!id) return c.json({ error: 'missing_session_id' }, 400)
  if (!c.env.STRIPE_SECRET) return c.json({ error: 'not_configured' }, 501)
  const stripe = new Stripe(c.env.STRIPE_SECRET, {
    apiVersion: '2025-08-27.basil',
    httpClient: Stripe.createFetchHttpClient(),
  })
  const s = await stripe.checkout.sessions.retrieve(id)
  return c.json({
    id: s.id,
    payment_status: s.payment_status,
    amount_total: s.amount_total,
    currency: s.currency,
    client_reference_id: s.client_reference_id,
  })
})

// --- Instagram oEmbed proxy with basic in-memory cache ---
type OEmbedJSON = Record<string, unknown>;
// type OEmbedCacheValue = { json: OEmbedJSON; exp: number }; // Unused for now - can be added back when implementing caching
// Remove unused cache for now - can be added back when implementing caching
// const igOembedCache = new Map<string, OEmbedCacheValue>();

app.get('/api/instagram/oembed', async (c) => {
  try {
    const url = c.req.query('url');
    const maxwidth = c.req.query('maxwidth');
    const omitscript = c.req.query('omitscript');
    const hidecaption = c.req.query('hidecaption');

    if (!url) {
      return c.json({ error: 'URL parameter is required' }, 400);
    }

    // First, try with Instagram's Graph API if token is available
    const igToken = c.env.IG_OEMBED_TOKEN;
    if (igToken) {
      try {
        const graphUrl = new URL('https://graph.facebook.com/v18.0/instagram_oembed');
        graphUrl.searchParams.append('url', url);
        graphUrl.searchParams.append('access_token', igToken);
        if (maxwidth) graphUrl.searchParams.append('maxwidth', maxwidth);
        if (omitscript) graphUrl.searchParams.append('omitscript', omitscript);
        if (hidecaption) graphUrl.searchParams.append('hidecaption', hidecaption);
        
        const graphResponse = await fetch(graphUrl.toString());
        if (graphResponse.ok) {
          const data = await graphResponse.json() as OEmbedJSON;
          return c.json(data, 200, {
            'Access-Control-Allow-Origin': '*',
            'Cache-Control': 'public, max-age=3600'
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
    return c.json(data, 200, {
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600'
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
