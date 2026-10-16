import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useAnimationControls, useInView, useReducedMotion } from 'framer-motion'
import { parseISO, format, addDays } from 'date-fns'
import { ChevronRight, Download, MoreHorizontal, Palette, School } from 'lucide-react'
import { schools, schoolWeeks, NO_SCHOOL_WEEKS, matchesSite, USER_ROLES } from '../../lib/report2Data'
import { weekBands } from './StackedGoalChart'
import { GOAL } from '../../pages/Report2ConceptE'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { useEngagementVersion } from '../../lib/engagementVersionContext'
import FiltersPanel from './FiltersPanel'

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

// Term illustrations for (4) (2026-10-15): small flat vector drawings in the MTW palette, drawn from
// the user's references: a three-lobed leaf for Fall and a six-petal flower for Spring, at 32px so they read at a glance.
// Decorative only.
// Three-lobed leaf after the user's simpler reference: a large top lobe, a left lobe and a lower right lobe
// in burnt orange (coral laid over amber), with darker veins that fan from one point into the stem.
function LeafLobes() {
  return (
    <>
      <ellipse cx="14.6" cy="8.4" rx="4.3" ry="6.6" transform="rotate(38 14.6 8.4)" />
      <ellipse cx="7.4" cy="10.6" rx="3.2" ry="5.1" transform="rotate(-12 7.4 10.6)" />
      <ellipse cx="14" cy="15.8" rx="3" ry="5.4" transform="rotate(78 14 15.8)" />
      <circle cx="10.2" cy="13.6" r="3.4" />
    </>
  )
}
const LEAF_VEINS = 'M5.4 21.4 L8.8 16.2 C10.8 13 14 8.6 17.2 4.6 M8.8 16.2 C8 13.8 7.1 11 6.6 8.2 M8.8 16.2 C11 16.4 13.6 16.2 16.6 15.4 M11.4 12.4 C11.4 10.8 11.6 9.4 12 8.2 M12.6 10.8 C14.2 10.6 15.4 10.2 16.6 9.6'

function FallLeaf({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g className="fill-mtw-amber"><LeafLobes /></g>
      <g className="fill-mtw-coral" opacity="0.7"><LeafLobes /></g>
      <g strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" fill="none">
        <path d={LEAF_VEINS} className="stroke-mtw-coral" />
        <path d={LEAF_VEINS} className="stroke-brand-text" opacity="0.2" />
      </g>
    </svg>
  )
}

// Six rounded petals pinched at the base (slight size and angle variation so it feels hand drawn), a lighter
// inner layer, and a dark star of stamens with white dots, after the user's yellow flower reference.
const PETAL = 'M12 12 C11 10.9 8.4 8 8.6 5 C8.8 2.7 10.5 1.4 12 1.4 C13.5 1.4 15.2 2.7 15.4 5 C15.6 8 13 10.9 12 12 Z'
const PETALS = [[12, 1], [70, 0.95], [133, 1], [194, 0.97], [251, 1], [312, 0.94]]
const petalAt = (a, k) => `rotate(${a} 12 12) translate(12 12) scale(${k}) translate(-12 -12)`

function SpringFlower({ className = '' }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      {PETALS.map(([a, k]) => <path key={a} d={PETAL} transform={petalAt(a, k)} className="fill-mtw-amber" />)}
      <g className="fill-white" opacity="0.4">
        {PETALS.map(([a]) => <path key={a} d={PETAL} transform={petalAt(a, 0.56)} />)}
      </g>
      {[0, 40, 80, 120, 160, 200, 240, 280, 320].map(a => (
        <ellipse key={a} cx="12" cy="10.2" rx="0.55" ry="1.4" transform={`rotate(${a} 12 12)`} className="fill-brand-text" />
      ))}
      <circle cx="12" cy="12" r="1.05" className="fill-brand-text" />
      {[[11.6, 11.7], [12.45, 11.85], [11.9, 12.45]].map(([x, y]) => <circle key={x} cx={x} cy={y} r="0.27" className="fill-white" />)}
    </svg>
  )
}

