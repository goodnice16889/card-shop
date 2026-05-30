import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleLogin = async () => {
    if (!email || !password) { toast.error('请填写邮箱和密码'); return }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      toast.error('登录失败：邮箱或密码错误')
      setLoading(false)
    } else {
      toast.success('登录成功')
      navigate('/admin')
    }
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="font-display font-bold text-3xl text-paper mb-2">管理后台</h1>
          <p className="text-muted font-body text-sm">卡密商店控制台</p>
        </div>
        <div className="bg-paper rounded-2xl p-8 space-y-4">
          <div>
            <label className="block text-sm font-body font-medium mb-2">管理员邮箱</label>
            <input className="input" type="email" placeholder="admin@example.com"
              value={email} onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <div>
            <label className="block text-sm font-body font-medium mb-2">密码</label>
            <input className="input" type="password" placeholder="••••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleLogin()} />
          </div>
          <button className="btn-primary w-full justify-center mt-2" onClick={handleLogin} disabled={loading}>
            {loading ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                登录中...
              </span>
            ) : '登录'}
          </button>
        </div>
      </div>
    </div>
  )
}
