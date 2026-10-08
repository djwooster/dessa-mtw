import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { parseISO, addDays, format } from 'date-fns'
import { MoreHorizontal, Download, Printer, ChevronRight, ChevronLeft, ChevronDown, Check, Info } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import * as Tooltip from '@radix-ui/react-tooltip'
import { schools, schoolWeeks, getWeekData } from '../lib/report2Data'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { RangePicker } from '../components/ui/range-picker'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useRole } from '../lib/roleContext'
import { useEngagementConcept } from '../lib/engagementConceptContext'
import StackedGoalChart from '../components/engagement/StackedGoalChart'
import EngagementOverviewD from '../components/engagement/EngagementOverviewD'
import WeeklyBarChart from '../components/engagement/WeeklyBarChart'
import MonthBarChart, { MONTHS, DEFAULT_MONTH_IDX, weekRangeLabel } from '../components/engagement/MonthBarChart'
import {
  GOAL, RANGE_PRESETS, FIRST_DATE, LAST_DATE, rangeLabel, weeksForDates,
  SortButton, nextSort, SearchField, SiteGoalLineChart, SiteWeeklyChart,
  getRosterNames, getLastActive, agoRank, activeDayOrder, WEEKDAYS, EducatorActivityGrid, SiteDetailModal,
} from './Report2ConceptE'
import { PILL_LABELS, CONSISTENCY_THRESHOLD, districtWeek, SummaryCard } from './Report2ConceptF'

// Engagement (2026-10-06): the combined report, meant to replace both Site
// Engagement and Daily Curriculum Engagement. One page that drills from
// district to site to educator, built step by step. Step 2: the district
// level (range controls, summary cards, trend chart, site table), reusing
// Concept F's pieces. "Change vs last month" means the same thing on the
// cards and in the table: the latest week compared with four weeks earlier.
const MONTH_BACK = 4

// Educator list: this week's day dots, days this week, and last active,
// sortable and searchable. Opening a row shows that educator's activity grid
// for the selected range, one at a time. `school` null lists every educator
// in the district (with a Site column and paging); otherwise one site's.
const PAGE_SIZE = 25

