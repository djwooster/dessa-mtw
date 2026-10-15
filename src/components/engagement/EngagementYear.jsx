import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { parseISO, format } from 'date-fns'
import { ChevronRight, Maximize2, Minimize2, School } from 'lucide-react'
import { schools, schoolWeeks, NO_SCHOOL_WEEKS, matchesSite } from '../../lib/report2Data'
import { weekBands } from './StackedGoalChart'
import { GOAL } from '../../pages/Report2ConceptE'

// Week by week page (2026-10-15, Version A): every school week of the year, one row per site under an
// All sites row. It is made to be screenshotted and shared with board members, so nothing depends on
// hover: the card states its own title and color key (the subtext with year and filters was removed 2026-10-15). It follows the report's Site and
// Role filters but always shows the whole school year. Three layouts to compare (switched in Nav):
// 'grid' all 36 weeks in one wide grid with numbers, 'halves' Fall and Spring stacked with % numbers,
// 'heat' tinted squares only, 'halves3' and 'halves4' Fall and Spring as a bordered data table in the org blue or gray scale.

// Five steps of the brand teal; the darkest step switches to white text for contrast.
const STEPS = [
  { min: 80, label: '80% or more', cls: 'bg-dessa-teal text-white' },
  { min: 60, label: '60 to 79%', cls: 'bg-dessa-teal/70 text-brand-text' },
  { min: 40, label: '40 to 59%', cls: 'bg-dessa-teal/45 text-brand-text' },
  { min: 20, label: '20 to 39%', cls: 'bg-dessa-teal/25 text-brand-text' },
  { min: 0, label: 'Under 20%', cls: 'bg-dessa-teal/10 text-brand-text' },
]
// Fall and Spring (3) and (4) (2026-10-15): the org palette the user shared (org-primary, org-gray).
// Light steps carry dark text and the top step white text (each pair passes 4.5:1).
const STEPS_3 = [
  { min: 80, label: '80% or more', cls: 'bg-org-primary-600 text-white' },
  { min: 60, label: '60 to 79%', cls: 'bg-org-primary-300 text-brand-text' },
  { min: 40, label: '40 to 59%', cls: 'bg-org-primary-200 text-brand-text' },
  { min: 20, label: '20 to 39%', cls: 'bg-org-primary-100 text-brand-text' },
  { min: 0, label: 'Under 20%', cls: 'bg-org-primary-50 text-brand-text' },
]
const STEPS_4 = [
  { min: 80, label: '80% or more', cls: 'bg-org-gray-600 text-white' },
  { min: 60, label: '60 to 79%', cls: 'bg-org-gray-300 text-brand-text' },
  { min: 40, label: '40 to 59%', cls: 'bg-org-gray-200 text-brand-text' },
  { min: 20, label: '20 to 39%', cls: 'bg-org-gray-100 text-brand-text' },
  { min: 0, label: 'Under 20%', cls: 'bg-org-gray-50 text-brand-text' },
]
// The Fall and Spring table layouts and the scale each one uses.
const TABLE_STEPS = { halves3: STEPS_3, halves4: STEPS_4 }
const stepFor = (pct, steps = STEPS) => steps.find(s => pct >= s.min)
const NO_SCHOOL = 'bg-[repeating-linear-gradient(135deg,theme(colors.brand.border)_0_2px,transparent_2px_6px)]'

const FALL = schoolWeeks.filter(w => w < '2026-01-01')
const SPRING = schoolWeeks.filter(w => w >= '2026-01-01')

// Term illustrations for (4) (2026-10-15): small flat vector drawings in the MTW palette, a two-tone
// maple leaf for Fall and a flower for Spring, shown at 28px. Decorative only.
function FallLeaf({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 15.5 C12.2 18 12.6 20.4 13.4 22.5" className="stroke-mtw-coral" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <g strokeWidth="1.2" strokeLinejoin="round">
        <path d="M12 2 L13.7 5.8 L16.4 4.6 L15.9 8.9 L20.6 7.4 L19.2 10.6 L21.6 11.8 L17.2 14.4 L18 16.4 L12.9 15.6 L12 16.6 L11.1 15.6 L6 16.4 L6.8 14.4 L2.4 11.8 L4.8 10.6 L3.4 7.4 L8.1 8.9 L7.6 4.6 L10.3 5.8 Z" className="fill-mtw-amber stroke-mtw-amber" />
        <path d="M12 2 L13.7 5.8 L16.4 4.6 L15.9 8.9 L20.6 7.4 L19.2 10.6 L21.6 11.8 L17.2 14.4 L18 16.4 L12.9 15.6 L12 16.6 Z" className="fill-mtw-coral stroke-mtw-coral" />
      </g>
      <path d="M12 15 L12 5 M12 13 L18.3 8.6 M12 13 L5.7 8.6 M12 14.4 L16.4 14.6 M12 14.4 L7.6 14.6" className="stroke-white" strokeWidth="0.75" strokeLinecap="round" fill="none" opacity="0.55" />
    </svg>
  )
}

