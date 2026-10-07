import { useState } from 'react'
import { NavLink, useLocation, useSearchParams, useNavigate } from 'react-router-dom'
import { HelpCircle, Settings, Palette, MessageSquareText, GitCompare, ScrollText, ChevronDown, Check } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { useSiteEngagementConcept } from '../lib/siteEngagementConceptContext'
import { useDceConcept } from '../lib/dceConceptContext'
import { useEngagementConcept } from '../lib/engagementConceptContext'
import { RESOURCES_GRADE_GROUPS } from '../pages/ResourcesAltConcepts'

// Site Engagement report-only concept switcher (2026-09-23) — a dropdown
// rather than the pill-row switcher used elsewhere (Resources, Concept D's
// Rows/Table), per explicit request. Only appears on that one report route;
// unlike the Resources switcher it doesn't stay visible (inertly) on
// unrelated pages. Lettered A/B (not descriptive names) to match every
// other concept comparison in this app — the descriptive name lives in
// `title` (hover tooltip) only, same convention as Nav.jsx's
// RESOURCES_CONCEPTS before it. A is what's live in prod today, kept as the
// baseline so B has something real to be compared against, not a
// replacement for it. More concepts land here as they're built.
const SITE_ENGAGEMENT_CONCEPTS = [
  // Concepts A-D commented out 2026-10-02 (components kept in Report2.jsx's imports list).
  // { value: 'a', label: 'A', title: 'A — Original: single-week snapshot with filters and a sortable table' },
  // { value: 'b', label: 'B', title: 'B — Positive reframe: stat cards, engagement trend, and a site card grid' },
  // { value: 'c', label: 'C', title: 'C — Simplified: % of sites meeting goal, consistency, and a plain table' },
  // { value: 'd', label: 'D', title: 'D — Two-column: the same table plus a consistency-over-time trend card' },
  { value: 'e', label: 'E', title: 'E — Trend-first: range-preset line chart plus a users-meeting-goal table' },
  // F commented out 2026-10-07 (component kept in Report2.jsx's imports list).
  // { value: 'f', label: 'F', title: 'F, Concept E with preset date pills and three summary cards beside the chart' },
]

// Daily Curriculum Engagement concept switcher (2026-10-01), same dropdown
// as Site Engagement's. A is the original page, kept as the baseline.
const DCE_CONCEPTS = [
  { value: 'a', label: 'A', title: 'A, Original: ranked teacher list with expandable calendars' },
  { value: 'b', label: 'B', title: 'B, Today\'s roster: today and days since last lesson, no history' },
  { value: 'c', label: 'C', title: 'C, Needs follow-up: teachers grouped by how long they have been quiet' },
  { value: 'd', label: 'D', title: 'D, Today plus this week: day dots, with a calendar on demand' },
]

// Combined Engagement report concept switcher (2026-10-06). A is the original
// chart; B charts educators who met the goal, stacked with those making progress;
// C is the analytics layout (stat strip plus a 2x2 grid of weekly charts).
const ENGAGEMENT_CONCEPTS = [
  { value: 'a', label: 'A', title: 'A, Original: sites where every educator met the goal (single line)' },
  { value: 'b', label: 'B', title: 'B, Educators who met their weekly goal, stacked with those making progress' },
  { value: 'c', label: 'C', title: 'C, Analytics layout: stat strip and four weekly charts in a grid' },
  { value: 'd', label: 'D', title: 'D, Insights layout: stat cards and a ladder of how often users are engaged' },
]

// ─── Nav ──────────────────────────────────────────────────────────────────────

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Curriculum', to: '/mtw' },
  // Points at /resource-library, not /resources, as of 2026-09-28 — a
  // self-contained clone of the results experience that used to live at
  // /resources. Concept B (DESSA Strategy Library folded into the
  // catalog) won the A/B comparison and is now the only version — see
  // ResourceLibrary.jsx. The Strategies nav item below is commented out
  // accordingly (its content now lives inside this catalog instead). The
  // original /resources page is untouched but has no nav entry anymore;
  // it's reachable only by typing the URL directly, same as /mtw2/mtw4.
  { label: 'Resources', to: '/resource-library' },
  { label: 'Ratings', to: '/class-ratings' },
  { label: 'Reports', to: '/reports' },
  // { label: 'Strategies', to: '/strategies' },
  { label: 'Training', to: '/training' },
]

