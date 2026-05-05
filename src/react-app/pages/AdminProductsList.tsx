import { useEffect, useState } from 'react'
import { navigate } from '../utils/nav'
import { Button } from '@/components/ui/button'

type Product = { id: string; title: string; status?: string; thumbnail?: string | null; handle?: string }

interface AdminSessionResponse {
  authenticated?: boolean;
}

interface ProductsResponse {
  products: Product[];
}

export default function AdminProductsList() {
  const [auth, setAuth] = useState<boolean | null>(null)
  const [items, setItems] = useState<Product[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(false)

  const load = async (query?: string) => {
    setLoading(true)
    const u = new URL('/api/admin/products', window.location.origin)
    u.searchParams.set('limit', '50')
    if (query && query.trim()) u.searchParams.set('q', query.trim())
    const res = await fetch(u.toString())
    setLoading(false)
    if (!res.ok) return
    const j = await res.json() as ProductsResponse;
    setItems(j?.products || [])
  }

  useEffect(() => {
    fetch('/api/admin/session').then(r => r.json() as Promise<AdminSessionResponse>).then(j => {
      const ok = !!j?.authenticated
      setAuth(ok)
      if (ok) load()
    })
  }, [])

  if (auth === null) return <div className="container section-py"><div className="text-muted-foreground">Checking session…</div></div>
  if (!auth) { navigate('/admin/login'); return null }

  return (
    <div className="container section-py admin-compact">
      <Button variant="ghost" className="mb-3" onClick={() => navigate('/admin')}>← Admin</Button>
      <div className="flex justify-between items-center mb-3">
        <h1 className="section-title">Products</h1>
        <Button size="sm" onClick={() => navigate('/admin/products/new')}>New</Button>
      </div>
      <div className="flex gap-2 mb-3">
        <input className="form-input form-input-sm" style={{ flex: 1 }} placeholder="Search title or handle" value={q} onChange={e => setQ(e.target.value)} />
        <Button variant="outline" size="sm" onClick={() => load(q)} disabled={loading}>{loading ? 'Searching…' : 'Search'}</Button>
      </div>
      <div className="product-grid">
        {items.map(p => (
          <div key={p.id} className="product-card">
            {p.thumbnail && <img src={p.thumbnail} alt={p.title} className="product-card__image" />}
            <div className="product-card__content">
              <h3 className="product-card__title">{p.title}</h3>
              <div className="text-muted-foreground text-sm mb-2">{p.handle || p.id}</div>
              <div className="flex gap-2">
                <Button size="sm" onClick={() => navigate(`/admin/products/${p.id}`)}>Edit</Button>
                <span className="badge">{p.status}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
