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

          {/* Resources-only design-review toggle — retired 2026-08-28
              (manager picked Concept C, left-aligned + scrolling rows, as
              final; Resources.jsx now hardcodes decorConcept = 'c'). Kept
              commented rather than deleted so the A/B/C/D comparison story
              can be shown later if needed — same treatment as the retired
              3A/3B/3C gate-presentation switcher before it.
          {location.pathname === '/resources' && (
            <select
              value={searchParams.get('decor') || 'a'}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams)
                next.set('decor', e.target.value)
                setSearchParams(next)
              }}
              className="ml-2 h-7 pl-2 pr-6 text-xs font-medium border border-brand-border rounded-md bg-white text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            >
              <option value="a">A — No decoration</option>
              <option value="b">B — Grid + tiles</option>
              <option value="c">C — Left-aligned + scrolling rows</option>
              <option value="d">D — Not yet designed</option>
            </select>
          )}
          */}

          {/* Curriculum Setup-only design-review toggle (2026-08-28) —
              compares four ways to show Program Admins which sites have
              customized their weekly goal (AP-4933): A embeds a lightweight
              table right in the page; B keeps a trigger pill that opens a
              right-side drawer; C is a full report-style table over every
              site (search/filter/pagination); D is the same content as B in
              a centered modal + overlay instead of a drawer. See the block
              comment above GoalPicker in CurriculumSetup.jsx. */}
          {location.pathname === '/settings/curriculum-setup' && (
            <select
              value={searchParams.get('adminConcept') || 'a'}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams)
                next.set('adminConcept', e.target.value)
                setSearchParams(next)
              }}
              className="ml-2 h-7 pl-2 pr-6 text-xs font-medium border border-brand-border rounded-md bg-white text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            >
              <option value="a">A — Inline table</option>
              <option value="b">B — Side drawer</option>
              <option value="c">C — Report table</option>
              <option value="d">D — Modal</option>
            </select>
          )}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Lesson View (proposal A)-only design-review toggle (relocated
              here 2026-08-27, was previously in that page's own sidebar
              header) comparing three lesson-search mechanisms: A is the
              always-visible sidebar box (highlights matches in place); B
              swaps that box for a sidebar trigger ("Search inside this
              course") that opens a full command-palette-style overlay; C
              drops the sidebar element entirely in favor of a fixed
              bottom-right pill button that opens that same overlay. Driven
              by the same `?param=` pattern as the Resources decor switcher
              above, so LessonView.jsx just reads `?searchConcept=` instead
              of holding local state. */}
          {location.pathname === '/mtw/lesson' && (
            <div className="flex items-center rounded-md border border-brand-border overflow-hidden text-xs font-medium shrink-0 mr-1">
              {['a', 'b', 'c'].map((value, i) => (
                <button
                  key={value}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.set('searchConcept', value)
                    setSearchParams(next)
                  }}
                  aria-label={`Search concept ${value.toUpperCase()}`}
                  className={`px-2 py-1 transition-colors ${i > 0 ? 'border-l border-brand-border' : ''} ${
                    (searchParams.get('searchConcept') || 'a') === value
                      ? 'bg-dessa-teal text-white'
                      : 'text-brand-subtext hover:bg-brand-bg'
                  }`}
                >
                  {value.toUpperCase()}
                </button>
              ))}
            </div>
          )}
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
