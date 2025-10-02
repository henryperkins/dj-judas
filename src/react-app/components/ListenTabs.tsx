import { useEffect, useMemo, useState } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LazySpotifyEmbed, LazyAppleMusicEmbed } from './social/embeds/LazyEmbeds'
import { FaSpotify, FaApple } from 'react-icons/fa'

type Provider = 'spotify' | 'apple'

export interface ListenTabsProps {
  spotifyUrl?: string // track/album/playlist/artist URL or URI
  appleMusicUrl?: string // full Apple Music URL
  defaultProvider?: Provider
}

const SPOTIFY_COLOR = '#1DB954'
const APPLE_COLOR = '#FC3C44'

export default function ListenTabs({
  spotifyUrl,
  appleMusicUrl,
  defaultProvider,
}: ListenTabsProps) {
  const spotifyArtistId = import.meta.env?.VITE_SPOTIFY_ARTIST_ID
  const defaultSpotifyUrl = spotifyArtistId
    ? `https://open.spotify.com/artist/${spotifyArtistId}`
    : undefined

  const initial = useMemo<Provider>(() => {
    const stored = (typeof window !== 'undefined' && localStorage.getItem('preferredProvider')) as Provider | null
    if (stored === 'spotify' || stored === 'apple') return stored
    return defaultProvider || 'spotify'
  }, [defaultProvider])

  const [active, setActive] = useState<Provider>(initial)

  useEffect(() => {
    try {
      localStorage.setItem('preferredProvider', active)
    } catch {
      // Ignore localStorage errors (e.g., private browsing)
    }
  }, [active])

  const resolvedSpotify = spotifyUrl || defaultSpotifyUrl
  const hasSpotify = Boolean(resolvedSpotify)
  const hasApple = Boolean(appleMusicUrl)

  // If one provider missing, force to available one
  useEffect(() => {
    if (active === 'spotify' && !hasSpotify && hasApple) setActive('apple')
    if (active === 'apple' && !hasApple && hasSpotify) setActive('spotify')
  }, [active, hasSpotify, hasApple])

  return (
    <div className="listen-tabs">
      <Tabs value={active} onValueChange={(v) => setActive(v as Provider)}>
        <div className="listen-tabs__header">
          <TabsList>
            <TabsTrigger
              value="spotify"
              disabled={!hasSpotify}
              className="brand-tab brand-tab--spotify"
              aria-label="Spotify"
            >
              <FaSpotify />
              <span>Spotify</span>
            </TabsTrigger>
            <TabsTrigger
              value="apple"
              disabled={!hasApple}
              className="brand-tab brand-tab--apple"
              aria-label="Apple Music"
            >
              <FaApple />
              <span>Apple Music</span>
            </TabsTrigger>
          </TabsList>

          {/* Brand primary action aligned to the active tab */}
          <div className="listen-tabs__cta">
            {active === 'spotify' && hasSpotify && (
              <a
                href={normalizeSpotifyOpen(resolvedSpotify!)}
                target="_blank"
                rel="noopener noreferrer"
                className="brand-btn brand-btn--spotify"
                aria-label="Open in Spotify (opens app)"
                style={{ ['--brand-color' as string]: SPOTIFY_COLOR } as React.CSSProperties}
              >
                <FaSpotify /> Open in Spotify
              </a>
            )}
            {active === 'apple' && hasApple && (
              <a
                href={appleMusicUrl!}
                target="_blank"
                rel="noopener noreferrer"
                className="brand-btn brand-btn--apple"
                aria-label="Open in Apple Music (opens app)"
                style={{ ['--brand-color' as string]: APPLE_COLOR } as React.CSSProperties}
              >
                <FaApple /> Open in Apple Music
              </a>
            )}
          </div>
        </div>

        {/* Only mount the active provider to avoid loading two heavy iframes */}
        <div className="listen-tabs__body">
          <TabsContent value="spotify">
            {active === 'spotify' && hasSpotify ? (
              <div className="provider-pane spotify">
                <LazySpotifyEmbed uri={resolvedSpotify!} hideHeader={true} />
              </div>
            ) : (
              <EmptyProvider text="Add a Spotify URL to play here." />
            )}
          </TabsContent>

          <TabsContent value="apple">
            {active === 'apple' && hasApple ? (
              <div className="provider-pane apple">
                <LazyAppleMusicEmbed url={appleMusicUrl!} hideHeader={true} />
              </div>
            ) : (
              <EmptyProvider text="Add an Apple Music link to play here." />
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

function EmptyProvider({ text }: { text: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-md bg-muted">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  )
}

function normalizeSpotifyOpen(url: string) {
  return url
    .replace('open.spotify.com/embed/', 'open.spotify.com/')
    .replace('spotify:track:', 'https://open.spotify.com/track/')
    .replace('spotify:album:', 'https://open.spotify.com/album/')
    .replace('spotify:playlist:', 'https://open.spotify.com/playlist/')
    .replace('spotify:artist:', 'https://open.spotify.com/artist/')
}
