# UI Theme Review Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all confirmed findings from the May 5, 2026 theme, style, UI, accessibility, responsiveness, and code-smell review.

**Architecture:** Keep the remediation inside the existing React storefront and Tailwind v4 token system. Use typed result objects for cart operations, Radix primitives for tab/dialog accessibility, one canonical platform launcher class family, and Playwright regressions for user-facing behavior.

**Tech Stack:** React 19, TypeScript, Vite 6, Tailwind CSS v4, Radix Dialog/Tabs, Playwright e2e, Medusa store API helpers.

---

## Findings Covered

1. Add-to-cart failures are silent in `ProductsPage` and `FeaturedProducts`.
2. The mobile platform FAB menu uses menu semantics without focus movement, Escape handling, or keyboard behavior.
3. `CreatorMediaPanel` renders visual tabs as plain buttons without tab semantics.
4. Booking form `full-width` fields do not span the desktop grid because no `.full-width` rule exists.
5. `FacebookEvents` uses clickable `div role="button"` cards with nested controls and a custom modal without dialog semantics or focus handling.
6. `DynamicSocialFeed` exposes `masonry` and `carousel` layouts but renders both as grid.
7. `PlatformLauncher` has parallel legacy and current class families, making theme and focus fixes brittle.

## File Structure

- Modify: `src/react-app/utils/cart-sdk.ts`
  - Replace boolean-only add-to-cart responses with a typed result that includes user-facing failure messages.
- Modify: `src/react-app/pages/ProductsPage.tsx`
  - Show product-loading errors and add-to-cart errors with `role="alert"`.
  - Disable products without variants with explicit button copy.
- Modify: `src/react-app/components/FeaturedProducts.tsx`
  - Mirror add-to-cart loading and error feedback for homepage product cards.
- Modify: `src/react-app/components/PlatformLauncher.tsx`
  - Add focus management and Escape close behavior to the FAB launcher.
  - Rename FAB classes to the canonical `.platform-launcher__*` family.
- Modify: `src/react-app/components/CreatorMediaPanel.tsx`
  - Replace custom visual tabs with existing Radix `Tabs`, `TabsList`, `TabsTrigger`, and `TabsContent`.
- Modify: `src/react-app/components/BookingForm.tsx`
  - Keep the `full-width` field intent and make it testable through CSS.
- Modify: `src/react-app/components/social/feeds/FacebookEvents.tsx`
  - Replace card-level `role="button"` wrappers with semantic articles plus explicit open buttons.
  - Replace the custom modal with the shared Radix Dialog wrapper.
- Modify: `src/react-app/components/social/feeds/DynamicSocialFeed.tsx`
  - Extract reusable post-card rendering.
  - Implement real masonry and carousel layouts.
- Modify: `src/react-app/index.css`
  - Add missing booking grid rule.
  - Add canonical platform launcher FAB styles and remove duplicate `.fab-*` styling.
  - Add styles for `FacebookEvents` open buttons and social feed masonry/carousel controls.
- Modify: `e2e/ui-theme.spec.ts`
  - Add regression tests for the seven findings.
- Create: `scripts/check-ui-review-contracts.mjs`
  - Add source-contract checks for exported components that are not mounted on the primary routes.

---

### Task 1: Add Regression Coverage for Current Findings

**Files:**
- Modify: `e2e/ui-theme.spec.ts`

- [ ] **Step 1: Add Medusa failure mocks near the existing helpers**

Add these helpers below `mockCheckoutCart`:

```ts
async function mockProductsWithAddFailure(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    localStorage.removeItem('medusa_cart_id');
  });

  await page.route(`${MEDUSA_URL}/store/products**`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        products: [
          {
            id: 'prod_error_test',
            title: 'Cart Error Test Product',
            description: 'Used to prove add-to-cart errors are visible.',
            thumbnail: '',
            variants: [{ id: 'variant_error_test' }],
          },
          {
            id: 'prod_no_variant_test',
            title: 'No Variant Test Product',
            description: 'Used to prove unavailable products are disabled.',
            thumbnail: '',
            variants: [],
          },
        ],
      }),
    });
  });

  await page.route(`${MEDUSA_URL}/store/carts`, async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ cart: { id: 'cart_error_test' } }),
    });
  });

  await page.route(`${MEDUSA_URL}/store/carts/cart_error_test/line-items`, async route => {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ message: 'Line item rejected by test server' }),
    });
  });
}

```

- [ ] **Step 2: Add product error tests**

Add these tests inside `test.describe('UI theme review regressions', () => { ... })`:

```ts
test('products page shows add-to-cart failures and disables products without variants', async ({ page }) => {
  await mockProductsWithAddFailure(page);

  await page.goto('/products', { waitUntil: 'domcontentloaded' });
  await waitForNetworkIdle(page).catch(() => undefined);

  const product = page.locator('.product-card').filter({ hasText: 'Cart Error Test Product' });
  await expect(product.getByRole('button', { name: 'Add to Cart' })).toBeVisible();
  await product.getByRole('button', { name: 'Add to Cart' }).click();
  await expect(product.getByRole('alert')).toContainText('Line item rejected by test server');

  const unavailable = page.locator('.product-card').filter({ hasText: 'No Variant Test Product' });
  await expect(unavailable.getByRole('button', { name: 'Unavailable' })).toBeDisabled();
});

test('featured products show add-to-cart errors without navigating away', async ({ page }) => {
  await mockProductsWithAddFailure(page);
  await mockOptionalIntegrationsAsUnavailable(page);
  await mockEvents(page);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForNetworkIdle(page).catch(() => undefined);

  const product = page.locator('.product-card').filter({ hasText: 'Cart Error Test Product' }).first();
  await product.getByRole('button', { name: 'Add to cart' }).click();
  await expect(product.getByRole('alert')).toContainText('Line item rejected by test server');
  await expect(page).not.toHaveURL(/\/checkout/);
});
```

