import React from 'react';
import {
  InstagramEmbed,
  TikTokEmbed,
  YouTubeEmbed,
  FacebookEmbed,
  XEmbed,
  TwitterEmbed,
  LinkedInEmbed,
  PinterestEmbed,
  PlaceholderEmbed,
} from 'react-social-media-embed';

export type SocialEmbedProps = {
  url: string;
  maxWidth?: number;
  className?: string;
};

function pickEmbed(url: string): React.ReactNode {
  let host = '';
  try {
    host = new URL(url).host.toLowerCase();
  } catch {
    return <PlaceholderEmbed url={url} />;
  }

  if (host.includes('tiktok.com')) return <TikTokEmbed url={url} />;
  if (host.includes('instagram.com')) return <InstagramEmbed url={url} />;
  if (host.includes('facebook.com')) return <FacebookEmbed url={url} />;
  if (host.includes('youtube.com') || host.includes('youtu.be')) return <YouTubeEmbed url={url} />;
  if (host.includes('x.com')) return <XEmbed url={url} />;
  if (host.includes('twitter.com')) return <TwitterEmbed url={url} />;
  if (host.includes('linkedin.com')) return <LinkedInEmbed url={url} />;
  if (host.includes('pinterest.')) return <PinterestEmbed url={url} />;

  return <PlaceholderEmbed url={url} />;
}

const SocialEmbed: React.FC<SocialEmbedProps> = ({ url, maxWidth = 600, className }) => {
  const content = pickEmbed(url);
  return (
    <div className={className} style={{ maxWidth }}>
      {content}
    </div>
  );
};

export default SocialEmbed;

