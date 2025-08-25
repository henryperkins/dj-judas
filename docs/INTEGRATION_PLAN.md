# Social & Streaming Integrations — Implementation Plan (Aug 25, 2025)

This document enumerates all placeholders and gaps found in the current codebase and provides explicit, actionable steps to replace them with working integrations for Spotify, Apple Music, Facebook, and Instagram. Each step includes links to the official SDK/API documentation.

Repo paths referenced below are relative to the project root.

---

## 1) Current State Snapshot

- Spotify (embed works; follow/save are placeholders)
  - Working: Spotify IFrame Embed via `https://open.spotify.com/embed/iframe-api/v1`.
    - File: `src/react-app/components/SpotifyEmbed.tsx` (creates controller, listens to `playback_update`).
  - Placeholder: “Save to Library” and “Follow Artist” buttons open URLs; no OAuth/Web API calls. Hardcoded fallback artist ID string.
    - Files: `src/react-app/components/SpotifyEmbed.tsx`, `src/react-app/components/MusicHub.tsx` (uses synthetic URIs in demo content).

- Apple Music (embed works; library actions are placeholders)
  - Working: Apple Music web embed via `https://embed.music.apple.com/...`.
    - File: `src/react-app/components/AppleMusicEmbed.tsx`.
  - Placeholder: “Add to Library”, “Purchase”, “Subscribe” = link-outs with optional affiliate/campaign tokens; no MusicKit authorization.
    - Files: `src/react-app/components/AppleMusicEmbed.tsx`, `src/react-app/components/MusicHub.tsx` (demo links).

- Facebook (SDK loader present; config/pixel not wired)
  - Working: SDK loader + event subscriptions; XFBML parsing used by Page Plugin.
    - File: `src/react-app/utils/metaSdk.ts` (load `sdk.js`, subscribe to `edge.create/remove`, `message.send`).
  - Gaps: No `<div id="fb-root"></div>` in `index.html`; `appId`/`version` not set; Pixel loader exists but is never called; follower count hardcoded in UI.
    - Files: `index.html`, `src/react-app/utils/metaSdk.ts`, `src/react-app/components/FacebookHub.tsx`.

- Instagram (embeds work; no API fetch)
  - Working: Loads `https://www.instagram.com/embed.js` and calls `instgrm.Embeds.process()`.
    - Files: `src/react-app/utils/metaSdk.ts`, `src/react-app/components/InstagramHub.tsx`.
  - Gap: `posts` are injected by props only; no Graph API calls.

- Cross-cutting placeholders
  - `src/react-app/utils/socialMetrics.ts`: `getAggregatedMetrics()` returns hardcoded numbers; comment says “In production, fetch from your API”.
  - Misc links/IDs labeled `YOUR_ARTIST_ID` in `src/react-app/components/SocialProofWall.tsx`.
  - SoundCloud link present; per request, remove non-target platforms.
    - File: `src/react-app/components/LandingPage.tsx` (Contact buttons).

---

## 2) Spotify — From Embed-Only to Web API

Baseline (keep): Spotify IFrame Embed for playback.

Upgrade (optional): Add OAuth PKCE and call Web API for “Save” and “Follow”.

### 2.1 Embed (keep)
- Docs: Spotify Embeds Overview and IFrame API.
  - Embeds overview: https://developer.spotify.com/documentation/embeds
  - IFrame API reference: https://developer.spotify.com/documentation/embeds/references/iframe-api
  - IFrame API tutorial: https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api
- Code refs to keep:
  - `src/react-app/components/SpotifyEmbed.tsx` (script `https://open.spotify.com/embed/iframe-api/v1`, `onSpotifyIframeApiReady`, `createController`, `togglePlay`).

### 2.2 OAuth (PKCE) + Web API calls (to enable Save/Follow)
- Docs (Authorization & endpoints):
  - OAuth flows & scopes: https://developer.spotify.com/documentation/web-api/concepts/authorization
  - Save tracks: `PUT /me/tracks` (scope: `user-library-modify`) — https://developer.spotify.com/documentation/web-api/reference/save-tracks-user
  - Follow artist: `PUT /me/following?type=artist&ids=...` (scope: `user-follow-modify`) — see Users/Follow endpoints: https://developer.spotify.com/documentation/web-api/reference/check-current-user-follows (index contains follow-related endpoints)

