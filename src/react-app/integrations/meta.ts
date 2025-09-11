import { metaSDK } from '@/react-app/components/social/utils/metaSdk';

export async function initMeta() {
  try {
    await metaSDK.loadFacebookSDK();
    await metaSDK.loadPixel();
  } catch (e) {
    console.warn('Meta SDK/Pixel init failed:', e);
  }
}

export function pageView() {
  try {
    const win = window as unknown as { fbq?: (...args: unknown[]) => void };
    win.fbq?.('track', 'PageView');
  } catch {
    // ignore
  }
}

