import { chromium, expect, test } from '@playwright/test';
import { waitForNetworkIdle } from './helpers/test-helpers';

const FUTURE_EVENT_ISO = '2026-12-12T19:00:00-06:00';
const MEDUSA_URL = 'https://medusa.test';

async function mockOptionalIntegrationsAsUnavailable(page: import('@playwright/test').Page) {
  await page.route('**/api/social/feed**', async route => {
    await route.fulfill({
      status: 501,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'not_configured' }),
    });
  });

  await page.route('**/api/facebook/events**', async route => {
    await route.fulfill({
      status: 501,
      contentType: 'application/json',
      body: JSON.stringify({ error: 'not_configured' }),
    });
  });
}

async function mockEvents(page: import('@playwright/test').Page) {
  await page.route('**/api/events', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        upcoming: [
          {
            id: 'evt_test_1',
            slug: 'ui-review-event',
            title: 'UI Review Gospel Night',
            summary: 'A visible first-party event card for the homepage events section.',
            description: 'A visible first-party event card for the homepage events section.',
            startDateTime: FUTURE_EVENT_ISO,
            endDateTime: '2026-12-12T22:00:00-06:00',
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
}

async function mockConfiguredSocialFeed(page: import('@playwright/test').Page) {
  await page.route('**/api/social/feed**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        posts: [
          {
            id: 'post_test_1',
            platform: 'instagram',
            type: 'photo',
            mediaUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22%3E%3Crect width=%22100%22 height=%22100%22 fill=%22%239d174d%22/%3E%3C/svg%3E',
            caption: 'Mobile social feed test post',
            permalink: 'https://www.instagram.com/p/test/',
            timestamp: FUTURE_EVENT_ISO,
            likes: 12,
            comments: 3,
            shares: 1,
          },
        ],
      }),
    });
  });
}

async function mockCheckoutCart(page: import('@playwright/test').Page) {
  await page.addInitScript(() => localStorage.setItem('medusa_cart_id', 'cart_mobile_test'));
  await page.route(`${MEDUSA_URL}/store/carts/cart_mobile_test`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        cart: {
          id: 'cart_mobile_test',
          region: { currency_code: 'usd' },
          items: [
            {
              id: 'item_mobile_test',
              title: 'Mobile Test Product',
              quantity: 1,
              unit_price: 2999,
              variant: { title: 'Default' },
            },
          ],
          shipping_methods: [],
          subtotal: 2999,
          shipping_total: 0,
          tax_total: 0,
          total: 2999,
        },
      }),
    });
  });
}