- Worker endpoints (proposed):
  1) `GET /api/spotify/login` — Generate code verifier/challenge; redirect to `https://accounts.spotify.com/authorize` with scopes: `user-library-modify user-follow-modify user-follow-read` (plus any others as needed).
  2) `GET /api/spotify/callback` — Exchange `code` + `code_verifier` for tokens; set an HttpOnly session cookie or return to client.
  3) `POST /api/spotify/save` — Proxy `PUT /me/tracks` with track IDs.
  4) `POST /api/spotify/follow` — Proxy `PUT /me/following?type=artist` with artist IDs.

- Client changes:
  - `SpotifyEmbed.tsx`: Gate “Save to Library” and “Follow Artist” buttons.
    - If not authenticated → label buttons “Open in Spotify” (current behavior) and hide write actions.
    - If authenticated → call Worker endpoints above.
  - `MusicHub.tsx`: Replace synthetic `spotify:track:` URIs with real IDs from config.

- Env vars (Vite):
  - `VITE_SPOTIFY_CLIENT_ID`
  - `VITE_SPOTIFY_REDIRECT_URI` (must match Spotify app settings)
  - Optional: `VITE_SPOTIFY_ARTIST_ID`

---

## 3) Apple Music — From Embed to MusicKit JS

Baseline (keep): Apple Music web embed for unauthenticated playback and outbound CTAs.

Upgrade: Add MusicKit JS for authorization and real “Add to Library” / full playback.

### 3.1 MusicKit JS (client)
- Docs:
  - MusicKit on the Web (interactive docs and API samples): https://js-cdn.music.apple.com/musickit/v1/index.html
  - MusicKit (Developer overview hub): https://developer-mdn.apple.com/musickit/
- Steps:
  1) Load MusicKit JS: `<script src="https://js-cdn.music.apple.com/musickit/v1/musickit.js"></script>`.
  2) Fetch Developer Token from Worker (see 3.2) and configure:
     ```ts
     await MusicKit.configure({
       developerToken,
       app: { name: 'DJ Lee & Voices of Judah', build: '1.0.0' },
       storefrontId: 'us'
     });
     const music = MusicKit.getInstance();
     ```
  3) On user action, acquire Music User Token:
     ```ts
     const userToken = await music.authorize();
     ```
  4) Add to Library (two patterns):
     - Using MusicKit JS API helpers for library endpoints (via `music.api.*`): e.g., searching songs by ID/ISRC and then calling the appropriate `/v1/me/library/...` endpoints with `Authorization: Bearer <devToken>` + `Music-User-Token: <userToken>` headers. See the interactive API samples on the MusicKit docs page.
     - Or queue/play full tracks with:
       ```ts
       await music.setQueue({ song: 'SONG_ID' });
       await music.play();
       ```

### 3.2 Developer Token (server)
- Token requirements: header `kid`, ES256 signature; payload contains `iss` (Team ID), `iat` (issued-at), `exp` (≤ 6 months from now).
- Official guidance (see “Configure” and Developer Account Help linked on MusicKit docs):
  - MusicKit Web docs (Configure/Developer Token): https://js-cdn.music.apple.com/musickit/v1/index.html
  - Developer Account Help (creating keys): https://help.apple.com/developer-account/#/devce5522674
- Worker route to mint token (Node/JS example):
  ```js
  import jwt from 'jsonwebtoken';
  // Secrets in Worker environment: APPLE_MUSIC_TEAM_ID, APPLE_MUSIC_KEY_ID, APPLE_MUSIC_PRIVATE_KEY
  const token = jwt.sign({}, APPLE_MUSIC_PRIVATE_KEY, {
    algorithm: 'ES256',
    expiresIn: '180d',
    issuer: APPLE_MUSIC_TEAM_ID,
    header: { alg: 'ES256', kid: APPLE_MUSIC_KEY_ID },
  });
  ```
- Client consumes `GET /api/apple/developer-token` → returns signed token; never expose the private key to the browser.

