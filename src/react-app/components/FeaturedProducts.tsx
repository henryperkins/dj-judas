import { useEffect, useState } from 'react'
import { addLineItem, ensureCart, fetchProducts, type Product } from '../utils/cart-sdk'
import { navigate } from '../utils/nav'

export default function FeaturedProducts() {
  const [items, setItems] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [errorByProductId, setErrorByProductId] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchProducts(6).then((d) => setItems((d as { products?: Product[] })?.products || [])).finally(() => setLoading(false))
    ensureCart()
  }, [])

  const addFeaturedProduct = async (product: Product) => {
    const variantId = product.variants?.[0]?.id
    if (!variantId) {
      setErrorByProductId(prev => ({
        ...prev,
        [product.id]: 'This product is not available for purchase.'
      }))
      return
    }

    setAddingId(product.id)
    setErrorByProductId(prev => {
      const next = { ...prev }
      delete next[product.id]
      return next
    })

    const result = await addLineItem(variantId, 1)
    setAddingId(null)

    if (result.ok) {
      navigate('/checkout')
      return
    }

    setErrorByProductId(prev => ({
      ...prev,
      [product.id]: result.message
    }))
  }

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
              {errorByProductId[p.id] && (
                <div className="product-card__error" role="alert">
                  {errorByProductId[p.id]}
                </div>
              )}
              <div className="product-card__actions">
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/products')}>View All</button>
                <button
                  className={`btn btn-primary btn-sm ${addingId === p.id ? 'btn-loading' : ''}`}
                  onClick={() => addFeaturedProduct(p)}
                  disabled={addingId === p.id || !p.variants?.[0]?.id}
                  aria-busy={addingId === p.id}
                >
                  {addingId === p.id ? '' : p.variants?.[0]?.id ? 'Add to cart' : 'Unavailable'}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
