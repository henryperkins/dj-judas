import { useEffect, useState } from 'react'
import { navigate } from '../utils/nav'

type Price = { amount: number; currency_code: string }
type Variant = { id: string; title?: string; sku?: string; inventory_quantity?: number; prices?: Price[] }
type Product = { id: string; title: string; handle?: string; description?: string; status?: 'draft'|'published'; thumbnail?: string | null; images?: string[]; variants?: Variant[] }

interface AdminSessionResponse {
  authenticated?: boolean;
}

interface ProductResponse {
  product: Product;
}

interface DirectUploadResponse {
  result?: {
    uploadURL: string;
    id?: string;
    variants?: string[];
  };
}

export default function AdminEditProduct(props: { id: string }) {
  const { id } = props
  const [auth, setAuth] = useState<boolean | null>(null)
  const [p, setP] = useState<Product | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [newImages, setNewImages] = useState<Array<{ id?: string; url: string }>>([])
  const [uploads, setUploads] = useState<Array<{ name: string; progress: number; status: 'uploading'|'done'|'error' }>>([])
  const [imageUrl, setImageUrl] = useState('')
  const [imagePath, setImagePath] = useState('products')

  useEffect(() => {
    fetch('/api/admin/session').then(r => r.json() as Promise<AdminSessionResponse>).then(j => setAuth(!!j?.authenticated))
  }, [])

  useEffect(() => {
    if (auth) fetch(`/api/admin/products/${id}`).then(r => r.json() as Promise<ProductResponse>).then(j => setP(j?.product || j || null))
  }, [auth, id])

  const save = async () => {
    if (!p) return
    setBusy(true)
    const res = await fetch(`/api/admin/products/${p.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      title: p.title,
      handle: p.handle,
      description: p.description,
      status: p.status,
      thumbnail: p.thumbnail || p.images?.[0] || undefined,
      images: p.images || undefined,
    })})
    setBusy(false)
    setMsg(res.ok ? 'Saved' : 'Save failed')
  }

  const uploadPhoto = async (file: File) => {
    try {
      const tok = await fetch('/api/images/direct-upload', { method: 'POST' }).then(r => r.json()) as DirectUploadResponse;
      const url = tok?.result?.uploadURL
      if (!url) throw new Error('No upload URL')
      setUploads(prev => [...prev, { name: file.name, progress: 0, status: 'uploading' }])
      const fd = new FormData(); fd.append('file', file)
      interface UploadResult {
        result?: {
          id?: string;
          variants?: string[];
        };
      }
      const up: UploadResult = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) setUploads(prev => prev.map(u => u.name === file.name ? { ...u, progress: Math.round((e.loaded/e.total)*100) } : u)) }
        xhr.onload = () => { try { resolve(JSON.parse(xhr.responseText)) } catch { resolve({}) } }
        xhr.onerror = () => reject(new Error('upload_failed'))
        xhr.send(fd)
      })
      const id = up?.result?.id as string | undefined
      const variants = up?.result?.variants as string[] | undefined
      const urlOut = variants?.[0]
      if (urlOut) { setNewImages(prev => [...prev, { id, url: urlOut }]); setUploads(prev => prev.map(u => u.name === file.name ? { ...u, progress: 100, status: 'done' } : u)) }
    } catch {
      alert('Upload failed')
    }
  }

  const attachImageFromUrl = async () => {
    if (!p) return
    const url = imageUrl.trim()
    if (!url) { alert('Enter an image URL'); return }
    setBusy(true)
    setMsg(null)
    try {
      const res = await fetch(`/api/admin/products/${p.id}/images/upload`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url, path: imagePath || 'products' })
      })
      const j = await res.json()
      if (!res.ok) throw new Error(j?.error || 'upload_failed')
      // Refresh product so images reflect server state
      const refreshed = await fetch(`/api/admin/products/${p.id}`).then(r => r.json() as Promise<ProductResponse>)
      setP(refreshed?.product || (refreshed as unknown as Product) || p)
      setMsg('Image added via R2')
      setImageUrl('')
    } catch (e) {
      alert(`Failed to add image: ${(e as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  const addVariant = () => {
    if (!p) return
    const title = window.prompt('New variant title?', 'New Variant') || 'New Variant'
    const price = window.prompt('Price (USD)', '19.99') || '0'
    const cents = Math.round(parseFloat(price) * 100) || 0
    setBusy(true)
    fetch(`/api/admin/products/${p.id}/variants`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title, prices: [{ amount: cents, currency_code: 'usd' }] }) })
      .then(() => fetch(`/api/admin/products/${id}`).then(r => r.json() as Promise<ProductResponse>).then(j => setP(j?.product || j || null)))
      .finally(() => setBusy(false))
  }

  const updateVariant = async (v: Variant) => {
    const price = v.prices?.[0]
    const amount = price?.amount || 0
    await fetch(`/api/admin/variants/${v.id}`, { method: 'PATCH', headers: { 'content-type': 'application/json' }, body: JSON.stringify({
      title: v.title,
      sku: v.sku,
      inventory_quantity: v.inventory_quantity,
      prices: price ? [{ currency_code: price.currency_code || 'usd', amount }] : undefined
    })})
  }

  const removeVariant = async (variantId: string) => {
    if (!confirm('Delete this variant?')) return
    setBusy(true)
    await fetch(`/api/admin/variants/${variantId}`, { method: 'DELETE' })
    await fetch(`/api/admin/products/${id}`).then(r => r.json() as Promise<ProductResponse>).then(j => setP(j?.product || j || null))
    setBusy(false)
  }

  if (auth === null) return <div className="container section-py"><div className="text-muted">Checking session…</div></div>
  if (!auth) { navigate('/admin/login'); return null }
  if (!p) return <div className="container section-py"><div className="text-muted">Loading product…</div></div>

  return (
    <div className="container section-py admin-compact" style={{ maxWidth: 900 }}>
      <button className="btn btn-ghost mb-3" onClick={() => navigate('/admin/products')}>← Products</button>
      <h1 className="section-title">Edit: {p.title}</h1>

      <div className="form-grid-2" style={{ gap: 12 }}>
        <div className="form-field">
          <label className="form-label">Title</label>
          <input className="form-input form-input-sm" value={p.title} onChange={e => setP({ ...p, title: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="form-label">Handle</label>
          <input className="form-input form-input-sm" value={p.handle || ''} onChange={e => setP({ ...p, handle: e.target.value })} />
        </div>
        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Description</label>
          <textarea className="form-input form-textarea-sm" rows={4} value={p.description || ''} onChange={e => setP({ ...p, description: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="form-label">Thumbnail URL</label>
          <input className="form-input form-input-sm" value={p.thumbnail || ''} onChange={e => setP({ ...p, thumbnail: e.target.value })} />
        </div>
        <div className="form-field">
          <label className="form-label">Status</label>
          <select className="form-input form-input-sm" value={p.status || 'draft'} onChange={e => setP({ ...p, status: e.target.value as 'draft' | 'published' })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>
      </div>
      <button className={`btn btn-primary btn-sm mt-3 ${busy ? 'btn-loading' : ''}`} onClick={save} disabled={busy}>{!busy && 'Save'}</button>
      {msg && <div className="alert mt-2">{msg}</div>}

      <section className="checkout-section" style={{ marginTop: 16 }}>
        <div className="flex justify-between items-center mb-2">
          <h2 className="checkout-section__title">Variants</h2>
          <button className="btn btn-sm" onClick={addVariant} disabled={busy}>Add Variant</button>
        </div>
        {!p.variants?.length ? <div className="text-muted">No variants</div> : (
          <div className="stack">
            {p.variants!.map(v => (
              <div className="card" key={v.id} style={{ padding: 12 }}>
                <div className="form-grid-4" style={{ gap: 8 }}>
                  <div className="form-field">
                    <label className="form-label">Title</label>
                    <input className="form-input form-input-sm" value={v.title || ''} onChange={e => setP(cur => !cur ? cur : { ...cur, variants: cur.variants?.map(x => x.id===v.id? { ...x, title: e.target.value }: x) })} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">SKU</label>
                    <input className="form-input form-input-sm" value={v.sku || ''} onChange={e => setP(cur => !cur ? cur : { ...cur, variants: cur.variants?.map(x => x.id===v.id? { ...x, sku: e.target.value }: x) })} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Inventory</label>
                    <input className="form-input form-input-sm" inputMode="numeric" value={String(v.inventory_quantity ?? '')} onChange={e => setP(cur => !cur ? cur : { ...cur, variants: cur.variants?.map(x => x.id===v.id? { ...x, inventory_quantity: parseInt(e.target.value||'0', 10) }: x) })} />
                  </div>
                  <div className="form-field">
                    <label className="form-label">Price (USD cents)</label>
                    <input className="form-input form-input-sm" inputMode="numeric" value={String(v.prices?.[0]?.amount ?? 0)} onChange={e => setP(cur => !cur ? cur : { ...cur, variants: cur.variants?.map(x => x.id===v.id? { ...x, prices: [{ currency_code: 'usd', amount: parseInt(e.target.value||'0', 10) }] }: x) })} />
                  </div>
                </div>
                <div className="flex gap-2 mt-2">
                  <button className="btn btn-primary btn-sm" onClick={() => updateVariant(v)}>Update</button>
                  <button className="btn btn-outline btn-sm" onClick={() => removeVariant(v.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="checkout-section" style={{ marginTop: 16 }}>
        <h2 className="checkout-section__title">Images</h2>
        <div className="card" style={{ padding: 12, marginBottom: 12 }}>
          <div className="text-sm text-muted" style={{ marginBottom: 6 }}>Add image from URL (stored on R2, then attached to this product)</div>
          <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
            <input className="form-input" style={{ minWidth: 280 }} placeholder="https://.../image.jpg" value={imageUrl} onChange={e => setImageUrl(e.target.value)} />
            <input className="form-input" style={{ width: 160 }} placeholder="path (optional)" value={imagePath} onChange={e => setImagePath(e.target.value)} />
            <button className="btn btn-primary" disabled={busy} onClick={attachImageFromUrl}>Add from URL</button>
          </div>
        </div>
        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files?.[0]; if (f) uploadPhoto(f) }}
            style={{ padding: 12, border: '1px dashed var(--border-color, #ccc)', borderRadius: 8, marginBottom: 8 }}
          >
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" multiple onChange={e => { const files = Array.from(e.target.files || []); files.forEach(f => uploadPhoto(f)) }} />
              <span className="text-muted">Drag & drop or click to upload</span>
            </div>
          </div>
        </div>
        <div className="text-muted" style={{ marginBottom: 6 }}>Current images (click Set thumbnail to pick):</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
          {(p.images || []).map((url, idx) => (
            <div key={idx} className="card" style={{ padding: 8 }}>
              <img src={url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
              <div className="flex gap-2 mt-2">
                <button className="btn btn-outline btn-sm" onClick={() => setP(cur => cur ? { ...cur, thumbnail: url } : cur)}>Set thumbnail</button>
                <button className="btn btn-outline btn-sm" disabled={idx===0} onClick={() => setP(cur => {
                  if (!cur) return cur; const imgs = [...(cur.images || [])]; const t = imgs[idx]; imgs[idx] = imgs[idx-1]; imgs[idx-1] = t; return { ...cur, images: imgs }
                })}>Up</button>
                <button className="btn btn-outline btn-sm" disabled={idx===(p.images?.length||1)-1} onClick={() => setP(cur => {
                  if (!cur) return cur; const imgs = [...(cur.images || [])]; const t = imgs[idx]; imgs[idx] = imgs[idx+1]; imgs[idx+1] = t; return { ...cur, images: imgs }
                })}>Down</button>
                <button className="btn btn-outline btn-sm" onClick={() => setP(cur => cur ? { ...cur, images: (cur.images || []).filter((_, i) => i !== idx) } : cur)}>Remove</button>
              </div>
            </div>
          ))}
        </div>
        {newImages.length > 0 && (
          <>
            <div className="text-muted" style={{ margin: '8px 0 6px' }}>New uploads (click “Save” to add to product):</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {newImages.map((img, idx) => (
                <div key={idx} className="card" style={{ padding: 8 }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
                  <div className="flex gap-2 mt-2">
                    <button className="btn btn-outline btn-sm" onClick={() => setP(cur => cur ? { ...cur, images: [...(cur.images || []), img.url] } : cur)}>Add</button>
                    <button className="btn btn-outline btn-sm" onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2 mt-2">
              <button className="btn btn-outline" onClick={async () => {
                for (const img of newImages) { if (img.id) { try { await fetch(`/api/images/${img.id}`, { method: 'DELETE' }) } catch { /* ignore */ } } }
                setNewImages([])
              }}>Delete all unused</button>
            </div>
          </>
        )}
        {uploads.some(u => u.status !== 'done') && (
          <div className="stack" style={{ marginTop: 8 }}>
            {uploads.map((u, i) => (
              <div key={i} className="text-sm">
                <div>{u.name} — {u.status === 'uploading' ? `${u.progress}%` : u.status}</div>
                <div style={{ background: '#eee', height: 6, borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ width: `${u.progress}%`, height: '100%', background: '#0ea5e9' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