- [ ] **Step 3: Add mounted accessibility and layout tests**

Add these tests inside the same `describe` block:

```ts
test('platform FAB opens with dialog semantics, moves focus, and closes with Escape', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await mockOptionalIntegrationsAsUnavailable(page);
  await mockEvents(page);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForNetworkIdle(page).catch(() => undefined);

  await page.getByRole('button', { name: 'Open platform menu' }).click();
  const dialog = page.getByRole('dialog', { name: 'Streaming and social platforms' });
  await expect(dialog).toBeVisible();
  await expect(page.locator(':focus')).toHaveAttribute('aria-label', /Close platform menu|Spotify|Apple Music|Facebook|Instagram/);

  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Open platform menu' })).toBeFocused();
});

test('creator media panel exposes real tab semantics', async ({ page }) => {
  await mockOptionalIntegrationsAsUnavailable(page);
  await mockEvents(page);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForNetworkIdle(page).catch(() => undefined);
  await page.evaluate(() => document.getElementById('media')?.scrollIntoView({ block: 'center' }));

  const tablist = page.getByRole('tablist', { name: 'Media sections' });
  await expect(tablist).toBeVisible();

  await tablist.getByRole('tab', { name: 'Watch' }).click();
  await expect(tablist.getByRole('tab', { name: 'Watch' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('tabpanel', { name: 'Watch' })).toBeVisible();
});

test('booking location and message fields span the full desktop form width', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 900 });
  await page.goto('/book', { waitUntil: 'domcontentloaded' });

  const gridBox = await page.locator('.booking-form .form-grid').boundingBox();
  const locationBox = await page.locator('#location').locator('xpath=..').boundingBox();
  const messageBox = await page.locator('#message').locator('xpath=..').boundingBox();

  expect(gridBox).not.toBeNull();
  expect(locationBox).not.toBeNull();
  expect(messageBox).not.toBeNull();
  expect(Math.round(locationBox!.width)).toBeGreaterThan(Math.round(gridBox!.width * 0.85));
  expect(Math.round(messageBox!.width)).toBeGreaterThan(Math.round(gridBox!.width * 0.85));
});

test('platform launcher uses only canonical BEM FAB classes', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 900 });
  await mockOptionalIntegrationsAsUnavailable(page);
  await mockEvents(page);

  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await waitForNetworkIdle(page).catch(() => undefined);

  await expect(page.locator('.platform-launcher--fab')).toBeVisible();
  await expect(page.locator('.platform-launcher-fab, .fab-trigger, .fab-menu, .fab-platform-btn')).toHaveCount(0);
});
```

- [ ] **Step 4: Add source-contract checks for exported component fixes**

Create `scripts/check-ui-review-contracts.mjs`:

```js
import fs from 'node:fs';

const selected = new Set(process.argv.slice(2));
const failures = [];

const read = (path) => fs.readFileSync(path, 'utf8');
const enabled = (name) => selected.size === 0 || selected.has(name);
const assert = (name, condition, message) => {
  if (enabled(name) && !condition) {
    failures.push(`${name}: ${message}`);
  }
};

const facebookEvents = read('src/react-app/components/social/feeds/FacebookEvents.tsx');
const dynamicSocialFeed = read('src/react-app/components/social/feeds/DynamicSocialFeed.tsx');
const platformLauncher = read('src/react-app/components/PlatformLauncher.tsx');
const css = read('src/react-app/index.css');

assert(
  'facebook-events',
  facebookEvents.includes("@/components/ui/dialog") &&
    facebookEvents.includes('<Dialog open={!!selectedEvent}') &&
    !facebookEvents.includes('role="button"'),
  'FacebookEvents must use Radix Dialog and must not use role="button" card wrappers.'
);

assert(
  'dynamic-social-layouts',
  dynamicSocialFeed.includes('const renderPostCard') &&
    dynamicSocialFeed.includes('social-feed-carousel') &&
    dynamicSocialFeed.includes('social-feed-masonry') &&
    dynamicSocialFeed.includes('aria-roledescription="carousel"') &&
    !dynamicSocialFeed.includes('renderGrid()} {/* Simplified'),
  'DynamicSocialFeed must implement distinct masonry and carousel renderers.'
);

assert(
  'platform-classes',
  !platformLauncher.match(/platform-launcher-fab|fab-trigger|fab-menu|fab-platform-btn/) &&
    !css.match(/\.(?:platform-launcher-fab|fab-trigger|fab-menu|fab-platform-btn)\b/),
  'PlatformLauncher must not use legacy FAB class names.'
);

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exit(1);
}

console.log('UI review source contracts passed.');
```

