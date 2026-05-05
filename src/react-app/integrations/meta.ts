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
    metaSDK.trackPageView();
  } catch {
    // ignore
  }
}

export function grantMetaConsent() {
  metaSDK.grantPixelConsent();
}

export function revokeMetaConsent() {
  metaSDK.revokePixelConsent();
}
