import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, parseISO } from 'date-fns'
import { Settings, MoreHorizontal, Download, Printer, X, ChevronLeft, ChevronRight, ChevronDown, Check, Search, Plus, Trash2, Lock, Pencil, Calendar, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import {
  schools, getWeekData,
  getDistrictTrend, getSchoolTrend,
} from '../lib/report2Data'
import { toast } from 'sonner'
import { DatePicker } from '../components/ui/date-picker'
import { DateRangePicker } from '../components/ui/date-range-picker'
import { DayPicker } from 'react-day-picker'

const SITE_LEADER_SCHOOL = schools[0]

function weekLabel(weekStart, includeYear = false) {
  const start = parseISO(weekStart)
  const end   = addDays(start, 4)
  const range = format(start, 'MMM') === format(end, 'MMM')
    ? `${format(start, 'MMM d')} – ${format(end, 'd')}`
    : `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
  return includeYear ? `${range}, ${format(start, 'yyyy')}` : range
}

// ─── Windowed comparison helpers ──────────────────────────────────────────────
// The report used to be a single-week snapshot; it's now framed around a
// trailing window (4 weeks by default, or a custom range) compared against
// the equal-length window immediately before it. These two helpers derive
// both windows from any full oldest→newest weekly trend array, so the same
// logic drives the district-level stat cards and every per-site card.

function currentWindow(fullTrend, rangeMode, dateFrom, dateTo) {
  if (rangeMode === 'custom' && dateFrom && dateTo) {
    return fullTrend.filter(d => d.weekStart >= dateFrom && d.weekStart <= dateTo)
  }
  return fullTrend.slice(-4)
}

function previousWindow(fullTrend, current) {
  if (current.length === 0) return []
  const firstIdx = fullTrend.findIndex(d => d.weekStart === current[0].weekStart)
  const n = current.length
  return fullTrend.slice(Math.max(0, firstIdx - n), firstIdx)
}

function avgPct(window) {
  if (window.length === 0) return 0
  return Math.round(window.reduce((s, d) => s + d.pct, 0) / window.length)
}

// Three tiers, in priority order — a site at or above 50% is "Thriving"
// regardless of its trend direction; below that, only the trend (vs. its own
// previous window) separates "Building momentum" from "Getting started".
// Neutral/accent/success tokens only — no warning/danger token, per the
// no-alarm-styling rule for this page.
function growthTier(currentPct, delta) {
  if (currentPct >= 50) return 'thriving'
  if (delta > 0) return 'building'
  return 'starting'
}

const TIER_META = {
  thriving: { label: 'Thriving',          text: 'text-state-success', bg: 'bg-state-successLight' },
  building: { label: 'Building momentum', text: 'text-dessa-teal',    bg: 'bg-dessa-tealLight' },
  starting: { label: 'Getting started',   text: 'text-brand-subtext', bg: 'bg-brand-bg' },
}

// ─── Trend pill ───────────────────────────────────────────────────────────────
// Same pill background in both directions — only the arrow flips — so a
// declining number never reads as an alarm, just a direction.
function TrendPill({ delta }) {
  const isUp = delta >= 0
  const Icon = isUp ? ArrowUpRight : ArrowDownRight
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-state-successLight text-state-success text-xs font-semibold whitespace-nowrap">
      <Icon size={12} />
      {Math.abs(delta)} pts
    </span>
  )
}

// ─── Engagement over time (basic SVG, no charting library) ───────────────────
// Plots current window vs. previous window by position-within-window (not
// calendar date) so a 4-point window always compares like-for-like even when
// a custom range picks a different length. The current window's final
// segment/point renders dashed and hollow — the most recently completed
// week, styled as "still forming" rather than a finished low result.
function EngagementTrendChart({ current, previous }) {
  const width = 560
  const height = 220
  const padding = { top: 12, right: 16, bottom: 28, left: 34 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  function toPoints(series) {
    if (series.length === 0) return []
    return series.map((d, i) => ({
      x: padding.left + (series.length === 1 ? innerW / 2 : (i / (series.length - 1)) * innerW),
      y: padding.top + innerH - (d.pct / 100) * innerH,
      ...d,
    }))
  }

  const currentPts = toPoints(current)
  const previousPts = toPoints(previous)
  const gridLines = [0, 25, 50, 75, 100]

  function pathFor(pts) {
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  }

  const completedPts = currentPts.slice(0, -1)
  const lastSegment = currentPts.slice(-2)

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="District engagement over time, current window vs. previous window">
      {gridLines.map(v => {
        const y = padding.top + innerH - (v / 100) * innerH
        return (
          <g key={v}>
            <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#E2E6EA" strokeWidth={1} />
            <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize={10} fill="#6B7A8D">{v}%</text>
          </g>
        )
      })}

      {previousPts.length > 1 && (
        <path d={pathFor(previousPts)} fill="none" stroke="#B0B9C6" strokeWidth={1.5} strokeDasharray="4,3" />
      )}
      {previousPts.map(p => (
        <circle key={`prev-${p.weekStart}`} cx={p.x} cy={p.y} r={2.5} fill="#B0B9C6" />
      ))}

      {completedPts.length > 1 && (
        <path d={pathFor(completedPts)} fill="none" stroke="#2A7F8F" strokeWidth={2} />
      )}
      {lastSegment.length === 2 && (
        <path d={pathFor(lastSegment)} fill="none" stroke="#2A7F8F" strokeWidth={2} strokeDasharray="5,4" opacity={0.55} />
      )}
      {completedPts.map(p => (
        <circle key={`cur-${p.weekStart}`} cx={p.x} cy={p.y} r={3} fill="#2A7F8F" />
      ))}
      {currentPts.slice(-1).map(p => (
        <circle key={`cur-last-${p.weekStart}`} cx={p.x} cy={p.y} r={3.5} fill="white" stroke="#2A7F8F" strokeWidth={2} opacity={0.85} />
      ))}

      {currentPts.map(p => (
        <text key={`x-${p.weekStart}`} x={p.x} y={height - 8} textAnchor="middle" fontSize={10} fill="#6B7A8D">
          {weekLabel(p.weekStart)}
        </text>
      ))}
    </svg>
  )
}

function exportCSV(trendData, activeSchools, goal) {
  const summary = [['Week', 'Site', 'Total Users', 'On Track', 'Engagement %']]
  const detail  = [[''], ['Week', 'Site', 'User', 'Days Active', 'Met Goal']]
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


// ─── Shared calendar helpers ──────────────────────────────────────────────────

const CAL_NAV_COMPONENTS = {
  Chevron: ({ orientation }) =>
    orientation === 'left' ? <ChevronLeft size={18} /> : <ChevronRight size={18} />,
}

function calClassNames(months = 1) {
  return {
    months:          months === 2 ? 'flex gap-8 justify-between' : 'flex',
    month:           'flex flex-col flex-1',
    month_caption:   'flex justify-center items-center relative h-9 mb-4',
    caption_label:   'text-sm font-bold text-brand-text',
    nav:             'flex items-center absolute inset-x-0 top-6 justify-between px-6 pointer-events-none z-10',
    button_previous: 'pointer-events-auto relative z-10 p-1.5 rounded-lg text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors',
    button_next:     'pointer-events-auto relative z-10 p-1.5 rounded-lg text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors',
    month_grid:      'w-full border-collapse',
    weekdays:        'flex mb-1',
    weekday:         'flex-1 text-center text-xs font-medium text-brand-subtext pb-1',
    week:            'flex',
    day:             'flex-1 relative p-0 text-center',
    day_button:      'w-9 h-9 mx-auto flex items-center justify-center text-sm rounded-full transition-colors text-brand-text hover:bg-brand-bg',
    today:           '[&>button]:font-bold [&>button]:text-blue-500',
    outside:         '[&>button]:text-brand-subtext/30',
    disabled:        '[&>button]:text-brand-subtext/25 [&>button]:cursor-default [&>button]:hover:bg-transparent',
    hidden:          'invisible',
    selected:        '',
    range_start:     'bg-gradient-to-r from-transparent to-[#F0F2F5] [&>button]:!bg-brand-text [&>button]:!text-white [&>button]:rounded-full',
    range_end:       'bg-gradient-to-l from-transparent to-[#F0F2F5] [&>button]:!bg-brand-text [&>button]:!text-white [&>button]:rounded-full',
    range_middle:    'bg-[#F0F2F5] [&>button]:rounded-none [&>button]:hover:bg-[#E2E6EA]',
  }
}

function InlineRangeCal({ from, to, onFromChange, onToChange }) {
  return (
    <DayPicker
      mode="range"
      numberOfMonths={2}
      defaultMonth={from ? parseISO(from) : new Date()}
      selected={{ from: from ? parseISO(from) : undefined, to: to ? parseISO(to) : undefined }}
      onSelect={r => {
        onFromChange(r?.from ? format(r.from, 'yyyy-MM-dd') : '')
        onToChange(r?.to   ? format(r.to,   'yyyy-MM-dd') : '')
      }}
      showOutsideDays={false}
      captionLayout="label"
      classNames={calClassNames(2)}
      components={CAL_NAV_COMPONENTS}
    />
  )
}

function InlineSingleCal({ value, onChange, locked }) {
  return locked
    ? <div className="px-3 py-2 text-sm border border-brand-border rounded-lg bg-brand-bg text-brand-subtext select-none">
        {value ? format(parseISO(value), 'MMM d') : '—'}
      </div>
    : (
      <DayPicker
        mode="single"
        defaultMonth={value ? parseISO(value) : new Date()}
        selected={value ? parseISO(value) : undefined}
        onSelect={d => onChange(d ? format(d, 'yyyy-MM-dd') : '')}
        showOutsideDays={false}
        captionLayout="label"
        classNames={{
          ...calClassNames(1),
          selected: '[&>button]:!bg-brand-text [&>button]:!text-white [&>button]:rounded-full',
        }}
        components={CAL_NAV_COMPONENTS}
      />
    )
}

// ─── Settings Modal ───────────────────────────────────────────────────────────

// const DEFAULT_BLACKOUT_PERIODS = [
//   { id: 1, name: 'Fall Break',    from: '2025-10-13', to: '2025-10-17' },
//   { id: 2, name: 'Thanksgiving',  from: '2025-11-24', to: '2025-11-28' },
//   { id: 3, name: 'Winter Break',  from: '2025-12-22', to: '2026-01-02' },
//   { id: 4, name: 'MLK Day',       from: '2026-01-19', to: '2026-01-19' },
//   { id: 5, name: 'Spring Break',  from: '2026-03-16', to: '2026-03-20' },
//   { id: 6, name: 'Memorial Day',  from: '2026-05-25', to: '2026-05-25' },
// ]

const SETTINGS_TABS = [
  {
    id: 'engagement',
    label: 'Engagement',
    title: 'Engagement settings',
    description: 'Configure how teacher engagement is measured and reported across your district.',
  },
  { id: 'school_year', label: 'School year', title: 'School year', description: "Define your district's school year boundaries and quarterly calendar." },
  // {
  //   id: 'blackout',
  //   label: 'Blackout periods',
  //   title: 'Blackout periods',
  //   description: "Mark non-instructional days so they're excluded from engagement calculations.",
  // },
]

function SettingsModal({ goal, districtTarget, onSave, onClose }) {
  const [activeTab,  setActiveTab]  = useState('engagement')
  const [tempGoal,   setTempGoal]   = useState(goal)
  const [tempTarget, setTempTarget] = useState(districtTarget)

  const [yearStart, setYearStart] = useState('2025-08-25')
  const [yearEnd,   setYearEnd]   = useState('2026-06-05')
  const [q2Start,   setQ2Start]   = useState('2025-11-03')
  const [q3Start,   setQ3Start]   = useState('2026-01-12')
  const [q4Start,   setQ4Start]   = useState('2026-03-23')

  // const [periods,   setPeriods]   = useState(DEFAULT_BLACKOUT_PERIODS)
  // const [newName,   setNewName]   = useState('')
  // const [newFrom,   setNewFrom]   = useState('')
  // const [newTo,     setNewTo]     = useState('')
  // const [editingId, setEditingId] = useState(null)
  // const [editName,  setEditName]  = useState('')
  // const [editFrom,  setEditFrom]  = useState('')
  // const [editTo,    setEditTo]    = useState('')
  // const canAdd = newName.trim() && newFrom && newTo && newFrom <= newTo
  // function startEdit(p) { setEditingId(p.id); setEditName(p.name); setEditFrom(p.from); setEditTo(p.to) }
  // function saveEdit() { ... }
  // function addPeriod() { ... }

  const isDirty = (
    tempGoal !== goal ||
    yearStart !== '2025-08-25' ||
    yearEnd   !== '2026-06-05' ||
    q2Start   !== '2025-11-03' ||
    q3Start   !== '2026-01-12' ||
    q4Start   !== '2026-03-23'
  )

  const quarters = [
    { label: 'Q1', value: yearStart, locked: true },
    { label: 'Q2', value: q2Start,   set: setQ2Start },
    { label: 'Q3', value: q3Start,   set: setQ3Start },
    { label: 'Q4', value: q4Start,   set: setQ4Start },
  ]

  const currentTab = SETTINGS_TABS.find(t => t.id === activeTab)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-brand-text/30 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.15 }}
        className="relative bg-white rounded-2xl border border-brand-border z-10 flex flex-col"
        style={{ width: 600, height: '85vh' }}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-0 shrink-0">
          <h2 className="text-lg font-bold text-brand-text">Settings</h2>
          <button className="text-brand-subtext hover:text-brand-text p-1 rounded-lg hover:bg-brand-bg transition-colors" onClick={onClose}>
            <X size={16} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-brand-border px-6 mt-3 shrink-0">
          {SETTINGS_TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 mr-6 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === t.id
                  ? 'border-dessa-teal text-dessa-teal'
                  : 'border-transparent text-brand-subtext hover:text-brand-text'
              }`}
            >{t.label}</button>
          ))}
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">

          {/* Card header — gray bar with title and description */}
          <div className="bg-brand-bg border-b border-brand-border px-6 py-4">
            <p className="text-sm font-semibold text-brand-text">{currentTab.title}</p>
            <p className="text-xs text-brand-subtext mt-0.5 leading-relaxed max-w-lg">{currentTab.description}</p>
          </div>

          {/* Form body */}
          <div className="px-6 py-6">

            {/* ── Engagement ── */}
            {activeTab === 'engagement' && (
              <div>
                <p className="text-sm font-semibold text-brand-text mb-1">Weekly goal</p>
                <p className="text-xs text-brand-subtext mb-4 leading-relaxed">
                  Days per week a teacher must access a lesson to be "on track."
                </p>
                <div className="flex items-center border border-brand-border rounded-lg overflow-hidden w-fit">
                  {[1,2,3,4,5].map(n => (
                    <button
                      key={n}
                      onClick={() => setTempGoal(n)}
                      className={`px-4 py-1.5 text-sm font-semibold transition-colors border-r border-brand-border last:border-r-0 ${
                        tempGoal === n
                          ? 'bg-dessa-teal text-white'
                          : 'bg-white text-brand-subtext hover:bg-brand-bg'
                      }`}
                    >{n}</button>
                  ))}
                </div>
              </div>
            )}

            {/* ── School year ── */}
            {activeTab === 'school_year' && (
              <div className="space-y-6">
                <div>
                  <p className="text-sm font-semibold text-brand-text mb-3">Set the school year</p>
                  <div className="flex items-end gap-3">
                    <div style={{ width: 200 }}>
                      <label className="text-xs text-brand-subtext block mb-1">Start</label>
                      <DatePicker value={yearStart} onChange={setYearStart} placeholder="Start date" max={yearEnd || undefined} />
                    </div>
                    <div style={{ width: 200 }}>
                      <label className="text-xs text-brand-subtext block mb-1">End</label>
                      <DatePicker value={yearEnd} onChange={setYearEnd} placeholder="End date" min={yearStart || undefined} />
                    </div>
                  </div>
                </div>
                {/* Quarter start dates — commented out
                <div className="h-px bg-brand-border" />
                <div>
                  <p className="text-sm font-semibold text-brand-text mb-1">Quarter start dates</p>
                  <p className="text-xs text-brand-subtext mb-3">Q1 always begins on the school year start date.</p>
                  <div className="grid grid-cols-4 gap-3">
                    {quarters.map(q => (
                      <div key={q.label}>
                        <label className="text-xs font-medium text-brand-subtext flex items-center gap-1 mb-1.5">
                          {q.label}
                          {q.locked && <Lock size={10} className="opacity-50" />}
                        </label>
                        <DatePicker
                          value={q.locked ? yearStart : q.value}
                          onChange={q.locked ? () => {} : q.set}
                          placeholder="Select date"
                          disabled={q.locked}
                        />
                      </div>
                    ))}
                  </div>
                </div>
                */}
              </div>
            )}

            {/* Blackout periods — commented out */}

          </div>
        </div>

        {/* Modal footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-brand-border shrink-0">
          <button
            onClick={onClose}
            className="px-4 h-[34px] rounded-lg text-sm font-medium text-brand-text border border-brand-border bg-white hover:bg-brand-bg transition-colors"
          >Cancel</button>
          <button
            className="px-4 h-[34px] rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-95"
            style={{ background: '#1B2B4B' }}
            disabled={!isDirty}
            onClick={() => {
              const messages = {
                engagement:  `Weekly goal updated to ${tempGoal} day${tempGoal !== 1 ? 's' : ''} per week`,
                school_year: 'School year dates saved',
              }
              toast.success(messages[activeTab] ?? 'Settings saved')
              onSave(tempGoal, tempTarget)
              onClose()
            }}
          >Save</button>
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

  // Rolling trailing window (2026-09-22 redesign) — replaces the old
  // single-week snapshot. 'last4' is the default lens; 'custom' switches to
  // whatever [dateFrom, dateTo] range is applied via the range popover.
  const [rangeMode, setRangeMode]           = useState('last4')
  const [dateFrom, setDateFrom]             = useState('')
  const [dateTo, setDateTo]                 = useState('')
  const [pendingDateFrom, setPendingDateFrom] = useState('')
  const [pendingDateTo, setPendingDateTo]     = useState('')
  const [rangeMenuOpen, setRangeMenuOpen]     = useState(false)
  const rangeMenuRef = useRef(null)

  const [searchQ, setSearchQ]               = useState('')
  const [tierFilter, setTierFilter]         = useState('all')
  const [sitePage, setSitePage]             = useState(1)
  const SITE_PAGE_SIZE = 12

  const [menuOpen, setMenuOpen]             = useState(false)
  const menuRef  = useRef(null)

  const activeSchools = role === 'site_leader' ? [SITE_LEADER_SCHOOL] : schools

  useEffect(() => {
    if (!menuOpen) return
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  useEffect(() => {
    if (!rangeMenuOpen) return
    const handler = e => { if (rangeMenuRef.current && !rangeMenuRef.current.contains(e.target)) setRangeMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [rangeMenuOpen])

  // Full oldest → newest weekly trend (district, or the one school in the
  // site-leader view — that toggle is currently commented out of the UI
  // below, same as before this redesign, so this branch stays reachable
  // only via manual state changes, not a live control).
  const rawTrend = useMemo(() => (
    role === 'site_leader' ? getSchoolTrend(SITE_LEADER_SCHOOL.id, goal) : getDistrictTrend(goal)
  ), [role, goal])

  const current  = useMemo(() => currentWindow(rawTrend, rangeMode, dateFrom, dateTo), [rawTrend, rangeMode, dateFrom, dateTo])
  const previous = useMemo(() => previousWindow(rawTrend, current), [rawTrend, current])

  const currentAvg    = avgPct(current)
  const previousAvg   = avgPct(previous)
  const engagementDelta = currentAvg - previousAvg

  // Per-site current/previous window comparison — feeds both the site card
  // grid and the "Sites building momentum" stat/list, so it's computed once
  // here rather than twice.
  const siteStats = useMemo(() => activeSchools.map(school => {
    const fullSiteTrend  = getSchoolTrend(school.id, goal)
    const siteCurrent    = currentWindow(fullSiteTrend, rangeMode, dateFrom, dateTo)
    const sitePrevious   = previousWindow(fullSiteTrend, siteCurrent)
    const siteCurrentAvg = avgPct(siteCurrent)
    const sitePreviousAvg = avgPct(sitePrevious)
    const delta = siteCurrentAvg - sitePreviousAvg
    return {
      school,
      currentAvg: siteCurrentAvg,
      delta,
      hasPrevious: sitePrevious.length > 0,
      tier: growthTier(siteCurrentAvg, delta),
    }
  }), [activeSchools, goal, rangeMode, dateFrom, dateTo])

  const sitesActive = siteStats.filter(s => s.currentAvg > 0).length
  const buildingMomentumSites = siteStats.filter(s => s.hasPrevious && s.delta > 0)

  function openRangeMenu() {
    setPendingDateFrom(dateFrom)
    setPendingDateTo(dateTo)
    setRangeMenuOpen(o => !o)
  }

  function applyCustomRange() {
    setDateFrom(pendingDateFrom)
    setDateTo(pendingDateTo)
    setRangeMode('custom')
    setRangeMenuOpen(false)
  }

  function resetToLast4() {
    setRangeMode('last4')
    setDateFrom(''); setDateTo('')
    setPendingDateFrom(''); setPendingDateTo('')
    setRangeMenuOpen(false)
  }

  const rangeLabel = rangeMode === 'custom' && dateFrom && dateTo
    ? `${new Date(dateFrom + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(dateTo + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'Last 4 weeks'

  const filteredSites = useMemo(() => {
    let result = siteStats
    if (searchQ) {
      const q = searchQ.toLowerCase()
      result = result.filter(s => s.school.name.toLowerCase().includes(q))
    }
    if (tierFilter !== 'all') result = result.filter(s => s.tier === tierFilter)
    return [...result].sort((a, b) => a.school.name.localeCompare(b.school.name))
  }, [siteStats, searchQ, tierFilter])

  useEffect(() => setSitePage(1), [searchQ, tierFilter, rangeMode, dateFrom, dateTo])

  const totalSitePages = Math.max(1, Math.ceil(filteredSites.length / SITE_PAGE_SIZE))
  const visibleSites = filteredSites.slice((sitePage - 1) * SITE_PAGE_SIZE, sitePage * SITE_PAGE_SIZE)

  const statCards = [
    { label: 'Sites active',       value: `${sitesActive} of ${activeSchools.length}` },
    { label: 'Average engagement', value: `${currentAvg}%`, delta: engagementDelta },
    { label: 'Building momentum',  value: `${buildingMomentumSites.length} of ${activeSchools.length}`, sub: 'sites vs. their prior window' },
    { label: 'Weekly goal',        value: `${goal}×`, sub: 'per week' },
  ]

  return (
    <div className="px-6 pt-8 pb-8">

      {/* Header — plain, no card chrome (2026-09-22 redesign replaced the
          old always-expanded filter card with this lighter row: title +
          description on the left, the rolling-window control and overflow
          menu on the right). */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text">Site Engagement</h2>
          <p className="text-sm text-brand-subtext mt-1">This report shows Move This World lesson completion rates by site across your district.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={rangeMenuRef}>
            <button
              onClick={openRangeMenu}
              className="flex items-center gap-2 px-3 h-9 rounded-lg border border-brand-border bg-white text-sm font-medium text-brand-text hover:bg-brand-bg transition-colors"
            >
              <Calendar size={14} className="text-brand-subtext" />
              {rangeLabel}
              <ChevronDown size={13} className={`text-brand-subtext transition-transform ${rangeMenuOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {rangeMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                  className="absolute right-0 top-[calc(100%+6px)] w-80 bg-white rounded-xl border border-brand-border shadow-lg z-30 p-4"
                >
                  <button
                    onClick={resetToLast4}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors mb-3 ${
                      rangeMode === 'last4' ? 'bg-dessa-tealLight text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                    }`}
                  >
                    Last 4 weeks
                    {rangeMode === 'last4' && <Check size={14} className="text-dessa-teal" />}
                  </button>
                  <div className="pt-3 border-t border-brand-border">
                    <p className="text-xs font-semibold text-brand-text mb-2">Custom range</p>
                    <DateRangePicker
                      from={pendingDateFrom}
                      to={pendingDateTo}
                      onFromChange={setPendingDateFrom}
                      onToChange={setPendingDateTo}
                      align="start"
                      buttonClassName="w-full justify-between"
                    />
                    <button
                      onClick={applyCustomRange}
                      disabled={!pendingDateFrom || !pendingDateTo}
                      className="w-full mt-3 h-8 rounded-md text-sm font-medium text-white bg-dessa-teal hover:opacity-90 disabled:opacity-40 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center justify-center w-9 h-9 rounded-lg border border-brand-border bg-white text-brand-text hover:bg-brand-bg transition-all"
              onClick={() => setMenuOpen(o => !o)}
            >
              <MoreHorizontal size={13} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1.5 w-52 bg-white border border-brand-border rounded-lg z-20 overflow-hidden py-1">
                {/* View as — commented out
                <p className="px-3.5 pt-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-brand-subtext">View as</p>
                {[
                  { value: 'program_admin', label: 'District Admin' },
                  { value: 'site_leader',   label: 'Site Leader'   },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className="w-full flex items-center justify-between px-3.5 py-2 text-sm text-brand-text hover:bg-brand-bg transition-colors"
                    onClick={() => { setRole(opt.value); setMenuOpen(false) }}
                  >
                    {opt.label}
                    {role === opt.value && <Check size={13} style={{ color: '#2A7F8F' }} />}
                  </button>
                ))}
                <div className="h-px bg-brand-border mx-2 my-1" />
                */}
                <button
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors"
                  onClick={() => { setSettingsOpen(true); setMenuOpen(false) }}
                >
                  <Settings size={13} className="text-brand-subtext" /> Settings
                </button>
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
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {statCards.map(({ label, value, sub, delta }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 + i * 0.05 }}
            className="bg-white rounded-xl border border-brand-border px-5 py-4"
          >
            <p className="text-sm font-medium text-brand-subtext mb-4">{label}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-2xl font-bold text-brand-text">{value}</p>
              {typeof delta === 'number' && <TrendPill delta={delta} />}
            </div>
            {sub && <p className="text-xs text-brand-subtext mt-0.5">{sub}</p>}
          </motion.div>
        ))}
      </div>

      {/* Engagement over time + Sites building momentum */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.2 }}
          className="col-span-2 bg-white rounded-xl border border-brand-border p-5"
        >
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <p className="text-lg font-semibold text-brand-text">Engagement over time</p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-2 rounded-sm bg-dessa-teal" />
                <span className="text-xs text-brand-subtext">Current window</span>
              </div>
              <div className="flex items-center gap-1.5">
                <svg width="18" height="8" viewBox="0 0 18 8"><line x1="0" y1="4" x2="18" y2="4" stroke="#B0B9C6" strokeWidth="1.5" strokeDasharray="4,3" /></svg>
                <span className="text-xs text-brand-subtext">Previous window</span>
              </div>
            </div>
          </div>
          <EngagementTrendChart current={current} previous={previous} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.24 }}
          className="bg-white rounded-xl border border-brand-border p-5 flex flex-col"
        >
          <p className="text-lg font-semibold text-brand-text mb-1">Sites building momentum</p>
          <p className="text-xs text-brand-subtext mb-4">{buildingMomentumSites.length} of {activeSchools.length} sites, up from their previous window</p>
          {buildingMomentumSites.length === 0 ? (
            <p className="text-sm text-brand-subtext">No sites are trending up this window yet.</p>
          ) : (
            <div className="flex flex-col gap-0.5 overflow-y-auto max-h-56 -mx-2">
              {buildingMomentumSites.map(s => (
                <div key={s.school.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-brand-bg transition-colors">
                  <ArrowUpRight size={14} className="text-state-success shrink-0" />
                  <span className="text-sm text-brand-text truncate">{s.school.name}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Sites */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.28 }}
        className="bg-white rounded-xl border border-brand-border"
      >
        {/* Toolbar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-brand-border bg-brand-bg/40 rounded-t-xl flex-wrap gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
              <input
                type="text"
                placeholder="Search sites…"
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
            <div className="flex items-center rounded-lg border border-brand-border overflow-hidden text-xs font-medium shrink-0">
              {[
                { key: 'all',      label: 'All' },
                { key: 'starting', label: 'Getting started' },
                { key: 'building', label: 'Building momentum' },
                { key: 'thriving', label: 'Thriving' },
              ].map(({ key, label }, i) => (
                <button
                  key={key}
                  onClick={() => setTierFilter(key)}
                  className={`px-3 py-1.5 transition-colors whitespace-nowrap ${i > 0 ? 'border-l border-brand-border' : ''} ${
                    tierFilter === key ? 'bg-dessa-teal text-white' : 'bg-white text-brand-subtext hover:bg-brand-bg'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <span className="text-xs text-brand-subtext shrink-0">{filteredSites.length} sites</span>
        </div>

        {/* Site card grid */}
        <div className="p-4">
          {visibleSites.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-brand-subtext">No sites match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {visibleSites.map(s => {
                const tier = TIER_META[s.tier]
                return (
                  <div key={s.school.id} className="rounded-xl border border-brand-border p-4 hover:border-dessa-teal/30 transition-colors">
                    <p className="text-sm font-semibold text-brand-text truncate mb-2">{s.school.name}</p>
                    <div className="flex items-center gap-2 flex-wrap mb-3">
                      <p className="text-2xl font-bold text-brand-text">{s.currentAvg}%</p>
                      {s.hasPrevious && <TrendPill delta={s.delta} />}
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${tier.bg} ${tier.text}`}>
                      {tier.label}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Pagination footer */}
        {totalSitePages > 1 && (
          <div className="px-5 py-4 border-t border-brand-border flex items-center justify-between">
            <p className="text-sm text-brand-subtext">
              Showing {(sitePage - 1) * SITE_PAGE_SIZE + 1}–{Math.min(sitePage * SITE_PAGE_SIZE, filteredSites.length)} of {filteredSites.length} sites
            </p>
            <div className="flex items-center gap-1">
              <button
                className="px-3 py-1.5 rounded-md text-sm font-medium border border-brand-border text-brand-subtext bg-white hover:bg-brand-bg disabled:opacity-40 transition-colors"
                onClick={() => setSitePage(p => p - 1)}
                disabled={sitePage === 1}
              >Previous</button>
              {Array.from({ length: totalSitePages }, (_, i) => i + 1).map(p => (
                <button
                  key={p}
                  className={`w-8 h-8 rounded-md text-sm font-medium transition-colors ${p === sitePage ? 'text-white' : 'text-brand-subtext hover:bg-brand-bg border border-brand-border'}`}
                  style={p === sitePage ? { background: '#2A7F8F' } : {}}
                  onClick={() => setSitePage(p)}
                >{p}</button>
              ))}
              <button
                className="px-3 py-1.5 rounded-md text-sm font-medium border border-brand-border text-brand-subtext bg-white hover:bg-brand-bg disabled:opacity-40 transition-colors"
                onClick={() => setSitePage(p => p + 1)}
                disabled={sitePage === totalSitePages}
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
