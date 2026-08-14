import { NavLink } from 'react-router-dom'
import { Search, HelpCircle, Menu } from 'lucide-react'
import { useMobileMenu } from '../lib/MobileMenuContext'

// ─── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { label: 'Dashboard',   to: '/' },
  { label: 'Curriculum', to: '/mtw' },
  { label: 'Resources', to: '/resources' },
  { label: 'DCE Report',             to: '/report1c' },
  { label: 'Site Engagement',          to: '/report2' },
  { label: 'Settings', to: '/settings' },
  { label: 'Brand Guide', to: '/brand' },
]

export default function Nav() {
  const { action: mobileMenuAction } = useMobileMenu() ?? {}

  return (
    <nav className="bg-white border-b border-brand-border shadow-sm sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-6">

        {/* Logo */}
        <div className="flex items-center mr-4 flex-shrink-0">
          <img src="/dessa-logo.svg" alt="DESSA" className="h-5 w-auto" />
        </div>

        {/* Mobile menu action — registered by the current page via
            useMobileMenu (e.g. the Family lesson view's lesson drawer),
            pushed to the right edge on mobile */}
        {mobileMenuAction && (
          <button
            onClick={mobileMenuAction.onClick}
            className="md:hidden ml-auto flex items-center gap-1.5 text-sm font-medium text-brand-text border border-brand-border rounded-md px-3 py-1.5 hover:bg-brand-bg transition-colors"
          >
            <Menu size={14} />
            {mobileMenuAction.label}
          </button>
        )}

        {/* Nav items */}
        <div className="hidden md:flex items-center gap-0.5 flex-1">
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
        <div className="hidden md:flex items-center gap-2">
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