- [ ] **Step 5: Run the focused suite and source-contract script, then confirm failures**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --reporter=list
node scripts/check-ui-review-contracts.mjs
```

Expected before implementation: the new Playwright tests fail on missing cart alerts, missing dialog/tab semantics, missing `.full-width` styling, and legacy platform launcher classes. The source-contract script fails on `facebook-events`, `dynamic-social-layouts`, and `platform-classes`.

- [ ] **Step 6: Commit the failing tests and source-contract script**

```bash
git add e2e/ui-theme.spec.ts scripts/check-ui-review-contracts.mjs
git commit -m "test(ui): cover review remediation findings"
```

---

### Task 2: Make Add-to-Cart Failures Visible

**Files:**
- Modify: `src/react-app/utils/cart-sdk.ts`
- Modify: `src/react-app/pages/ProductsPage.tsx`
- Modify: `src/react-app/components/FeaturedProducts.tsx`

- [ ] **Step 1: Replace boolean add-to-cart responses with a typed result**

In `src/react-app/utils/cart-sdk.ts`, add these types after the `headers` constant:

```ts
export type AddLineItemFailureReason =
  | 'missing_variant'
  | 'cart_unavailable'
  | 'store_unavailable'
  | 'line_item_failed'
  | 'network_error';

export type AddLineItemResult =
  | { ok: true; cartId: string }
  | { ok: false; reason: AddLineItemFailureReason; message: string };

async function readStoreError(res: Response, fallback: string): Promise<string> {
  const data = await res.json().catch(() => null) as { message?: string; error?: string } | null;
  return data?.message || data?.error || `${fallback} (${res.status})`;
}
```

Then replace `addLineItem` with:

```ts
export async function addLineItem(variantId: string, quantity = 1): Promise<AddLineItemResult> {
  if (!variantId) {
    return { ok: false, reason: 'missing_variant', message: 'This product is not available for purchase.' };
  }

  try {
    const cartId = await ensureCart();
    if (!cartId) {
      return { ok: false, reason: 'cart_unavailable', message: 'Unable to start a cart. Please refresh and try again.' };
    }

    if (sdk) {
      await sdk.store.cart.createLineItem(cartId, { variant_id: variantId, quantity });
      return { ok: true, cartId };
    }

    if (!MEDUSA_URL) {
      return { ok: false, reason: 'store_unavailable', message: 'Store checkout is not configured yet.' };
    }

    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ variant_id: variantId, quantity })
    });

    if (!res.ok) {
      return {
        ok: false,
        reason: 'line_item_failed',
        message: await readStoreError(res, 'Unable to add this item to your cart')
      };
    }

    return { ok: true, cartId };
  } catch (error) {
    console.error('Failed to add line item:', error);
    return { ok: false, reason: 'network_error', message: 'Unable to add this item right now. Please try again.' };
  }
}
```

- [ ] **Step 2: Add product-page error state**

In `src/react-app/pages/ProductsPage.tsx`:

1. Change the import to include `AddLineItemResult` only if TypeScript needs explicit typing.
2. Add state near `adding`:

```ts
const [errorByProductId, setErrorByProductId] = useState<Record<string, string>>({});
```

3. Replace `handleAddToCart` with:

```ts
const handleAddToCart = async (product: Product) => {
  const variantId = product.variants?.[0]?.id;
  if (!variantId) {
    setErrorByProductId(prev => ({
      ...prev,
      [product.id]: 'This product is not available for purchase.'
    }));
    return;
  }

  setAdding(product.id);
  setErrorByProductId(prev => {
    const next = { ...prev };
    delete next[product.id];
    return next;
  });

  const result = await addLineItem(variantId, 1);
  setAdding(null);

  if (result.ok) {
    navigate('/checkout');
    return;
  }

  setErrorByProductId(prev => ({
    ...prev,
    [product.id]: result.message
  }));
};
```

4. Inside each `.product-card__content`, after the price block and before the button, add:

```tsx
{errorByProductId[product.id] && (
  <div className="product-card__error" role="alert">
    {errorByProductId[product.id]}
  </div>
)}
```

5. Replace the button label with:

```tsx
{adding === product.id ? '' : product.variants?.[0]?.id ? 'Add to Cart' : 'Unavailable'}
```

- [ ] **Step 3: Add featured-products loading and error state**

In `src/react-app/components/FeaturedProducts.tsx`:

1. Add state after `loading`:

```ts
const [addingId, setAddingId] = useState<string | null>(null);
const [errorByProductId, setErrorByProductId] = useState<Record<string, string>>({});
```

2. Add this helper before the `return`:

```ts
const addFeaturedProduct = async (product: Product) => {
  const variantId = product.variants?.[0]?.id;
  if (!variantId) {
    setErrorByProductId(prev => ({
      ...prev,
      [product.id]: 'This product is not available for purchase.'
    }));
    return;
  }

  setAddingId(product.id);
  setErrorByProductId(prev => {
    const next = { ...prev };
    delete next[product.id];
    return next;
  });

  const result = await addLineItem(variantId, 1);
  setAddingId(null);

  if (result.ok) {
    navigate('/checkout');
    return;
  }

  setErrorByProductId(prev => ({
    ...prev,
    [product.id]: result.message
  }));
};
```

3. Add the alert after the title:

```tsx
{errorByProductId[p.id] && (
  <div className="product-card__error" role="alert">
    {errorByProductId[p.id]}
  </div>
)}
```

4. Replace the existing inline async add-to-cart button with:

```tsx
<button
  className={`btn btn-primary btn-sm ${addingId === p.id ? 'btn-loading' : ''}`}
  onClick={() => addFeaturedProduct(p)}
  disabled={addingId === p.id || !p.variants?.[0]?.id}
  aria-busy={addingId === p.id}
>
  {addingId === p.id ? '' : p.variants?.[0]?.id ? 'Add to cart' : 'Unavailable'}
