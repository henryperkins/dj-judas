# Comprehensive Implementation Context Report

## I. ECOMMERCE POLISH (Priority 1)

### A. Quantity Controls with Line Item Updates

**Current State:**
- `CheckoutPage.tsx:265-289` has quantity controls implemented
- `cart-sdk.ts` exports `updateLineItem()` and `removeLineItem()` functions
- Both SDK and fetch fallback paths implemented
- Already wired up: decrease (lines 268-272), increase (lines 278-283)

**Status:** ✅ **ALREADY IMPLEMENTED**

**Verification Needed:**
- Test cart refresh after quantity change
- Ensure totals update correctly
- Test edge cases (quantity=0 should delete item)

---

### B. Shipping Option Selection UI with Prices

**Current State:**
- `CheckoutPage.tsx:219-242` displays shipping options
- `listShippingOptions()` in `cart-sdk.ts:205-233` fetches options
- Price display exists (line 229): `formatAmount(o.amount, cart?.region?.currency_code)`
- Selection state exists (line 228): checks if option is selected
- Selection handler exists (line 235): `addShippingMethod(o.id)`

**Gap:** Totals don't automatically recompute after shipping selection

**Implementation Required:**
```typescript
// In CheckoutPage.tsx, modify addShippingMethod:
const addShippingMethod = async (option_id: string) => {
  if (!MEDUSA_URL || !cartId) return
  setBusy(true) // Add loading state
  await fetch(`${MEDUSA_URL}/store/carts/${cartId}/shipping-methods`, {
    method: 'POST', headers, body: JSON.stringify({ option_id })
  })
  const updated = await getCart(cartId)
  setCart(updated)
  setBusy(false) // Clear loading
}
```

**Location:** `src/react-app/pages/CheckoutPage.tsx:101-108`

---

### C. Display Line-Level and Order-Level Discounts

**Current State:**
- `CheckoutPage.tsx:294-310` displays totals
- Totals include `discount_total` (line 305) but no line-item discounts shown
- Medusa SDK types support `discount_total` on cart

**Implementation Required:**

1. **Display line-item discounts in cart items:**
```typescript
// Add after line 262 (after variant display):
{li.discount_total > 0 && (
  <div className="text-success text-sm">
    Discount: {formatAmount(li.discount_total, cart?.region?.currency_code || 'usd')}
  </div>
)}
```

2. **Add discount row in summary** (already exists at line 305, verify it renders)

3. **Show applied promotion codes:**
```typescript
// Add after line 294 (before totals):
{cart?.discounts?.length > 0 && (
  <div className="mb-2">
    <div className="text-sm font-medium mb-1">Applied Codes:</div>
    {cart.discounts.map(d => (
      <div key={d.id} className="text-sm text-success">{d.code}</div>
    ))}
  </div>
)}
```

**Location:** `src/react-app/pages/CheckoutPage.tsx:254-312`

---

## II. MINISTRY-SPECIFIC FEATURES (Priority 2)

### A. Donation Flow Integration

**Current State:**
- No donation-specific infrastructure
- Stripe integration exists (`/api/stripe/checkout` in worker)
- Medusa cart system in place

**Implementation Required:**

1. **Create donation product type in Medusa backend:**
```bash
# In medusa-backend, add donation products with flexible pricing
```

