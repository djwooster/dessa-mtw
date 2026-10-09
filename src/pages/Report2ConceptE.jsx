// Concept E — Trend-first (2026-09-24) — inspired by a stock-chart layout:
// a row of range-preset tabs above a full-width line chart, then a full-
// width detail table below. Same strict per-site "every educator met the
// weekly goal" metric as Concepts C/D, just as a continuous line across a
// user-chosen range instead of a short bar strip. The underlying data is
// weekly, not daily, so the day-based presets (30/60/90) are converted to
// the nearest whole week count — "30 days" renders as ~4 weekly points,
// not 30 daily ones.
import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO, addDays } from 'date-fns'
import { X, MoreHorizontal, Download, Printer, ChevronRight, Calendar, Search, ArrowUp, ArrowDown, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'
import { schools, schoolWeeks, getWeekData, MOST_RECENT_WEEK } from '../lib/report2Data'
import EducatorCalendar from '../components/engagement/EducatorCalendar'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { RangePicker } from '../components/ui/range-picker'
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from '../components/ui/breadcrumb'
import { useRole } from '../lib/roleContext'

export const GOAL = 3 // weekly login/completion goal, ×/week — matches report2Data.js's district default

export const RANGE_PRESETS = [
  { value: '30d', label: '30 days', weeks: Math.round(30 / 7) },
  { value: '60d', label: '60 days', weeks: Math.round(60 / 7) },
  { value: '90d', label: '90 days', weeks: Math.round(90 / 7) },
  { value: 'all', label: '2025-2026 School Year', weeks: schoolWeeks.length },
]

// Per-site detail overlay (2026-09-24) — started as two interchangeable
// shells (a right-anchored slide-over vs. a centered dialog) behind a
// header switcher. The switcher was removed 2026-10-01 and the centered
// modal won; SitePanel below is kept but unused, in case the slide-over
// comes back. Both wrap the same SiteDetailContent.

// Each point is one real calendar week's data — labeled with a single real
// date (the week's start), not a range, so a point on the line never
// implies it spans more than one moment. Used for both the axis and the
// hover tooltip (2026-09-24 — a range read as if the point covered that
// whole span, which misrepresented a single weekly value).
// Full date range covered by a list of weeks, for the card header (2026-10-01):
// people screenshot this chart, so the dates have to be readable without the
// axis. A week runs Monday to Friday here, so the end is the last week's
// Monday plus four days. The year is always shown.
export function rangeLabel(weeksList) {
  const start = parseISO(weeksList[0])
  const end = parseISO(weeksList[weeksList.length - 1])
  end.setDate(end.getDate() + 4)
  const sameYear = start.getFullYear() === end.getFullYear()
  return `${format(start, sameYear ? 'MMM d' : 'MMM d, yyyy')} to ${format(end, 'MMM d, yyyy')}`
}

// Range helpers (2026-10-02). The data is weekly, so a custom date range
// snaps to every Monday to Friday week it touches, and "previous period" is
// the equal number of weeks right before the selected ones.
export const FIRST_DATE = parseISO(schoolWeeks[0])
export const LAST_DATE = addDays(parseISO(schoolWeeks[schoolWeeks.length - 1]), 4)

export function weeksForDates(from, to) {
  return schoolWeeks.filter(w => {
    const start = parseISO(w)
    return addDays(start, 4) >= from && start <= to
  })
}

export function previousWeeks(weeks) {
  const first = schoolWeeks.indexOf(weeks[0])
  return first - weeks.length < 0 ? [] : schoolWeeks.slice(first - weeks.length, first)
}

// Last Active labels as minutes, so the column can sort by recency.
export function agoRank(label) {
  if (label === 'Never') return Infinity
  if (label === 'Yesterday') return 1440
  const m = /^(\d+)(m|h|d|w) ago$/.exec(label)
  return Number(m[1]) * { m: 1, h: 60, d: 1440, w: 10080 }[m[2]]
}

export function SortButton({ label, col, sort, onSort, align = 'left' }) {
  const active = sort.key === col
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={`inline-flex items-center gap-1 font-medium text-brand-text hover:text-dessa-teal transition-colors ${align === 'right' ? 'flex-row-reverse' : ''}`}
    >
      {label}
      {active && (sort.dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
    </button>
  )
}

export function nextSort(sort, key, firstDir = 'asc') {
  return sort.key === key ? { key, dir: sort.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: firstDir }
}

export function SearchField({ value, onChange, placeholder, bg = 'bg-white', height = 'h-9' }) {
  return (
    <div className="relative max-w-xs">
      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className={`w-full ${height} pl-9 pr-8 text-sm rounded-md border border-brand-border ${bg} text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal`}
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext hover:text-brand-text">
          <X size={13} />
        </button>
      )}
    </div>
  )
}