</button>
```

- [ ] **Step 4: Add product error styling**

In `src/react-app/index.css`, near the product-card rules, add:

```css
.product-card__error {
  @apply mb-3 rounded-[calc(var(--radius)*0.75)] border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive;
}
```

- [ ] **Step 5: Verify the cart tests**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --reporter=list -g "add-to-cart|featured products"
```

Expected: both add-to-cart tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/react-app/utils/cart-sdk.ts src/react-app/pages/ProductsPage.tsx src/react-app/components/FeaturedProducts.tsx src/react-app/index.css
git commit -m "fix(cart): surface add-to-cart failures"
```

---

### Task 3: Fix Platform Launcher Semantics and Class Drift

**Files:**
- Modify: `src/react-app/components/PlatformLauncher.tsx`
- Modify: `src/react-app/index.css`

- [ ] **Step 1: Add focus refs and Escape handling**

In `src/react-app/components/PlatformLauncher.tsx`, change the React import:

```ts
import React, { useState, useEffect, useRef } from 'react';
```

Add refs after `shouldReduceMotion`:

```ts
const triggerRef = useRef<HTMLButtonElement | null>(null);
const menuRef = useRef<HTMLDivElement | null>(null);
const closeRef = useRef<HTMLButtonElement | null>(null);
```

Add this effect before `handlePlatformClick`:

```ts
useEffect(() => {
  if (!isOpen || mode !== 'floating') return;

  const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  window.setTimeout(() => closeRef.current?.focus(), 0);

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setIsOpen(false);
      triggerRef.current?.focus();
      return;
    }

    if (event.key !== 'Tab') return;
    const focusable = menuRef.current?.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
    );
    if (!focusable?.length) return;

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  document.addEventListener('keydown', handleKeyDown);
  return () => {
    document.removeEventListener('keydown', handleKeyDown);
    if (document.activeElement === document.body) {
      previousFocus?.focus();
    }
  };
}, [isOpen, mode]);
```

- [ ] **Step 2: Rename FAB markup to canonical classes**

In the floating return branch, replace the wrapper and trigger classes:

```tsx
<motion.div
  className={`platform-launcher platform-launcher--fab ${className} ${isOpen ? 'platform-launcher--open' : ''}`}
  initial={false}
>
```

Set the closed trigger:

```tsx
<motion.button
  ref={triggerRef}
  key="fab-closed"
  className="platform-launcher__fab-trigger"
  onClick={() => setIsOpen(true)}
  initial={shouldReduceMotion ? false : { scale: 0 }}
  animate={{ scale: 1 }}
  exit={shouldReduceMotion ? undefined : { scale: 0 }}
  transition={shouldReduceMotion ? { duration: 0 } : undefined}
  whileHover={shouldReduceMotion ? undefined : { scale: 1.1 }}
  whileTap={shouldReduceMotion ? undefined : { scale: 0.9 }}
  aria-label="Open platform menu"
  aria-expanded={isOpen}
  aria-controls="platform-fab-menu"
>
```

Set the open menu:

```tsx
<motion.div
  ref={menuRef}
  key="fab-open"
  className="platform-launcher__fab-menu"
  initial={shouldReduceMotion ? false : { scale: 0, opacity: 0 }}
  animate={{ scale: 1, opacity: 1 }}
  exit={shouldReduceMotion ? undefined : { scale: 0, opacity: 0 }}
  transition={shouldReduceMotion ? { duration: 0 } : undefined}
  id="platform-fab-menu"
  role="dialog"
  aria-modal="true"
  aria-label="Streaming and social platforms"
>
```

Set the close and platforms classes:

```tsx
<button
  ref={closeRef}
  className="platform-launcher__fab-close"
  onClick={() => {
    setIsOpen(false);
    triggerRef.current?.focus();
  }}
  aria-label="Close platform menu"
>
```

```tsx
<div className="platform-launcher__fab-platforms">
```

```tsx
className="platform-launcher__fab-button"
```

```tsx
<span className="platform-launcher__fab-tooltip">
```

- [ ] **Step 3: Replace duplicate FAB CSS with canonical rules**

In `src/react-app/index.css`, remove the `.platform-launcher-fab`, `.fab-trigger`, `.fab-menu`, `.fab-platforms`, `.fab-platform-btn`, `.fab-platform-icon-svg`, `.fab-platform-tooltip`, and `.fab-close` block at lines around `2602-2665`.

Keep the earlier `.platform-launcher--fab` block and extend it with:

```css
.platform-launcher--fab {
  @apply fixed right-4 transition-all;
  bottom: calc(76px + env(safe-area-inset-bottom));
  right: calc(1rem + env(safe-area-inset-right));
  z-index: var(--z-bottom-sheet);
}

.platform-launcher__fab-trigger {
  width: 56px;
  height: 56px;
  border-radius: 999px;
  background: var(--color-accent);
  color: #fff;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, .25);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .3s ease;
}

.platform-launcher__fab-menu {
  position: absolute;
  bottom: 0;
  right: 0;
  background: color-mix(in oklab, var(--color-card) 98%, transparent);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--color-border);
  border-radius: 28px;
  padding: .75rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, .2);
  min-width: 64px;
}

.platform-launcher__fab-platforms {
  display: flex;
  flex-direction: column;
  gap: .5rem;
}

.platform-launcher__fab-button {
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: var(--platform-color);
  border: none;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all .2s ease;
  position: relative;
}

.platform-launcher__fab-button:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, .2);
}

