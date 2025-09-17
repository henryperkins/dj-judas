// Social components barrel exports

// Feeds
export { default as DynamicSocialFeed } from './feeds/DynamicSocialFeed';
export { default as FacebookEvents } from './feeds/FacebookEvents';

// Embeds
export { default as InstagramEmbed } from './embeds/InstagramEmbed';
export { default as FacebookEmbed } from './embeds/FacebookEmbed';
export { default as SpotifyEmbed } from './embeds/SpotifyEmbed';
export { default as AppleMusicEmbed } from './embeds/AppleMusicEmbed';
export { default as UniversalEmbed } from './embeds/UniversalEmbed';

// Sharing
export { default as QrShareCard } from './sharing/QrShareCard';
export { default as ShareButton } from './sharing/ShareButton';
export { default as ShareManager } from './sharing/ShareManager';
export * from './sharing/shareUtils';

// Utils
export * from './utils/socialMetrics';
export * from './utils/metaSdk';

// Types
export * from './types';