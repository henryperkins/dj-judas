# Implementation Plan — Social & Streaming Integrations (refined)

Status: Draft • Last updated: 2025-08-25

This document refines the integration approach for Spotify, Apple Music, Facebook, and Instagram with precise, working flows, server boundaries, and references to official SDK/API docs current as of August 25, 2025.

Repo paths are relative to project root. Target runtime includes React (client) and a Cloudflare Worker (Hono) backend.

---

## 0) Goals & Constraints

- Provide working, policy‑conformant integrations for:
  - Spotify: Embed playback + optional authenticated Save/Follow via Web API.
  - Apple Music: Web embed baseline + MusicKit on the Web for auth, Add to Library, and full playback (for subscribers).
  - Facebook: JS SDK + Page Plugin + Pixel; follower count via Graph API through Worker.
  - Instagram: Embed.js and/or oEmbed; optional Graph API media fetch through Worker.
- Do not ship secrets to the client. Tokens minted or exchanged server‑side only.
- Degrade gracefully when users are not authenticated or features are unavailable.

---

## 1) Architecture Overview

- Client (React): Renders embeds, triggers login/authorize flows, and calls Worker APIs for server‑side operations.
- Worker (Cloudflare, Hono):
  - OAuth (Spotify PKCE) endpoints and token exchange.
  - Apple Music developer token minting (ES256 JWT) and proxy for permitted MusicKit Web API calls if needed.
  - Meta (FB/IG) Graph API proxies (elevated tokens kept server‑side).
  - Session ephemeral state (PKCE `code_verifier`, `state`) using a short‑TTL store (KV/Memory/Durable Object).
- Storage: Use Cloudflare KV for PKCE verifiers and short‑lived sessions. Never persist refresh tokens beyond what the platform permits and our privacy policy declares.

---

## 2) Spotify

### 2.1 What we keep
- Spotify Embed via iFrame API for playback with programmatic control. See reference and sample options (including `theme: 'dark'`).
  - Docs: iFrame API reference; tutorial. [1][2]
- UI: If user is not authenticated, show “Open in Spotify” links; hide Save/Follow actions.

### 2.2 OAuth (Authorization Code with PKCE)
- Recommended for SPAs and mobile; no client secret in browser. [3]
- Scopes needed for our actions:
  - `user-library-modify` (save track/album)
  - `user-follow-modify` (follow artist)
- Worker routes
  - `GET /api/spotify/login`
    - Generate `code_verifier` (43–128 chars) and `code_challenge = base64url(SHA256(code_verifier))`.
    - Persist `{ state, code_verifier, redirect_uri }` in KV with short TTL (e.g., 10 min).
    - Redirect to `https://accounts.spotify.com/authorize` with `response_type=code`, `client_id`, `redirect_uri`, `scope`, `code_challenge_method=S256`, `code_challenge`, `state`.
  - `GET /api/spotify/callback`
    - Validate `state`; look up `code_verifier` from KV.
    - Exchange `code` for tokens at `https://accounts.spotify.com/api/token` with form body: `grant_type=authorization_code`, `client_id`, `code`, `redirect_uri`, `code_verifier`.
    - Store tokens server‑side (session cookie with opaque id + KV) or return an encrypted session token to client (HTTP‑only if possible).
  - `POST /api/spotify/save` → proxy `PUT /me/tracks?ids=...`.
  - `POST /api/spotify/follow` → proxy `PUT /me/following?type=artist&ids=...`.
- Notes
  - Returns are `204 No Content` on success for these endpoints.
  - Handle refresh with `grant_type=refresh_token` when provided.
  - Autoplay from iFrame is browser‑dependent; require a user gesture. [1]
- Security & policy
  - Use HTTPS redirect URIs only (implicit grant is deprecated; migration dates published by Spotify). [4]
  - New extended‑access criteria may affect higher quotas and certain catalog endpoints. Our Save/Follow use‑case remains standard. [5]

### 2.3 Client updates (files)
- `src/react-app/components/SpotifyEmbed.tsx`
  - Keep iFrame API init per docs.
  - Remove hardcoded artist fallback; require a real `artistId` prop or config.
  - Gate Save/Follow buttons behind an `isSpotifyAuthed` flag; otherwise show “Open in Spotify”.
- `src/react-app/components/MusicHub.tsx`
  - Replace demo URIs with real URIs from config or content source.

---

## 3) Apple Music

We maintain the current Web Embed, and add MusicKit on the Web for authenticated features.

### 3.1 MusicKit on the Web (client)
- Load MusicKit script and configure with a server‑minted developer token.
  - Historically v1 URL: `https://js-cdn.music.apple.com/musickit/v1/musickit.js` (Apple has also shipped v3 builds; ensure we match Apple’s current guidance and test across browsers). [6]
