import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const TABS = ['商品管理', '卡密管理', '订单管理']

export default function AdminDashboard() {
  const [tab, setTab] = useState(0)
  const navigate = useNavigate()

  const logout = async () => {
    await supabase.auth.signOut()
    navigate('/admin/login')
  }

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <div className="bg-ink text-paper sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <span className="font-display font-bold">卡密商店 · 后台</span>
            <div className="flex gap-1">
              {TABS.map((t, i) => (
                <button key={t} onClick={() => setTab(i)}
                  className={`px-4 py-1.5 rounded-full text-sm font-body transition-all
                    ${tab === i ? 'bg-paper text-ink' : 'text-muted hover:text-paper'}`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <button onClick={logout} className="text-muted text-sm font-body hover:text-paper transition-colors">退出</button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {tab === 0 && <ProductsTab />}
        {tab === 1 && <CardsTab />}
        {tab === 2 && <OrdersTab />}
      </div>
    </div>
  )
}

/* ─────────── Products Tab ─────────── */
function ProductsTab() {
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', is_active: true })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)

  const load = () => supabase.from('products').select('*').order('created_at', { ascending: false })
    .then(({ data }) => setProducts(data || []))

  useEffect(() => { load() }, [])

  const save = async () => {
    if (!form.name || !form.price) { toast.error('请填写商品名和价格'); return }
    setSaving(true)
    const payload = { ...form, price: parseFloat(form.price) }
    const { error } = editId
      ? await supabase.from('products').update(payload).eq('id', editId)
      : await supabase.from('products').insert(payload)
    setSaving(false)
    if (error) { toast.error('保存失败'); return }
    toast.success(editId ? '已更新' : '已添加')
    setShowForm(false); setEditId(null); setForm({ name: '', description: '', price: '', category: '', is_active: true })
    load()
  }

  const del = async (id) => {
    if (!confirm('确认删除？')) return
    await supabase.from('products').delete().eq('id', id)
    toast.success('已删除'); load()
  }

  const toggle = async (id, val) => {
    await supabase.from('products').update({ is_active: !val }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-2xl">商品管理</h2>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ name: '', description: '', price: '', category: '', is_active: true }) }}>
          + 添加商品
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-accent/30">
          <h3 className="font-display font-semibold text-lg mb-4">{editId ? '编辑商品' : '添加商品'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-body mb-1.5">商品名称 *</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-sm font-body mb-1.5">价格（元）*</label>
              <input className="input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div><label className="block text-sm font-body mb-1.5">分类</label>
              <input className="input" placeholder="如：游戏充值" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-accent" />
              <label htmlFor="active" className="font-body text-sm">上架销售</label>
            </div>
            <div className="md:col-span-2"><label className="block text-sm font-body mb-1.5">描述</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn-primary" onClick={save} disabled={saving}>{saving ? '保存中...' : '保存'}</button>
            <button className="btn-ghost" onClick={() => setShowForm(false)}>取消</button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-left text-muted">
            <th className="pb-3 font-medium">商品名</th>
            <th className="pb-3 font-medium">分类</th>
            <th className="pb-3 font-medium">价格</th>
            <th className="pb-3 font-medium">状态</th>
            <th className="pb-3 font-medium">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {products.map(p => (
              <tr key={p.id} className="hover:bg-paper/50">
                <td className="py-3 font-medium">{p.name}</td>
                <td className="py-3"><span className="tag">{p.category || '—'}</span></td>
                <td className="py-3 font-mono font-semibold text-accent">¥{p.price}</td>
                <td className="py-3">
                  <button onClick={() => toggle(p.id, p.is_active)}
                    className={`text-xs px-2.5 py-1 rounded-full font-body border transition-all
                      ${p.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                    {p.is_active ? '上架' : '下架'}
                  </button>
                </td>
                <td className="py-3 flex gap-2">
                  <button onClick={() => { setEditId(p.id); setForm({ name: p.name, description: p.description || '', price: String(p.price), category: p.category || '', is_active: p.is_active }); setShowForm(true) }}
                    className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-ink hover:text-paper transition-all">编辑</button>
                  <button onClick={() => del(p.id)}
                    className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all">删除</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="text-center text-muted py-8 font-body">暂无商品</p>}
      </div>
    </div>
  )
}

/* ─────────── Cards Tab ─────────── */
function CardsTab() {
  const [products, setProducts] = useState([])
  const [selProduct, setSelProduct] = useState('')
  const [cards, setCards] = useState([])
  const [bulkText, setBulkText] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    supabase.from('products').select('id, name').then(({ data }) => {
      setProducts(data || [])
      if (data?.length) setSelProduct(data[0].id)
    })
  }, [])

  useEffect(() => {
    if (!selProduct) return
    supabase.from('cards').select('*').eq('product_id', selProduct).order('created_at', { ascending: false })
      .then(({ data }) => setCards(data || []))
  }, [selProduct])

  const importCards = async () => {
    const lines = bulkText.trim().split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) { toast.error('请输入卡密'); return }
    setImporting(true)

    const rows = lines.map(line => {
      const parts = line.split(/[,|，]/)
      return { product_id: selProduct, card_code: parts[0]?.trim(), card_secret: parts[1]?.trim() || null, is_sold: false }
    })

    const { error } = await supabase.from('cards').insert(rows)
    setImporting(false)
    if (error) { toast.error('导入失败：' + error.message); return }
    toast.success(`成功导入 ${rows.length} 张卡密`)
    setBulkText('')
    supabase.from('cards').select('*').eq('product_id', selProduct).order('created_at', { ascending: false })
      .then(({ data }) => setCards(data || []))
  }

  const delCard = async (id) => {
    await supabase.from('cards').delete().eq('id', id)
    setCards(c => c.filter(x => x.id !== id))
    toast.success('已删除')
  }

  const available = cards.filter(c => !c.is_sold).length

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-2xl">卡密管理</h2>
        {selProduct && (
          <span className="text-sm font-body text-muted">可用：<strong className="text-green-600">{available}</strong> / 共 {cards.length}</span>
        )}
      </div>

      {/* Product selector */}
      <div className="mb-6">
        <label className="block text-sm font-body mb-1.5">选择商品</label>
        <select className="input max-w-xs" value={selProduct} onChange={e => setSelProduct(e.target.value)}>
          {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* Import */}
      <div className="card mb-6 border-accent/20">
        <h3 className="font-display font-semibold mb-3">批量导入卡密</h3>
        <p className="text-muted text-sm font-body mb-3">每行一条，格式：<code className="font-mono bg-paper px-1 rounded">卡号</code> 或 <code className="font-mono bg-paper px-1 rounded">卡号,卡密</code></p>
        <textarea className="input resize-none font-mono text-sm mb-3" rows={5}
          placeholder={"ABCD-1234-EFGH\nXXXX-5678,password123"}
          value={bulkText} onChange={e => setBulkText(e.target.value)} />
        <button className="btn-primary" onClick={importCards} disabled={importing || !selProduct}>
          {importing ? '导入中...' : '导入卡密'}
        </button>
      </div>

      {/* Cards list */}
      <div className="card overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-left text-muted">
            <th className="pb-3 font-medium">卡号</th>
            <th className="pb-3 font-medium">卡密</th>
            <th className="pb-3 font-medium">状态</th>
            <th className="pb-3 font-medium">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {cards.map(c => (
              <tr key={c.id} className={c.is_sold ? 'opacity-40' : ''}>
                <td className="py-2.5 font-mono text-xs">{c.card_code}</td>
                <td className="py-2.5 font-mono text-xs text-muted">{c.card_secret || '—'}</td>
                <td className="py-2.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-body
                    ${c.is_sold ? 'bg-gray-50 border-gray-200 text-gray-400' : 'bg-green-50 border-green-200 text-green-700'}`}>
                    {c.is_sold ? '已售' : '可用'}
                  </span>
                </td>
                <td className="py-2.5">
                  {!c.is_sold && (
                    <button onClick={() => delCard(c.id)}
                      className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all">删除</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {cards.length === 0 && <p className="text-center text-muted py-8 font-body">暂无卡密，请先导入</p>}
      </div>
    </div>
  )
}

/* ─────────── Orders Tab ─────────── */
function OrdersTab() {
  const [orders, setOrders] = useState([])
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    supabase.from('orders').select('*, products(name)').order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []))
  }, [])

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter)

  const statusLabel = { pending: '待支付', paid: '已支付', failed: '失败' }
  const statusStyle = { pending: 'bg-orange-50 border-orange-200 text-orange-700', paid: 'bg-green-50 border-green-200 text-green-700', failed: 'bg-red-50 border-red-200 text-red-500' }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-2xl">订单管理</h2>
        <div className="flex gap-2">
          {['all', 'paid', 'pending', 'failed'].map(s => (
            <button key={s} onClick={() => setFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full border font-body transition-all
                ${filter === s ? 'bg-ink text-paper border-ink' : 'border-border text-muted hover:border-muted'}`}>
              {s === 'all' ? '全部' : statusLabel[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-left text-muted">
            <th className="pb-3 font-medium">订单号</th>
            <th className="pb-3 font-medium">商品</th>
            <th className="pb-3 font-medium">邮箱</th>
            <th className="pb-3 font-medium">金额</th>
            <th className="pb-3 font-medium">状态</th>
            <th className="pb-3 font-medium">时间</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {filtered.map(o => (
              <tr key={o.id} className="hover:bg-paper/50">
                <td className="py-3 font-mono text-xs text-muted">{o.id.slice(0, 8)}…</td>
                <td className="py-3 font-medium">{o.products?.name}</td>
                <td className="py-3 text-muted">{o.email}</td>
                <td className="py-3 font-mono font-semibold text-accent">¥{o.amount}</td>
                <td className="py-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full border font-body ${statusStyle[o.status] || ''}`}>
                    {statusLabel[o.status] || o.status}
                  </span>
                </td>
                <td className="py-3 text-xs text-muted">{new Date(o.created_at).toLocaleString('zh-CN')}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="text-center text-muted py-8 font-body">暂无订单</p>}
      </div>
    </div>
  )
}
