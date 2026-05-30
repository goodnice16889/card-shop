import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="sticky top-0 z-50 bg-paper/90 backdrop-blur-sm border-b border-border">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="font-display font-bold text-xl tracking-tight">
          卡密<span className="text-accent">商店</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-muted text-sm font-body">安全 · 即时发卡</span>
        </div>
      </div>
    </nav>
  )
}
