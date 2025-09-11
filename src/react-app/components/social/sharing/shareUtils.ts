/**
 * Share utilities for building tracked URLs and managing share operations
 */

export interface UtmParams {
  source?: string;
  medium?: string;
  campaign?: string;
  content?: string;
  term?: string;
}

/**
 * Build a URL with UTM tracking parameters
 */
export function buildTrackedUrl(
  baseUrl: string,
  params: UtmParams
): string {
  const url = new URL(baseUrl, window.location.origin);
  
  // Add UTM parameters
  if (params.source) url.searchParams.set('utm_source', params.source);
  if (params.medium) url.searchParams.set('utm_medium', params.medium);
  if (params.campaign) url.searchParams.set('utm_campaign', params.campaign);
  if (params.content) url.searchParams.set('utm_content', params.content);
  if (params.term) url.searchParams.set('utm_term', params.term);
  
  return url.toString();
}

/**
 * Append UTM parameters to an existing URL
 */
export function appendUtmParams(
  url: string,
  params: UtmParams
): string {
  try {
    const urlObj = new URL(url);
    
    // Add UTM parameters
    if (params.source) urlObj.searchParams.set('utm_source', params.source);
    if (params.medium) urlObj.searchParams.set('utm_medium', params.medium);
    if (params.campaign) urlObj.searchParams.set('utm_campaign', params.campaign);
    if (params.content) urlObj.searchParams.set('utm_content', params.content);
    if (params.term) urlObj.searchParams.set('utm_term', params.term);
    
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Get the canonical URL for sharing
 */
export function getCanonicalUrl(): string {
  // Check for canonical link element
  const canonicalLink = document.querySelector('link[rel="canonical"]');
  if (canonicalLink) {
    const href = canonicalLink.getAttribute('href');
    if (href) return href;
  }
  
  // Check for og:url meta tag
  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) {
    const content = ogUrl.getAttribute('content');
    if (content) return content;
  }
  
  // Fallback to current URL without hash
  const url = new URL(window.location.href);
  url.hash = '';
  return url.toString();
}

/**
 * Get page metadata for sharing
 */
export function getPageMetadata() {
  const title = document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
                document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
                document.title;
                
  const description = document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
                      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
                      '';
                      
  const image = document.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
                document.querySelector('meta[name="twitter:image"]')?.getAttribute('content') ||
                '';
                
  return { title, description, image };
}

/**
 * Copy text to clipboard with fallback
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback for older browsers
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      textArea.remove();
      return successful;
    } catch {
      textArea.remove();
      return false;
    }
  } catch {
    return false;
  }
}

/**
 * Check if native share API is available
 */
export function supportsNativeShare(): boolean {
  return typeof navigator !== 'undefined' && 
         'share' in navigator && 
         typeof navigator.share === 'function';
}

/**
 * Native share with fallback
 */
export async function nativeShare(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (!supportsNativeShare()) {
    return false;
  }
  
  try {
    await navigator.share(data);
    return true;
  } catch (error) {
    // User cancelled or error occurred
    if (error instanceof Error && error.name === 'AbortError') {
      // User cancelled - not an error
      return true;
    }
    return false;
  }
}

/**
 * Open share URL in popup window
 */
export function openSharePopup(
  url: string,
  title: string = 'Share',
  width: number = 600,
  height: number = 400
): Window | null {
  const left = (window.innerWidth - width) / 2;
  const top = (window.innerHeight - height) / 2;
  
  return window.open(
    url,
    title,
    `width=${width},height=${height},left=${left},top=${top},` +
    'menubar=no,toolbar=no,resizable=yes,scrollbars=yes'
  );
}