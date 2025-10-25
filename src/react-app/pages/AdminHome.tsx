import { useEffect, useState } from 'react'
import { navigate } from '../utils/nav'

interface AdminSessionResponse {
  authenticated?: boolean;
}

export default function AdminHome() {
  const [auth, setAuth] = useState<boolean | null>(null)
  const [slug, setSlug] = useState('reunion-12-chicago-2026')
  const [flyerUrl, setFlyerUrl] = useState('')
  const [importJson, setImportJson] = useState('')
  const [importBusy, setImportBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/session').then(r => r.json() as Promise<AdminSessionResponse>).then(j => setAuth(!!j?.authenticated))
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

      <section className="checkout-section" style={{ marginTop: 20 }}>
        <h2 className="checkout-section__title">Events</h2>
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <div className="text-sm text-muted" style={{ marginBottom: 6 }}>Update flyer for an event (uploads to R2 and updates D1)</div>
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <input className="form-input" style={{ width: 200 }} placeholder="slug" value={slug} onChange={e => setSlug(e.target.value)} />
            <input className="form-input" style={{ minWidth: 320 }} placeholder="https://.../flyer.jpg" value={flyerUrl} onChange={e => setFlyerUrl(e.target.value)} />
            <button className="btn btn-primary" onClick={async () => {
              setMsg(null)
              if (!flyerUrl.trim()) { alert('Enter flyer URL'); return }
              const res = await fetch(`/api/admin/events/${encodeURIComponent(slug)}/flyer/upload`, {
                method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ url: flyerUrl.trim() })
              })
              const j = await res.json() as { error?: string }
              if (res.ok) { setMsg('Flyer updated'); setFlyerUrl('') } else { alert(j?.error || 'Update failed') }
            }}>Upload Flyer</button>
          </div>
        </div>

        <div className="card" style={{ padding: 12 }}>
          <div className="text-sm text-muted" style={{ marginBottom: 6 }}>Import events (paste JSON array). Optional: upload flyers to R2 and replace existing.</div>
          <textarea className="form-input" style={{ width: '100%', minHeight: 120, marginBottom: 8 }} placeholder='[ { "id": "...", "slug": "...", "title": "...", "startDateTime": "2026-..." } ]' value={importJson} onChange={e => setImportJson(e.target.value)} />
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <button className="btn btn-outline btn-sm" disabled={importBusy} onClick={async () => {
              setImportBusy(true); setMsg(null)
              try {
                const events = JSON.parse(importJson || '[]')
                const res = await fetch('/api/admin/events/import', {
                  method: 'POST', headers: { 'content-type': 'application/json' },
                  body: JSON.stringify({ events, replace: true, uploadFlyersToR2: true })
                })
                const j = await res.json() as { error?: string; imported?: number; uploadedToR2?: number }
                if (!res.ok) throw new Error(j?.error || 'import_failed')
                setMsg(`Imported ${j.imported} events; uploaded ${j.uploadedToR2 || 0}`)
                setImportJson('')
              } catch (e) {
                alert((e as Error).message)
              } finally {
                setImportBusy(false)
              }
            }}>Import & Upload Flyers</button>
            {msg && <span className="text-sm text-muted">{msg}</span>}
          </div>
        </div>
      </section>
    </div>
  )
}
