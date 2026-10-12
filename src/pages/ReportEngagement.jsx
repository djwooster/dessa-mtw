import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { parseISO, addDays, format } from 'date-fns'
import { MoreHorizontal, Download, Printer, Target, ChevronRight, ChevronLeft, ChevronDown, Check, Info, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import * as Tooltip from '@radix-ui/react-tooltip'
import { schools, schoolWeeks, getWeekData, USER_ROLES } from '../lib/report2Data'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { RangePicker } from '../components/ui/range-picker'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useRole } from '../lib/roleContext'
import { useEngagementConcept } from '../lib/engagementConceptContext'
import StackedGoalChart, { weekBands } from '../components/engagement/StackedGoalChart'
import EngagementOverviewD from '../components/engagement/EngagementOverviewD'
import { PaginationBar } from '../components/ui/pagination'
import FiltersPanel from '../components/engagement/FiltersPanel'
import GoalStatusBadge from '../components/engagement/GoalStatusBadge'
import ContributionGraph from '../components/engagement/ContributionGraph'
import PrintReport from '../components/engagement/PrintReport'
import WeeklyBarChart from '../components/engagement/WeeklyBarChart'
import MonthBarChart, { MONTHS, DEFAULT_MONTH_IDX, weekRangeLabel } from '../components/engagement/MonthBarChart'
import {
  GOAL, RANGE_PRESETS, FIRST_DATE, LAST_DATE, rangeLabel, weeksForDates,
  SortButton, nextSort, SearchField, SiteGoalLineChart, SiteWeeklyChart,
  getRosterNames, getLastActive, agoRank, activeDayOrder, WEEKDAYS, EducatorActivityGrid, SiteDetailModal, educatorDayMap,
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

function SiteEducators({ school, weeks, showDots = true, showDays = true, drilldown = true, rangeBadge = null, goalColumn = false, roleColumn = false, fStyle = false, role = 'all' }) {
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
    return names.map((name, i) => ({ name, i })).filter(({ i }) => role === 'all' || data[i].role === role).map(({ name, i }) => {
      const days = data[i].daysActive
      return { key: `${sc.id}-${i}`, sc, name, i, role: data[i].role, days, met: data[i].metGoal, active: new Set(activeDayOrder(sc.id, i, weekIdx).slice(0, days)), last: getLastActive(sc.id, i) }
    })
  }), [school, latest, weekIdx, role])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return base
      .filter(r => !q || r.name.toLowerCase().includes(q) || r.sc.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1
        if (sort.key === 'goal') return dir * (Number(a.met) - Number(b.met)) || a.name.localeCompare(b.name)
        if (sort.key === 'role') return dir * a.role.localeCompare(b.role) || a.name.localeCompare(b.name)
        if (sort.key === 'days') return dir * (a.days - b.days) || a.name.localeCompare(b.name)
        if (sort.key === 'last') return dir * (agoRank(a.last) - agoRank(b.last) || 0) || a.name.localeCompare(b.name)
        if (sort.key === 'site') return dir * a.sc.name.localeCompare(b.sc.name) || a.name.localeCompare(b.name)
        return dir * a.name.localeCompare(b.name)
      })
  }, [base, query, sort])

  const pageCount = Math.max(1, Math.ceil(rows.length / PAGE_SIZE))
  const safePage = Math.min(page, pageCount - 1)
  const shown = allSites ? rows.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE) : rows
  const cols = (allSites ? 5 : 4) - (showDots ? 0 : 1) - (showDays ? 0 : 1) + (goalColumn ? 1 : 0) + (roleColumn ? 1 : 0)

  const weekStart = parseISO(latest)
  const dayLetters = ['M', 'T', 'W', 'T', 'F']

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-brand-border">
        <div className="flex-1 min-w-0">
          <SearchField value={query} onChange={v => { setQuery(v); setPage(0) }} placeholder="Search users" bg="bg-brand-bg/60" />
        </div>
        {/* Concept E: always on, since a date range is applied even in the default state. */}
        {rangeBadge && (
          <span className="inline-flex items-center gap-1.5 shrink-0 text-[13px] font-medium text-brand-subtext tabular-nums">
            <Calendar size={12} aria-hidden="true" /> {rangeBadge}
          </span>
        )}
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[13px] font-medium"><SortButton label="User" col="name" sort={sort} onSort={k => { setSort(s => nextSort(s, k)); setPage(0) }} /></TableHead>
            {allSites && <TableHead className={`text-[13px] font-medium ${showDots ? '' : 'w-56'}`}><SortButton label="Site" col="site" sort={sort} onSort={k => { setSort(s => nextSort(s, k)); setPage(0) }} /></TableHead>}
            {roleColumn && <TableHead className="text-[13px] font-medium w-40"><SortButton label="Role" col="role" sort={sort} onSort={k => { setSort(s => nextSort(s, k)); setPage(0) }} /></TableHead>}
            {showDots && <TableHead className="text-[13px] font-medium">
              <span className="sr-only">This week</span>
              <span className="flex items-center gap-3" aria-hidden="true">
                {dayLetters.map((d, i) => <span key={i} className="w-3.5 text-center text-xs text-brand-subtext">{d}</span>)}
              </span>
            </TableHead>}
            {showDays && <TableHead className={`text-[13px] font-medium ${showDots ? '' : 'w-40 text-right'}`}><SortButton label="Days this week" col="days" sort={sort} onSort={k => { setSort(s => nextSort(s, k, 'desc')); setPage(0) }} align={showDots ? undefined : 'right'} /></TableHead>}
            {goalColumn && <TableHead className="text-[13px] font-medium w-40 text-right"><SortButton label="Weekly goal" col="goal" sort={sort} onSort={k => { setSort(s => nextSort(s, k, 'desc')); setPage(0) }} align="right" /></TableHead>}
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
                      <button type="button" aria-expanded={open} className={`flex items-center gap-2 text-left ${fStyle ? 'text-[13px] text-[#134fb2] hover:underline' : ''}`}>
                        <ChevronRight size={14} className={`shrink-0 text-brand-subtext transition-transform ${open ? 'rotate-90' : ''}`} />
                        {r.name}
                      </button>
                    ) : r.name}
                  </TableCell>
                  {allSites && <TableCell className="text-brand-subtext">{r.sc.name}</TableCell>}
                  {roleColumn && <TableCell className="text-brand-subtext">{r.role}</TableCell>}
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
                  {goalColumn && (
                    <TableCell className="text-right">
                      {fStyle ? <GoalStatusBadge daysActive={r.days} /> : (
                      <span className={`inline-flex items-center rounded-[5px] px-2 py-0.5 text-xs font-medium ${r.met ? 'bg-org-green-100/85 text-org-green-800' : 'bg-brand-bg text-brand-text'}`}>
                        {r.met ? 'Goal met' : 'Not yet'}
                      </span>)}
                    </TableCell>
                  )}
                  <TableCell className="text-brand-subtext text-right">{r.last}</TableCell>
                </TableRow>
                {drilldown && open && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={cols} className="pl-10 py-3 bg-brand-bg/50">
                      {fStyle
                        ? <ContributionGraph name={r.name} role={r.role} daysActive={r.days} dayMap={educatorDayMap(r.sc.id, r.i)} />
                        : <EducatorActivityGrid schoolId={r.sc.id} teacherIndex={r.i} weeks={weeks} />}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={cols} className="text-center text-brand-subtext py-8">No users match your search.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {allSites && rows.length > PAGE_SIZE && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border text-[13px] text-brand-subtext">
          <span className="tabular-nums">{safePage * PAGE_SIZE + 1} to {Math.min(rows.length, (safePage + 1) * PAGE_SIZE)} of {rows.length} users</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={safePage === 0} onClick={() => setPage(safePage - 1)} className="h-8 px-3 rounded-md border border-brand-border bg-white font-medium text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:hover:bg-white">Previous</button>
            <button type="button" disabled={safePage >= pageCount - 1} onClick={() => setPage(safePage + 1)} className="h-8 px-3 rounded-md border border-brand-border bg-white font-medium text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-40 disabled:hover:bg-white">Next</button>
          </div>
        </div>
      )}
    </div>
  )
}

