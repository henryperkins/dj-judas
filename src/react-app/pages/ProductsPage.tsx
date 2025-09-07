import { useEffect, useState } from 'react'
import { fetchProducts, addLineItem, type Product } from '../utils/cart-sdk'
import { navigate } from '../utils/nav'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)

  useEffect(() => {
    fetchProducts(20).then(data => {
      setProducts(data?.products || [])
      setLoading(false)
    })
  }, [])

  const handleAddToCart = async (product: Product) => {
    const variantId = product.variants?.[0]?.id
    if (!variantId) return
    
    setAdding(product.id)
    const success = await addLineItem(variantId, 1)
    setAdding(null)
    
    if (success) {
      navigate('/checkout')
    }
  }

  const getPrice = (product: Product) => {
    const variant = product.variants?.[0]
    const price = variant?.calculated_price
    if (!price?.calculated_amount) return null
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: price.currency_code || 'USD'
    }).format(price.calculated_amount / 100)
  }

  if (loading) {
    return (
      <div className="container section-py">
        <div className="text-center text-muted">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="container section-py">
      <button className="btn btn-ghost mb-3" onClick={() => navigate('/')}>
        ← Back
      </button>
      
      <h1 className="section-title">Products</h1>
      
      {products.length === 0 ? (
        <p className="text-center text-muted">No products available</p>
      ) : (
        <div className="product-grid">
          {products.map(product => (
            <div key={product.id} className="product-card">
              {product.thumbnail && (
                <img 
                  src={product.thumbnail} 
                  alt={product.title}
                  className="product-card__image"
                />
              )}
              <div className="product-card__content">
                <h3 className="product-card__title">{product.title}</h3>
                {product.description && (
                  <p className="text-muted text-sm mb-2">
                    {product.description.slice(0, 100)}
                    {product.description.length > 100 && '...'}
                  </p>
                )}
                <div className="product-card__price mb-3">
                  {getPrice(product) || 'Price unavailable'}
                </div>
                <button 
                  className={`btn btn-primary btn-sm ${adding === product.id ? 'btn-loading' : ''}`}
                  onClick={() => handleAddToCart(product)}
                  disabled={adding === product.id || !product.variants?.[0]?.id}
                >
                  {adding === product.id ? '' : 'Add to Cart'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}