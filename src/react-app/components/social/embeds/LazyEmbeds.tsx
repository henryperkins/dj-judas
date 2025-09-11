import React, { lazy, Suspense, useEffect } from 'react';
import { useSocialSDK } from '../../../hooks/useSocialSDK';
import type { SocialSDKState } from '../../../providers/SocialProvider';

const SpotifyEmbed = lazy(() => import('./SpotifyEmbed'));
const AppleMusicEmbed = lazy(() => import('./AppleMusicEmbed'));
const InstagramEmbed = lazy(() => import('./InstagramEmbed'));
const FacebookEmbed = lazy(() => import('./FacebookEmbed'));
const TwitterEmbed = lazy(() => import('./TwitterEmbed'));
const TikTokEmbed = lazy(() => import('./TikTokEmbed'));

interface EmbedLoaderProps {
  platform: 'spotify' | 'apple' | 'instagram' | 'facebook' | 'twitter' | 'tiktok';
  children: React.ReactNode;
}

const EmbedLoader: React.FC<EmbedLoaderProps> = ({ platform, children }) => {
  const { loadSDK } = useSocialSDK();

  useEffect(() => {
    const platformMap: Record<string, keyof SocialSDKState> = {
      instagram: 'meta',
      facebook: 'meta',
      twitter: 'twitter',
      tiktok: 'tiktok',
      apple: 'apple',
      spotify: 'spotify'
    };

    const sdkPlatform = platformMap[platform];
    if (sdkPlatform) {
      loadSDK(sdkPlatform);
    }
  }, [platform, loadSDK]);

  return <>{children}</>;
};

const EmbedSkeleton: React.FC<{ height?: string }> = ({ height = '400px' }) => (
  <div className="embed-skeleton" style={{ minHeight: height }}>
    <div className="skeleton-pulse" />
  </div>
);

export const LazySpotifyEmbed: React.FC<{ uri: string; height?: string }> = ({ uri, height }) => (
  <EmbedLoader platform="spotify">
    <Suspense fallback={<EmbedSkeleton height={height} />}>
      <SpotifyEmbed url={uri} />
    </Suspense>
  </EmbedLoader>
);

export const LazyAppleMusicEmbed: React.FC<{ url: string; height?: string }> = ({ url, height }) => (
  <EmbedLoader platform="apple">
    <Suspense fallback={<EmbedSkeleton height={height} />}>
      <AppleMusicEmbed url={url} height={height ? parseInt(height) : undefined} />
    </Suspense>
  </EmbedLoader>
);

export const LazyInstagramEmbed: React.FC<{ url: string }> = ({ url }) => (
  <EmbedLoader platform="instagram">
    <Suspense fallback={<EmbedSkeleton />}>
      <InstagramEmbed url={url} />
    </Suspense>
  </EmbedLoader>
);

export const LazyFacebookEmbed: React.FC<{ url: string; type?: 'post' | 'video' }> = ({ url, type }) => (
  <EmbedLoader platform="facebook">
    <Suspense fallback={<EmbedSkeleton />}>
      <FacebookEmbed url={url} type={type} />
    </Suspense>
  </EmbedLoader>
);

export const LazyTwitterEmbed: React.FC<{ url: string }> = ({ url }) => (
  <EmbedLoader platform="twitter">
    <Suspense fallback={<EmbedSkeleton />}>
      <TwitterEmbed url={url} />
    </Suspense>
  </EmbedLoader>
);

export const LazyTikTokEmbed: React.FC<{ url: string }> = ({ url }) => (
  <EmbedLoader platform="tiktok">
    <Suspense fallback={<EmbedSkeleton />}>
      <TikTokEmbed url={url} />
    </Suspense>
  </EmbedLoader>
);

interface LazyUniversalEmbedProps {
  url: string;
  platform?: string;
  type?: string;
  height?: string;
}

export const LazyUniversalEmbed: React.FC<LazyUniversalEmbedProps> = ({ url, platform, type, height }) => {
  const detectedPlatform = platform || detectPlatform(url);

  switch (detectedPlatform) {
    case 'spotify':
      return <LazySpotifyEmbed uri={url} height={height} />;
    case 'apple':
      return <LazyAppleMusicEmbed url={url} height={height} />;
    case 'instagram':
      return <LazyInstagramEmbed url={url} />;
    case 'facebook':
      return <LazyFacebookEmbed url={url} type={(type === 'post' || type === 'video') ? type : undefined} />;
    case 'twitter':
      return <LazyTwitterEmbed url={url} />;
    case 'tiktok':
      return <LazyTikTokEmbed url={url} />;
    default:
      return <div className="embed-error">Unsupported embed URL</div>;
  }
};

function detectPlatform(url: string): string {
  if (url.includes('spotify.com') || url.includes('spotify:')) return 'spotify';
  if (url.includes('music.apple.com')) return 'apple';
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('facebook.com') || url.includes('fb.com')) return 'facebook';
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'unknown';
}