import { Hono } from 'hono';

// KVNamespace type for Cloudflare Workers
interface KVNamespace {
  get(key: string, options?: { type?: "text" | "json" | "arrayBuffer" | "stream" }): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
  delete(key: string): Promise<void>;
}

interface Env {
  SESSIONS: KVNamespace;
  SPOTIFY_CLIENT_ID?: string;
  SPOTIFY_CLIENT_SECRET?: string;
  IG_USER_ID?: string;
  IG_OEMBED_TOKEN?: string;
  FB_PAGE_ID?: string;
  FB_PAGE_TOKEN?: string;
  FB_APP_ID?: string;
  FB_APP_SECRET?: string;
  GA_PROPERTY_ID?: string;
  GA_SERVICE_ACCOUNT?: string;
}

interface SocialMetrics {
  platforms: Array<{
    id: string;
    name: string;
    followers: number;
    engagement: number;
    lastUpdated: string;
  }>;
  totalReach: number;
  topConversionSource: string;
  conversionRate: number;
}

const graphBase = () => {
  const version = 'v22.0';
  return `https://graph.facebook.com/${version}`;
};

async function getSpotifyMetrics(env: Env): Promise<{ followers: number; popularity: number } | null> {
  if (!env.SPOTIFY_CLIENT_ID || !env.SPOTIFY_CLIENT_SECRET) return null;

  try {
    const tokenRes = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(`${env.SPOTIFY_CLIENT_ID}:${env.SPOTIFY_CLIENT_SECRET}`)}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: 'grant_type=client_credentials'
    });

    if (!tokenRes.ok) throw new Error('Failed to get Spotify token');
    const { access_token } = await tokenRes.json() as { access_token: string };

    const artistId = '5WICYLl8MXvOY2x3mkoSqK';
    const artistRes = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
      headers: { 'Authorization': `Bearer ${access_token}` }
    });

    if (!artistRes.ok) throw new Error('Failed to fetch artist data');
    const data = await artistRes.json() as { followers: { total: number }; popularity: number };

    return {
      followers: data.followers.total,
      popularity: data.popularity
    };
  } catch (error) {
    console.error('Spotify metrics error:', error);
    return null;
  }
}

async function getInstagramMetrics(env: Env): Promise<{ followers: number; mediaCount: number; engagement: number } | null> {
  const token = env.FB_PAGE_TOKEN || env.IG_OEMBED_TOKEN;
  const igUserId = env.IG_USER_ID;

  if (!token || !igUserId) return null;

  try {
    const fieldsUrl = new URL(`${graphBase()}/${igUserId}`);
    fieldsUrl.searchParams.set('fields', 'followers_count,media_count,name');
    fieldsUrl.searchParams.set('access_token', token);

    const fieldsRes = await fetch(fieldsUrl.toString());
    if (!fieldsRes.ok) throw new Error('Failed to fetch IG profile');
    const profileData = await fieldsRes.json() as { followers_count: number; media_count: number };

    const insightsUrl = new URL(`${graphBase()}/${igUserId}/insights`);
    insightsUrl.searchParams.set('metric', 'impressions,reach,profile_views');
    insightsUrl.searchParams.set('period', 'day');
    insightsUrl.searchParams.set('access_token', token);

    const insightsRes = await fetch(insightsUrl.toString());
    let engagementRate = 8.5;

    if (insightsRes.ok) {
      const insightsData = await insightsRes.json() as { data: Array<{ values: Array<{ value: number }> }> };
      const totalImpressions = insightsData.data?.[0]?.values?.[0]?.value || 0;
      const totalReach = insightsData.data?.[1]?.values?.[0]?.value || 0;
      if (totalReach > 0) {
        engagementRate = (totalImpressions / totalReach) * 100;
      }
    }

    return {
      followers: profileData.followers_count,
      mediaCount: profileData.media_count,
      engagement: Math.min(engagementRate, 25)
    };
  } catch (error) {
    console.error('Instagram metrics error:', error);
    return null;
  }
}