### 3.3 UI changes
- `src/react-app/components/AppleMusicEmbed.tsx`:
  - If MusicKit not initialized/authorized: keep current “Open in Apple Music” CTA.
  - If authorized: enable real “Add to Library” (call `/v1/me/library` endpoints via `music.api.*`), and optional full-track playback with `setQueue` + `play`.
- `src/react-app/components/MusicHub.tsx`:
  - Replace demo Apple Music links with real catalog URLs or IDs read from config.

---

## 4) Facebook — SDK + Page Plugin + Pixel + Graph API

### 4.1 JavaScript SDK initialization
- Docs:
  - JS SDK reference/advanced setup: https://developers.facebook.com/docs/javascript
  - `FB.init` parameters: https://developers.facebook.com/docs/javascript/reference/FB.init/
  - Page Plugin (supports `data-tabs="timeline,events,messages"`): https://developers.facebook.com/docs/plugins/page-plugin/
- Required HTML node:
  - Add `<div id="fb-root"></div>` to `index.html` (recommended by SDK quickstart/advanced setup).
- Code changes:
  - Initialize `MetaSDKLoader` with env-backed `appId` and `version` (e.g., `v21.0`).
  - Ensure `xfbml: true` so Page Plugin renders, or call `FB.XFBML.parse()` on container.
  - File: `src/react-app/utils/metaSdk.ts` and `index.html`.

### 4.2 Meta Pixel
- Docs: Pixel base code and install guidance: https://developers.facebook.com/docs/meta-pixel/get-started/
- Code changes:
  - Supply `pixelId` to `MetaSDKLoader` and call `loadPixel()` during app bootstrap (e.g., in `src/react-app/main.tsx` or `App.tsx`).
  - Keep `PageView` and optionally track custom events already stubbed in `metaSdk.ts`.

### 4.3 Follower count via Graph API (replace hardcoded value)
- Docs: Page object fields (use `followers_count` on New Pages): https://developers.facebook.com/docs/graph-api/reference/page/
- Worker endpoint (recommended):
  - `GET /api/fb/page/{page_id}?fields=followers_count` → Proxy to Graph API using a Page Access Token with `pages_read_engagement`.
- Client:
  - `FacebookHub.tsx`: fetch count from Worker and display instead of `setFollowerCount(1600)`.

---

## 5) Instagram — Embeds and/or Graph API

### 5.1 Embeds (current behavior)
- Docs: Instagram oEmbed and embed.js usage (`instgrm.Embeds.process()`):
  - oEmbed guide: https://developers.facebook.com/docs/instagram-platform/oembed/
  - oEmbed reference (includes `omitscript=true`, `instgrm.Embeds.process()`): https://developers.facebook.com/docs/instagram-platform/oembed/
- Keep current loader in `src/react-app/utils/metaSdk.ts` and `InstagramHub.tsx`.

### 5.2 Instagram Graph API (optional content fetch)
- Docs:
  - User media: `GET /{ig-user-id}/media` — https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
  - Media fields (e.g., `permalink`, `media_type`, `media_url`, `thumbnail_url`): https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/
- Worker endpoint (recommended):
  - `GET /api/ig/media?limit=12` → Proxy to Graph API using a long‑lived IG User Access Token; return `permalink` values for the embed list.
- Client:
  - Hydrate `InstagramHub` with returned posts instead of hardcoding `posts`.

---

## 6) Cross-Cutting — Social Metrics API

- Replace `socialMetrics.getAggregatedMetrics()` stub (hardcoded values) with a Worker endpoint that collects real metrics as available:
  - Facebook/Instagram: Graph API data (followers, engagement where permitted).
  - Spotify/Apple Music: Public page stats where available; for authenticated per-user stats, keep client-side only.
- Update `src/react-app/utils/socialMetrics.ts` to call `/api/metrics/aggregate` and surface fields currently displayed in `SocialProofWall.tsx`.

---

## 7) Cleanup per Request

