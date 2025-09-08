import { useEffect, useState } from 'react'
import { navigate } from '../utils/nav'

interface AdminSessionResponse {
  authenticated?: boolean;
}

interface AdminLoginResponse {
  error?: string;
}

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If already authenticated, redirect to admin home
    fetch('/api/admin/session').then(r => r.json()).then((j: AdminSessionResponse) => {
      if (j?.authenticated) navigate('/admin')
    })
  }, [])

  const doLogin = async () => {
    setBusy(true)
    setError(null)
    const res = await fetch('/api/admin/login', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ email, password }) })
    setBusy(false)
    if (res.ok) {
      navigate('/admin')
    } else {
      const j = await res.json().catch(() => null) as AdminLoginResponse;
      setError(j?.error || 'Login failed')
    }
  }

  return (
    <div className="container section-py admin-compact" style={{ maxWidth: 560 }}>
      <button className="btn btn-ghost mb-3" onClick={() => navigate('/')}>← Back</button>
      <h1 className="section-title">Admin Login</h1>
      <div className="form-field">
        <label className="form-label" htmlFor="email">Email</label>
        <input id="email" className="form-input form-input-sm" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@example.com" />
      </div>
      <div className="form-field">
        <label className="form-label" htmlFor="password">Password</label>
        <input id="password" className="form-input form-input-sm" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
      </div>
      {error && <div className="alert alert-error mb-2">{error}</div>}
      <button className={`btn btn-primary btn-sm ${busy ? 'btn-loading' : ''}`} onClick={doLogin} disabled={busy || !email || !password}>
        {!busy && 'Sign In'}
      </button>
    </div>
  )
}