function SpringFlower({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 12 C12 16 12 19 12 22.5" className="stroke-mtw-green" strokeWidth="1.6" strokeLinecap="round" fill="none" />
      <path d="M12 19 C9 19 7.4 17.4 7 15.2 C9.6 15.2 11.5 16.6 12 19 Z" className="fill-mtw-green" />
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a} cx="12" cy="5.8" rx="2.7" ry="3.4" transform={`rotate(${a} 12 9.5)`} className="fill-dessa-salmon" />
      ))}
      {[0, 72, 144, 216, 288].map(a => (
        <ellipse key={a} cx="12" cy="6.8" rx="1.1" ry="1.9" transform={`rotate(${a} 12 9.5)`} className="fill-mtw-coral" opacity="0.35" />
      ))}
      <circle cx="12" cy="9.5" r="2.4" className="fill-mtw-amber" />
      <circle cx="11.2" cy="8.7" r="0.7" className="fill-white" opacity="0.7" />
    </svg>
  )
}

function monthSpans(weeks) {
  const spans = []
  weeks.forEach(w => {
    const m = format(parseISO(w), 'MMM')
    if (spans.length && spans[spans.length - 1].m === m) spans[spans.length - 1].n += 1
    else spans.push({ m, n: 1 })
  })
  return spans
}

function YearGrid({ weeks, rows, variant }) {
  const heat = variant === 'heat'
  const roomy = variant === 'halves'
  const cellW = roomy ? '2.75rem' : '1.5rem'
  return (
    <div className="overflow-x-auto">
      <div
        role="table"
        aria-label="Share of users who met the weekly goal, by site and week"
        className="grid gap-px text-xs tabular-nums"
        style={{ gridTemplateColumns: `minmax(9rem, 12rem) repeat(${weeks.length}, minmax(${cellW}, 1fr))` }}
      >
        {/* Month row, then the Monday each week starts */}
        <div role="presentation" />
        {monthSpans(weeks).map((s, i) => (
          <div key={i} role="presentation" style={{ gridColumn: `span ${s.n}` }} className="pb-1 text-xs font-semibold uppercase tracking-wide text-brand-subtext border-b border-brand-border">{s.m}</div>
        ))}
        <div role="columnheader" className="pt-1 pb-2 text-xs font-medium text-brand-subtext">Week of</div>
        {weeks.map(w => (
          <div key={w} role="columnheader" className={`pt-1 pb-2 text-xs font-medium text-brand-subtext ${heat ? 'text-left' : 'text-center'}`}>
            {format(parseISO(w), 'd')}
          </div>
        ))}

        {rows.map((r, ri) => (
          <Fragment key={r.key}>
            <div role="rowheader" title={r.name} className={`flex items-center min-w-0 pr-3 text-[13px] ${r.total ? 'font-semibold' : ''}`}>
              <span className="truncate">{r.name}</span>
            </div>
            {r.cells.map((c, ci) => {
              const off = NO_SCHOOL_WEEKS.includes(weeks[ci])
              return (
                <div
                  key={weeks[ci]}
                  role="cell"
                  aria-label={off ? 'No school' : `${c.pct}%`}
                  className={`flex items-center justify-center rounded-sm ${heat ? 'h-6' : roomy ? 'h-8' : 'h-7'} ${off ? NO_SCHOOL : stepFor(c.pct).cls} ${r.total ? 'font-semibold' : ''}`}
                >
                  {!heat && !off && (roomy ? `${c.pct}%` : c.pct)}
                </div>
              )
            })}
            {ri === 0 && rows.length > 1 && <div role="presentation" style={{ gridColumn: `1 / -1` }} className="h-px bg-brand-border my-1.5" />}
          </Fragment>
        ))}
      </div>
    </div>
  )
}