.platform-launcher__fab-tooltip {
  position: absolute;
  right: calc(100% + 8px);
  top: 50%;
  transform: translateY(-50%);
  background: var(--color-card);
  color: var(--color-foreground);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  padding: .25rem .5rem;
  font-size: .8rem;
  white-space: nowrap;
  pointer-events: none;
  opacity: 0;
  translate: 4px 0;
  transition: opacity .15s ease, translate .15s ease;
}

.platform-launcher__fab-button:focus-visible .platform-launcher__fab-tooltip,
.platform-launcher__fab-button:hover .platform-launcher__fab-tooltip {
  opacity: 1;
  translate: 0 0;
}

.platform-launcher__fab-close {
  position: absolute;
  top: -8px;
  right: -8px;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--color-destructive);
  color: #fff;
  border: 2px solid var(--color-card);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: var(--z-base);
}
```

- [ ] **Step 4: Verify platform launcher tests**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --reporter=list -g "platform FAB|canonical BEM"
node scripts/check-ui-review-contracts.mjs platform-classes
```

Expected: both platform launcher Playwright tests pass, and the source-contract script prints `UI review source contracts passed.`

- [ ] **Step 5: Commit**

```bash
git add src/react-app/components/PlatformLauncher.tsx src/react-app/index.css
git commit -m "fix(platform): harden FAB accessibility"
```

---

### Task 4: Replace Creator Media Visual Tabs with Radix Tabs

**Files:**
- Modify: `src/react-app/components/CreatorMediaPanel.tsx`

- [ ] **Step 1: Import the existing Tabs primitives**

Add this import:

```ts
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
```

- [ ] **Step 2: Replace the custom tab button header and conditional panel body**

Replace the header tab `<div className="inline-flex rounded-lg border bg-background p-1">...</div>` and the conditional body branches with this structure:

```tsx
<Tabs
  value={tab}
  onValueChange={(value) => setTab(value as 'listen' | 'watch' | 'social' | 'share')}
  className="grid gap-6"
>
  <TabsList aria-label="Media sections" className="w-full flex-wrap sm:w-auto">
    {[
      { key: 'listen', label: 'Listen', icon: LuMusic },
      { key: 'watch', label: 'Watch', icon: LuCirclePlay },
      { key: 'social', label: 'Social', icon: LuMic },
      { key: 'share', label: 'Share', icon: LuShare2 },
    ].map(({ key, label, icon: Icon }) => (
      <TabsTrigger key={key} value={key} className="gap-2">
        <Icon size={18} aria-hidden="true" />
        <span>{label}</span>
      </TabsTrigger>
    ))}
  </TabsList>

  <TabsContent value="listen" aria-label="Listen">
    <SectionCard title="Listen" hint="Choose your streaming platform">
      {isMobile ? (
        <ListenTabsMobile
          spotifyUrl={spotifyUrl || defaultSpotifyUrl}
          appleMusicUrl={appleMusicUrl}
          autoExpand={false}
        />
      ) : (
        <ListenTabs
          spotifyUrl={spotifyUrl || defaultSpotifyUrl}
          appleMusicUrl={appleMusicUrl}
        />
      )}
    </SectionCard>
  </TabsContent>

  <TabsContent value="watch" aria-label="Watch">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SectionCard title="Facebook Watch" hint="On-demand videos">
        {facebookVideoHref ? (
          <LazyFacebookEmbed type="watch" videoUrl={facebookVideoHref} allowfullscreen />
        ) : (
          <EmptyState text="Provide a Facebook Watch video URL." />
        )}
      </SectionCard>
      <SectionCard title="Facebook Live" hint="Live broadcasts (public)">
        {facebookLiveHref ? (
          <LazyFacebookEmbed type="live" videoUrl={facebookLiveHref} allowfullscreen autoplay />
        ) : (
          <EmptyState text="Provide a Facebook Live URL." />
        )}
      </SectionCard>
      <SectionCard title="Facebook Page" hint="Timeline embed">
        {(facebookPageUrl || defaultFacebookPageUrl) ? (
          <LazyFacebookEmbed
            type="page"
            pageUrl={facebookPageUrl || defaultFacebookPageUrl!}
            tabs={['timeline', 'events']}
            adaptContainerWidth
          />
        ) : (
          <EmptyState text="Provide a Facebook Page URL." />
        )}
      </SectionCard>
    </div>
  </TabsContent>

  <TabsContent value="social" aria-label="Social">
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <SectionCard title="Instagram" hint="Latest posts and reels">
        {instagramPermalink ? (
          isMobile ? (
            <InstagramEmbedMobile posts={[{ url: instagramPermalink }]} profileUrl={defaultInstagramUrl} />
          ) : (
            <LazyInstagramEmbed url={instagramPermalink} />
          )
        ) : defaultInstagramUrl ? (
          <div className="grid grid-cols-2 gap-3">
            <LinkTile href={defaultInstagramUrl} label="View Profile" icon={<LuInstagram size={18} />} />
          </div>
        ) : (
          <EmptyState text="Provide a public Instagram post/reel URL." />
        )}
      </SectionCard>
      <SectionCard title="Quick Links" hint="Open profiles">
        <div className="grid grid-cols-2 gap-3 quick-links-grid">
          {(facebookPageUrl || defaultFacebookPageUrl) && (
            <LinkTile href={facebookPageUrl || defaultFacebookPageUrl!} label="Facebook" icon={<LuFacebook size={18} />} />
          )}
          {(instagramPermalink || defaultInstagramUrl) && (
            <LinkTile href={instagramPermalink || defaultInstagramUrl!} label="Instagram" icon={<LuInstagram size={18} />} />
          )}
          {(spotifyUrl || defaultSpotifyUrl) && (
            <LinkTile href={normalizeSpotifyOpen(spotifyUrl || defaultSpotifyUrl!)} label="Spotify" icon={<LuMusic size={18} />} />
          )}
          {appleMusicUrl && (
            <LinkTile href={appleMusicUrl} label="Apple Music" icon={<LuGlobe size={18} />} />
          )}
        </div>
      </SectionCard>
      <SectionCard title="Universal Embed" hint="TikTok, YouTube, X, LinkedIn and more">
        {(socialEmbedUrl || defaultSocialEmbedUrl) ? (
          <LazyUniversalEmbed url={(socialEmbedUrl || defaultSocialEmbedUrl)!} />
        ) : (
          <EmptyState text="Provide any supported social post URL (e.g., TikTok/YouTube/Twitter)." />
        )}
      </SectionCard>
    </div>
  </TabsContent>

  <TabsContent value="share" aria-label="Share">
    <ShareManager
      url={canonical}
      title={artist}
      description={`${artist} - ${tagline}`}
      artist={artist}
      tagline={tagline}
      campaign="creator_media_panel"
      showPlatforms={true}
      showQr={true}
      showDeepLinks={deepLinks.length > 0}
      deepLinks={deepLinks}
      className="share-manager-panel"
      layout="auto"
    />
  </TabsContent>
</Tabs>
```

