import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { parseISO, addDays, format } from 'date-fns'
import { MoreHorizontal, Download, Printer, ChevronRight } from 'lucide-react'
import { schools, schoolWeeks, getWeekData } from '../lib/report2Data'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { RangePicker } from '../components/ui/range-picker'
import { useRole } from '../lib/roleContext'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../components/ui/breadcrumb'
import {
  GOAL, RANGE_PRESETS, FIRST_DATE, LAST_DATE, rangeLabel, weeksForDates,
  SortButton, nextSort, SearchField, ChangeCell, SiteGoalLineChart, SiteWeeklyChart,
  getRosterNames, getLastActive, agoRank, activeDayOrder, WEEKDAYS, EducatorActivityGrid,
} from './Report2ConceptE'
import { PILL_LABELS, CONSISTENCY_THRESHOLD, districtWeek, SummaryCard, PresetPill } from './Report2ConceptF'

// Engagement (2026-10-06): the combined report, meant to replace both Site
// Engagement and Daily Curriculum Engagement. One page that drills from
// district to site to educator, built step by step. Step 2: the district
// level (range controls, summary cards, trend chart, site table), reusing
// Concept F's pieces. "Change vs last month" means the same thing on the
// cards and in the table: the latest week compared with four weeks earlier.
const MONTH_BACK = 4

