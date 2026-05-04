import { useState, useRef, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, addDays, parseISO } from 'date-fns'
import { Settings, MoreHorizontal, Download, Printer, X, ChevronLeft, ChevronRight, ChevronDown, Check, ArrowUpDown, ArrowUp, ArrowDown, Search, CalendarDays, Plus, Trash2, Lock, Pencil } from 'lucide-react'
import {
  schools, schoolWeeks, getWeekData,
  getDistrictTrend, getSchoolTrend, getDistrictWeekData,
  MOST_RECENT_WEEK,
} from '../lib/report2Data'
import { toast } from 'sonner'
import { DatePicker } from '../components/ui/date-picker'
import { DateRangePicker } from '../components/ui/date-range-picker'
import { DayPicker } from 'react-day-picker'
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

// ─── Pct color helper ─────────────────────────────────────────────────────────

function pctColor(pct) {
  if (pct >= 80) return { text: '#166534', bg: '#DCFCE7' }   // dark green
  if (pct >= 50) return { text: '#B45309', bg: '#FEF3C7' }   // accessible amber
  return            { text: '#B91C1C', bg: '#FEE2E2' }        // red
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

const DEFAULT_BLACKOUT_PERIODS = [
  { id: 1, name: 'Fall Break',    from: '2025-10-13', to: '2025-10-17' },
  { id: 2, name: 'Thanksgiving',  from: '2025-11-24', to: '2025-11-28' },
  { id: 3, name: 'Winter Break',  from: '2025-12-22', to: '2026-01-02' },
  { id: 4, name: 'MLK Day',       from: '2026-01-19', to: '2026-01-19' },
  { id: 5, name: 'Spring Break',  from: '2026-03-16', to: '2026-03-20' },
  { id: 6, name: 'Memorial Day',  from: '2026-05-25', to: '2026-05-25' },
]

const SETTINGS_TABS = [
  {
    id: 'engagement',
    label: 'Engagement',
    title: 'Engagement settings',
    description: 'Configure how teacher engagement is measured and reported across your district.',
  },
  {
    id: 'school_year',
    label: 'School year',
    title: 'School year',
    description: "Define your district's school year boundaries and quarterly calendar.",
  },
  {
    id: 'blackout',
    label: 'Blackout periods',
    title: 'Blackout periods',
    description: "Mark non-instructional days so they're excluded from engagement calculations.",
  },
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

  const [periods,   setPeriods]   = useState(DEFAULT_BLACKOUT_PERIODS)
  const [newName,   setNewName]   = useState('')
  const [newFrom,   setNewFrom]   = useState('')
  const [newTo,     setNewTo]     = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName,  setEditName]  = useState('')
  const [editFrom,  setEditFrom]  = useState('')
  const [editTo,    setEditTo]    = useState('')

  const canAdd = newName.trim() && newFrom && newTo && newFrom <= newTo

  function startEdit(p) {
    setEditingId(p.id); setEditName(p.name); setEditFrom(p.from); setEditTo(p.to)
  }
  function saveEdit() {
    if (!editName.trim() || !editFrom || !editTo) return
    setPeriods(ps => ps.map(p => p.id === editingId ? { ...p, name: editName.trim(), from: editFrom, to: editTo } : p))
    setEditingId(null)
  }

  const isDirty = (
    tempGoal !== goal ||
    yearStart !== '2025-08-25' ||
    yearEnd   !== '2026-06-05' ||
    q2Start   !== '2025-11-03' ||
    q3Start   !== '2026-01-12' ||
    q4Start   !== '2026-03-23' ||
    JSON.stringify(periods) !== JSON.stringify(DEFAULT_BLACKOUT_PERIODS)
  )

  function addPeriod() {
    if (!canAdd) return
    setPeriods(p => [...p, { id: Date.now(), name: newName.trim(), from: newFrom, to: newTo }])
    setNewName(''); setNewFrom(''); setNewTo('')
  }

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
        className="relative bg-white rounded-2xl border border-brand-border shadow-2xl z-10 flex flex-col"
        style={{ width: '50vw', height: '85vh' }}
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

          {/* Card header — gray bar with title, description, Save */}
          <div className="bg-brand-bg border-b border-brand-border px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-text">{currentTab.title}</p>
              <p className="text-xs text-brand-subtext mt-0.5 leading-relaxed max-w-lg">{currentTab.description}</p>
            </div>
            <button
              className="shrink-0 px-3 py-1 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-95"
              style={{ background: '#1B2B4B' }}
              disabled={!isDirty}
              onClick={() => {
                const messages = {
                  engagement:  `Weekly goal updated to ${tempGoal} day${tempGoal !== 1 ? 's' : ''} per week`,
                  school_year: 'School year dates saved',
                  blackout:    'Blackout periods saved',
                }
                toast.success(messages[activeTab] ?? 'Settings saved')
                onSave(tempGoal, tempTarget)
                onClose()
              }}
            >Save</button>
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
                    <div className="flex-1">
                      <label className="text-xs text-brand-subtext block mb-1">Start</label>
                      <DatePicker value={yearStart} onChange={setYearStart} placeholder="Start date" max={yearEnd || undefined} />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-brand-subtext block mb-1">End</label>
                      <DatePicker value={yearEnd} onChange={setYearEnd} placeholder="End date" min={yearStart || undefined} />
                    </div>
                  </div>
                </div>
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
              </div>
            )}

            {/* ── Blackout periods ── */}
            {activeTab === 'blackout' && (
              <div>
                {/* Period list */}
                <div className="border border-brand-border rounded-xl overflow-hidden mb-4">
                  {periods.length === 0 && (
                    <p className="text-sm text-brand-subtext text-center py-8">No blackout periods added yet.</p>
                  )}
                  {periods.map((p, i) => (
                    <div key={p.id} className={`px-4 py-3 ${i < periods.length - 1 ? 'border-b border-brand-border' : ''}`}>
                      {editingId === p.id ? (
                        <div>
                          <div className="flex items-center gap-2 mb-3">
                            <input
                              autoFocus
                              value={editName}
                              onChange={e => setEditName(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Escape') setEditingId(null) }}
                              className="flex-1 px-3 py-2 text-sm border border-brand-border rounded-lg focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                            />
                            <DateRangePicker from={editFrom} to={editTo} onFromChange={setEditFrom} onToChange={setEditTo} />
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={saveEdit} disabled={!editName.trim() || !editFrom || !editTo} className="text-xs font-semibold px-3 py-1.5 rounded-md text-white disabled:opacity-40" style={{ background: '#2A7F8F' }}>Save</button>
                            <button onClick={() => setEditingId(null)} className="text-xs font-semibold text-brand-subtext hover:text-brand-text">Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-medium text-brand-text flex-1">{p.name}</span>
                          <span className="text-xs text-brand-subtext tabular-nums">
                            {format(parseISO(p.from), 'MMM d')}
                            {p.from !== p.to && <> – {format(parseISO(p.to), p.to.slice(0,7) === p.from.slice(0,7) ? 'd' : 'MMM d')}</>}
                          </span>
                          <button onClick={() => startEdit(p)} className="text-brand-subtext hover:text-brand-text p-1 rounded-md hover:bg-brand-bg transition-colors">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => setPeriods(ps => ps.filter(x => x.id !== p.id))} className="text-brand-subtext hover:text-red-500 p-1 rounded-md hover:bg-red-50 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Add row */}
                <div className="border-t border-brand-border pt-4 mt-2">
                  <p className="text-xs font-semibold text-brand-text mb-2">Add a period</p>
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Name (e.g. Winter Break)"
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      className="flex-1 px-3 py-2 text-sm border border-brand-border rounded-lg text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                    />
                    <DateRangePicker from={newFrom} to={newTo} onFromChange={setNewFrom} onToChange={setNewTo} />
                  </div>
                  <button
                    onClick={addPeriod}
                    disabled={!canAdd}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
                    style={{ background: '#2A7F8F' }}
                  >
                    <Plus size={14} /> Add period
                  </button>
                </div>
              </div>
            )}

          </div>
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
    <div className="max-w-screen-xl mx-auto px-6 pt-20 pb-8">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
        className="flex items-end justify-between mb-6"
      >
        <div>
<h1 className="text-2xl font-semibold text-brand-text">School Engagement</h1>
          <p className="text-sm text-brand-subtext mt-1">Teachers actively bringing SEL to their classrooms each week</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium border border-brand-border bg-white hover:shadow-sm transition-all text-brand-text"
            onClick={() => setSettingsOpen(true)}
          >
            <Settings size={14} /> Settings
          </button>
          <div className="relative" ref={menuRef}>
            <button
              className="flex items-center px-3.5 py-[11px] rounded-md text-sm font-medium border border-brand-border bg-white hover:shadow-sm transition-all text-brand-text"
              onClick={() => setMenuOpen(o => !o)}
            >
              <MoreHorizontal size={14} />
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] bg-white rounded-xl border border-brand-border shadow-lg z-20 w-52 py-1">
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

      {/* Trend chart card — commented out
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
      */}

      {/* School table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.28 }}
        className="bg-white rounded-xl border border-brand-border shadow-sm"
      >
        {/* Table toolbar */}
        {(() => {
          const activeFilters = (dateFrom || dateTo) ? 1 : 0
          return (
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-b border-brand-border bg-brand-bg/40 rounded-t-xl">
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
                  <CalendarDays size={13} />
                  Date range
                  {activeFilters > 0 && (
                    <span className="ml-0.5 bg-white/25 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {activeFilters}
                    </span>
                  )}
                </button>

                {showFilters && (
                  <div className="absolute right-0 top-full mt-1.5 bg-white border border-brand-border rounded-xl shadow-lg z-30 p-5" style={{ width: 620 }}>
                    <InlineRangeCal from={dateFrom} to={dateTo} onFromChange={setDateFrom} onToChange={setDateTo} />
                    <div className="flex items-center justify-between mt-3 pt-3">
                      <span className="text-xs text-brand-subtext">
                        {dateFrom && dateTo
                          ? `${format(parseISO(dateFrom), 'MMM d')} – ${format(parseISO(dateTo), 'MMM d, yyyy')}`
                          : dateFrom ? `From ${format(parseISO(dateFrom), 'MMM d, yyyy')}` : ''}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          disabled={!dateFrom && !dateTo}
                          onClick={() => { setDateFrom(''); setDateTo('') }}
                          className="text-xs font-semibold text-blue-500 hover:text-blue-600 transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                        >Clear</button>
                        <button
                          disabled={!dateFrom && !dateTo}
                          onClick={() => setShowFilters(false)}
                          className="text-xs font-semibold text-white px-3 py-1 rounded-md transition-colors hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed"
                          style={{ background: '#1B2B4B' }}
                        >Save</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })()}

        {/* School table */}
        <div className="overflow-hidden rounded-b-xl">
        <table className="w-full table-fixed">
          <colgroup>
            <col style={{ width: '32%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '18%' }} />
            <col />
          </colgroup>
          <thead>
            <tr className="border-b border-brand-border">
              <th className="py-3 pl-4 text-left"><SortBtn col="name"       label="School"       sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="py-3 text-left">      <SortBtn col="teachers"   label="Teachers"     sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="py-3 text-left">      <SortBtn col="reached"    label="Reached Goal" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
              <th className="py-3 pr-4 text-left"> <SortBtn col="engagement" label="Engagement"   sortBy={sortBy} sortDir={sortDir} onSort={handleSort} /></th>
            </tr>
          </thead>
          <tbody>
            {visibleSchools.map(({ school, totalTeachers, meetingGoal, pct }) => {
              const { text: pctText, bg: pctBg } = pctColor(pct)
              return (
                <tr key={school.id} className="border-b border-brand-border last:border-b-0">
                  <td className="py-4 pl-4">
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
                  <td className="py-4 pr-4">
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
        </div>

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
