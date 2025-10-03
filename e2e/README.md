# E2E Tests

End-to-end tests for DJ Judas application using Playwright.

## Test Coverage

### Spotify OAuth Integration (`spotify-oauth.spec.ts`)
- ✅ OAuth flow initiation
- ✅ Callback handling and session creation
- ✅ Cookie security (conditional Secure flag)
- ✅ Session persistence and authentication state
- ✅ Token refresh mechanism
- ✅ Error handling

### Apple Music Integration (`apple-music.spec.ts`)
- ✅ MusicKit initialization (singleton pattern)
- ✅ Developer token caching in KV
- ✅ URL extraction with query parameters
- ✅ Add to Library functionality
- ✅ Authorization flow
- ✅ Error handling for missing credentials

### Checkout Flow (`checkout-flow.spec.ts`)
- ✅ Cart creation and management
- ✅ Shipping address validation
- ✅ Shipping options loading
- ✅ Shipping method selection and total updates
- ✅ Order completion with Medusa provider
- ✅ Quantity management
- ✅ Error handling for incomplete data

## Running Tests

### Local Development

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI (interactive mode)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run specific browser only
npm run test:e2e:chromium

# Debug mode
npm run test:e2e:debug
```

### View Test Reports

```bash
# Open HTML report
npm run test:e2e:report
```

## Test Structure

```
e2e/
├── spotify-oauth.spec.ts      # Spotify OAuth tests
├── apple-music.spec.ts         # Apple Music integration tests
├── checkout-flow.spec.ts       # Medusa checkout tests
├── helpers/
│   └── test-helpers.ts         # Shared test utilities
├── fixtures/
│   └── test-data.ts            # Mock data and selectors
└── README.md                   # This file
```

## Configuration

Tests are configured in `playwright.config.ts`:
- **Base URL:** `http://localhost:5173`
- **Browsers:** Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Retries:** 2 on CI, 0 locally
- **Timeout:** 30 seconds per test
- **Parallel:** Yes (unless on CI)

## CI/CD

Tests run automatically on:
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`
- Manual workflow dispatch

See `.github/workflows/e2e-tests.yml` for CI configuration.

## Writing New Tests

### Example Test

```typescript
import { test, expect } from '@playwright/test';
import { waitForNetworkIdle } from './helpers/test-helpers';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/');
    await waitForNetworkIdle(page);

    // Your test logic
    const element = page.locator('[data-testid="example"]');
    await expect(element).toBeVisible();
  });
});
```

### Best Practices

1. **Use data-testid attributes** for reliable selectors
2. **Wait for network idle** after navigation
3. **Mock external APIs** when possible
4. **Clean up state** in beforeEach/afterEach
5. **Use helper functions** from `test-helpers.ts`
6. **Add descriptive test names** that explain what's being tested

## Debugging Failed Tests

### Local Debugging

1. **Run in headed mode:**
   ```bash
   npm run test:e2e:headed
   ```

2. **Use debug mode:**
   ```bash
   npm run test:e2e:debug
   ```

3. **Check screenshots:**
   - Failed tests automatically capture screenshots
   - Located in `test-results/`

4. **Watch videos:**
   - Videos recorded on failure
   - Located in `test-results/`

### CI Debugging

1. Check workflow logs in GitHub Actions
2. Download test artifacts (reports, screenshots, videos)
3. View HTML report artifact for detailed results

## Mocking

Tests use route interception to mock:
- Spotify OAuth endpoints
- Apple Music token generation
- Medusa cart/checkout APIs

Example:
```typescript
await page.route('/api/spotify/login', async route => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ authorizeUrl: '...' })
  });
});
```

## Coverage

Current test coverage:
- **Spotify Integration:** 7 test cases
- **Apple Music Integration:** 8 test cases
- **Checkout Flow:** 9 test cases
- **Total:** 24+ test scenarios

## Troubleshooting

### Tests timing out
- Increase timeout in `playwright.config.ts`
- Check for slow network/API responses
- Verify dev server is running

### Flaky tests
- Add proper waits (`waitForNetworkIdle`, `waitForLoadState`)
- Avoid hard-coded timeouts
- Use retry logic on CI

### Element not found
- Check if selector is correct
- Wait for element to appear
- Verify element exists in current state
