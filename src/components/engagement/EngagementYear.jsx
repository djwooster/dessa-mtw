import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import { parseISO, format, addDays } from 'date-fns'
import { ChevronRight, Download, MoreHorizontal, Palette, Printer, School } from 'lucide-react'
import { schools, schoolWeeks, NO_SCHOOL_WEEKS, matchesSite, USER_ROLES, isGoalRole } from '../../lib/report2Data'
import NoGoalNotice from './NoGoalNotice'
import { weekBands } from './StackedGoalChart'
import { GOAL, SearchField } from '../../pages/Report2ConceptE'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { useEngagementVersion } from '../../lib/engagementVersionContext'
import FiltersPanel from './FiltersPanel'
import { PaginationBar } from '../ui/pagination'

// The Engagement report's Table tab (2026-10-15 as a Week by week page, YTD table since 2026-10-16): every school
// week so far, one row per site under an All sites row. It is made to be screenshotted and shared with board
// members, so nothing depends on hover. The Year to date page and its other layouts (Wide grid, Fall and
// Spring, Heat only) were deleted 2026-10-19; this table is only reached from the Engagement tabs.

// YTD heat map (2026-10-16): four bands of the DESSA teal, split at quarters to match the chart's 25% gridlines.
// Only the full teal band carries white text; the lighter bands keep dark text (each pair passes 4.5:1).
const STEPS_HEAT = [
  { min: 75, label: '75% or more', cls: 'bg-dessa-teal text-white' },
  { min: 50, label: '50 to 74%', cls: 'bg-dessa-teal/60 text-brand-text' },
  { min: 25, label: '25 to 49%', cls: 'bg-dessa-teal/30 text-brand-text' },
  { min: 0, label: 'Under 25%', cls: 'bg-dessa-teal/10 text-brand-text' },
]
const stepFor = (pct, steps = STEPS_HEAT) => steps.find(s => pct >= s.min)

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

// YTD concept (2026-10-16, manager feedback; first called Fall and Spring (5)): a plain table, year to date. No terms, no tiles or
// colors. It uses the real date: the 2026-27 school year starts Aug 31 (the mock data itself moved there on
// 2026-10-19; before that this view shifted it) and only weeks that have started by today are shown, newest
// first, with winter break left out. YTD is the plain average of the weekly %s. Site and YTD stay pinned when
// the weeks scroll.
// Opaque version of the 48% brand-bg tint, for pinned cells that sit over scrolled content.
const TINT = 'bg-white bg-[linear-gradient(theme(colors.brand.bg/48%),theme(colors.brand.bg/48%))]'

// "2026 to 2027 school year", from the first school week.
function schoolYearText() {
  const y = parseISO(schoolWeeks[0]).getFullYear()
  return `${y} to ${y + 1} school year`
}

// The weeks that count toward YTD, newest first. The end of year preview (2026-10-16) pretends today is the
// last week of the school year. `range` (2026-10-19, the Engagement Table tab's Start and End date) keeps the
// weeks that overlap it, the same rule as the Graph tab.
function ytdWeeks(endOfYear, range = null) {
  const today = endOfYear ? addDays(parseISO(schoolWeeks[schoolWeeks.length - 1]), 4) : new Date()
  const from = range && parseISO(range.start)
  const to = range && parseISO(range.end)
  return schoolWeeks
    .map((w, i) => ({ i, date: parseISO(w), off: NO_SCHOOL_WEEKS.includes(w) }))
    .filter(w => !w.off && w.date <= today && (!range || (addDays(w.date, 4) >= from && w.date <= to)))
    .reverse()
}
// One average everywhere (2026-10-26): the % is weighted, all the users who met the goal over all the users with a
// goal in those weeks, the same as the site page. Counts stay a plain weekly average.
const ytdAvg = (r, weeks, k = 'pct') => {
  if (!weeks.length) return 0
  if (k !== 'pct') return Math.round(weeks.reduce((sum, w) => sum + r.cells[w.i][k], 0) / weeks.length)
  const met = weeks.reduce((sum, w) => sum + r.cells[w.i].met, 0)
  const total = weeks.reduce((sum, w) => sum + r.cells[w.i].total, 0)
  return total ? Math.round((met / total) * 100) : 0
}

const ytdRowName = r => r.total ? `${r.allSites ? 'All sites' : 'Selected sites'} (${r.count})` : r.name

