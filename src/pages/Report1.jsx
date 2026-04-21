import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search, ChevronLeft, ChevronRight, MoreHorizontal, Download, Printer,
  ArrowUpDown, ArrowUp, ArrowDown, X,
} from 'lucide-react'
import { TEACHERS, SCHOOL_DAYS, SCHOOLS, REPORT_TODAY, YTD_DAYS } from '../lib/reportData'

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
  switch (level) {
    case 'd': return { backgroundColor: '#2A7F8F' }
    case 'a': return {
      background: 'repeating-linear-gradient(45deg,#2A7F8F 0px,#2A7F8F 2px,#E8F4F6 2px,#E8F4F6 8px)',
    }
    case 'b': return {
      backgroundImage: 'radial-gradient(circle,#2A7F8F 1.5px,transparent 1.5px)',
      backgroundSize: '6px 6px',
      backgroundColor: '#E8F4F6',
    }
    default: return { backgroundColor: '#F5F7F9', border: '1px solid #E2E6EA' }
  }
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
      rows.push([t.lastName, t.firstName, t.school, d.date, d.durationSecs, LEVEL_CONFIG[d.level].short])
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
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-brand-subtext">
      {[
        { level: 'd', label: 'Deep engagement (5+ min)' },
        { level: 'a', label: 'Active engagement (1–5 min)' },
        { level: 'b', label: 'Brief visit (< 1 min)' },
        { level: 'n', label: 'No access' },
      ].map(({ level, label }) => (
        <span key={level} className="flex items-center gap-1.5">
          <LevelSwatch level={level} />
          {label}
        </span>
      ))}
    </div>
  )
}