const toKey = d => format(d, 'yyyy-MM-dd')
const FILTER_MIN = toKey(FIRST_DATE)
const FILTER_MAX = toKey(LAST_DATE)
const DEFAULT_FILTERS = { site: 'all', role: 'all', start: schoolWeeks[schoolWeeks.length - 4], end: FILTER_MAX }

export default function ReportEngagement() {
  const [rangeKey, setRangeKey] = useState('30d')
  const [customWeeks, setCustomWeeks] = useState(null)
  const presetWeeks = RANGE_PRESETS.find(p => p.value === rangeKey)?.weeks
  const baseWeeks = useMemo(() => customWeeks ?? schoolWeeks.slice(-presetWeeks), [customWeeks, presetWeeks])

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [pickedSite, setSelectedSite] = useState(null)
  // A Site Leader has no district level: they open straight into their own
  // site (shared role switcher in the sidebar).
  const { isSiteLeaderView } = useRole()
  const { engagementConcept } = useEngagementConcept()

  // Concept A filters (2026-10-09): Site, User Role, Start and End date, applied with the Apply button
  // (the production paradigm). The default is the last 4 weeks. Other concepts keep their own range controls.
  const [draftFilters, setDraftFilters] = useState(DEFAULT_FILTERS)
  const [appliedFilters, setAppliedFilters] = useState(DEFAULT_FILTERS)
  const isF = engagementConcept === 'f'
  const isAFilters = engagementConcept === 'a' || isF
  const filterWeeks = useMemo(() => weeksForDates(parseISO(appliedFilters.start), parseISO(appliedFilters.end)), [appliedFilters])
  const weeks = isAFilters && filterWeeks.length ? filterWeeks : baseWeeks
  // The site modal edits the same applied dates (2026-10-09), so a change there changes the whole report.
  function setReportDates(patch) {
    const next = { ...appliedFilters, ...patch }
    setDraftFilters(d => ({ ...d, ...patch }))
    setAppliedFilters(next)
    const ws = weeksForDates(parseISO(next.start), parseISO(next.end))
    toast.success('Dates updated for the whole report', ws.length ? { description: rangeLabel(ws) } : undefined)
  }
  const siteFilter = isAFilters && appliedFilters.site !== 'all' ? Number(appliedFilters.site) : null
  const roleFilter = isAFilters ? appliedFilters.role : 'all'
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
      .filter(school => siteFilter == null || school.id === siteFilter)
      .map(school => {
        const b = weekBands(school.id, latest, roleFilter)
        return { school, meetingGoal: b.met, totalTeachers: b.total, pct: b.pct }
      })
      .filter(r => r.totalTeachers > 0)
      .filter(r => !q || r.school.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1
        if (sort.key === 'name') return dir * a.school.name.localeCompare(b.school.name)
        return dir * (a.pct - b.pct) || a.school.name.localeCompare(b.school.name)
      })
  }, [weeks, query, sort, siteFilter, roleFilter])

  // Sites table paging (2026-10-12): 10 per page, back to page 1 whenever the list changes.
  const [sitePage, setSitePage] = useState(1)
  const [sitePageSize, setSitePageSize] = useState(10)
  useEffect(() => { setSitePage(1) }, [query, sort, siteFilter, roleFilter, weeks, sitePageSize])
  const pagedSiteRows = siteRows.slice((sitePage - 1) * sitePageSize, sitePage * sitePageSize)

  function openSite(school) {
    if (engagementConcept === 'c') setSelectedSite(school)
    else setModalSite(school)
  }

  function exportCsv() {
    if (selectedSite) {
      const names = getRosterNames(selectedSite.id)
      const body = names.map((n, i) => `"${n}","${getLastActive(selectedSite.id, i)}"`).join('\n')
      const url = URL.createObjectURL(new Blob([`User,Last Active\n${body}`], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `${selectedSite.name.toLowerCase().replace(/\s+/g, '-')}-users.csv`
      a.click()
      URL.revokeObjectURL(url)
      return
    }
    const header = `Site,Users meeting goal,Total users\n`
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
  // Concept A has no range button now: its dates live in the Filters panel.
  const rangeControls = engagementConcept === 'a' ? null : (
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
  // E (2026-10-08) starts as a copy of D (same layout, minus the two stat cards) and diverges from there.
  const isE = (engagementConcept === 'e' || engagementConcept === 'f') && !selectedSite
  const isD = (engagementConcept === 'd' || engagementConcept === 'e' || engagementConcept === 'f') && !selectedSite
  const rangeHeader = isC || (isD && !isF)
  // Concept A (2026-10-07): the weekly goal is a quiet info badge, not a link, and the subtext is gone.
  const isA = engagementConcept === 'a' && !selectedSite
  // A Site Leader in Concept A (2026-10-09) gets the same quiet header: no goal link, no subtext.
  const isAHeader = isF || (engagementConcept === 'a' && (isA || isSiteLeaderView))
  // Concept B (2026-10-07) gets the same goal badge and no subtext.
  // Concept C gets it on both its district view and its site page (2026-10-07).
  // A's pill removed 2026-10-08: its graph title now states the goal instead.
  const goalBadge = (engagementConcept === 'b' && !selectedSite) || engagementConcept === 'c'
  const latestRow = analytics[analytics.length - 1]
  const lessonsInRange = analytics.reduce((sum, r) => sum + r.lessons, 0)

  // Print (2026-10-08, Concept A): the page prints through PrintReport. The PDF's file name comes from document.title.
  const printLatest = weekBands(siteFilter, weeks[weeks.length - 1], roleFilter)
  const printTitle = `Engagement, ${rangeLabel(weeks)}`
  function printReport(then) {
    const prevTitle = document.title
    document.title = printTitle
    window.addEventListener('afterprint', () => { document.title = prevTitle; then?.() }, { once: true })
    window.print()
  }

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
            {isF && (
              <Link to="/settings" className="inline-flex items-center gap-1.5 text-[13px] text-brand-subtext hover:text-brand-text hover:underline transition-colors">
                <Target size={13} aria-hidden="true" /> Weekly goal: {GOAL} lessons per week
              </Link>
            )}
            {!rangeHeader && !goalBadge && !isAHeader && (
              <Link to="/settings" className="text-sm text-interactive-blue hover:underline">
                Weekly goal: {GOAL} lessons per week
              </Link>
            )}
          </div>
          {!rangeHeader && !goalBadge && !isAHeader && (
            <p className="text-sm text-brand-subtext mt-1">
              {selectedSite ? `Users at ${selectedSite.name}. Open a user to see their activity.` : 'This report shows Move This World lesson completion across your district, by site.'}
            </p>
          )}
        </div>

      {rangeHeader ? (
        <div className="flex items-center gap-2">
          {!isF && <RangePicker
            weekly
            weekStarts={schoolWeeks}
            presets={RANGE_PRESETS}
            value={rangeKey}
            label={rangeLabel(weeks)}
            range={{ from: parseISO(weeks[0]), to: addDays(parseISO(weeks[weeks.length - 1]), 4) }}
            month={parseISO(weeks[0])}
            minDate={FIRST_DATE}
            maxDate={LAST_DATE}
            className={isE ? 'text-[#134fb2] [&>svg]:text-[#134fb2]' : undefined}
            onPreset={k => { setRangeKey(k); setCustomWeeks(null) }}
            onRange={({ from, to }) => {
              const ws = weeksForDates(from, to)
              if (ws.length) { setCustomWeeks(ws); setRangeKey('custom') }
            }}
          />}
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
        {/* Graph A/B switcher removed 2026-10-09 (kept on the engagement-prototype-full branch). Graph A is the only graph; setGraph and the month view stay in the code. */}
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
              {!isF && <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors" onClick={() => { printReport(); setMenuOpen(false) }}>
                <Printer size={13} className="text-brand-subtext" /> Print
              </button>}
            </div>
          )}
        </div>
        </div>
      )}
      </div>

      {isAFilters && (
        <FiltersPanel
          draft={draftFilters}
          onChange={setDraftFilters}
          onApply={() => { setAppliedFilters(draftFilters); if (isF) setDSiteId(draftFilters.site === 'all' ? null : Number(draftFilters.site)) }}
          onReset={() => { setDraftFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); if (isF) setDSiteId(null) }}
          sites={schools}
          roles={USER_ROLES}
          showSite={!isSiteLeaderView}
          minDate={FILTER_MIN}
          maxDate={FILTER_MAX}
        />
      )}

      {selectedSite ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            className="bg-white rounded-xl border border-brand-border p-5 mb-6"
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="text-base font-semibold text-brand-text">{stacked || graph === 'b' ? 'Users who met their weekly goal' : engagementConcept === 'a' ? 'Users completing 3 lessons a week' : '% of users meeting goal'}</p>
              {graph === 'b' ? monthControls : rangeControls}
            </div>
            {graph === 'b' ? <MonthBarChart schoolId={selectedSite.id} weeks={month.weeks} role={roleFilter} /> : stacked ? <StackedGoalChart schoolId={selectedSite.id} weeks={weeks} /> : <SiteWeeklyChart schoolId={selectedSite.id} weeks={weeks} role={roleFilter} />}
          </motion.div>
          <SiteEducators school={selectedSite} weeks={weeks} role={roleFilter} showDots={engagementConcept !== 'c' && !isSiteLeaderView} showDays={!isSiteLeaderView || isF} drilldown={!isSiteLeaderView || isF} goalColumn={(isSiteLeaderView && engagementConcept === 'a') || isF} fStyle={isF} roleColumn={isF} />
        </>
      ) : (
        <>
      {/* Summary cards commented out 2026-10-06 (chart now spans the full width).
          To restore, put the grid back to grid-cols-[minmax(240px,300px)_1fr] and uncomment:
        <div className="flex flex-col gap-4">
          <SummaryCard label="Sites meeting goal" {...cards.sites} />
          <SummaryCard label="Users meeting goal" {...cards.educators} />
          <SummaryCard label="Consistency" {...cards.consistency} note={`Weeks with ${CONSISTENCY_THRESHOLD}%+ of users on goal`} />
        </div>
      */}
      {isD ? (
        <EngagementOverviewD weeks={weeks} selectedId={dSiteId} onSelect={setDSiteId} showCards={!isE} role={roleFilter} />
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
            <p className={`${isA ? 'text-[15px]' : 'text-base'} font-semibold text-brand-text`}>{isA ? 'Users completing 3 lessons a week' : 'Users who met their weekly goal'}</p>
            {graph === 'b' ? monthControls : rangeControls}
          </div>
          {graph === 'b' ? <MonthBarChart schoolId={siteFilter} weeks={month.weeks} role={roleFilter} /> : stacked ? <StackedGoalChart weeks={weeks} /> : <SiteGoalLineChart weeks={weeks} metric="educators" siteId={siteFilter} role={roleFilter} />}
        </motion.div>
      </div>
      )}

      {isD ? (
        <SiteEducators school={schools.find(sc => sc.id === dSiteId) ?? null} weeks={weeks} showDots={false} showDays={isF} drilldown={isF} goalColumn={isF} fStyle={isF} rangeBadge={isE ? rangeLabel(weeks) : null} role={roleFilter} roleColumn={isF} />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.14 }}
          className="bg-white rounded-xl border border-brand-border overflow-hidden"
        >
          <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-brand-border">
            <div className="flex-1 min-w-0">
              <SearchField value={query} onChange={setQuery} placeholder="Search sites" bg="bg-brand-bg/60" height="h-8" />
            </div>
            {/* Range chip (2026-10-09). The counts are for the latest week in the range. */}
            <span className="inline-flex items-center gap-1.5 shrink-0 text-[13px] font-medium text-brand-subtext tabular-nums">
              <Calendar size={12} aria-hidden="true" /> {rangeLabel(weeks)}
            </span>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-[13px] font-medium"><SortButton label="Site" col="name" sort={sort} onSort={k => setSort(s => nextSort(s, k))} /></TableHead>
                <TableHead className="text-[13px] font-medium text-right"><SortButton label="Users meeting goal" col="goal" sort={sort} onSort={k => setSort(s => nextSort(s, k, 'desc'))} align="right" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagedSiteRows.map(({ school, meetingGoal, totalTeachers, pct }) => (
                <TableRow key={school.id} onClick={() => openSite(school)} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <button type="button" onClick={e => { e.stopPropagation(); openSite(school) }} className="text-left text-[13px] text-[#134fb2] hover:underline transition-colors">{school.name}</button>
                  </TableCell>
                  <TableCell className="text-brand-text text-right tabular-nums">
                    <span className="inline-flex items-center justify-end gap-2">
                      {meetingGoal} of {totalTeachers}
                      <span className="inline-flex items-center rounded-[5px] bg-brand-bg px-2 py-0.5 text-xs font-medium">{pct}%</span>
                    </span>
                  </TableCell>
                </TableRow>
              ))}
              {siteRows.length === 0 && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={2} className="text-center text-brand-subtext py-8">No sites match your search.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <PaginationBar page={sitePage} pageSize={sitePageSize} total={siteRows.length} onPage={setSitePage} onPageSize={setSitePageSize} className="px-4 py-3 border-t border-brand-border" />
        </motion.div>
      )}
        </>
      )}

      {/* Educator drill-down: Concept A's modal opens a six-month calendar per educator (2026-10-09); other concepts stay off since 2026-10-08. */}
      {isA && (
        <PrintReport
          title="Engagement"
          rangeText={rangeLabel(weeks)}
          goalText={`Goal: ${GOAL} lessons per week`}
          generated={format(new Date(), 'MMM d, yyyy')}
          stats={[
            { label: 'Users on goal', value: `${printLatest.met} of ${printLatest.total}`, note: `Latest week, ${weekRangeLabel(printLatest.week)}` },
            { label: 'Share on goal', value: `${printLatest.pct}%`, note: 'Latest week' },
            { label: 'Sites', value: siteFilter == null ? schools.length : 1, note: siteFilter == null ? 'In your district' : 'Filtered' },
          ]}
          chartTitle={graph === 'b' ? 'Users who met their weekly goal' : 'Users completing 3 lessons a week'}
          chart={graph === 'b' ? <MonthBarChart schoolId={siteFilter} weeks={month.weeks} role={roleFilter} /> : <SiteGoalLineChart weeks={weeks} metric="educators" siteId={siteFilter} role={roleFilter} />}
          columns={['Site', 'Users meeting goal']}
          rows={siteRows.map(r => ({ name: r.school.name, value: `${r.meetingGoal} of ${r.totalTeachers} (${r.pct}%)` }))}
        />
      )}

      {modalSite && <SiteDetailModal school={modalSite} weeks={weeks} onClose={() => setModalSite(null)} title="Users meeting goal" drilldown={engagementConcept === 'a'} drilldownView="calendar" role={roleFilter} dateFilter={engagementConcept === 'a' ? { start: appliedFilters.start, end: appliedFilters.end, min: FILTER_MIN, max: FILTER_MAX, onChange: setReportDates } : null} showMenu={engagementConcept === 'a'} searchable={engagementConcept === 'a'} paginate={engagementConcept === 'a'} goalColumn bordered />}
    </div>
  )
}
