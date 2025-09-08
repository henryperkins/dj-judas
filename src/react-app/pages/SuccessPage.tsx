import { useEffect, useState } from 'react'
import { navigate } from '../utils/nav'

type SessionInfo = {
  id: string
  payment_status?: string
  amount_total?: number | null
  currency?: string | null
  client_reference_id?: string | null
}

export default function SuccessPage() {
  const [info, setInfo] = useState<SessionInfo | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [orderId, setOrderId] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    const oid = params.get('order_id')
    if (oid) setOrderId(oid)
    if (!sessionId) return
    fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.ok ? r.json() as Promise<SessionInfo> : r.json().catch(() => ({})).then((j: { error?: string }) => Promise.reject(j.error || 'Failed to load session')))
      .then(data => setInfo(data))
      .catch((e) => setError(typeof e === 'string' ? e : 'Failed to load session'))
  }, [])

  const formatAmount = (amt?: number | null, cur?: string | null) => {
    if (amt == null || !cur) return ''
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur.toUpperCase() }).format(amt / 100) } catch { return `${amt/100} ${cur}` }
  }

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

      {error && (
        <div className="alert alert--error" role="alert">
          <p>{error}</p>
        </div>
      )}

      {(info || orderId) && (
        <div className="cart-summary mt-3">
          {info && (
            <div className="cart-summary__row">
              <span>Status</span>
              <span className="font-semibold">{info.payment_status || 'Paid'}</span>
            </div>
          )}
          {info?.client_reference_id && (
            <div className="cart-summary__row">
              <span>Reference</span>
              <span className="font-mono text-sm">{info?.client_reference_id}</span>
            </div>
          )}
          {orderId && (
            <div className="cart-summary__row">
              <span>Order ID</span>
              <span className="font-mono text-sm">{orderId}</span>
            </div>
          )}
          <div className="cart-summary__row cart-summary__row--total">
            <span>Total</span>
            <span>{info ? formatAmount(info?.amount_total, info?.currency) : ''}</span>
          </div>
        </div>
      )}

      <div className="cluster gap-2 mt-4">
        <button className="btn btn-ghost" onClick={() => navigate('/')}>Back to home</button>
        <button className="btn btn-primary" onClick={() => navigate('/checkout')}>Shop more</button>
      </div>
    </div>
  )
}
