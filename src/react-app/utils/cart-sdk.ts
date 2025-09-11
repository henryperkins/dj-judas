import { sdk } from '../lib/medusa-sdk'
import type { HttpTypes } from '@medusajs/types'

/* ------------------------------------------------------------------
 * Fallback constants & headers for raw-fetch mode (when SDK is null)
 * ----------------------------------------------------------------- */
const MEDUSA_URL = import.meta.env.VITE_MEDUSA_URL as string | undefined
const PUB = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY as string | undefined

const headers: Record<string, string> = (() => {
  const h: Record<string, string> = { 'content-type': 'application/json' }
  if (PUB) h['x-publishable-api-key'] = PUB
  return h
})()

export function getCartId(): string | null {
  return localStorage.getItem('medusa_cart_id')
}

export async function ensureCart(): Promise<string | null> {
  /* ---------- SDK path ---------- */
  if (sdk) {
    const existing = getCartId()
    if (existing) return existing
    try {
      const result = await sdk.store.cart.create({})
      const cartId = result?.cart?.id
      if (cartId) {
        localStorage.setItem('medusa_cart_id', cartId)
        return cartId
      }
    } catch (error) {
      console.error('Failed to create cart via SDK:', error)
    }
  }

  /* ---------- Fetch fallback ---------- */
  if (!MEDUSA_URL) return null
  const existing = getCartId()
  if (existing) return existing

  try {
    const res = await fetch(`${MEDUSA_URL}/store/carts`, { method: 'POST', headers })
    if (!res.ok) return null
    const json = await res.json() as { cart?: { id?: string } }
    const id = json?.cart?.id || null
    if (id) localStorage.setItem('medusa_cart_id', id)
    return id
  } catch (error) {
    console.error('Failed to create cart via fetch:', error)
  }
  return null
}

export async function addLineItem(variantId: string, quantity = 1): Promise<boolean> {
  if (!variantId) return false

  try {
    const cartId = await ensureCart()
    if (!cartId) return false

    /* SDK path */
    if (sdk) {
      await sdk.store.cart.createLineItem(cartId, { variant_id: variantId, quantity })
      return true
    }

    /* Fetch fallback */
    if (!MEDUSA_URL) return false
    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ variant_id: variantId, quantity })
    })
    return res.ok
  } catch (error) {
    console.error('Failed to add line item:', error)
    return false
  }
}

export async function fetchProducts(limit = 12) {
  /* SDK path */
  if (sdk) {
    try {
      return await sdk.store.product.list({ limit })
    } catch (error) {
      console.error('Failed to fetch products via SDK:', error)
    }
  }

  /* Fetch fallback */
  if (!MEDUSA_URL) return { products: [] }
  try {
    const url = new URL(`${MEDUSA_URL}/store/products`)
    url.searchParams.set('limit', String(limit))
    url.searchParams.set('status', 'published')
    const res = await fetch(url.toString(), { headers: PUB ? { 'x-publishable-api-key': PUB } : undefined })
    return await res.json()
  } catch (error) {
    console.error('Failed to fetch products via fetch:', error)
    return { products: [] }
  }
}

export async function getCart(id?: string | null): Promise<HttpTypes.StoreCart | null> {
  const cartId = id || getCartId()
  if (!cartId) return null

  /* SDK path */
  if (sdk) {
    try {
      const result = await sdk.store.cart.retrieve(cartId)
      return result?.cart || null
    } catch (error) {
      console.error('Failed to get cart via SDK:', error)
    }
  }

  /* Fetch fallback */
  if (!MEDUSA_URL) return null
  try {
    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, { headers })
    if (!res.ok) return null
    const json = await res.json() as { cart?: HttpTypes.StoreCart }
    return json.cart ?? null
  } catch (error) {
    console.error('Failed to get cart via fetch:', error)
    return null
  }
}

