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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const sessionId = params.get('session_id')
    if (!sessionId) return
    fetch(`/api/stripe/session?session_id=${encodeURIComponent(sessionId)}`)
      .then(r => r.ok ? r.json() : r.json().catch(() => ({})).then(j => Promise.reject(j.error || 'Failed to load session')))
      .then(setInfo)
      .catch((e) => setError(typeof e === 'string' ? e : 'Failed to load session'))
  }, [])

  const formatAmount = (amt?: number | null, cur?: string | null) => {
    if (amt == null || !cur) return ''
    try { return new Intl.NumberFormat(undefined, { style: 'currency', currency: cur.toUpperCase() }).format(amt / 100) } catch { return `${amt/100} ${cur}` }
  }

  return (
    <div className="container" style={{ padding: '2rem var(--container-padding) 3rem' }}>
      <h1 className="section-title">Thank you!</h1>
      <p>Your order was received.</p>

      {error && <p className="error-message" role="alert">{error}</p>}
      {info && (
        <div className="card" style={{ padding: '1rem', marginTop: '1rem' }}>
          <p><strong>Status:</strong> {info.payment_status || 'paid'}</p>
          <p><strong>Total:</strong> {formatAmount(info.amount_total, info.currency)}</p>
          {info.client_reference_id && <p><strong>Cart:</strong> {info.client_reference_id}</p>}
        </div>
      )}

      <div className="cluster" style={{ marginTop: '1.5rem' }}>
        <button className="btn" onClick={() => navigate('/')}>Back to home</button>
        <button className="btn" onClick={() => navigate('/checkout')}>Shop more</button>
      </div>
    </div>
  )
}

