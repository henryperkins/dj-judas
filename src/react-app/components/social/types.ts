// Shared TypeScript types for social components

export interface SocialPost {
  id: string;
  platform: 'instagram' | 'facebook' | 'twitter' | 'tiktok' | 'youtube';
  type: 'post' | 'reel' | 'story' | 'video' | 'photo';
  content?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  permalink: string;
  timestamp: string;
  engagement?: {
    likes?: number;
    comments?: number;
    shares?: number;
    views?: number;
  };
  shoppable?: boolean;
  products?: Array<{
    id: string;
    name: string;
    price: number;
    url: string;
  }>;
}

export interface EmbedConfig {
  url: string;
  width?: number | string;
  height?: number | string;
  autoplay?: boolean;
  showCaptions?: boolean;
  theme?: 'light' | 'dark';
  className?: string;
}

export interface ShareConfig {
  url: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  via?: string;
  utm?: {
    source?: string;
    medium?: string;
    campaign?: string;
    term?: string;
    content?: string;
  };
}

export interface SocialMetricsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  platform?: string;
  contentId?: string;
}

export interface FacebookEmbedConfig extends EmbedConfig {
  type: 'page' | 'video' | 'post' | 'events' | 'watch' | 'live';
  pageId?: string;
  videoId?: string;
  postId?: string;
  // Accept either a CSV string (as used by data-tabs) or an array for convenience
  tabs?: string | string[];
  smallHeader?: boolean;
  hideCover?: boolean;
  showFacepile?: boolean;
  hideCta?: boolean;
}

export interface InstagramEmbedConfig extends EmbedConfig {
  captioned?: boolean;
  maxWidth?: number;
  hideCaption?: boolean;
}

export interface SpotifyEmbedConfig extends EmbedConfig {
  type: 'track' | 'album' | 'playlist' | 'artist';
  id: string;
  showSaveButton?: boolean;
  showFollowButton?: boolean;
  compact?: boolean;
}

export interface AppleMusicEmbedConfig extends EmbedConfig {
  type: 'album' | 'playlist' | 'song';
  id: string;
  country?: string;
}
