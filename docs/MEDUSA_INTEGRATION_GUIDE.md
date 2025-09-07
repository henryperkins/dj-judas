# Medusa Integration Guide - DJ Judas App

## Overview

This document details how Medusa is integrated into the DJ Judas application for ecommerce functionality. The app uses Medusa as a headless commerce backend while maintaining its own custom React UI.

## Current Implementation

### Architecture
- **Frontend**: React (Vite) with custom UI components
- **Backend API**: Medusa Store API (REST)
- **Cart Storage**: Browser localStorage with key `medusa_cart_id`
- **Styling**: Custom CSS classes in `src/react-app/index.css`

### Core Files
- `src/react-app/utils/cart.ts` - Cart management utilities
- `src/react-app/components/FeaturedProducts.tsx` - Product display
- `src/react-app/pages/CheckoutPage.tsx` - Checkout flow
- `src/react-app/pages/SuccessPage.tsx` - Order confirmation

## Configuration

### Environment Variables

```env
# Required for Medusa integration
VITE_MEDUSA_URL=https://api.your-medusa.com
VITE_MEDUSA_PUBLISHABLE_KEY=pk_your_publishable_key  # Optional, if store requires it

# Optional for Stripe payment handoff
VITE_STRIPE_PRICE_ID=price_xxx
STRIPE_SECRET=sk_live_...  # Worker-side secret
```

### Authentication
- Uses publishable key in `x-publishable-api-key` header when configured
- All requests include `content-type: application/json` header

## API Integration Patterns

### 1. Cart Management

#### Create Cart
```typescript
// utils/cart.ts - ensureCart()
const res = await fetch(`${MEDUSA_URL}/store/carts`, { 
  method: 'POST', 
  headers 
})
const id = json?.cart?.id
localStorage.setItem('medusa_cart_id', id)
```

#### Add Line Items
```typescript
// utils/cart.ts - addLineItem()
await fetch(`${MEDUSA_URL}/store/carts/${id}/line-items`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ 
    variant_id: variantId, 
    quantity: 1 
  })
})
```

#### Retrieve Cart with Totals
```typescript
// utils/cart.ts - getCart()
const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, { headers })
// Returns cart with items, subtotal, shipping_total, tax_total, total
```

### 2. Product Catalog

#### Fetch Products
```typescript
// utils/cart.ts - fetchProducts()
const url = new URL(`${MEDUSA_URL}/store/products`)
url.searchParams.set('limit', '12')
url.searchParams.set('status', 'published')
const res = await fetch(url.toString(), { headers })
```

#### Product Display
- Shows 6 featured products in grid layout
- Each product card displays thumbnail, title, and action buttons
- "Add to cart" adds first variant automatically
- "Details" navigates to checkout page

### 3. Checkout Flow

#### Update Shipping Address
```typescript
// CheckoutPage.tsx - saveAddress()
await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, {
  method: 'POST',
  headers,
  body: JSON.stringify({
    email: addr.email,
    shipping_address: {
      first_name, last_name, address_1, 
      city, postal_code, country_code
    }
  })
})
```

#### Load Shipping Options
```typescript
// CheckoutPage.tsx - loadOptions()
// Try both endpoint formats for compatibility
let res = await fetch(`${MEDUSA_URL}/store/shipping-options/${cartId}`, { headers })
if (!res.ok) {
  const u = new URL(`${MEDUSA_URL}/store/shipping-options`)
  u.searchParams.set('cart_id', cartId)
  res = await fetch(u.toString(), { headers })
}
```

#### Add Shipping Method
```typescript
// CheckoutPage.tsx - addShippingMethod()
await fetch(`${MEDUSA_URL}/store/carts/${cartId}/shipping-methods`, {
  method: 'POST',
  headers,
  body: JSON.stringify({ option_id })
})
```

