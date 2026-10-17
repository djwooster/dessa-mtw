import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { parseISO, addDays, format } from 'date-fns'
import { MoreHorizontal, Download, Printer, ExternalLink, ChartLine, Table2, CalendarRange, ChevronRight, ChevronLeft, ChevronDown, Check, Info, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import * as Tooltip from '@radix-ui/react-tooltip'
import { schools, schoolWeeks, getWeekData, USER_ROLES, NO_SCHOOL_WEEKS, matchesSite } from '../lib/report2Data'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { RangePicker } from '../components/ui/range-picker'
import { Tabs, TabsList, TabsTrigger } from '../components/ui/tabs'
import { useRole } from '../lib/roleContext'
import { useEngagementConcept } from '../lib/engagementConceptContext'
import { useEngagementVersion } from '../lib/engagementVersionContext'
import { usePersistedState } from '../lib/usePersistedState'
import StackedGoalChart, { weekBands } from '../components/engagement/StackedGoalChart'
import EngagementOverviewD from '../components/engagement/EngagementOverviewD'
import { PaginationBar } from '../components/ui/pagination'
import FiltersPanel from '../components/engagement/FiltersPanel'
import WeeklyGoalTable, { weeklyGoalRows } from '../components/engagement/WeeklyGoalTable'
import SitesGoalTable, { siteGoalRows } from '../components/engagement/SitesGoalTable'
import GoalStatusBadge from '../components/engagement/GoalStatusBadge'
import EducatorCalendar from '../components/engagement/EducatorCalendar'
import PrintReport from '../components/engagement/PrintReport'
import GoalBanner from '../components/engagement/GoalBanner'
import EngagementYear from '../components/engagement/EngagementYear'
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

function SiteEducators({ school, weeks, showDots = true, showDays = true, drilldown = true, rangeBadge = null, goalColumn = false, roleColumn = false, fStyle = false, role = 'all', siteList = null, stateKey = null }) {
  const latest = weeks[weeks.length - 1]
  const weekIdx = schoolWeeks.indexOf(latest)
  const [openKey, setOpenKey] = useState(null)
  // stateKey keeps the search, sort and page when the user comes back from a site page.
  const [query, setQuery] = usePersistedState(stateKey && `${stateKey}.query`, '')
  const [sort, setSort] = usePersistedState(stateKey && `${stateKey}.sort`, { key: 'name', dir: 'asc' })
  const [page, setPage] = usePersistedState(stateKey && `${stateKey}.page`, 0)
  const [pageSize, setPageSize] = usePersistedState(stateKey && `${stateKey}.pageSize`, 10)
  // siteList (Concept F and B pick several sites) wins over the single `school`; no site means every site.
  const list = siteList && siteList.length ? siteList : school ? [school] : schools
  const allSites = list.length > 1

  const base = useMemo(() => list.flatMap(sc => {
    const names = getRosterNames(sc.id)
    const data = getWeekData(sc.id, latest, GOAL).teachers
    return names.map((name, i) => ({ name, i })).filter(({ i }) => role === 'all' || data[i].role === role).map(({ name, i }) => {
      const days = data[i].daysActive
      return { key: `${sc.id}-${i}`, sc, name, i, role: data[i].role, days, met: data[i].metGoal, active: new Set(activeDayOrder(sc.id, i, weekIdx).slice(0, days)), last: getLastActive(sc.id, i)}
    })
  }), [list, latest, weekIdx, role])

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

  // Concept F pages every user list with the shared Resources-page pagination (10 per page).
  const size = fStyle ? pageSize : PAGE_SIZE
  const pageCount = Math.max(1, Math.ceil(rows.length / size))
  const safePage = Math.min(page, pageCount - 1)
  const shown = allSites || fStyle ? rows.slice(safePage * size, (safePage + 1) * size) : rows
  const cols = (allSites ? 5 : 4) - (showDots ? 0 : 1) - (showDays ? 0 : 1) + (goalColumn ? 1 : 0) + (roleColumn ? 1 : 0)

  const weekStart = parseISO(latest)
  const dayLetters = ['M', 'T', 'W', 'T', 'F']

  return (
    <div className={`bg-white rounded-xl border border-brand-border overflow-hidden ${fStyle ? '[&_td]:text-[13px]' : ''}`}>
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
                  <TableCell className="text-brand-subtext text-right">
                    {r.last}
                  </TableCell>
                </TableRow>
                {drilldown && open && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={cols} className="pl-10 py-3 bg-brand-bg/50">
                      {/* F uses the standard EducatorCalendar (2026-10-13, manager's call). The GitHub-style version is saved in components/engagement/ContributionGraph.jsx; swap it back in here. */}
                      {fStyle
                        ? <EducatorCalendar dayMap={educatorDayMap(r.sc.id, r.i)} />
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
      {fStyle && <PaginationBar page={safePage + 1} pageSize={pageSize} total={rows.length} onPage={p => { setPage(p - 1); setOpenKey(null) }} onPageSize={n => { setPageSize(n); setPage(0) }} className="px-4 py-3 border-t border-brand-border" />}
      {!fStyle && allSites && rows.length > PAGE_SIZE && (
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
const DEFAULT_FILTERS = { site: [], role: 'all', start: schoolWeeks[schoolWeeks.length - 4], end: FILTER_MAX }

function ReportEngagementA() {
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
  const siteFilter = isAFilters && appliedFilters.site.length ? appliedFilters.site.map(Number) : null
  const roleFilter = isAFilters ? appliedFilters.role : 'all'
  const stacked = engagementConcept === 'b'
  // In-page graph switcher (2026-10-06): A is the chart each Nav concept
  // already shows; B is the month view (nested month control, one bar per
  // week), whose month only drives that chart.
  const [graph, setGraph] = useState('a')
  // Site clicks (2026-10-07): A and B open the shared site modal, C keeps its site page, D selects the site in its panel.
  const [modalSite, setModalSite] = useState(null)
  const [dSiteIds, setDSiteIds] = useState([])
  // Chart | Table switch on the weekly goal graph (2026-10-14, Concept F).
  const [graphView, setGraphView] = useState('chart')
  // Graph | Table tabs under the page title (2026-10-16): Table shows the Year to date table in place.
  const [overviewTab, setOverviewTab] = useState('graph')
  const [monthIdx, setMonthIdx] = useState(DEFAULT_MONTH_IDX)
  const month = MONTHS[monthIdx]
  // A site page (2026-10-15): clicking a site in the table opens engagement/site/:id, which looks like the
  // Site Leader view with a breadcrumb back to the high-level report.
  const navigate = useNavigate()
  const subPath = useParams()['*'] ?? ''
  const routeSiteId = Number(subPath.match(/^site\/(\d+)/)?.[1])
  // Week by week page (2026-10-15): engagement/year, the whole school year by site for screenshots.
  // Site Leaders get it too (2026-10-16, it has its own nav item), showing just their site.
  const isYearPage = isF && subPath === 'year'
  const { yearLayout } = useEngagementVersion()
  const routeSite = schools.find(sc => sc.id === routeSiteId) ?? null
  const showTabs = isF && !routeSite && !isYearPage
  const showTable = showTabs && overviewTab === 'table'
  const selectedSite = isSiteLeaderView ? schools[0] : routeSite ?? pickedSite
  // Opening a site remembers where the report was scrolled; coming back (the breadcrumb or the browser
  // back button) puts the page there, and the tables keep their sort, page and search (usePersistedState).
  const overviewScroll = useRef(0)
  const routeKey = routeSite?.id ?? (isYearPage ? 'year' : null)
  const lastRouteId = useRef(routeKey)
  function openSitePage(id) {
    overviewScroll.current = window.scrollY
    navigate(`/reports/engagement/site/${id}`)
  }
  function openYearPage() {
    overviewScroll.current = window.scrollY
    navigate('/reports/engagement/year')
  }
  useEffect(() => {
    if (routeKey === lastRouteId.current) return
    lastRouteId.current = routeKey
    const y = routeKey ? 0 : overviewScroll.current
    requestAnimationFrame(() => window.scrollTo(0, y))
  }, [routeKey])

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
    setDSiteIds([])
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
      .filter(school => matchesSite(siteFilter, school.id))
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
    if (isF && selectedSite && graphView === 'table') {
      const { sites } = siteGoalRows(selectedSite ? [selectedSite.id] : dSiteIds, weeks, roleFilter)
      const body = sites.map(r => `"${r.name}",${r.users},${r.met},${r.pct}%`).join('\n')
      const url = URL.createObjectURL(new Blob([`Site,Users,Met goal,% met\n${body}`], { type: 'text/csv' }))
      const a = document.createElement('a')
      a.href = url
      a.download = 'engagement-by-site.csv'
      a.click()
      URL.revokeObjectURL(url)
      return
    }
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
  const viewSwitch = (
    <Tabs value={graphView} onValueChange={setGraphView}>
      <TabsList className="p-0.5">
        <TabsTrigger value="chart" className="gap-1.5 text-[13px] px-3 py-1"><ChartLine size={13} aria-hidden="true" /> Chart</TabsTrigger>
        <TabsTrigger value="table" className="gap-1.5 text-[13px] px-3 py-1"><Table2 size={13} aria-hidden="true" /> Table</TabsTrigger>
      </TabsList>
    </Tabs>
  )
  // The overview's chart card links to the Year to date page (2026-10-15). Its Chart | Table switch was removed
  // 2026-10-16 (the Year to date page shows that table), so the overview is always the chart.
  const yearLink = (
    <button type="button" onClick={openYearPage} className="inline-flex items-center gap-1.5 h-8 px-3 shrink-0 rounded-md border border-brand-border bg-white text-[13px] font-medium text-brand-text hover:bg-brand-bg transition-colors">
      <CalendarRange size={14} className="text-brand-subtext" aria-hidden="true" /> Year to date
    </button>
  )
  const rangeControls = isAFilters ? (isF ? viewSwitch : null) : (
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
  // F prints the site shown on screen: the one picked in the sites panel, or a Site Leader's own site.
  const printSiteId = isF ? (isSiteLeaderView ? schools[0].id : dSiteIds.length ? dSiteIds : null) : siteFilter
  const printRows = printSiteId == null ? siteRows : siteRows.filter(r => matchesSite(printSiteId, r.school.id))
  const printLatest = weekBands(printSiteId, weeks[weeks.length - 1], roleFilter)
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

  if (isYearPage) return <EngagementYear key={isSiteLeaderView ? 'site-leader' : 'all'} siteIds={appliedFilters.site.map(Number)} role={roleFilter} layout={yearLayout} lockedSiteId={isSiteLeaderView ? schools[0].id : null} />

  return (
    <div className={`px-6 pb-8 ${isF && routeSite && !isSiteLeaderView ? 'pt-10' : 'pt-8'}`}>
      {isF && routeSite && !isSiteLeaderView && (
        <nav aria-label="Breadcrumb" className="mb-10">
          <ol className="flex items-center gap-1.5 text-[13px] text-brand-subtext">
            <li><Link to="/reports/engagement" className="hover:text-brand-text hover:underline transition-colors">Engagement</Link></li>
            <li aria-hidden="true"><ChevronRight size={12} /></li>
            <li aria-current="page" className="text-brand-text">{routeSite.name}</li>
          </ol>
        </nav>
      )}
      <div className={`flex flex-wrap items-end justify-between gap-x-6 gap-y-4 ${isC ? 'mb-[72px]' : showTabs ? 'mb-3' : 'mb-6'}`}>
        <div className="min-w-0">
          {/* The breadcrumb above replaces the plain back link in Concept F (2026-10-15). */}
          {selectedSite && !isSiteLeaderView && !isF && (
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
      ) : !showTable && (
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
              <button className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors" onClick={() => { printReport(); setMenuOpen(false) }}>
                <Printer size={13} className="text-brand-subtext" /> Print
              </button>
            </div>
          )}
        </div>
        </div>
      )}
      </div>

      {showTabs && (
        <div role="tablist" aria-label="Engagement views" className="flex gap-4 border-b border-brand-border mb-6">
          {[['graph', 'Graph'], ['table', 'Table']].map(([k, label]) => (
            <button
              key={k} type="button" role="tab" aria-selected={overviewTab === k}
              onClick={() => setOverviewTab(k)}
              className={`pb-2 -mb-px text-sm font-medium border-b-2 transition-colors ${overviewTab === k ? 'border-dessa-teal text-brand-text' : 'border-transparent text-brand-subtext hover:text-brand-text'}`}
            >{label}</button>
          ))}
        </div>
      )}

      {/* Weekly goal callout (2026-10-13): a rounded callout under the page title so the goal is on screen in screenshots.
          Back on 2026-10-16 after trying it as page subtext; the Year to date report shows it too. */}
      {isF && <GoalBanner />}

      {isAFilters && !showTable && (
        <FiltersPanel
          draft={draftFilters}
          onChange={setDraftFilters}
          onApply={() => { setAppliedFilters(draftFilters); if (isF) setDSiteIds(draftFilters.site.map(Number)) }}
          onReset={() => { setDraftFilters(DEFAULT_FILTERS); setAppliedFilters(DEFAULT_FILTERS); if (isF) setDSiteIds([]) }}
          sites={schools}
          roles={USER_ROLES}
          showSite={!isSiteLeaderView && !selectedSite}
          minDate={FILTER_MIN}
          maxDate={FILTER_MAX}
        />
      )}

      {showTable ? (
        <EngagementYear embedded siteIds={appliedFilters.site.map(Number)} role={roleFilter} layout="halves5" lockedSiteId={isSiteLeaderView ? schools[0].id : null} />
      ) : selectedSite ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            className="bg-white rounded-xl border border-brand-border p-5 mb-6"
          >
            <div className="flex items-center justify-between gap-4 mb-4">
              <p className="text-base font-semibold text-brand-text">{stacked || graph === 'b' ? 'Users who met their weekly goal' : isAFilters ? 'Users completing 3 lessons a week' : '% of users meeting goal'}</p>
              {graph === 'b' ? monthControls : rangeControls}
            </div>
            {isF && graphView === 'table' ? <SitesGoalTable siteIds={[selectedSite.id]} weeks={weeks} role={roleFilter} /> : graph === 'b' ? <MonthBarChart schoolId={selectedSite.id} weeks={month.weeks} role={roleFilter} /> : stacked ? <StackedGoalChart schoolId={selectedSite.id} weeks={weeks} /> : <SiteWeeklyChart schoolId={selectedSite.id} weeks={weeks} role={roleFilter} />}
          </motion.div>
          <SiteEducators school={selectedSite} weeks={weeks} role={roleFilter} showDots={engagementConcept !== 'c' && !isSiteLeaderView && !isF} showDays={!isSiteLeaderView && !isF} drilldown={!isSiteLeaderView || isF} goalColumn={isSiteLeaderView && engagementConcept === 'a'} fStyle={isF} roleColumn={isF} />
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
        <EngagementOverviewD weeks={weeks} selectedId={dSiteIds.length === 1 ? dSiteIds[0] : null} selectedIds={isF ? dSiteIds : null} onSelect={id => setDSiteIds(id == null ? [] : [id])} showCards={!isE} role={roleFilter} viewSwitch={isF ? yearLink : null} view="chart" rangeText={rangeLabel(weeks)} showSiteList={!isF} onOpenSite={openSitePage} />
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
        <SiteEducators siteList={isF && dSiteIds.length ? schools.filter(sc => dSiteIds.includes(sc.id)) : null} school={!isF ? schools.find(sc => dSiteIds.length === 1 && sc.id === dSiteIds[0]) ?? null : null} weeks={weeks} showDots={false} showDays={false} drilldown={isF} goalColumn={false} fStyle={isF} rangeBadge={isE ? rangeLabel(weeks) : null} role={roleFilter} roleColumn={isF} stateKey={isF ? 'overviewUsers' : null} />
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
      {(isA || isF) && !showTable && (
        <PrintReport
          title="Engagement"
          rangeText={rangeLabel(weeks)}
          goalText={`Goal: ${GOAL} lessons per week`}
          generated={format(new Date(), 'MMM d, yyyy')}
          stats={[
            { label: 'Users on goal', value: `${printLatest.met} of ${printLatest.total}`, note: `Latest week, ${weekRangeLabel(printLatest.week)}` },
            { label: 'Share on goal', value: `${printLatest.pct}%`, note: 'Latest week' },
            { label: 'Sites', value: printSiteId == null ? schools.length : Array.isArray(printSiteId) ? printSiteId.length : 1, note: printSiteId == null ? 'In your district' : 'Filtered' },
          ]}
          chartTitle={graph === 'b' ? 'Users who met their weekly goal' : 'Users completing 3 lessons a week'}
          chart={graph === 'b' ? <MonthBarChart schoolId={siteFilter} weeks={month.weeks} role={roleFilter} /> : <SiteGoalLineChart weeks={weeks} metric="educators" siteId={printSiteId} role={roleFilter} />}
          columns={['Site', 'Users meeting goal']}
          rows={printRows.map(r => ({ name: r.school.name, value: `${r.meetingGoal} of ${r.totalTeachers} (${r.pct}%)` }))}
        />
      )}

      {modalSite && <SiteDetailModal school={modalSite} weeks={weeks} onClose={() => setModalSite(null)} title="Users meeting goal" drilldown={engagementConcept === 'a'} drilldownView="calendar" role={roleFilter} dateFilter={engagementConcept === 'a' ? { start: appliedFilters.start, end: appliedFilters.end, min: FILTER_MIN, max: FILTER_MAX, onChange: setReportDates } : null} showMenu={engagementConcept === 'a'} searchable={engagementConcept === 'a'} paginate={engagementConcept === 'a'} goalColumn bordered />}
    </div>
  )
}

// ─── Version B (2026-10-15) ──────────────────────────────────────────────────
// A normal date range, like A (Site, User role, Start and End date, Apply) and two tabs (the stat
// strip tried here was removed 2026-10-15). Tabs: Sites (the chart for the
// range, or a one-row-per-site table) and Users (the users table). Clicking a site opens the Users
// tab filtered to that site. Winter break weeks are left out of the range.
const B_WEEKS = schoolWeeks.filter(w => !NO_SCHOOL_WEEKS.includes(w))

function rangeStats(siteId, role, weekList) {
  let met = 0, total = 0, lessons = 0
  const active = new Set()
  const everyone = new Set()
  schools.filter(sc => matchesSite(siteId, sc.id)).forEach(sc => {
    weekList.forEach(w => {
      getWeekData(sc.id, w, GOAL).teachers.forEach((t, i) => {
        if (role !== 'all' && t.role !== role) return
        everyone.add(`${sc.id}-${i}`)
        total += 1
        if (t.metGoal) met += 1
        lessons += t.daysActive
        if (t.daysActive > 0) active.add(`${sc.id}-${i}`)
      })
    })
  })
  return { pct: total ? Math.round((met / total) * 100) : 0, lessons, active: active.size, users: everyone.size }
}

const sign = n => (n > 0 ? '+' : n < 0 ? '−' : '')
function SitesOverviewTable({ weeks, role, siteId, onOpenSite }) {
  const [sort, setSort] = useState({ key: 'pct', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const latest = weeks[weeks.length - 1]
  const prevWeek = B_WEEKS[B_WEEKS.indexOf(latest) - 1] ?? null
  const rowFor = id => {
    const cur = weekBands(id, latest, role)
    const prev = prevWeek ? weekBands(id, prevWeek, role) : null
    const avg = rangeStats(id, role, weeks).pct
    return { ...cur, avg, delta: prev && prev.total ? cur.pct - prev.pct : null }
  }
  const allRow = useMemo(() => rowFor(siteId), [siteId, weeks, role])
  const rows = useMemo(() => schools
    .filter(sc => matchesSite(siteId, sc.id))
    .map(sc => ({ sc, ...rowFor(sc.id) }))
    .filter(r => r.total > 0)
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1
      if (sort.key === 'name') return dir * a.sc.name.localeCompare(b.sc.name)
      if (sort.key === 'users') return dir * (a.total - b.total) || a.sc.name.localeCompare(b.sc.name)
      if (sort.key === 'avg') return dir * (a.avg - b.avg) || a.sc.name.localeCompare(b.sc.name)
      if (sort.key === 'delta') return dir * ((a.delta ?? -999) - (b.delta ?? -999)) || a.sc.name.localeCompare(b.sc.name)
      return dir * (a.pct - b.pct) || a.sc.name.localeCompare(b.sc.name)
    }), [siteId, weeks, role, sort])
  useEffect(() => { setPage(1) }, [weeks, siteId, role])
  const shown = rows.slice((page - 1) * pageSize, page * pageSize)
  const deltaText = d => d == null ? '–' : `${sign(d)}${Math.abs(d)} pts`
  const resort = (k, first) => { setSort(s => nextSort(s, k, first)); setPage(1) }
  const right = 'text-right tabular-nums'

  return (
    <div className="rounded-lg border border-brand-border overflow-hidden [&_td]:text-[13px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[13px] font-medium"><SortButton label="Site" col="name" sort={sort} onSort={k => resort(k)} /></TableHead>
            <TableHead className="text-[13px] font-medium text-right"><SortButton label="Users" col="users" sort={sort} onSort={k => resort(k, 'desc')} align="right" /></TableHead>
            <TableHead className="text-[13px] font-medium text-right"><SortButton label="Latest week" col="pct" sort={sort} onSort={k => resort(k)} align="right" /></TableHead>
            <TableHead className="text-[13px] font-medium text-right"><SortButton label="Range average" col="avg" sort={sort} onSort={k => resort(k)} align="right" /></TableHead>
            <TableHead className="text-[13px] font-medium text-right"><SortButton label="vs last week" col="delta" sort={sort} onSort={k => resort(k, 'desc')} align="right" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {!(siteId && siteId.length === 1) && <TableRow className="hover:bg-transparent bg-brand-bg/50">
            <TableCell className="font-semibold">{!siteId || !siteId.length ? 'All sites' : `${siteId.length} selected sites`}</TableCell>
            <TableCell className={`${right} font-semibold`}>{allRow.total}</TableCell>
            <TableCell className={`${right} font-semibold`}>{allRow.pct}%</TableCell>
            <TableCell className={`${right} font-semibold`}>{allRow.avg}%</TableCell>
            <TableCell className={`${right} font-semibold text-brand-subtext`}>{deltaText(allRow.delta)}</TableCell>
          </TableRow>}
          {shown.map(r => (
            <TableRow key={r.sc.id} onClick={() => onOpenSite(r.sc.id)} className="cursor-pointer">
              <TableCell className="font-medium">
                <button type="button" onClick={e => { e.stopPropagation(); onOpenSite(r.sc.id) }} className="text-left text-[13px] text-[#134fb2] hover:underline">{r.sc.name}</button>
              </TableCell>
              <TableCell className={`${right} text-brand-subtext`}>{r.total}</TableCell>
              <TableCell className={right} title={`${r.met} of ${r.total} users`}>{r.pct}%</TableCell>
              <TableCell className={right}>{r.avg}%</TableCell>
              <TableCell className={`${right} text-brand-subtext`}>{deltaText(r.delta)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar page={page} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={n => { setPageSize(n); setPage(1) }} className="px-4 py-3 border-t border-brand-border" />
    </div>
  )
}

function ReportEngagementB() {
  const { isSiteLeaderView } = useRole()
  const [tab, setTab] = useState('sites')
  const [view, setView] = useState('chart')
  const [draft, setDraft] = useState(DEFAULT_FILTERS)
  const [applied, setApplied] = useState(DEFAULT_FILTERS)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])

  const weeks = useMemo(() => {
    const ws = weeksForDates(parseISO(applied.start), parseISO(applied.end)).filter(w => !NO_SCHOOL_WEEKS.includes(w))
    return ws.length ? ws : B_WEEKS.slice(-4)
  }, [applied])
  const siteId = isSiteLeaderView ? [schools[0].id] : applied.site.length ? applied.site.map(Number) : null
  const role = applied.role
  const siteList = siteId ? schools.filter(sc => siteId.includes(sc.id)) : null
  const site = siteList && siteList.length === 1 ? siteList[0] : null

  const points = useMemo(() => weeks.map(w => {
    const b = weekBands(siteId, w, role)
    return { week: w, value: b.pct, detail: `${b.pct}% (${b.met} of ${b.total} users)` }
  }), [weeks, siteId, role])

  function openSite(id) {
    setApplied(a => ({ ...a, site: [String(id)] }))
    setDraft(d => ({ ...d, site: [String(id)] }))
    setTab('users')
  }
  function download(name, text) {
    const url = URL.createObjectURL(new Blob([text], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = name; a.click()
    URL.revokeObjectURL(url)
  }
  function exportCsv() {
    const latest = weeks[weeks.length - 1]
    if (tab === 'users') {
      const lines = (siteList ?? schools).flatMap(sc => {
        const data = getWeekData(sc.id, latest, GOAL).teachers
        return getRosterNames(sc.id).map((n, i) => ({ n, i })).filter(({ i }) => role === 'all' || data[i].role === role)
          .map(({ n, i }) => `"${n}","${sc.name}","${data[i].role}","${getLastActive(sc.id, i)}"`)
      })
      download('engagement-users.csv', `User,Site,Role,Last Active\n${lines.join('\n')}`)
      return
    }
    const prevWeek = B_WEEKS[B_WEEKS.indexOf(latest) - 1] ?? null
    const lines = schools.filter(sc => matchesSite(siteId, sc.id)).map(sc => {
      const cur = weekBands(sc.id, latest, role)
      const prev = prevWeek ? weekBands(sc.id, prevWeek, role) : null
      return `"${sc.name}",${cur.total},${cur.met},${cur.pct}%,${rangeStats(sc.id, role, weeks).pct}%,${prev && prev.total ? cur.pct - prev.pct : ''}`
    })
    download('engagement-sites.csv', `Site,Users,Met goal (latest week),Latest week %,Range average %,Change vs last week (pts)\n${lines.join('\n')}`)
  }

  const viewSwitch = (
    <Tabs value={view} onValueChange={setView}>
      <TabsList className="p-0.5">
        <TabsTrigger value="chart" className="gap-1.5 text-[13px] px-3 py-1"><ChartLine size={13} aria-hidden="true" /> Chart</TabsTrigger>
        <TabsTrigger value="table" className="gap-1.5 text-[13px] px-3 py-1"><Table2 size={13} aria-hidden="true" /> Table</TabsTrigger>
      </TabsList>
    </Tabs>
  )

  return (
    <div className="px-6 pt-8 pb-8">
      <div className="flex items-end justify-between gap-6 mb-6">
        <h2 className="text-2xl font-semibold text-brand-text">Engagement</h2>
        <div className="relative shrink-0" ref={menuRef}>
          <button className="flex items-center justify-center w-8 h-8 rounded-md bg-white text-brand-text hover:bg-brand-bg transition-all" onClick={() => setMenuOpen(o => !o)} aria-label="More options" aria-expanded={menuOpen}>
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
      </div>

      <div role="note" className="flex items-center gap-2 rounded-lg border border-state-info/30 bg-state-infoLight px-4 py-2.5 mb-6 text-[13px] text-[#134fb2]">
        <Info size={14} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0"><span className="font-medium">Weekly goal: {GOAL} lessons per week.</span></p>
        <Link to="/settings" className="ml-auto shrink-0 inline-flex items-center gap-1 font-medium hover:underline">
          Change in Settings <ExternalLink size={12} aria-hidden="true" />
        </Link>
      </div>

      <FiltersPanel
        draft={draft}
        onChange={setDraft}
        onApply={() => setApplied(draft)}
        onReset={() => { setDraft(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS) }}
        sites={schools}
        roles={USER_ROLES}
        showSite={!isSiteLeaderView}
        minDate={FILTER_MIN}
        maxDate={FILTER_MAX}
      />

      <div role="tablist" className="flex gap-6 border-b border-brand-border mb-6">
        {[['sites', isSiteLeaderView ? 'Overview' : 'Sites'], ['users', 'Users']].map(([k, label]) => (
          <button
            key={k} type="button" role="tab" aria-selected={tab === k}
            onClick={() => setTab(k)}
            className={`pb-2.5 -mb-px text-sm font-medium border-b-2 transition-colors ${tab === k ? 'border-dessa-teal text-brand-text' : 'border-transparent text-brand-subtext hover:text-brand-text'}`}
          >{label}</button>
        ))}
      </div>

      {tab === 'sites' ? (
        <div className="rounded-xl border border-brand-border bg-white p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <h3 className="text-lg font-semibold text-brand-text">{site ? site.name : siteList ? `${siteList.length} sites` : 'All sites'}</h3>
            {viewSwitch}
          </div>
          <p className="text-[15px] font-semibold text-brand-text mb-4">Users completing 3 lessons a week</p>
          {view === 'chart' ? (
            <WeeklyBarChart label="Users who met the goal each week" kind="line" percent points={points} />
          ) : isSiteLeaderView ? (
            <WeeklyGoalTable schoolId={siteId && siteId[0]} weeks={weeks} role={role} rangeText={rangeLabel(weeks)} />
          ) : (
            <SitesOverviewTable weeks={weeks} role={role} siteId={siteId} onOpenSite={openSite} />
          )}
        </div>
      ) : (
        <SiteEducators siteList={siteList} weeks={weeks} role={role} showDots={false} showDays={false} drilldown goalColumn={false} fStyle roleColumn />
      )}
    </div>
  )
}

// ─── Version C (2026-10-15) ──────────────────────────────────────────────────
// School comparison first: no Site filter, just User role and the date range, and one table of
// every site by week (the pattern from the manager's mock-up). A bold All sites row sits on top,
// weeks run across the columns (newest first) with a weighted Range column at the end, and the
// first column is pinned when the weeks scroll sideways. Clicking a site opens the shared site modal.
function SitesMatrix({ weeks, role, siteId, onOpenSite }) {
  const [sort, setSort] = useState({ key: 'range', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const cols = useMemo(() => [...weeks].reverse(), [weeks])
  const build = id => {
    const cells = cols.map(w => weekBands(id, w, role))
    return { cells, range: rangeStats(id, role, weeks).pct, total: cells[0]?.total ?? 0 }
  }
  const allRow = useMemo(() => build(null), [cols, role])
  const rows = useMemo(() => schools
    .filter(sc => siteId == null || sc.id === siteId)
    .map(sc => ({ sc, ...build(sc.id) }))
    .filter(r => r.total > 0)
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1
      if (sort.key === 'name') return dir * a.sc.name.localeCompare(b.sc.name)
      return dir * (a.range - b.range) || a.sc.name.localeCompare(b.sc.name)
    }), [cols, role, siteId, sort])
  useEffect(() => { setPage(1) }, [weeks, role])
  const shown = rows.slice((page - 1) * pageSize, page * pageSize)
  const resort = (k, first) => { setSort(s => nextSort(s, k, first)); setPage(1) }
  const stick = 'sticky left-0 z-10 min-w-48'
  const cell = 'text-right tabular-nums min-w-16'

  const numberCells = (r, bold) => (
    <>
      {r.cells.map((c, i) => (
        <TableCell key={cols[i]} className={`${cell} ${bold ? 'font-semibold' : ''}`} title={`${weekRangeLabel(cols[i])}: ${c.met} of ${c.total} users`}>{c.pct}%</TableCell>
      ))}
      <TableCell className={`${cell} font-semibold`} title="Total who met the goal across the weeks, divided by total users across the weeks">{r.range}%</TableCell>
    </>
  )

  return (
    <div className="rounded-xl border border-brand-border bg-white overflow-hidden [&_td]:text-[13px]">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className={`${stick} bg-brand-bg text-[13px] font-medium`}><SortButton label="Site" col="name" sort={sort} onSort={k => resort(k)} /></TableHead>
              {cols.map(w => (
                <TableHead key={w} className={`${cell} text-[13px] font-medium`} title={weekRangeLabel(w)}>{format(parseISO(w), 'MMM d')}</TableHead>
              ))}
              <TableHead className={`${cell} text-[13px] font-medium`}><SortButton label="Range" col="range" sort={sort} onSort={k => resort(k)} align="right" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow className="hover:bg-transparent">
              <TableCell className={`${stick} bg-white font-semibold`}>{siteId == null ? 'All sites' : schools.find(sc => sc.id === siteId)?.name}</TableCell>
              {numberCells(allRow, true)}
            </TableRow>
            {siteId == null && shown.map(r => (
              <TableRow key={r.sc.id} onClick={() => onOpenSite(r.sc)} className="cursor-pointer group">
                <TableCell className={`${stick} bg-white group-hover:bg-brand-bg font-medium`}>
                  <button type="button" onClick={e => { e.stopPropagation(); onOpenSite(r.sc) }} className="text-left text-[13px] text-[#134fb2] hover:underline">{r.sc.name}</button>
                </TableCell>
                {numberCells(r, false)}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      {siteId == null && <PaginationBar page={page} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={n => { setPageSize(n); setPage(1) }} className="px-4 py-3 border-t border-brand-border" />}
    </div>
  )
}

function ReportEngagementC() {
  const { isSiteLeaderView } = useRole()
  const [draft, setDraft] = useState(DEFAULT_FILTERS)
  const [applied, setApplied] = useState(DEFAULT_FILTERS)
  const [modalSite, setModalSite] = useState(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [menuOpen])
  useEffect(() => {
    if (!modalSite) return
    const onKey = e => { if (e.key === 'Escape') setModalSite(null) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [modalSite])

  const weeks = useMemo(() => {
    const ws = weeksForDates(parseISO(applied.start), parseISO(applied.end)).filter(w => !NO_SCHOOL_WEEKS.includes(w))
    return ws.length ? ws : B_WEEKS.slice(-4)
  }, [applied])
  const role = applied.role
  const siteId = isSiteLeaderView ? schools[0].id : null

  function exportCsv() {
    const cols = [...weeks].reverse()
    const head = `Site,${cols.map(w => `"${weekRangeLabel(w)}"`).join(',')},Range`
    const lines = schools.filter(sc => siteId == null || sc.id === siteId).map(sc => {
      const cells = cols.map(w => `${weekBands(sc.id, w, role).pct}%`)
      return `"${sc.name}",${cells.join(',')},${rangeStats(sc.id, role, weeks).pct}%`
    })
    const url = URL.createObjectURL(new Blob([`${head}\n${lines.join('\n')}`], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url; a.download = 'engagement-by-site.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-6 pt-8 pb-8">
      <div className="flex items-end justify-between gap-6 mb-6">
        <h2 className="text-2xl font-semibold text-brand-text">Engagement</h2>
        <div className="relative shrink-0" ref={menuRef}>
          <button className="flex items-center justify-center w-8 h-8 rounded-md bg-white text-brand-text hover:bg-brand-bg transition-all" onClick={() => setMenuOpen(o => !o)} aria-label="More options" aria-expanded={menuOpen}>
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
      </div>

      <div role="note" className="flex items-center gap-2 rounded-lg border border-state-info/30 bg-state-infoLight px-4 py-2.5 mb-6 text-[13px] text-[#134fb2]">
        <Info size={14} className="shrink-0" aria-hidden="true" />
        <p className="min-w-0"><span className="font-medium">Weekly goal: {GOAL} lessons per week.</span></p>
        <Link to="/settings" className="ml-auto shrink-0 inline-flex items-center gap-1 font-medium hover:underline">
          Change in Settings <ExternalLink size={12} aria-hidden="true" />
        </Link>
      </div>

      <FiltersPanel
        draft={draft}
        onChange={setDraft}
        onApply={() => setApplied(draft)}
        onReset={() => { setDraft(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS) }}
        sites={schools}
        roles={USER_ROLES}
        showSite={false}
        minDate={FILTER_MIN}
        maxDate={FILTER_MAX}
      />

      <SitesMatrix weeks={weeks} role={role} siteId={siteId} onOpenSite={setModalSite} />

      {modalSite && <SiteDetailModal school={modalSite} weeks={weeks} onClose={() => setModalSite(null)} title="Users meeting goal" drilldown drilldownView="calendar" role={role} showMenu searchable paginate goalColumn={false} bordered />}
    </div>
  )
}

export default function ReportEngagement() {
  const { engagementVersion } = useEngagementVersion()
  return engagementVersion === 'c' ? <ReportEngagementC /> : engagementVersion === 'b' ? <ReportEngagementB /> : <ReportEngagementA />
}
