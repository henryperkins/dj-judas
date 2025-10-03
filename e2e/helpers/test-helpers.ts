import { Page, expect } from '@playwright/test';

/**
 * Test helper utilities for E2E tests
 */

/**
 * Wait for network to be idle (useful after navigation)
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState('networkidle', { timeout });
}

/**
 * Clear all cookies (useful for logout/reset tests)
 */
export async function clearAllCookies(page: Page) {
  const context = page.context();
  await context.clearCookies();
}

/**
 * Get cookie by name
 */
export async function getCookie(page: Page, name: string) {
  const cookies = await page.context().cookies();
  return cookies.find(c => c.name === name);
}

/**
 * Check if element is visible and enabled
 */
export async function isInteractable(page: Page, selector: string): Promise<boolean> {
  try {
    const element = page.locator(selector);
    const isVisible = await element.isVisible();
    const isEnabled = await element.isEnabled();
    return isVisible && isEnabled;
  } catch {
    return false;
  }
}

/**
 * Wait for URL pattern match
 */
export async function waitForUrlPattern(page: Page, pattern: RegExp, timeout = 10000) {
  await page.waitForURL(pattern, { timeout });
}

/**
 * Mock Spotify OAuth callback
 */
export async function mockSpotifyCallback(page: Page, code = 'test_code', state = 'test_state') {
  await page.goto(`/api/spotify/callback?code=${code}&state=${state}`);
}

/**
 * Check if logged into Spotify
 */
export async function isSpotifyAuthenticated(page: Page): Promise<boolean> {
  const cookie = await getCookie(page, 'spotify_session');
  return cookie !== undefined;
}

/**
 * Mock Apple Music developer token response
 */
export async function mockAppleMusicToken(page: Page) {
  await page.route('/api/apple/developer-token', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        token: 'mock_apple_token',
        cached: false,
        exp: Math.floor(Date.now() / 1000) + 3600
      })
    });
  });
}

/**
 * Check if Medusa cart exists in localStorage
 */
export async function getMedusaCartId(page: Page): Promise<string | null> {
  return await page.evaluate(() => localStorage.getItem('medusa_cart_id'));
}

/**
 * Set Medusa cart ID in localStorage
 */
export async function setMedusaCartId(page: Page, cartId: string) {
  await page.evaluate((id) => localStorage.setItem('medusa_cart_id', id), cartId);
}

/**
 * Clear Medusa cart from localStorage
 */
export async function clearMedusaCart(page: Page) {
  await page.evaluate(() => localStorage.removeItem('medusa_cart_id'));
}

/**
 * Wait for element to appear and be clickable
 */
export async function waitAndClick(page: Page, selector: string, timeout = 5000) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  await element.click();
}

/**
 * Fill form field and wait
 */
export async function fillAndWait(page: Page, selector: string, value: string) {
  await page.fill(selector, value);
  await page.waitForTimeout(100); // Brief pause for debounced inputs
}

/**
 * Take screenshot with timestamp
 */
export async function screenshotWithTimestamp(page: Page, name: string) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ path: `screenshots/${name}-${timestamp}.png`, fullPage: true });
}
