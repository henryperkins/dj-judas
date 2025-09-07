import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../utils/nav'

type Address = {
  email: string
  first_name: string
  last_name: string
  address_1: string
  city: string
  postal_code: string
  country_code: string
}

type ShippingOption = { id: string; name: string; amount?: number }

const MEDUSA_URL = import.meta.env.VITE_MEDUSA_URL as string | undefined
const MEDUSA_PUB = import.meta.env.VITE_MEDUSA_PUBLISHABLE_KEY as string | undefined

export default function CheckoutPage() {
  const [cartId, setCartId] = useState<string | null>(null)
  const [addr, setAddr] = useState<Address>({
    email: '', first_name: '', last_name: '', address_1: '', city: '', postal_code: '', country_code: 'US'
  })
  const [options, setOptions] = useState<ShippingOption[] | null>(null)
  const [busy, setBusy] = useState(false)
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
    setBusy(false)
  }

  const loadOptions = async () => {
    if (!MEDUSA_URL || !cartId) return
    const res = await fetch(`${MEDUSA_URL}/store/shipping-options/${cartId}`, { headers })
    const json = await res.json()
    setOptions(json?.shipping_options || [])
  }

  const addShippingMethod = async (option_id: string) => {
    if (!MEDUSA_URL || !cartId) return
    await fetch(`${MEDUSA_URL}/store/carts/${cartId}/shipping-methods`, {
      method: 'POST', headers, body: JSON.stringify({ option_id })
    })
  }

  const completeMedusa = async () => {
    if (!MEDUSA_URL || !cartId) return
    setBusy(true)
    const res = await fetch(`${MEDUSA_URL}/store/carts/${cartId}/complete`, { method: 'POST', headers })
    const json = await res.json()
    setBusy(false)
    if (json?.type === 'order') navigate('/success')
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
                <label className="form-label" htmlFor="email">Email</label>
                <input id="email" className="form-input" placeholder="you@example.com" value={addr.email} onChange={e => setAddr({ ...addr, email: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="first_name">First name</label>
                <input id="first_name" className="form-input" value={addr.first_name} onChange={e => setAddr({ ...addr, first_name: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="last_name">Last name</label>
                <input id="last_name" className="form-input" value={addr.last_name} onChange={e => setAddr({ ...addr, last_name: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="address_1">Address</label>
                <input id="address_1" className="form-input" value={addr.address_1} onChange={e => setAddr({ ...addr, address_1: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="city">City</label>
                <input id="city" className="form-input" value={addr.city} onChange={e => setAddr({ ...addr, city: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="postal_code">Postal code</label>
                <input id="postal_code" className="form-input" value={addr.postal_code} onChange={e => setAddr({ ...addr, postal_code: e.target.value })} />
              </div>
              <div className="form-field">
                <label className="form-label" htmlFor="country_code">Country</label>
                <input id="country_code" className="form-input" value={addr.country_code} onChange={e => setAddr({ ...addr, country_code: e.target.value })} />
              </div>
            </div>
            <button className="btn btn-primary w-full" onClick={saveAddress} disabled={busy || !cartId}>Save address</button>
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section__title">Shipping Options</h2>
            <div className="stack">
              <button className="btn btn-outline" onClick={loadOptions} disabled={!cartId}>Load options</button>
              {options?.length ? options.map((o: ShippingOption) => (
                <button className="btn btn-outline" key={o.id} onClick={() => addShippingMethod(o.id)}>
                  {o.name}
                </button>
              )) : null}
            </div>
          </section>

          <section className="checkout-section">
            <h2 className="checkout-section__title">Payment</h2>
            <div className="cluster">
              <button className="btn btn-primary" onClick={completeMedusa} disabled={!cartId}>Pay (Medusa provider)</button>
              <button className="btn btn-primary" onClick={payWithStripe}>Pay with Stripe</button>
            </div>
          </section>
        </div>

        <aside className="checkout-summary">
          <h2 className="checkout-section__title">Order Summary</h2>
          <div className="cart-summary__row"><span>Subtotal</span><span>$0.00</span></div>
          <div className="cart-summary__row"><span>Shipping</span><span>$0.00</span></div>
          <div className="cart-summary__row cart-summary__row--total"><span>Total</span><span>$0.00</span></div>
        </aside>
      </div>
    </div>
  )
}
