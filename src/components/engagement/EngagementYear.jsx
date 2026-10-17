import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, useAnimationControls, useInView, useReducedMotion } from 'framer-motion'
import { parseISO, format, addDays } from 'date-fns'
import { Calendar, ChevronRight, Download, Palette, Printer, School } from 'lucide-react'
import { schools, schoolWeeks, NO_SCHOOL_WEEKS, matchesSite, USER_ROLES } from '../../lib/report2Data'
import { weekBands } from './StackedGoalChart'
import { GOAL, SearchField } from '../../pages/Report2ConceptE'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { useEngagementVersion } from '../../lib/engagementVersionContext'
import FiltersPanel from './FiltersPanel'
import GoalBanner from './GoalBanner'
import { PaginationBar } from '../ui/pagination'

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
// YTD heat map (2026-10-16): four bands of the DESSA teal, split at quarters to match the chart's 25% gridlines.
// Only the full teal band carries white text; the lighter bands keep dark text (each pair passes 4.5:1).
const STEPS_HEAT = [
  { min: 75, label: '75% or more', cls: 'bg-dessa-teal text-white' },
  { min: 50, label: '50 to 74%', cls: 'bg-dessa-teal/60 text-brand-text' },
  { min: 25, label: '25 to 49%', cls: 'bg-dessa-teal/30 text-brand-text' },
  { min: 0, label: 'Under 25%', cls: 'bg-dessa-teal/10 text-brand-text' },
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

// `fmt` (2026-10-16): the YTD table adds the year, as in "Oct 2026".
function monthSpans(weeks, fmt = 'MMM') {
  const spans = []
  weeks.forEach(w => {
    const m = format(parseISO(w), fmt)
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
const ytdRowName = r => r.total ? `${r.allSites ? 'All sites' : 'Selected sites'} (${r.count})` : r.name

// Print layout for the YTD view (2026-10-16), the same letterhead as the Engagement print (PrintReport), on a
// landscape page. Every site prints, not just the current page. The weeks go in blocks of 12, newest first,
// each repeating Site and YTD so a block reads on its own. With the heat map on, the bands print too.
const PRINT_WEEKS = 12
function YtdPrint({ rows, weeks, heat, schoolYear }) {
  const blocks = []
  for (let i = 0; i < weeks.length; i += PRINT_WEEKS) blocks.push(weeks.slice(i, i + PRINT_WEEKS))
  const blockLabel = b => {
    const from = b[b.length - 1].date
    const to = b[0].date
    return from.getFullYear() === to.getFullYear()
      ? `Weeks of ${format(from, 'MMM d')} to ${format(to, 'MMM d, yyyy')}`
      : `Weeks of ${format(from, 'MMM d, yyyy')} to ${format(to, 'MMM d, yyyy')}`
  }
  const shade = pct => heat ? stepFor(pct, STEPS_HEAT).cls : ''
  return createPortal(
    <div className="print-report print-landscape text-brand-text" style={{ width: '9.8in' }}>
      <header className="flex items-end justify-between border-b-2 border-dessa-teal pb-4 mb-6">
        <div>
          <img src="/dessa-mtw-logo.svg" alt="DESSA x Move This World" className="h-6 w-auto mb-4" />
          <h1 className="text-3xl font-semibold leading-tight">Year to date</h1>
        </div>
        <div className="text-right text-xs text-brand-subtext leading-5">
          <p><span className="font-semibold text-brand-text">{schoolYear}</span></p>
          <p>Goal: {GOAL} lessons per week</p>
          <p>Generated {format(new Date(), 'MMM d, yyyy')}</p>
        </div>
      </header>
      <h2 className="text-base font-semibold mb-4">Users completing {GOAL} lessons a week</h2>
      {blocks.map((b, bi) => (
        <section key={bi} className={bi ? 'mt-8' : ''}>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-subtext mb-2">{blockLabel(b)}</p>
          <table className="w-full text-[11px] tabular-nums border-collapse">
            <thead>
              <tr className="border-b border-brand-text">
                <th className="py-1.5 pr-2 text-left font-semibold">Site</th>
                <th className="py-1.5 px-1.5 text-right font-semibold">YTD</th>
                {b.map(w => <th key={w.i} className="py-1.5 px-1.5 text-right font-semibold whitespace-nowrap">{format(w.date, 'MMM d')}</th>)}
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.key} className="border-b border-brand-border print-avoid-break">
                  <td className={`py-1.5 pr-2 ${r.total ? 'font-semibold' : ''}`}>{ytdRowName(r)}</td>
                  <td className={`py-1.5 px-1.5 text-right font-semibold ${shade(ytdAvg(r, weeks))}`}>{ytdAvg(r, weeks)}%</td>
                  {b.map(w => <td key={w.i} className={`py-1.5 px-1.5 text-right ${r.total ? 'font-semibold' : ''} ${shade(r.cells[w.i].pct)}`}>{r.cells[w.i].pct}%</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      {heat && (
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-6 text-[11px] text-brand-subtext print-avoid-break">
          {STEPS_HEAT.map(st => (
            <li key={st.label} className="flex items-center gap-1.5"><span className={`h-3 w-4 rounded-sm ${st.cls}`} aria-hidden="true" />{st.label}</li>
          ))}
        </ul>
      )}
      <footer className="print-footer text-[11px] text-brand-subtext">
        <span>Move This World and DESSA, Riverside Insights</span>
        <span>Year to date, {schoolYear}</span>
      </footer>
    </div>,
    document.body
  )
}

// `heat` (2026-10-16) shades every % cell in DESSA teal (STEPS_HEAT); the counts in the
// drill down stay plain.
function YtdTable({ rows, endOfYear = false, heat = false, searching = false }) {
  const weeks = useMemo(() => ytdWeeks(endOfYear), [endOfYear])
  const avgOf = (r, k) => ytdAvg(r, weeks, k)
  const ytd = r => avgOf(r, 'pct')
  // Drill down (2026-10-16): opening a site adds its weekly Total users and Users who met the goal rows under it (% met was removed,
  // it repeated the site row). The YTD column shows their weekly averages.
  const [open, setOpen] = useState(() => new Set())
  const toggle = key => setOpen(prev => {
    const next = new Set(prev)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    return next
  })
  const DETAILS = [
    { label: 'Total users', ytd: r => avgOf(r, 'total'), week: c => c.total },
    { label: 'Users who met the goal', ytd: r => avgOf(r, 'met'), week: c => c.met },
  ]
  // Pinned columns draw their right line as an inset shadow so it stays put while the weeks scroll under them.
  const pinLine = 'border-r-0 shadow-[inset_-1px_0_0_theme(colors.brand.border)]'
  const site = 'sticky left-0 z-10 w-56 min-w-56'
  const avg = 'sticky left-56 z-10 w-16 min-w-16 text-right'
  const num = 'text-right tabular-nums'
  // Week columns share one width, never under 75px; past that the table scrolls with Site and YTD pinned.
  const weekCol = 'w-[75px] min-w-[75px]'
  // Tighter than the shared table (2026-10-16): 28px header, 6px by 10px cells, with column lines.
  const lines = 'border-r border-brand-border last:border-r-0'
  const head = `h-7 px-2.5 text-[13px] font-medium ${lines}`
  const cell = `px-2.5 py-1.5 text-[13px] ${lines}`
  // Pagination (2026-10-16): the shared bar, 10 sites a page by default. All sites stays on top of every page,
  // and any change to the rows (filters, search) goes back to page 1.
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const totalRow = rows.find(r => r.total)
  const siteRows = rows.filter(r => !r.total)
  useEffect(() => { setPage(1) }, [rows])
  const pageRows = [...(totalRow ? [totalRow] : []), ...siteRows.slice((page - 1) * pageSize, page * pageSize)]

  return (
    <div className="rounded-lg border border-brand-border overflow-hidden">
      <Table>
        <TableHeader className="bg-transparent">
          {/* Month band (2026-10-16), as in Fall and Spring: "Week of" over Site and YTD, each month spanning its weeks,
              so the dates below read as the week each column starts. */}
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${site} ${TINT} ${head} ${pinLine} text-xs font-medium text-brand-subtext`}>Week of</TableHead>
            <TableHead className={`${avg} ${TINT} ${head} ${pinLine}`} aria-hidden="true" />
            {monthSpans(weeks.map(w => format(w.date, 'yyyy-MM-dd')), 'MMM yyyy').map((s, i) => (
              <TableHead key={i} colSpan={s.n} className={`${TINT} ${head} text-xs font-semibold uppercase tracking-wide text-brand-subtext`}>{s.m}</TableHead>
            ))}
          </TableRow>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${site} ${TINT} ${head} ${pinLine}`}>Site</TableHead>
            <TableHead className={`${avg} ${TINT} ${head} ${pinLine}`}>YTD</TableHead>
            {weeks.map(w => (
              <TableHead key={w.i} className={`${num} ${TINT} ${head} ${weekCol}`}>{format(w.date, 'MMM d')}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {pageRows.map(r => {
            // The whole row opens the drill down (2026-10-16), with a hover shade on every cell but heat map ones.
            const bg = `${r.total ? TINT : 'bg-white'} group-hover/row:bg-brand-bg`
            const isOpen = open.has(r.key)
            const name = r.total ? (r.allSites ? 'All sites' : 'Selected sites') : r.name
            return (
              <Fragment key={r.key}>
                <TableRow onClick={() => toggle(r.key)} className="group/row cursor-pointer hover:bg-transparent">
                  <TableCell className={`${site} ${bg} ${cell} ${pinLine} ${r.total ? 'font-semibold' : ''}`}>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); toggle(r.key) }}
                      aria-expanded={isOpen}
                      aria-label={`${isOpen ? 'Hide' : 'Show'} weekly numbers for ${name}`}
                      className="flex items-center gap-1.5 w-full min-w-0 text-left rounded-sm"
                    >
                      <ChevronRight size={14} className={`shrink-0 text-brand-subtext transition-transform duration-150 ${isOpen ? 'rotate-90' : ''}`} aria-hidden="true" />
                      {r.total && <School size={14} className="shrink-0" aria-hidden="true" />}
                      {/* Plain table text (2026-10-16): site names are no longer link blue, since the row opens the drill down. */}
                      <span className="truncate">
                        {name}
                        {r.total && <span className="text-[11px] font-medium text-brand-subtext"> ({r.count})</span>}
                      </span>
                    </button>
                  </TableCell>
                  <TableCell className={`${avg} ${heat ? stepFor(ytd(r), STEPS_HEAT).cls : bg} ${num} ${cell} ${pinLine} font-semibold`}>{ytd(r)}%</TableCell>
                  {weeks.map(w => (
                    <TableCell key={w.i} className={`${num} ${heat ? stepFor(r.cells[w.i].pct, STEPS_HEAT).cls : bg} ${cell} ${r.total ? 'font-semibold' : ''}`}>{r.cells[w.i].pct}%</TableCell>
                  ))}
                </TableRow>
                {isOpen && DETAILS.map(d => (
                  <TableRow key={d.label} className="hover:bg-transparent">
                    <TableCell className={`${site} bg-white ${cell} ${pinLine} pl-8 text-brand-text`}>{d.label}</TableCell>
                    <TableCell className={`${avg} bg-white ${num} ${cell} ${pinLine}`}>{d.ytd(r)}</TableCell>
                    {weeks.map(w => (
                      <TableCell key={w.i} className={`${num} bg-white ${cell}`}>{d.week(r.cells[w.i])}</TableCell>
                    ))}
                  </TableRow>
                ))}
              </Fragment>
            )
          })}
          {searching && !rows.some(r => !r.total) && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={weeks.length + 2} className="py-6 text-center text-[13px] text-brand-subtext">No sites match your search.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PaginationBar page={page} pageSize={pageSize} total={siteRows.length} onPage={setPage} onPageSize={n => { setPageSize(n); setPage(1) }} className="px-4 py-3 border-t border-brand-border" />
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

// `embedded` (2026-10-16): the Engagement page's Table tab shows this in place, under its own title and goal banner.
export default function EngagementYear({ siteIds: reportSiteIds = [], role: reportRole = 'all', layout = 'grid', lockedSiteId = null, embedded = false }) {
  // Filters on the YTD view (2026-10-16): Site and User role, applied with Apply like the main report. They
  // start from the report's filters and only change this page. No dates, since YTD is a fixed period.
  // A Site Leader (`lockedSiteId`, 2026-10-16) sees only their site, with no Site filter.
  const lockedSite = lockedSiteId ? [String(lockedSiteId)] : null
  const startFilters = { site: lockedSite ?? reportSiteIds.map(String), role: reportRole }
  const [draft, setDraft] = useState(startFilters)
  const [applied, setApplied] = useState(startFilters)
  const siteIds = useMemo(() => applied.site.map(Number), [applied])
  const role = applied.role
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
  // Site search (YTD view, 2026-10-16): narrows the site rows by name; the All sites row always stays.
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  // Sites are listed A to Z by default (2026-10-16), under the All sites row.
  const shownRows = useMemo(() => {
    const sorted = [...rows].sort((a, b) => (b.total ? 1 : 0) - (a.total ? 1 : 0) || a.name.localeCompare(b.name))
    return q ? sorted.filter(r => r.total || r.name.toLowerCase().includes(q)) : sorted
  }, [rows, q])
  // Export CSV (YTD view): one row per site under All sites, with YTD then each week, as on screen.
  function exportCsv() {
    const weeks = ytdWeeks(preview === 'end')
    const head = ['Site', 'YTD', ...weeks.map(w => format(w.date, 'MMM d yyyy'))].map(v => `"${v}"`).join(',')
    const lines = shownRows.map(r => {
      return [`"${ytdRowName(r)}"`, `${ytdAvg(r, weeks)}%`, ...weeks.map(w => `${r.cells[w.i].pct}%`)].join(',')
    })
    const url = URL.createObjectURL(new Blob([`${head}\n${lines.join('\n')}`], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'engagement-year-to-date.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Print (2026-10-16) replaces the 3-dot menu: the browser prints YtdPrint only, named for the PDF file.
  function printYtd() {
    const prevTitle = document.title
    document.title = `Year to date, ${schoolYearText(YTD_SHIFT_DAYS)}`
    window.addEventListener('afterprint', () => { document.title = prevTitle }, { once: true })
    window.print()
  }

  return (
    <div className={embedded ? '' : 'px-6 pt-8 pb-8'}>
      {!embedded && <>
      <div className="mb-3">
        <h2 className="text-2xl font-semibold text-brand-text">Year to date</h2>
        {/* School year under the title (2026-10-16). YTD runs on the shifted 2026 to 2027 weeks; the other layouts show the mock 2025 to 2026 year. */}
        <p className="flex items-center gap-1.5 text-sm text-brand-subtext mt-1"><Calendar size={14} aria-hidden="true" />{schoolYearText(layout === 'halves5' ? YTD_SHIFT_DAYS : 0)}</p>
      </div>

      <GoalBanner />
      </>}

      {layout === 'halves5' && (
        <FiltersPanel
          draft={draft}
          onChange={setDraft}
          onApply={() => setApplied(draft)}
          onReset={() => { const all = { site: lockedSite ?? [], role: 'all' }; setDraft(all); setApplied(all) }}
          sites={schools}
          roles={USER_ROLES}
          showSite={!lockedSite}
          showDates={false}
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
        </header>
        {/* Under the title (2026-10-16): site search on the left, Heat map and Export CSV side by side on the right. */}
        {layout === 'halves5' && (
          <div className="flex items-center justify-between gap-3 -mt-2 mb-4">
            <div className="w-64">
              <SearchField value={query} onChange={setQuery} placeholder="Search sites" height="h-8" />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Heat map toggle: shades the % cells; the color key shows under the table while it's on. */}
              <button
                type="button"
                onClick={() => setHeat(h => !h)}
                aria-pressed={heat}
                className={`inline-flex items-center gap-1.5 h-8 px-3 shrink-0 whitespace-nowrap rounded-md border text-[13px] font-medium transition-colors ${heat ? 'border-dessa-teal bg-dessa-tealLight text-dessa-teal' : 'border-brand-border bg-white text-brand-text hover:bg-brand-bg'}`}
              >
                <Palette size={14} className={heat ? 'text-dessa-teal' : 'text-brand-subtext'} aria-hidden="true" /> Heat map
              </button>
              <button
                type="button"
                onClick={exportCsv}
                className="inline-flex items-center gap-1.5 h-8 px-3 shrink-0 whitespace-nowrap rounded-md border border-brand-border bg-white text-[13px] font-medium text-brand-text hover:bg-brand-bg transition-colors"
              >
                <Download size={14} className="text-brand-subtext" aria-hidden="true" /> Export CSV
              </button>
              <button
                type="button"
                onClick={printYtd}
                className="inline-flex items-center gap-1.5 h-8 px-3 shrink-0 whitespace-nowrap rounded-md border border-brand-border bg-white text-[13px] font-medium text-brand-text hover:bg-brand-bg transition-colors"
              >
                <Printer size={14} className="text-brand-subtext" aria-hidden="true" /> Print
              </button>
            </div>
          </div>
        )}

        {layout === 'halves5' ? (
          <YtdTable rows={shownRows} endOfYear={preview === 'end'} heat={heat} searching={!!q} />
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
            <Legend numbers={layout !== 'heat'} steps={layout === 'halves5' ? STEPS_HEAT : TABLE_STEPS[layout] ?? STEPS} noSchool={layout !== 'halves5'} />
          </div>
        )}
      </motion.section>
      {layout === 'halves5' && <YtdPrint rows={shownRows} weeks={ytdWeeks(preview === 'end')} heat={heat} schoolYear={schoolYearText(YTD_SHIFT_DAYS)} />}
    </div>
  )
}
