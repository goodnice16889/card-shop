import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, PRODUCT_IMAGE_BUCKET } from '../lib/supabase'
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
  const [form, setForm] = useState({ name: '', description: '', price: '', category: '', is_active: true, image_url: '' })
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [expandedId, setExpandedId] = useState(null)

  const load = () => supabase.from('products').select('*, product_variants(*)').order('created_at', { ascending: false })
    .then(({ data }) => setProducts(data || []))

  useEffect(() => { load() }, [])

  const resetForm = () => setForm({ name: '', description: '', price: '', category: '', is_active: true, image_url: '' })

  const handleImageUpload = async (file) => {
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('图片不能超过 5MB'); return }
    setUploading(true)
    const ext = file.name.split('.').pop()
    const path = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`

    const { error } = await supabase.storage.from(PRODUCT_IMAGE_BUCKET).upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

    if (error) {
      toast.error('上传失败：' + error.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from(PRODUCT_IMAGE_BUCKET).getPublicUrl(path)
    setForm(f => ({ ...f, image_url: data.publicUrl }))
    setUploading(false)
    toast.success('图片已上传')
  }

  const save = async () => {
    if (!form.name || !form.price) { toast.error('请填写商品名和价格'); return }
    setSaving(true)
    const payload = {
      name: form.name,
      description: form.description,
      price: parseFloat(form.price),
      category: form.category,
      is_active: form.is_active,
      image_url: form.image_url || null,
    }
    const { error } = editId
      ? await supabase.from('products').update(payload).eq('id', editId)
      : await supabase.from('products').insert(payload)
    setSaving(false)
    if (error) { toast.error('保存失败：' + error.message); return }
    toast.success(editId ? '已更新' : '已添加')
    setShowForm(false); setEditId(null); resetForm()
    load()
  }

  // Fixed delete: verify rows were actually removed (RLS can silently block deletes)
  const del = async (id) => {
    if (!confirm('确认删除该商品？关联的卡密和规格也会被删除。')) return
    const { data, error } = await supabase.from('products').delete().eq('id', id).select('id')
    if (error) {
      toast.error('删除失败：' + error.message)
      return
    }
    if (!data || data.length === 0) {
      toast.error('删除失败：没有权限或商品不存在，请确认已登录管理员账号')
      return
    }
    toast.success('已删除')
    load()
  }

  const toggle = async (id, val) => {
    await supabase.from('products').update({ is_active: !val }).eq('id', id)
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display font-bold text-2xl">商品管理</h2>
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditId(null); resetForm() }}>
          + 添加商品
        </button>
      </div>

      {showForm && (
        <div className="card mb-6 border-accent/30">
          <h3 className="font-display font-semibold text-lg mb-4">{editId ? '编辑商品' : '添加商品'}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><label className="block text-sm font-body mb-1.5">商品名称 *</label>
              <input className="input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
            <div><label className="block text-sm font-body mb-1.5">价格（元）* <span className="text-muted">（有规格时此价格仅作默认展示）</span></label>
              <input className="input" type="number" step="0.01" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} /></div>
            <div><label className="block text-sm font-body mb-1.5">分类</label>
              <input className="input" placeholder="如：游戏充值" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></div>
            <div className="flex items-center gap-3 pt-6">
              <input type="checkbox" id="active" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} className="w-4 h-4 accent-accent" />
              <label htmlFor="active" className="font-body text-sm">上架销售</label>
            </div>
            <div className="md:col-span-2"><label className="block text-sm font-body mb-1.5">描述</label>
              <textarea className="input resize-none" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>

            {/* Image upload */}
            <div className="md:col-span-2">
              <label className="block text-sm font-body mb-1.5">商品图片</label>
              <div className="flex items-center gap-4">
                {form.image_url ? (
                  <img src={form.image_url} alt="" className="w-20 h-20 rounded-xl object-cover border border-border" />
                ) : (
                  <div className="w-20 h-20 rounded-xl border border-dashed border-border flex items-center justify-center text-muted text-xs">无图片</div>
                )}
                <div>
                  <input type="file" accept="image/*" id="img-upload"
                    onChange={e => handleImageUpload(e.target.files?.[0])}
                    className="hidden" />
                  <label htmlFor="img-upload" className="btn-ghost text-sm py-1.5 px-4 cursor-pointer">
                    {uploading ? '上传中...' : form.image_url ? '更换图片' : '上传图片'}
                  </label>
                  {form.image_url && (
                    <button onClick={() => setForm(f => ({ ...f, image_url: '' }))} className="ml-2 text-xs text-red-500 hover:underline">移除</button>
                  )}
                  <p className="text-xs text-muted mt-1">建议尺寸 4:3，最大 5MB</p>
                </div>
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn-primary" onClick={save} disabled={saving || uploading}>{saving ? '保存中...' : '保存'}</button>
            <button className="btn-ghost" onClick={() => { setShowForm(false); resetForm() }}>取消</button>
          </div>
        </div>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full text-sm font-body">
          <thead><tr className="border-b border-border text-left text-muted">
            <th className="pb-3 font-medium">图片</th>
            <th className="pb-3 font-medium">商品名</th>
            <th className="pb-3 font-medium">分类</th>
            <th className="pb-3 font-medium">价格</th>
            <th className="pb-3 font-medium">规格</th>
            <th className="pb-3 font-medium">状态</th>
            <th className="pb-3 font-medium">操作</th>
          </tr></thead>
          <tbody className="divide-y divide-border">
            {products.map(p => (
              <>
                <tr key={p.id} className="hover:bg-paper/50">
                  <td className="py-3">
                    {p.image_url ? (
                      <img src={p.image_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-paper border border-border flex items-center justify-center text-xs text-muted">无</div>
                    )}
                  </td>
                  <td className="py-3 font-medium">{p.name}</td>
                  <td className="py-3"><span className="tag">{p.category || '—'}</span></td>
                  <td className="py-3 font-mono font-semibold text-accent">¥{p.price}</td>
                  <td className="py-3">
                    <button onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                      className="text-xs px-2.5 py-1 rounded-full border border-border hover:bg-ink hover:text-paper transition-all">
                      {(p.product_variants || []).length > 0 ? `${p.product_variants.length} 种` : '管理规格'}
                    </button>
                  </td>
                  <td className="py-3">
                    <button onClick={() => toggle(p.id, p.is_active)}
                      className={`text-xs px-2.5 py-1 rounded-full font-body border transition-all
                        ${p.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                      {p.is_active ? '上架' : '下架'}
                    </button>
                  </td>
                  <td className="py-3 flex gap-2">
                    <button onClick={() => { setEditId(p.id); setForm({ name: p.name, description: p.description || '', price: String(p.price), category: p.category || '', is_active: p.is_active, image_url: p.image_url || '' }); setShowForm(true) }}
                      className="text-xs px-3 py-1 rounded-lg border border-border hover:bg-ink hover:text-paper transition-all">编辑</button>
                    <button onClick={() => del(p.id)}
                      className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all">删除</button>
                  </td>
                </tr>
                {expandedId === p.id && (
                  <tr key={p.id + '-variants'}>
                    <td colSpan={7} className="bg-paper/60 p-4">
                      <VariantsPanel product={p} onChange={load} />
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {products.length === 0 && <p className="text-center text-muted py-8 font-body">暂无商品</p>}
      </div>
    </div>
  )
}

/* ─────────── Variants Panel (二级规格管理) ─────────── */
function VariantsPanel({ product, onChange }) {
  const [variants, setVariants] = useState(product.product_variants || [])
  const [form, setForm] = useState({ name: '', price: '' })
  const [adding, setAdding] = useState(false)

  const refresh = async () => {
    const { data } = await supabase.from('product_variants').select('*').eq('product_id', product.id).order('created_at')
    setVariants(data || [])
    onChange?.()
  }

  const addVariant = async () => {
    if (!form.name || !form.price) { toast.error('请填写规格名称和价格'); return }
    setAdding(true)
    const { error } = await supabase.from('product_variants').insert({
      product_id: product.id, name: form.name, price: parseFloat(form.price), is_active: true,
    })
    setAdding(false)
    if (error) { toast.error('添加失败：' + error.message); return }
    setForm({ name: '', price: '' })
    refresh()
  }

  const delVariant = async (id) => {
    if (!confirm('删除该规格？已绑定的卡密将变为未分类。')) return
    const { error } = await supabase.from('product_variants').delete().eq('id', id)
    if (error) { toast.error('删除失败：' + error.message); return }
    refresh()
  }

  const toggleVariant = async (id, val) => {
    await supabase.from('product_variants').update({ is_active: !val }).eq('id', id)
    refresh()
  }

  return (
    <div>
      <h4 className="font-display font-semibold mb-3">{product.name} · 规格管理（二级商品）</h4>
      <p className="text-xs text-muted mb-3">添加多个规格后，用户在购买前需要先选择规格；每个规格的库存和卡密需要在「卡密管理」中分别导入。</p>

      {variants.length > 0 && (
        <div className="space-y-2 mb-4">
          {variants.map(v => (
            <div key={v.id} className="flex items-center justify-between bg-white border border-border rounded-xl px-4 py-2">
              <div className="flex items-center gap-3">
                <span className="font-body text-sm font-medium">{v.name}</span>
                <span className="font-mono text-sm text-accent">¥{v.price}</span>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleVariant(v.id, v.is_active)}
                  className={`text-xs px-2 py-0.5 rounded-full border font-body
                    ${v.is_active ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  {v.is_active ? '启用' : '停用'}
                </button>
                <button onClick={() => delVariant(v.id)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-500 hover:text-white transition-all">删除</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs font-body mb-1 text-muted">规格名称</label>
          <input className="input" placeholder="如：1个月会员" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </div>
        <div className="w-32">
          <label className="block text-xs font-body mb-1 text-muted">价格（元）</label>
          <input className="input" type="number" step="0.01" placeholder="0.00" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} />
        </div>
        <button className="btn-primary shrink-0" onClick={addVariant} disabled={adding}>添加规格</button>
      </div>
    </div>
  )
}

/* ─────────── Cards Tab ─────────── */
function CardsTab() {
  const [products, setProducts] = useState([])
  const [selProduct, setSelProduct] = useState('')
  const [variants, setVariants] = useState([])
  const [selVariant, setSelVariant] = useState('') // '' = no-variant product
  const [cards, setCards] = useState([])
  const [bulkText, setBulkText] = useState('')
  const [importing, setImporting] = useState(false)

  useEffect(() => {
    supabase.from('products').select('id, name, product_variants(*)').then(({ data }) => {
      setProducts(data || [])
      if (data?.length) setSelProduct(data[0].id)
    })
  }, [])

  useEffect(() => {
    const p = products.find(x => x.id === selProduct)
    const active = (p?.product_variants || []).filter(v => v.is_active)
    setVariants(active)
    setSelVariant(active.length > 0 ? active[0].id : '')
  }, [selProduct, products])

  const loadCards = () => {
    if (!selProduct) return
    let query = supabase.from('cards').select('*').eq('product_id', selProduct).order('created_at', { ascending: false })
    if (variants.length > 0) {
      if (selVariant) query = query.eq('variant_id', selVariant)
    } else {
      query = query.is('variant_id', null)
    }
    query.then(({ data }) => setCards(data || []))
  }

  useEffect(() => { loadCards() }, [selProduct, selVariant, variants])

  const importCards = async () => {
    if (variants.length > 0 && !selVariant) { toast.error('请先选择规格'); return }
    const lines = bulkText.trim().split('\n').map(l => l.trim()).filter(Boolean)
    if (!lines.length) { toast.error('请输入卡密'); return }
    setImporting(true)

    const rows = lines.map(line => {
      const parts = line.split(/[,|，]/)
      return {
        product_id: selProduct,
        variant_id: variants.length > 0 ? selVariant : null,
        card_code: parts[0]?.trim(),
        card_secret: parts[1]?.trim() || null,
        is_sold: false,
      }
    })

    const { error } = await supabase.from('cards').insert(rows)
    setImporting(false)
    if (error) { toast.error('导入失败：' + error.message); return }
    toast.success(`成功导入 ${rows.length} 张卡密`)
    setBulkText('')
    loadCards()
  }

  const delCard = async (id) => {
    const { data, error } = await supabase.from('cards').delete().eq('id', id).select('id')
    if (error) { toast.error('删除失败：' + error.message); return }
    if (!data || data.length === 0) { toast.error('删除失败：无权限'); return }
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

      {/* Product & variant selector */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-body mb-1.5">选择商品</label>
          <select className="input max-w-xs" value={selProduct} onChange={e => setSelProduct(e.target.value)}>
            {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        {variants.length > 0 && (
          <div>
            <label className="block text-sm font-body mb-1.5">选择规格 <span className="text-accent">*</span></label>
            <select className="input max-w-xs" value={selVariant} onChange={e => setSelVariant(e.target.value)}>
              {variants.map(v => <option key={v.id} value={v.id}>{v.name}（¥{v.price}）</option>)}
            </select>
          </div>
        )}
      </div>

      {/* Import */}
      <div className="card mb-6 border-accent/20">
        <h3 className="font-display font-semibold mb-3">批量导入卡密</h3>
        <p className="text-muted text-sm font-body mb-3">每行一条，格式：<code className="font-mono bg-paper px-1 rounded">卡号</code> 或 <code className="font-mono bg-paper px-1 rounded">卡号,卡密</code></p>
        {variants.length > 0 && (
          <p className="text-xs text-accent mb-3">⚠️ 当前导入将绑定到规格「{variants.find(v => v.id === selVariant)?.name}」</p>
        )}
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
    supabase.from('orders').select('*, products(name), product_variants(name)').order('created_at', { ascending: false })
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
                <td className="py-3 font-medium">{o.products?.name}{o.product_variants?.name ? ` - ${o.product_variants.name}` : ''}</td>
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
