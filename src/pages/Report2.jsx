import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, addDays, parseISO } from 'date-fns'
import { Settings, MoreHorizontal, Download, Printer, X, ChevronLeft, ChevronRight, ChevronDown, Check, ArrowUpDown, ArrowUp, ArrowDown, Search, SlidersHorizontal } from 'lucide-react'
import {
  schools, schoolWeeks, getWeekData,
  getDistrictTrend, getSchoolTrend, getDistrictWeekData,
  MOST_RECENT_WEEK,
} from '../lib/report2Data'
import { DatePicker } from '../components/ui/date-picker'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, Cell, ResponsiveContainer,
} from 'recharts'
import { ChartContainer, ChartTooltipContent } from '../components/ui/chart'

const SITE_LEADER_SCHOOL = schools[0]

function weekLabel(weekStart, includeYear = false) {
  const start = parseISO(weekStart)
  const end   = addDays(start, 4)
  const range = format(start, 'MMM') === format(end, 'MMM')
    ? `${format(start, 'MMM d')} – ${format(end, 'd')}`
    : `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
  return includeYear ? `${range}, ${format(start, 'yyyy')}` : range
}

function groupWeeksByMonth(weeks) {
  const groups = []
  const seen = {}
  ;[...weeks].reverse().forEach(w => {
    const key = format(parseISO(w), 'MMMM yyyy')
    if (!seen[key]) { seen[key] = []; groups.push({ label: key, weeks: seen[key] }) }
    seen[key].push(w)
  })
  return groups
}

// ─── Sort Button ─────────────────────────────────────────────────────────────

function SortBtn({ col, label, sortBy, sortDir, onSort }) {
  const active = sortBy === col
  return (
    <button
      onClick={() => onSort(col)}
      className="flex items-center gap-1 text-xs font-semibold text-brand-subtext hover:text-brand-text transition-colors group"
    >
      {label}
      {active
        ? sortDir === 'desc'
          ? <ArrowDown size={11} style={{ color: '#2A7F8F' }} />
          : <ArrowUp   size={11} style={{ color: '#2A7F8F' }} />
        : <ArrowUpDown size={11} className="opacity-40 group-hover:opacity-70" />}
    </button>
  )
}

// ─── Week Selector ────────────────────────────────────────────────────────────

function WeekSelector({ weeks, selected, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const idx     = weeks.indexOf(selected)
  const canPrev = idx > 0
  const canNext = idx < weeks.length - 1

  const grouped = useMemo(() => groupWeeksByMonth(weeks), [weeks])

  return (
    <div className="flex items-center gap-2">
      <button
        className="w-8 h-8 rounded-lg border border-brand-border bg-white flex items-center justify-center hover:bg-brand-bg disabled:opacity-30 transition-colors"
        onClick={() => onChange(weeks[idx - 1])}
        disabled={!canPrev}
      >
        <ChevronLeft size={15} className="text-brand-text" />
      </button>

      <div className="relative" ref={ref}>
        <button
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-brand-border bg-white text-sm font-semibold text-brand-text hover:shadow-sm transition-all min-w-[210px] justify-between"
          onClick={() => setOpen(o => !o)}
        >
          <span>{weekLabel(selected, true)}</span>
          <ChevronDown size={13} className="text-brand-subtext flex-shrink-0" />
        </button>

        {open && (
          <div className="absolute top-[calc(100%+6px)] left-1/2 -translate-x-1/2 bg-white rounded-xl border border-brand-border shadow-xl z-30 w-64 max-h-72 overflow-y-auto py-1.5">
            {grouped.map(({ label, weeks: mw }) => (
              <div key={label}>
                <p className="px-3 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-subtext sticky top-0 bg-white">
                  {label}
                </p>
                {mw.map(w => (
                  <button
                    key={w}
                    className="w-full flex items-center justify-between px-3 py-2 text-sm text-left hover:bg-brand-bg transition-colors"
                    onClick={() => { onChange(w); setOpen(false) }}
                  >
                    <span className={w === selected ? 'font-semibold text-brand-text' : 'text-brand-text'}>
                      {weekLabel(w)}
                    </span>
                    {w === selected && <Check size={13} style={{ color: '#2A7F8F' }} />}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <button
        className="w-8 h-8 rounded-lg border border-brand-border bg-white flex items-center justify-center hover:bg-brand-bg disabled:opacity-30 transition-colors"
        onClick={() => onChange(weeks[idx + 1])}
        disabled={!canNext}
      >
        <ChevronRight size={15} className="text-brand-text" />
      </button>
    </div>
  )
}

function exportCSV(trendData, activeSchools, goal) {
  const summary = [['Week', 'School', 'Total Teachers', 'On Track', 'Engagement %']]
  const detail  = [[''], ['Week', 'School', 'Teacher', 'Days Active', 'Met Goal']]
  trendData.forEach(w => {
    activeSchools.forEach(school => {
      const d = getWeekData(school.id, w.weekStart, goal)
      const lbl = weekLabel(w.weekStart)
      summary.push([lbl, school.name, d.totalTeachers, d.meetingGoal, `${d.pct}%`])
      d.teachers.forEach(t => detail.push([lbl, school.name, t.name, `${t.daysActive} days`, t.metGoal ? 'Yes' : 'No']))
    })
  })
  const csv = [...summary, ...detail].map(r => r.map(c => `"${c}"`).join(',')).join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'school_weekly_engagement.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// ─── Trend Chart ──────────────────────────────────────────────────────────────

function TrendChart({ data, districtTarget, selectedWeek }) {
  const chartData = data.map(d => ({
    label: format(parseISO(d.weekStart), 'MMM d'),
    pct: d.pct,
    weekStart: d.weekStart,
  }))

  return (
    <ChartContainer config={{ pct: { color: '#2A7F8F' } }} className="h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: 0 }} barCategoryGap="30%">
          <CartesianGrid vertical={false} stroke="#E2E6EA" strokeDasharray="0" />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#6B7A8D' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tickFormatter={v => `${v}%`}
            tick={{ fontSize: 11, fill: '#6B7A8D' }}
            axisLine={false}
            tickLine={false}
            width={40}
          />
          <Tooltip
            cursor={{ fill: 'rgba(42,127,143,0.06)' }}
            content={<ChartTooltipContent formatter={v => `${v}%`} />}
          />
          <ReferenceLine
            y={districtTarget}
            stroke="#B0B9C6"
            strokeDasharray="5 4"
            strokeWidth={1.5}
          />
          <Bar dataKey="pct" name="Engagement" radius={[4, 4, 0, 0]}>
            {chartData.map(entry => (
              <Cell
                key={entry.weekStart}
                fill={entry.weekStart === selectedWeek ? '#1B2B4B' : '#2A7F8F'}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartContainer>
  )
}

// ─── Role Toggle ──────────────────────────────────────────────────────────────

function RoleToggle({ role, onChange }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-brand-subtext font-medium">Viewing as:</span>
      <div className="flex items-center bg-brand-bg border border-brand-border rounded-lg p-0.5 gap-0.5">
        {[
          { value: 'program_admin', label: 'District Admin' },
          { value: 'site_leader',   label: 'Site Leader'   },
        ].map(opt => (
          <button
            key={opt.value}
            className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
              role === opt.value
                ? 'bg-white text-brand-text shadow-sm border border-brand-border'
                : 'text-brand-subtext hover:text-brand-text'
            }`}
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Pct color helper ─────────────────────────────────────────────────────────

