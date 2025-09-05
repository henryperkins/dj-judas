declare module 'react-social-media-embed' {
  import * as React from 'react';
  export const InstagramEmbed: React.FC<{ url: string; [key: string]: any }>;
  export const TikTokEmbed: React.FC<{ url: string; [key: string]: any }>;
  export const YouTubeEmbed: React.FC<{ url: string; [key: string]: any }>;
  export const FacebookEmbed: React.FC<{ url: string; [key: string]: any }>;
  export const XEmbed: React.FC<{ url: string; [key: string]: any }>;
  export const TwitterEmbed: React.FC<{ url: string; [key: string]: any }>;
  export const LinkedInEmbed: React.FC<{ url: string; [key: string]: any }>;
  export const PinterestEmbed: React.FC<{ url: string; [key: string]: any }>;
  export const PlaceholderEmbed: React.FC<{ url: string; [key: string]: any }>;
}
