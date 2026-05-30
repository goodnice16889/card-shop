import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar.jsx'
import toast from 'react-hot-toast'

export default function CheckoutPage() {
  const { productId } = useParams()
  const navigate = useNavigate()
  const [product, setProduct] = useState(null)
  const [email, setEmail] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [payType, setPayType] = useState('alipay')
  const [loading, setLoading] = useState(false)
  const [stock, setStock] = useState(0)

  useEffect(() => {
    supabase.from('products').select('*').eq('id', productId).single()
      .then(({ data }) => {
        if (!data || !data.is_active) { navigate('/'); return }
        setProduct(data)
      })
    supabase.from('cards').select('id', { count: 'exact', head: true })
      .eq('product_id', productId).eq('is_sold', false)
      .then(({ count }) => setStock(count || 0))
  }, [productId])

  const handleSubmit = async () => {
    if (!email || !email.includes('@')) { toast.error('请输入有效邮箱'); return }
    if (quantity > stock) { toast.error('库存不足'); return }
    setLoading(true)

    // 1. Create order in Supabase
    const { data: order, error } = await supabase.from('orders').insert({
      product_id: productId,
      email,
      quantity,
      amount: (product.price * quantity).toFixed(2),
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
        name: product.name,
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

  const total = (product.price * quantity).toFixed(2)

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
          <div className="flex justify-between items-start">
            <div>
              <p className="font-display font-semibold text-lg">{product.name}</p>
              {product.description && <p className="text-muted text-sm mt-1">{product.description}</p>}
            </div>
            <span className="font-display font-bold text-accent text-xl">¥{product.price}</span>
          </div>
        </div>

        {/* Form */}
        <div className="card space-y-5">
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

          <button className="btn-primary w-full justify-center text-base py-4" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                跳转支付中...
              </span>
            ) : `确认支付 ¥${total}`}
          </button>
        </div>
      </div>
    </div>
  )
}