- Configure and authorize
  ```ts
  document.addEventListener('musickitloaded', async () => {
    // developerToken is fetched from Worker endpoint
    const developerToken = await fetch('/api/apple/developer-token').then(r => r.text());
    const MusicKitNS = (window as any).MusicKit; // global injected by script
    await MusicKitNS.configure({
      developerToken,
      app: { name: 'DJ Lee & Voices of Judah', build: '1.0.0' },
      storefrontId: 'us'
    });
    const music = MusicKitNS.getInstance();
    // User gesture required before playback is reliable in all browsers
    // Acquire user token when needed
    // const userToken = await music.authorize();
  });
  ```
- Add to Library (after user authorizes and is an Apple Music subscriber)
  - Call Apple Music API with headers:
    - `Authorization: Bearer <developerToken>`
    - `Music-User-Token: <userToken>`
  - Endpoint: `POST https://api.music.apple.com/v1/me/library?ids[songs]=<songId>` (albums/playlists supported variants). [7]
- Full playback
  - Use MusicKit queue APIs (e.g., `setQueue({ song: 'SONG_ID' })`, then `play()`), adhering to user‑gesture/autoplay rules.

### 3.2 Developer Token (server)
- Mint ES256 JWT with header `kid`, claims `iss` (Apple Team ID), `iat`, `exp` (≤ 6 months).
- Cloudflare Worker example using `jose`:
  ```ts
  import { SignJWT, importPKCS8 } from 'jose';
  // Secrets in env: APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY
  export async function getAppleDevToken(env: Env) {
    const key = await importPKCS8(env.APPLE_MUSIC_PRIVATE_KEY, 'ES256');
    const jwt = await new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: env.APPLE_MUSIC_KEY_ID })
      .setIssuer(env.APPLE_MUSIC_TEAM_ID)
      .setIssuedAt()
      .setExpirationTime('180d')
      .sign(key);
    return jwt;
  }
  ```
- Worker route: `GET /api/apple/developer-token` → returns token (short browser cache TTL).

### 3.3 Known limits & guidance
- Music User Token (MUT) must be obtained on device/website via MusicKit authorization; no server‑side substitute. [6]
- “Add to Library” is supported; deletion/reorder and some playlist mutations remain unsupported via public web API. [7][8]
- Ensure autoplay is user‑initiated; test across Safari, Chrome, Firefox. [6]

### 3.4 Client updates (files)
- `src/react-app/components/AppleMusicEmbed.tsx`
  - Keep embed UI; add optional MusicKit mode. If `isAppleAuthed`, enable “Add to Library” calling `/v1/me/library` with MUT.
  - Read `affiliateToken`/`campaignToken` from env/config if used.

---

## 4) Facebook (Meta)

### 4.1 JS SDK + Page Plugin
- Add `<div id="fb-root"></div>` in `index.html` and initialize SDK with env‑provided `appId`/`version` (`xfbml: true`). [9]
- Ensure XFBML parsing for page plugins and events subscription.

### 4.2 Meta Pixel
- Provide `pixelId` from env; call `metaSDK.loadPixel()` at app bootstrap to track `PageView` and custom events. [10]

### 4.3 Follower count via Graph API
- Use Worker proxy to read Page fields:
  - Endpoint: `GET /{page-id}?fields=followers_count` (or `fan_count` depending on Page type). [11]
  - Requires a Page Access Token with `pages_read_engagement` (store in Worker env).
- Client: replace hardcoded follower count in `FacebookHub.tsx` with fetch from Worker.

---

## 5) Instagram

### 5.1 Embeds
- Current approach (embed.js + `instgrm.Embeds.process()`) is fine for public posts.

### 5.2 oEmbed (server-retrieved HTML)
- Worker can call `GET /instagram_oembed?url={postUrl}` (App or Client Access Token) and return HTML to client to reduce layout shift and control caching. [12][13]

### 5.3 Instagram Graph API (optional)
- Worker can fetch recent media: `GET /{ig-user-id}/media` for IDs, then expand fields as needed (e.g., `permalink`, `media_type`, `media_url`). [14]
- Requires appropriate permissions (`instagram_basic` and related page permissions). Follow app review if needed.

---

## 6) Worker API Sketch (Hono)

```ts
// src/worker/index.ts (outline)
import { Hono } from 'hono';
import { SignJWT, importPKCS8 } from 'jose';

const app = new Hono<{ Bindings: Env }>();

app.get('/api/apple/developer-token', async c => {
  const key = await importPKCS8(c.env.APPLE_MUSIC_PRIVATE_KEY, 'ES256');
  const jwt = await new SignJWT({})
    .setProtectedHeader({ alg: 'ES256', kid: c.env.APPLE_MUSIC_KEY_ID })
    .setIssuer(c.env.APPLE_MUSIC_TEAM_ID)
    .setIssuedAt()
    .setExpirationTime('180d')
    .sign(key);
  return c.text(jwt);
});

// Spotify PKCE endpoints (login, callback) — see §2.2
// Facebook Page metrics proxy — see §4.3
// Instagram oEmbed/Graph proxy — see §5.2/§5.3

export default app;
```