test.describe('UI theme review regressions', () => {
  test('product empty state text has readable contrast', async ({ page }) => {
    await page.goto('/products', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page).catch(() => undefined);

    const empty = page.getByText(/No products available/i);
    await expect(empty).toBeVisible();

    const contrast = await empty.evaluate(node => {
      const style = window.getComputedStyle(node);
      const bodyStyle = window.getComputedStyle(document.body);
      const fg = style.color;
      const bg = bodyStyle.backgroundColor === 'rgba(0, 0, 0, 0)'
        ? 'rgb(255, 255, 255)'
        : bodyStyle.backgroundColor;
      const values = (rgb: string) => rgb.match(/\d+/g)?.slice(0, 3).map(Number) ?? [0, 0, 0];
      const lum = (rgb: string) => {
        const [r, g, b] = values(rgb).map(value => {
          const channel = value / 255;
          return channel <= 0.03928
            ? channel / 12.92
            : Math.pow((channel + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * r + 0.7152 * g + 0.0722 * b;
      };
      const lighter = Math.max(lum(fg), lum(bg));
      const darker = Math.min(lum(fg), lum(bg));
      return (lighter + 0.05) / (darker + 0.05);
    });

    expect(contrast).toBeGreaterThanOrEqual(4.5);
  });

  test('homepage events section uses first-party events when Facebook is unavailable', async ({ page }) => {
    await mockOptionalIntegrationsAsUnavailable(page);
    await mockEvents(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page).catch(() => undefined);

    const events = page.locator('#events');
    await expect(events.getByRole('heading', { name: 'Upcoming Events' })).toBeVisible();
    await expect(events.getByRole('heading', { name: 'UI Review Gospel Night' })).toBeVisible();
    await expect(events.getByText('A visible first-party event card')).toBeVisible();
  });

  test('latest updates section shows a useful fallback when social feed is unavailable', async ({ page }) => {
    await mockOptionalIntegrationsAsUnavailable(page);
    await mockEvents(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page).catch(() => undefined);

    const social = page.locator('#social');
    await expect(social.getByRole('heading', { name: 'Latest Updates' })).toBeVisible();
    await expect(social.getByText('Follow our journey on social media')).toBeVisible();
    await expect(social.getByRole('button', { name: /Open Instagram profile/i })).toBeVisible();
  });

  test('mobile bottom nav highlights section-backed items', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await mockOptionalIntegrationsAsUnavailable(page);
    await mockEvents(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page).catch(() => undefined);

    for (const [sectionId, label] of [
      ['events', 'Events'],
      ['media', 'Listen'],
      ['social', 'Social'],
      ['booking', 'Book'],
    ] as const) {
      await page.evaluate(id => document.getElementById(id)?.scrollIntoView({ block: 'center' }), sectionId);
      await page.waitForTimeout(700);
      await expect(page.locator('.mobile-bottom-nav .nav-item[aria-current="page"] .nav-label')).toHaveText(label);
    }
  });

  test('booking form labels keep icon and text on one row', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await page.goto('/book', { waitUntil: 'domcontentloaded' });

    const nameLabel = page.locator('label[for="name"]');
    await expect(nameLabel).toBeVisible();

    const display = await nameLabel.evaluate(node => window.getComputedStyle(node).display);
    const alignItems = await nameLabel.evaluate(node => window.getComputedStyle(node).alignItems);
    expect(display).toBe('inline-flex');
    expect(alignItems).toBe('center');
  });

  test('dark hero logo is displayed in an intentional logo frame', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('theme', 'dark'));
    await mockOptionalIntegrationsAsUnavailable(page);
    await mockEvents(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.hero-logo-frame')).toBeVisible();

    const frameBackground = await page
      .locator('.hero-logo-frame')
      .evaluate(node => window.getComputedStyle(node).backgroundColor);
    expect(frameBackground).toBe('rgb(255, 255, 255)');
  });

  test('mobile checkout uses inline summary plus fixed footer without overlap', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await mockCheckoutCart(page);

    await page.goto('/checkout', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page).catch(() => undefined);

    const summary = page.locator('.checkout-summary');
    const footer = page.locator('.checkout-footer');
    await expect(summary).toBeVisible();
    await expect(footer).toBeVisible();

    const summaryPosition = await summary.evaluate(node => window.getComputedStyle(node).position);
    expect(summaryPosition).toBe('static');

    const overlap = await page.evaluate(() => {
      const summary = document.querySelector('.checkout-summary')?.getBoundingClientRect();
      const footer = document.querySelector('.checkout-footer')?.getBoundingClientRect();
      if (!summary || !footer) return true;
      return summary.bottom > footer.top && summary.top < footer.bottom;
    });
    expect(overlap).toBe(false);
  });

  test('mobile asChild event action links meet touch target size', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 900 });
    await mockOptionalIntegrationsAsUnavailable(page);
    await mockEvents(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page).catch(() => undefined);

    const directions = page.locator('#events a[data-slot="button"][aria-label="Directions"]').first();
    await expect(directions).toBeVisible();

    const box = await directions.boundingBox();
    expect(box?.width).toBeGreaterThanOrEqual(44);
    expect(box?.height).toBeGreaterThanOrEqual(44);
  });

  test('mobile gallery lightbox stays within viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await mockOptionalIntegrationsAsUnavailable(page);
    await mockEvents(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page).catch(() => undefined);
    await page.evaluate(() => document.getElementById('gallery')?.scrollIntoView({ block: 'center' }));

    const firstPhoto = page.locator('.photo-gallery button[aria-label]').first();
    await expect(firstPhoto).toBeVisible();
    await firstPhoto.click();

    const lightboxImage = page.locator('[role="dialog"] img').last();
    await expect(lightboxImage).toBeVisible();

    const overflows = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(overflows).toBe(false);
  });

  test('mobile social feed cards do not overflow 320px viewport', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 740 });
    await mockConfiguredSocialFeed(page);
    await mockEvents(page);

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await waitForNetworkIdle(page).catch(() => undefined);

    const card = page.locator('[data-testid="social-post-card"]').first();
    await expect(card).toBeVisible();

    const fits = await card.evaluate(node => {
      const rect = node.getBoundingClientRect();
      return rect.left >= 0 && rect.right <= window.innerWidth;
    });
    expect(fits).toBe(true);
  });

  test('tablet viewport does not apply hidden mobile nav body padding', async ({ browserName }) => {
    test.skip(browserName !== 'chromium', 'Uses a neutral Chromium context to avoid mobile project device emulation');

    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 820, height: 1180 } });
    const page = await context.newPage();
    try {
      await mockOptionalIntegrationsAsUnavailable(page);
      await mockEvents(page);

      await page.goto('http://localhost:8787/', { waitUntil: 'domcontentloaded' });
      await waitForNetworkIdle(page).catch(() => undefined);

      await expect(page.locator('.mobile-bottom-nav')).toHaveCount(0);
      const hasPaddingClass = await page.evaluate(() => document.body.classList.contains('mobile-nav-visible'));
      expect(hasPaddingClass).toBe(false);
    } finally {
      await context.close();
      await browser.close();
    }
  });
});
