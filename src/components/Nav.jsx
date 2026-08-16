import { NavLink } from 'react-router-dom'
import { Search, HelpCircle, Settings, Palette } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'

// ─── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Curriculum', to: '/mtw' },
  { label: 'Ratings', to: '/class-ratings' },
  { label: 'Resources', to: '/resources' },
  { label: 'Reports', to: '/reports' },
  { label: 'Strategies', to: '/strategies' },
  { label: 'Training', to: '/training' },
]

const userMenuItems = [
  { label: 'Settings', to: '/settings', icon: Settings },
  { label: 'Brand Guide', to: '/brand', icon: Palette },
]

export default function Nav() {
  return (
    <nav className="bg-white border-b border-brand-border shadow-sm sticky top-0 z-50">
      <div className="max-w-screen-xl mx-auto px-6 h-14 flex items-center gap-6">

        {/* Logo */}
        <div className="flex items-center mr-4 flex-shrink-0">
          <img src="/dessa-mtw-logo.svg" alt="DESSA x Move This World" className="h-5 w-auto" />
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
          <Popover.Root>
            <Popover.Trigger asChild>
              <button className="w-8 h-8 rounded-full bg-dessa-teal flex items-center justify-center text-white text-xs font-semibold ml-1 hover:brightness-105 transition-all">
                TR
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="end"
                sideOffset={8}
                className="z-50 w-48 bg-white border border-brand-border rounded-xl shadow-lg outline-none py-1.5"
              >
                {userMenuItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
                        isActive
                          ? 'text-dessa-teal font-medium'
                          : 'text-brand-text hover:bg-brand-bg'
                      }`
                    }
                  >
                    <item.icon size={15} />
                    {item.label}
                  </NavLink>
                ))}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>

      </div>
    </nav>
  )
}