---

## 7) Environment & Secrets

Client (Vite):
```
VITE_FB_APP_ID=...
VITE_FB_VERSION=v21.0
VITE_FB_PIXEL_ID=...

VITE_SPOTIFY_CLIENT_ID=...
VITE_SPOTIFY_REDIRECT_URI=https://your.domain/callback/spotify

VITE_SPOTIFY_ARTIST_ID=...
VITE_APPLE_MUSIC_STOREFRONT=us
```

Worker (never expose to client):
```
APPLE_MUSIC_TEAM_ID=...
APPLE_MUSIC_KEY_ID=...
APPLE_MUSIC_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----

FB_PAGE_ACCESS_TOKEN=...
IG_USER_ACCESS_TOKEN=...

SPOTIFY_CLIENT_ID=...
SPOTIFY_CLIENT_SECRET=...
SPOTIFY_REDIRECT_URI=https://your.domain/callback/spotify
SESSION_SECRET=...
```

---

## 8) Acceptance Tests

- Spotify
  - iFrame Embed renders; `ready`/`playback_update` events fire. [1]
  - Not authed: Save/Follow hidden; “Open in Spotify” works.
  - Authed: `POST /api/spotify/save` (PUT /me/tracks) and `POST /api/spotify/follow` (PUT /me/following) succeed (HTTP 204).
- Apple Music
  - Developer token endpoint returns valid JWT (base64 header shows correct `kid`, claims include `iss`, `exp`).
  - MusicKit authorize yields MUT; Add to Library (`POST /v1/me/library?ids[songs]=...`) returns success. [7]
  - Playback via `setQueue` + `play` works after user gesture.
- Facebook
  - SDK initialized; Page Plugin renders; Pixel PageView appears in Events Manager. [9][10]
  - Worker proxy returns `followers_count` for the Page. [11]
- Instagram
  - Embeds render via embed.js; oEmbed Worker path returns HTML for provided permalinks. [12]

---

## 9) Cleanup (separate PR)
- Remove SoundCloud link in `src/react-app/components/LandingPage.tsx` (per scope).
- Replace `YOUR_ARTIST_ID` placeholders in `src/react-app/components/SocialProofWall.tsx` or hide tiles until configured.

---

## 10) References (official docs)

[1] Spotify iFrame API reference — Methods, Events, options (incl. `theme`).  
https://developer.spotify.com/documentation/embeds/references/iframe-api

[2] Spotify iFrame API tutorial — using the iFrame API.  
https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api

[3] Spotify Web API — Authorization Code with PKCE Flow.  
https://developer.spotify.com/documentation/web-api/tutorials/code-pkce-flow

[4] Spotify blog — Increasing the security requirements (implicit grant deprecation; HTTPS redirect).  
https://developer.spotify.com/blog/2025-02-12-increasing-the-security-requirements-for-integrating-with-spotify

[5] Spotify blog — Updating the criteria for Web API extended access.  
https://developer.spotify.com/blog/2025-04-15-updating-the-criteria-for-web-api-extended-access

[6] MusicKit on the Web — MusicKit landing (web), docs hub.  
https://developer.apple.com/musickit/

[7] Apple Music API — Add a Resource to a Library (POST `/v1/me/library?ids[songs]=...`).  
https://developer.apple.com/documentation/applemusicapi/add_a_resource_to_a_library

[8] Apple Developer Forums — Apple states only adding to library/editable playlists is supported (no DELETE/PUT for many operations).  
https://developer.apple.com/forums/thread/107807

[9] Facebook JS SDK — `FB.init` reference; XFBML.  
https://developers.facebook.com/docs/javascript/reference/FB.init/

[10] Meta Pixel — Get Started.  
https://developers.facebook.com/docs/meta-pixel/get-started

[11] Graph API — Page reference (`followers_count`, `fan_count` notes).  
https://developers.facebook.com/docs/graph-api/reference/page/

[12] Instagram oEmbed — Endpoint and usage (`/instagram_oembed`).  
https://developers.facebook.com/docs/instagram-platform/oembed

[13] Instagram oEmbed (access token guidance, headers).  
https://developers.facebook.com/docs/instagram-platform/oembed/

[14] Instagram Graph API — IG User media read (`/{ig-user-id}/media`).  
https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media

---

## 11) Notes & Caveats

- Browser autoplay policies apply (both embeds and MusicKit). Require a user gesture before starting playback. [1][6]
- Apple Music API capabilities evolve; some features (e.g., delete/reorder playlist items) remain unavailable via public web API. Plan UI accordingly. [7][8]
- Facebook Page metrics fields differ across Classic vs New Page Experience; prefer `followers_count` and fall back to `fan_count` when needed. [11]
- Spotify Web API quotas and access criteria may vary; our Save/Follow use‑cases typically do not require extended access, but monitor policy updates. [5]

