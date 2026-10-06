// Concept F (2026-10-02): Concept E with two changes. The date control is a
// row of preset pills plus a calendar button and "Reset all" (instead of one
// range button in the chart card), and three summary cards sit to the left
// of the chart. Everything else (table, goal card, 3-dot menu, role
// switcher, site modal) is Concept E's, imported from it.
import { useState, useMemo, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { parseISO, addDays } from 'date-fns'
import { MoreHorizontal, Download, Printer, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { schools, schoolWeeks, getWeekData } from '../lib/report2Data'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { RangePicker } from '../components/ui/range-picker'
import { useRole } from '../lib/roleContext'
import {
  GOAL, RANGE_PRESETS, FIRST_DATE, LAST_DATE, rangeLabel, weeksForDates, previousWeeks,
  SortButton, nextSort, SearchField, ChangeCell, SiteGoalLineChart, SiteWeeklyChart,
  EducatorTable, SiteDetailModal, SiteEngagementBreadcrumb,
} from './Report2ConceptE'

export const PILL_LABELS = { '30d': '30D', '60d': '60D', '90d': '90D', all: 'School Year' }
// A week counts toward Consistency when at least this share of the
// district's educators met the weekly goal that week.
export const CONSISTENCY_THRESHOLD = 50

export function districtWeek(week) {
  let met = 0, total = 0, sitesMet = 0
  schools.forEach(s => {
    const d = getWeekData(s.id, week, GOAL)
    met += d.meetingGoal
    total += d.totalTeachers
    if (d.meetingGoal === d.totalTeachers) sitesMet += 1
  })
  return { met, total, sitesMet, sites: schools.length, educatorPct: Math.round((met / total) * 100) }
}

function Ring({ pct }) {
  const r = 24
  const c = 2 * Math.PI * r
  return (
    <div className="relative w-14 h-14 shrink-0" role="img" aria-label={`${pct}%`}>
      <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="6" className="stroke-brand-border" />
        <circle
          cx="28" cy="28" r={r} fill="none" strokeWidth="6" strokeLinecap="round"
          className="stroke-dessa-teal" strokeDasharray={c} strokeDashoffset={c * (1 - pct / 100)}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-brand-text">{pct}%</span>
    </div>
  )
}

function ChangeLine({ change }) {
  if (change == null) return <p className="text-xs text-brand-subtext mt-1">No earlier month to compare</p>
  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus
  return (
    <p className="flex items-center gap-1 text-xs text-brand-subtext mt-1">
      <Icon size={12} aria-hidden="true" />
      {change === 0 ? 'No change' : `${Math.abs(change)}%`} vs last month
    </p>
  )
}

export function SummaryCard({ label, value, pct, change, note }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-brand-border bg-white p-4">
      <div className="min-w-0">
        <p className="text-[13px] text-brand-subtext">{label}</p>
        <p className="text-2xl font-semibold text-brand-text leading-tight">{value}</p>
        {note ? <p className="text-xs text-brand-subtext mt-1">{note}</p> : <ChangeLine change={change} />}
      </div>
      <Ring pct={pct} />
    </div>
  )
}

export function PresetPill({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`h-8 px-3 rounded-md text-[13px] font-medium transition-colors ${
        active ? 'bg-dessa-tealLight text-dessa-teal' : 'bg-brand-bg text-brand-text hover:bg-brand-border'
      }`}
    >
      {children}
    </button>
  )
}

