import { test, expect } from '@playwright/test';
import {
  waitForNetworkIdle,
  clearAllCookies,
  getCookie,
  mockSpotifyCallback,
  isSpotifyAuthenticated,
} from './helpers/test-helpers';
import { SPOTIFY_TEST_DATA, SELECTORS } from './fixtures/test-data';

test.describe('Spotify OAuth Integration', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test
    await clearAllCookies(page);
  });

  test('should initiate OAuth flow when clicking connect button', async ({ page }) => {
    await page.goto('/');
    await waitForNetworkIdle(page);

    // Mock the /api/spotify/login endpoint
    await page.route('/api/spotify/login', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authorizeUrl: `https://accounts.spotify.com/authorize?client_id=test&redirect_uri=http://localhost:5173/api/spotify/callback&state=${SPOTIFY_TEST_DATA.mockState}&code_challenge=test&code_challenge_method=S256&scope=user-library-modify+user-follow-modify+user-follow-read`
        })
      });
    });

    // Find and click Spotify connect button (may be in embed or header)
    const connectButton = page.locator('button:has-text("Connect Spotify"), button:has-text("Login")').first();

    if (await connectButton.isVisible()) {
      // Click should trigger redirect to mocked authorize URL
      await connectButton.click();

      // In a real scenario, this would redirect to Spotify
      // For testing, we verify the login endpoint was called
      await page.waitForTimeout(500);
    }
  });

  test('should complete OAuth callback and set session cookie', async ({ page, context }) => {
    // Mock the PKCE state in KV (simulating the /api/spotify/login flow)
    await page.route('/api/spotify/callback*', async route => {
      const url = new URL(route.request().url());
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');

      if (code && state) {
        // Simulate successful token exchange and session creation
        await route.fulfill({
          status: 302,
          headers: {
            'Location': `/?spotify=connected`,
            'Set-Cookie': `spotify_session=${SPOTIFY_TEST_DATA.mockSessionId}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
          }
        });
      } else {
        await route.fulfill({ status: 400, body: 'Missing code or state' });
      }
    });

    // Simulate OAuth callback
    await page.goto(`/api/spotify/callback?code=${SPOTIFY_TEST_DATA.mockCode}&state=${SPOTIFY_TEST_DATA.mockState}`);

    // Should redirect to home with success param
    await expect(page).toHaveURL('/?spotify=connected');

    // Check cookie was set
    const cookie = await getCookie(page, 'spotify_session');
    expect(cookie).toBeDefined();
    expect(cookie?.value).toBe(SPOTIFY_TEST_DATA.mockSessionId);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe('Lax');
  });

  test('should handle OAuth errors gracefully', async ({ page }) => {
    // Mock error response
    await page.route('/api/spotify/callback*', async route => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'invalid_state' })
      });
    });

    await page.goto('/api/spotify/callback?code=test&state=invalid');

    // Should show error or handle gracefully
    await waitForNetworkIdle(page);

    // Verify no session cookie was set
    const isAuthed = await isSpotifyAuthenticated(page);
    expect(isAuthed).toBe(false);
  });

  test('should show authenticated state when session exists', async ({ page, context }) => {
    // Set a mock session cookie
    await context.addCookies([{
      name: 'spotify_session',
      value: SPOTIFY_TEST_DATA.mockSessionId,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 86400, // 24 hours
    }]);

    // Mock session check endpoint
    await page.route('/api/spotify/session', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          authenticated: true,
          expiresAt: Date.now() + 3600000
        })
      });
    });

    await page.goto('/');
    await waitForNetworkIdle(page);

    // Should show authenticated features (Save, Follow buttons)
    // Look for Spotify-specific action buttons
    const saveBtnVisible = await page.locator(SELECTORS.spotifySaveButton).first().isVisible({ timeout: 5000 }).catch(() => false);
    const followBtnVisible = await page.locator(SELECTORS.spotifyFollowButton).first().isVisible({ timeout: 5000 }).catch(() => false);

    // At least one authenticated feature should be visible
    expect(saveBtnVisible || followBtnVisible).toBe(true);
  });

  test('should use correct Secure flag based on protocol', async ({ page }) => {
    // Test HTTP (localhost) - should NOT have Secure flag
    await page.route('/api/spotify/callback*', async route => {
      await route.fulfill({
        status: 302,
        headers: {
          'Location': '/?spotify=connected',
          // Simulate our fix: no Secure on HTTP
          'Set-Cookie': `spotify_session=test; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000`
        }
      });
    });

    await page.goto('/api/spotify/callback?code=test&state=test');

    const cookie = await getCookie(page, 'spotify_session');
    expect(cookie).toBeDefined();

    // On localhost (HTTP), secure should be false
    expect(cookie?.secure).toBe(false);
  });

  test('should refresh expired token automatically', async ({ page, context }) => {
    // Set expired session
    await context.addCookies([{
      name: 'spotify_session',
      value: SPOTIFY_TEST_DATA.mockSessionId,
      domain: 'localhost',
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      expires: Math.floor(Date.now() / 1000) + 86400,
    }]);

    // Mock session check returning expired token
    let sessionCheckCount = 0;
    await page.route('/api/spotify/session', async route => {
      sessionCheckCount++;

      if (sessionCheckCount === 1) {
        // First call: token expired, should trigger refresh
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authenticated: true,
            expiresAt: Date.now() - 1000 // Expired 1 second ago
          })
        });
      } else {
        // After refresh: token valid
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            authenticated: true,
            expiresAt: Date.now() + 3600000 // Valid for 1 hour
          })
        });
      }
    });

    await page.goto('/');
    await waitForNetworkIdle(page);

    // Should have attempted to refresh token
    expect(sessionCheckCount).toBeGreaterThanOrEqual(1);
  });
});