// Resources-only hover dropdown — the nav-level grade picker, restored
// 2026-09-28 onto the single "Resources" nav item above (previously keyed
// off /resources + Concept D; now unconditional since Concept B is the
// only Resource Library version). Picking a grade seeds ResourceLibrary's
// Grade Level filter via `?grade=`.
const userMenuItems = [
  { label: 'Settings', to: '/settings', icon: Settings },
  { label: 'Brand Guide', to: '/brand', icon: Palette },
  { label: 'User Feedback', to: '/user-feedback', icon: MessageSquareText },
  { label: 'Competitive Analysis', to: '/competitive-analysis', icon: GitCompare },
  { label: 'Process Journal', to: '/process-journal', icon: ScrollText },
]

export default function Nav() {
  const location = useLocation()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { statConcept, setStatConcept } = useSiteEngagementConcept()
  const { dceConcept, setDceConcept } = useDceConcept()
  const { engagementConcept, setEngagementConcept } = useEngagementConcept()
  const [gradeMenuOpen, setGradeMenuOpen] = useState(false)

  function goToGrade(grade) {
    setGradeMenuOpen(false)
    navigate(`/resource-library?grade=${encodeURIComponent(grade)}`)
  }

  return (
    <nav className="bg-white border-b border-brand-border shadow-sm sticky top-0 z-50">
      <div className="px-6 h-14 flex items-center gap-6">

        {/* Logo */}
        <NavLink to="/" className="flex items-center mr-4 flex-shrink-0">
          <img src="/dessa-mtw-logo.svg" alt="DESSA x Move This World" className="h-5 w-auto" />
        </NavLink>

        {/* Nav items */}
        <div className="flex items-center gap-0.5 flex-1">
          {navItems.map((item) =>
            item.to === '/resource-library' ? (
              <div
                key={item.to}
                className="relative"
                onMouseEnter={() => setGradeMenuOpen(true)}
                onMouseLeave={() => setGradeMenuOpen(false)}
              >
                <NavLink
                  to={item.to}
                  className={({ isActive }) =>
                    `flex items-center gap-1 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isActive || gradeMenuOpen
                        ? 'text-dessa-teal bg-dessa-tealLight'
                        : 'text-brand-subtext hover:text-brand-text hover:bg-brand-bg'
                    }`
                  }
                >
                  {item.label}
                  <ChevronDown size={12} className={`transition-transform ${gradeMenuOpen ? 'rotate-180' : ''}`} />
                </NavLink>
                {gradeMenuOpen && (
                  <div className="absolute left-0 top-full pt-1 z-50">
                    <div className="bg-white border border-brand-border rounded-2xl shadow-lg p-6 grid grid-cols-3 gap-8 min-w-[500px]">
                      {RESOURCES_GRADE_GROUPS.map((col) => (
                        <div key={col.label}>
                          <p className="text-xs font-semibold text-brand-text mb-2 whitespace-nowrap">{col.label}</p>
                          <div className="flex flex-col gap-1.5 items-start">
                            {col.grades.map((g) => (
                              <button
                                key={g}
                                type="button"
                                className="text-left text-sm text-brand-subtext hover:text-dessa-teal hover:bg-brand-bg transition-colors rounded-md -mx-1.5 px-1.5 py-0.5"
                                onClick={() => goToGrade(g)}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                      <div className="col-span-3 pt-3 border-t border-brand-border">
                        <button
                          type="button"
                          className="text-left text-sm text-brand-subtext hover:text-dessa-teal hover:bg-brand-bg transition-colors rounded-md -mx-1.5 px-1.5 py-0.5"
                          onClick={() => goToGrade('All Grades')}
                        >
                          Any age
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                title={item.title}
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
            )
          )}

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
          {/* Resource Library A/B switcher — retired 2026-09-28. Concept B
              (DESSA Strategy Library folded into the catalog) was picked
              as the final, only version — see ResourceLibrary.jsx, which
              no longer reads `?libConcept=` at all. Kept commented rather
              than deleted, same treatment as this file's other retired
              switchers.
          {location.pathname === '/resource-library' && (
            <div className="flex items-center rounded-md border border-brand-border overflow-hidden text-xs font-medium shrink-0 mr-1">
              {[{ value: 'a', label: 'A' }, { value: 'b', label: 'B' }].map(({ value, label }, i) => (
                <button
                  key={value}
                  onClick={() => {
                    const next = new URLSearchParams(searchParams)
                    next.set('libConcept', value)
                    setSearchParams(next)
                  }}
                  aria-label={`Resource Library concept ${label}`}
                  className={`px-2.5 py-1 transition-colors ${i > 0 ? 'border-l border-brand-border' : ''} ${
                    (searchParams.get('libConcept') || 'a') === value
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
          {/* Concept D layout switcher (2026-09-18) — Rows vs. the new
              condensed Table, for comparing side by side in manager
              review. Commented out 2026-09-23 per team decision — Table
              won, resultsLayout now hardcodes to 'table' in
              resourcesConceptContext.jsx. Preserved (not deleted) in case
              Rows is worth revisiting later.
          {!location.pathname.startsWith('/mtw') && (
            <div className="flex items-center rounded-md border border-brand-border overflow-hidden text-xs font-medium shrink-0 mr-1">
              {[{ value: 'rows', label: 'Rows' }, { value: 'table', label: 'Table' }].map(({ value, label }, i) => (
                <button
                  key={value}
                  onClick={() => setResultsLayout(value)}
                  className={`px-2.5 py-1 transition-colors ${i > 0 ? 'border-l border-brand-border' : ''} ${
                    resultsLayout === value
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
          {location.pathname === '/reports/site-engagement' && (
            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  title={SITE_ENGAGEMENT_CONCEPTS.find((c) => c.value === statConcept)?.title}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-text hover:bg-brand-bg transition-colors shrink-0 mr-1"
                >
                  {SITE_ENGAGEMENT_CONCEPTS.find((c) => c.value === statConcept)?.label}
                  <ChevronDown size={12} className="text-brand-subtext" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 w-48 bg-white border border-brand-border rounded-xl shadow-lg outline-none py-1.5"
                >
                  {SITE_ENGAGEMENT_CONCEPTS.map((c) => (
                    <button
                      key={c.value}
                      title={c.title}
                      onClick={() => setStatConcept(c.value)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
                        statConcept === c.value ? 'text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                      }`}
                    >
                      {c.label}
                      {statConcept === c.value && <Check size={13} className="text-dessa-teal" />}
                    </button>
                  ))}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}
          {location.pathname === '/reports/dce' && (
            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  title={DCE_CONCEPTS.find((c) => c.value === dceConcept)?.title}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-text hover:bg-brand-bg transition-colors shrink-0 mr-1"
                >
                  {DCE_CONCEPTS.find((c) => c.value === dceConcept)?.label}
                  <ChevronDown size={12} className="text-brand-subtext" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 w-48 bg-white border border-brand-border rounded-xl shadow-lg outline-none py-1.5"
                >
                  {DCE_CONCEPTS.map((c) => (
                    <button
                      key={c.value}
                      title={c.title}
                      onClick={() => setDceConcept(c.value)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
                        dceConcept === c.value ? 'text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                      }`}
                    >
                      {c.label}
                      {dceConcept === c.value && <Check size={13} className="text-dessa-teal" />}
                    </button>
                  ))}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}
          {location.pathname === '/reports/engagement' && (
            <Popover.Root>
              <Popover.Trigger asChild>
                <button
                  title={ENGAGEMENT_CONCEPTS.find((c) => c.value === engagementConcept)?.title}
                  className="flex items-center gap-1.5 px-3 h-9 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-text hover:bg-brand-bg transition-colors shrink-0 mr-1"
                >
                  {ENGAGEMENT_CONCEPTS.find((c) => c.value === engagementConcept)?.label}
                  <ChevronDown size={12} className="text-brand-subtext" />
                </button>
              </Popover.Trigger>
              <Popover.Portal>
                <Popover.Content
                  align="end"
                  sideOffset={6}
                  className="z-50 w-48 bg-white border border-brand-border rounded-xl shadow-lg outline-none py-1.5"
                >
                  {ENGAGEMENT_CONCEPTS.map((c) => (
                    <button
                      key={c.value}
                      title={c.title}
                      onClick={() => setEngagementConcept(c.value)}
                      className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
                        engagementConcept === c.value ? 'text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                      }`}
                    >
                      {c.label}
                      {engagementConcept === c.value && <Check size={13} className="text-dessa-teal" />}
                    </button>
                  ))}
                </Popover.Content>
              </Popover.Portal>
            </Popover.Root>
          )}
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