// Term heading for (4) (2026-10-15): the illustration gives a quick wave the first time it scrolls into view,
// and again whenever the heading is hovered. It sways from its base like a leaf on a breeze. Skipped when
// the viewer prefers reduced motion.
function TermTitle({ title, Icon, className }) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, amount: 0.8 })
  const controls = useAnimationControls()
  const reduce = useReducedMotion()
  const wave = () => {
    if (reduce) return
    controls.start({ rotate: [0, -14, 10, -6, 3, 0], transition: { duration: 0.9, ease: 'easeInOut' } })
  }
  useEffect(() => { if (inView) wave() }, [inView])
  return (
    <motion.p onHoverStart={wave} className={className}>
      <motion.span ref={ref} animate={controls} style={{ originX: 0.5, originY: 0.85 }} className="inline-flex shrink-0">
        <Icon className="h-8 w-8" />
      </motion.span>
      {title}
    </motion.p>
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

// YTD concept (2026-10-16, manager feedback; first called Fall and Spring (5)): a plain table, year to date. No terms, no tiles or
// colors. It uses the real date: the mock 2025-26 weeks are moved forward 52 weeks (to the 2026-27 school
// year, starting Aug 31) and only weeks that have started by today are shown, newest first, with winter
// break left out. YTD is the plain average of the weekly %s. Site and YTD stay pinned when the weeks scroll.
const YTD_SHIFT_DAYS = 364
// Opaque version of the 48% brand-bg tint, for pinned cells that sit over scrolled content.
const TINT = 'bg-white bg-[linear-gradient(theme(colors.brand.bg/48%),theme(colors.brand.bg/48%))]'

// "2026 to 2027 school year", from the first school week (moved by `shiftDays`).
function schoolYearText(shiftDays) {
  const y = addDays(parseISO(schoolWeeks[0]), shiftDays).getFullYear()
  return `${y} to ${y + 1} school year`
}

// The weeks that count toward YTD, newest first. The end of year preview (2026-10-16) pretends today is the
// last week of the school year.
function ytdWeeks(endOfYear) {
  const today = endOfYear ? addDays(parseISO(schoolWeeks[schoolWeeks.length - 1]), YTD_SHIFT_DAYS + 4) : new Date()
  return schoolWeeks
    .map((w, i) => ({ i, date: addDays(parseISO(w), YTD_SHIFT_DAYS), off: NO_SCHOOL_WEEKS.includes(w) }))
    .filter(w => !w.off && w.date <= today)
    .reverse()
}
const ytdAvg = (r, weeks, k = 'pct') => weeks.length ? Math.round(weeks.reduce((sum, w) => sum + r.cells[w.i][k], 0) / weeks.length) : 0

// `heat` (2026-10-16) shades every % cell with the org gray scale from Fall and Spring (4); the counts in the
// drill down stay plain.
function YtdTable({ rows, endOfYear = false, heat = false }) {
  const weeks = useMemo(() => ytdWeeks(endOfYear), [endOfYear])
  const avgOf = (r, k) => ytdAvg(r, weeks, k)
  const ytd = r => avgOf(r, 'pct')
  // Drill down (2026-10-16): opening a site adds its weekly Users and Met goal rows under it (% met was removed,
  // it repeated the site row). The YTD column shows their weekly averages.
  const [open, setOpen] = useState(() => new Set())
  const toggle = key => setOpen(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })
  const DETAILS = [
    { label: 'Users', ytd: r => avgOf(r, 'total'), week: c => c.total },
    { label: 'Met goal', ytd: r => avgOf(r, 'met'), week: c => c.met },
  ]
  // Pinned columns draw their right line as an inset shadow so it stays put while the weeks scroll under them.
  const pinLine = 'border-r-0 shadow-[inset_-1px_0_0_theme(colors.brand.border)]'
  // The YTD column also casts a slight shadow to its right (2026-10-16), marking where the weeks start: an 8px
  // gradient strip hung off the pinned cell, so it shows over the week cells whatever the table's border model.
  const ytdEdge = `${pinLine} after:absolute after:top-0 after:bottom-0 after:left-full after:w-2 after:pointer-events-none after:bg-gradient-to-r after:from-brand-text/[0.14] after:to-transparent`
  const site = 'sticky left-0 z-10 w-56 min-w-56'
  const avg = 'sticky left-56 z-10 w-16 min-w-16 text-right'
  const num = 'text-right tabular-nums'
  // Week columns share one width, never under 75px; past that the table scrolls with Site and YTD pinned.
  const weekCol = 'w-[75px] min-w-[75px]'
  // Tighter than the shared table (2026-10-16): 28px header, 6px by 10px cells, with column lines.
  const lines = 'border-r border-brand-border last:border-r-0'
  const head = `h-7 px-2.5 text-[13px] font-medium ${lines}`
  const cell = `px-2.5 py-1.5 text-[13px] ${lines}`

  return (
    <div className="rounded-lg border border-brand-border overflow-hidden">
      <Table>
        <TableHeader className="bg-transparent">
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${site} ${TINT} ${head} ${pinLine}`}>Site</TableHead>
            <TableHead className={`${avg} ${TINT} ${head} ${ytdEdge}`}>YTD</TableHead>
            {weeks.map(w => (
              <TableHead key={w.i} className={`${num} ${TINT} ${head} ${weekCol}`}>{format(w.date, 'MMM d')}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => {
            const bg = r.total ? TINT : 'bg-white'
            const isOpen = open.has(r.key)
            const name = r.total ? (r.allSites ? 'All sites' : 'Selected sites') : r.name
            return (
              <Fragment key={r.key}>
                <TableRow className="hover:bg-transparent">
                  <TableCell className={`${site} ${bg} ${cell} ${pinLine} ${r.total ? 'font-semibold' : ''}`}>
                    <button
                      type="button"
                      onClick={() => toggle(r.key)}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Hide' : 'Show'} weekly numbers for ${name}`}
                      className={`group flex items-center gap-1.5 w-full min-w-0 text-left rounded-sm ${r.total ? 'hover:text-dessa-teal transition-colors' : 'text-[#134fb2]'}`}
                    >
                      <ChevronRight size={14} className={`shrink-0 text-brand-subtext transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
                      {r.total && <School size={14} className="shrink-0" aria-hidden="true" />}
                      {/* Site names use the report's link blue (2026-10-16); All sites stays navy. */}
                      <span className={`truncate ${r.total ? '' : 'group-hover:underline'}`}>
                        {name}
                        {r.total && <span className="text-[11px] font-medium text-brand-subtext"> ({r.count})</span>}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className={`${avg} ${heat ? stepFor(ytd(r), STEPS_4).cls : bg} ${num} ${cell} ${ytdEdge} font-semibold`}>{ytd(r)}%</TableCell>
                  {weeks.map(w => (
                    <TableCell key={w.i} className={`${num} ${heat ? stepFor(r.cells[w.i].pct, STEPS_4).cls : bg} ${cell} ${r.total ? 'font-semibold' : ''}`}>{r.cells[w.i].pct}%</TableCell>
                  ))}
                </TableRow>
                {isOpen && DETAILS.map(d => (
                  <TableRow key={d.label} className="hover:bg-transparent">
                    <TableCell className={`${site} bg-white ${cell} ${pinLine} pl-8 text-brand-text`}>{d.label}</TableCell>
                    <TableCell className={`${avg} bg-white ${num} ${cell} ${ytdEdge}`}>{d.ytd(r)}</TableCell>
                    {weeks.map(w => (
                      <TableCell key={w.i} className={`${num} bg-white ${cell}`}>{d.week(r.cells[w.i])}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function Legend({ numbers, steps = STEPS, noSchool = true }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-brand-subtext">
      <span>{numbers ? 'Numbers are the % of users who met the goal that week.' : 'Shade shows the % of users who met the goal that week.'}</span>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {[...steps].reverse().map(s => (
          <li key={s.min} className="inline-flex items-center gap-1.5">
            <span className={`h-3 w-4 rounded-sm ${s.cls}`} aria-hidden="true" /> {s.label}
          </li>
        ))}
        {noSchool && (
          <li className="inline-flex items-center gap-1.5">
            <span className={`h-3 w-4 rounded-sm border border-brand-border ${NO_SCHOOL}`} aria-hidden="true" /> No school
          </li>
        )}
      </ul>
    </div>
  )
}

export default function EngagementYear({ siteIds: reportSiteIds = [], role: reportRole = 'all', layout = 'grid' }) {
  // Filters on the YTD view (2026-10-16): Site and User role, applied with Apply like the main report. They
  // start from the report's filters and only change this page. No dates, since YTD is a fixed period.
  const startFilters = { site: reportSiteIds.map(String), role: reportRole }
  const [draft, setDraft] = useState(startFilters)
  const [applied, setApplied] = useState(startFilters)
  const siteIds = useMemo(() => applied.site.map(Number), [applied])
  const role = applied.role
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  useEffect(() => {
    if (!menuOpen) return
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])
  const rows = useMemo(() => {
    const picked = schools.filter(sc => matchesSite(siteIds, sc.id))
    const row = (key, name, scope, total) => ({ key, name, total, cells: schoolWeeks.map(w => weekBands(scope, w, role)) })
    const siteRows = picked.map(sc => row(sc.id, sc.name, sc.id, false)).filter(r => r.cells.some(c => c.total > 0))
    if (siteRows.length === 1) return siteRows
    return [{ ...row('all', siteIds.length ? `${siteIds.length} sites` : 'All sites', siteIds, true), count: siteRows.length, allSites: !siteIds.length }, ...siteRows]
  }, [siteIds, role])
  const pick = weeks => rows.map(r => ({ ...r, cells: weeks.map(w => r.cells[schoolWeeks.indexOf(w)]) }))

  const { ytdPreview: preview } = useEngagementVersion()
  const [heat, setHeat] = useState(false)
  // Export CSV (YTD view): one row per site under All sites, with YTD then each week, as on screen.
  function exportCsv() {
    const weeks = ytdWeeks(preview === 'end')
    const head = ['Site', 'YTD', ...weeks.map(w => format(w.date, 'MMM d yyyy'))].map(v => `"${v}"`).join(',')
    const lines = rows.map(r => {
      const name = r.total ? `${r.allSites ? 'All sites' : 'Selected sites'} (${r.count})` : r.name
      return [`"${name}"`, `${ytdAvg(r, weeks)}%`, ...weeks.map(w => `${r.cells[w.i].pct}%`)].join(',')
    })
    const url = URL.createObjectURL(new Blob([`${head}\n${lines.join('\n')}`], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'engagement-year-to-date.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // The YTD view's 3-dot menu (Export CSV) lives in the Filters panel's title row (2026-10-16).
  const menu = (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="More options"
        aria-expanded={menuOpen}
        className="flex items-center justify-center w-8 h-8 rounded-md text-brand-text hover:bg-brand-bg transition-colors"
      >
        <MoreHorizontal size={13} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-brand-border rounded-lg shadow-lg z-20 overflow-hidden py-1">
          <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors" onClick={() => { exportCsv(); setMenuOpen(false) }}>
            <Download size={13} className="text-brand-subtext" /> Export CSV
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="px-6 pt-4 pb-8">
      <nav aria-label="Breadcrumb" className="mb-5">
        <ol className="flex items-center gap-1.5 text-[13px] text-brand-subtext">
          <li><Link to="/reports/engagement" className="hover:text-brand-text hover:underline transition-colors">Engagement</Link></li>
          <li aria-hidden="true"><ChevronRight size={12} /></li>
          <li aria-current="page" className="text-brand-text">Year to date</li>
        </ol>
      </nav>
      <div className="mb-3">
        <h2 className="text-2xl font-semibold text-brand-text">Year to date</h2>
        {/* School year under the title (2026-10-16). YTD runs on the shifted 2026 to 2027 weeks; the other layouts show the mock 2025 to 2026 year. */}
        <p className="text-base text-brand-subtext mt-1">{schoolYearText(layout === 'halves5' ? YTD_SHIFT_DAYS : 0)}</p>
      </div>

      {layout === 'halves5' && (
        <FiltersPanel
          draft={draft}
          onChange={setDraft}
          onApply={() => setApplied(draft)}
          onReset={() => { const all = { site: [], role: 'all' }; setDraft(all); setApplied(all) }}
          sites={schools}
          roles={USER_ROLES}
          showDates={false}
          action={menu}
        />
      )}

      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="rounded-xl border border-brand-border bg-white p-5"
      >
        <header className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-brand-text">Users completing {GOAL} lessons a week</h3>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Heat map toggle (YTD view, 2026-10-16): shades the % cells; the color key shows under the table while it's on. */}
            {layout === 'halves5' && (
              <button
                type="button"
                onClick={() => setHeat(h => !h)}
                aria-pressed={heat}
                className={`inline-flex items-center gap-1.5 h-8 px-3 shrink-0 rounded-md border text-[13px] font-medium transition-colors ${heat ? 'border-dessa-teal bg-dessa-tealLight text-dessa-teal' : 'border-brand-border bg-white text-brand-text hover:bg-brand-bg'}`}
              >
                <Palette size={14} className={heat ? 'text-dessa-teal' : 'text-brand-subtext'} aria-hidden="true" /> Heat map
              </button>
            )}
          </div>
        </header>

        {layout === 'halves5' ? (
          <YtdTable rows={rows} endOfYear={preview === 'end'} heat={heat} />
        ) : layout === 'halves' || TABLE_STEPS[layout] ? (
          <div className="flex flex-col gap-8">
            {[{ title: 'Fall 2025', weeks: FALL, Icon: FallLeaf }, { title: 'Spring 2026', weeks: SPRING, Icon: SpringFlower }].map(h => (
              <div key={h.title}>
                {/* (4) marks each term with an illustration (2026-10-15): a leaf for Fall, a flower for Spring. */}
                {layout === 'halves4' ? (
                  <TermTitle title={h.title} Icon={h.Icon} className="flex items-center gap-1 w-fit text-sm font-medium text-brand-text mb-3" />
                ) : (
                  <p className={`${TABLE_STEPS[layout] ? 'text-sm font-medium' : 'text-xs font-semibold uppercase tracking-wide'} text-brand-text mb-3`}>{h.title}</p>
                )}
                {TABLE_STEPS[layout]
                  ? <YearTable weeks={h.weeks} rows={pick(h.weeks)} steps={TABLE_STEPS[layout]} refined={layout === 'halves4'} />
                  : <YearGrid weeks={h.weeks} rows={pick(h.weeks)} variant="halves" />}
              </div>
            ))}
          </div>
        ) : (
          <YearGrid weeks={schoolWeeks} rows={rows} variant={layout} />
        )}

        {(layout !== 'halves5' || heat) && (
          <div className="mt-5 pt-4 border-t border-brand-border">
            <Legend numbers={layout !== 'heat'} steps={layout === 'halves5' ? STEPS_4 : TABLE_STEPS[layout] ?? STEPS} noSchool={layout !== 'halves5'} />
          </div>
        )}
      </motion.section>
    </div>
  )
}