2. **Build donation component:**
```typescript
// src/react-app/components/DonationForm.tsx
import { useState } from 'react'
import { addLineItem } from '../utils/cart-sdk'
import { navigate } from '../utils/nav'

export default function DonationForm() {
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)

  const presets = [10, 25, 50, 100, 250]

  const handleDonate = async () => {
    // Convert amount to donation variant
    // Use Stripe Price API or Medusa custom amount
    // Add to cart and navigate to checkout
  }

  return (
    <section className="container section-py">
      <h2 className="section-title">Support Our Ministry</h2>
      <div className="flex gap-2 mb-3">
        {presets.map(p => (
          <button
            key={p}
            className={`btn ${amount === String(p) ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setAmount(String(p))}
          >
            ${p}
          </button>
        ))}
      </div>
      <input
        className="form-input mb-3"
        type="number"
        placeholder="Custom amount"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <button
        className={`btn btn-primary ${loading ? 'btn-loading' : ''}`}
        onClick={handleDonate}
        disabled={!amount || loading}
      >
        {loading ? '' : 'Continue'}
      </button>
    </section>
  )
}
```

3. **Add worker endpoint for dynamic Stripe checkout:**
```typescript
// In src/worker/index.ts, add:
app.post('/api/donations/checkout', async (c) => {
  const { amount } = await c.req.json<{ amount: number }>()
  // Create Stripe checkout session with dynamic amount
  // Or create Medusa order with custom line item
})
```

**Files to Create:**
- `src/react-app/components/DonationForm.tsx`
- Add route in `src/react-app/Router.tsx`

---

### B. Event RSVP System

**Current State:**
- Events system exists (`src/react-app/utils/events.ts`)
- Events stored in D1 database (wrangler.toml:41-44)
- Events API endpoint exists (`/api/events` in worker:1977)
- No RSVP infrastructure

**Implementation Required:**

1. **Create D1 schema for RSVPs:**
```sql
-- Run via wrangler d1 execute
CREATE TABLE event_rsvps (
  id TEXT PRIMARY KEY,
  event_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  guests INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_rsvps_event ON event_rsvps(event_slug);
CREATE INDEX idx_rsvps_email ON event_rsvps(email);
```

2. **Add worker RSVP endpoints:**
```typescript
// In src/worker/index.ts, add after events API:

app.post('/api/events/:slug/rsvp', async (c) => {
  const slug = c.req.param('slug')
  const { name, email, guests } = await c.req.json()

  const db = c.env.DB
  if (!db) return c.json({ error: 'Database not configured' }, 500)

  const id = crypto.randomUUID()
  await db.prepare(
    'INSERT INTO event_rsvps (id, event_slug, name, email, guests) VALUES (?, ?, ?, ?, ?)'
  ).bind(id, slug, name, email, guests || 1).run()

  // Optional: Send confirmation email via /api/booking flow

  return c.json({ success: true, id })
})

app.get('/api/events/:slug/rsvp-count', async (c) => {
  const slug = c.req.param('slug')
  const db = c.env.DB
  if (!db) return c.json({ count: 0 })

  const result = await db.prepare(
    'SELECT COUNT(*) as count, SUM(guests) as total_guests FROM event_rsvps WHERE event_slug = ?'
  ).bind(slug).first()

  return c.json(result)
})
```

3. **Build RSVP UI component:**
```typescript
// src/react-app/components/events/EventRSVP.tsx
export default function EventRSVP({ slug }: { slug: string }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [guests, setGuests] = useState(1)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const res = await fetch(`/api/events/${slug}/rsvp`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name, email, guests })
    })
    if (res.ok) setSubmitted(true)
  }

  // Render form or success message
}
```

**Files to Create:**
- `src/react-app/components/events/EventRSVP.tsx`
- Add SQL migration via wrangler CLI
- Update `src/worker/index.ts` with endpoints

---

### C. Newsletter Signup Integration

**Current State:**
- Email infrastructure exists (Resend/SendGrid configured)
- Booking form exists (`src/react-app/components/BookingForm.tsx`)

**Implementation Required:**

1. **Create newsletter collection table:**
```sql
CREATE TABLE newsletter_subscribers (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  source TEXT, -- 'footer', 'modal', 'checkout'
  subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP,
  unsubscribed_at TEXT
);

CREATE UNIQUE INDEX idx_newsletter_email ON newsletter_subscribers(email);
```

2. **Add worker endpoint:**
```typescript
// In src/worker/index.ts:

