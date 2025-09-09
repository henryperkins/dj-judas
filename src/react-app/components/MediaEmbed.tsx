
type Props = { url: string; title?: string; height?: number };
const isSpotify = (u: string) => /open\.spotify\.com|spotify\.link/.test(u);
const isApple = (u: string) => /music\.apple\.com|embed\.music\.apple\.com/.test(u);

export default function MediaEmbed({ url, title = 'Media', height = 352 }: Props) {
  if (!url) return null;

  if (isSpotify(url)) {
    const embedUrl = url.includes('/embed/') ? url : url.replace('open.spotify.com/', 'open.spotify.com/embed/');
    return (
      <iframe
        title={title}
        loading="lazy"
        style={{ border: 0, width: '100%', height }}
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        src={embedUrl}
      />
    );
  }

  if (isApple(url)) {
    const u = url.includes('embed.music.apple.com') ? url : url.replace('music.apple.com', 'embed.music.apple.com');
    return (
      <iframe
        title={title}
        loading="lazy"
        style={{ border: 0, width: '100%', height }}
        allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
        src={u}
      />
    );
  }

  return (
    <a href={url} target="_blank" rel="noreferrer">
      {title}
    </a>
  );
}