// Change pill (2026-10-02): green for an increase, gray for everything else
// (a decrease, no change). The arrow always carries direction too, so color
// is never the only signal. Shows the size of the change without a sign.
export function ChangeCell({ change }) {
  if (change == null) return <span className="text-brand-subtext" title="No earlier period to compare with">-</span>
  const Icon = change > 0 ? ArrowUpRight : change < 0 ? ArrowDownRight : Minus
  const direction = change > 0 ? 'up' : change < 0 ? 'down' : 'no change'
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
        change > 0 ? 'bg-org-green-100/85 text-org-green-800' : 'bg-brand-bg text-brand-text'
      }`}
      aria-label={`${direction} ${Math.abs(change)}%`}
    >
      <Icon size={12} aria-hidden="true" />
      {Math.abs(change)}%
    </span>
  )
}

// Date range shown top right of each chart (2026-10-01). People screenshot
// these charts, so the dates need to be easy to find, but quieter than the
// title: 13px, subtext gray, calendar icon first.
export function DateRange({ weeks, className = '' }) {
  return (
    <p className={`flex items-center gap-1.5 text-[13px] text-brand-subtext ${className}`}>
      <Calendar size={13} aria-hidden="true" />
      {rangeLabel(weeks)}
    </p>
  )
}

// Short Monday to Friday range for a week start, e.g. "Apr 27 to May 1".
export function weekRangeLabelShort(weekStart) {
  const start = parseISO(weekStart)
  const end = addDays(start, 4)
  return start.getMonth() === end.getMonth() ? `${format(start, 'MMM d')} to ${format(end, 'd')}` : `${format(start, 'MMM d')} to ${format(end, 'MMM d')}`
}

export function weekLabel(weekStart) {
  return format(parseISO(weekStart), 'MMM d')
}

// Same purpose as Concept D's version — one label per week, only shown on
// the first week of a new calendar month, so a long "All time" range
// doesn't try to cram 36 date labels under the chart.
export function monthTransitionLabels(weeksList) {
  let lastMonth = null
  return weeksList.map(w => {
    const m = format(parseISO(w), 'MMM')
    const show = m !== lastMonth
    lastMonth = m
    return show ? m : ''
  })
}

export const Y_TICKS = [0, 25, 50, 75, 100]

// Roster order is stable across weeks (report2Data.js caches each site's
// roster once), so a teacher's index can be used to look them up week to
// week without re-matching by name.
export function getRosterNames(schoolId) {
  return getWeekData(schoolId, MOST_RECENT_WEEK, GOAL).teachers.map(t => t.name)
}

// Searches the site's full history (not just whatever range is selected in
// the overlay) for the most recent week this educator had any active days
// at all — "last active" should stay honest even if you're looking at a
// short recent window. Mirrors Report1C.jsx's Today/Nd badge convention,
// scaled to this data's weekly grain (no daily records to be more precise
// than that).
// The data only knows "active this week", so the finer-grained label inside
// that week is a deterministic stand-in (2026-10-01) — varied per educator
// so the column reads like real recency instead of one repeated value.
const RECENT_LABELS = ['12m ago', '30m ago', '45m ago', '1h ago', '2h ago', '3h ago', '4h ago', '6h ago', 'Yesterday', '2d ago', '3d ago', '4d ago', '5d ago', '8d ago', '10d ago', '12d ago']
function recentLabel(schoolId, teacherIndex) {
  const h = Math.abs(Math.sin(schoolId * 12.9898 + teacherIndex * 78.233) * 43758.5453) % 1
  return RECENT_LABELS[Math.floor(h * RECENT_LABELS.length)]
}

export function getLastActive(schoolId, teacherIndex) {
  for (let i = schoolWeeks.length - 1; i >= 0; i--) {
    const data = getWeekData(schoolId, schoolWeeks[i], GOAL)
    if (data.teachers[teacherIndex].daysActive > 0) {
      const weeksAgo = schoolWeeks.length - 1 - i
      return weeksAgo === 0 ? recentLabel(schoolId, teacherIndex) : `${weeksAgo}w ago`
    }
  }
  return 'Never'
}

// `metric` (2026-10-08): 'sites' (default) plots the % of sites where every
// educator met the goal; 'educators' plots the % of all educators who met it,
// with the tooltip to match.
export function SiteGoalLineChart({ weeks, metric = 'sites' }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const byEducators = metric === 'educators'

  const trend = useMemo(() => weeks.map(w => {
    if (byEducators) {
      let met = 0, total = 0
      schools.forEach(s => {
        const data = getWeekData(s.id, w, GOAL)
        met += data.meetingGoal
        total += data.totalTeachers
      })
      return { weekStart: w, count: met, total, pct: Math.round((met / total) * 100) }
    }
    const count = schools.filter(s => {
      const data = getWeekData(s.id, w, GOAL)
      return data.meetingGoal === data.totalTeachers
    }).length
    return { weekStart: w, count, total: schools.length, pct: Math.round((count / schools.length) * 100) }
  }), [weeks, byEducators])

  const width = 960
  const height = 280
  const padding = { top: 20, right: 46, bottom: 28, left: 40 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const pts = trend.map((d, i) => ({
    x: padding.left + (trend.length === 1 ? innerW / 2 : (i / (trend.length - 1)) * innerW),
    y: padding.top + innerH - (d.pct / 100) * innerH,
    ...d,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const baselineY = padding.top + innerH
  const areaPathD = pts.length > 1
    ? `${pathD} L${pts[pts.length - 1].x},${baselineY} L${pts[0].x},${baselineY} Z`
    : ''

  // Past ~13 points, per-week date labels would overlap — switch to one
  // label per calendar-month transition instead.
  const useMonthLabels = trend.length > 13
  const monthLabels = useMonthLabels ? monthTransitionLabels(weeks) : null

  const hovered = hoverIdx != null ? pts[hoverIdx] : null
  const last = pts[pts.length - 1]
  const slotW = innerW / trend.length

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label={byEducators ? '% of educators meeting goal, by week' : '% of sites meeting goal, by week'}>
        {Y_TICKS.map(v => {
          const y = padding.top + innerH - (v / 100) * innerH
          return (
            <g key={v}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#E2E6EA" strokeWidth={1} />
              <text x={padding.left - 8} y={y + 3} textAnchor="end" fontSize={11} fill="#6B7A8D">{v}%</text>
            </g>
          )
        })}

        {hovered && (
          <line x1={hovered.x} y1={padding.top} x2={hovered.x} y2={padding.top + innerH} stroke="#B0B9C6" strokeWidth={1} strokeDasharray="3,3" />
        )}

        {pts.length > 1 && <path d={areaPathD} fill="#2A7F8F" fillOpacity={0.08} stroke="none" />}
        {pts.length > 1 && <path d={pathD} fill="none" stroke="#2A7F8F" strokeWidth={2} />}

        {pts.map((p, i) => (
          <circle
            key={p.weekStart}
            cx={p.x} cy={p.y}
            r={i === hoverIdx || i === pts.length - 1 ? 4 : 0}
            fill="#2A7F8F"
            stroke="white" strokeWidth={1.5}
          />
        ))}

        {/* Endpoint direct label — the one value worth reading without hovering. */}
        <text x={last.x + 8} y={last.y + 4} fontSize={12} fontWeight={600} fill="#1B2B4B">{last.pct}%</text>

        {/* Invisible per-week hit columns for hover. */}
        {pts.map((p, i) => (
          <rect
            key={`hit-${p.weekStart}`}
            x={padding.left + i * slotW} y={padding.top} width={slotW} height={innerH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        ))}

        {monthLabels
          ? monthLabels.map((label, i) => label && (
              <text key={pts[i].weekStart} x={pts[i].x} y={height - 8} textAnchor="middle" fontSize={10} fill="#6B7A8D">{label}</text>
            ))
          : pts.map(p => (
              <text key={p.weekStart} x={p.x} y={height - 8} textAnchor="middle" fontSize={10} fill="#6B7A8D">{weekLabel(p.weekStart)}</text>
            ))}
      </svg>

      {hovered && (
        <div
          className="absolute px-2.5 py-1.5 rounded-md bg-brand-text text-white text-xs whitespace-nowrap pointer-events-none shadow-lg"
          style={{
            left: `${(hovered.x / width) * 100}%`,
            top: `${(hovered.y / height) * 100}%`,
            transform: 'translate(-50%, -130%)',
          }}
        >
          {hovered.count} of {hovered.total} {byEducators ? 'educators' : 'sites'} · {weekLabel(hovered.weekStart)}
        </div>
      )}
    </div>
  )
}

// Same shape as SiteGoalLineChart, but plots one site's own % of educators
// meeting goal per week (report2Data.js's existing `pct` field) instead of
// the district-wide % of sites — a zoomed-in version of the page's chart,
// sized for a narrower overlay.
export function SiteWeeklyChart({ schoolId, weeks }) {
  const [hoverIdx, setHoverIdx] = useState(null)

  const trend = useMemo(() => weeks.map(w => {
    const data = getWeekData(schoolId, w, GOAL)
    return { weekStart: w, pct: data.pct }
  }), [schoolId, weeks])

  // Fonts and height stay at the size the chart rendered at in the 672px
  // modal (a 1.2x scale of this 520x200 design canvas); a wider modal just
  // adds horizontal room to the plot (2026-10-01). The canvas width tracks
  // the measured container, in design units, so everything scales uniformly.
  const SCALE = 1.2
  const wrapRef = useRef(null)
  const [boxW, setBoxW] = useState(520 * SCALE)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setBoxW(entry.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const width = boxW / SCALE
  const height = 200
  const padding = { top: 16, right: 40, bottom: 24, left: 34 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom

  const pts = trend.map((d, i) => ({
    x: padding.left + (trend.length === 1 ? innerW / 2 : (i / (trend.length - 1)) * innerW),
    y: padding.top + innerH - (d.pct / 100) * innerH,
    ...d,
  }))

  const pathD = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')
  const baselineY = padding.top + innerH
  const areaPathD = pts.length > 1
    ? `${pathD} L${pts[pts.length - 1].x},${baselineY} L${pts[0].x},${baselineY} Z`
    : ''

  const useMonthLabels = trend.length > 13
  const monthLabels = useMonthLabels ? monthTransitionLabels(weeks) : null
  const hovered = hoverIdx != null ? pts[hoverIdx] : null
  const last = pts[pts.length - 1]
  const slotW = innerW / trend.length

  return (
    <div className="relative" ref={wrapRef}>
      <svg viewBox={`0 0 ${width} ${height}`} width={boxW} height={height * SCALE} role="img" aria-label="% of this site's educators meeting goal, by week">
        {Y_TICKS.map(v => {
          const y = padding.top + innerH - (v / 100) * innerH
          return (
            <g key={v}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#E2E6EA" strokeWidth={1} />
              <text x={padding.left - 7} y={y + 3} textAnchor="end" fontSize={10} fill="#6B7A8D">{v}%</text>
            </g>
          )
        })}

        {hovered && (
          <line x1={hovered.x} y1={padding.top} x2={hovered.x} y2={padding.top + innerH} stroke="#B0B9C6" strokeWidth={1} strokeDasharray="3,3" />
        )}

        {pts.length > 1 && <path d={areaPathD} fill="#2A7F8F" fillOpacity={0.08} stroke="none" />}
        {pts.length > 1 && <path d={pathD} fill="none" stroke="#2A7F8F" strokeWidth={2} />}

        {pts.map((p, i) => (
          <circle
            key={p.weekStart}
            cx={p.x} cy={p.y}
            r={i === hoverIdx || i === pts.length - 1 ? 3.5 : 0}
            fill="#2A7F8F"
            stroke="white" strokeWidth={1.5}
          />
        ))}

        <text x={last.x + 7} y={last.y + 4} fontSize={11} fontWeight={600} fill="#1B2B4B">{last.pct}%</text>

        {pts.map((p, i) => (
          <rect
            key={`hit-${p.weekStart}`}
            x={padding.left + i * slotW} y={padding.top} width={slotW} height={innerH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        ))}

        {monthLabels
          ? monthLabels.map((label, i) => label && (
              <text key={pts[i].weekStart} x={pts[i].x} y={height - 6} textAnchor="middle" fontSize={9} fill="#6B7A8D">{label}</text>
            ))
          : pts.map(p => (
              <text key={p.weekStart} x={p.x} y={height - 6} textAnchor="middle" fontSize={9} fill="#6B7A8D">{weekLabel(p.weekStart)}</text>
            ))}
      </svg>

      {hovered && (
        <div
          className="absolute px-2 py-1 rounded-md bg-brand-text text-white text-xs whitespace-nowrap pointer-events-none shadow-lg"
          style={{
            left: `${(hovered.x / width) * 100}%`,
            top: `${(hovered.y / height) * 100}%`,
            transform: 'translate(-50%, -130%)',
          }}
        >
          {hovered.pct}% · {weekLabel(hovered.weekStart)}
        </div>
      )}
    </div>
  )
}

// Per-educator activity grid (2026-10-01), modeled on a GitHub-style
// contribution grid: weeks run left to right, Monday to Friday stack top to
// bottom, one dot per school day. The columns spread evenly across the full
// row at every range (fixed-size dots, wider gaps on short ranges). The data only records HOW MANY days an
// educator was active in a week (daysActive, 0-5), not which ones, so the
// active days are placed on weekdays with a stable per-educator-per-week
// shuffle. Totals are exact; the specific weekdays are a mock-data stand-in.
export const WEEKDAYS = [0, 1, 2, 3, 4]

export function activeDayOrder(schoolId, teacherIndex, weekIdx) {
  return WEEKDAYS
    .map(d => ({ d, h: Math.abs(Math.sin((schoolId * 131 + teacherIndex * 17 + weekIdx * 7 + d) * 12.9898) * 43758.5453) % 1 }))
    .sort((a, b) => a.h - b.h)
    .map(x => x.d)
}

// Every active day this educator has across the whole school year, for the calendar
// drill-down. Built from the weekly counts, so which weekdays are on is the same
// mock stand-in as the dot grid; the totals are exact.
export function educatorDayMap(schoolId, teacherIndex) {
  const map = {}
  schoolWeeks.forEach((w, weekIdx) => {
    const k = getWeekData(schoolId, w, GOAL).teachers[teacherIndex].daysActive
    activeDayOrder(schoolId, teacherIndex, weekIdx).slice(0, k).forEach(d => { map[format(addDays(parseISO(w), d), 'yyyy-MM-dd')] = true })
  })
  return map
}

export function EducatorActivityGrid({ schoolId, teacherIndex, weeks }) {
  const months = monthTransitionLabels(weeks)
  const columns = weeks.map((w, wi) => {
    const weekIdx = schoolWeeks.indexOf(w)
    const k = getWeekData(schoolId, w, GOAL).teachers[teacherIndex].daysActive
    const active = new Set(activeDayOrder(schoolId, teacherIndex, weekIdx).slice(0, k))
    const monday = parseISO(w)
    return {
      w,
      label: months[wi],
      days: WEEKDAYS.map(d => {
        const date = new Date(monday)
        date.setDate(monday.getDate() + d)
        return { d, on: active.has(d), title: `${format(date, 'EEE, MMM d')}: ${active.has(d) ? 'active' : 'no activity'}` }
      }),
    }
  })
  const activeCount = columns.reduce((n, c) => n + c.days.filter(x => x.on).length, 0)
  const total = columns.length * WEEKDAYS.length

  return (
    <div className="overflow-x-auto pr-2">
      <div
        role="img"
        aria-label={`Active on ${activeCount} of ${total} school days`}
        className="grid"
        style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(14px, 1fr))` }}
      >
        {columns.map(c => (
          <div key={c.w} className="relative flex flex-col items-center gap-1 pt-5">
            {c.label && <span className="absolute top-0 left-1/2 -translate-x-1/2 text-xs text-brand-subtext whitespace-nowrap">{c.label}</span>}
            {c.days.map(day => (
              <span
                key={day.d}
                title={day.title}
                className={`block w-2.5 h-2.5 rounded-full ${day.on ? 'bg-dessa-teal' : 'bg-brand-border'}`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

// Educator list shared by the site modal and the Leader view: expandable
// rows (one open at a time) with the activity grid, sortable columns, and an
// optional search field in a toolbar above the header row.
// `drilldown` false (2026-10-07) turns rows into plain name and Last Active lines,
// with no expandable activity grid.
// `goalColumn` (2026-10-08) adds a Weekly goal column with a Goal met / Not yet
// pill. A pill is a one-week fact, so it always describes the last week in the
// range (named in the header's hover text). Weekly goal and Last Active share
// one right-aligned column, 44px apart.
// `drilldownView` 'calendar' (2026-10-09) swaps the dot grid for the six-month calendar.
export function EducatorTable({ school, weeks, searchable = false, drilldown = true, goalColumn = false, drilldownView = 'grid' }) {
  const statusWeek = weeks[weeks.length - 1]
  const rosterNames = useMemo(() => getRosterNames(school.id), [school.id])
  const [openIdx, setOpenIdx] = useState(null)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })

  const goalData = useMemo(() => getWeekData(school.id, statusWeek, GOAL).teachers, [school.id, statusWeek])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return rosterNames
      .map((name, i) => ({ name, i, last: getLastActive(school.id, i), met: goalData[i].metGoal }))
      .filter(r => !q || r.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1
        if (sort.key === 'goal') return dir * (Number(a.met) - Number(b.met)) || a.name.localeCompare(b.name)
        if (sort.key === 'last') return dir * (agoRank(a.last) - agoRank(b.last) || 0) || a.name.localeCompare(b.name)
        return dir * a.name.localeCompare(b.name)
      })
  }, [rosterNames, school.id, query, sort, goalData])

  return (
    <div>
      {searchable && (
        <div className="px-4 py-3 border-b border-brand-border">
          <SearchField value={query} onChange={setQuery} placeholder="Search educators" />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[13px] font-medium"><SortButton label="Educator" col="name" sort={sort} onSort={k => setSort(s => nextSort(s, k))} /></TableHead>
            {goalColumn ? (
              <TableHead className="text-[13px] font-medium">
                <span className="flex items-center justify-end gap-11">
                  <span className="w-24 flex justify-end" title={`Latest week in range: ${weekRangeLabelShort(statusWeek)}`}>
                    <SortButton label="Weekly goal" col="goal" sort={sort} onSort={k => setSort(s => nextSort(s, k, 'desc'))} align="right" />
                  </span>
                  <span className="w-20 flex justify-end"><SortButton label="Last Active" col="last" sort={sort} onSort={k => setSort(s => nextSort(s, k))} align="right" /></span>
                </span>
              </TableHead>
            ) : (
              <TableHead className="text-[13px] font-medium text-right"><SortButton label="Last Active" col="last" sort={sort} onSort={k => setSort(s => nextSort(s, k))} align="right" /></TableHead>
            )}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map(r => {
            const open = openIdx === r.i
            return (
              <Fragment key={r.name}>
                <TableRow onClick={drilldown ? () => setOpenIdx(open ? null : r.i) : undefined} className={drilldown ? 'cursor-pointer' : 'hover:bg-transparent'}>
                  <TableCell className="font-medium">
                    {drilldown ? (
                      <button type="button" aria-expanded={open} className="flex items-center gap-2 text-left">
                        <ChevronRight size={14} className={`shrink-0 text-brand-subtext transition-transform ${open ? 'rotate-90' : ''}`} />
                        {r.name}
                      </button>
                    ) : r.name}
                  </TableCell>
                  {goalColumn ? (
                    <TableCell>
                      <span className="flex items-center justify-end gap-11">
                        <span className="w-24 flex justify-end">
                          <span className={`inline-flex items-center rounded-[5px] px-2 py-0.5 text-xs font-medium ${r.met ? 'bg-org-green-100/85 text-org-green-800' : 'bg-brand-bg text-brand-text'}`}>
                            {r.met ? 'Goal met' : 'Not yet'}
                          </span>
                        </span>
                        <span className="w-20 text-right text-brand-subtext">{r.last}</span>
                      </span>
                    </TableCell>
                  ) : (
                    <TableCell className="text-brand-subtext text-right">{r.last}</TableCell>
                  )}
                </TableRow>
                {drilldown && open && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={2} className="pl-10 py-3 bg-brand-bg/50">
                      {drilldownView === 'calendar'
                        ? <EducatorCalendar dayMap={educatorDayMap(school.id, r.i)} />
                        : <EducatorActivityGrid schoolId={school.id} teacherIndex={r.i} weeks={weeks} />}
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={2} className="text-center text-brand-subtext py-8">No educators match your search.</TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}

// Shared content for both overlay shells. The range comes from the page's
// date range button (2026-10-02), so the modal has no tabs of its own.
function SiteDetailContent({ school, weeks, onClose, drilldown = true, title, goalColumn = false, bordered = false, drilldownView = 'grid' }) {
  const current = useMemo(() => getWeekData(school.id, weeks[weeks.length - 1], GOAL), [school.id, weeks])

  const weeksMet = useMemo(() => weeks.filter(w => {
    const data = getWeekData(school.id, w, GOAL)
    return data.meetingGoal === data.totalTeachers
  }).length, [school.id, weeks])

  const avgDaysActive = useMemo(() => {
    let totalDays = 0
    weeks.forEach(w => {
      const data = getWeekData(school.id, w, GOAL)
      data.teachers.forEach(t => { totalDays += t.daysActive })
    })
    const denom = weeks.length * current.totalTeachers
    return denom ? (totalDays / denom).toFixed(1) : '0.0'
  }, [school.id, weeks, current.totalTeachers])

  const cards = [
    { label: 'Users meeting goal', value: `${current.meetingGoal} of ${current.totalTeachers}` },
    { label: 'Consistency', value: `${weeksMet} of ${weeks.length} weeks` },
    { label: 'Avg days active', value: avgDaysActive },
  ]

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white text-sm font-semibold shrink-0"
            style={{ backgroundColor: school.color }}
          >
            {school.initials}
          </div>
          <h3 className="text-lg font-semibold text-brand-text">{school.name}</h3>
        </div>
        <div className="flex items-center gap-4">
          <DateRange weeks={weeks} />
          <button onClick={onClose} aria-label="Close" className="text-brand-subtext hover:text-brand-text p-1 rounded-lg hover:bg-brand-bg transition-colors shrink-0">
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Stat cards (commented out 2026-10-01, may come back). The `cards`
          array above and the values behind it are kept so restoring is just
          uncommenting this block.
      <div className="grid grid-cols-3 gap-3 mb-5">
        {cards.map(c => (
          <div key={c.label} className="bg-brand-bg rounded-lg px-3 py-2.5">
            <p className="text-xs text-brand-subtext mb-1">{c.label}</p>
            <p className="text-lg font-bold text-brand-text">{c.value}</p>
          </div>
        ))}
      </div>
      */}

      <div className={bordered ? 'mb-5 rounded-xl border border-brand-border bg-white p-5' : 'mb-5'}>
        {title && <p className="text-base font-semibold text-brand-text mb-3">{title}</p>}
        <SiteWeeklyChart schoolId={school.id} weeks={weeks} />
      </div>

      <div className={bordered ? 'rounded-xl border border-brand-border bg-white overflow-hidden' : ''}>
        <EducatorTable school={school} weeks={weeks} drilldown={drilldown} goalColumn={goalColumn} drilldownView={drilldownView} />
      </div>
    </div>
  )
}

function SitePanel({ school, weeks, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-brand-text/30 backdrop-blur-sm" onClick={onClose}
      />
      <motion.div
        initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 40, opacity: 0 }} transition={{ duration: 0.2 }}
        className="relative w-full max-w-md h-full bg-white shadow-lg overflow-y-auto p-6"
      >
        <SiteDetailContent school={school} weeks={weeks} onClose={onClose} />
      </motion.div>
    </div>
  )
}

export function SiteDetailModal({ school, weeks, onClose, drilldown = true, title, goalColumn = false, bordered = false, drilldownView = 'grid' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-brand-text/30 backdrop-blur-sm" onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
        className={`relative w-full max-w-[calc(42rem+15vw)] ${bordered ? 'bg-brand-bg' : 'bg-white'} rounded-xl shadow-lg overflow-hidden`}
      >
        {/* The scroll area sits inside the rounded, clipped shell so the scrollbar can't square off the right corners. */}
        <div className="thin-scroll max-h-[85vh] overflow-y-auto p-6">
          <SiteDetailContent school={school} weeks={weeks} onClose={onClose} drilldown={drilldown} title={title} goalColumn={goalColumn} bordered={bordered} drilldownView={drilldownView} />
        </div>
      </motion.div>
    </div>
  )
}

// Breadcrumb above the page title (2026-10-02), shared with Concept F.
export function SiteEngagementBreadcrumb() {
  const navigate = useNavigate()
  return (
    <Breadcrumb className="mb-2">
      <BreadcrumbList>
        <BreadcrumbItem><BreadcrumbLink onClick={() => navigate('/reports')}>Reports</BreadcrumbLink></BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem><BreadcrumbPage>Site engagement</BreadcrumbPage></BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  )
}

// Weekly goal badge (2026-10-02): a neutral gray pill, same family as the
// Change pill in the table, replacing the earlier bordered card.
export function GoalBox() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-bg px-3 py-1.5 text-xs">
      <span className="text-brand-subtext">Weekly goal</span>
      <span className="font-medium text-brand-text">{GOAL} lessons per week</span>
    </span>
  )
}

export default function Report2ConceptE() {
  const { isSiteLeaderView: isLeader } = useRole()
  const leaderSchool = schools[0]

  // Range: a preset key, or 'custom' with the snapped list of weeks.
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
          if (a.change == null || b.change == null) return (a.change == null) - (b.change == null) // no comparison sorts last
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
          <h2 className="text-2xl font-semibold text-brand-text">Site Engagement</h2>
          <p className="text-sm text-brand-subtext mt-1">
            {isLeader
              ? `This report shows Move This World lesson completion rates for ${leaderSchool.name}.`
              : 'This report shows Move This World lesson completion rates by site across your district.'}
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <GoalBox />
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
                <button
                  className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors"
                  onClick={() => { exportCsv(); setMenuOpen(false) }}
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

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
        className="bg-white rounded-xl border border-brand-border p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <p className="text-base font-semibold text-brand-text">{isLeader ? '% of educators meeting goal' : '% of sites meeting goal'}</p>
          <RangePicker
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
        </div>
        {isLeader ? <SiteWeeklyChart schoolId={leaderSchool.id} weeks={weeks} /> : <SiteGoalLineChart weeks={weeks} />}
      </motion.div>

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
