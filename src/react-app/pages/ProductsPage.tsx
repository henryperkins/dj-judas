import { useEffect, useState } from 'react'
import { fetchProducts, addLineItem, type Product } from '../utils/cart-sdk'
import { navigate } from '../utils/nav'
import { Button } from '@/components/ui/button'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [adding, setAdding] = useState<string | null>(null)
  const [errorByProductId, setErrorByProductId] = useState<Record<string, string>>({})

  useEffect(() => {
    fetchProducts(20).then(data => {
      setProducts((data as { products?: Product[] })?.products || [])
      setLoading(false)
    })
  }, [])

  const handleAddToCart = async (product: Product) => {
    const variantId = product.variants?.[0]?.id
    if (!variantId) {
      setErrorByProductId(prev => ({
        ...prev,
        [product.id]: 'This product is not available for purchase.'
      }))
      return
    }
    
    setAdding(product.id)
    setErrorByProductId(prev => {
      const next = { ...prev }
      delete next[product.id]
      return next
    })

    const result = await addLineItem(variantId, 1)
    setAdding(null)
    
    if (result.ok) {
      navigate('/checkout')
      return
    }

    setErrorByProductId(prev => ({
      ...prev,
      [product.id]: result.message
    }))
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
        <div className="text-center text-muted-foreground">Loading products...</div>
      </div>
    )
  }

  return (
    <div className="container section-py">
      <Button variant="ghost" className="mb-3" onClick={() => navigate('/')}>
        ← Back
      </Button>
      
      <h1 className="section-title">Products</h1>
      
      {products.length === 0 ? (
        <div className="empty-state">
          <p className="empty-state__title">No products available</p>
          <p className="empty-state__description">Merch and music will appear here when the store is ready.</p>
        </div>
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
                  <p className="text-muted-foreground text-sm mb-2">
                    {product.description.slice(0, 100)}
                    {product.description.length > 100 && '...'}
                  </p>
                )}
                <div className="product-card__price mb-3">
                  {getPrice(product) || 'Price unavailable'}
                </div>
                {errorByProductId[product.id] && (
                  <div className="product-card__error" role="alert">
                    {errorByProductId[product.id]}
                  </div>
                )}
                <Button
                  size="sm"
                  className={adding === product.id ? 'btn-loading' : undefined}
                  onClick={() => handleAddToCart(product)}
                  disabled={adding === product.id || !product.variants?.[0]?.id}
                >
                  {adding === product.id ? '' : product.variants?.[0]?.id ? 'Add to Cart' : 'Unavailable'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
