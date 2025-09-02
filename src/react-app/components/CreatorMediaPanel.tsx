import React, { useMemo, useState } from "react";
import './index.css';
import {
  PlayCircle, Music, Share2, Facebook, Instagram, Copy, Check, Link2, Globe, Mic2
} from "lucide-react";
import SpotifyEmbed from "./SpotifyEmbed";
import AppleMusicEmbed from "./AppleMusicEmbed";
import FacebookVideo from "./FacebookVideo";
import FacebookPage from "./FacebookPage";
import InstagramEmbed from "./InstagramEmbed";

export type CreatorMediaPanelProps = {
  artist?: string;
  tagline?: string;

  // Music
  spotifyUrl?: string;          // track/album/playlist URL/URI
  appleMusicUrl?: string;       // full Apple Music URL

  // Video / Live
  facebookVideoHref?: string;   // public FB video/live URL
  facebookAppId?: string;       // optional for SDK init (embeds work without)
  facebookPageUrl?: string;     // public page, e.g. https://www.facebook.com/<page>

  // Social
  instagramPermalink?: string;  // public post/reel URL (for embed)

  // Share
  shareUrl?: string;            // canonical share link; defaults to window.location.href at runtime
};

export default function CreatorMediaPanel({
  artist = "DJ Lee & The Voices of Judah",
  tagline = "Gospel that lifts the room",
  spotifyUrl,
  appleMusicUrl,
  facebookVideoHref,
  facebookAppId = import.meta.env?.VITE_FACEBOOK_APP_ID,
  facebookPageUrl,
  instagramPermalink,
  shareUrl,
}: CreatorMediaPanelProps) {
  const [tab, setTab] = useState<"listen" | "watch" | "social" | "share">("listen");
  const [copied, setCopied] = useState(false);
  const canonical = useMemo(() => shareUrl || (typeof window !== "undefined" ? window.location.href : ""), [shareUrl]);

  // Get environment variables for defaults
  const spotifyArtistId = import.meta.env?.VITE_SPOTIFY_ARTIST_ID;
  const instagramHandle = import.meta.env?.VITE_INSTAGRAM_HANDLE;
  const facebookPage = import.meta.env?.VITE_FACEBOOK_PAGE;
  const soundcloudUrl = import.meta.env?.VITE_SOUNDCLOUD_URL;

  // Build default URLs from environment variables
  const defaultSpotifyUrl = spotifyArtistId ? `https://open.spotify.com/artist/${spotifyArtistId}` : undefined;
  const defaultFacebookPageUrl = facebookPage ? `https://www.facebook.com/${facebookPage}` : undefined;
  const defaultInstagramUrl = instagramHandle ? `https://www.instagram.com/${instagramHandle}` : undefined;

  async function copyShare() {
    try {
      await navigator.clipboard.writeText(canonical);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // no-op
    }
  }

  async function nativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: artist, text: tagline, url: canonical });
      } catch { /* user canceled */ }
    } else {
      copyShare();
    }
  }

  return (
    <section className="relative">
      <div className="mx-auto w-full max-w-5xl rounded-3xl border border-gray-200 bg-white p-1">
        {/* Header */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">{artist}</h2>
              <p className="text-gray-600">{tagline}</p>
            </div>

            {/* Tabs */}
            <div className="inline-flex rounded-2xl border border-gray-200 bg-white p-1">
              {[
                { key: "listen", label: "Listen", icon: Music },
                { key: "watch", label: "Watch", icon: PlayCircle },
                { key: "social", label: "Social", icon: Mic2 },
                { key: "share", label: "Share", icon: Share2 },
              ].map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setTab(key as "listen" | "watch" | "social" | "share")}
                  className={`group relative inline-flex items-center gap-2 rounded-xl px-3 sm:px-4 py-2 text-sm font-semibold transition
                    ${tab === key ? "bg-gray-100 text-gray-900 shadow-sm" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  <Icon size={18} className={tab === key ? "text-gray-900" : "text-gray-600"} />
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Body */}
          <div className="mt-6 grid gap-6">
            {tab === "listen" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Spotify" hint="Playlists, tracks, albums">
                  {(spotifyUrl || defaultSpotifyUrl) ? (
                    <SpotifyEmbed url={spotifyUrl || defaultSpotifyUrl} />
                  ) : (
                    <EmptyState text="Add a Spotify URL to play here." />
                  )}
                </Card>

                <Card title="Apple Music" hint="Albums & songs">
                  {appleMusicUrl ? (
                    <AppleMusicEmbed url={appleMusicUrl} />
                  ) : (
                    <EmptyState text="Add an Apple Music link to play here." />
                  )}
                </Card>
              </div>
            )}

            {tab === "watch" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Facebook Video / Live" hint="Public videos & live streams">
                  {facebookVideoHref ? (
                    <FacebookVideo href={facebookVideoHref} appId={facebookAppId} height={400} />
                  ) : (
                    <EmptyState text="Provide a Facebook video/live URL." />
                  )}
                </Card>

                <Card title="Facebook Page" hint="Timeline embed">
                  {(facebookPageUrl || defaultFacebookPageUrl) ? (
                    <FacebookPage pageUrl={facebookPageUrl || defaultFacebookPageUrl!} tabs="timeline" height={560} appId={facebookAppId} />
                  ) : (
                    <EmptyState text="Provide a Facebook Page URL." />
                  )}
                </Card>
              </div>
            )}

            {tab === "social" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Instagram" hint="@iam_djlee">
                  {instagramPermalink ? (
                    <InstagramEmbed url={instagramPermalink} captioned skeletonHeight={480} />
                  ) : (
                    <EmptyState text="Provide a public Instagram post/reel URL." />
                  )}
                </Card>

                <Card title="Quick Links" hint="Open profiles">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(facebookPageUrl || defaultFacebookPageUrl) && (
                      <LinkTile href={facebookPageUrl || defaultFacebookPageUrl!} label="Facebook" icon={<Facebook size={18} />} />
                    )}
                    {(instagramPermalink || defaultInstagramUrl) && (
                      <LinkTile href={instagramPermalink || defaultInstagramUrl!} label="Instagram" icon={<Instagram size={18} />} />
                    )}
                    {(spotifyUrl || defaultSpotifyUrl) && (
                      <LinkTile href={normalizeSpotifyOpen(spotifyUrl || defaultSpotifyUrl!)} label="Spotify" icon={<Music size={18} />} />
                    )}
                    {appleMusicUrl && (
                      <LinkTile href={appleMusicUrl} label="Apple Music" icon={<Globe size={18} />} />
                    )}
                    {soundcloudUrl && (
                      <LinkTile href={soundcloudUrl} label="SoundCloud" icon={<Music size={18} />} />
                    )}
                  </div>
                </Card>
              </div>
            )}

            {tab === "share" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Share" hint="Let people jump in fast">
                  <div className="flex flex-wrap items-center gap-3">
                    <button onClick={nativeShare} className="btn btn-primary">
                      <Share2 size={18} /> Native Share
                    </button>
                    <button onClick={copyShare} className="btn btn-secondary">
                      {copied ? <Check size={18} /> : <Copy size={18} />} {copied ? "Copied" : "Copy Link"}
                    </button>
                    {canonical && (
                      <a href={canonical} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">
                        <Link2 size={18} /> Open Link
                      </a>
                    )}
                  </div>
                  <p className="mt-3 text-sm text-gray-600 break-all">{canonical}</p>
                </Card>

                <Card title="Deep Links" hint="Send people to a specific service">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(spotifyUrl || defaultSpotifyUrl) && <DeepLink href={normalizeSpotifyOpen(spotifyUrl || defaultSpotifyUrl!)} label="Open in Spotify" />}
                    {appleMusicUrl && <DeepLink href={appleMusicUrl} label="Open in Apple Music" />}
                    {facebookVideoHref && <DeepLink href={facebookVideoHref} label="Open Facebook Video" />}
                    {(facebookPageUrl || defaultFacebookPageUrl) && <DeepLink href={facebookPageUrl || defaultFacebookPageUrl!} label="Open Facebook Page" />}
                    {(instagramPermalink || defaultInstagramUrl) && <DeepLink href={instagramPermalink || defaultInstagramUrl!} label="Open Instagram" />}
                    {soundcloudUrl && <DeepLink href={soundcloudUrl} label="Open SoundCloud" />}
                  </div>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ----------------- helpers ----------------- */

function Card({
  title, hint, children,
}: React.PropsWithChildren<{ title: string; hint?: string }>) {
  return (
    <div className="rounded-2xl border border-white/20 bg-black/40 p-4 sm:p-5">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-gray-900 font-semibold tracking-tight">{title}</h3>
          {hint && <p className="text-xs text-gray-600">{hint}</p>}
        </div>
      </div>
      <div className="overflow-hidden rounded-xl bg-white">
        {children}
      </div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex h-48 items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-600">{text}</p>
    </div>
  );
}

function LinkTile({ href, label, icon }: { href: string; label: string; icon?: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-900 hover:bg-gray-50 transition">
      {icon} <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function DeepLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 transition">
      {label}
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
