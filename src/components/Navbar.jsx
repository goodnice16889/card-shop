import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Navbar() {
  const [contact, setContact] = useState('')

  useEffect(() => {
    supabase.from('settings').select('contact_info').eq('id', 1).single()
      .then(({ data }) => setContact(data?.contact_info || ''))
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-paper/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-xl tracking-tight">
          卡密<span className="text-accent">商店</span>
        </Link>
        <div className="flex items-center gap-4 text-sm font-body">
          {contact && (
            <span className="text-muted hidden sm:inline">客服：{contact}</span>
          )}
          <Link to="/lookup" className="text-muted hover:text-ink transition-colors">查询订单</Link>
        </div>
      </div>
    </nav>
  )
}
