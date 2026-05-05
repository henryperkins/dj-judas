# UI Theme Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the confirmed style, theme, and user-interface findings from the May 5, 2026 review so the public app has visible empty states, meaningful event/social sections, reliable mobile navigation state, polished form labels, and intentional dark-mode branding.

**Architecture:** Keep the fixes inside the existing Vite React app and Tailwind v4 token system. Use local first-party data for the primary events section, treat social/Facebook integrations as optional enhancements, and add Playwright regressions that inspect rendered UI rather than implementation details.

**Tech Stack:** React 19, Vite 6, Tailwind CSS v4 tokens in `src/react-app/index.css`, Playwright e2e tests, existing SPA router and first-party event utilities.

---

## Findings Covered

1. `text-muted` maps to a muted surface color and produces near-invisible text on light backgrounds.
2. The `Upcoming Events` homepage section can render blank because `FacebookEvents` is mounted without `pageId` and returns `null` when unconfigured.
3. Mobile bottom navigation loses the active state for `media`, `social`, and `booking` sections.
4. Booking form labels render icons above label text instead of as a single polished label row.
5. Dark mode makes the hero logo look like an accidental white rectangle inside the dark hero card.
6. Optional social feed integrations can disappear, leaving sparse section chrome instead of a useful fallback.

## File Structure

- Modify: `src/react-app/pages/ProductsPage.tsx`
  - Replace `text-muted` usage with `text-muted-foreground` and improve the empty state copy.
- Modify: `src/react-app/pages/SuccessPage.tsx`
  - Replace `text-muted` with `text-muted-foreground`.
- Modify: `src/react-app/pages/AdminHome.tsx`
  - Replace `text-muted` with `text-muted-foreground`.
- Modify: `src/react-app/pages/AdminAddProduct.tsx`
  - Replace `text-muted` with `text-muted-foreground`.
- Modify: `src/react-app/pages/AdminEditProduct.tsx`
  - Replace `text-muted` with `text-muted-foreground`.
- Modify: `src/react-app/pages/AdminProductsList.tsx`
  - Replace `text-muted` with `text-muted-foreground`.
- Modify: `src/react-app/index.css`
  - Remove or neutralize legacy text aliases that collide with Tailwind token utilities.
  - Add label-row, hero-logo-frame, and empty-section styles.
- Modify: `src/react-app/components/sections/HeroSection.tsx`
  - Wrap the logo in an intentional framed logo plate.
- Modify: `src/react-app/components/EnhancedLandingPageV2.tsx`
  - Replace the blank-prone Facebook events section with the local `EventGrid`.
  - Add `social` to section tracking.
  - Render a stable latest-updates fallback when the feed is unconfigured.
- Modify: `src/react-app/components/MobileBottomNav.tsx`
  - Map `Listen` to `media` and `Book` to `booking` while preserving existing actions.
- Modify: `src/react-app/components/social/feeds/DynamicSocialFeed.tsx`
  - Expose an optional `onAvailabilityChange` callback so parents can render fallback UI when the feed is empty or unconfigured.
- Create: `e2e/ui-theme.spec.ts`
  - Add regression coverage for the UI findings.

---

### Task 1: Add UI Regression Tests

**Files:**
- Create: `e2e/ui-theme.spec.ts`

- [ ] **Step 1: Write the failing Playwright suite**

Create `e2e/ui-theme.spec.ts` with these tests:

```ts
import { expect, test } from '@playwright/test';
import { waitForNetworkIdle } from './helpers/test-helpers';

const FUTURE_EVENT_ISO = '2026-12-12T19:00:00-06:00';

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
});
```

- [ ] **Step 2: Run the tests and verify they fail before implementation**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --reporter=list
```

Expected before implementation:

```text
1) product empty state text has readable contrast
2) homepage events section uses first-party events when Facebook is unavailable
3) latest updates section shows a useful fallback when social feed is unavailable
4) mobile bottom nav highlights section-backed items
5) booking form labels keep icon and text on one row
6) dark hero logo is displayed in an intentional logo frame
```

- [ ] **Step 3: Commit the failing regression tests**

```bash
git add e2e/ui-theme.spec.ts
git commit -m "test(ui): cover theme review regressions"
```

---

### Task 2: Fix Muted Text Contrast

**Files:**
- Modify: `src/react-app/pages/ProductsPage.tsx`
- Modify: `src/react-app/pages/SuccessPage.tsx`
- Modify: `src/react-app/pages/AdminHome.tsx`
- Modify: `src/react-app/pages/AdminAddProduct.tsx`
- Modify: `src/react-app/pages/AdminEditProduct.tsx`
- Modify: `src/react-app/pages/AdminProductsList.tsx`
- Modify: `src/react-app/index.css`

- [ ] **Step 1: Replace legacy `text-muted` usage**

Run:

```bash
rg -n "\\btext-muted\\b" src/react-app
```

Replace every `text-muted` class with `text-muted-foreground` in React files. The important product page replacements should look like this:

```tsx
if (loading) {
  return (
    <div className="container section-py">
      <div className="text-center text-muted-foreground">Loading products...</div>
    </div>
  );
}