// Fall and Spring (3) and (4): a data table first, with a border around the whole table. Each site is its own
// row with a border above it and 1px of room above and below its tiles; every tile shows its % with the sign.
// `refined` turns on the tweaks being tried in (4) only: no row padding, 30px tiles with 3px gaps, a site count and School icon on the
// top row, and darker borders on its tiles.
function YearTable({ weeks, rows, steps, refined = false }) {
  // (4) is a touch tighter: 30px tiles and 3px gaps (4px and 32px elsewhere).
  const gap = refined ? 'gap-x-[3px]' : 'gap-x-1'
  const cols = { gridTemplateColumns: `minmax(9rem, 12rem) repeat(${weeks.length}, minmax(2.75rem, 1fr))` }
  return (
    <div className="overflow-x-auto rounded-lg border border-brand-border">
      <div role="table" aria-label="Share of users who met the weekly goal, by site and week" className="text-xs tabular-nums">
        {/* Header band on brand-bg (2026-10-15) so the months and Week of row stand apart from the data. */}
        <div className="bg-brand-bg/[0.48] pt-2">
          <div role="presentation" className={`grid ${gap} px-3`} style={cols}>
            <div />
            {monthSpans(weeks).map((s, i) => (
              <div key={i} style={{ gridColumn: `span ${s.n}` }} className="pb-1 text-xs font-semibold uppercase tracking-wide text-brand-subtext">{s.m}</div>
            ))}
          </div>
          <div role="row" className={`grid ${gap} px-3`} style={cols}>
            <div role="columnheader" className="pt-1 pb-2 text-xs font-medium text-brand-subtext">Week of</div>
            {weeks.map(w => (
              <div key={w} role="columnheader" className="pt-1 pb-2 text-center text-xs font-medium text-brand-subtext">{format(parseISO(w), 'd')}</div>
            ))}
          </div>
        </div>
        {/* (4) adds the site count to the top row: All sites (20), or Selected sites (3) when sites are picked in Filters. */}
        {rows.map(row => row.total && refined ? { ...row, name: row.allSites ? 'All sites' : 'Selected sites', countText: `(${row.count})` } : row).map(r => (
          <Fragment key={r.key}>
            {/* (4) only (2026-10-15): the All sites % tiles get a darker border. */}
            <div role="row" className={`grid ${gap} px-3 ${refined ? 'py-0' : 'py-px'} border-t border-brand-border ${r.total ? 'bg-brand-bg/[0.48]' : ''}`} style={cols}>
              <div role="rowheader" title={r.name} className={`flex items-center gap-1.5 min-w-0 pr-3 text-[13px] ${r.total ? 'font-semibold' : ''}`}>
                {r.total && refined && <School size={14} className="shrink-0" aria-hidden="true" />}
                <span className="truncate">{r.name}{r.countText && <span className="text-[11px] font-medium text-brand-subtext"> {r.countText}</span>}</span>
              </div>
              {r.cells.map((c, ci) => {
                const off = NO_SCHOOL_WEEKS.includes(weeks[ci])
                return (
                  <div
                    key={weeks[ci]}
                    role="cell"
                    aria-label={off ? 'No school' : `${c.pct}%`}
                    className={`flex items-center justify-center ${refined ? 'h-[30px]' : 'h-8'} rounded-md ${off ? NO_SCHOOL : stepFor(c.pct, steps).cls} ${r.total ? 'font-semibold' : 'font-medium'} ${r.total && refined && !off ? 'border border-org-gray-700' : ''}`}
                  >
                    {!off && `${c.pct}%`}
                  </div>
                )
              })}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  )
}

function Legend({ numbers, steps = STEPS }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-brand-subtext">
      <span>{numbers ? 'Numbers are the % of users who met the goal that week.' : 'Shade shows the % of users who met the goal that week.'}</span>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {[...steps].reverse().map(s => (
          <li key={s.min} className="inline-flex items-center gap-1.5">
            <span className={`h-3 w-4 rounded-sm ${s.cls}`} aria-hidden="true" /> {s.label}
          </li>
        ))}
        <li className="inline-flex items-center gap-1.5">
          <span className={`h-3 w-4 rounded-sm border border-brand-border ${NO_SCHOOL}`} aria-hidden="true" /> No school
        </li>
      </ul>
    </div>
  )
}

export default function EngagementYear({ siteIds = [], role = 'all', layout = 'grid' }) {
  const rows = useMemo(() => {
    const picked = schools.filter(sc => matchesSite(siteIds, sc.id))
    const row = (key, name, scope, total) => ({ key, name, total, cells: schoolWeeks.map(w => weekBands(scope, w, role)) })
    const siteRows = picked.map(sc => row(sc.id, sc.name, sc.id, false)).filter(r => r.cells.some(c => c.total > 0))
    if (siteRows.length === 1) return siteRows
    return [{ ...row('all', siteIds.length ? `${siteIds.length} sites` : 'All sites', siteIds, true), count: siteRows.length, allSites: !siteIds.length }, ...siteRows]
  }, [siteIds, role])
  const pick = weeks => rows.map(r => ({ ...r, cells: weeks.map(w => r.cells[schoolWeeks.indexOf(w)]) }))

  // View fullscreen (2026-10-15): the card alone fills the screen, for a clean screenshot. Esc exits.
  const cardRef = useRef(null)
  const [fullscreen, setFullscreen] = useState(false)
  useEffect(() => {
    const onChange = () => setFullscreen(document.fullscreenElement === cardRef.current)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])
  const toggleFullscreen = () => (fullscreen ? document.exitFullscreen() : cardRef.current?.requestFullscreen())


  return (
    <div className="px-6 pt-4 pb-8">
      <nav aria-label="Breadcrumb" className="mb-8">
        <ol className="flex items-center gap-1.5 text-[13px] text-brand-subtext">
          <li><Link to="/reports/engagement" className="hover:text-brand-text hover:underline transition-colors">Engagement</Link></li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li aria-current="page" className="text-brand-text">Week by week</li>
        </ol>
      </nav>
      <h2 className="text-2xl font-semibold text-brand-text mb-6">Week by week</h2>

      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        ref={cardRef}
        className={`bg-white ${fullscreen ? 'overflow-auto p-8' : 'rounded-xl border border-brand-border p-5'}`}
      >
        <header className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-brand-text">Users completing {GOAL} lessons a week</h3>
          </div>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={fullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            title={fullscreen ? 'Exit fullscreen' : 'View fullscreen'}
            className="inline-flex items-center justify-center w-8 h-8 shrink-0 rounded-md text-brand-subtext hover:bg-brand-bg hover:text-brand-text transition-colors"
          >
            {fullscreen ? <Minimize2 size={16} aria-hidden="true" /> : <Maximize2 size={16} aria-hidden="true" />}
          </button>
        </header>

        {layout === 'halves' || TABLE_STEPS[layout] ? (
          <div className="flex flex-col gap-8">
            {[{ title: 'Fall 2025', weeks: FALL, Icon: FallLeaf }, { title: 'Spring 2026', weeks: SPRING, Icon: SpringFlower }].map(h => (
              <div key={h.title}>
                <p className={`${TABLE_STEPS[layout] ? 'text-base font-bold' : 'text-xs font-semibold uppercase tracking-wide'} flex items-center gap-1 text-brand-text mb-3`}>
                  {/* (4) marks each term with an icon (2026-10-15): a leaf for Fall, a flower for Spring. */}
                  {layout === 'halves4' && <h.Icon className="h-7 w-7 shrink-0" />}
                  {h.title}
                </p>
                {TABLE_STEPS[layout]
                  ? <YearTable weeks={h.weeks} rows={pick(h.weeks)} steps={TABLE_STEPS[layout]} refined={layout === 'halves4'} />
                  : <YearGrid weeks={h.weeks} rows={pick(h.weeks)} variant="halves" />}
              </div>
            ))}
          </div>
        ) : (
          <YearGrid weeks={schoolWeeks} rows={rows} variant={layout} />
        )}

        <div className="mt-5 pt-4 border-t border-brand-border">
          <Legend numbers={layout !== 'heat'} steps={TABLE_STEPS[layout] ?? STEPS} />
        </div>
      </motion.section>
    </div>
  )
}
