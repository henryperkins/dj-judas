import { metaSDK } from '@/react-app/utils/metaSdk';

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
    (window as any).fbq?.('track', 'PageView');
  } catch {
    // ignore
  }
}

