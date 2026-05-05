export * from './analytics';
export * from './meta';

// Keep Apple Music SDK access lazy so Meta/page-view imports do not pull it into the main bundle.
export const getAppleMusicKit = async () => {
  const { appleMusicKit } = await import('@/react-app/utils/appleMusicKit');
  return appleMusicKit;
};

export const loadAppleMusicKit = async () => {
  const { loadAppleMusicKit } = await import('@/react-app/utils/appleMusicKit');
  return loadAppleMusicKit();
};

export const authorizeAppleMusic = async () => {
  const { authorizeAppleMusic } = await import('@/react-app/utils/appleMusicKit');
  return authorizeAppleMusic();
};

export const addToAppleMusicLibrary = async (items: { id: string; type: 'songs' | 'albums' | 'playlists' }[]) => {
  const { addToAppleMusicLibrary } = await import('@/react-app/utils/appleMusicKit');
  return addToAppleMusicLibrary(items);
};

export const playAppleMusic = async (contentId?: string, contentType?: 'song' | 'album' | 'playlist') => {
  const { playAppleMusic } = await import('@/react-app/utils/appleMusicKit');
  return playAppleMusic(contentId, contentType);
};

export {
  metaSDK,
  loadFacebookSDK,
  loadInstagramEmbed,
  parseFBML,
  processInstagramEmbeds,
  grantMetaPixelConsent,
  revokeMetaPixelConsent,
  setMetaPixelConsent,
  trackMetaPixelPageView,
  shareWithTracking
} from '@/react-app/components/social/utils/metaSdk';
