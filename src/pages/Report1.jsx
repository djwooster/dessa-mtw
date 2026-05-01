import { useState, useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal, Download, Printer, SlidersHorizontal,
  ArrowUpDown, ArrowUp, ArrowDown, X, Check, Calendar, CheckCircle2, XCircle,
} from 'lucide-react'
import { ALL_TEACHERS, SCHOOL_DAYS, SCHOOLS, REPORT_TODAY, YTD_DAYS } from '../lib/reportData'
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from '../components/ui/pagination'
import { DatePicker } from '../components/ui/date-picker'
import { Slider } from '../components/ui/slider'

const COLOR_GREEN_DARK = '#26884b'  // dessa-greenDark token

// ── Engagement level config ───────────────────────────────────────────────────

const LEVEL_CONFIG = {
  d: { label: 'Deep engagement',   short: 'Deep',   description: '5+ min'   },
  a: { label: 'Active engagement', short: 'Active', description: '1–5 min'  },
  b: { label: 'Brief visit',       short: 'Brief',  description: '< 1 min'  },
  n: { label: 'No access',         short: 'None',   description: ''         },
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getEngagementPct(teacher) {
  return Math.round((teacher.days.filter(d => d.level !== 'n').length / 20) * 100)
}

function getLastActive(teacher) {
  for (let i = teacher.days.length - 1; i >= 0; i--) {
    if (teacher.days[i].level !== 'n') return teacher.days[i].date
  }
  return null
}

function getWeeklyData(teacher) {
  return [1, 2, 3, 4].map(week => ({
    week,
    activeDays: teacher.days.filter(d => d.week === week && d.level !== 'n').length,
  }))
}

function getLastActiveBadge(dateStr) {
  if (!dateStr) return { label: 'Never' }
  const diff = Math.round((new Date(REPORT_TODAY) - new Date(dateStr)) / 86400000)
  if (diff === 0) return { label: 'Today' }
  return { label: `${diff}d` }
}

function getCellStyle(level) {
  return level && level !== 'n'
    ? { backgroundColor: '#2A7F8F' }
    : {}
}

function formatDuration(secs) {
  if (!secs) return '–'
  const m = Math.floor(secs / 60)
  const s = secs % 60
  return m > 0 ? `${m}m ${s}s` : `${s}s`
}

function exportCsv(teachers) {
  const rows = [['Last Name', 'First Name', 'School', 'Date', 'Duration (sec)', 'Engagement Level']]
  teachers.forEach(t =>
    t.days.forEach(d =>
      rows.push([t.lastName, t.firstName, t.school, d.date, d.durationSecs, d.level !== 'n' ? 'Completed' : 'No lesson'])
    )
  )
  const url = URL.createObjectURL(new Blob([rows.map(r => r.join(',')).join('\n')], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), { href: url, download: 'mtw-engagement.csv' }).click()
  URL.revokeObjectURL(url)
}

// ── Shared micro-components ───────────────────────────────────────────────────

function LevelSwatch({ level, size = 14 }) {
  return (
    <span
      className="inline-block rounded-sm shrink-0"
      style={{ width: size, height: size, ...getCellStyle(level) }}
      aria-hidden="true"
    />
  )
}

function LevelLegend() {
  return (
    <div className="flex items-center gap-x-5 text-xs text-brand-subtext">
      <span className="flex items-center gap-1.5">
        <span className="inline-block rounded-sm shrink-0 w-3.5 h-3.5" style={{ backgroundColor: '#2A7F8F' }} />
        Lesson completed
      </span>
      <span className="flex items-center gap-1.5">
        <span className="inline-block rounded-sm shrink-0 w-3.5 h-3.5 bg-brand-bg border border-brand-border" />
        No lesson
      </span>
    </div>
  )
}

function LastActiveBadge({ badge }) {
  return <span className="text-sm text-brand-text">{badge.label}</span>
}

function WeekDots({ teacher }) {
  const week4Days = SCHOOL_DAYS.filter(d => d.week === 4)
  const dayLookup = Object.fromEntries(teacher.days.map(d => [d.date, d.level]))
  return (
    <div className="flex items-end gap-1.5">
      {week4Days.map(day => {
        const level = dayLookup[day.date]
        const completed = level && level !== 'n'
        const isToday = day.date === REPORT_TODAY
        return (
          <div
            key={day.date}
            className="flex flex-col items-center gap-1"
            title={`${day.date}: ${completed ? 'Lesson completed' : 'No lesson'}`}
          >
            <div
              className="w-4 h-4 rounded-full border-2 transition-colors flex items-center justify-center"
              style={completed ? { backgroundColor: COLOR_GREEN_DARK, borderColor: COLOR_GREEN_DARK } : {}}
            >
              {completed
                ? <Check size={9} strokeWidth={3} className="text-white" />
                : <X size={9} strokeWidth={3} className="text-brand-border" />
              }
            </div>
            <span className={`text-[9px] leading-none ${
              isToday ? 'font-bold text-brand-text' : 'text-brand-subtext/50'
            }`}>
              {day.dayLabel}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function SortBtn({ col, label, sortBy, sortDir, onSort }) {
  const active = sortBy === col
  return (
    <button
      onClick={() => onSort(col)}
      className="flex items-center gap-1 text-xs font-semibold text-brand-subtext hover:text-brand-text transition-colors group"
    >
      {label}
      {active
        ? sortDir === 'desc' ? <ArrowDown size={11} className="text-dessa-teal" /> : <ArrowUp size={11} className="text-dessa-teal" />
        : <ArrowUpDown size={11} className="opacity-40 group-hover:opacity-70" />}
    </button>
  )
}

function RecentPct({ pct }) {
  return <div className="text-sm font-semibold text-brand-text">{pct}%</div>
}

function ConceptHeader({ label, title, description }) {
  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-[10px] font-bold tracking-widest uppercase text-brand-subtext bg-brand-bg px-2 py-0.5 rounded border border-brand-border whitespace-nowrap">
          {label}
        </span>
        <div className="flex-1 h-px bg-brand-border" />
      </div>
      <h2 className="text-base font-semibold text-brand-text mb-0.5">{title}</h2>
      <p className="text-sm text-brand-subtext">{description}</p>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="py-12 text-center text-brand-subtext text-sm">
      No teachers match this filter.
    </div>
  )
}

function SchoolSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const options = ['All', ...SCHOOLS]

  useEffect(() => {
    if (!open) return
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 text-sm border border-brand-border rounded-lg bg-white pl-3 pr-3 py-1.5 text-brand-text hover:bg-brand-bg transition-colors min-w-[140px] justify-between"
      >
        <span>{value === 'All' ? 'All schools' : value}</span>
        <ChevronDown size={14} className={`text-brand-subtext transition-transform duration-150 ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute left-0 top-full mt-1.5 w-56 bg-white border border-brand-border rounded-lg shadow-lg z-20 py-1 overflow-hidden">
          {options.map(opt => (
            <button
              key={opt}
              onClick={() => { onChange(opt); setOpen(false) }}
              className={`flex items-center justify-between w-full px-3 py-2 text-sm text-left transition-colors ${
                value === opt ? 'text-dessa-teal font-medium bg-brand-bg' : 'text-brand-text hover:bg-brand-bg'
              }`}
            >
              {opt === 'All' ? 'All schools' : opt}
              {value === opt && <Check size={13} className="text-dessa-teal" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Concept A: Ranked List + Calendar Detail ──────────────────────────────────

function MonthCalendar({ year, month, dayMap }) {
  const firstDay    = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells       = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div>
      <div className="text-xs font-semibold text-brand-subtext mb-2">
        {new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-[10px] text-brand-subtext/80 text-center py-0.5">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = `${year}-${String(month + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const level   = dayMap[dateStr]
          const dow     = (firstDay + day - 1) % 7
          const isWknd  = dow === 0 || dow === 6
          return (
            <div
              key={day}
              className={`w-6 h-6 flex items-center justify-center text-[11px] rounded mx-auto ${
                isWknd ? 'text-brand-subtext/25' :
                (level && level !== 'n') ? 'text-white font-semibold' :
                'text-brand-subtext/70'
              }`}
              style={isWknd ? {} : (level && level !== 'n') ? getCellStyle(level) : { backgroundColor: '#EBEBEB' }}
              aria-label={`${dateStr}: ${isWknd ? 'Weekend' : (level && level !== 'n') ? 'Lesson completed' : 'No lesson'}`}
              title={`${dateStr}${(!isWknd && level && level !== 'n') ? ' · Lesson completed' : ''}`}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TeacherCalendar({ teacher }) {
  const [startYear,  setStartYear]  = useState(2025)
  const [startMonth, setStartMonth] = useState(10) // 0-indexed; default: Nov 2025 → shows Nov–Apr

  const secondMonth = startMonth === 11 ? 0  : startMonth + 1
  const secondYear  = startMonth === 11 ? startYear + 1 : startYear
  const thirdMonth  = secondMonth === 11 ? 0  : secondMonth + 1
  const thirdYear   = secondMonth === 11 ? secondYear + 1 : secondYear
  const fourthMonth = thirdMonth  === 11 ? 0  : thirdMonth  + 1
  const fourthYear  = thirdMonth  === 11 ? thirdYear  + 1 : thirdYear
  const fifthMonth  = fourthMonth === 11 ? 0  : fourthMonth + 1
  const fifthYear   = fourthMonth === 11 ? fourthYear + 1 : fourthYear
  const sixthMonth  = fifthMonth  === 11 ? 0  : fifthMonth  + 1
  const sixthYear   = fifthMonth  === 11 ? fifthYear  + 1 : fifthYear

  const atMin = startYear === 2025 && startMonth === 8  // Sep 2025 (shows Sep–Feb)
  const atMax = startYear === 2025 && startMonth === 10 // Nov 2025 (shows Nov–Apr)

  function prevMonth() {
    if (atMin) return
    if (startMonth === 0) { setStartYear(y => y - 1); setStartMonth(11) }
    else setStartMonth(m => m - 1)
  }
  function nextMonth() {
    if (atMax) return
    if (startMonth === 11) { setStartYear(y => y + 1); setStartMonth(0) }
    else setStartMonth(m => m + 1)
  }

  const rangeLabel = (() => {
    const m1 = new Date(startYear, startMonth,  1).toLocaleDateString('en-US', { month: 'short' })
    const m6 = new Date(sixthYear, sixthMonth,  1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    return `${m1} – ${m6}`
  })()

  const dayMap = Object.fromEntries(teacher.days.map(d => [d.date, d.level]))

  return (
    <div className="bg-brand-bg/50 rounded-xl p-5 border border-brand-border/50 mt-1">
      <div>
        <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              disabled={atMin}
              className="p-1 rounded border border-brand-border hover:bg-brand-border/60 disabled:opacity-25 disabled:cursor-default transition-colors"
            >
              <ChevronLeft size={14} className="text-brand-subtext" />
            </button>
            <span className="text-xs font-medium text-brand-subtext">{rangeLabel}</span>
            <button
              onClick={nextMonth}
              disabled={atMax}
              className="p-1 rounded border border-brand-border hover:bg-brand-border/60 disabled:opacity-25 disabled:cursor-default transition-colors"
            >
              <ChevronRight size={14} className="text-brand-subtext" />
            </button>
          </div>
          <div className="flex gap-6">
            <MonthCalendar year={startYear}  month={startMonth}  dayMap={dayMap} />
            <MonthCalendar year={secondYear} month={secondMonth} dayMap={dayMap} />
            <MonthCalendar year={thirdYear}  month={thirdMonth}  dayMap={dayMap} />
            <MonthCalendar year={fourthYear} month={fourthMonth} dayMap={dayMap} />
            <MonthCalendar year={fifthYear}  month={fifthMonth}  dayMap={dayMap} />
            <MonthCalendar year={sixthYear}  month={sixthMonth}  dayMap={dayMap} />
          </div>
        </div>
    </div>
  )
}

function ConceptA({ teachers, expandedId, onExpand, sortBy, setSortBy, sortDir, setSortDir }) {
  function handleSort(col) {
    if (sortBy === col) setSortDir(d => d === 'desc' ? 'asc' : 'desc')
    else { setSortBy(col); setSortDir('desc') }
  }

  if (!teachers.length) return <EmptyState />

  return (
    <>
      {/* Table header */}
      <div
        className="grid gap-4 px-4 py-2.5 border-b border-brand-border bg-brand-bg/40"
        style={{ gridTemplateColumns: '40px 1fr 90px 130px 130px 24px' }}
      >
        <div className="text-xs font-semibold text-brand-subtext text-center">#</div>
        <SortBtn col="name"       label="Teacher"          sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <SortBtn col="recent"     label="Last 4 Wks"       sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <SortBtn col="engagement" label="Engagement (YTD)" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <SortBtn col="lastActive" label="This Week"        sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <div />
      </div>

      {/* Rows */}
      <div className="divide-y divide-brand-border/50">
        {teachers.map((t, i) => {
          const isOpen = expandedId === t.id
          return (
            <div key={t.id}>
              <button
                className="grid gap-4 px-4 py-3 w-full text-left hover:bg-brand-bg/40 transition-colors group"
                style={{ gridTemplateColumns: '40px 1fr 90px 130px 130px 24px' }}
                onClick={() => onExpand(t.id)}
                aria-expanded={isOpen}
              >
                <div className="text-xs font-semibold text-brand-subtext text-center self-center">{i + 1}</div>

                <div className="self-center">
                  <div className="text-sm font-semibold text-brand-text">{t.lastName}, {t.firstName}</div>
                  <div className="text-xs text-brand-subtext mt-0.5">{t.school}</div>
                </div>

                <div className="self-center">
                  <RecentPct pct={t.engagementPct} />
                </div>

                <div className="self-center">
                  <div className="text-sm font-semibold text-brand-text">{t.ytdPct}%</div>
                </div>

                <div className="self-center">
                  <WeekDots teacher={t} />
                </div>

                <div className="self-center text-brand-subtext group-hover:text-brand-text transition-colors">
                  <ChevronRight size={15} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''}`} />
                </div>
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    key="panel"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4">
                      <TeacherCalendar teacher={t} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )
        })}
      </div>
    </>
  )
}

// ── Concept B: Engagement Heatmap ─────────────────────────────────────────────

function ConceptB({ teachers }) {
  const [tooltip, setTooltip] = useState(null)

  if (!teachers.length) return <EmptyState />

  const weekGroups = [1, 2, 3, 4].map(w => ({
    week: w,
    days: SCHOOL_DAYS.filter(d => d.week === w),
    label: ['Mar 24', 'Mar 31', 'Apr 7', 'Apr 14'][w - 1],
  }))

  return (
    <div>
      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          {/* Week group headers */}
          <div className="flex mb-1" style={{ paddingLeft: 172 }}>
            {weekGroups.map(({ week, days, label }) => (
              <div key={week} className="flex items-center" style={{ width: days.length * 28 + (days.length - 1) * 4, marginRight: week < 4 ? 16 : 0 }}>
                <div className="text-[10px] font-semibold text-brand-subtext uppercase tracking-wider w-full text-center">
                  Wk {week} · {label}
                </div>
              </div>
            ))}
          </div>

          {/* Day-letter sub-headers */}
          <div className="flex mb-2" style={{ paddingLeft: 172 }}>
            {weekGroups.map(({ week, days }) => (
              <div key={week} className="flex gap-1" style={{ marginRight: week < 4 ? 16 : 0 }}>
                {days.map(d => (
                  <div key={d.date} className="w-7 text-center text-[9px] text-brand-subtext/60">{d.dayLabel}</div>
                ))}
              </div>
            ))}
          </div>

          {/* Teacher rows */}
          {teachers.map(t => {
            const dayLookup = Object.fromEntries(t.days.map(d => [d.date, d]))
            return (
              <div key={t.id} className="flex items-center mb-1 group">
                <div className="w-[160px] shrink-0 text-right pr-3">
                  <span className="text-xs font-medium text-brand-text group-hover:text-dessa-teal transition-colors">
                    {t.lastName}, {t.firstName[0]}.
                  </span>
                </div>
                <div className="flex">
                  {weekGroups.map(({ week, days }) => (
                    <div key={week} className="flex gap-1" style={{ marginRight: week < 4 ? 16 : 0 }}>
                      {days.map(day => {
                        const d         = dayLookup[day.date]
                        const level     = d?.level ?? 'n'
                        const dow       = new Date(day.date).getDay()
                        const isWknd    = dow === 0 || dow === 6
                        const completed = !isWknd && level !== 'n'
                        const tip       = `${t.lastName}, ${t.firstName} · ${day.date} · ${isWknd ? 'Weekend' : completed ? 'Lesson completed' : 'No lesson'}`
                        return (
                          <div
                            key={day.date}
                            className="w-7 h-7 rounded-sm cursor-default"
                            style={isWknd ? {} : getCellStyle(level)}
                            aria-label={tip}
                            onMouseEnter={e => setTooltip({ text: tip, x: e.clientX, y: e.clientY })}
                            onMouseLeave={() => setTooltip(null)}
                            onMouseMove={e => setTooltip(prev => prev ? { ...prev, x: e.clientX, y: e.clientY } : null)}
                          />
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {tooltip && (
        <div
          className="fixed z-50 bg-brand-text text-white text-xs px-2.5 py-1.5 rounded-md shadow-lg pointer-events-none whitespace-nowrap"
          style={{ left: tooltip.x + 14, top: tooltip.y - 40 }}
        >
          {tooltip.text}
        </div>
      )}
    </div>
  )
}

// ── Concept C: Program Dashboard ──────────────────────────────────────────────

function WeeklyDistributionChart({ teachers }) {
  const weekLabels = ['Wk 1  ·  Mar 24', 'Wk 2  ·  Mar 31', 'Wk 3  ·  Apr 7', 'Wk 4  ·  Apr 14']

  const data = [1,2,3,4].map(w => {
    const all   = teachers.flatMap(t => t.days.filter(d => d.week === w))
    const total = all.length || 1
    const cnt   = lvl => all.filter(d => d.level === lvl).length
    return { deepN: cnt('d'), activeN: cnt('a'), briefN: cnt('b'), noneN: cnt('n'), total }
  })

  return (
    <div>
      <div className="text-xs font-semibold text-brand-subtext uppercase tracking-wider mb-5">
        Engagement quality by week
      </div>
      <div className="space-y-3">
        {data.map((row, i) => {
          const pct = lvl => `${(row[`${lvl}N`] / row.total * 100).toFixed(1)}%`
          return (
            <div key={i} className="flex items-center gap-3">
              <div className="w-32 text-right text-[11px] text-brand-subtext shrink-0">{weekLabels[i]}</div>
              <div className="flex-1 h-7 flex rounded-md overflow-hidden" style={{ backgroundColor: '#F0F2F5' }}>
                {row.deepN > 0 && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: pct('deep'), backgroundColor: '#2A7F8F' }}
                    title={`Deep: ${row.deepN} teacher-days`}
                  />
                )}
                {row.activeN > 0 && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: pct('active'), background: 'repeating-linear-gradient(45deg,#2A7F8F 0px,#2A7F8F 2px,#E8F4F6 2px,#E8F4F6 8px)' }}
                    title={`Active: ${row.activeN} teacher-days`}
                  />
                )}
                {row.briefN > 0 && (
                  <div
                    className="h-full transition-all duration-500"
                    style={{ width: pct('brief'), backgroundImage: 'radial-gradient(circle,#2A7F8F 1.5px,transparent 1.5px)', backgroundSize: '6px 6px', backgroundColor: '#E8F4F6' }}
                    title={`Brief: ${row.briefN} teacher-days`}
                  />
                )}
              </div>
              <div className="w-16 text-xs text-brand-subtext shrink-0">
                {Math.round((1 - row.noneN / row.total) * 100)}% active
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-1 text-[11px] text-brand-subtext">
        <span>Each bar = {teachers.length > 0 ? teachers.length * 5 : '—'} teacher-days.</span>
        <span>Hover segments for counts.</span>
      </div>
    </div>
  )
}

function StatCards({ teachers }) {
  if (!teachers.length) return null
  const activeThisWeek = teachers.filter(t => t.days.some(d => d.week === 4 && d.level !== 'n'))
  const avgPct         = Math.round(teachers.reduce((s, t) => s + t.engagementPct, 0) / teachers.length)
  const totalActive    = teachers.reduce((s, t) => s + t.days.filter(d => d.level !== 'n').length, 0)
  const avgDaysPerWk   = (totalActive / teachers.length / 4).toFixed(1)
  const stats = [
    { value: `${activeThisWeek.length}`, sub: `of ${teachers.length} teachers`, label: 'Active this week',       pct: Math.round(activeThisWeek.length / teachers.length * 100) },
    { value: `${avgPct}%`,               sub: 'avg over 4 weeks',               label: '4-week engagement rate', pct: avgPct },
    { value: avgDaysPerWk,               sub: 'avg per teacher',                 label: 'Lessons completed per week',   pct: Math.min(Math.round(parseFloat(avgDaysPerWk) / 5 * 100), 100) },
  ]
  return (
    <div className="grid grid-cols-3 gap-4 mb-6">
      {stats.map(({ value, sub, label, pct }) => (
        <div key={label} className="bg-white rounded-xl p-5 border border-brand-border shadow-sm">
          <div className="text-3xl font-bold text-brand-text">{value}</div>
          <div className="text-xs text-brand-subtext mt-0.5 mb-4">{sub}</div>
          <div className="h-1.5 rounded-full bg-brand-border overflow-hidden mb-2">
            <div className="h-full rounded-full bg-dessa-teal transition-all duration-500" style={{ width: `${pct}%` }} />
          </div>
          <div className="text-xs font-semibold text-brand-text">{label}</div>
        </div>
      ))}
    </div>
  )
}

function ConceptC({ teachers }) {
  if (!teachers.length) return <EmptyState />

  const schoolStats = SCHOOLS
    .map(school => {
      const ts = teachers.filter(t => t.school === school)
      if (!ts.length) return null
      const avg = Math.round(ts.reduce((s, t) => s + t.engagementPct, 0) / ts.length)
      return { school, count: ts.length, avg }
    })
    .filter(Boolean)

  return (
    <div className="space-y-6">
      <StatCards teachers={teachers} />

      {/* Chart + school breakdown */}
      <div className="grid gap-4" style={{ gridTemplateColumns: '1fr 280px' }}>
        <div className="bg-white rounded-xl p-5 border border-brand-border shadow-sm">
          <WeeklyDistributionChart teachers={teachers} />
        </div>
        <div className="bg-white rounded-xl p-5 border border-brand-border shadow-sm">
          <div className="text-xs font-semibold text-brand-subtext uppercase tracking-wider mb-5">By school</div>
          <div className="space-y-5">
            {schoolStats.map(({ school, count, avg, goal }) => (
              <div key={school}>
                <div className="flex justify-between items-baseline mb-1.5">
                  <span className="text-xs font-semibold text-brand-text truncate mr-2">{school}</span>
                  <span className="text-xs text-brand-subtext shrink-0">{count} teachers</span>
                </div>
                <div className="h-2 rounded-full bg-brand-border overflow-hidden mb-1.5">
                  <div className="h-full rounded-full bg-dessa-teal transition-all duration-500" style={{ width: `${avg}%` }} />
                </div>
                <div className="flex justify-between text-[11px] text-brand-subtext">
                  <span>{avg}% engagement</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Compact teacher list */}
      <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-brand-border bg-brand-bg/40 flex items-center justify-between">
          <span className="text-xs font-semibold text-brand-subtext uppercase tracking-wider">All teachers</span>
          <span className="text-xs text-brand-subtext">{teachers.length} total</span>
        </div>
        <div className="divide-y divide-brand-border/40">
          {teachers.map((t, i) => (
            <div key={t.id} className="flex items-center gap-4 px-4 py-2.5 hover:bg-brand-bg/40 transition-colors">
              <div className="text-xs font-semibold text-brand-subtext w-5 text-center shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-brand-text">{t.lastName}, {t.firstName}</div>
                <div className="text-xs text-brand-subtext">{t.school}</div>
              </div>
              <div className="shrink-0 text-right">
                <div className="text-xs font-semibold text-brand-text mb-1">{t.engagementPct}%</div>
                <div className="h-1.5 w-16 rounded-full bg-brand-border overflow-hidden">
                  <div className="h-full rounded-full bg-dessa-teal" style={{ width: `${t.engagementPct}%` }} />
                </div>
              </div>
              <div className="shrink-0 w-24 text-right">
                <LastActiveBadge badge={t.lastActiveBadge} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Weekly Goal KPI Bar ───────────────────────────────────────────────────────

const WEEKLY_GOAL_DAYS = 3  // lessons/week to hit the goal

function WeeklyGoalBar({ teachers }) {
  const metGoal = teachers.filter(t =>
    t.days.filter(d => d.week === 4 && d.level !== 'n').length >= WEEKLY_GOAL_DAYS
  ).length
  const total   = teachers.length
  const pct     = total === 0 ? 0 : Math.round((metGoal / total) * 100)

  const TICKS       = 160
  const filledTicks = total === 0 ? 0 : Math.round((metGoal / total) * TICKS)
  const barColor    = pct >= 85 ? COLOR_GREEN_DARK : pct >= 50 ? '#F5A623' : '#D95555'

  return (
    <div className="bg-white rounded-xl border border-brand-border shadow-sm px-8 py-7 mb-4">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="text-[12px] font-semibold tracking-widest uppercase text-brand-subtext/80 mb-2">
            Teachers hitting weekly goal
          </div>
          <div className="text-4xl font-bold text-brand-text leading-none">{pct}%</div>
        </div>
        <div className="text-right text-[10px] font-bold tracking-widest uppercase text-brand-subtext leading-relaxed pt-0.5">
          Goal: {WEEKLY_GOAL_DAYS}+ lessons<br />
          <span className="font-normal normal-case tracking-normal text-xs text-brand-subtext/70">Week 4 · Apr 14–18</span>
        </div>
      </div>

      {/* Segmented tick bar */}
      <div className="flex gap-[2px] mb-5">
        {Array.from({ length: TICKS }).map((_, i) => (
          <div
            key={i}
            className="flex-1 h-[28px] rounded-full"
            style={{ backgroundColor: i < filledTicks ? barColor : '#E2E6EA' }}
          />
        ))}
      </div>

      <div className="flex justify-between text-[14px] text-brand-subtext">
        <span><span className="font-semibold text-brand-text">{metGoal}</span> / {total} teachers</span>
        <span>{total - metGoal} not yet reached</span>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Report1() {
  const [search,          setSearch]          = useState('')
  const [school,          setSchool]          = useState('All')
  const [dateStart,       setDateStart]       = useState('')
  const [dateEnd,         setDateEnd]         = useState('')
  const [engagementRange, setEngagementRange] = useState([0, 100])
  const [showFilters,     setShowFilters]     = useState(false)
  const [expandedId,      setExpandedId]      = useState(null)
  const [page,            setPage]            = useState(1)
  const [pageSize,        setPageSize]        = useState(25)
  const filterRef     = useRef(null)
  const [quickFilter,     setQuickFilter]     = useState(null)
  const engagementActive = engagementRange[0] !== 0 || engagementRange[1] !== 100
  const activeFilters = (quickFilter ? 1 : 0) + (dateStart || dateEnd ? 1 : 0) + (engagementActive ? 1 : 0)
  const [sortBy,     setSortBy]     = useState('engagement')
  const [sortDir,    setSortDir]    = useState('desc')
  const [showMenu,   setShowMenu]   = useState(false)

  const enriched = useMemo(() =>
    ALL_TEACHERS.map(t => ({
      ...t,
      engagementPct:   getEngagementPct(t),
      lastActive:      getLastActive(t),
      weeklyData:      getWeeklyData(t),
      lastActiveBadge: getLastActiveBadge(getLastActive(t)),
    }))
  , [])  // ytdPct comes directly from TEACHERS data

  const filtered = useMemo(() =>
    enriched.filter(t => {
      if (school !== 'All' && t.school !== school) return false
      if (search) {
        const q = search.toLowerCase()
        if (!t.firstName.toLowerCase().includes(q) && !t.lastName.toLowerCase().includes(q)) return false
      }
      if (dateStart || dateEnd) {
        const hasActivity = t.days.some(d =>
          d.level !== 'n' &&
          (!dateStart || d.date >= dateStart) &&
          (!dateEnd   || d.date <= dateEnd)
        )
        if (!hasActivity) return false
      }
      if (engagementActive) {
        const p = t.engagementPct
        if (p < engagementRange[0] || p > engagementRange[1]) return false
      }
      if (quickFilter === 'completed-today') {
        const level = t.days.find(d => d.date === REPORT_TODAY)?.level
        if (!level || level === 'n') return false
      }
      if (quickFilter === 'not-completed-today') {
        const level = t.days.find(d => d.date === REPORT_TODAY)?.level
        if (level && level !== 'n') return false
      }

      return true
    })
  , [enriched, school, search, dateStart, dateEnd, engagementRange, quickFilter])

  const sorted = useMemo(() =>
    [...filtered].sort((a, b) => {
      const d = sortDir === 'desc' ? -1 : 1
      if (sortBy === 'name')       return d * a.lastName.localeCompare(b.lastName)
      if (sortBy === 'recent')     return d * (a.engagementPct - b.engagementPct)
      if (sortBy === 'engagement') return d * (a.ytdPct - b.ytdPct)
      if (sortBy === 'lastActive') {
        if (!a.lastActive) return 1
        if (!b.lastActive) return -1
        return d * a.lastActive.localeCompare(b.lastActive)
      }
      return 0
    })
  , [filtered, sortBy, sortDir])

  const totalPages  = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pagedTeachers = sorted.slice((page - 1) * pageSize, page * pageSize)
  const rangeStart  = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd    = Math.min(page * pageSize, sorted.length)

  useEffect(() => { setPage(1) }, [search, school, dateStart, dateEnd, engagementRange[0], engagementRange[1], pageSize, quickFilter])

  useEffect(() => {
    if (!showFilters) return
    function handleClick(e) { if (filterRef.current && !filterRef.current.contains(e.target)) setShowFilters(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [showFilters])

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">

      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <div className="text-[10px] font-bold tracking-widest uppercase text-brand-subtext mb-1.5">
            MTW · Admin Report
          </div>
          <h1 className="text-2xl font-bold text-brand-text leading-tight">
            Teacher Engagement Overview
          </h1>
          <p className="text-sm text-brand-subtext mt-1">
            MTW curriculum lesson access · Mar 24 – Apr 18, 2026
          </p>
        </div>

        {/* Options menu */}
        <div className="relative">
          <button
            onClick={() => setShowMenu(v => !v)}
            className="flex items-center gap-1.5 text-xs font-medium text-brand-subtext hover:text-brand-text border border-brand-border rounded-lg px-3 py-1.5 bg-white hover:bg-brand-bg transition-colors"
          >
            <MoreHorizontal size={14} />
            Options
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-brand-border rounded-lg shadow-lg z-20 overflow-hidden py-1">
              <button
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-text hover:bg-brand-bg transition-colors"
                onClick={() => { exportCsv(filtered); setShowMenu(false) }}
              >
                <Download size={13} className="text-brand-subtext" />
                Export as CSV
              </button>
              <button
                className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-text hover:bg-brand-bg transition-colors"
                onClick={() => { window.print(); setShowMenu(false) }}
              >
                <Printer size={13} className="text-brand-subtext" />
                Print report
              </button>
            </div>
          )}
        </div>
      </div>

      <WeeklyGoalBar teachers={sorted} />

      {/* Table */}
      <div className="bg-white rounded-xl border border-brand-border shadow-sm mb-16">

        {/* Table toolbar */}
        <div className="flex items-center justify-end gap-3 px-4 py-3 border-b border-brand-border bg-brand-bg/40">
          <div className="flex items-center gap-2 flex-1 flex-wrap">
            {school !== 'All' && (
              <span className="flex items-center gap-1 text-xs bg-dessa-teal/10 text-dessa-teal border border-dessa-teal/20 rounded-md px-2.5 py-0.5 font-medium">
                {school}
                <button onClick={() => setSchool('All')} className="hover:text-dessa-teal/60 transition-colors ml-0.5"><X size={11} /></button>
              </span>
            )}
            {(dateStart || dateEnd) && (
              <span className="flex items-center gap-1.5 text-xs bg-dessa-teal/10 text-dessa-teal border border-dessa-teal/20 rounded-md px-2.5 py-0.5 font-medium">
                <Calendar size={11} />
                {dateStart ? new Date(dateStart + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '…'}
                {' – '}
                {dateEnd ? new Date(dateEnd + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '…'}
                <button onClick={() => { setDateStart(''); setDateEnd('') }} className="hover:text-dessa-teal/60 transition-colors ml-0.5"><X size={11} /></button>
              </span>
            )}
            {engagementActive && (
              <span className="flex items-center gap-1 text-xs bg-dessa-teal/10 text-dessa-teal border border-dessa-teal/20 rounded-md px-2.5 py-0.5 font-medium">
                {engagementRange[0]}%–{engagementRange[1]}% engagement
                <button onClick={() => setEngagementRange([0, 100])} className="hover:text-dessa-teal/60 transition-colors ml-0.5"><X size={11} /></button>
              </span>
            )}
            {quickFilter && (
              <span className="flex items-center gap-1 text-xs bg-dessa-teal/10 text-dessa-teal border border-dessa-teal/20 rounded-md px-2.5 py-0.5 font-medium">
                {{ 'completed-today': 'Completed today', 'not-completed-today': 'Not completed today', 'on-track': 'On track this week', 'needs-attention': 'Needs attention' }[quickFilter]}
                <button onClick={() => setQuickFilter(null)} className="hover:text-dessa-teal/60 transition-colors ml-0.5"><X size={11} /></button>
              </span>
            )}
          </div>
          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
            <input
              type="text"
              placeholder="Search teachers…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-8 pr-7 py-1.5 text-sm border border-brand-border rounded-lg bg-white w-48 text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-subtext hover:text-brand-text">
                <X size={12} />
              </button>
            )}
          </div>
          <SchoolSelect value={school} onChange={setSchool} />

          {/* Filter button + panel */}
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
              <div className="absolute right-0 top-full mt-1.5 w-[400px] bg-white border border-brand-border rounded-xl shadow-lg z-30 p-4">
                {/* Quick filters */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-brand-text mb-3">Quick filters</div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'completed-today',     label: 'Completed today',     Icon: CheckCircle2 },
                      { key: 'not-completed-today', label: 'Not completed today', Icon: XCircle      },
                    ].map(({ key, label, Icon }) => (
                      <button
                        key={key}
                        onClick={() => setQuickFilter(q => q === key ? null : key)}
                        className={`flex items-center gap-1.5 text-[14px] px-3 py-1.5 rounded-full border transition-colors ${
                          quickFilter === key
                            ? 'bg-dessa-teal/10 border-dessa-teal text-dessa-teal font-medium'
                            : 'bg-white border-brand-border text-brand-subtext hover:border-brand-text hover:text-brand-text'
                        }`}
                      >
                        <Icon size={14} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-brand-border mb-4" />

                {/* Date range */}
                <div className="mb-4">
                  <div className="text-[10px] font-bold tracking-widest uppercase text-brand-text mb-3">Date Range</div>
                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-brand-subtext block mb-1">From</label>
                      <DatePicker
                        value={dateStart}
                        onChange={setDateStart}
                        placeholder="Start date"
                        max={dateEnd || REPORT_TODAY}
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-brand-subtext block mb-1">To</label>
                      <DatePicker
                        value={dateEnd}
                        onChange={setDateEnd}
                        placeholder="End date"
                        min={dateStart || undefined}
                        max={REPORT_TODAY}
                      />
                    </div>
                  </div>
                </div>

                <div className="h-px bg-brand-border mb-4" />

                {/* Engagement range */}
                <div className="mb-3">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-[10px] font-bold tracking-widest uppercase text-brand-text">4-Week Engagement</div>
                    <span className="text-xs font-semibold text-dessa-teal">
                      {engagementRange[0]}% – {engagementRange[1]}%
                    </span>
                  </div>
                  <Slider
                    min={0}
                    max={100}
                    step={5}
                    value={engagementRange}
                    onValueChange={setEngagementRange}
                    className="my-2"
                  />
                  <div className="flex justify-between text-[11px] text-brand-subtext mt-2">
                    <span>0%</span>
                    <span>100%</span>
                  </div>
                </div>

                {activeFilters > 0 && (
                  <button
                    onClick={() => { setQuickFilter(null); setDateStart(''); setDateEnd(''); setEngagementRange([0, 100]) }}
                    className="w-full text-xs text-brand-subtext hover:text-brand-text pt-2 border-t border-brand-border mt-1 transition-colors"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <ConceptA
          teachers={pagedTeachers}
          expandedId={expandedId}
          onExpand={id => setExpandedId(prev => prev === id ? null : id)}
          sortBy={sortBy} setSortBy={setSortBy}
          sortDir={sortDir} setSortDir={setSortDir}
        />

        {/* Table footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border bg-brand-bg/40">
          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-subtext">
              {sorted.length === 0 ? '0 teachers' : `${rangeStart}–${rangeEnd} of ${sorted.length} teacher${sorted.length !== 1 ? 's' : ''}`}
            </span>
            <select
              value={pageSize}
              onChange={e => setPageSize(Number(e.target.value))}
              className="text-xs border border-brand-border rounded-md bg-white px-2 py-1 text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            >
              {[10, 25, 50, 100].map(n => <option key={n} value={n}>{n} per page</option>)}
            </select>
          </div>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={p === page} onClick={() => setPage(p)}>{p}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>

      {/* ── Concept B (commented out) ─────────────────────────────────────
      <div className="mb-16">
        <ConceptHeader
          label="Concept B"
          title="Engagement Heatmap"
          description="All teachers × all school days in one grid. Fill patterns distinguish engagement depth without relying on color alone. Best for spotting patterns and outliers at a glance. Hover any cell for details."
        />
        <div className="bg-white rounded-xl border border-brand-border shadow-sm p-6 overflow-hidden">
          <ConceptB teachers={sorted} />
        </div>
      </div>
      ── end Concept B ───────────────────────────────────────────────────── */}

      {/* ── Concept C (commented out) ─────────────────────────────────────
      <div className="mb-16">
        <ConceptHeader
          label="Concept C"
          title="Program Dashboard"
          description="Aggregate view first — stat cards, a weekly distribution chart showing engagement quality over time, and a school-level breakdown — followed by a compact ranked teacher list."
        />
        <ConceptC teachers={sorted} />
      </div>
      ── end Concept C ───────────────────────────────────────────────────── */}

    </div>
  )
}
