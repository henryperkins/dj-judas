/**
 * Single source-of-truth for working with UTM parameters.
 */

export type UtmParams = Partial<{
  source: string;
  medium: string;
  campaign: string;
  content: string;
  term: string;
}>;

/**
 * Add (or merge) UTM parameters onto a URL string.
 * Automatically resolves relative URLs against `window.location.origin`.
 */
export function addUtm(url: string, p: UtmParams): string {
  const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : 'http://localhost');
  Object.entries(p).forEach(([k, v]) => {
    if (v) u.searchParams.set(`utm_${k}`, v);
  });
  return u.toString();
}
