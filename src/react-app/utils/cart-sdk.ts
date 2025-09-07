import { sdk } from '../lib/medusa-sdk'
import type { HttpTypes } from '@medusajs/types'

export function getCartId(): string | null {
  return localStorage.getItem('medusa_cart_id')
}

export async function ensureCart(): Promise<string | null> {
  if (!sdk) return null
  
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
    console.error('Failed to create cart:', error)
  }
  return null
}

export async function addLineItem(variantId: string, quantity = 1): Promise<boolean> {
  if (!sdk || !variantId) return false
  
  try {
    const cartId = await ensureCart()
    if (!cartId) return false
    
    await sdk.store.cart.createLineItem(cartId, {
      variant_id: variantId,
      quantity
    })
    return true
  } catch (error) {
    console.error('Failed to add line item:', error)
    return false
  }
}

export async function fetchProducts(limit = 12) {
  if (!sdk) return { products: [] }
  
  try {
    const result = await sdk.store.product.list({
      limit
    })
    return result
  } catch (error) {
    console.error('Failed to fetch products:', error)
    return { products: [] }
  }
}

export async function getCart(id?: string | null): Promise<HttpTypes.StoreCart | null> {
  if (!sdk) return null
  
  const cartId = id || getCartId()
  if (!cartId) return null
  
  try {
    const result = await sdk.store.cart.retrieve(cartId)
    return result?.cart || null
  } catch (error) {
    console.error('Failed to get cart:', error)
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
  if (!sdk) return false
  
  const cartId = getCartId()
  if (!cartId) return false
  
  try {
    await sdk.store.cart.updateLineItem(cartId, lineId, { quantity })
    return true
  } catch (error) {
    console.error('Failed to update line item:', error)
    return false
  }
}

export async function removeLineItem(lineId: string): Promise<boolean> {
  if (!sdk) return false
  
  const cartId = getCartId()
  if (!cartId) return false
  
  try {
    await sdk.store.cart.deleteLineItem(cartId, lineId)
    return true
  } catch (error) {
    console.error('Failed to remove line item:', error)
    return false
  }
}

export async function listShippingOptions(cartId: string) {
  if (!sdk) return []
  
  try {
    const result = await sdk.store.fulfillment.listCartOptions({ cart_id: cartId })
    return result?.shipping_options || []
  } catch (error) {
    console.error('Failed to list shipping options:', error)
    return []
  }
}

export async function createPaymentSessions(cartId: string): Promise<boolean> {
  if (!sdk) return false
  
  try {
    const cart = await getCart(cartId)
    if (!cart) return false
    
    await sdk.store.payment.initiatePaymentSession(cart, {
      provider_id: 'stripe'
    })
    return true
  } catch (error) {
    console.error('Failed to create payment sessions:', error)
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