export default function Report2ConceptF() {
  const { isSiteLeaderView: isLeader } = useRole()
  const leaderSchool = schools[0]

  const [rangeKey, setRangeKey] = useState('30d')
  const [customWeeks, setCustomWeeks] = useState(null)
  const presetWeeks = RANGE_PRESETS.find(p => p.value === rangeKey)?.weeks
  const weeks = useMemo(() => customWeeks ?? schoolWeeks.slice(-presetWeeks), [customWeeks, presetWeeks])

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [selectedSite, setSelectedSite] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

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
  }

  // Summary cards: latest week in the range, compared with the same measure
  // four weeks earlier ("last month"). Consistency covers the whole range.
  const cards = useMemo(() => {
    const latest = weeks[weeks.length - 1]
    const idx = schoolWeeks.indexOf(latest)
    const now = districtWeek(latest)
    const before = idx - 4 >= 0 ? districtWeek(schoolWeeks[idx - 4]) : null
    const sitePct = d => Math.round((d.sitesMet / d.sites) * 100)
    const weeksOver = weeks.filter(w => districtWeek(w).educatorPct >= CONSISTENCY_THRESHOLD).length
    return {
      sites: { value: `${now.sitesMet} of ${now.sites}`, pct: sitePct(now), change: before ? sitePct(now) - sitePct(before) : null },
      educators: { value: `${now.met} of ${now.total}`, pct: now.educatorPct, change: before ? now.educatorPct - before.educatorPct : null },
      consistency: { value: `${weeksOver} of ${weeks.length} weeks`, pct: Math.round((weeksOver / weeks.length) * 100) },
    }
  }, [weeks])

  const siteRows = useMemo(() => {
    const prev = previousWeeks(weeks)
    const q = query.trim().toLowerCase()
    return schools
      .map(school => {
        const data = getWeekData(school.id, weeks[weeks.length - 1], GOAL)
        const prevPct = prev.length ? getWeekData(school.id, prev[prev.length - 1], GOAL).pct : null
        return { school, meetingGoal: data.meetingGoal, totalTeachers: data.totalTeachers, pct: data.pct, change: prevPct == null ? null : data.pct - prevPct }
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
    const header = `Site,Users meeting goal,Total users,Change vs last month (pts)\n`
    const body = siteRows.map(r => `"${r.school.name}",${r.meetingGoal},${r.totalTeachers},${r.change ?? ''}`).join('\n')
    const url = URL.createObjectURL(new Blob([header + body], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'site-engagement.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="px-6 pt-8 pb-8">
      <div className="flex items-start justify-between gap-6 mb-6">
        <div className="min-w-0">
          <SiteEngagementBreadcrumb />
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <h2 className="text-2xl font-semibold text-brand-text">Site Engagement</h2>
            <Link to="/settings" className="text-sm text-interactive-blue hover:underline">
              Weekly goal: {GOAL} lessons per week
            </Link>
          </div>
          <p className="text-sm text-brand-subtext mt-1">
            {isLeader
              ? `This report shows Move This World lesson completion rates for ${leaderSchool.name}.`
              : 'This report shows Move This World lesson completion rates by site across your district.'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className="relative" ref={menuRef}>
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
      </div>

      {/* Date controls */}
      <div className="flex items-center justify-end gap-4 mb-4">
        <div className="flex items-center gap-2">
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
      </div>

      <div className={`grid gap-4 mb-6 ${isLeader ? '' : 'grid-cols-[minmax(240px,300px)_1fr]'}`}>
        {!isLeader && (
          <div className="flex flex-col gap-4">
            <SummaryCard label="Sites meeting goal" {...cards.sites} />
            <SummaryCard label="Educators meeting goal" {...cards.educators} />
            <SummaryCard label="Consistency" {...cards.consistency} note={`Weeks with ${CONSISTENCY_THRESHOLD}%+ of educators on goal`} />
          </div>
        )}
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
          className="min-w-0 bg-white rounded-xl border border-brand-border p-5"
        >
          <p className="text-base font-semibold text-brand-text mb-4">{isLeader ? '% of educators meeting goal' : '% of sites meeting goal'}</p>
          {isLeader ? <SiteWeeklyChart schoolId={leaderSchool.id} weeks={weeks} /> : <SiteGoalLineChart weeks={weeks} />}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.14 }}
        className="bg-white rounded-xl border border-brand-border overflow-hidden"
      >
        {isLeader ? (
          <EducatorTable school={leaderSchool} weeks={weeks} searchable />
        ) : (
          <>
            <div className="px-4 py-3 border-b border-brand-border">
              <SearchField value={query} onChange={setQuery} placeholder="Search sites" />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[13px] font-medium"><SortButton label="Site" col="name" sort={sort} onSort={k => setSort(s => nextSort(s, k))} /></TableHead>
                  <TableHead className="text-[13px] font-medium text-right"><SortButton label="Users meeting goal" col="goal" sort={sort} onSort={k => setSort(s => nextSort(s, k, 'desc'))} align="right" /></TableHead>
                  <TableHead className="text-[13px] font-medium text-right"><SortButton label="Change vs last month" col="change" sort={sort} onSort={k => setSort(s => nextSort(s, k, 'desc'))} align="right" /></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {siteRows.map(({ school, meetingGoal, totalTeachers, change }) => (
                  <TableRow key={school.id} onClick={() => setSelectedSite(school)} className="cursor-pointer">
                    <TableCell className="font-medium">{school.name}</TableCell>
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
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {selectedSite && !isLeader && (
          <SiteDetailModal key="modal" school={selectedSite} weeks={weeks} onClose={() => setSelectedSite(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