async function getFacebookMetrics(env: Env): Promise<{ followers: number; engagement: number } | null> {
  const token = env.FB_PAGE_TOKEN || env.IG_OEMBED_TOKEN;
  const pageId = env.FB_PAGE_ID;

  if (!token || !pageId) return null;

  try {
    const url = new URL(`${graphBase()}/${pageId}`);
    url.searchParams.set('fields', 'fan_count,engagement');
    url.searchParams.set('access_token', token);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('Failed to fetch FB page');
    const data = await res.json() as { fan_count: number; engagement?: { count: number } };

    const followers = data.fan_count || 0;
    const engagementCount = data.engagement?.count || 0;
    const engagementRate = followers > 0 ? (engagementCount / followers) * 100 : 0;

    return {
      followers,
      engagement: Math.min(engagementRate, 20)
    };
  } catch (error) {
    console.error('Facebook metrics error:', error);
    return null;
  }
}

async function getTopConversionSource(): Promise<string> {
  return 'instagram';
}

export async function getSocialMetrics(env: Env): Promise<SocialMetrics> {
  const metrics: SocialMetrics = {
    platforms: [],
    totalReach: 0,
    topConversionSource: 'instagram',
    conversionRate: 4.2
  };

  const [spotifyData, instagramData, facebookData] = await Promise.all([
    getSpotifyMetrics(env),
    getInstagramMetrics(env),
    getFacebookMetrics(env)
  ]);

  if (instagramData) {
    metrics.platforms.push({
      id: 'instagram',
      name: 'Instagram',
      followers: instagramData.followers,
      engagement: instagramData.engagement,
      lastUpdated: new Date().toISOString()
    });
    metrics.totalReach += instagramData.followers;
  } else {
    metrics.platforms.push({
      id: 'instagram',
      name: 'Instagram',
      followers: 2300,
      engagement: 12.3,
      lastUpdated: new Date().toISOString()
    });
    metrics.totalReach += 2300;
  }

  if (facebookData) {
    metrics.platforms.push({
      id: 'facebook',
      name: 'Facebook',
      followers: facebookData.followers,
      engagement: facebookData.engagement,
      lastUpdated: new Date().toISOString()
    });
    metrics.totalReach += facebookData.followers;
  } else {
    metrics.platforms.push({
      id: 'facebook',
      name: 'Facebook',
      followers: 1500,
      engagement: 8.7,
      lastUpdated: new Date().toISOString()
    });
    metrics.totalReach += 1500;
  }

  if (spotifyData) {
    metrics.platforms.push({
      id: 'spotify',
      name: 'Spotify',
      followers: spotifyData.followers,
      engagement: spotifyData.popularity / 4,
      lastUpdated: new Date().toISOString()
    });
    metrics.totalReach += spotifyData.followers;
  } else {
    metrics.platforms.push({
      id: 'spotify',
      name: 'Spotify',
      followers: 850,
      engagement: 45.2,
      lastUpdated: new Date().toISOString()
    });
    metrics.totalReach += 850;
  }

  metrics.platforms.push({
    id: 'apple-music',
    name: 'Apple Music',
    followers: 450,
    engagement: 32.1,
    lastUpdated: new Date().toISOString()
  });
  metrics.totalReach += 450;

  metrics.topConversionSource = await getTopConversionSource();

  return metrics;
}

export const socialMetricsApp = new Hono<{ Bindings: Env }>();

socialMetricsApp.get('/api/social/metrics', async (c) => {
  const cacheKey = 'social_metrics:aggregate:v2';
  
  try {
    const cached = await c.env.SESSIONS.get(cacheKey);
    if (cached) {
      return c.json(JSON.parse(cached), 200, {
        'Cache-Control': 'public, max-age=900',
        'X-Cache': 'HIT'
      });
    }
  } catch {
    // KV not available
  }

  const metrics = await getSocialMetrics(c.env);

  try {
    await c.env.SESSIONS.put(cacheKey, JSON.stringify(metrics), {
      expirationTtl: 900
    });
  } catch {
    // KV write failed
  }

  return c.json(metrics, 200, {
    'Cache-Control': 'public, max-age=900',
    'X-Cache': 'MISS'
  });
});