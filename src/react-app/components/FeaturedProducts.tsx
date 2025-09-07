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
    <section className="container section-py">
      <h2 className="section-title">Merch & Music</h2>
      <div className="product-grid">
        {items.map((p) => (
          <div key={p.id} className="product-card">
            {p.thumbnail && (
              <img src={p.thumbnail} alt={p.title} className="product-card__image" />
            )}
            <div className="product-card__content">
              <h3 className="product-card__title">{p.title}</h3>
              <div className="product-card__actions">
                <button className="btn btn-ghost" onClick={() => navigate('/checkout')}>Details</button>
                <button className="btn btn-primary" onClick={async () => {
                  const v = p.variants?.[0]?.id
                  if (v) {
                    const ok = await addLineItem(v, 1)
                    if (ok) navigate('/checkout')
                  }
                }}>Add to cart</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
