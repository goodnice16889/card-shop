import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar.jsx'

export default function StorePage() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase
      .from('products')
      .select('*, product_variants(*)')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setProducts(data || [])
        setLoading(false)
      })
  }, [])

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />

      {/* Hero */}
      <div className="max-w-5xl mx-auto px-4 pt-16 pb-10">
        <div className="animate-fade-up">
          <span className="tag mb-4 inline-block">自动发卡 · 秒速到账</span>
          <h1 className="font-display font-bold text-5xl md:text-6xl tracking-tight leading-tight mb-4">
            所有商品
          </h1>
          <p className="text-muted font-body text-lg">购买后立即获得卡密，安全可靠</p>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-5xl mx-auto px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card animate-pulse">
                <div className="h-32 bg-border rounded-xl mb-4" />
                <div className="h-4 bg-border rounded w-2/3 mb-4" />
                <div className="h-8 bg-border rounded w-1/3 mb-6" />
                <div className="h-10 bg-border rounded-full" />
              </div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 text-muted">
            <p className="font-display text-2xl mb-2">暂无商品</p>
            <p className="font-body text-sm">管理员还未添加任何商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function ProductCard({ product, index }) {
  const [stock, setStock] = useState(null)
  const variants = (product.product_variants || []).filter(v => v.is_active)
  const hasVariants = variants.length > 0

  useEffect(() => {
    if (hasVariants) return // stock shown per-variant on checkout page
    supabase
      .from('cards')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', product.id)
      .eq('is_sold', false)
      .is('variant_id', null)
      .then(({ count }) => setStock(count || 0))
  }, [product.id])

  // Price display
  let priceLabel
  if (hasVariants) {
    const prices = variants.map(v => Number(v.price))
    const min = Math.min(...prices)
    const max = Math.max(...prices)
    priceLabel = min === max
      ? <span className="font-display font-bold text-3xl text-accent">¥{min}</span>
      : <span className="font-display font-bold text-2xl text-accent">¥{min} - ¥{max}</span>
  } else {
    priceLabel = <>
      <span className="font-display font-bold text-3xl text-accent">¥{product.price}</span>
      <span className="text-muted text-sm mb-1">/份</span>
    </>
  }

  return (
    <div
      className="card group hover:border-accent/40 hover:shadow-lg transition-all duration-300 flex flex-col"
      style={{ animationDelay: `${index * 60}ms`, animation: 'fadeUp 0.5s ease forwards', opacity: 0 }}
    >
      {/* Image */}
      {product.image_url ? (
        <div className="-mx-6 -mt-6 mb-4 h-36 overflow-hidden rounded-t-2xl bg-paper">
          <img src={product.image_url} alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        </div>
      ) : (
        <div className="-mx-6 -mt-6 mb-4 h-36 rounded-t-2xl bg-gradient-to-br from-accent/10 to-paper flex items-center justify-center">
          <span className="font-display font-bold text-4xl text-accent/30">{product.name?.[0]}</span>
        </div>
      )}

      {/* Category tag */}
      {product.category && (
        <span className="tag mb-3 inline-block w-fit">{product.category}</span>
      )}

      {/* Name */}
      <h2 className="font-display font-bold text-xl mb-1 group-hover:text-accent transition-colors">
        {product.name}
      </h2>

      {/* Description */}
      {product.description && (
        <p className="text-muted text-sm font-body mb-4 line-clamp-2">{product.description}</p>
      )}

      {/* Price */}
      <div className="flex items-end gap-1 mb-5 mt-auto">
        {priceLabel}
      </div>

      {/* Stock / variants info */}
      <div className="flex items-center justify-between mb-4">
        {hasVariants ? (
          <span className="text-xs font-mono text-muted">{variants.length} 种规格可选</span>
        ) : (
          <>
            <span className="text-xs font-mono text-muted">
              库存：{stock === null ? '...' : stock > 0 ? `${stock} 份` : '售罄'}
            </span>
            {stock > 0 && stock <= 10 && (
              <span className="text-xs font-mono text-orange-500">仅剩 {stock} 份</span>
            )}
          </>
        )}
      </div>

      {/* CTA */}
      {hasVariants || stock === null || stock > 0 ? (
        <Link to={`/checkout/${product.id}`} className="btn-primary w-full justify-center">
          {hasVariants ? '选择规格' : '立即购买'}
        </Link>
      ) : (
        <button disabled className="btn-primary w-full justify-center">已售罄</button>
      )}
    </div>
  )
}
