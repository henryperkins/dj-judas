type AppleMusicLinkOptions = {
  affiliateToken?: string;
  campaignToken?: string;
  action?: string;
};

export type AppleMusicContent = {
  id: string;
  type: 'songs' | 'albums' | 'playlists';
};

export function buildAppleMusicLink(baseUrl: string, options: AppleMusicLinkOptions = {}): string {
  try {
    const parsed = new URL(baseUrl);

    if (options.affiliateToken) {
      parsed.searchParams.set('at', options.affiliateToken);
    }
    if (options.campaignToken) {
      parsed.searchParams.set('ct', options.campaignToken);
    }
    if (options.action) {
      parsed.searchParams.set('action', options.action);
    }

    return parsed.toString();
  } catch {
    return baseUrl;
  }
}

export function extractAppleMusicContentFromUrl(url: string): AppleMusicContent | null {
  const cleanUrl = url.split('?')[0];
  const match = cleanUrl.match(/music\.apple\.com\/[^/]+\/(album|playlist|song)\/[^/]+\/(?:pl\.)?([a-zA-Z0-9]+)/);
  if (!match) return null;

  switch (match[1]) {
    case 'song':
      return { id: match[2], type: 'songs' };
    case 'album':
      return { id: match[2], type: 'albums' };
    case 'playlist':
      return { id: match[2], type: 'playlists' };
    default:
      return null;
  }
}
