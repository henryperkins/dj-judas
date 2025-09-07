declare module 'react-social-media-embed' {
  import * as React from 'react';
  interface BaseEmbedProps {
    url: string;
    width?: number | string;
    height?: number | string;
    [key: string]: unknown;
  }
  export const InstagramEmbed: React.FC<BaseEmbedProps>;
  export const TikTokEmbed: React.FC<BaseEmbedProps>;
  export const YouTubeEmbed: React.FC<BaseEmbedProps>;
  export const FacebookEmbed: React.FC<BaseEmbedProps>;
  export const XEmbed: React.FC<BaseEmbedProps>;
  export const TwitterEmbed: React.FC<BaseEmbedProps>;
  export const LinkedInEmbed: React.FC<BaseEmbedProps>;
  export const PinterestEmbed: React.FC<BaseEmbedProps>;
  export const PlaceholderEmbed: React.FC<BaseEmbedProps>;
}
