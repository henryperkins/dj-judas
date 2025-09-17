import { useEffect, useState } from 'react'
import { navigate } from '../utils/nav'

export default function SuccessPage() {
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const oid = params.get('order_id')
    if (oid) setOrderId(oid)
  }, [])

  return (
    <div className="container section-py">
      <div className="alert alert--success">
        <svg className="alert__icon" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
        <div>
          <h1 className="text-2xl font-bold mb-1">Thank you for your order!</h1>
          <p className="text-muted">Your order was received and is being processed.</p>
        </div>
      </div>

      {(orderId) && (
        <div className="cart-summary mt-3">
          {orderId && (
            <div className="cart-summary__row">
              <span>Order ID</span>
              <span className="font-mono text-sm">{orderId}</span>
            </div>
          )}
        </div>
      )}

      <div className="cluster gap-2 mt-4">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>Back to home</button>
        <button className="btn btn-primary" onClick={() => navigate('/checkout')}>Shop more</button>
      </div>
    </div>
  )
}
