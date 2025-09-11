import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  LuCirclePlay, LuMusic, LuShare2, LuFacebook, LuInstagram, LuGlobe, LuMic
} from "react-icons/lu";
import {
  LazyFacebookEmbed,
  LazyInstagramEmbed,
  LazyUniversalEmbed
} from './social/embeds/LazyEmbeds';
import ListenTabs from './ListenTabs';
import { ShareManager } from './social';
import type { DeepLink } from './social/sharing/ShareManager';

export type CreatorMediaPanelProps = {
  artist?: string;
  tagline?: string;

  // Music
  spotifyUrl?: string;          // track/album/playlist URL/URI
  appleMusicUrl?: string;       // full Apple Music URL

  // Video / Live
  facebookVideoHref?: string;   // public FB video/live URL
  facebookPageUrl?: string;     // public page, e.g. https://www.facebook.com/<page>

  // Social
  instagramPermalink?: string;  // public post/reel URL (for embed)
  socialEmbedUrl?: string;      // any supported social URL (TikTok, YouTube, X, etc.)

  // Share
  shareUrl?: string;            // canonical share link; defaults to window.location.href at runtime
};

export default function CreatorMediaPanel({
  artist = "DJ Lee & The Voices of Judah",
  tagline = "Gospel that lifts the room",
  spotifyUrl,
  appleMusicUrl,
  facebookVideoHref,
  facebookPageUrl,
  instagramPermalink,
  socialEmbedUrl,
  shareUrl,
}: CreatorMediaPanelProps) {
  const [tab, setTab] = useState<"listen" | "watch" | "social" | "share">("listen");
  const canonical = useMemo(() => shareUrl || (typeof window !== "undefined" ? window.location.href : ""), [shareUrl]);

  // Get environment variables for defaults
  const spotifyArtistId = import.meta.env?.VITE_SPOTIFY_ARTIST_ID;
  const instagramHandle = import.meta.env?.VITE_INSTAGRAM_HANDLE;
  const facebookPage = import.meta.env?.VITE_FACEBOOK_PAGE;
  const defaultSocialEmbedUrl = import.meta.env?.VITE_SOCIAL_EMBED_URL as string | undefined;

  // Build default URLs from environment variables
  const defaultSpotifyUrl = spotifyArtistId ? `https://open.spotify.com/artist/${spotifyArtistId}` : undefined;
  const defaultFacebookPageUrl = facebookPage ? `https://www.facebook.com/${facebookPage}` : undefined;
  const defaultInstagramUrl = instagramHandle ? `https://www.instagram.com/${instagramHandle}` : undefined;

  // Prepare deep links for ShareManager
  const deepLinks: DeepLink[] = useMemo(() => {
    const links: DeepLink[] = [];

    if (spotifyUrl || defaultSpotifyUrl) {
      links.push({
        id: 'spotify',
        label: 'Open in Spotify',
        url: normalizeSpotifyOpen(spotifyUrl || defaultSpotifyUrl!),
        platform: 'spotify'
      });
    }

    if (appleMusicUrl) {
      links.push({
        id: 'appleMusic',
        label: 'Open in Apple Music',
        url: appleMusicUrl,
        platform: 'appleMusic'
      });
    }

    if (facebookVideoHref) {
      links.push({
        id: 'facebook-video',
        label: 'Open Facebook Video',
        url: facebookVideoHref,
        platform: 'facebook'
      });
    }

    if (facebookPageUrl || defaultFacebookPageUrl) {
      links.push({
        id: 'facebook-page',
        label: 'Open Facebook Page',
        url: facebookPageUrl || defaultFacebookPageUrl!,
        platform: 'facebook'
      });
    }

    if (instagramPermalink || defaultInstagramUrl) {
      links.push({
        id: 'instagram',
        label: 'Open Instagram',
        url: instagramPermalink || defaultInstagramUrl!,
        platform: 'instagram'
      });
    }

    return links;
  }, [spotifyUrl, defaultSpotifyUrl, appleMusicUrl, facebookVideoHref, facebookPageUrl, defaultFacebookPageUrl, instagramPermalink, defaultInstagramUrl])


  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-5xl rounded-xl border bg-card p-1 text-card-foreground">
        {/* Header */}
        <div className="rounded-xl border bg-card p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{artist}</h2>
              <p className="text-muted-foreground">{tagline}</p>
            </div>

            {/* Tabs */}
            <div className="inline-flex rounded-lg border bg-card p-1">
              {[
                { key: "listen", label: "Listen", icon: LuMusic },
                { key: "watch", label: "Watch", icon: LuCirclePlay },
                { key: "social", label: "Social", icon: LuMic },
                { key: "share", label: "Share", icon: LuShare2 },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key as "listen" | "watch" | "social" | "share")}
                  className={`group relative inline-flex items-center gap-2 rounded-md px-3 sm:px-4 py-2 text-sm font-semibold transition
                    ${tab === key ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:bg-secondary"}`}
                >
                  <Icon size={18} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="mt-6 grid gap-6">
            {tab === "listen" && (
              <SectionCard title="Listen" hint="Choose your streaming platform">
                <ListenTabs
                  spotifyUrl={spotifyUrl || defaultSpotifyUrl}
                  appleMusicUrl={appleMusicUrl}
                />
              </SectionCard>
            )}

            {tab === "watch" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Facebook Video / Live" hint="Public videos & live streams">
                  {facebookVideoHref ? (
                    <LazyFacebookEmbed
                      url={facebookVideoHref}
                      type="video"
                    />
                  ) : (
                    <EmptyState text="Provide a Facebook video/live URL." />
                  )}
                </SectionCard>

                <SectionCard title="Facebook Page" hint="Timeline embed">
                  {(facebookPageUrl || defaultFacebookPageUrl) ? (
                    <LazyFacebookEmbed
                      url={facebookPageUrl || defaultFacebookPageUrl!}
                      type="post"
                    />
                  ) : (
                    <EmptyState text="Provide a Facebook Page URL." />
                  )}
                </SectionCard>
              </div>
            )}

            {tab === "social" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Instagram" hint="Latest posts and reels">
                  {instagramPermalink ? (
                    <LazyInstagramEmbed url={instagramPermalink} />
                  ) : defaultInstagramUrl ? (
                    <div className="grid grid-cols-2 gap-3">
                      <LinkTile href={defaultInstagramUrl} label="View Profile" icon={<LuInstagram size={18} />} />
                    </div>
                  ) : (
                    <EmptyState text="Provide a public Instagram post/reel URL." />
                  )}
                </SectionCard>

                <SectionCard title="Quick Links" hint="Open profiles">
                  <div className="grid grid-cols-2 gap-3 quick-links-grid">
                    {(facebookPageUrl || defaultFacebookPageUrl) && (
                      <LinkTile href={facebookPageUrl || defaultFacebookPageUrl!} label="Facebook" icon={<LuFacebook size={18} />} />
                    )}
                    {(instagramPermalink || defaultInstagramUrl) && (
                      <LinkTile href={instagramPermalink || defaultInstagramUrl!} label="Instagram" icon={<LuInstagram size={18} />} />
                    )}
                    {(spotifyUrl || defaultSpotifyUrl) && (
                      <LinkTile href={normalizeSpotifyOpen(spotifyUrl || defaultSpotifyUrl!)} label="Spotify" icon={<LuMusic size={18} />} />
                    )}
                    {appleMusicUrl && (
                      <LinkTile href={appleMusicUrl} label="Apple Music" icon={<LuGlobe size={18} />} />
                    )}
                  </div>
                </SectionCard>

                <SectionCard title="Universal Embed" hint="TikTok, YouTube, X, LinkedIn and more">
                  {(socialEmbedUrl || defaultSocialEmbedUrl) ? (
                    <LazyUniversalEmbed url={(socialEmbedUrl || defaultSocialEmbedUrl)!} />
                  ) : (
                    <EmptyState text="Provide any supported social post URL (e.g., TikTok/YouTube/Twitter)." />
                  )}
                </SectionCard>
              </div>
            )}

            {tab === "share" && (
              <ShareManager
                url={canonical}
                title={artist}
                description={`${artist} – ${tagline}`}
                artist={artist}
                tagline={tagline}
                campaign="creator_media_panel"
                showPlatforms={true}
                showQr={true}
                showDeepLinks={deepLinks.length > 0}
                deepLinks={deepLinks}
                className="share-manager-panel"
                layout="auto"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------- helpers ----------------- */

function SectionCard({
  title, hint, children,
}: React.PropsWithChildren<{ title: string; hint?: string }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {hint && <CardDescription>{hint}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="overflow-hidden rounded-md bg-card">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-48 items-center justify-center rounded-md bg-muted">
      <p className="text-sm text-muted-foreground">{text}</p>
    </div>
  );
}

function LinkTile({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="quick-link-tile flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-foreground hover:bg-secondary transition"
    >
      {icon} <span className="text-sm font-medium">{label}</span>
    </a>
  );
}


function normalizeSpotifyOpen(url: string) {
  // Convert embed/URI form to open.spotify.com for "Open in app" behavior
  return url
    .replace("open.spotify.com/embed/", "open.spotify.com/")
    .replace("spotify:track:", "https://open.spotify.com/track/")
    .replace("spotify:album:", "https://open.spotify.com/album/")
    .replace("spotify:playlist:", "https://open.spotify.com/playlist/")
    .replace("spotify:artist:", "https://open.spotify.com/artist/");
}