app.post('/api/newsletter/subscribe', async (c) => {
  const { email, name, source } = await c.req.json()

  const db = c.env.DB
  if (!db) return c.json({ error: 'Database not configured' }, 500)

  const id = crypto.randomUUID()

  try {
    await db.prepare(
      'INSERT INTO newsletter_subscribers (id, email, name, source) VALUES (?, ?, ?, ?)'
    ).bind(id, email, name || null, source || 'unknown').run()

    // Optional: Send welcome email via Resend

    return c.json({ success: true })
  } catch (err) {
    if (err.message?.includes('UNIQUE')) {
      return c.json({ error: 'Already subscribed' }, 409)
    }
    return c.json({ error: 'Failed to subscribe' }, 500)
  }
})
```

3. **Build reusable newsletter component:**
```typescript
// src/react-app/components/NewsletterSignup.tsx
export default function NewsletterSignup({ source = 'footer' }: { source?: string }) {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, source })
    })

    setStatus(res.ok ? 'success' : 'error')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="email"
        className="form-input flex-1"
        placeholder="Your email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
      />
      <button
        type="submit"
        className={`btn btn-primary ${status === 'loading' ? 'btn-loading' : ''}`}
        disabled={status === 'loading'}
      >
        {status === 'success' ? '✓' : 'Subscribe'}
      </button>
    </form>
  )
}
```

**Files to Create:**
- `src/react-app/components/NewsletterSignup.tsx`
- SQL migration via wrangler
- Update `src/worker/index.ts`

---

## III. ADMIN EXPERIENCE IMPROVEMENTS (Priority 3)

### A. Bulk Product Operations

**Current State:**
- Admin product list (`src/react-app/pages/AdminProductsList.tsx`)
- Individual product CRUD exists

**Implementation Required:**

1. **Add bulk actions UI:**
```typescript
// In AdminProductsList.tsx, add selection state:
const [selected, setSelected] = useState<Set<string>>(new Set())

// Add checkbox to each product row
// Add bulk action bar when selected.size > 0

