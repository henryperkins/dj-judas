type AppleMusicLinkOptions = {
  affiliateToken?: string;
  campaignToken?: string;
  action?: string;
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
