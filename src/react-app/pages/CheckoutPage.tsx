import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../utils/nav'
import {
  getCart,
  formatAmount,
  type Cart,
  type CartItem,
  type ShippingOption,
  updateLineItem,
  removeLineItem,
  listShippingOptions,
  createPaymentSessions,
} from '../utils/cart-sdk'

type Address = {
  email: string
  first_name: string
  last_name: string
  address_1: string
  city: string
  postal_code: string
  country_code: string
}

// Using ShippingOption from utils/cart

const MEDUSA_URL = import.meta.env.VITE_MEDUSA_URL as string | undefined
const MEDUSA_PUB = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY as string | undefined

export default function CheckoutPage() {
  const [cartId, setCartId] = useState<string | null>(null)
  const [cart, setCart] = useState<Cart | null>(null)
  const [addr, setAddr] = useState<Address>({
    email: '', first_name: '', last_name: '', address_1: '', city: '', postal_code: '', country_code: 'US'
  })
  const [options, setOptions] = useState<ShippingOption[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const headers: Record<string, string> = useMemo(() => {
    const base: Record<string, string> = { 'content-type': 'application/json' }
    if (MEDUSA_PUB) base['x-publishable-api-key'] = MEDUSA_PUB
    return base
  }, [])

  useEffect(() => {
    if (!MEDUSA_URL) return
    const saved = localStorage.getItem('medusa_cart_id')
    if (saved) { setCartId(saved); return }
    setBusy(true)
    fetch(`${MEDUSA_URL}/store/carts`, { method: 'POST', headers })
      .then(r => r.json())
      .then(d => {
        const id = d?.cart?.id
        if (id) { localStorage.setItem('medusa_cart_id', id); setCartId(id) }
      })
      .finally(() => setBusy(false))
  }, [headers])

  // load cart details when we have an id
  useEffect(() => {
    if (!MEDUSA_URL || !cartId) return
    getCart(cartId).then(setCart).catch(() => {}).finally(() => {})
  }, [cartId])

  // Mobile footer safe-area padding toggle
  useEffect(() => {
    const root = document.body
    const toggle = () => {
      if (window.innerWidth <= 768) root.classList.add('has-checkout-footer')
      else root.classList.remove('has-checkout-footer')
    }
    toggle()
    window.addEventListener('resize', toggle)
    return () => { window.removeEventListener('resize', toggle); root.classList.remove('has-checkout-footer') }
  }, [])

  const saveAddress = async () => {
    if (!MEDUSA_URL || !cartId) return
    setBusy(true)
    await fetch(`${MEDUSA_URL}/store/carts/${cartId}`, {
      method: 'POST', headers, body: JSON.stringify({
        email: addr.email,
        shipping_address: {
          first_name: addr.first_name, last_name: addr.last_name,
          address_1: addr.address_1, city: addr.city, postal_code: addr.postal_code, country_code: addr.country_code
        }
      })
    })
    const updated = await getCart(cartId)
    setCart(updated)
    setBusy(false)
  }

  const loadOptions = async () => {
    if (!MEDUSA_URL || !cartId) return
    const list = await listShippingOptions(cartId)
    setOptions(list)
  }

  const addShippingMethod = async (option_id: string) => {
    if (!MEDUSA_URL || !cartId) return
    await fetch(`${MEDUSA_URL}/store/carts/${cartId}/shipping-methods`, {
      method: 'POST', headers, body: JSON.stringify({ option_id })
    })
    const updated = await getCart(cartId)
    setCart(updated)
  }

  const completeMedusa = async () => {
    if (!MEDUSA_URL || !cartId) return
    setBusy(true)
    // Ensure payment sessions exist (no-op if already created)
    try { await createPaymentSessions(cartId) } catch { /* ignore */ }
    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/complete`, { method: 'POST', headers })
    const json = await res.json()
    setBusy(false)
    if (json?.type === 'order') {
      const oid = json?.order?.id || json?.data?.id || json?.id
      try { localStorage.removeItem('medusa_cart_id') } catch { /* ignore */ }
      navigate(`/success${oid ? `?order_id=${encodeURIComponent(oid)}` : ''}`)
      return
    }
    else setMsg('Unable to complete order. Please check payment and address details.')
  }

  const payWithStripe = async () => {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST', headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ priceId: import.meta.env.VITE_STRIPE_PRICE_ID || 'price_xxx', quantity: 1, cartId })
    })
    const json = await res.json()
    if (json.url) window.location.href = json.url
  }

  return (
    <div className="checkout-container">
      <button className="btn btn-ghost mb-3" onClick={() => navigate('/')}>← Back</button>
      <h1 className="section-title">Checkout</h1>
      {!MEDUSA_URL && <p>Set VITE_MEDUSA_URL and VITE_MEDUSA_PUBLISHABLE_KEY to enable cart & shipping.</p>}

      <div className="checkout-grid">
        <div>
          <section className="checkout-section">
            <h2 className="checkout-section__title">Shipping Address</h2>
            <div className="form-grid-2">
              <div className="form-field">
                <label className="form-label form-label--required" htmlFor="email">Email</label>
                <input id="email" className="form-input" placeholder="you@example.com" type="email" autoComplete="email" inputMode="email" value={addr.email} onChange={e => setAddr({ ...addr, email: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="first_name">First name</label>
                <input id="first_name" className="form-input" autoComplete="given-name" value={addr.first_name} onChange={e => setAddr({ ...addr, first_name: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="last_name">Last name</label>
                <input id="last_name" className="form-input" autoComplete="family-name" value={addr.last_name} onChange={e => setAddr({ ...addr, last_name: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="address_1">Address</label>
                <input id="address_1" className="form-input" autoComplete="address-line1" value={addr.address_1} onChange={e => setAddr({ ...addr, address_1: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="city">City</label>
                <input id="city" className="form-input" autoComplete="address-level2" value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="postal_code">Postal code</label>
                <input id="postal_code" className="form-input" autoComplete="postal-code" inputMode="numeric" value={addr.postal_code} onChange={e => setAddr({ ...addr, postal_code: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="country_code">Country</label>
                <input id="country_code" className="form-input" autoComplete="country" value={addr.country_code} onChange={e => setAddr({ ...addr, country_code: e.target.value })} />
              </div>
            </div>
            <button
              className={`btn btn-primary w-full mt-3 ${busy ? 'btn-loading' : ''}`}
              onClick={saveAddress}
              disabled={busy || !cartId}
              aria-busy={busy}
            >
              {!busy && 'Save address'}
            </button>
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section__title">Shipping Options</h2>
            <div className="stack">
              <button className="btn btn-outline" onClick={loadOptions} disabled={!cartId}>Load options</button>
              {options?.length ? options.map((o: ShippingOption) => {
                interface ShippingMethod {
                  shipping_option_id?: string;
                  shipping_option?: { id: string };
                }
                const selected = !!cart?.shipping_methods?.some((m: ShippingMethod) => (m?.shipping_option_id || m?.shipping_option?.id) === o.id)
                const price = typeof o.amount === 'number' ? formatAmount(o.amount, cart?.region?.currency_code || 'usd') : (o.price_type === 'calculated' ? 'Calculated at checkout' : '—')
                return (
                  <button
                    className={`shipping-option ${selected ? 'shipping-option--selected' : ''}`}
                    key={o.id}
                    aria-pressed={selected}
                    onClick={() => addShippingMethod(o.id)}
                  >
                    <span className="shipping-option__name">{o.name}</span>
                    <span className="shipping-option__price">{price}</span>
                  </button>
                )
              }) : null}
            </div>
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section__title">Payment</h2>
            <div className="payment-methods">
              <button className="btn btn-primary" onClick={completeMedusa} disabled={!cartId}>Pay (Medusa provider)</button>
              <button className="btn btn-outline" onClick={payWithStripe}>Pay with Stripe</button>
            </div>
          </section>
        </div>

    <aside className="checkout-summary">
      <h2 className="checkout-section__title">Order Summary</h2>
      {/* Line items */}
      {cart?.items?.map((li: CartItem) => (
        <div key={li.id} className="cart-item">
          {li.thumbnail && <img className="cart-item__image" src={li.thumbnail} alt="" />}
          <div className="cart-item__details">
            <div className="cart-item__name">{li.title}</div>
            {li.variant?.title && <div className="cart-item__variant">{li.variant.title}</div>}
          </div>
          <div className="cart-item__actions">
            <div className="quantity-selector" aria-label={`Quantity for ${li.title || 'item'}`} role="group">
              <button
                className="quantity-selector__btn"
                onClick={async () => {
                  const q = li.quantity - 1
                  const ok = q > 0 ? await updateLineItem(li.id, q) : await removeLineItem(li.id)
                  if (ok) setCart(await getCart(cartId))
                }}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <div className="quantity-selector__value" aria-live="polite">{li.quantity}</div>
              <button
                className="quantity-selector__btn"
                onClick={async () => {
                  const ok = await updateLineItem(li.id, li.quantity + 1)
                  if (ok) setCart(await getCart(cartId))
                }}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <div className="ml-2">{formatAmount(li.unit_price * li.quantity, cart?.region?.currency_code || 'usd')}</div>
          </div>
        </div>
      ))}

      {/* Totals */}
      <div className="cart-summary__row">
        <span>Subtotal</span>
        <span>{formatAmount(cart?.subtotal ?? 0, cart?.region?.currency_code || 'usd')}</span>
      </div>
      <div className="cart-summary__row">
        <span>Shipping</span>
        <span>{formatAmount(cart?.shipping_total ?? 0, cart?.region?.currency_code || 'usd')}</span>
      </div>
      <div className="cart-summary__row">
        <span>Tax</span>
        <span>{formatAmount(cart?.tax_total ?? 0, cart?.region?.currency_code || 'usd')}</span>
      </div>
      <div className="cart-summary__row cart-summary__row--total">
        <span>Total</span>
        <span>{formatAmount(cart?.total ?? 0, cart?.region?.currency_code || 'usd')}</span>
      </div>
    </aside>
    </div>

    {msg && (
      <div className="container section-py">
        <div className="alert alert--error" role="alert">{msg}</div>
      </div>
    )}

    {/* Mobile sticky footer */}
    <div className="checkout-footer">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-muted" style={{ fontSize: '0.875rem' }}>Total</div>
          <div style={{ fontWeight: 700 }}>{formatAmount(cart?.total ?? 0, cart?.region?.currency_code || 'usd')}</div>
        </div>
        <button className={`btn btn-primary ${busy ? 'btn-loading' : ''}`} onClick={completeMedusa} disabled={!cartId || busy || !cart?.items?.length} aria-busy={busy}>{!busy ? (cart?.items?.length ? 'Pay Now' : 'Cart Empty') : ''}</button>
      </div>
    </div>
  </div>
  )
}