- [ ] **Step 3: Verify creator media tab test**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --reporter=list -g "creator media"
```

Expected: the tab semantics test passes.

- [ ] **Step 4: Commit**

```bash
git add src/react-app/components/CreatorMediaPanel.tsx
git commit -m "fix(media): use accessible tabs"
```

---

### Task 5: Fix Booking Full-Width Fields

**Files:**
- Modify: `src/react-app/index.css`

- [ ] **Step 1: Add the missing grid span rule**

In `src/react-app/index.css`, near `.form-grid`, add:

```css
.form-grid .full-width {
  grid-column: 1 / -1;
}
```

- [ ] **Step 2: Verify booking layout test**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --reporter=list -g "booking location"
```

Expected: the booking full-width test passes.

- [ ] **Step 3: Commit**

```bash
git add src/react-app/index.css
git commit -m "fix(booking): span full-width form fields"
```

---

### Task 6: Harden FacebookEvents Semantics and Dialog Behavior

**Files:**
- Modify: `src/react-app/components/social/feeds/FacebookEvents.tsx`
- Modify: `src/react-app/index.css`

- [ ] **Step 1: Import the shared dialog primitives**

Add:

```ts
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
```

- [ ] **Step 2: Add one open helper**

Add this helper near `handleEventInteraction`:

```ts
const openEventDetails = (event: FacebookEvent) => {
  handleEventInteraction(event, 'view');
  if (onEventClick) {
    onEventClick(event);
    return;
  }
  setSelectedEvent(event);
};
```

- [ ] **Step 3: Replace clickable card wrappers with semantic articles and explicit buttons**

For list cards, replace the outer interactive `div` with:

```tsx
<article
  key={event.id}
  className={`event-card ${event.isCanceled ? 'canceled' : ''}`}
>
```

Inside the card actions, add an explicit details button before ticket actions:

```tsx
<button
  type="button"
  className="btn btn-secondary btn-sm"
  onClick={() => openEventDetails(event)}
  aria-label={`Open event details for ${event.name}`}
>
  Details
</button>
```

For grid cards, make the outer wrapper an article and add this button inside `.event-grid-content` after stats:

```tsx
<button
  type="button"
  className="event-card__open"
  onClick={() => openEventDetails(event)}
  aria-label={`Open event details for ${event.name}`}
>
  View details
</button>
```

For timeline cards, remove `role="button"` and `tabIndex={0}` from `.timeline-card`, then add:

```tsx
<button
  type="button"
  className="event-card__open"
  onClick={() => openEventDetails(event)}
  aria-label={`Open event details for ${event.name}`}
>
  View details
</button>
```

- [ ] **Step 4: Replace the custom modal with Radix Dialog**

Replace the `selectedEvent && <div className="event-modal">...` block with:

```tsx
<Dialog open={!!selectedEvent} onOpenChange={(open) => !open && setSelectedEvent(null)}>
  {selectedEvent && (
    <DialogContent className="modal-content fb-event-dialog">
      <DialogClose className="event-modal-close" aria-label="Close event details">
        <span aria-hidden="true">x</span>
      </DialogClose>

      {selectedEvent.coverPhoto && (
        <img
          src={selectedEvent.coverPhoto}
          alt={selectedEvent.name}
          className="modal-cover"
        />
      )}

      <div className="modal-body">
        <DialogTitle>{selectedEvent.name}</DialogTitle>
        <DialogDescription className="sr-only">
          Facebook event details, date, location, and actions.
        </DialogDescription>

        <div className="modal-meta">
          <div>
            <LuClock size={16} aria-hidden="true" />
            {formatEventDate(selectedEvent.startTime)}
            {selectedEvent.endTime && (
              <> - {formatEventDate(selectedEvent.endTime)}</>
            )}
          </div>

          {selectedEvent.place && (
            <div>
              <LuMapPin size={16} aria-hidden="true" />
              {selectedEvent.place.name}
              {selectedEvent.place.location && (
                <div className="address">
                  {selectedEvent.place.location.street}<br />
                  {selectedEvent.place.location.city}, {selectedEvent.place.location.zip}
                </div>
              )}
            </div>
          )}
        </div>

        {selectedEvent.description && (
          <p className="modal-description">{selectedEvent.description}</p>
        )}

        <div className="modal-actions">
          {selectedEvent.ticketUri && (
            <a
              href={selectedEvent.ticketUri}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
              onClick={() => handleEventInteraction(selectedEvent, 'ticket')}
            >
              <LuTicket size={16} aria-hidden="true" />
              Get Tickets
            </a>
          )}
          <a
            href={selectedEvent.eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-ghost"
            onClick={() => handleEventInteraction(selectedEvent, 'rsvp')}
          >
            <LuFacebook size={16} aria-hidden="true" />
            View on Facebook
          </a>
        </div>
      </div>
    </DialogContent>
  )}
</Dialog>
```