export function formatAmount(amount?: number | null, currency?: string | null) {
  if (amount == null) return ''
  const cur = (currency || 'usd').toUpperCase()
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: cur
    }).format(amount / 100)
  } catch {
    return `${(amount / 100).toFixed(2)} ${cur}`
  }
}

export async function updateLineItem(lineId: string, quantity: number): Promise<boolean> {
  const cartId = getCartId()
  if (!cartId) return false

  /* SDK path */
  if (sdk) {
    try {
      await sdk.store.cart.updateLineItem(cartId, lineId, { quantity })
      return true
    } catch (error) {
      console.error('Failed to update line item via SDK:', error)
      return false
    }
  }

  /* Fetch fallback */
  if (!MEDUSA_URL) return false
  try {
    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineId}`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ quantity })
    })
    return res.ok
  } catch (error) {
    console.error('Failed to update line item via fetch:', error)
    return false
  }
}

export async function removeLineItem(lineId: string): Promise<boolean> {
  const cartId = getCartId()
  if (!cartId) return false

  /* SDK path */
  if (sdk) {
    try {
      await sdk.store.cart.deleteLineItem(cartId, lineId)
      return true
    } catch (error) {
      console.error('Failed to remove line item via SDK:', error)
      return false
    }
  }

  /* Fetch fallback */
  if (!MEDUSA_URL) return false
  try {
    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineId}`, {
      method: 'DELETE',
      headers
    })
    return res.ok
  } catch (error) {
    console.error('Failed to remove line item via fetch:', error)
    return false
  }
}

export async function listShippingOptions(cartId: string) {
  /* SDK path */
  if (sdk) {
    try {
      const result = await sdk.store.fulfillment.listCartOptions({ cart_id: cartId })
      return result?.shipping_options || []
    } catch (error) {
      console.error('Failed to list shipping options via SDK:', error)
    }
  }

  /* Fetch fallback */
  if (!MEDUSA_URL) return []
  try {
    // Try new-style endpoint first
    let res = await fetch(`${MEDUSA_URL}/store/shipping-options/${cartId}`, { headers })
    if (!res.ok) {
      const u = new URL(`${MEDUSA_URL}/store/shipping-options`)
      u.searchParams.set('cart_id', cartId)
      res = await fetch(u.toString(), { headers })
    }
    if (!res.ok) return []
    const json = await res.json() as { shipping_options?: any[] } | any[]
    return (json as any).shipping_options || (json as any[]) || []
  } catch (error) {
    console.error('Failed to list shipping options via fetch:', error)
    return []
  }
}

export async function createPaymentSessions(cartId: string): Promise<boolean> {
  /* SDK path */
  if (sdk) {
    try {
      const cart = await getCart(cartId)
      if (!cart) return false
      await sdk.store.payment.initiatePaymentSession(cart, { provider_id: 'stripe' })
      return true
    } catch (error) {
      console.error('Failed to create payment sessions via SDK:', error)
      return false
    }
  }

  /* Fetch fallback */
  if (!MEDUSA_URL) return false
  try {
    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/payment-sessions`, {
      method: 'POST',
      headers
    })
    return res.ok
  } catch (error) {
    console.error('Failed to create payment sessions via fetch:', error)
    return false
  }
}

export async function updateCart(cartId: string, data: Partial<HttpTypes.StoreUpdateCart>) {
  if (!sdk) return null
  
  try {
    const result = await sdk.store.cart.update(cartId, data)
    return result?.cart || null
  } catch (error) {
    console.error('Failed to update cart:', error)
    return null
  }
}

export type Cart = HttpTypes.StoreCart
export type CartItem = HttpTypes.StoreCartLineItem
export type Product = HttpTypes.StoreProduct
export type CartTotals = Pick<HttpTypes.StoreCart, 'subtotal' | 'shipping_total' | 'discount_total' | 'tax_total' | 'total'>
export type ShippingOption = HttpTypes.StoreCartShippingOption
