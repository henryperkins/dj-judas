# Medusa SDK Configuration Guide

This project now supports both direct API calls and the Medusa JS SDK for ecommerce operations.

## Environment Configuration

### Required Environment Variables

```bash
# Store API Configuration
VITE_MEDUSA_URL=https://your-medusa-backend.com
VITE_MEDUSA_PUBLISHABLE_KEY=pk_... # Get from Medusa Admin

# Admin API Configuration (Worker)
MEDUSA_URL=https://your-medusa-backend.com
```

## Usage Options

### Option 1: Direct API Calls (Current Implementation)

Located in `src/react-app/utils/cart.ts`

```typescript
import { ensureCart, addLineItem, getCart } from '@/utils/cart'

// Create cart and add item
const cartId = await ensureCart()
const success = await addLineItem('variant_123', 1)
const cart = await getCart()
```

**Pros:**
- Full control over requests
- Minimal dependencies
- Already implemented and tested

**Cons:**
- Manual error handling
- Manual auth header management
- More boilerplate code

### Option 2: Medusa JS SDK (New)

Located in `src/react-app/utils/cart-sdk.ts`

```typescript
import { ensureCart, addLineItem, getCart } from '@/utils/cart-sdk'

// Same API, but uses SDK internally
const cartId = await ensureCart()
const success = await addLineItem('variant_123', 1)
const cart = await getCart()
```

**Pros:**
- Automatic error handling with FetchError
- Built-in TypeScript types
- Simplified auth management
- Support for SSE streaming
- Consistent API patterns

**Cons:**
- Additional dependency
- Slight bundle size increase

## SDK Features

### 1. Error Handling

```typescript
import { sdk } from '@/lib/medusa-sdk'

try {
  const result = await sdk.store.product.list()
} catch (error) {
  if (error.statusText === 'Unauthorized') {
    // Redirect to login
  } else {
    console.error(`Error ${error.status}: ${error.message}`)
  }
}
```

### 2. Custom Headers

```typescript
// Global headers (all requests)
const sdk = new Medusa({
  baseUrl: MEDUSA_URL,
  globalHeaders: {
    'x-custom-header': 'value'
  }
})

// Per-request headers
await sdk.store.product.list({}, {
  'x-no-compression': '1'
})
```

### 3. Authentication Methods

```typescript
// Session-based (cookies)
const sdk = new Medusa({
  baseUrl: MEDUSA_URL,
  auth: { type: 'session' }
})

// JWT-based
const sdk = new Medusa({
  baseUrl: MEDUSA_URL,
  auth: { 
    type: 'jwt',
    jwtTokenStorageMethod: 'local' // or 'session', 'memory'
  }
})

// API Key (admin)
const sdk = new Medusa({
  baseUrl: MEDUSA_URL,
  apiKey: 'your-api-key'
})
```

### 4. Custom Routes

```typescript
// Call custom backend routes
const data = await sdk.client.fetch('/custom/endpoint', {
  method: 'POST',
  body: { custom: 'data' }
})
```

### 5. Streaming (SSE)

```typescript
const { stream, abort } = await sdk.client.fetchStream('/stream/endpoint')

for await (const chunk of stream) {
  console.log('Received:', chunk)
}

// Stop streaming
abort()
```

## Migration Path

To migrate from direct API calls to SDK:

1. **Keep both implementations** during transition
2. **Test SDK version** in development
3. **Gradually migrate** components
4. **Remove old implementation** once stable

### Component Migration Example

```typescript
// Before (direct API)
import { addLineItem } from '@/utils/cart'

// After (SDK)
import { addLineItem } from '@/utils/cart-sdk'
// No other changes needed - same function signature
```

## Medusa Backend Configuration

Ensure your Medusa backend has proper CORS configuration:

```javascript
// medusa.config.ts
module.exports = {
  projectConfig: {
    storeCors: process.env.STORE_CORS || "http://localhost:5173",
    adminCors: process.env.ADMIN_CORS || "http://localhost:5173",
  }
}
```

## Type Safety

The SDK provides full TypeScript support:

```typescript
import type { 
  StoreCart, 
  StoreProduct, 
  StoreCartLineItem 
} from '@medusajs/types'

function processCart(cart: StoreCart) {
  cart.items.forEach((item: StoreCartLineItem) => {
    console.log(item.variant?.product?.title)
  })
}
```

## Troubleshooting

### CORS Issues
- Verify `storeCors` in Medusa backend config
- Check publishable key is set correctly
- Ensure VITE_MEDUSA_URL doesn't have trailing slash

### Authentication Errors
- Publishable key required for store endpoints
- Admin endpoints need JWT or API key
- Session cookies must be enabled for session auth

### SDK Not Working
- Check if `VITE_MEDUSA_URL` is set
- Verify Medusa backend is running
- Check browser console for errors
- Ensure SDK is initialized before use

## Next Steps

1. **For Production:**
   - Set production environment variables
   - Configure Medusa backend CORS for production domain
   - Consider implementing request caching
   - Add comprehensive error handling

2. **For Development:**
   - Use `debug: true` in SDK config for detailed logs
   - Test both implementations side-by-side
   - Monitor bundle size impact

3. **Advanced Features:**
   - Implement customer authentication
   - Add wishlist functionality
   - Set up payment provider integration
   - Configure tax and shipping providers