- [ ] **Step 5: Add event details button styling**

In `src/react-app/index.css`, near Facebook event styles, add:

```css
.event-card__open {
  @apply mt-3 inline-flex min-h-11 items-center justify-center rounded-[var(--radius)] border border-border bg-card px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring;
}

.fb-event-dialog {
  @apply max-h-[90vh] overflow-y-auto p-0;
}
```

- [ ] **Step 6: Verify FacebookEvents source contract**

Run:

```bash
node scripts/check-ui-review-contracts.mjs facebook-events
```

Expected:

```text
UI review source contracts passed.
```

- [ ] **Step 7: Commit**

```bash
git add src/react-app/components/social/feeds/FacebookEvents.tsx src/react-app/index.css
git commit -m "fix(events): harden facebook event dialogs"
```

---

### Task 7: Implement DynamicSocialFeed Masonry and Carousel Layouts

**Files:**
- Modify: `src/react-app/components/social/feeds/DynamicSocialFeed.tsx`
- Modify: `src/react-app/index.css`

- [ ] **Step 1: Add carousel state**

In `DynamicSocialFeed`, add this state after `selectedPost`:

```ts
const [carouselIndex, setCarouselIndex] = useState(0);
```

Add this effect near the existing effects:

```ts
useEffect(() => {
  if (carouselIndex >= posts.length) {
    setCarouselIndex(0);
  }
}, [carouselIndex, posts.length]);
```

- [ ] **Step 2: Extract reusable post-card rendering**

Replace the inline article inside `renderGrid` with a helper:

```tsx
const renderPostCard = (post: SocialPost) => (
  <article
    key={post.id}
    className={`social-post-card ${post.isShoppable ? 'shoppable' : ''}`}
    data-testid="social-post-card"
  >
    <div className="post-header">
      <span className={`platform-badge ${post.platform}`}>
        {post.platform === 'instagram' ? <LuInstagram size={14} /> : <LuFacebook size={14} />}
        {post.platform}
      </span>
      {post.isShoppable && (
        <span className="shoppable-badge">
          <LuShoppingBag size={14} />
          Shop
        </span>
      )}
    </div>

    <div className="post-media">
      <button
        type="button"
        className="post-media-open"
        onClick={() => openPost(post)}
        aria-label={`Open ${post.platform} post`}
      >
        <img
          src={post.thumbnailUrl || post.mediaUrl}
          alt={post.caption.substring(0, 50)}
          loading="lazy"
        />
        {(post.type === 'video' || post.type === 'reel') && (
          <span className="media-type-indicator" aria-hidden="true">▶</span>
        )}
      </button>

      {post.isShoppable && post.products && (
        <div className="product-tags">
          {post.products.map((product) => (
            <button
              type="button"
              key={product.id}
              className={`product-tag ${hoveredProduct === product.id ? 'active' : ''}`}
              style={{ left: `${product.x}%`, top: `${product.y}%` }}
              aria-label={`View ${product.title} for $${product.price}`}
              onMouseEnter={() => setHoveredProduct(product.id)}
              onMouseLeave={() => setHoveredProduct(null)}
              onClick={(e) => {
                e.stopPropagation();
                handlePostInteraction(post, 'product_click');
                window.location.href = product.productUrl;
              }}
            >
              <LuShoppingBag size={16} aria-hidden />
              <span className="sr-only">{`View ${product.title} for $${product.price}`}</span>
              {hoveredProduct === product.id && (
                <div className="product-tooltip">
                  {product.imageUrl && <img src={product.imageUrl} alt={product.title} />}
                  <div className="product-info">
                    <p className="product-title">{product.title}</p>
                    <p className="product-price">${product.price}</p>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </div>

    <div className="post-engagement">
      <button
        type="button"
        className="engagement-btn"
        aria-label={`Like ${post.platform} post${post.likes != null ? ` (${post.likes.toLocaleString()} likes)` : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handlePostInteraction(post, 'like');
        }}
      >
        <LuHeart size={16} />
        <span>{post.likes?.toLocaleString()}</span>
      </button>
      <button
        type="button"
        className="engagement-btn"
        aria-label={`Comment on ${post.platform} post${post.comments != null ? ` (${post.comments.toLocaleString()} comments)` : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handlePostInteraction(post, 'comment');
        }}
      >
        <LuMessageCircle size={16} />
        <span>{post.comments?.toLocaleString()}</span>
      </button>
      <button
        type="button"
        className="engagement-btn"
        aria-label={`Share ${post.platform} post${post.shares != null ? ` (${post.shares.toLocaleString()} shares)` : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          handlePostInteraction(post, 'share');
        }}
      >
        <LuShare2 size={16} />
        <span>{post.shares?.toLocaleString()}</span>
      </button>
    </div>

    <div className="post-caption">
      <p>{post.caption.substring(0, 100)}...</p>
      <button type="button" className="post-open-link" onClick={() => openPost(post)}>
        View post
      </button>
    </div>
  </article>
);
```

Then make `renderGrid`:

```tsx
const renderGrid = () => (
  <div className="social-feed-grid">
    {posts.map(renderPostCard)}
  </div>
);
```

- [ ] **Step 3: Implement masonry and carousel**

Replace `renderMasonry` and `renderCarousel` with:

```tsx
const renderMasonry = () => (
  <div className="social-feed-masonry">
    {posts.map(renderPostCard)}
  </div>
);

