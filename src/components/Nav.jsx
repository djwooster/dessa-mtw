import { NavLink, useLocation, useSearchParams } from 'react-router-dom'
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
  const location = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

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

          {/* Resources-only design-review toggle. Concepts 1/2 (search-bar
              combobox + card-list results) lost the review to Concept 3's
              mandatory-grade-gate + table — that direction is now the only
              one left, so this switcher compares ways of *presenting* the
              gate instead of a blocking modal (which read as jarring), and
              (for 3B/3C) how filtering is laid out after it — both share
              3B's gate + no-sidebar layout and only differ in how the
              Filter panel itself presents its sections. */}
          {location.pathname === '/resources' && (
            <select
              value={searchParams.get('concept') || 'a'}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams)
                next.set('concept', e.target.value)
                setSearchParams(next)
              }}
              className="ml-2 h-7 pl-2 pr-6 text-xs font-medium border border-brand-border rounded-md bg-white text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            >
              <option value="a">3A — Full-page gate</option>
              <option value="b">3B — Filter panel</option>
              <option value="c">3C — Filter panel (alt)</option>
            </select>
          )}
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