- Remove non-target platforms:
  - SoundCloud link in `src/react-app/components/LandingPage.tsx` (Contact section).
  - Replace `YOUR_ARTIST_ID` placeholders in `src/react-app/components/SocialProofWall.tsx`, or hide tiles until configured.
  - Optionally narrow union type in `src/react-app/utils/socialMetrics.ts` from `'spotify' | 'apple' | 'youtube' | 'amazon' | 'website'` to just `'spotify' | 'apple' | 'website'`.

---

## 8) Environment & Secrets

Create a `.env.local` (not committed) with Vite-prefixed variables for the client and secrets in Worker env.

Client (Vite):

```
VITE_FB_APP_ID=...
VITE_FB_VERSION=v21.0
VITE_FB_PIXEL_ID=...

VITE_SPOTIFY_CLIENT_ID=...
VITE_SPOTIFY_REDIRECT_URI=https://your.domain/callback/spotify

VITE_SPOTIFY_ARTIST_ID=...
VITE_APPLE_MUSIC_STORE_FRONT=us
```

Worker (secrets; never expose to client):

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

## 9) Acceptance Criteria

- Spotify
  - Embed renders and plays (unchanged).
  - If not authenticated: “Save”/“Follow” are replaced with “Open in Spotify”.
  - If authenticated: clicking “Save” calls Worker → `PUT /me/tracks` and succeeds; clicking “Follow” calls Worker → `PUT /me/following` and succeeds.

- Apple Music
  - Embed renders and opens Apple Music (unchanged for unauthenticated users).
  - After MusicKit authorize: “Add to Library” adds the selected song/album via Apple Music API, and full playback via `setQueue` works for the authorized user.

- Facebook
  - `<div id="fb-root"></div>` present; `FB.init` gets real `appId`/`version`.
  - Pixel initialized with real `pixelId`; Page Plugin renders.
  - Follower count fetched from Worker (Graph API `followers_count`) and displayed; no hardcoded values.

- Instagram
  - Embeds render via `instgrm.Embeds.process()`.
  - Optional: Grid hydrated via Worker → IG Graph API media list.

- Cleanup
  - SoundCloud link removed; non-configured tiles hidden or updated.

---

## 10) Official Docs — Quick Links

Spotify
- Embeds Overview: https://developer.spotify.com/documentation/embeds
- IFrame API Reference: https://developer.spotify.com/documentation/embeds/references/iframe-api
- IFrame API Tutorial: https://developer.spotify.com/documentation/embeds/tutorials/using-the-iframe-api
- Authorization (OAuth, PKCE): https://developer.spotify.com/documentation/web-api/concepts/authorization
- Save Tracks (Web API): https://developer.spotify.com/documentation/web-api/reference/save-tracks-user
- Follow/Check Following (Web API users endpoints index): https://developer.spotify.com/documentation/web-api/reference/check-current-user-follows

Apple Music / MusicKit
- MusicKit JS (Web) interactive docs & samples: https://js-cdn.music.apple.com/musickit/v1/index.html
- MusicKit overview hub: https://developer-mdn.apple.com/musickit/
- Developer Account Help (create keys): https://help.apple.com/developer-account/#/devce5522674

Facebook / Meta
- JS SDK: https://developers.facebook.com/docs/javascript
- `FB.init` reference: https://developers.facebook.com/docs/javascript/reference/FB.init/
- Page Plugin: https://developers.facebook.com/docs/plugins/page-plugin/
- Meta Pixel get started: https://developers.facebook.com/docs/meta-pixel/get-started/
- Graph API — Page fields (`followers_count`): https://developers.facebook.com/docs/graph-api/reference/page/

Instagram
- oEmbed (and embed.js usage): https://developers.facebook.com/docs/instagram-platform/oembed/
- IG Graph API — User Media: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media
- IG Graph API — Media fields: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/

---

## 11) Notes & Constraints

- Browser autoplay policies may block programmatic playback start (Spotify/Apple); require a user gesture.
- Apple Music: Developer Token must be minted server-side (Worker). Never ship the private key to the client.
- Facebook/Instagram: Ensure app is in Live mode and domains are whitelisted in the app settings for plugins and Graph API calls.
- Respect each platform’s terms of use; do not cache or persist data beyond allowed purposes.

