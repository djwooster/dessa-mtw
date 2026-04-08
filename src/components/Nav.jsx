import { NavLink } from 'react-router-dom'
import { Search, HelpCircle } from 'lucide-react'

// ─── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { label: 'Dashboard',      to: '/' },
  { label: 'Ratings',        to: '/ratings' },
  { label: 'Data & Insights',to: '/insights' },
  { label: 'Strategies',     to: '/strategies' },
  { label: 'MTW',            to: '/mtw' },
  { label: 'Brand Guide',   to: '/brand' },
]

export default function Nav() {
  return (
    <nav className="bg-white border-b border-brand-border shadow-sm sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-6">

        {/* Logo */}
        <div className="flex items-center mr-4 flex-shrink-0">
          <img src="/dessa-logo.svg" alt="DESSA" className="h-5 w-auto" />
        </div>

        {/* Nav items */}
        <div className="flex items-center gap-0.5 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  isActive
                    ? 'text-brand-text bg-brand-bg'
                    : 'text-brand-subtext hover:text-brand-text hover:bg-brand-bg'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button className="text-brand-subtext hover:text-brand-text transition-colors p-1.5 rounded hover:bg-brand-bg">
            <Search size={16} />
          </button>
          <button className="text-brand-subtext hover:text-brand-text transition-colors p-1.5 rounded hover:bg-brand-bg">
            <HelpCircle size={16} />
          </button>
          <div className="w-8 h-8 rounded-full bg-dessa-teal flex items-center justify-center text-white text-xs font-semibold ml-1">
            TR
          </div>
        </div>

      </div>
    </nav>
  )
}
