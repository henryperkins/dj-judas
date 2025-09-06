import { useEffect, useState } from 'react'
import { addLineItem, ensureCart, fetchProducts } from '../utils/cart'
import { navigate } from '../utils/nav'

type Product = {
  id: string
  title: string
  thumbnail?: string
  variants?: { id: string }[]
}

export default function FeaturedProducts() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProducts(6).then((d) => setItems(d?.products || [])).finally(() => setLoading(false))
    ensureCart()
  }, [])

  if (loading) return null
  if (!items.length) return null

  return (
    <section className="container" style={{ padding: '2rem var(--container-padding)' }}>
      <h2 className="section-title">Merch & Music</h2>
      <div className="gallery-grid">
        {items.map((p) => (
          <div key={p.id} className="card" style={{ padding: '1rem' }}>
            {p.thumbnail && <img src={p.thumbnail} alt={p.title} style={{ width: '100%', borderRadius: 8, aspectRatio: '1 / 1', objectFit: 'cover' }} />}
            <h3 style={{ marginTop: '.75rem' }}>{p.title}</h3>
            <div className="cluster" style={{ marginTop: '.5rem' }}>
              <button className="btn" onClick={() => navigate('/checkout')}>Details</button>
              <button className="btn" onClick={async () => {
                const v = p.variants?.[0]?.id
                if (v) {
                  const ok = await addLineItem(v, 1)
                  if (ok) navigate('/checkout')
                }
              }}>Add to cart</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

