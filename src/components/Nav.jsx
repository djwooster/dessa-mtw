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
      <div className="px-6 h-14 flex items-center gap-6">

        {/* Logo */}
        <NavLink to="/" className="flex items-center mr-4 flex-shrink-0">
          <img src="/dessa-mtw-logo.svg" alt="DESSA x Move This World" className="h-5 w-auto" />
        </NavLink>

        {/* Nav items */}
        <div className="flex items-center gap-0.5 flex-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                `px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-dessa-teal bg-dessa-tealLight'
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
              originally compared four ways to show Program Admins which
              sites have customized their weekly goal (AP-4933). A (inline
              table) and B (side drawer) were frozen 2026-09-02 — kept below,
              commented out, only as evidence of process. The live
              comparison is now C vs. D: both render the same full-roster
              table (search + bulk-select + pagination), C inline in the
              page and D in a centered modal. See the block comment above
              GoalPicker in CurriculumSetup.jsx. */}
          {/* Commented out 2026-09-09 — C vs. D comparison concluded, Concept
              C is the settled design, so the switcher no longer needs to be
              user-facing. adminConcept still defaults to 'c' in
              CurriculumSetup.jsx, so nothing about the rendered page changes.
          {location.pathname === '/settings/curriculum-setup' && (
            <select
              value={searchParams.get('adminConcept') || 'c'}
              onChange={(e) => {
                const next = new URLSearchParams(searchParams)
                next.set('adminConcept', e.target.value)
                setSearchParams(next)
              }}
              className="ml-2 h-7 pl-2 pr-6 text-xs font-medium border border-brand-border rounded-md bg-white text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            >
              <option value="c">C — Report table</option>
              <option value="d">D — Modal</option>
            </select>
          )}
          */}

          {/* Adult Wellness lesson-only design-review toggle — retired
              2026-09-09 (Concept C confirmed as the pattern for every
              Adult Wellness lesson; LessonView.jsx now hardcodes
              calloutConcept = "c" rather than reading `?calloutConcept=`).
              Kept commented rather than deleted, same treatment as this
              file's other retired concepts, in case this comparison needs
              to be revisited.
          Compared three ways to surface the Independent/Group practice-type
          callout higher on the page (stakeholder feedback was that it "felt
          lost" below the video): A moved the existing box above the video, B
          swapped it for a compact pill + one-line description on the title
          row, C baked a badge directly into the video/audio hero. See
          PracticeTypeCallout/PracticeTypeInline/PracticeTypeBadge in
          LessonView.jsx.
          {location.pathname === '/mtw/lesson' && location.state?.course?.grade === 'Adult Wellness' && (
            <div className="flex items-center rounded-md border border-brand-border overflow-hidden text-xs font-medium shrink-0 ml-2">
              {[
                { value: 'a', label: 'A', title: 'A — Callout above video' },
                { value: 'b', label: 'B', title: 'B — Title row badge' },
                { value: 'c', label: 'C', title: 'C — Badge in video hero' },
              ].map(({ value, label, title }, i) => (
                <button
                  key={value}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.set('calloutConcept', value)
                    setSearchParams(next, { state: location.state })
                  }}
                  title={title}
                  aria-label={title}
                  className={`px-2 py-1 transition-colors ${i > 0 ? 'border-l border-brand-border' : ''} ${
                    (searchParams.get('calloutConcept') || 'a') === value
                      ? 'bg-dessa-teal text-white'
                      : 'text-brand-subtext hover:bg-brand-bg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
          */}
        </div>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* Lesson View-only design-review toggle (revived 2026-09-08 to add
              a 4th "Search within a course" concept on top of the earlier
              A/B/C comparison — see the corresponding revived block in
              LessonView.jsx). Comparing lesson-search mechanisms: A is the
              always-visible sidebar box (highlights matches in place); B
              swaps that box for a sidebar trigger ("Search inside this
              course") that opens a full command-palette-style overlay; C
              drops the sidebar element entirely in favor of a fixed
              bottom-right pill button that opens that same overlay. */}
          {location.pathname === '/mtw/lesson' && (
            <div className="flex items-center rounded-md border border-brand-border overflow-hidden text-xs font-medium shrink-0 mr-1">
              {['a', 'b', 'c'].map((value, i) => (
                <button
                  key={value}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.set('searchConcept', value)
                    setSearchParams(next, { state: location.state })
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
              <button className="text-brand-subtext hover:text-brand-text transition-colors p-1.5 rounded hover:bg-brand-bg">
                <Settings size={16} />
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