// Educator list for one site (the drill-down level): this week's day dots,
// days this week, and last active, sortable and searchable. Opening a row
// shows that educator's activity grid for the selected range, one at a time.
function SiteEducators({ school, weeks }) {
  const names = useMemo(() => getRosterNames(school.id), [school.id])
  const latest = weeks[weeks.length - 1]
  const weekIdx = schoolWeeks.indexOf(latest)
  const [openIdx, setOpenIdx] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    const data = getWeekData(school.id, latest, GOAL).teachers
    return names
      .map((name, i) => {
        const days = data[i].daysActive
        return { name, i, days, active: new Set(activeDayOrder(school.id, i, weekIdx).slice(0, days)), last: getLastActive(school.id, i) }
      })
      .filter(r => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1
        if (sort.key === 'days') return dir * (a.days - b.days) || a.name.localeCompare(b.name)
        if (sort.key === 'last') return dir * (agoRank(a.last) - agoRank(b.last) || 0) || a.name.localeCompare(b.name)
        return dir * a.name.localeCompare(b.name)
      })
  }, [names, school.id, latest, weekIdx, query, sort])

  const weekStart = parseISO(latest)
  const dayLetters = ['M', 'T', 'W', 'T', 'F']

  return (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="px-4 py-3 border-b border-brand-border">
        <SearchField value={query} onChange={setQuery} placeholder="Search educators" />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[13px] font-medium"><SortButton label="Educator" col="name" sort={sort} onSort={k => setSort(s => nextSort(s, k))} /></TableHead>
            <TableHead className="text-[13px] font-medium">
              <span className="sr-only">This week</span>
              <span className="flex items-center gap-3" aria-hidden="true">
                {dayLetters.map((d, i) => <span key={i} className="w-3.5 text-center text-xs text-brand-subtext">{d}</span>)}
              </span>
            </TableHead>
            <TableHead className="text-[13px] font-medium"><SortButton label="Days this week" col="days" sort={sort} onSort={k => setSort(s => nextSort(s, k, 'desc'))} /></TableHead>
            <TableHead className="text-[13px] font-medium text-right"><SortButton label="Last Active" col="last" sort={sort} onSort={k => setSort(s => nextSort(s, k))} align="right" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => {
            const open = openIdx === r.i
            return (
              <Fragment key={r.name}>
                <TableRow onClick={() => setOpenIdx(open ? null : r.i)} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <button type="button" aria-expanded={open} className="flex items-center gap-2 text-left">
                      <ChevronRight size={14} className={`shrink-0 text-brand-subtext transition-transform ${open ? 'rotate-90' : ''}`} />
                      {r.name}
                    </button>
                  </TableCell>
                  <TableCell>
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
                  </TableCell>
                  <TableCell className="tabular-nums">{r.days} of {WEEKDAYS.length}</TableCell>
                  <TableCell className="text-brand-subtext text-right">{r.last}</TableCell>
                </TableRow>
                {open && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={4} className="pl-10 py-3 bg-brand-bg/50">
                      <EducatorActivityGrid schoolId={school.id} teacherIndex={r.i} weeks={weeks} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={4} className="text-center text-brand-subtext py-8">No educators match your search.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

export default function ReportEngagement() {
  const navigate = useNavigate()
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
  const selectedSite = isSiteLeaderView ? schools[0] : pickedSite

  useEffect(() => {
    if (!menuOpen) return
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  function resetAll() {
    setRangeKey('30d')
    setCustomWeeks(null)
    setQuery('')
    setSort({ key: 'name', dir: 'asc' })
    setSelectedSite(null)
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
    const idx = schoolWeeks.indexOf(latest)
    const q = query.trim().toLowerCase()
    return schools
      .map(school => {
        const data = getWeekData(school.id, latest, GOAL)
        const before = idx - MONTH_BACK >= 0 ? getWeekData(school.id, schoolWeeks[idx - MONTH_BACK], GOAL).pct : null
        return { school, meetingGoal: data.meetingGoal, totalTeachers: data.totalTeachers, pct: data.pct, change: before == null ? null : data.pct - before }
      })
      .filter(r => !q || r.school.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1
        if (sort.key === 'name') return dir * a.school.name.localeCompare(b.school.name)
        if (sort.key === 'change') {
          if (a.change == null || b.change == null) return (a.change == null) - (b.change == null)
          return dir * (a.change - b.change) || a.school.name.localeCompare(b.school.name)
        }
        return dir * (a.pct - b.pct) || a.school.name.localeCompare(b.school.name)
      })
  }, [weeks, query, sort])

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
    const header = `Site,Users meeting goal,Total users,Change vs last month (pts)\n`
    const body = siteRows.map(r => `"${r.school.name}",${r.meetingGoal},${r.totalTeachers},${r.change ?? ''}`).join('\n')
    const url = URL.createObjectURL(new Blob([header + body], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'engagement.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-6 pt-8 pb-8">
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="min-w-0">
          <Breadcrumb className="mb-2">
            <BreadcrumbList>
              <BreadcrumbItem><BreadcrumbLink onClick={() => navigate('/reports')}>Reports</BreadcrumbLink></BreadcrumbItem>
              <BreadcrumbSeparator />
              {selectedSite && !isSiteLeaderView ? (
                <>
                  <BreadcrumbItem><BreadcrumbLink onClick={() => setSelectedSite(null)}>Engagement</BreadcrumbLink></BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem><BreadcrumbPage>{selectedSite.name}</BreadcrumbPage></BreadcrumbItem>
                </>
              ) : (
                <BreadcrumbItem><BreadcrumbPage>Engagement</BreadcrumbPage></BreadcrumbItem>
              )}
            </BreadcrumbList>
          </Breadcrumb>
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-2xl font-semibold text-brand-text">{selectedSite ? selectedSite.name : 'Engagement'}</h2>
            <Link to="/settings" className="text-sm text-interactive-blue hover:underline">
              Weekly goal: {GOAL} lessons per week
            </Link>
          </div>
          <p className="text-sm text-brand-subtext mt-1">
            {selectedSite ? `Educators at ${selectedSite.name}. Open an educator to see their activity.` : 'This report shows Move This World lesson completion across your district, by site.'}
          </p>
        </div>
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

      <div className="flex items-center justify-end gap-2 mb-4">
        {RANGE_PRESETS.map(p => (
          <PresetPill key={p.value} active={rangeKey === p.value} onClick={() => { setRangeKey(p.value); setCustomWeeks(null) }}>
            {PILL_LABELS[p.value]}
          </PresetPill>
        ))}
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
        <button
          type="button"
          onClick={resetAll}
          className="h-8 px-3 rounded-md border border-brand-border bg-white text-[13px] font-medium text-brand-text hover:bg-brand-bg transition-colors"
        >
          Reset all
        </button>
      </div>

      {selectedSite ? (
        <>
          <motion.div
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
            className="bg-white rounded-xl border border-brand-border p-5 mb-6"
          >
            <p className="text-base font-semibold text-brand-text mb-4">% of educators meeting goal</p>
            <SiteWeeklyChart schoolId={selectedSite.id} weeks={weeks} />
          </motion.div>
          <SiteEducators school={selectedSite} weeks={weeks} />
        </>
      ) : (
        <>
      <div className="grid gap-4 mb-6 grid-cols-[minmax(240px,300px)_1fr]">
        <div className="flex flex-col gap-4">
          <SummaryCard label="Sites meeting goal" {...cards.sites} />
          <SummaryCard label="Educators meeting goal" {...cards.educators} />
          <SummaryCard label="Consistency" {...cards.consistency} note={`Weeks with ${CONSISTENCY_THRESHOLD}%+ of educators on goal`} />
        </div>
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
          className="min-w-0 bg-white rounded-xl border border-brand-border p-5"
        >
          <p className="text-base font-semibold text-brand-text mb-4">Sites where every educator met the weekly goal</p>
          <SiteGoalLineChart weeks={weeks} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.14 }}
        className="bg-white rounded-xl border border-brand-border overflow-hidden"
      >
        <div className="px-4 py-3 border-b border-brand-border">
          <SearchField value={query} onChange={setQuery} placeholder="Search sites" />
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[13px] font-medium"><SortButton label="Site" col="name" sort={sort} onSort={k => setSort(s => nextSort(s, k))} /></TableHead>
              <TableHead className="text-[13px] font-medium text-right"><SortButton label="Educators meeting goal" col="goal" sort={sort} onSort={k => setSort(s => nextSort(s, k, 'desc'))} align="right" /></TableHead>
              <TableHead className="text-[13px] font-medium text-right"><SortButton label="Change vs last month" col="change" sort={sort} onSort={k => setSort(s => nextSort(s, k, 'desc'))} align="right" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {siteRows.map(({ school, meetingGoal, totalTeachers, change }) => (
              <TableRow key={school.id} onClick={() => setSelectedSite(school)} className="cursor-pointer">
                <TableCell className="font-medium">
                  <button type="button" onClick={e => { e.stopPropagation(); setSelectedSite(school) }} className="text-left hover:text-dessa-teal transition-colors">{school.name}</button>
                </TableCell>
                <TableCell className="text-brand-text text-right">{meetingGoal} of {totalTeachers}</TableCell>
                <TableCell className="text-right"><ChangeCell change={change} /></TableCell>
              </TableRow>
            ))}
            {siteRows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={3} className="text-center text-brand-subtext py-8">No sites match your search.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </motion.div>
        </>
      )}
    </div>
  )
}