return (
  <div className="container section-py">
    <Button variant="ghost" className="mb-3" onClick={() => navigate('/')}>
      ← Back
    </Button>

    <h1 className="section-title">Products</h1>

    {products.length === 0 ? (
      <div className="empty-state">
        <p className="empty-state__title">No products available</p>
        <p className="empty-state__description">Merch and music will appear here when the store is ready.</p>
      </div>
    ) : (
      <div className="product-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            {product.thumbnail && (
              <img
                src={product.thumbnail}
                alt={product.title}
                className="product-card__image"
              />
            )}
            <div className="product-card__content">
              <h3 className="product-card__title">{product.title}</h3>
              {product.description && (
                <p className="text-muted-foreground text-sm mb-2">
                  {product.description.slice(0, 100)}
                  {product.description.length > 100 && '...'}
                </p>
              )}
              <div className="product-card__price mb-3">
                {getPrice(product) || 'Price unavailable'}
              </div>
              <Button
                size="sm"
                className={adding === product.id ? 'btn-loading' : undefined}
                onClick={() => handleAddToCart(product)}
                disabled={adding === product.id || !product.variants?.[0]?.id}
              >
                {adding === product.id ? '' : 'Add to Cart'}
              </Button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
```

- [ ] **Step 2: Remove the conflicting legacy aliases**

In `src/react-app/index.css`, delete this block:

```css
  .text-primary {
    @apply text-foreground;
  }

  .text-secondary {
    @apply text-muted-foreground;
  }

  .text-muted {
    @apply text-muted-foreground;
  }

  .text-sm {
    @apply text-sm;
  }
```

Add an empty-state component style in the component layer:

```css
  .empty-state {
    @apply mx-auto max-w-xl rounded-[var(--radius)] border border-border bg-card px-6 py-8 text-center shadow-xs;
  }

  .empty-state__title {
    @apply text-base font-semibold text-foreground;
  }

  .empty-state__description {
    @apply mt-2 text-sm text-muted-foreground;
  }
```

- [ ] **Step 3: Run targeted verification**

Run:

```bash
rg -n "\\btext-muted\\b" src/react-app
npx playwright test e2e/ui-theme.spec.ts --project=chromium --grep "product empty state" --reporter=list
```

Expected:

```text
rg exits with no React source matches for text-muted
1 passed
```

- [ ] **Step 4: Commit**

```bash
git add src/react-app/pages/ProductsPage.tsx src/react-app/pages/SuccessPage.tsx src/react-app/pages/AdminHome.tsx src/react-app/pages/AdminAddProduct.tsx src/react-app/pages/AdminEditProduct.tsx src/react-app/pages/AdminProductsList.tsx src/react-app/index.css
git commit -m "fix(theme): use readable muted text"
```

---

### Task 3: Make Events First-Party and Never Blank

**Files:**
- Modify: `src/react-app/components/EnhancedLandingPageV2.tsx`
- Modify: `src/react-app/components/events/EventGrid.tsx`

- [ ] **Step 1: Replace the Facebook-only events section**

In `src/react-app/components/EnhancedLandingPageV2.tsx`, replace:

```tsx
const FacebookEvents = lazy(() => import('./social/feeds/FacebookEvents'));
```

with:

```tsx
const EventGrid = lazy(() => import('./events/EventGrid'));
```

Replace the current manual events section:

```tsx
<section id="events" className="events-section">
  <div className="container">
    <h2 className="section-title">Upcoming Events</h2>

    <div className="facebook-events-wrapper">
      <Suspense fallback={<LoadingFallback />}>
        <FacebookEvents
          layout="grid"
          limit={3}
          showPastEvents={false}
          autoRefresh={true}
          refreshInterval={1800}
        />
      </Suspense>
    </div>
  </div>
</section>
```

with:

```tsx
<Suspense fallback={<LoadingFallback />}>
  <EventGrid />
</Suspense>
```

- [ ] **Step 2: Improve `EventGrid` loading and empty states**

In `src/react-app/components/events/EventGrid.tsx`, change the loading and error returns to preserve the same section structure:

```tsx
if (loading) {
  return (
    <section id="events" className="events-section" aria-busy="true">
      <div className="container">
        <h2 className="section-title">Upcoming Events</h2>
        <div className="empty-state">
          <p className="empty-state__title">Loading events...</p>
          <p className="empty-state__description">Checking the latest event schedule.</p>
        </div>
      </div>
    </section>
  );
}

if (error) {
  return (
    <section id="events" className="events-section">
      <div className="container">
        <h2 className="section-title">Upcoming Events</h2>
        <div className="empty-state">
          <p className="empty-state__title">Events could not load</p>
          <p className="empty-state__description">Please check back soon for the next date.</p>
        </div>
      </div>
    </section>
  );
}
```

Keep the existing static `/content/events.json` fallback path so preview and Worker misconfiguration still show events.

- [ ] **Step 3: Run targeted verification**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --grep "homepage events section" --reporter=list
```

Expected:

```text
1 passed
```

- [ ] **Step 4: Commit**

```bash
git add src/react-app/components/EnhancedLandingPageV2.tsx src/react-app/components/events/EventGrid.tsx
git commit -m "fix(events): render first-party events section"
```

---

### Task 4: Repair Mobile Bottom Navigation Active State

**Files:**
- Modify: `src/react-app/components/EnhancedLandingPageV2.tsx`
- Modify: `src/react-app/components/MobileBottomNav.tsx`

- [ ] **Step 1: Track every section represented in bottom navigation**

In `src/react-app/components/EnhancedLandingPageV2.tsx`, change:

```tsx
const sections = ['home', 'about', 'media', 'events', 'gallery', 'services', 'booking'];
```

to:

```tsx
const sections = ['home', 'events', 'media', 'social', 'gallery', 'services', 'booking'];
```

Use a lower threshold and center-aware root margin so shorter sections can activate:

```tsx
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        setActiveSection(id);
      }
    });
  },
  {
    rootMargin: '-35% 0px -45% 0px',
    threshold: [0, 0.25, 0.5],
  }
);
```

- [ ] **Step 2: Map nav items to real section ids**

In `src/react-app/components/MobileBottomNav.tsx`, update `NAV_ITEMS` to:

```tsx
const NAV_ITEMS: NavItem[] = [
  {
    id: 'home',
    icon: LuHouse,
    label: 'Home',
    sectionId: 'home'
  },
  {
    id: 'listen',
    icon: LuMusic,
    label: 'Listen',
    sectionId: 'media',
    action: () => {}
  },
  {
    id: 'events',
    icon: LuCalendar,
    label: 'Events',
    sectionId: 'events'
  },
  {
    id: 'social',
    icon: LuUsers,
    label: 'Social',
    sectionId: 'social'
  },
  {
    id: 'shop',
    icon: LuShoppingCart,
    label: 'Shop',
    action: () => navigate('/products')
  },
  {
    id: 'book',
    icon: LuTicket,
    label: 'Book',
    sectionId: 'booking',
    action: () => navigate('/book')
  }
];
```

Keep the special `listen` click behavior that opens the platform launcher. The `sectionId` is used only for active-state mapping.

- [ ] **Step 3: Run targeted verification**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --grep "mobile bottom nav" --reporter=list
```

Expected:

```text
1 passed
```

- [ ] **Step 4: Commit**

```bash
git add src/react-app/components/EnhancedLandingPageV2.tsx src/react-app/components/MobileBottomNav.tsx
git commit -m "fix(mobile): align bottom nav active sections"
```

---

### Task 5: Polish Booking Form Labels

**Files:**
- Modify: `src/react-app/index.css`

- [ ] **Step 1: Update form label styling**

In `src/react-app/index.css`, replace:

```css
  .form-group label {
    @apply block text-sm font-medium text-foreground mb-2;
  }
```

with:

```css
  .form-group label {
    @apply inline-flex w-fit items-center gap-2 text-sm font-medium text-foreground mb-2;
  }

  .form-group label svg {
    @apply size-4 shrink-0 text-muted-foreground;
  }
```

- [ ] **Step 2: Run targeted verification**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --grep "booking form labels" --reporter=list
```

Expected:

```text
1 passed
```

- [ ] **Step 3: Commit**

```bash
git add src/react-app/index.css
git commit -m "fix(forms): align booking field labels"
```

---

### Task 6: Make Dark Hero Branding Intentional

**Files:**
- Modify: `src/react-app/components/sections/HeroSection.tsx`
- Modify: `src/react-app/index.css`

- [ ] **Step 1: Wrap the logo in a framed mark**

In `src/react-app/components/sections/HeroSection.tsx`, replace the raw logo image:

```tsx
<motion.img
  src={logoImage}
  alt="DJ Lee & Voices of Judah"
  style={{ maxWidth: '250px', marginBottom: '1.5rem', display: 'block', margin: '0 auto 1.5rem' }}
  initial={imageVariants.initial}
  animate={imageVariants.animate}
  transition={{ delay: isInitialLoad ? 0 : 0.1, duration: isInitialLoad ? 0 : 0.8 }}
  fetchPriority="high"
/>
```

with:

```tsx
<motion.div
  className="hero-logo-frame"
  initial={imageVariants.initial}
  animate={imageVariants.animate}
  transition={{ delay: isInitialLoad ? 0 : 0.1, duration: isInitialLoad ? 0 : 0.8 }}
>
  <img
    src={logoImage}
    alt="DJ Lee & Voices of Judah"
    className="hero-logo"
    fetchPriority="high"
  />
</motion.div>
```

- [ ] **Step 2: Add logo frame styles**

In `src/react-app/index.css`, near the hero styles, add:

```css
  .hero-logo-frame {
    @apply mx-auto mb-6 grid place-items-center rounded-[calc(var(--radius)*0.75)] border border-border/40 bg-white p-4 shadow-xs;
    width: min(220px, 70vw);
    aspect-ratio: 1;
  }

  .hero-logo {
    @apply block h-auto w-full object-contain;
  }

  .dark .hero-logo-frame {
    border-color: color-mix(in oklab, var(--color-accent), transparent 55%);
    box-shadow: 0 16px 40px rgba(0, 0, 0, 0.28);
  }
```

This keeps the JPEG's white background, but turns it into an intentional brand plate in both themes.

- [ ] **Step 3: Run targeted verification**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --grep "dark hero logo" --reporter=list
```

Expected:

```text
1 passed
```

- [ ] **Step 4: Commit**

```bash
git add src/react-app/components/sections/HeroSection.tsx src/react-app/index.css
git commit -m "fix(theme): frame hero logo in dark mode"
```

---

### Task 7: Add a Stable Social Updates Fallback

**Files:**
- Modify: `src/react-app/components/social/feeds/DynamicSocialFeed.tsx`
- Modify: `src/react-app/components/EnhancedLandingPageV2.tsx`
- Modify: `src/react-app/index.css`

- [ ] **Step 1: Add availability reporting to `DynamicSocialFeed`**

In `src/react-app/components/social/feeds/DynamicSocialFeed.tsx`, extend the props:

```tsx
interface DynamicSocialFeedProps {
  platforms?: ('instagram' | 'facebook')[];
  hashtags?: string[];
  limit?: number;
  layout?: 'grid' | 'masonry' | 'carousel' | 'stories';
  enableShoppable?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  onPostClick?: (post: SocialPost) => void;
  onAvailabilityChange?: (available: boolean) => void;
}
```

Add the prop to the component signature:

```tsx
const DynamicSocialFeed: React.FC<DynamicSocialFeedProps> = ({
  platforms = ['instagram', 'facebook'],
  hashtags = [],
  limit = 12,
  layout = 'grid',
  enableShoppable = true,
  autoRefresh = true,
  refreshInterval = 300,
  onPostClick,
  onAvailabilityChange,
}) => {
```

After the state declarations, report availability only after the initial loading pass:

```tsx
useEffect(() => {
  if (loading) return;
  onAvailabilityChange?.(posts.length > 0);
}, [loading, onAvailabilityChange, posts.length]);
```

Keep the existing `return null` for unconfigured feeds so the feed component itself remains unobtrusive.

- [ ] **Step 2: Render fallback content in the parent section**

In `src/react-app/components/EnhancedLandingPageV2.tsx`, add state near the other homepage state:

```tsx
const [socialFeedAvailable, setSocialFeedAvailable] = useState<boolean | null>(null);
```

Pass the callback:

```tsx
<DynamicSocialFeed
  platforms={['instagram']}
  layout="grid"
  limit={6}
  enableShoppable={true}
  autoRefresh={true}
  refreshInterval={300}
  onAvailabilityChange={setSocialFeedAvailable}
/>
```

Then render a fallback before the Instagram button:

```tsx
{socialFeedAvailable === false && (
  <div className="social-fallback">
    <p className="social-fallback__title">Instagram updates are available off-site.</p>
    <p className="social-fallback__description">
      Follow the ministry for new photos, reels, and announcements.
    </p>
  </div>
)}
```

- [ ] **Step 3: Add fallback styles**

In `src/react-app/index.css`, near the social section styles, add:

```css
  .social-fallback {
    @apply mx-auto mb-5 max-w-xl rounded-[var(--radius)] border border-border bg-background px-5 py-4 text-center;
  }

  .social-fallback__title {
    @apply text-sm font-semibold text-foreground;
  }

  .social-fallback__description {
    @apply mt-1 text-sm text-muted-foreground;
  }

  .social-cta {
    @apply flex justify-center;
  }
```

- [ ] **Step 4: Run targeted verification**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --grep "latest updates" --reporter=list
```

Expected:

```text
1 passed
```

- [ ] **Step 5: Commit**

```bash
git add src/react-app/components/social/feeds/DynamicSocialFeed.tsx src/react-app/components/EnhancedLandingPageV2.tsx src/react-app/index.css
git commit -m "fix(social): show fallback for unavailable feed"
```

---

### Task 8: Full Verification and Cleanup

**Files:**
- Read: all modified files
- No new source changes unless verification reveals a defect

- [ ] **Step 1: Run formatting and lint checks**

Run:

```bash
npm run lint
```

Expected:

```text
No ESLint errors from modified files
```

- [ ] **Step 2: Run focused UI tests**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --reporter=list
```

Expected:

```text
6 passed
```

- [ ] **Step 3: Run production build**

Run:

```bash
npm run build
```

Expected:

```text
vite build completes successfully
```

- [ ] **Step 4: Capture manual review screenshots**

Start the app:

```bash
npm run dev -- --host 127.0.0.1
```

Capture:

```bash
mkdir -p output
npx playwright screenshot --browser=chromium --viewport-size=1440,1200 http://127.0.0.1:5173/ output/ui-review-home-desktop.png
npx playwright screenshot --browser=chromium --viewport-size=390,1200 http://127.0.0.1:5173/ output/ui-review-home-mobile.png
npx playwright screenshot --browser=chromium --viewport-size=390,1200 http://127.0.0.1:5173/book output/ui-review-book-mobile.png
```

Inspect:

```bash
ls -lh output/ui-review-home-desktop.png output/ui-review-home-mobile.png output/ui-review-book-mobile.png
```

Expected:

```text
All three screenshots exist and have non-zero size
```

- [ ] **Step 5: Run the broader CI gate if credentials and local Cloudflare setup are available**

Run:

```bash
npm run check
```

Expected:

```text
Type-check, Vite build, Wrangler dry-run deploy, and Pa11y complete successfully
```

If Wrangler credentials or remote bindings block this locally, record the exact failing command and still provide the successful `npm run build` and focused Playwright evidence.

- [ ] **Step 6: Commit verification-only fixes if needed**

If verification reveals small corrections, commit them with:

```bash
git add src/react-app e2e/ui-theme.spec.ts
git commit -m "fix(ui): address verification follow-ups"
```

If no corrections are needed, do not create an empty commit.

---

## Final Acceptance Criteria

- `/products` empty and loading states use readable text in light and dark modes.
- The homepage `#events` section always contains either first-party event content or a visible empty/error state.
- Optional Facebook and Instagram integrations can be unavailable without leaving blank homepage sections.
- Mobile bottom nav highlights `Events`, `Listen`, `Social`, and `Book` when their corresponding homepage sections are in view.
- Booking form labels align icons and label text on one row at mobile and desktop widths.
- Dark mode hero branding looks intentional, with the JPEG logo placed inside a consistent logo plate.
- `npx playwright test e2e/ui-theme.spec.ts --project=chromium --reporter=list` passes.
- `npm run build` passes.
- `npm run lint` passes or reports only pre-existing unrelated issues that are documented separately.

## Self-Review Notes

- Spec coverage: every finding from the review is mapped to a task and a Playwright assertion.
- Placeholder scan: the plan contains no deferred implementation language or unspecified test requests.
- Type consistency: new prop `onAvailabilityChange?: (available: boolean) => void` is declared and consumed consistently.