function SiteEducators({ school, weeks, showDots = true, showDays = true, drilldown = true }) {
  const latest = weeks[weeks.length - 1]
  const weekIdx = schoolWeeks.indexOf(latest)
  const [openKey, setOpenKey] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [page, setPage] = useState(0)
  const allSites = !school

  const base = useMemo(() => (school ? [school] : schools).flatMap(sc => {
    const names = getRosterNames(sc.id)
    const data = getWeekData(sc.id, latest, GOAL).teachers
    return names.map((name, i) => {
      const days = data[i].daysActive
      return { key: `${sc.id}-${i}`, sc, name, i, days, active: new Set(activeDayOrder(sc.id, i, weekIdx).slice(0, days)), last: getLastActive(sc.id, i) }
    })
  }), [school, latest, weekIdx])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return base
      .filter(r => !q || r.name.toLowerCase().includes(q) || r.sc.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1
        if (sort.key === 'days') return dir * (a.days - b.days) || a.name.localeCompare(b.name)
        if (sort.key === 'last') return dir * (agoRank(a.last) - agoRank(b.last) || 0) || a.name.localeCompare(b.name)
        if (sort.key === 'site') return dir * a.sc.name.localeCompare(b.sc.name) || a.name.localeCompare(b.name)
        return dir * a.name.localeCompare(b.name)
      })
  }, [base, query, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const shown = allSites ? rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE) : rows
  const cols = (allSites ? 5 : 4) - (showDots ? 0 : 1) - (showDays ? 0 : 1)

  const weekStart = parseISO(latest)
  const dayLetters = ['M', 'T', 'W', 'T', 'F']

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-border">
        <SearchField value={query} onChange={v => { setQuery(v); setPage(0) }} placeholder="Search educators" bg="bg-brand-bg/60" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[13px] font-medium"><SortButton label="Educator" col="name" sort={sort} onSort={k => { setSort(s => nextSort(s, k)); setPage(0) }} /></TableHead>
            {allSites && <TableHead className="text-[13px] font-medium"><SortButton label="Site" col="site" sort={sort} onSort={k => { setSort(s => nextSort(s, k)); setPage(0) }} /></TableHead>}
            {showDots && <TableHead className="text-[13px] font-medium">
              <span className="sr-only">This week</span>
              <span className="flex items-center gap-3" aria-hidden="true">
                {dayLetters.map((d, i) => <span key={i} className="w-3.5 text-center text-xs text-brand-subtext">{d}</span>)}
              </span>
            </TableHead>}
            {showDays && <TableHead className={`text-[13px] font-medium ${showDots ? '' : 'w-40 text-right'}`}><SortButton label="Days this week" col="days" sort={sort} onSort={k => { setSort(s => nextSort(s, k, 'desc')); setPage(0) }} align={showDots ? undefined : 'right'} /></TableHead>}
            <TableHead className={`text-[13px] font-medium text-right ${showDots ? '' : 'w-40'}`}><SortButton label="Last Active" col="last" sort={sort} onSort={k => { setSort(s => nextSort(s, k)); setPage(0) }} align="right" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map(r => {
            const open = openKey === r.key
            return (
              <Fragment key={r.key}>
                <TableRow onClick={drilldown ? () => setOpenKey(open ? null : r.key) : undefined} className={drilldown ? 'cursor-pointer' : 'hover:bg-transparent'}>
                  <TableCell className="font-medium">
                    {drilldown ? (
                      <button type="button" aria-expanded={open} className="flex items-center gap-2 text-left">
                        <ChevronRight size={14} className={`shrink-0 text-brand-subtext transition-transform ${open ? 'rotate-90' : ''}`} />
                        {r.name}
                      </button>
                    ) : r.name}
                  </TableCell>
                  {allSites && <TableCell className="text-brand-subtext">{r.sc.name}</TableCell>}
                  {showDots && <TableCell>
                    <span className="flex items-center gap-3">
                      {WEEKDAYS.map(d => {
                        const date = addDays(weekStart, d)
                        const on = r.active.has(d)
                        return (
                          <span
                            key={d}
                            role="img"
                            aria-label={`${format(date, 'EEE, MMM d')}: ${on ? 'active' : 'no activity'}`}
                            className={`block w-3.5 h-3.5 rounded-full ${on ? 'bg-dessa-teal' : 'border-2 border-brand-border'}`}
                          />
                        )
                      })}
                    </span>
                  </TableCell>}
                  {showDays && <TableCell className={`tabular-nums ${showDots ? '' : 'text-right'}`}>{r.days} of {WEEKDAYS.length}</TableCell>}
                  <TableCell className="text-brand-subtext text-right">{r.last}</TableCell>
                </TableRow>
                {drilldown && open && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={cols} className="pl-10 py-3 bg-brand-bg/50">
                      <EducatorActivityGrid schoolId={r.sc.id} teacherIndex={r.i} weeks={weeks} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={cols} className="text-center text-brand-subtext py-8">No educators match your search.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {allSites && rows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border text-[13px] text-brand-subtext">
          <span className="tabular-nums">{safePage * PAGE_SIZE + 1} to {Math.min(rows.length, (safePage + 1) * PAGE_SIZE)} of {rows.length} educators</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="h-8 px-3 rounded-md border border-brand-border bg-white font-medium text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:hover:bg-white">Previous</button>
            <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} className="h-8 px-3 rounded-md border border-brand-border bg-white font-medium text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:hover:bg-white">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ReportEngagement() {
  const [rangeKey, setRangeKey] = useState('30d')
  const [customWeeks, setCustomWeeks] = useState(null)
  const presetWeeks = RANGE_PRESETS.find(p => p.value === rangeKey)?.weeks
  const weeks = useMemo(() => customWeeks ?? schoolWeeks.slice(-presetWeeks), [customWeeks, presetWeeks])

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [pickedSite, setSelectedSite] = useState(null)
  // A Site Leader has no district level: they open straight into their own
  // site (shared role switcher in the sidebar).
  const { isSiteLeaderView } = useRole()
  const { engagementConcept } = useEngagementConcept()
  const stacked = engagementConcept === 'b'
  // In-page graph switcher (2026-10-06): A is the chart each Nav concept
  // already shows; B is the month view (nested month control, one bar per
  // week), whose month only drives that chart.
  const [graph, setGraph] = useState('a')
  // Site clicks (2026-10-07): A and B open the shared site modal, C keeps its site page, D selects the site in its panel.
  const [modalSite, setModalSite] = useState(null)
  const [dSiteId, setDSiteId] = useState(null)
  const [monthIdx, setMonthIdx] = useState(DEFAULT_MONTH_IDX)
  const month = MONTHS[monthIdx]
  const selectedSite = isSiteLeaderView ? schools[0] : pickedSite

  useEffect(() => {
    if (!menuOpen) return
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (!modalSite) return
    const onKey = e => { if (e.key === 'Escape') setModalSite(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [modalSite])

  function resetAll() {
    setRangeKey('30d')
    setCustomWeeks(null)
    setQuery('')
    setSort({ key: 'name', dir: 'asc' })
    setSelectedSite(null)
    setModalSite(null)
    setDSiteId(null)
    setMonthIdx(DEFAULT_MONTH_IDX)
  }

  const cards = useMemo(() => {
    const latest = weeks[weeks.length - 1]
    const idx = schoolWeeks.indexOf(latest)
    const now = districtWeek(latest)
    const before = idx - MONTH_BACK >= 0 ? districtWeek(schoolWeeks[idx - MONTH_BACK]) : null
    const sitePct = d => Math.round((d.sitesMet / d.sites) * 100)
    const weeksOver = weeks.filter(w => districtWeek(w).educatorPct >= CONSISTENCY_THRESHOLD).length
    return {
      sites: { value: `${now.sitesMet} of ${now.sites}`, pct: sitePct(now), change: before ? sitePct(now) - sitePct(before) : null },
      educators: { value: `${now.met} of ${now.total}`, pct: now.educatorPct, change: before ? now.educatorPct - before.educatorPct : null },
      consistency: { value: `${weeksOver} of ${weeks.length} weeks`, pct: Math.round((weeksOver / weeks.length) * 100) },
    }
  }, [weeks])

  const siteRows = useMemo(() => {
    const latest = weeks[weeks.length - 1]
    const q = query.trim().toLowerCase()
    return schools
      .map(school => {
        const data = getWeekData(school.id, latest, GOAL)
        return { school, meetingGoal: data.meetingGoal, totalTeachers: data.totalTeachers, pct: data.pct }
      })
      .filter(r => !q || r.school.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1
        if (sort.key === 'name') return dir * a.school.name.localeCompare(b.school.name)
        return dir * (a.pct - b.pct) || a.school.name.localeCompare(b.school.name)
      })
  }, [weeks, query, sort])

  function openSite(school) {
    if (engagementConcept === 'c') setSelectedSite(school)
    else setModalSite(school)
  }

  function exportCsv() {
    if (selectedSite) {
      const names = getRosterNames(selectedSite.id)
      const body = names.map((n, i) => `"${n}","${getLastActive(selectedSite.id, i)}"`).join('\n')
      const url = URL.createObjectURL(new Blob([`Educator,Last Active\n${body}`], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedSite.name.toLowerCase().replace(/\s+/g, '-')}-educators.csv`
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    const header = `Site,Educators meeting goal,Total educators\n`
    const body = siteRows.map(r => `"${r.school.name}",${r.meetingGoal},${r.totalTeachers}`).join('\n')
    const url = URL.createObjectURL(new Blob([header + body], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'engagement.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  // Range controls live in the chart card header (2026-10-06): segmented
  // presets (the shared Tabs control) plus the custom-range calendar button.
  // Concept A uses the full weekly date picker (2026-10-08) in place of the tabs and calendar icon.
  const rangeControls = engagementConcept === 'a' ? (
    <RangePicker
      weekly
      weekStarts={schoolWeeks}
      presets={RANGE_PRESETS}
      value={rangeKey}
      label={rangeLabel(weeks)}
      range={{ from: parseISO(weeks[0]), to: addDays(parseISO(weeks[weeks.length - 1]), 4) }}
      month={parseISO(weeks[0])}
      minDate={FIRST_DATE}
      maxDate={LAST_DATE}
      onPreset={k => { setRangeKey(k); setCustomWeeks(null) }}
      onRange={({ from, to }) => {
        const ws = weeksForDates(from, to)
        if (ws.length) { setCustomWeeks(ws); setRangeKey('custom') }
      }}
    />
  ) : (
    <div className="flex items-center gap-1 shrink-0">
      <Tabs value={rangeKey} onValueChange={k => { setRangeKey(k); setCustomWeeks(null) }}>
        <TabsList className="p-0.5">
          {RANGE_PRESETS.map(p => (
            <TabsTrigger key={p.value} value={p.value} className="text-[13px] px-3 py-1">{PILL_LABELS[p.value]}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <RangePicker
        iconOnly
        presets={[]}
        value={rangeKey}
        label={rangeLabel(weeks)}
        range={{ from: parseISO(weeks[0]), to: addDays(parseISO(weeks[weeks.length - 1]), 4) }}
        month={parseISO(weeks[0])}
        minDate={FIRST_DATE}
        maxDate={LAST_DATE}
        onRange={({ from, to }) => {
          const ws = weeksForDates(from, to)
          if (ws.length) { setCustomWeeks(ws); setRangeKey('custom') }
        }}
      />
    </div>
  )

  // Concept C numbers: one row per week in range, district-wide.
  const analytics = useMemo(() => weeks.map(w => {
    let met = 0, total = 0, progress = 0, sitesMet = 0, lessons = 0
    schools.forEach(sc => {
      const d = getWeekData(sc.id, w, GOAL)
      total += d.totalTeachers
      met += d.meetingGoal
      if (d.meetingGoal === d.totalTeachers) sitesMet += 1
      d.teachers.forEach(t => {
        lessons += t.daysActive
        if (!t.metGoal && t.daysActive > 0) progress += 1
      })
    })
    return { week: w, met, total, progress, sitesMet, lessons, pct: Math.round((met / total) * 100) }
  }), [weeks])
  const isC = engagementConcept === 'c' && !selectedSite
  const isD = engagementConcept === 'd' && !selectedSite
  const rangeHeader = isC || isD
  // Concept A (2026-10-07): the weekly goal is a quiet info badge, not a link, and the subtext is gone.
  const isA = engagementConcept === 'a' && !selectedSite
  // Concept B (2026-10-07) gets the same goal badge and no subtext.
  // Concept C gets it on both its district view and its site page (2026-10-07).
  const goalBadge = ((engagementConcept === 'a' || engagementConcept === 'b') && !selectedSite) || engagementConcept === 'c'
  const latestRow = analytics[analytics.length - 1]
  const lessonsInRange = analytics.reduce((sum, r) => sum + r.lessons, 0)

  const monthControls = (
    <div className="flex items-center gap-1 shrink-0">
      <button
        type="button"
        onClick={() => setMonthIdx(i => i - 1)}
        disabled={monthIdx === 0}
        aria-label="Previous month"
        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-dessa-teal hover:bg-dessa-tealLight transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronLeft size={16} />
      </button>
      <span className="min-w-32 text-center text-sm font-medium text-brand-text" aria-live="polite">{month.label}</span>
      <button
        type="button"
        onClick={() => setMonthIdx(i => i + 1)}
        disabled={monthIdx === MONTHS.length - 1}
        aria-label="Next month"
        className="inline-flex items-center justify-center h-8 w-8 rounded-md text-dessa-teal hover:bg-dessa-tealLight transition-colors disabled:opacity-40 disabled:hover:bg-transparent"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )

  return (
    <div className="px-6 pt-8 pb-8">
      <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${isC ? 'mb-[72px]' : 'mb-6'}`}>
        <div className="min-w-0">
          {/* No breadcrumbs (2026-10-06): inside a site, a plain link is the way back. */}
          {selectedSite && !isSiteLeaderView && (
            <button type="button" onClick={() => setSelectedSite(null)} className="inline-flex items-center gap-1 text-sm text-brand-subtext hover:text-brand-text transition-colors mb-3">
              <ChevronLeft size={14} aria-hidden="true" /> All sites
            </button>
          )}
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-2xl font-semibold text-brand-text">{selectedSite ? selectedSite.name : 'Engagement'}</h2>
            {goalBadge && (
              <Tooltip.Provider delayDuration={150}>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button type="button" className="inline-flex items-center gap-1.5 rounded-full bg-brand-border/60 px-3 py-1.5 text-xs">
                      <Info size={12} className="text-brand-subtext" aria-hidden="true" />
                      <span className="text-brand-subtext">Weekly goal</span>
                      <span className="font-medium text-brand-text">{GOAL} lessons per week</span>
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content side="bottom" sideOffset={6} className="z-50 px-2.5 py-1.5 rounded-md bg-brand-text text-white text-xs shadow-lg">
                      Set in Settings
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </Tooltip.Provider>
            )}
            {!rangeHeader && !goalBadge && (
              <Link to="/settings" className="text-sm text-interactive-blue hover:underline">
                Weekly goal: {GOAL} lessons per week
              </Link>
            )}
          </div>
          {!rangeHeader && !goalBadge && (
            <p className="text-sm text-brand-subtext mt-1">
              {selectedSite ? `Educators at ${selectedSite.name}. Open an educator to see their activity.` : 'This report shows Move This World lesson completion across your district, by site.'}
            </p>
          )}
        </div>

      {rangeHeader ? (
        <div className="flex items-center gap-2">
          <RangePicker
            weekly
            weekStarts={schoolWeeks}
            presets={RANGE_PRESETS}
            value={rangeKey}
            label={rangeLabel(weeks)}
            range={{ from: parseISO(weeks[0]), to: addDays(parseISO(weeks[weeks.length - 1]), 4) }}
            month={parseISO(weeks[0])}
            minDate={FIRST_DATE}
            maxDate={LAST_DATE}
            onPreset={k => { setRangeKey(k); setCustomWeeks(null) }}
            onRange={({ from, to }) => {
              const ws = weeksForDates(from, to)
              if (ws.length) { setCustomWeeks(ws); setRangeKey('custom') }
            }}
          />
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-1.5 h-8 px-3 rounded-md border border-brand-border bg-white text-[13px] font-medium text-brand-text hover:bg-brand-bg transition-colors"
          >
            <Download size={14} className="text-brand-subtext" aria-hidden="true" /> Download
          </button>
        </div>
      ) : (
      <div className="flex flex-wrap items-center justify-end gap-2">
        {/* Reset all removed 2026-10-08; the 3-dot menu now sits to the right of the Graph switcher. */}
        <Popover.Root>
          <Popover.Trigger asChild>
            <button
              title="Graph version"
              className="flex items-center gap-1.5 px-3 h-8 rounded-lg border border-brand-border bg-white text-xs font-medium text-brand-text hover:bg-brand-bg transition-colors"
            >
              Graph {graph.toUpperCase()}
              <ChevronDown size={12} className="text-brand-subtext" />
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content align="end" sideOffset={6} className="z-50 w-48 bg-white border border-brand-border rounded-xl shadow-lg outline-none py-1.5">
              {[
                { value: 'a', title: 'A, Current graph' },
                { value: 'b', title: 'B, One month at a time, one bar per week' },
              ].map(g => (
                <button
                  key={g.value}
                  title={g.title}
                  onClick={() => setGraph(g.value)}
                  className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
                    graph === g.value ? 'text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                  }`}
                >
                  Graph {g.value.toUpperCase()}
                  {graph === g.value && <Check size={13} className="text-dessa-teal" />}
                </button>
              ))}
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            className="flex items-center justify-center w-8 h-8 rounded-md bg-white text-brand-text hover:bg-brand-bg transition-all"
            onClick={() => setMenuOpen(o => !o)}
            aria-label="More options"
            aria-expanded={menuOpen}
          >
            <MoreHorizontal size={13} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-brand-border rounded-lg shadow-lg z-20 overflow-hidden py-1">
              <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors" onClick={() => { exportCsv(); setMenuOpen(false) }}>
                <Download size={13} className="text-brand-subtext" /> Export CSV
              </button>
              <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors" onClick={() => { window.print(); setMenuOpen(false) }}>
                <Printer size={13} className="text-brand-subtext" /> Print
              </button>
            </div>
          )}
        </div>
        </div>
      )}
      </div>

      {selectedSite ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            className="bg-white rounded-xl border border-brand-border p-5 mb-6"
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="text-base font-semibold text-brand-text">{stacked || graph === 'b' ? 'Educators who met their weekly goal' : '% of educators meeting goal'}</p>
              {graph === 'b' ? monthControls : rangeControls}
            </div>
            {graph === 'b' ? <MonthBarChart schoolId={selectedSite.id} weeks={month.weeks} /> : stacked ? <StackedGoalChart schoolId={selectedSite.id} weeks={weeks} /> : <SiteWeeklyChart schoolId={selectedSite.id} weeks={weeks} />}
          </motion.div>
          <SiteEducators school={selectedSite} weeks={weeks} showDots={engagementConcept !== 'c' && !isSiteLeaderView} showDays={!isSiteLeaderView} drilldown={!isSiteLeaderView} />
        </>
      ) : (
        <>
      {/* Summary cards commented out 2026-10-06 (chart now spans the full width).
          To restore, put the grid back to grid-cols-[minmax(240px,300px)_1fr] and uncomment:
        <div className="flex flex-col gap-4">
          <SummaryCard label="Sites meeting goal" {...cards.sites} />
          <SummaryCard label="Educators meeting goal" {...cards.educators} />
          <SummaryCard label="Consistency" {...cards.consistency} note={`Weeks with ${CONSISTENCY_THRESHOLD}%+ of educators on goal`} />
        </div>
      */}
      {isD ? (
        <EngagementOverviewD weeks={weeks} selectedId={dSiteId} onSelect={setDSiteId} />
      ) : isC ? (
        <>
          <div className="grid gap-8 mb-12 pb-8 border-b border-brand-border grid-cols-4">
            {[
              { value: <>{latestRow.met + latestRow.progress}<span className="text-base font-normal text-brand-subtext"> of </span>{latestRow.total}</>, label: 'Users with a lesson completed', note: `Latest week, ${weekRangeLabel(latestRow.week)}` },
              { value: <>{latestRow.met}<span className="text-base font-normal text-brand-subtext"> of </span>{latestRow.total}</>, label: 'Users who met the goal', note: `Latest week, ${weekRangeLabel(latestRow.week)}` },
              { value: <>{latestRow.sitesMet}<span className="text-base font-normal text-brand-subtext"> of </span>{schools.length}</>, label: 'Sites where every user met it', note: `Latest week, ${weekRangeLabel(latestRow.week)}` },
              { value: lessonsInRange.toLocaleString(), label: 'Lessons completed', note: 'In this date range' },
            ].map(stat => (
              <div key={stat.label} className="min-w-0">
                <p className="text-3xl font-semibold text-[#14444d] leading-tight mb-3">{stat.value}</p>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#14444d] mt-1">{stat.label}</p>
                <p className="text-sm text-brand-subtext mt-1">{stat.note}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-x-12 gap-y-16 mb-16 grid-cols-1 xl:grid-cols-2">
            {[
              { title: 'Users who met the goal', kind: 'line', blurb: `The share of users who completed at least ${GOAL} lessons in a school week.`, percent: true, pick: r => r.pct, detail: r => `${r.met} of ${r.total} users` },
              { title: 'Lessons completed', kind: 'bar', blurb: 'Every lesson completed by users in your district each week.', pick: r => r.lessons, detail: r => `${r.lessons.toLocaleString()} lessons` },
              // A third metric goes here (line, left column) once we pick one; "Educators making progress" was dropped as weak.
              { title: 'Sites where every user met the goal', kind: 'bar', blurb: 'The number of sites where every user reached the weekly goal.', pick: r => r.sitesMet, detail: r => `${r.sitesMet} of ${schools.length} sites` },
            ].map((c, i) => (
              <motion.div
                key={c.title}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.05 * i }}
                className="min-w-0"
              >
                <h3 className="text-lg font-semibold text-[#14444d]">{c.title}</h3>
                <p className="text-sm text-brand-subtext mt-1 mb-6">{c.blurb}</p>
                <WeeklyBarChart label={c.title} kind={c.kind} percent={c.percent} points={analytics.map(r => ({ week: r.week, value: c.pick(r), detail: c.detail(r) }))} />
              </motion.div>
            ))}
          </div>
        </>
      ) : (
      <div className="grid gap-4 mb-6 grid-cols-1">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
          className="min-w-0 bg-white rounded-xl border border-brand-border p-5"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <p className="text-base font-semibold text-brand-text">Educators who met their weekly goal</p>
            {graph === 'b' ? monthControls : rangeControls}
          </div>
          {graph === 'b' ? <MonthBarChart weeks={month.weeks} /> : stacked ? <StackedGoalChart weeks={weeks} /> : <SiteGoalLineChart weeks={weeks} metric="educators" />}
        </motion.div>
      </div>
      )}

      {isD ? (
        <SiteEducators school={schools.find(sc => sc.id === dSiteId) ?? null} weeks={weeks} showDots={false} showDays={false} drilldown={false} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.14 }}
          className="bg-white rounded-xl border border-brand-border overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-brand-border">
            <SearchField value={query} onChange={setQuery} placeholder="Search sites" bg="bg-brand-bg/60" height="h-8" />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[13px] font-medium"><SortButton label="Site" col="name" sort={sort} onSort={k => setSort(s => nextSort(s, k))} /></TableHead>
                <TableHead className="text-[13px] font-medium text-right"><SortButton label="Educators meeting goal" col="goal" sort={sort} onSort={k => setSort(s => nextSort(s, k, 'desc'))} align="right" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siteRows.map(({ school, meetingGoal, totalTeachers }) => (
                <TableRow key={school.id} onClick={() => openSite(school)} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <button type="button" onClick={e => { e.stopPropagation(); openSite(school) }} className="text-left text-[13px] text-[#134fb2] hover:underline transition-colors">{school.name}</button>
                  </TableCell>
                  <TableCell className="text-brand-text text-right tabular-nums">{meetingGoal} of {totalTeachers}</TableCell>
                </TableRow>
              ))}
              {siteRows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={2} className="text-center text-brand-subtext py-8">No sites match your search.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </motion.div>
      )}
        </>
      )}

      {/* Educator drill-down (activity grid) switched off 2026-10-08: the modal shows Last Active only for now. Remove drilldown={false} to bring it back. */}
      {modalSite && <SiteDetailModal school={modalSite} weeks={weeks} onClose={() => setModalSite(null)} title="Educators meeting goal" drilldown={false} goalColumn bordered />}
    </div>
  )
}