const handleBulkPublish = async () => {
  await Promise.all(
    Array.from(selected).map(id =>
      fetch(`/api/admin/products/${id}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ status: 'published' })
      })
    )
  )
  // Refresh list
}
```

2. **Add worker bulk endpoint (optional optimization):**
```typescript
// In src/worker/index.ts:
app.post('/api/admin/products/bulk', async (c) => {
  const { ids, action, data } = await c.req.json()
  const token = getAdminTokenFromCookie(c.req.header('Cookie'))
  const medusaUrl = getMedusaUrl(c)

  // Perform bulk operation against Medusa
  // Return results
})
```

**Location:** `src/react-app/pages/AdminProductsList.tsx`

---

### B. Advanced Variant Management

**Current State:**
- Variant create exists (`/api/admin/products/:id/variants` - worker:840)
- Variant update exists (`/api/admin/variants/:id` - worker:853)
- Variant delete exists (`/api/admin/variants/:id` - worker:866)

**Gap:** UI doesn't expose variant management in AdminEditProduct

**Implementation Required:**

1. **Add variant manager to AdminEditProduct:**
```typescript
// In src/react-app/pages/AdminEditProduct.tsx, add:
const [variants, setVariants] = useState<Variant[]>([])

const addVariant = async () => {
  const res = await fetch(`/api/admin/products/${id}/variants`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      title: 'New Variant',
      prices: [{ currency_code: 'usd', amount: 0 }]
    })
  })
  // Refresh variants
}

// Render variant list with edit/delete buttons
```

**Location:** `src/react-app/pages/AdminEditProduct.tsx`

---

## IV. PERFORMANCE MONITORING (Priority 4)

### Analytics Engine Integration

**Current State:**
- Analytics Engine binding exists (wrangler.toml:80-81)
- Worker middleware logs timing (worker:111-124)
- Client analytics exists (`src/react-app/utils/analytics.ts`)

**Enhancement Required:**

1. **Add structured tracking to key flows:**
```typescript
// In src/react-app/utils/analytics.ts, add:
export const trackCheckoutStep = (step: 'address' | 'shipping' | 'payment', metadata?: Record<string, unknown>) => {
  analytics.trackEcommerce('begin_checkout', {
    checkout_step: step,
    ...metadata
  })
}

export const trackProductView = (product: Product) => {
  analytics.trackEcommerce('view_item', {
    currency: 'USD',
    value: product.variants?.[0]?.calculated_price?.calculated_amount || 0,
    items: [{
      id: product.id,
      name: product.title
    }]
  })
}
```

2. **Add server-side metrics dashboard:**
```typescript
// In src/worker/index.ts, add analytics query endpoint:
app.get('/api/admin/analytics', async (c) => {
  const token = getAdminTokenFromCookie(c.req.header('Cookie'))
  if (!token) return c.json({ error: 'unauthorized' }, 401)

  // Query Analytics Engine dataset for insights
  // Return aggregated metrics
})
```

3. **Add real user monitoring:**
```typescript
// In src/react-app/utils/analytics.ts:
export const trackPerformance = () => {
  if (typeof window === 'undefined') return

  window.addEventListener('load', () => {
    const navTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    analytics.trackCustom('page_performance', {
      dom_load: navTiming.domContentLoadedEventEnd - navTiming.domContentLoadedEventStart,
      full_load: navTiming.loadEventEnd - navTiming.loadEventStart,
      ttfb: navTiming.responseStart - navTiming.requestStart
    })
  })
}
```

**Locations:**
- `src/react-app/utils/analytics.ts` (enhancements)
- `src/worker/index.ts` (add analytics endpoint)

---

## V. TECHNICAL REQUIREMENTS SUMMARY

### Environment Variables Needed:
- ✅ All Medusa vars configured (VITE_MEDUSA_URL, MEDUSA_URL)
- ✅ Stripe vars configured (STRIPE_SECRET, SITE_URL)
- ✅ Email vars configured (RESEND_API_KEY)
- ✅ CF Images configured (CF_IMAGES_ACCOUNT_ID, CF_IMAGES_API_TOKEN)
- ✅ Analytics Engine binding active
- ✅ D1 Database binding active

### Database Migrations Required:
```bash
# RSVP system
wrangler d1 execute DB --command="CREATE TABLE event_rsvps (id TEXT PRIMARY KEY, event_slug TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, guests INTEGER DEFAULT 1, created_at TEXT DEFAULT CURRENT_TIMESTAMP); CREATE INDEX idx_rsvps_event ON event_rsvps(event_slug); CREATE INDEX idx_rsvps_email ON event_rsvps(email);"

# Newsletter system
wrangler d1 execute DB --command="CREATE TABLE newsletter_subscribers (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, name TEXT, source TEXT, subscribed_at TEXT DEFAULT CURRENT_TIMESTAMP, unsubscribed_at TEXT); CREATE UNIQUE INDEX idx_newsletter_email ON newsletter_subscribers(email);"
```

### Styling:
- All needed classes already exist in `src/react-app/index.css`
- Ecommerce sections 5.10-5.20 cover product/cart/checkout
- Form styles in section 3
- Alert styles for success/error states

### Testing Checklist:
- [ ] Quantity controls update cart totals
- [ ] Shipping selection recalculates totals
- [ ] Discounts display correctly
- [ ] Donation flow completes checkout
- [ ] RSVP submission works
- [ ] Newsletter signup handles duplicates
- [ ] Bulk admin actions work
- [ ] Analytics track correctly

---

## Next Steps:
1. Start with **Ecommerce Polish** (highest ROI, mostly done)
2. Add **RSVP System** (ministry-specific, moderate effort)
3. Build **Donation Flow** (ministry-specific, high value)
4. Implement **Newsletter** (quick win)
5. Enhance **Admin UX** (quality of life)
6. Add **Performance Monitoring** (ongoing optimization)

All infrastructure is in place—these are primarily UI and endpoint additions building on the solid foundation.
