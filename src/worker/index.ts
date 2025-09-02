import { Hono } from "hono";
import { SignJWT, importPKCS8 } from 'jose';

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
  RESEND_API_KEY?: string;
  RESEND_FROM?: string; // e.g., 'Ministry <no-reply@yourdomain>'
  RESEND_TO?: string;   // destination inbox
  SENDGRID_API_KEY?: string;
  SENDGRID_FROM?: string;
  SENDGRID_TO?: string;
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

// --- Booking endpoint ---
app.post('/api/booking', async (c) => {
  try {
    const body = await c.req.json<{
      name: string;
      email: string;
      phone: string;
      eventType: string;
      eventDate: string;
      eventTime: string;
      location: string;
      message?: string;
    }>();

    const required = ['name','email','phone','eventType','eventDate','eventTime','location'] as const;
    for (const k of required) {
      if (!body[k] || String(body[k]).trim() === '') {
        return c.json({ error: `missing_${k}` }, 400);
      }
    }

    const summary = [
      `Name: ${body.name}`,
      `Email: ${body.email}`,
      `Phone: ${body.phone}`,
      `Event Type: ${body.eventType}`,
      `Date: ${body.eventDate} ${body.eventTime}`,
      `Location: ${body.location}`,
      '',
      'Message:',
      body.message || '(none)'
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
          subject: `Booking Request: ${body.eventType} on ${body.eventDate}`,
          text: summary
        })
      });
      if (!res.ok) {
        return c.json({ error: 'email_send_failed', provider: 'resend', status: res.status }, 500);
      }
      return c.json({ ok: true, provider: 'resend' });
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
          subject: `Booking Request: ${body.eventType} on ${body.eventDate}`,
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
  } catch (e) {
    return c.json({ error: 'invalid_request' }, 400);
  }
});