// Print layout for the YTD view (2026-10-16), the same letterhead as the Engagement print (PrintReport), on a
// landscape page. Every site prints, not just the current page. The weeks go in blocks of 12, newest first,
// each repeating Site and YTD so a block reads on its own. With the heat map on, the bands print too.
const PRINT_WEEKS = 12
function YtdPrint({ rows, weeks, heat, schoolYear, avgLabel }) {
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
          <p className="text-xs font-medium text-brand-subtext mb-2">{blockLabel(b)}</p>
          <table className="w-full text-[11px] tabular-nums border-collapse">
            <thead>
              <tr className="border-b border-brand-text">
                <th className="py-1.5 pr-2 text-left font-semibold">Site</th>
                <th className="py-1.5 px-1.5 text-right font-semibold whitespace-nowrap">{avgLabel}</th>
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
function YtdTable({ rows, weeks, heat = false, searching = false, avgLabel }) {
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
    { label: 'Users with a goal', ytd: r => avgOf(r, 'total'), week: c => c.total },
    { label: 'Users who met the goal', ytd: r => avgOf(r, 'met'), week: c => c.met },
  ]
  // Pinned columns draw their right line as an inset shadow so it stays put while the weeks scroll under them.
  const pinLine = 'border-r-0 shadow-[inset_-1px_0_0_theme(colors.brand.border)]'
  const site = 'sticky left-0 z-10 w-56 min-w-56'
  // Widened 2026-10-20 to fit the "YTD Average" header on one line.
  const avg = 'sticky left-56 z-10 w-28 min-w-28 text-right whitespace-nowrap'
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
              <TableHead key={i} colSpan={s.n} className={`${TINT} ${head} text-xs font-medium text-brand-subtext`}>{s.m}</TableHead>
            ))}
          </TableRow>
          <TableRow className="hover:bg-transparent">
            <TableHead className={`${site} ${TINT} ${head} ${pinLine}`}>Site</TableHead>
            <TableHead className={`${avg} ${TINT} ${head} ${pinLine}`}>{avgLabel}</TableHead>
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
                        {r.total && <span className="text-xs font-medium text-brand-subtext"> ({r.count})</span>}
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

// The heat map's color key, under the table while the heat map is on.
function Legend() {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-brand-subtext">
      <span>Numbers are the % of users who met the goal that week.</span>
      <ul className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {[...STEPS_HEAT].reverse().map(s => (
          <li key={s.min} className="inline-flex items-center gap-1.5">
            <span className={`h-3 w-4 rounded-sm ${s.cls}`} aria-hidden="true" /> {s.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Filters are the Engagement report's, shared with the Graph tab (2026-10-19): Site, User role, Start and End date,
// and the dates narrow the weeks. A Site Leader (`lockedSiteId`) sees only their site, with no Site filter.
// `tabs` are the Graph | Table tabs, drawn under the Filters panel; `below` is the Users table, under the card.
export default function EngagementYear({ filters, lockedSiteId = null, tabs = null, below = null }) {
  const { draft, applied } = filters
  const siteIds = useMemo(() => (lockedSiteId ? [lockedSiteId] : applied.site.map(Number)), [applied, lockedSiteId])
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

  const { ytdPreview: preview } = useEngagementVersion()
  const weeks = useMemo(() => ytdWeeks(preview === 'end', { start: applied.start, end: applied.end }), [preview, applied.start, applied.end])
  const [heat, setHeat] = useState(false)
  const avgLabel = 'YTD Average'
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
    const head = ['Site', avgLabel, ...weeks.map(w => format(w.date, 'MMM d yyyy'))].map(v => `"${v}"`).join(',')
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

  // Print (2026-10-16): the browser prints YtdPrint only, named for the PDF file.
  function printYtd() {
    const prevTitle = document.title
    document.title = `Year to date, ${schoolYearText()}`
    window.addEventListener('afterprint', () => { document.title = prevTitle }, { once: true })
    window.print()
  }

  // 3-dot menu (Print) in the Filters panel's title row (2026-10-19), the same as the Engagement Graph tab.
  // Export CSV moved out to a link button next to Heat map (2026-10-21).
  const menu = (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="More options"
        aria-expanded={menuOpen}
        className="flex items-center justify-center w-8 h-8 rounded-md bg-white text-brand-text hover:bg-brand-bg transition-all"
      >
        <MoreHorizontal size={13} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-brand-border rounded-lg shadow-lg z-20 overflow-hidden py-1">
          <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors" onClick={() => { printYtd(); setMenuOpen(false) }}>
            <Printer size={13} className="text-brand-subtext" /> Print
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div>
      <FiltersPanel
        draft={draft}
        onChange={filters.onChange}
        onApply={filters.onApply}
        onReset={filters.onReset}
        sites={schools}
        roles={USER_ROLES}
        showSite={!lockedSiteId}
        minDate={filters.minDate}
        maxDate={filters.maxDate}
        disabled={filters.readOnly}
        action={menu}
      />
      {tabs}

      <motion.section
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="rounded-lg border border-brand-border bg-white p-5"
      >
        <header className="flex items-start justify-between gap-4 mb-5">
          <div className="min-w-0">
            <h3 className="text-base font-semibold text-brand-text">Users completing {GOAL} lessons a week</h3>
          </div>
        </header>
        {/* A User role without a weekly goal (2026-10-26) shows a notice instead of the table. */}
        {!isGoalRole(role) ? <NoGoalNotice role={role} /> : (<>
        {/* Under the title (2026-10-16): site search on the left, Heat map and Export CSV on the right. */}
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
              className="inline-flex items-center gap-1.5 h-8 px-2 shrink-0 whitespace-nowrap text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4 transition-colors"
            >
              <Download size={14} aria-hidden="true" /> Export CSV
            </button>
          </div>
        </div>

        <YtdTable rows={shownRows} weeks={weeks} heat={heat} searching={!!q} avgLabel={avgLabel} />

        {heat && (
          <div className="mt-5 pt-4 border-t border-brand-border">
            <Legend />
          </div>
        )}
        </>)}
      </motion.section>
      {below && <div className="mt-6">{below}</div>}
      <YtdPrint rows={shownRows} weeks={weeks} heat={heat} schoolYear={schoolYearText()} avgLabel={avgLabel} />
    </div>
  )
}