function pctColor(pct) {
  if (pct >= 80) return { text: '#166534', bg: '#DCFCE7' }   // dark green
  if (pct >= 50) return { text: '#B45309', bg: '#FEF3C7' }   // accessible amber
  return            { text: '#B91C1C', bg: '#FEE2E2' }        // red
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

function SettingsModal({ goal, districtTarget, onSave, onClose }) {
  const [tempGoal,   setTempGoal]   = useState(goal)
  const [tempTarget, setTempTarget] = useState(districtTarget)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-brand-text/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="relative bg-white rounded-2xl border border-brand-border shadow-2xl w-full max-w-[480px] mx-4 z-10"
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-brand-border">
          <h2 className="text-base font-semibold text-brand-text">Report Settings</h2>
          <button className="text-brand-subtext hover:text-brand-text p-1 rounded-lg hover:bg-brand-bg transition-colors" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-7">
          {/* Weekly goal */}
          <div>
            <p className="text-sm font-semibold text-brand-text mb-1">Weekly Engagement Goal</p>
            <p className="text-sm text-brand-subtext mb-4 leading-relaxed">
              A teacher is "on track" when they access a lesson at least this many days per week.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-brand-border rounded-lg overflow-hidden">
                <button className="px-4 py-2.5 text-base font-medium text-brand-subtext hover:bg-brand-bg disabled:opacity-30 transition-colors select-none"
                  onClick={() => setTempGoal(g => Math.max(1, g - 1))} disabled={tempGoal <= 1}>−</button>
                <span className="px-5 py-2.5 text-2xl font-bold text-brand-text border-x border-brand-border min-w-[60px] text-center select-none">
                  {tempGoal}
                </span>
                <button className="px-4 py-2.5 text-base font-medium text-brand-subtext hover:bg-brand-bg disabled:opacity-30 transition-colors select-none"
                  onClick={() => setTempGoal(g => Math.min(5, g + 1))} disabled={tempGoal >= 5}>+</button>
              </div>
              <span className="text-sm text-brand-subtext">days per week</span>
            </div>
          </div>

          {/* District target */}
          <div>
            <p className="text-sm font-semibold text-brand-text mb-1">District Target</p>
            <p className="text-sm text-brand-subtext mb-4 leading-relaxed">
              The % of teachers that should be on track each week — shown as the dashed line on the trend chart.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center border border-brand-border rounded-lg overflow-hidden">
                <button className="px-4 py-2.5 text-base font-medium text-brand-subtext hover:bg-brand-bg disabled:opacity-30 transition-colors select-none"
                  onClick={() => setTempTarget(t => Math.max(50, t - 5))} disabled={tempTarget <= 50}>−</button>
                <span className="px-4 py-2.5 text-2xl font-bold text-brand-text border-x border-brand-border min-w-[72px] text-center select-none">
                  {tempTarget}%
                </span>
                <button className="px-4 py-2.5 text-base font-medium text-brand-subtext hover:bg-brand-bg disabled:opacity-30 transition-colors select-none"
                  onClick={() => setTempTarget(t => Math.min(95, t + 5))} disabled={tempTarget >= 95}>+</button>
              </div>
              <span className="text-sm text-brand-subtext">of teachers</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-end px-6 py-4 border-t border-brand-border">
          <button className="px-4 py-2 rounded-lg text-sm font-semibold border border-brand-border text-brand-subtext bg-white hover:bg-brand-bg transition-colors"
            onClick={onClose}>Cancel</button>
          <button className="px-4 py-2 rounded-lg text-sm font-semibold text-white hover:brightness-95 transition-all"
            style={{ background: '#2A7F8F' }}
            onClick={() => { onSave(tempGoal, tempTarget); onClose() }}>
            Save Changes
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─── Report2 ──────────────────────────────────────────────────────────────────

export default function Report2() {
  const [role, setRole]                     = useState('program_admin')
  const [goal, setGoal]                     = useState(3)
  const [districtTarget, setDistrictTarget] = useState(70)
  const [settingsOpen, setSettingsOpen]     = useState(false)
  const [selectedWeek, setSelectedWeek]     = useState(MOST_RECENT_WEEK)
  const [tablePage, setTablePage]           = useState(1)
  const [sortBy, setSortBy]                 = useState('engagement')
  const [sortDir, setSortDir]               = useState('desc')
  const [dateFrom, setDateFrom]             = useState('')
  const [dateTo, setDateTo]                 = useState('')
  const [searchQ, setSearchQ]               = useState('')
  const [showFilters, setShowFilters]       = useState(false)

  const TABLE_PAGE_SIZE = 10
  const [menuOpen, setMenuOpen]             = useState(false)
  const menuRef  = useRef(null)
  const filterRef = useRef(null)

  const activeSchools = role === 'site_leader' ? [SITE_LEADER_SCHOOL] : schools

  useEffect(() => {
    if (!menuOpen) return
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (!showFilters) return
    const handler = e => { if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilters(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showFilters])

  // Trend data (oldest → newest for left-to-right chart)
  const rawTrend = useMemo(() => (
    role === 'site_leader' ? getSchoolTrend(SITE_LEADER_SCHOOL.id, goal) : getDistrictTrend(goal)
  ), [role, goal])

  const trendData = useMemo(() => rawTrend.filter(d => {
    if (dateFrom && d.weekStart < dateFrom) return false
    if (dateTo   && d.weekStart > dateTo)   return false
    return true
  }), [rawTrend, dateFrom, dateTo])

  // School table rows for the selected week
  const selectedWeekSchools = useMemo(() => (
    activeSchools.map(school => ({ school, ...getWeekData(school.id, selectedWeek, goal) }))
  ), [selectedWeek, goal, role])

  useEffect(() => setTablePage(1), [selectedWeek, role, sortBy, sortDir, searchQ])

  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  const sortedSchools = useMemo(() => {
    const getValue = row => ({
      name:        row.school.name,
      teachers:    row.totalTeachers,
      reached:     row.pct,
      engagement:  row.pct,
    })[sortBy] ?? row.pct
    return [...selectedWeekSchools].sort((a, b) => {
      const av = getValue(a), bv = getValue(b)
      return sortDir === 'desc'
        ? (typeof av === 'string' ? bv.localeCompare(av) : bv - av)
        : (typeof av === 'string' ? av.localeCompare(bv) : av - bv)
    })
  }, [selectedWeekSchools, sortBy, sortDir])

  const filteredSchools = useMemo(() => {
    if (!searchQ) return sortedSchools
    const q = searchQ.toLowerCase()
    return sortedSchools.filter(r => r.school.name.toLowerCase().includes(q))
  }, [sortedSchools, searchQ])

  const totalTablePages = Math.ceil(filteredSchools.length / TABLE_PAGE_SIZE)
  const visibleSchools  = filteredSchools.slice(
    (tablePage - 1) * TABLE_PAGE_SIZE,
    tablePage * TABLE_PAGE_SIZE
  )

  // Aggregate stats for selected week
  const weekStats = useMemo(() => (
    role === 'site_leader'
      ? getWeekData(SITE_LEADER_SCHOOL.id, selectedWeek, goal)
      : getDistrictWeekData(selectedWeek, goal)
  ), [role, selectedWeek, goal])

  const schoolsEngaged = selectedWeekSchools.filter(d => d.pct > 0).length


  const statCards = role === 'program_admin'
    ? [
        { label: 'Schools engaged',      value: `${schoolsEngaged} of ${schools.length}`, sub: weekLabel(selectedWeek)               },
        { label: 'Teachers meeting goal', value: `${weekStats.pct}%`,                      sub: 'district-wide'                       },
        { label: 'Goal',                  value: `${goal}×`,                               sub: 'per week · change in settings'        },
      ]
    : [
        { label: 'Teachers on track', value: `${selectedWeekSchools[0]?.meetingGoal} of ${selectedWeekSchools[0]?.totalTeachers}`, sub: weekLabel(selectedWeek) },
        { label: 'Engagement rate',   value: `${selectedWeekSchools[0]?.pct}%`,    sub: SITE_LEADER_SCHOOL.name                  },
        { label: 'Goal',              value: `${goal}×`,                           sub: 'per week · change in settings'           },
      ]

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="flex items-start justify-between mb-6"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-1">Move This World</p>
          <h1 className="text-2xl font-semibold text-brand-text">School Engagement</h1>
          <p className="text-sm text-brand-subtext mt-1">Teachers actively bringing SEL to their classrooms each week</p>
        </div>
        <div className="flex items-center gap-2 mt-1">
          <button
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium border border-brand-border bg-white hover:shadow-sm transition-all text-brand-text"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={14} /> Settings
          </button>
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center px-3.5 py-2 rounded-md text-sm font-medium border border-brand-border bg-white hover:shadow-sm transition-all text-brand-text"
              onClick={() => setMenuOpen(o => !o)}
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] bg-white rounded-xl border border-brand-border shadow-lg z-20 w-44 py-1">
                <button
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors"
                  onClick={() => { exportCSV(rawTrend, activeSchools, goal); setMenuOpen(false) }}
                >
                  <Download size={13} className="text-brand-subtext" /> Export CSV
                </button>
                <button
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors"
                  onClick={() => { window.print(); setMenuOpen(false) }}
                >
                  <Printer size={13} className="text-brand-subtext" /> Print
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Role toggle */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.04 }}
        className="mb-6"
      >
        <RoleToggle role={role} onChange={setRole} />
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {statCards.map(({ label, value, sub }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 + i * 0.05 }}
            className="bg-white rounded-xl border border-brand-border shadow-sm px-5 py-4"
          >
            <p className="text-xs font-semibold text-brand-subtext mb-2">{label}</p>
            <p className="text-2xl font-bold text-brand-text">{value}</p>
            <p className="text-xs text-brand-subtext mt-0.5">{sub}</p>
          </motion.div>
        ))}
      </div>

      {/* Trend chart card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.2 }}
        className="bg-white rounded-xl border border-brand-border shadow-sm mb-6 overflow-hidden"
      >
        <div className="px-5 pt-5 pb-2">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-2xl font-semibold text-brand-text">
                Weekly curriculum engagement
              </p>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-5 mt-3">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-dessa-teal" />
              <span className="text-xs text-brand-subtext">Engagement %</span>
            </div>
            <div className="flex items-center gap-1.5">
              <svg width="22" height="10" viewBox="0 0 22 10">
                <line x1="0" y1="5" x2="22" y2="5" stroke="#B0B9C6" strokeWidth="1.5" strokeDasharray="4,3" />
              </svg>
              <span className="text-xs text-brand-subtext">{districtTarget}% target</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-3 rounded-sm bg-dessa-navy" />
              <span className="text-xs text-brand-subtext">Selected week</span>
            </div>
          </div>
        </div>

        <div className="px-2 pb-2">
          <TrendChart data={trendData} districtTarget={districtTarget} selectedWeek={selectedWeek} />
        </div>
      </motion.div>

      {/* School table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.28 }}
        className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden"
      >
        {/* Table toolbar */}
        {(() => {
          const activeFilters = (dateFrom || dateTo) ? 1 : 0
          const selIdx = schoolWeeks.findIndex(w => w === selectedWeek)
          return (
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-brand-border bg-brand-bg/40">
              {/* Week nav */}
              <div className="flex items-center gap-0.5 border border-brand-border rounded-lg bg-white overflow-hidden mr-1">
                <button
                  className="px-2 py-1.5 text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-30"
                  disabled={selIdx <= 0}
                  onClick={() => setSelectedWeek(schoolWeeks[selIdx - 1])}
                ><ChevronLeft size={14} /></button>
                <select
                  value={selectedWeek}
                  onChange={e => setSelectedWeek(e.target.value)}
                  className="text-xs font-medium text-brand-text bg-white px-1 py-1.5 focus:outline-none cursor-pointer"
                >
                  {schoolWeeks.map(w => (
                    <option key={w} value={w}>{weekLabel(w)}</option>
                  ))}
                </select>
                <button
                  className="px-2 py-1.5 text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors disabled:opacity-30"
                  disabled={selIdx >= schoolWeeks.length - 1}
                  onClick={() => setSelectedWeek(schoolWeeks[selIdx + 1])}
                ><ChevronRight size={14} /></button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search schools…"
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  className="pl-8 pr-7 py-1.5 text-sm border border-brand-border rounded-lg bg-white w-44 text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                />
                {searchQ && (
                  <button onClick={() => setSearchQ('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-subtext hover:text-brand-text">
                    <X size={12} />
                  </button>
                )}
              </div>

              {/* Filters */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setShowFilters(v => !v)}
                  className={`flex items-center gap-1.5 text-xs font-medium border rounded-lg px-3 py-1.5 transition-colors ${
                    activeFilters > 0
                      ? 'bg-dessa-teal text-white border-dessa-teal'
                      : 'bg-white text-brand-subtext border-brand-border hover:text-brand-text hover:bg-brand-bg'
                  }`}
                >
                  <SlidersHorizontal size={13} />
                  Filters
                  {activeFilters > 0 && (
                    <span className="ml-0.5 bg-white/25 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {activeFilters}
                    </span>
                  )}
                </button>

                {showFilters && (
                  <div className="absolute right-0 top-full mt-1.5 w-80 bg-white border border-brand-border rounded-xl shadow-lg z-30 p-4">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-brand-subtext mb-3">Chart date range</div>
                    <div className="flex items-end gap-2 mb-4">
                      <div className="flex-1">
                        <label className="text-xs text-brand-subtext block mb-1">From</label>
                        <DatePicker value={dateFrom} onChange={setDateFrom} placeholder="Start date" />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-brand-subtext block mb-1">To</label>
                        <DatePicker value={dateTo} onChange={setDateTo} placeholder="End date" />
                      </div>
                    </div>
                    {activeFilters > 0 && (
                      <button
                        onClick={() => { setDateFrom(''); setDateTo(''); setShowFilters(false) }}
                        className="w-full text-xs font-semibold text-brand-subtext hover:text-brand-text py-1.5 rounded-lg border border-brand-border hover:bg-brand-bg transition-colors"
                      >Clear all filters</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* School table */}
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '18%' }} />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-brand-border">
              <th className="py-3 pl-5 text-left"><SortBtn col="name"       label="School"       sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="py-3 text-left">      <SortBtn col="teachers"   label="Teachers"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="py-3 text-left">      <SortBtn col="reached"    label="Reached Goal" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="py-3 pr-5 text-left"> <SortBtn col="engagement" label="Engagement"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
            </tr>
          </thead>
          <tbody>
            {visibleSchools.map(({ school, totalTeachers, meetingGoal, pct }) => {
              const { text: pctText, bg: pctBg } = pctColor(pct)
              return (
                <tr key={school.id} className="border-b border-brand-border last:border-b-0">
                  <td className="py-4 pl-5">
                    <span className="text-sm font-semibold text-brand-text">{school.name}</span>
                  </td>
                  <td className="py-4">
                    <span className="text-sm text-brand-text">{totalTeachers}</span>
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-brand-text">{meetingGoal}</span>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ color: pctText, background: pctBg }}>
                        {pct}%
                      </span>
                    </div>
                  </td>
                  <td className="py-4 pr-5">
                    <div className="flex items-center gap-3">
                      <div className="h-2 bg-brand-border rounded-full overflow-hidden flex-1 min-w-0">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${pct}%`, background: pctText }}
                        />
                      </div>
                      <span className="text-sm font-semibold w-10 text-right" style={{ color: pctText }}>{pct}%</span>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* Pagination footer */}
        {totalTablePages > 1 && (
          <div className="px-5 py-4 border-t border-brand-border flex items-center justify-between">
            <p className="text-sm text-brand-subtext">
              Showing {(tablePage - 1) * TABLE_PAGE_SIZE + 1}–{Math.min(tablePage * TABLE_PAGE_SIZE, filteredSchools.length)} of {filteredSchools.length} schools
            </p>
            <div className="flex items-center gap-1">
              <button
                className="px-3 py-1.5 rounded-md text-sm font-medium border border-brand-border text-brand-subtext bg-white hover:bg-brand-bg disabled:opacity-40 transition-colors"
                onClick={() => setTablePage(p => p - 1)}
                disabled={tablePage === 1}
              >Previous</button>
              {Array.from({ length: totalTablePages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${p === tablePage ? 'text-white' : 'text-brand-subtext hover:bg-brand-bg border border-brand-border'}`}
                  style={p === tablePage ? { background: '#2A7F8F' } : {}}
                  onClick={() => setTablePage(p)}
                >{p}</button>
              ))}
              <button
                className="px-3 py-1.5 rounded-md text-sm font-medium border border-brand-border text-brand-subtext bg-white hover:bg-brand-bg disabled:opacity-40 transition-colors"
                onClick={() => setTablePage(p => p + 1)}
                disabled={tablePage === totalTablePages}
              >Next</button>
            </div>
          </div>
        )}
      </motion.div>

      {settingsOpen && (
        <SettingsModal
          goal={goal}
          districtTarget={districtTarget}
          onSave={(g, t) => { setGoal(g); setDistrictTarget(t) }}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  )
}
