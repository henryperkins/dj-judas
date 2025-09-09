# Media Embeds (Spotify + Apple Music)

This app already includes rich Spotify and Apple Music components. For quick "just works" embeds, use `src/react-app/components/MediaEmbed.tsx`:

```tsx
import MediaEmbed from '@/components/MediaEmbed';

// Spotify playlist/track/album URL
<MediaEmbed url="https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M" />

// Apple Music album/track/playlist URL
<MediaEmbed url="https://music.apple.com/us/album/1441163490" />
```

Notes
- No auth required; renders official platform iframes.
- For advanced features (Apple MusicKit auth, add-to-library; Spotify save/follow, playback controls), use the existing components:
  - `src/react-app/components/AppleMusicEmbed.tsx`
  - `src/react-app/components/SpotifyEmbed.tsx`

Optional helpers
- Share helper with Pixel event: `src/react-app/lib/share.ts`
  ```ts
  import { shareTo } from '@/lib/share';
  shareTo('spotify', 'https://open.spotify.com/track/...');
  ```

Server requirements
- Apple Music developer token endpoint is already provided by the Worker at `/api/apple/developer-token` when configured.
- Spotify OAuth/session and save/follow endpoints are already proxied under `/api/spotify/*` in the Worker.

Env
- `VITE_SPOTIFY_CLIENT_ID` (for Worker Spotify flow)
- `APPLE_TEAM_ID`, `APPLE_KEY_ID`, `APPLE_PRIVATE_KEY` (Worker secrets) for Apple MusicKit.

