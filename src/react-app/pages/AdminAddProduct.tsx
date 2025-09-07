import { useEffect, useMemo, useState } from 'react'
import { navigate } from '../utils/nav'
 

type PriceRow = { currency_code: string; amount: string }

export default function AdminAddProduct() {
  const [auth, setAuth] = useState<boolean | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [thumbnail, setThumbnail] = useState('')
  const [images, setImages] = useState<Array<{ id?: string; url: string }>>([])
  const [uploads, setUploads] = useState<Array<{ name: string; progress: number; status: 'uploading'|'done'|'error' }>>([])
  const [toDelete, setToDelete] = useState<string[]>([])
  // price rows handled per variant; keep local default inventory separate
  const [qty, setQty] = useState('')
  const [status, setStatus] = useState<'draft' | 'published'>('published')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [variants, setVariants] = useState<Array<{ title: string; sku?: string; prices: PriceRow[]; inventory_quantity?: string }>>([
    { title: 'Default', prices: [{ currency_code: 'usd', amount: '' }], inventory_quantity: '' }
  ])
  const [simplePrice, setSimplePrice] = useState('')

  const uploadPhoto = async (file: File) => {
    try {
      const tok = await fetch('/api/images/direct-upload', { method: 'POST' }).then(r => r.json())
      const url = tok?.result?.uploadURL
      if (!url) throw new Error('No upload URL')
      setUploads(prev => [...prev, { name: file.name, progress: 0, status: 'uploading' }])
      const fd = new FormData(); fd.append('file', file)
      const up: any = await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', url);
        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          setUploads(prev => prev.map(u => u.name === file.name ? { ...u, progress: Math.round((e.loaded/e.total)*100) } : u))
        }
        xhr.onload = () => {
          try { resolve(JSON.parse(xhr.responseText)) } catch { resolve({}) }
        }
        xhr.onerror = () => reject(new Error('upload_failed'))
        xhr.send(fd)
      })
      const id = up?.result?.id as string | undefined
      const variants = up?.result?.variants as string[] | undefined
      const chosen = (() => {
        const preferred = tok?.result?.variants?.find?.((v: string) => v.includes('/' + (import.meta.env.VITE_CF_IMAGES_VARIANT || 'public')))
        return preferred || variants?.find((v: string) => /\/public$/.test(v)) || variants?.[0]
      })()
      const urlOut = chosen || (variants?.[0] ?? '')
      if (urlOut) {
        setImages(prev => [...prev, { id, url: urlOut }])
        if (!thumbnail) setThumbnail(urlOut)
        setUploads(prev => prev.map(u => u.name === file.name ? { ...u, progress: 100, status: 'done' } : u))
      }
    } catch (e) {
      setUploads(prev => prev.map(u => u.name === file.name ? { ...u, status: 'error' } : u))
      alert('Upload failed. Ensure Cloudflare Images is configured.')
    }
  }

  const aiSuggest = async () => {
    if (!thumbnail) return alert('Upload a photo first')
    try {
      const res = await fetch('/api/ai/suggest-product', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ image_url: thumbnail }) })
      if (!res.ok) {
        const j = await res.json().catch(() => null)
        return alert(j?.error || 'AI not configured')
      }
      const j = await res.json()
      if (j.title) setTitle(j.title)
      if (j.description) setDescription(j.description)
    } catch {
      alert('Failed to fetch AI suggestions')
    }
  }

  useEffect(() => {
    fetch('/api/admin/session').then(r => r.json()).then(j => setAuth(!!j?.authenticated))
  }, [])

  const slug = useMemo(() => title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''), [title])

  const submit = async () => {
    setBusy(true)
    setMsg(null)
    const parsedVariants = variants.map(v => {
      const parsedPrices = v.prices.map(pr => {
        const val = (pr.amount || '').trim()
        const cents = val.includes('.') ? Math.round(parseFloat(val) * 100) : (parseInt(val || '0', 10) * (val.match(/^\d+$/) ? 100 : 1))
        return { currency_code: pr.currency_code.toLowerCase(), amount: Number.isFinite(cents) ? cents : 0 }
      }).filter(p => p.amount > 0)
      const inv = parseInt(v.inventory_quantity || '0', 10)
      const obj: any = { title: v.title || 'Variant', prices: parsedPrices }
      if (v.sku) obj.sku = v.sku
      if (!Number.isNaN(inv)) obj.inventory_quantity = inv
      return obj
    })

    const payload: any = {
      title,
      description,
      handle: slug,
      thumbnail: thumbnail || images[0]?.url || undefined,
      images: images.length ? images.map(i => i.url) : (thumbnail ? [thumbnail] : undefined),
      variants: parsedVariants,
      status,
    }

    const res = await fetch('/api/admin/products', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload)
    })
    setBusy(false)
    if (res.ok) {
      setMsg('Product created successfully')
      setTimeout(() => navigate('/products'), 800)
    } else {
      const j = await res.json().catch(() => null)
      setMsg(j?.message || j?.error || `Create failed (${res.status})`)
    }
  }

  if (auth === null) return <div className="container section-py"><div className="text-muted">Checking session…</div></div>
  if (!auth) { navigate('/admin/login'); return null }

  return (
    <div className="container section-py admin-compact" style={{ maxWidth: 760 }}>
      <button className="btn btn-ghost mb-3" onClick={() => navigate('/admin')}>← Admin</button>
      <h1 className="section-title">Add Product</h1>
      <div className="form-grid-2">
        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Product Photos</label>
          <div
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={(e) => { e.preventDefault(); const file = e.dataTransfer.files?.[0]; if (file) uploadPhoto(file) }}
            style={{ padding: 12, border: '1px dashed var(--border-color, #ccc)', borderRadius: 8, marginBottom: 8 }}
          >
            <div className="flex items-center gap-3">
              <input type="file" accept="image/*" multiple onChange={e => { const files = Array.from(e.target.files || []); files.forEach(f => uploadPhoto(f)) }} />
              <button className="btn btn-outline btn-sm" onClick={aiSuggest} disabled={!thumbnail}>Suggest title & description</button>
            </div>
            <div className="text-muted" style={{ marginTop: 6 }}>Drag & drop or click to upload. First image is used as thumbnail unless you choose one below.</div>
          </div>
          {images.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 12 }}>
              {images.map((img, idx) => (
                <div key={idx} className="card" style={{ padding: 8 }}>
                  <img src={img.url} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 6 }} />
                  <div className="flex items-center gap-2 mt-2">
                    <label className="flex items-center gap-1 text-sm">
                      <input type="radio" name="thumb" checked={(thumbnail || images[0]?.url) === img.url} onChange={() => setThumbnail(img.url)} /> Thumbnail
                    </label>
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button className="btn btn-outline btn-sm" disabled={idx===0} onClick={() => setImages(prev => { const p=[...prev]; const t=p[idx]; p[idx]=p[idx-1]; p[idx-1]=t; return p })}>Up</button>
                    <button className="btn btn-outline btn-sm" disabled={idx===images.length-1} onClick={() => setImages(prev => { const p=[...prev]; const t=p[idx]; p[idx]=p[idx+1]; p[idx+1]=t; return p })}>Down</button>
                    <button className="btn btn-outline btn-sm" onClick={() => {
                      const id = images[idx]?.id; if (id) setToDelete(prev => [...prev, id]);
                      setImages(prev => prev.filter((_, i) => i !== idx))
                    }}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
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
          {toDelete.length > 0 && (
            <div className="flex gap-2 mt-2">
              <button className="btn btn-outline btn-sm" onClick={async () => {
                for (const id of toDelete) { try { await fetch(`/api/images/${id}`, { method: 'DELETE' }) } catch {} }
                setToDelete([])
              }}>Delete removed uploads</button>
            </div>
          )}
        </div>
        <div className="form-field">
          <label className="form-label form-label--required">Title</label>
          <input className="form-input form-input-sm" value={title} onChange={e => setTitle(e.target.value)} placeholder="Product title" />
        </div>
        <div className="form-field">
          <label className="form-label">Handle</label>
          <input className="form-input form-input-sm" value={slug} readOnly />
        </div>
        <div className="form-field" style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Description</label>
          <textarea className="form-input form-textarea-sm" rows={4} value={description} onChange={e => setDescription(e.target.value)} placeholder="Optional description" />
        </div>
        <div className="form-field">
          <label className="form-label">Price (USD)</label>
          <input className="form-input form-input-sm" inputMode="decimal" placeholder="19.99" value={simplePrice}
            onChange={e => {
              const val = e.target.value; setSimplePrice(val)
              setVariants(prev => {
                const next = [...prev]
                if (!next[0]) next[0] = { title: 'Default', prices: [{ currency_code: 'usd', amount: '' }], inventory_quantity: '' }
                if (!next[0].prices[0]) next[0].prices[0] = { currency_code: 'usd', amount: '' }
                next[0].prices[0].amount = val
                return next
              })
            }} />
        </div>
        <div className="form-field">
          <label className="form-label">Inventory Quantity (default variant)</label>
          <input className="form-input form-input-sm" inputMode="numeric" value={qty} onChange={e => setQty(e.target.value)} placeholder="e.g., 100" />
        </div>
        <div className="form-field">
          <label className="form-label">Publish</label>
          <div className="flex gap-3 items-center">
            <label className="flex items-center gap-1"><input type="radio" name="pub" checked={status==='published'} onChange={() => setStatus('published')} /> <span className="text-sm">Live</span></label>
            <label className="flex items-center gap-1"><input type="radio" name="pub" checked={status==='draft'} onChange={() => setStatus('draft')} /> <span className="text-sm">Preview</span></label>
          </div>
        </div>
      </div>
      <section className="checkout-section" style={{ marginTop: 16 }}>
        <h2 className="checkout-section__title">Variants</h2>
        <div className="stack">
          {variants.map((v, i) => (
            <div key={i} className="card" style={{ padding: 12 }}>
              <div className="form-grid-4">
                <div className="form-field">
                  <label className="form-label">Title</label>
                  <input className="form-input form-input-sm" value={v.title} onChange={e => setVariants(prev => prev.map((p, idx) => idx===i? { ...p, title: e.target.value }: p))} />
                </div>
                <div className="form-field">
                  <label className="form-label">SKU</label>
                  <input className="form-input form-input-sm" value={v.sku || ''} onChange={e => setVariants(prev => prev.map((p, idx) => idx===i? { ...p, sku: e.target.value }: p))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Inventory</label>
                  <input className="form-input form-input-sm" inputMode="numeric" value={v.inventory_quantity || ''} onChange={e => setVariants(prev => prev.map((p, idx) => idx===i? { ...p, inventory_quantity: e.target.value }: p))} />
                </div>
                <div className="form-field">
                  <label className="form-label">Prices</label>
                  <div className="stack">
                    {v.prices.map((pr, j) => (
                      <div key={j} style={{ display: 'flex', gap: 8 }}>
                        <input className="form-input form-input-sm" style={{ width: 100 }} value={pr.currency_code}
                          onChange={e => setVariants(prev => prev.map((p, idx) => idx===i? { ...p, prices: p.prices.map((pp, jj) => jj===j? { ...pp, currency_code: e.target.value }: pp) }: p))}
                        />
                        <input className="form-input form-input-sm" placeholder="19.99" value={pr.amount}
                          onChange={e => setVariants(prev => prev.map((p, idx) => idx===i? { ...p, prices: p.prices.map((pp, jj) => jj===j? { ...pp, amount: e.target.value }: pp) }: p))}
                        />
                        <button className="btn btn-outline btn-sm" onClick={() => setVariants(prev => prev.map((p, idx) => idx===i? { ...p, prices: p.prices.filter((_, jj) => jj!==j) }: p))}>Remove</button>
                      </div>
                    ))}
                    <button className="btn btn-sm" onClick={() => setVariants(prev => prev.map((p, idx) => idx===i? { ...p, prices: [...p.prices, { currency_code: 'usd', amount: '' }] }: p))}>Add Price</button>
                  </div>
                </div>
              </div>
              {variants.length > 1 && <button className="btn btn-outline btn-sm mt-2" onClick={() => setVariants(prev => prev.filter((_, idx) => idx !== i))}>Delete Variant</button>}
            </div>
          ))}
          <button className="btn btn-sm" onClick={() => setVariants(prev => [...prev, { title: `Variant ${prev.length+1}`, prices: [{ currency_code: 'usd', amount: '' }], inventory_quantity: '' }])}>Add Variant</button>
        </div>
      </section>
      {msg && <div className="alert mt-3">{msg}</div>}
      <button className={`btn btn-primary btn-sm mt-3 ${busy ? 'btn-loading' : ''}`} onClick={submit} disabled={busy || !title}>
        {!busy && 'Create Product'}
      </button>
    </div>
  )
}
