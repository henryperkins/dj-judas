import { useEffect, useState } from 'react'
import { navigate } from '../utils/nav'

export default function AdminHome() {
  const [auth, setAuth] = useState<boolean | null>(null)

  useEffect(() => {
    fetch('/api/admin/session').then(r => r.json()).then(j => setAuth(!!j?.authenticated))
  }, [])

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    navigate('/admin/login')
  }

  if (auth === null) return <div className="container section-py"><div className="text-muted">Checking session…</div></div>
  if (!auth) {
    navigate('/admin/login')
    return null
  }

  return (
    <div className="container section-py admin-compact">
      <button className="btn btn-ghost mb-3" onClick={() => navigate('/')}>← Back</button>
      <div className="flex justify-between items-center mb-4">
        <h1 className="section-title">Admin</h1>
        <button className="btn btn-outline btn-sm" onClick={logout}>Sign out</button>
      </div>
      <div className="stack">
        <button className="btn btn-primary btn-sm" onClick={() => navigate('/admin/products/new')}>Add Product</button>
        <button className="btn btn-outline btn-sm" onClick={() => navigate('/admin/products')}>Manage Products</button>
      </div>
    </div>
  )
}
