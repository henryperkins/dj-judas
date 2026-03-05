import { test, expect } from '@playwright/test';
import { waitForNetworkIdle } from './helpers/test-helpers';

const FUTURE_EVENT_ISO = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

test.describe('Social / Sharing Regressions', () => {
  test('renders dynamic social feed when hashtags are empty', async ({ page }) => {
    let feedRequested = false;
    let hashtagsParam: string | null = null;

    await page.route('**/api/social/feed**', async (route) => {
      const reqUrl = new URL(route.request().url());
      feedRequested = true;
      hashtagsParam = reqUrl.searchParams.get('hashtags');

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          posts: [
            {
              id: 'ig_1',
              platform: 'instagram',
              type: 'photo',
              mediaUrl: 'https://example.com/test-image.jpg',
              caption: 'Test caption',
              permalink: 'https://www.instagram.com/p/test',
              timestamp: FUTURE_EVENT_ISO,
              likes: 20,
              comments: 5,
              shares: 1,
              isShoppable: false,
            },
          ],
        }),
      });
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    await expect
      .poll(() => feedRequested, {
        message: 'Expected /api/social/feed to be requested',
        timeout: 10000,
      })
      .toBe(true);
    expect(hashtagsParam).toBe('');

    await expect(page.locator('.dynamic-social-feed')).toBeVisible();
    await expect(page.locator('.social-post-card').first()).toBeVisible();
  });

  test('shows clipboard error feedback for Spotify share when copy fails', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop-only Spotify embed share button test');

    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error('clipboard denied');
          },
        },
      });
    });

    await page.goto('/');
    await waitForNetworkIdle(page);

    const shareBtn = page.getByRole('button', { name: 'Copy link to clipboard' }).first();
    await expect(shareBtn).toBeVisible();
    await shareBtn.click();

    await expect(shareBtn).toContainText('Copy failed');
    await expect(shareBtn).toContainText('Share', { timeout: 4000 });
  });

  test('clears Next Event copy error feedback after timeout', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async () => {
            throw new Error('clipboard denied');
          },
        },
      });
    });

    await page.route('**/api/events', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          upcoming: [
            {
              id: 'evt_1',
              slug: 'test-event',
              title: 'Test Event',
              description: 'Test event description',
              startDateTime: FUTURE_EVENT_ISO,
              city: 'Gary',
              region: 'IN',
              status: 'published',
            },
          ],
          past: [],
          total: 1,
        }),
      });
    });

    await page.goto('/');
    await waitForNetworkIdle(page);

    const copyBtn = page.getByRole('button', { name: 'Copy event link' }).first();
    await expect(copyBtn).toBeVisible();
    await copyBtn.click();

    const feedback = page.locator('.next-event-feedback').first();
    await expect(feedback).toContainText('Unable to copy event link');
    await expect(feedback).toBeHidden({ timeout: 5000 });
  });

  test('supports keyboard expand/collapse for mobile mini player', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only keyboard interaction test');

    await page.goto('/');
    await waitForNetworkIdle(page);

    const expand = page.locator('.mini-player__expand-btn').first();
    await expect(expand).toBeVisible();

    await expand.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.listen-bottom-sheet')).toBeVisible();

    const collapse = page.locator('.sheet-header__collapse').first();
    await collapse.click();
    await expect(page.locator('.listen-bottom-sheet')).toBeHidden();

    await expand.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('.listen-bottom-sheet')).toBeVisible();
  });
});
