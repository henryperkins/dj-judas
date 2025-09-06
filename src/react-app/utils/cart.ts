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
  if (!MEDUSA_URL) return null
  const existing = getCartId()
  if (existing) return existing
  const res = await fetch(`${MEDUSA_URL}/store/carts`, { method: 'POST', headers })
  const json = await res.json()
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

export async function fetchProducts(limit = 12) {
  if (!MEDUSA_URL) return { products: [] as any[] }
  const url = new URL(`${MEDUSA_URL}/store/products`)
  url.searchParams.set('limit', String(limit))
  url.searchParams.set('status', 'published')
  const res = await fetch(url.toString(), { headers: PUB ? { 'x-publishable-api-key': PUB } : undefined })
  return res.json()
}

