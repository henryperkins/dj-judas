
const headers: Record<string, string> = (() => {
  const h: Record<string, string> = { 'content-type': 'application/json' }
  if (PUB) h['x-publishable-api-key'] = PUB
  return h
})()

export function getCartId(): string | null {
  return localStorage.getItem('medusa_cart_id')
}

export async function ensureCart(): Promise<string | null> {
  if (!MEDUSA_URL) return null
  const existing = getCartId()
  if (existing) return existing
  const res = await fetch(`${MEDUSA_URL}/store/carts`, { method: 'POST', headers })
  const json = await res.json() as { cart?: { id?: string } };
  const id = json?.cart?.id || null
  if (id) localStorage.setItem('medusa_cart_id', id)
  return id
}

export async function addLineItem(variantId: string, quantity = 1): Promise<boolean> {
  if (!MEDUSA_URL || !variantId) return false
  const id = (await ensureCart())
  if (!id) return false
  const res = await fetch(`${MEDUSA_URL}/store/carts/${id}/line-items`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ variant_id: variantId, quantity })
  })
  return res.ok
}

interface Product {
  id: string;
  title: string;
  description?: string;
  thumbnail?: string;
  variants?: Array<{ id: string; title?: string; prices?: Array<{ amount: number; currency_code: string }> }>;
}

export async function fetchProducts(limit = 12) {
  if (!MEDUSA_URL) return { products: [] as Product[] }
  const url = new URL(`${MEDUSA_URL}/store/products`)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('status', 'published')
  const res = await fetch(url.toString(), { headers: PUB ? { 'x-publishable-api-key': PUB } : undefined })
  return res.json() as Promise<{ products: Product[] }>
}

export type CartItem = {
  id: string
  title?: string
  thumbnail?: string | null
  quantity: number
  unit_price: number
  variant?: { title?: string | null }
}

export type CartTotals = {
  subtotal?: number | null
  shipping_total?: number | null
  discount_total?: number | null
  tax_total?: number | null
  total?: number | null
}

export type Cart = {
  id: string
  items: CartItem[]
  region?: { currency_code?: string | null } | null
  shipping_methods?: Array<{ shipping_option_id?: string | null; shipping_option?: { id: string } | null }>
} & CartTotals

export async function getCart(id?: string | null): Promise<Cart | null> {
  if (!MEDUSA_URL) return null
  const cartId = id || getCartId()
  if (!cartId) return null
  const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, { headers })
  if (!res.ok) return null
  const json = await res.json() as { cart?: Cart };
  return json?.cart ?? null
}

export function formatAmount(amount?: number | null, currency?: string | null) {
  if (amount == null) return ''
  const cur = (currency || 'usd').toUpperCase()
  try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur }).format(amount / 100) } catch { return `${(amount/100).toFixed(2)} ${cur}` }
}

// --- New helpers for full checkout flow ---
export async function updateLineItem(lineId: string, quantity: number): Promise<boolean> {
  if (!MEDUSA_URL) return false
  const cartId = getCartId()
  if (!cartId) return false
  const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineId}`, {
    method: 'POST', headers, body: JSON.stringify({ quantity })
  })
  return res.ok
}

export async function removeLineItem(lineId: string): Promise<boolean> {
  if (!MEDUSA_URL) return false
  const cartId = getCartId()
  if (!cartId) return false
  const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/line-items/${lineId}`, {
    method: 'DELETE', headers
  })
  return res.ok
}

export type ShippingOption = { id: string; name: string; amount?: number | null; price_type?: 'fixed' | 'calculated' }

export async function listShippingOptions(cartId: string): Promise<ShippingOption[]> {
  if (!MEDUSA_URL) return []
  // Try new-style endpoint first
  let res = await fetch(`${MEDUSA_URL}/store/shipping-options/${cartId}`, { headers })
  if (!res.ok) {
    const u = new URL(`${MEDUSA_URL}/store/shipping-options`)
    u.searchParams.set('cart_id', cartId)
    res = await fetch(u.toString(), { headers })
  }
  if (!res.ok) return []
  const json = await res.json() as { shipping_options?: ShippingOption[] } | ShippingOption[];
  return (json as { shipping_options?: ShippingOption[] })?.shipping_options || (json as ShippingOption[]) || []
}

export async function createPaymentSessions(cartId: string): Promise<boolean> {
  if (!MEDUSA_URL) return false
  const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/payment-sessions`, {
    method: 'POST', headers
  })
  return res.ok
}
