import { useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar.jsx'
import toast from 'react-hot-toast'

export default function LookupPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState(null) // null = not searched yet
  const [cardsByOrder, setCardsByOrder] = useState({})

  const search = async () => {
    if (!email || !email.includes('@')) { toast.error('请输入有效邮箱'); return }
    setLoading(true)
    setOrders(null)
    setCardsByOrder({})

    const { data: orderData, error } = await supabase
      .from('orders')
      .select('*, products(name), product_variants(name)')
      .eq('email', email.trim())
      .order('created_at', { ascending: false })

    if (error) { toast.error('查询失败'); setLoading(false); return }
    setOrders(orderData || [])

    // Fetch cards for paid orders
    const paidIds = (orderData || []).filter(o => o.status === 'paid').map(o => o.id)
    if (paidIds.length) {
      const { data: cardData } = await supabase
        .from('cards')
        .select('order_id, card_code, card_secret')
        .in('order_id', paidIds)

      const grouped = {}
      for (const c of cardData || []) {
        if (!grouped[c.order_id]) grouped[c.order_id] = []
        grouped[c.order_id].push(c)
      }
      setCardsByOrder(grouped)
    }

    setLoading(false)
  }

  const copyAll = (cards) => {
    const text = cards.map(c => c.card_secret ? `${c.card_code} | ${c.card_secret}` : c.card_code).join('\n')
    navigator.clipboard.writeText(text)
    toast.success('已复制')
  }

  const statusLabel = { pending: '待支付', paid: '已支付', failed: '失败' }
  const statusStyle = { pending: 'bg-orange-50 border-orange-200 text-orange-700', paid: 'bg-green-50 border-green-200 text-green-700', failed: 'bg-red-50 border-red-200 text-red-500' }

  return (
    <div className="min-h-screen bg-paper">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="font-display font-bold text-3xl mb-2">查询订单</h1>
        <p className="text-muted font-body text-sm mb-8">输入下单时填写的邮箱，找回历史订单和卡密</p>

        <div className="card mb-6">
          <label className="block text-sm font-body font-medium mb-2">邮箱</label>
          <div className="flex gap-3">
            <input className="input" type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && search()} />
            <button className="btn-primary shrink-0" onClick={search} disabled={loading}>
              {loading ? '查询中...' : '查询'}
            </button>
          </div>
        </div>

        {orders !== null && (
          orders.length === 0 ? (
            <div className="text-center py-16 text-muted">
              <p className="font-display text-xl mb-2">没有找到订单</p>
              <p className="font-body text-sm">请确认邮箱地址是否正确</p>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map(o => {
                const cards = cardsByOrder[o.id] || []
                const productName = o.product_variants?.name
                  ? `${o.products?.name} - ${o.product_variants.name}`
                  : o.products?.name

                return (
                  <div key={o.id} className="card">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-display font-semibold">{productName}</p>
                      <span className={`text-xs px-2.5 py-1 rounded-full border font-body ${statusStyle[o.status] || ''}`}>
                        {statusLabel[o.status] || o.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted font-body mb-3">
                      <span>¥{o.amount}</span>
                      <span>{new Date(o.created_at).toLocaleString('zh-CN')}</span>
                    </div>

                    {o.status === 'paid' && cards.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-body text-muted">卡密（{cards.length}）</span>
                          <button onClick={() => copyAll(cards)} className="btn-ghost text-xs py-1 px-3">复制全部</button>
                        </div>
                        <div className="space-y-2">
                          {cards.map((c, i) => (
                            <div key={i} className="bg-paper rounded-lg p-3">
                              <p className="font-mono text-sm break-all">{c.card_code}</p>
                              {c.card_secret && <p className="font-mono text-xs text-muted mt-1 break-all">密码：{c.card_secret}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {o.status === 'pending' && (
                      <Link to={`/order/${o.id}`} className="text-accent text-sm font-body hover:underline">查看支付状态 →</Link>
                    )}
                  </div>
                )
              })}
            </div>
          )
        )}
      </div>
    </div>
  )
}