function LastActiveBadge({ badge }) {
  return <span className="text-sm text-brand-text">{badge.label}</span>
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
  return (
    <div>
      <div className="text-sm font-semibold text-brand-text">{pct}%</div>
      <div className="mt-1.5 h-1.5 w-16 rounded-full bg-brand-border overflow-hidden">
        <div className="h-full rounded-full bg-dessa-teal transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
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
      <div className="grid grid-cols-7 gap-0.5">
        {['Su','Mo','Tu','We','Th','Fr','Sa'].map(d => (
          <div key={d} className="text-[10px] text-brand-subtext/60 text-center py-0.5">{d}</div>
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
              className={`w-7 h-7 flex items-center justify-center text-[11px] rounded mx-auto ${
                isWknd ? 'text-brand-subtext/25' :
                level === 'd' ? 'text-white font-semibold' :
                level ? 'text-dessa-teal font-semibold' :
                'text-brand-subtext/40'
              }`}
              style={level ? getCellStyle(level) : {}}
              aria-label={`${dateStr}: ${level ? LEVEL_CONFIG[level].label : isWknd ? 'Weekend' : 'No lesson visit'}`}
              title={level ? `${dateStr} · ${LEVEL_CONFIG[level].label}` : dateStr}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function TeacherCalendar({ teacher, goalFreq }) {
  const [startYear,  setStartYear]  = useState(2026)
  const [startMonth, setStartMonth] = useState(2) // 0-indexed; default: March 2026

  const secondMonth = startMonth === 11 ? 0  : startMonth + 1
  const secondYear  = startMonth === 11 ? startYear + 1 : startYear

  const atMin = startYear === 2025 && startMonth === 8  // Sep 2025
  const atMax = startYear === 2026 && startMonth === 2  // Mar 2026 (Apr as second)

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
    const m1 = new Date(startYear, startMonth, 1).toLocaleDateString('en-US', { month: 'short' })
    const m2 = new Date(secondYear, secondMonth, 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    return `${m1} – ${m2}`
  })()

  const dayMap     = Object.fromEntries(teacher.days.map(d => [d.date, d.level]))
  const activeDays = teacher.days.filter(d => d.level !== 'n').length
  const weeksHit   = [1,2,3,4].filter(w =>
    teacher.days.filter(d => d.week === w && d.level !== 'n').length >= goalFreq
  ).length
  const badge = teacher.lastActiveBadge

  return (
    <div className="bg-brand-bg/50 rounded-xl p-5 border border-brand-border/50 mt-1">
      <div className="flex gap-8 items-start flex-wrap">
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
          </div>
        </div>

        <div className="flex-1 min-w-[180px] pl-6 border-l border-brand-border">
          <div className="text-[10px] font-bold tracking-widest uppercase text-brand-subtext mb-4">Summary</div>
          <div className="grid grid-cols-2 gap-y-5 gap-x-4">
            <div>
              <div className="text-2xl font-bold text-brand-text">{Math.round(activeDays / 20 * 100)}%</div>
              <div className="text-xs text-brand-subtext">Engagement rate</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-text">{activeDays}</div>
              <div className="text-xs text-brand-subtext">Days with lesson access</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-brand-text">
                {weeksHit}<span className="text-sm font-normal text-brand-subtext ml-1">/ 4</span>
              </div>
              <div className="text-xs text-brand-subtext">Weeks hitting goal</div>
            </div>
            <div>
              <div className="mb-1.5"><LastActiveBadge badge={badge} /></div>
              <div className="text-xs text-brand-subtext">Last active</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ConceptA({ teachers, goalFreq, expandedId, onExpand, sortBy, setSortBy, sortDir, setSortDir }) {
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
        style={{ gridTemplateColumns: '40px 1fr 90px 130px 110px 24px' }}
      >
        <div className="text-xs font-semibold text-brand-subtext text-center">#</div>
        <SortBtn col="name"       label="Teacher"          sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <SortBtn col="recent"     label="Last 4 Wks"       sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <SortBtn col="engagement" label="Engagement (YTD)" sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
        <SortBtn col="lastActive" label="Last Active"      sortBy={sortBy} sortDir={sortDir} onSort={handleSort} />
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
                style={{ gridTemplateColumns: '40px 1fr 90px 130px 110px 24px' }}
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
                  <div className="mt-1.5 h-1.5 w-20 rounded-full bg-brand-border overflow-hidden">
                    <div className="h-full rounded-full bg-dessa-teal transition-all" style={{ width: `${t.ytdPct}%` }} />
                  </div>
                </div>

                <div className="self-center">
                  <LastActiveBadge badge={t.lastActiveBadge} />
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
                      <TeacherCalendar teacher={t} goalFreq={goalFreq} />
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
                        const d     = dayLookup[day.date]
                        const level = d?.level ?? 'n'
                        const tip   = `${t.lastName}, ${t.firstName} · ${day.date} · ${LEVEL_CONFIG[level].label}${d?.durationSecs ? ` · ${formatDuration(d.durationSecs)}` : ''}`
                        return (
                          <div
                            key={day.date}
                            className="w-7 h-7 rounded-sm cursor-default"
                            style={getCellStyle(level)}
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

function ConceptC({ teachers, goalFreq }) {
  if (!teachers.length) return <EmptyState />

  const activeThisWeek = teachers.filter(t => t.days.some(d => d.week === 4 && d.level !== 'n'))
  const hittingGoal    = teachers.filter(t => t.days.filter(d => d.week === 4 && d.level !== 'n').length >= goalFreq)
  const avgPct         = Math.round(teachers.reduce((s, t) => s + t.engagementPct, 0) / teachers.length)

  const schoolStats = SCHOOLS
    .map(school => {
      const ts = teachers.filter(t => t.school === school)
      if (!ts.length) return null
      const avg  = Math.round(ts.reduce((s, t) => s + t.engagementPct, 0) / ts.length)
      const goal = ts.filter(t => t.days.filter(d => d.week === 4 && d.level !== 'n').length >= goalFreq).length
      return { school, count: ts.length, avg, goal }
    })
    .filter(Boolean)

  const stats = [
    { value: `${activeThisWeek.length}`, sub: `of ${teachers.length} teachers`, label: 'Active this week',          pct: Math.round(activeThisWeek.length / teachers.length * 100) },
    { value: `${avgPct}%`,               sub: 'avg over 4 weeks',              label: '4-week engagement rate',     pct: avgPct },
    { value: `${hittingGoal.length}`,    sub: `of ${teachers.length} teachers`, label: `Hitting ${goalFreq}-day/week goal`, pct: Math.round(hittingGoal.length / teachers.length * 100) },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4">
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
                  <span>{goal}/{count} hitting goal</span>
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Report1() {
  const [search,     setSearch]     = useState('')
  const [school,     setSchool]     = useState('All')
  const [goalFreq,   setGoalFreq]   = useState(3)
  const [expandedId, setExpandedId] = useState(null)
  const [sortBy,     setSortBy]     = useState('engagement')
  const [sortDir,    setSortDir]    = useState('desc')
  const [showMenu,   setShowMenu]   = useState(false)

  const enriched = useMemo(() =>
    TEACHERS.map(t => ({
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
        return t.firstName.toLowerCase().includes(q) || t.lastName.toLowerCase().includes(q)
      }
      return true
    })
  , [enriched, school, search])

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

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">

      {/* Page header */}
      <div className="flex items-start justify-between mb-6">
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

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        {/* Search */}
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
          <input
            type="text"
            placeholder="Search teachers…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-8 pr-7 py-1.5 text-sm border border-brand-border rounded-lg bg-white w-52 text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-subtext hover:text-brand-text">
              <X size={12} />
            </button>
          )}
        </div>

        {/* School */}
        <select
          value={school}
          onChange={e => setSchool(e.target.value)}
          className="text-sm border border-brand-border rounded-lg bg-white px-3 py-1.5 text-brand-text focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
        >
          <option value="All">All schools</option>
          {SCHOOLS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        {/* Goal frequency */}
        <div className="flex items-center gap-2 ml-1">
          <span className="text-xs text-brand-subtext">Goal:</span>
          <div className="flex rounded-lg overflow-hidden border border-brand-border bg-white">
            {[1, 2, 3, 4].map(n => (
              <button
                key={n}
                onClick={() => setGoalFreq(n)}
                className={`px-3 py-1.5 text-xs font-semibold transition-colors border-r border-brand-border last:border-r-0 ${
                  goalFreq === n ? 'bg-dessa-teal text-white' : 'text-brand-subtext hover:bg-brand-bg hover:text-brand-text'
                }`}
              >
                {n}×
              </button>
            ))}
          </div>
          <span className="text-xs text-brand-subtext">/week</span>
        </div>

        <div className="ml-auto text-xs text-brand-subtext">
          {filtered.length} teacher{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Legend */}
      <div className="mb-10 pb-6 border-b border-brand-border">
        <LevelLegend />
      </div>

      {/* ── Concept A ─────────────────────────────────────────────────────── */}
      <div className="mb-16">
        <ConceptHeader
          label="Concept A"
          title="Ranked List with Calendar Detail"
          description="Sortable table ranked by engagement rate. Click any row to expand a month-at-a-glance calendar with per-day pattern encoding and summary stats. Only one panel open at a time."
        />
        <div className="bg-white rounded-xl border border-brand-border shadow-sm overflow-hidden">
          <ConceptA
            teachers={sorted}
            goalFreq={goalFreq}
            expandedId={expandedId}
            onExpand={id => setExpandedId(prev => prev === id ? null : id)}
            sortBy={sortBy} setSortBy={setSortBy}
            sortDir={sortDir} setSortDir={setSortDir}
          />
        </div>
      </div>

      {/* ── Concept B ─────────────────────────────────────────────────────── */}
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

      {/* ── Concept C ─────────────────────────────────────────────────────── */}
      <div className="mb-16">
        <ConceptHeader
          label="Concept C"
          title="Program Dashboard"
          description="Aggregate view first — stat cards, a weekly distribution chart showing engagement quality over time, and a school-level breakdown — followed by a compact ranked teacher list."
        />
        <ConceptC teachers={sorted} goalFreq={goalFreq} />
      </div>

    </div>
  )
}
