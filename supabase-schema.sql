import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar.jsx'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [variants, setVariants] = useState([])
  const [selectedVariant, setSelectedVariant] = useState(null) // null = no-variant product
  const [email, setEmail] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [payType, setPayType] = useState('alipay')
  const [loading, setLoading] = useState(false)
  const [stock, setStock] = useState(0)

  // Load product + variants
  useEffect(() => {
    supabase.from('products').select('*, product_variants(*)').eq('id', productId).single()
      .then(({ data }) => {
        if (!data || !data.is_active) { navigate('/'); return }
        setProduct(data)
        const active = (data.product_variants || []).filter(v => v.is_active)
        setVariants(active)
        if (active.length > 0) setSelectedVariant(active[0])
      })
  }, [productId])

  // Load stock whenever variant changes
  useEffect(() => {
    if (!product) return
    let query = supabase.from('cards').select('id', { count: 'exact', head: true })
      .eq('product_id', productId).eq('is_sold', false)

    if (variants.length > 0) {
      if (!selectedVariant) return
      query = query.eq('variant_id', selectedVariant.id)
    } else {
      query = query.is('variant_id', null)
    }

    query.then(({ count }) => {
      setStock(count || 0)
      setQuantity(1)
    })
  }, [product, selectedVariant])

  const price = selectedVariant ? Number(selectedVariant.price) : Number(product?.price || 0)
  const displayName = selectedVariant ? `${product?.name} - ${selectedVariant.name}` : product?.name

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) { toast.error('请输入有效邮箱'); return }
    if (quantity > stock) { toast.error('库存不足'); return }
    if (variants.length > 0 && !selectedVariant) { toast.error('请选择规格'); return }
    setLoading(true)

    // 1. Create order in Supabase
    const { data: order, error } = await supabase.from('orders').insert({
      product_id: productId,
      variant_id: selectedVariant ? selectedVariant.id : null,
      email,
      quantity,
      amount: (price * quantity).toFixed(2),
      status: 'pending',
    }).select().single()

    if (error) { toast.error('创建订单失败'); setLoading(false); return }

    // 2. Call Netlify Function to get payment URL
    const res = await fetch('/.netlify/functions/create-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        name: displayName,
        payType,
      }),
    })

    const { payUrl, error: payError } = await res.json()
    if (payError || !payUrl) { toast.error('发起支付失败，请重试'); setLoading(false); return }

    // 3. Redirect to payment page
    window.location.href = payUrl
  }

  if (!product) return (
    <div className="min-h-screen bg-paper flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const total = (price * quantity).toFixed(2)

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <button onClick={() => navigate('/')} className="text-muted text-sm font-body flex items-center gap-1 mb-8 hover:text-ink transition-colors">
          ← 返回商店
        </button>

        <h1 className="font-display font-bold text-3xl mb-8">确认订单</h1>

        {/* Product summary */}
        <div className="card mb-6">
          <div className="flex gap-4 items-start">
            {product.image_url && (
              <img src={product.image_url} alt={product.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-display font-semibold text-lg">{product.name}</p>
              {product.description && <p className="text-muted text-sm mt-1">{product.description}</p>}
            </div>
            <span className="font-display font-bold text-accent text-xl shrink-0">¥{price}</span>
          </div>
        </div>

        {/* Form */}
        <div className="card space-y-5">

          {/* Variant selector */}
          {variants.length > 0 && (
            <div>
              <label className="block text-sm font-body font-medium mb-2">选择规格 <span className="text-accent">*</span></label>
              <div className="grid grid-cols-2 gap-3">
                {variants.map(v => (
                  <button key={v.id}
                    onClick={() => setSelectedVariant(v)}
                    className={`flex items-center justify-between gap-2 p-3 rounded-xl border-2 transition-all font-body text-sm text-left
                      ${selectedVariant?.id === v.id ? 'border-accent bg-accent/5' : 'border-border hover:border-muted'}`}>
                    <span>{v.name}</span>
                    <span className="font-display font-semibold text-accent">¥{v.price}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Email */}
          <div>
            <label className="block text-sm font-body font-medium mb-2">接收邮箱 <span className="text-accent">*</span></label>
            <input className="input" type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)} />
            <p className="text-xs text-muted mt-1.5">卡密将发送到此邮箱（备用），页面也会直接显示</p>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-body font-medium mb-2">购买数量</label>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-ink hover:text-paper transition-all font-body text-lg">−</button>
              <span className="font-display font-bold text-xl w-8 text-center">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(stock, q + 1))}
                className="w-10 h-10 rounded-full border border-border flex items-center justify-center hover:bg-ink hover:text-paper transition-all font-body text-lg">+</button>
              <span className="text-muted text-sm ml-2">库存 {stock} 份</span>
            </div>
          </div>

          {/* Payment method */}
          <div>
            <label className="block text-sm font-body font-medium mb-2">支付方式</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'alipay', label: '支付宝', emoji: '💙' },
                { value: 'wxpay', label: '微信支付', emoji: '💚' },
              ].map(opt => (
                <button key={opt.value}
                  onClick={() => setPayType(opt.value)}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 transition-all font-body text-sm
                    ${payType === opt.value ? 'border-accent bg-accent/5' : 'border-border hover:border-muted'}`}>
                  <span>{opt.emoji}</span> {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="font-body text-muted">合计</span>
            <span className="font-display font-bold text-2xl text-accent">¥{total}</span>
          </div>

          <button className="btn-primary w-full justify-center text-base py-4" onClick={handleSubmit}
            disabled={loading || stock === 0 || (variants.length > 0 && !selectedVariant)}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                跳转支付中...
              </span>
            ) : stock === 0 ? '已售罄' : `确认支付 ¥${total}`}
          </button>
        </div>
      </div>
    </div>
  )
}