const renderCarousel = () => {
  const activePost = posts[carouselIndex];
  if (!activePost) return null;

  const previous = () => setCarouselIndex(index => (index - 1 + posts.length) % posts.length);
  const next = () => setCarouselIndex(index => (index + 1) % posts.length);

  return (
    <div className="social-feed-carousel" aria-roledescription="carousel" aria-label="Latest social posts">
      <div className="social-feed-carousel__viewport" aria-live="polite">
        {renderPostCard(activePost)}
      </div>
      {posts.length > 1 && (
        <div className="social-feed-carousel__controls">
          <button type="button" className="btn btn-ghost btn-sm" onClick={previous} aria-label="Previous social post">
            Previous
          </button>
          <span className="social-feed-carousel__count">
            {carouselIndex + 1} / {posts.length}
          </span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={next} aria-label="Next social post">
            Next
          </button>
        </div>
      )}
    </div>
  );
};
```

- [ ] **Step 4: Add layout CSS**

In `src/react-app/index.css`, near social feed styles, add:

```css
.social-feed-masonry {
  columns: 1;
  column-gap: 1rem;
}

.social-feed-masonry .social-post-card {
  break-inside: avoid;
  margin-bottom: 1rem;
}

@media (min-width: 640px) {
  .social-feed-masonry {
    columns: 2;
  }
}

@media (min-width: 1024px) {
  .social-feed-masonry {
    columns: 3;
  }
}

.social-feed-carousel {
  @apply grid gap-4;
}

.social-feed-carousel__viewport {
  @apply mx-auto w-full max-w-md;
}

.social-feed-carousel__controls {
  @apply flex items-center justify-center gap-3;
}

.social-feed-carousel__count {
  @apply text-sm font-medium text-muted-foreground;
}
```

- [ ] **Step 5: Verify social layout source contract**

Run:

```bash
node scripts/check-ui-review-contracts.mjs dynamic-social-layouts
```

Expected:

```text
UI review source contracts passed.
```

- [ ] **Step 6: Commit**

```bash
git add src/react-app/components/social/feeds/DynamicSocialFeed.tsx src/react-app/index.css
git commit -m "fix(social): implement feed layout modes"
```

---

### Task 8: Final Verification and Cleanup

**Files:**
- Review only unless a verification failure points to a touched file.

- [ ] **Step 1: Run lint**

Run:

```bash
npm run lint -- src/react-app/components src/react-app/pages src/react-app/hooks src/react-app/lib e2e/ui-theme.spec.ts
```

Expected:

```text
> lint
> eslint .
```

Exit code: `0`.

- [ ] **Step 2: Run the focused Playwright suite**

Run:

```bash
npx playwright test e2e/ui-theme.spec.ts --project=chromium --reporter=list
```

Expected: all tests in `e2e/ui-theme.spec.ts` pass in Chromium.

- [ ] **Step 3: Run build**

Run:

```bash
node scripts/check-ui-review-contracts.mjs
```

Expected:

```text
UI review source contracts passed.
```

- [ ] **Step 4: Run build**

Run:

```bash
npm run build
```

Expected: TypeScript and Vite production build complete successfully.

- [ ] **Step 5: Run the repo check gate**

Run:

```bash
npm run check
```

Expected: type-check, Vite build, Wrangler dry-run deploy, and Pa11y accessibility scan complete with exit code `0`.

- [ ] **Step 6: Inspect diff for scope**

Run:

```bash
git diff --check
git diff --stat
```

Expected: `git diff --check` exits `0`; diff stat includes only the files listed in this plan unless a verification fix required a directly related test or style file.

- [ ] **Step 7: Final commit**

If Task 8 required changes, commit them:

```bash
git add e2e/ui-theme.spec.ts scripts/check-ui-review-contracts.mjs src/react-app/components src/react-app/pages src/react-app/utils src/react-app/index.css
git commit -m "chore(ui): verify review remediation"
```

If Task 8 did not require changes, do not create an empty commit.

---

## Acceptance Criteria

- Product add-to-cart failure paths show a visible alert and do not leave users guessing.
- Products without variants are disabled with explicit unavailable copy.
- Platform FAB opens as a labelled dialog, moves focus into the launcher, closes with Escape, restores focus, and uses only canonical `.platform-launcher__*` FAB classes.
- Creator media sections expose real tab semantics through Radix Tabs.
- Booking `Location` and `Additional Details` fields span the full desktop grid width.
- Facebook event details open from explicit controls, use Radix Dialog semantics, close with Escape, and restore focus.
- `DynamicSocialFeed` renders distinct grid, masonry, carousel, and stories layouts.
- `npm run lint`, focused Playwright, `npm run build`, and `npm run check` pass.