#### Complete Order
```typescript
// CheckoutPage.tsx - completeMedusa()
const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/complete`, { 
  method: 'POST', 
  headers 
})
if (json?.type === 'order') navigate('/success')
```

### 4. Payment Options

The app supports two payment flows:

1. **Medusa Payment Provider**: Direct completion via Medusa's configured provider
2. **Stripe Handoff**: Optional redirect to Stripe Checkout (requires worker endpoint)

## Data Types

### Cart
```typescript
type Cart = {
  id: string
  items: CartItem[]
  region?: { currency_code?: string }
  subtotal?: number
  shipping_total?: number
  tax_total?: number
  total?: number
}
```

### Cart Item
```typescript
type CartItem = {
  id: string
  title?: string
  thumbnail?: string
  quantity: number
  unit_price: number
  variant?: { title?: string }
}
```

### Shipping Option
```typescript
type ShippingOption = { 
  id: string
  name: string
  amount?: number
  price_type?: 'fixed' | 'calculated'
}
```

## Currency Formatting

The app uses `Intl.NumberFormat` for proper currency display:

```typescript
// utils/cart.ts - formatAmount()
function formatAmount(amount?: number, currency?: string) {
  if (amount == null) return ''
  const cur = (currency || 'usd').toUpperCase()
  return new Intl.NumberFormat(undefined, { 
    style: 'currency', 
    currency: cur 
  }).format(amount / 100)  // Amounts stored in cents
}
```

## UI Components

### Product Grid
- CSS class: `.product-grid`
- Card class: `.product-card` with `__image`, `__content`, `__title`, `__actions`
- Responsive grid layout with mobile optimization

### Checkout Layout
- Two-column grid: `.checkout-grid`
- Form sections: `.checkout-section` with `__title`
- Order summary sidebar: `.checkout-summary`
- Mobile sticky footer: `.checkout-footer` (shows total and pay button)

### Form Styling
- Input fields: `.form-input` with `.form-label`
- Grid layouts: `.form-grid-2` for two-column forms
- Required indicators: `.form-label--required`
- Loading states: `.btn-loading` class

## Current Limitations

1. **Quantity Management**: Update/remove buttons are disabled in cart
2. **Variant Selection**: Only adds first variant of products
3. **Shipping Prices**: Doesn't display/calculate shipping option prices
4. **Payment Sessions**: Doesn't create payment sessions before completion
5. **Region Selection**: No UI for selecting different regions/currencies
6. **Inventory Display**: Doesn't show stock availability

## Recommended Improvements

### Immediate Enhancements

1. **Enable Quantity Controls**
```typescript
// Add to cart.ts
export async function updateLineItem(itemId: string, quantity: number) {
  const cartId = getCartId()
  if (!MEDUSA_URL || !cartId) return false
  const res = await fetch(
    `${MEDUSA_URL}/store/carts/${cartId}/line-items/${itemId}`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ quantity })
    }
  )
  return res.ok
}
```

2. **Remove Line Items**
```typescript
export async function removeLineItem(itemId: string) {
  const cartId = getCartId()
  if (!MEDUSA_URL || !cartId) return false
  const res = await fetch(
    `${MEDUSA_URL}/store/carts/${cartId}/line-items/${itemId}`,
    { method: 'DELETE', headers }
  )
  return res.ok
}
```

3. **Calculate Shipping Prices**
```typescript
// For shipping options with price_type="calculated"
const calculateShippingPrice = async (optionId: string) => {
  const res = await fetch(
    `${MEDUSA_URL}/store/shipping-options/${optionId}/calculate`,
    {
      method: 'POST',
      headers,
      body: JSON.stringify({ cart_id: cartId })
    }
  )
  const json = await res.json()
  return json?.shipping_option?.amount
}
```

### SDK Migration (Optional)

Consider migrating to Medusa JS SDK for better developer experience:

```bash
npm install @medusajs/js-sdk
```

```typescript
import Medusa from '@medusajs/js-sdk'

const sdk = new Medusa({
  baseUrl: MEDUSA_URL,
  publishableKey: MEDUSA_PUB
})

// Cleaner API calls
const { cart } = await sdk.store.cart.create({ region_id })
const { cart: updated } = await sdk.store.cart.createLineItem(cartId, {
  variant_id: variantId,
  quantity: 1
})
```

### Advanced Features

1. **Product Variant Selection**: Add UI for selecting size/color/options
2. **Wishlist**: Implement saved items using customer accounts
3. **Promotions**: Add discount code input and display savings
4. **Customer Accounts**: Enable order history and saved addresses
5. **Multi-region**: Add region selector for international sales

## Medusa Store API Reference

### Key Endpoints Used

- `POST /store/carts` - Create cart
- `GET /store/carts/{id}` - Retrieve cart
- `POST /store/carts/{id}` - Update cart (address, email)
- `POST /store/carts/{id}/line-items` - Add item
- `POST /store/carts/{id}/line-items/{line_id}` - Update item
- `DELETE /store/carts/{id}/line-items/{line_id}` - Remove item
- `GET /store/products` - List products
- `GET /store/shipping-options?cart_id={id}` - List shipping options
- `POST /store/shipping-options/{id}/calculate` - Calculate shipping price
- `POST /store/carts/{id}/shipping-methods` - Add shipping method
- `POST /store/carts/{id}/payment-sessions` - Create payment session
- `POST /store/carts/{id}/complete` - Complete order

### Query Parameters

**Product Listing**:
- `limit` - Number of products (default: 20)
- `offset` - Pagination offset
- `q` - Keyword search
- `status` - Filter by status (e.g., "published")
- `collection_id` - Filter by collection
- `category_id` - Filter by category
- `fields` - Select specific fields (e.g., pricing, inventory)

## Testing Checklist

- [ ] Cart persists across page refreshes
- [ ] Products display with correct pricing
- [ ] Add to cart creates/updates cart
- [ ] Checkout shows correct totals
- [ ] Shipping address saves to cart
- [ ] Shipping options load for cart region
- [ ] Order completion returns order object
- [ ] Success page displays order confirmation
- [ ] Mobile responsive checkout works
- [ ] Error states handle missing config gracefully

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure Medusa backend allows your dev origin
2. **Missing Cart**: Check localStorage for `medusa_cart_id`
3. **No Products**: Verify products are published in Medusa admin
4. **Shipping Options Empty**: Check region configuration and service zones
5. **Payment Fails**: Ensure payment provider is configured in Medusa

### Debug Commands

```javascript
// Check cart in console
localStorage.getItem('medusa_cart_id')

// Test Medusa connection
fetch(`${import.meta.env.VITE_MEDUSA_URL}/store/products`)
  .then(r => r.json())
  .then(console.log)

// View cart details
const cartId = localStorage.getItem('medusa_cart_id')
fetch(`${import.meta.env.VITE_MEDUSA_URL}/store/carts/${cartId}`)
  .then(r => r.json())
  .then(console.log)
```

## Resources

- [Medusa Docs - Storefront Development](https://docs.medusajs.com/resources/storefront-development)
- [Medusa Store API Reference](https://docs.medusajs.com/api/store)
- [Medusa JS SDK](https://docs.medusajs.com/resources/references/js-sdk)
- [Express Checkout Tutorial](https://docs.medusajs.com/resources/storefront-development/guides/express-checkout)

---

*Last Updated: 2025-09-07*
*Generated for DJ Judas App - Medusa Integration*