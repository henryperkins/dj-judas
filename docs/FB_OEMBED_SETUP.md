# Facebook/Instagram oEmbed Setup (Graph API v21)

This app proxies Instagram/Facebook oEmbed through the Worker and follows Meta’s current guidance.

What changed
- Uses Graph API `instagram_oembed` with Authorization header.
- Defaults to Graph API version `v22.0` (override with `GRAPH_API_VERSION`).
- Prefers App Access Token if `FB_APP_ID`/`FB_APP_SECRET` are set, else falls back to `IG_OEMBED_TOKEN`.
- Adds `/api/health/oembed?url=...` to verify configuration.

Required approvals
- Your Facebook App must have the “oEmbed Read” feature approved and be in Live mode for production.

Env (Worker)
- `FB_APP_ID` and `FB_APP_SECRET` — recommended; used to fetch an App Access Token (cached in KV for 24h).
- `IG_OEMBED_TOKEN` — fallback access token (App or Page token).
- `IG_USER_ID` — Instagram Business Account user ID for media/insights endpoints.
- `GRAPH_API_VERSION` — optional, default `v22.0`.

Env (Client)
- `VITE_FACEBOOK_SDK_VERSION` — optional JS SDK version (default `v22.0`).

Discover your IG Business User ID
- Call `/api/instagram/me` after setting either an App or Page token to return `{ id, username }`.
- `VITE_META_CONSENT_DEFAULT_REVOKE=true` — start with Meta consent revoked until accepted.

Verification
- Open: `/api/health/oembed?url=https://www.instagram.com/p/<public_id>/`
- Expect `{ ok: true, status: 200 }`. If not, the JSON includes a short error body to guide fixes.

Notes
- Page posts/events endpoints still require a Page Access Token (`FB_PAGE_TOKEN`).
- Do not expose App secrets to the client; Worker fetches the App token server-side.
- To discover your Instagram Business Account ID from a Facebook Page, call
  `/api/instagram/linked-account?page_id=<FB_PAGE_ID>` using a Page Access Token.
