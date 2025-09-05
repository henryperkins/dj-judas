import React, { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import {
  LuCirclePlay, LuMusic, LuShare2, LuFacebook, LuInstagram, LuCopy, LuCheck, LuLink2, LuGlobe, LuMic, LuQrCode
} from "react-icons/lu";
import { FaXTwitter, FaWhatsapp, FaLinkedinIn, FaFacebookMessenger, FaTelegram } from 'react-icons/fa6';
import QrShareCard from './QrShareCard';
import SpotifyEmbed from "./SpotifyEmbed";
import AppleMusicEmbed from "./AppleMusicEmbed";
import FacebookVideo from "./FacebookVideo";
import FacebookPage from "./FacebookPage";
import InstagramEmbed from "./InstagramEmbed";
import SocialEmbed from "./SocialEmbed";
import { shareWithTracking } from "../utils/metaSdk";

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
  const [copied, setCopied] = useState(false);
  const canonical = useMemo(() => shareUrl || (typeof window !== "undefined" ? window.location.href : ""), [shareUrl]);
  const [useUtm, setUseUtm] = useState(true);

  // Get environment variables for defaults
  const spotifyArtistId = import.meta.env?.VITE_SPOTIFY_ARTIST_ID;
  const instagramHandle = import.meta.env?.VITE_INSTAGRAM_HANDLE;
  const facebookPage = import.meta.env?.VITE_FACEBOOK_PAGE;
  const facebookAppId = import.meta.env?.VITE_FACEBOOK_APP_ID as string | undefined;
  const soundcloudUrl = import.meta.env?.VITE_SOUNDCLOUD_URL;
  const defaultSocialEmbedUrl = import.meta.env?.VITE_SOCIAL_EMBED_URL as string | undefined;

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

  // Build share URLs with optional UTM tagging
  function buildShareUrl(base: string, source: string) {
    try {
      const url = new URL(base);
      if (useUtm) {
        url.searchParams.set('utm_source', source);
        url.searchParams.set('utm_medium', 'share');
        url.searchParams.set('utm_campaign', 'creator_media_panel');
      }
      return url.toString();
    } catch {
      return base;
    }
  }

  const messengerHref = () => {
    try {
      const base = buildShareUrl(canonical, 'messenger');
      // Prefer desktop web dialog when App ID is configured
      if (facebookAppId && typeof window !== 'undefined') {
        const params = new URLSearchParams({
          app_id: facebookAppId,
          link: base,
          redirect_uri: window.location.origin
        });
        return `https://www.facebook.com/dialog/send?${params.toString()}`;
      }
      // Fallback to deep link (mobile only)
      return `fb-messenger://share?link=${encodeURIComponent(base)}`;
    } catch {
      return `fb-messenger://share?link=${encodeURIComponent(canonical)}`;
    }
  };

  const shareTargets = [
    {
      id: 'facebook',
      label: 'Facebook',
      icon: LuFacebook,
      color: '#1877F2',
      href: () => '#',
    },
    {
      id: 'x',
      label: 'X',
      icon: FaXTwitter,
      color: '#000000',
      href: () => `https://twitter.com/intent/tweet?url=${encodeURIComponent(buildShareUrl(canonical, 'x'))}&text=${encodeURIComponent(`${artist} – ${tagline}`)}`,
    },
    {
      id: 'whatsapp',
      label: 'WhatsApp',
      icon: FaWhatsapp,
      color: '#25D366',
      href: () => `https://wa.me/?text=${encodeURIComponent(`${artist} – ${tagline}\n${buildShareUrl(canonical, 'whatsapp')}`)}`,
    },
    {
      id: 'messenger',
      label: 'Messenger',
      icon: FaFacebookMessenger,
      color: '#0084FF',
      href: messengerHref,
    },
    {
      id: 'telegram',
      label: 'Telegram',
      icon: FaTelegram,
      color: '#26A4E3',
      href: () => `https://t.me/share/url?url=${encodeURIComponent(buildShareUrl(canonical, 'telegram'))}&text=${encodeURIComponent(`${artist} – ${tagline}`)}`,
    },
    {
      id: 'linkedin',
      label: 'LinkedIn',
      icon: FaLinkedinIn,
      color: '#0A66C2',
      href: () => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(buildShareUrl(canonical, 'linkedin'))}`,
    },
    {
      id: 'email',
      label: 'Email',
      icon: LuLink2,
      color: 'hsl(var(--secondary-foreground))',
      href: () => `mailto:?subject=${encodeURIComponent(`${artist} – ${tagline}`)}&body=${encodeURIComponent(buildShareUrl(canonical, 'email'))}`,
    },
  ] as const;

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
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Spotify" hint="Playlists, tracks, albums">
                  {(spotifyUrl || defaultSpotifyUrl) ? (
                    <SpotifyEmbed url={spotifyUrl || defaultSpotifyUrl} />
                  ) : (
                    <EmptyState text="Add a Spotify URL to play here." />
                  )}
                </SectionCard>

                <SectionCard title="Apple Music" hint="Albums & songs">
                  {appleMusicUrl ? (
                    <AppleMusicEmbed url={appleMusicUrl} />
                  ) : (
                    <EmptyState text="Add an Apple Music link to play here." />
                  )}
                </SectionCard>
              </div>
            )}

            {tab === "watch" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Facebook Video / Live" hint="Public videos & live streams">
                  {facebookVideoHref ? (
                    <FacebookVideo
                      href={facebookVideoHref}
                      height={400}
                    />
                  ) : (
                    <EmptyState text="Provide a Facebook video/live URL." />
                  )}
                </SectionCard>

                <SectionCard title="Facebook Page" hint="Timeline embed">
                  {(facebookPageUrl || defaultFacebookPageUrl) ? (
                    <FacebookPage
                      pageUrl={facebookPageUrl || defaultFacebookPageUrl!}
                      tabs="timeline"
                      height={560}
                      // Remove appId from here - it should be initialized globally
                    />
                  ) : (
                    <EmptyState text="Provide a Facebook Page URL." />
                  )}
                </SectionCard>
              </div>
            )}

            {tab === "social" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Instagram" hint="@iam_djlee">
                  {instagramPermalink ? (
                    <InstagramEmbed url={instagramPermalink} skeletonHeight={480} />
                  ) : (
                    <EmptyState text="Provide a public Instagram post/reel URL." />
                  )}
                </SectionCard>

                <SectionCard title="Quick Links" hint="Open profiles">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                    {soundcloudUrl && (
                      <LinkTile href={soundcloudUrl} label="SoundCloud" icon={<LuMusic size={18} />} />
                    )}
                  </div>
                </SectionCard>

                <SectionCard title="Universal Embed" hint="TikTok, YouTube, X, LinkedIn and more">
                  {(socialEmbedUrl || defaultSocialEmbedUrl) ? (
                    <SocialEmbed url={(socialEmbedUrl || defaultSocialEmbedUrl)!} />
                  ) : (
                    <EmptyState text="Provide any supported social post URL (e.g., TikTok/YouTube/Twitter)." />
                  )}
                </SectionCard>
              </div>
            )}

            {tab === "share" && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SectionCard title="Quick Share" hint="One-tap sharing with tracking">
                  <div className="share-toolbar">
                    <div className="share-actions">
                      <button onClick={nativeShare} className="btn btn-primary" aria-label="Native share">
                        <LuShare2 size={18} /> Share
                      </button>
                      <button onClick={copyShare} className="btn btn-secondary" aria-label="Copy link">
                        {copied ? <LuCheck size={18} /> : <LuCopy size={18} />} {copied ? "Copied" : "Copy"}
                      </button>
                      {canonical && (
                        <a href={canonical} target="_blank" rel="noopener noreferrer" className="btn btn-ghost" aria-label="Open link">
                          <LuLink2 size={18} /> Open
                        </a>
                      )}
                      <button className="btn btn-ghost" aria-label="Show QR" onClick={() => setTab('share')}>
                        <LuQrCode size={18} /> QR
                      </button>
                    </div>
                    <label className="utm-toggle">
                      <input type="checkbox" checked={useUtm} onChange={(e) => setUseUtm(e.target.checked)} />
                      <span>Add UTM tags</span>
                    </label>
                  </div>

                  <div className="share-grid">
                  {shareTargets.map(({ id, label, icon: Icon, color, href }) => (
                    <a
                      key={id}
                      href={href()}
                      aria-label={`Share on ${label}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="share-btn"
                      style={{ ['--brand' as any]: color }}
                      onClick={async (e) => {
                        trackShareClick(id);
                        if (id === 'facebook') {
                          e.preventDefault();
                          await shareWithTracking({
                            url: buildShareUrl(canonical, 'facebook'),
                            quote: `${artist} – ${tagline}`,
                            source: 'creator_media_panel'
                          });
                        }
                      }}
                    >
                      <Icon size={18} />
                      <span>{label}</span>
                    </a>
                  ))}
                  </div>

                  <p className="mt-3 text-xs text-muted-foreground break-all" aria-live="polite">{canonical}</p>
                </SectionCard>

                <SectionCard title="Share via QR" hint="Great for screens and posters">
                  <div className="qr-section">
                    <QrShareCard url={buildShareUrl(canonical, 'qr')} />
                  </div>
                </SectionCard>

                <SectionCard title="Deep Links" hint="Send people to a specific service">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(spotifyUrl || defaultSpotifyUrl) && <DeepLink href={normalizeSpotifyOpen(spotifyUrl || defaultSpotifyUrl!)} label="Open in Spotify" />}
                    {appleMusicUrl && <DeepLink href={appleMusicUrl} label="Open in Apple Music" />}
                    {facebookVideoHref && <DeepLink href={facebookVideoHref} label="Open Facebook Video" />}
                    {(facebookPageUrl || defaultFacebookPageUrl) && <DeepLink href={facebookPageUrl || defaultFacebookPageUrl!} label="Open Facebook Page" />}
                    {(instagramPermalink || defaultInstagramUrl) && <DeepLink href={instagramPermalink || defaultInstagramUrl!} label="Open Instagram" />}
                    {soundcloudUrl && <DeepLink href={soundcloudUrl} label="Open SoundCloud" />}
                  </div>
                </SectionCard>
              </div>
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
    <a href={href} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 rounded-md border bg-card px-3 py-2 text-foreground hover:bg-secondary transition">
      {icon} <span className="text-sm font-medium">{label}</span>
    </a>
  );
}

function DeepLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="rounded-md border bg-card px-3 py-2 text-sm text-foreground hover:bg-secondary transition">
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

function trackShareClick(channel: string) {
  try {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'share_click', { channel });
    }
    if (typeof window !== 'undefined' && (window as any).fbq) {
      (window as any).fbq('trackCustom', 'ShareClick', { channel });
    }
  } catch {}
}
