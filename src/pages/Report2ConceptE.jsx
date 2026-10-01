// Concept E — Trend-first (2026-09-24) — inspired by a stock-chart layout:
// a row of range-preset tabs above a full-width line chart, then a full-
// width detail table below. Same strict per-site "every educator met the
// weekly goal" metric as Concepts C/D, just as a continuous line across a
// user-chosen range instead of a short bar strip. The underlying data is
// weekly, not daily, so the day-based presets (30/60/90) are converted to
// the nearest whole week count — "30 days" renders as ~4 weekly points,
// not 30 daily ones.
import { useState, useMemo, useRef, useEffect, Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { X, MoreHorizontal, Download, Printer, ChevronRight } from 'lucide-react'
import { schools, schoolWeeks, getWeekData, MOST_RECENT_WEEK } from '../lib/report2Data'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

const GOAL = 3 // weekly login/completion goal, ×/week — matches report2Data.js's district default

const RANGE_PRESETS = [
  { value: '30d', label: '30 days', weeks: Math.round(30 / 7) },
  { value: '60d', label: '60 days', weeks: Math.round(60 / 7) },
  { value: '90d', label: '90 days', weeks: Math.round(90 / 7) },
  { value: 'all', label: 'All time', weeks: schoolWeeks.length },
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
function rangeLabel(weeksList) {
  const start = parseISO(weeksList[0])
  const end = parseISO(weeksList[weeksList.length - 1])
  end.setDate(end.getDate() + 4)
  const sameYear = start.getFullYear() === end.getFullYear()
  return `${format(start, sameYear ? 'MMM d' : 'MMM d, yyyy')} to ${format(end, 'MMM d, yyyy')}`
}

function weekLabel(weekStart) {
  return format(parseISO(weekStart), 'MMM d')
}

// Same purpose as Concept D's version — one label per week, only shown on
// the first week of a new calendar month, so a long "All time" range
// doesn't try to cram 36 date labels under the chart.
function monthTransitionLabels(weeksList) {
  let lastMonth = null
  return weeksList.map(w => {
    const m = format(parseISO(w), 'MMM')
    const show = m !== lastMonth
    lastMonth = m
    return show ? m : ''
  })
}

const Y_TICKS = [0, 25, 50, 75, 100]

// Roster order is stable across weeks (report2Data.js caches each site's
// roster once), so a teacher's index can be used to look them up week to
// week without re-matching by name.
function getRosterNames(schoolId) {
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
const RECENT_LABELS = ['12m ago', '30m ago', '45m ago', '1h ago', '2h ago', '3h ago', '4h ago', '6h ago', 'Yesterday', '2d ago', '3d ago']
function recentLabel(schoolId, teacherIndex) {
  const h = Math.abs(Math.sin(schoolId * 12.9898 + teacherIndex * 78.233) * 43758.5453) % 1
  return RECENT_LABELS[Math.floor(h * RECENT_LABELS.length)]
}

function getLastActive(schoolId, teacherIndex) {
  for (let i = schoolWeeks.length - 1; i >= 0; i--) {
    const data = getWeekData(schoolId, schoolWeeks[i], GOAL)
    if (data.teachers[teacherIndex].daysActive > 0) {
      const weeksAgo = schoolWeeks.length - 1 - i
      return weeksAgo === 0 ? recentLabel(schoolId, teacherIndex) : `${weeksAgo}w ago`
    }
  }
  return 'Never'
}

function SiteGoalLineChart({ weeks }) {
  const [hoverIdx, setHoverIdx] = useState(null)

  const trend = useMemo(() => weeks.map(w => {
    const count = schools.filter(s => {
      const data = getWeekData(s.id, w, GOAL)
      return data.meetingGoal === data.totalTeachers
    }).length
    return { weekStart: w, count, pct: Math.round((count / schools.length) * 100) }
  }), [weeks])

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
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="% of sites meeting goal, by week">
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
          {hovered.count} of {schools.length} sites · {weekLabel(hovered.weekStart)}
        </div>
      )}
    </div>
  )
}

// Same shape as SiteGoalLineChart, but plots one site's own % of educators
// meeting goal per week (report2Data.js's existing `pct` field) instead of
// the district-wide % of sites — a zoomed-in version of the page's chart,
// sized for a narrower overlay.
function SiteWeeklyChart({ schoolId, weeks }) {
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
const WEEKDAYS = [0, 1, 2, 3, 4]

function activeDayOrder(schoolId, teacherIndex, weekIdx) {
  return WEEKDAYS
    .map(d => ({ d, h: Math.abs(Math.sin((schoolId * 131 + teacherIndex * 17 + weekIdx * 7 + d) * 12.9898) * 43758.5453) % 1 }))
    .sort((a, b) => a.h - b.h)
    .map(x => x.d)
}

function EducatorActivityGrid({ schoolId, teacherIndex, weeks }) {
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

// Shared content for both overlay shells — a right-anchored panel and a
// centered dialog both render this unchanged; only the chrome around it
// differs. Own independent range selector (2026-09-24: confirmed the
// overlay's range doesn't need to track whatever's selected on the page
// behind it, since that selection isn't visible once the overlay is open).
function SiteDetailContent({ school, onClose }) {
  const [preset, setPreset] = useState('30d')
  const activePreset = RANGE_PRESETS.find(p => p.value === preset)
  const weeks = useMemo(() => schoolWeeks.slice(-activePreset.weeks), [activePreset])

  const rosterNames = useMemo(() => getRosterNames(school.id), [school.id])
  // Accordion: opening one educator closes any other.
  const [openIdx, setOpenIdx] = useState(null)

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
        <button onClick={onClose} className="text-brand-subtext hover:text-brand-text p-1 rounded-lg hover:bg-brand-bg transition-colors shrink-0">
          <X size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-5 border-b border-brand-border mb-5">
        <div className="flex items-center gap-5">
          {RANGE_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`pb-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                preset === p.value ? 'border-dessa-teal text-dessa-teal' : 'border-transparent text-brand-subtext hover:text-brand-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <p className="pb-2 text-sm font-medium text-brand-text">{rangeLabel(weeks)}</p>
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

      <div className="mb-5">
        <SiteWeeklyChart schoolId={school.id} weeks={weeks} />
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Educator</TableHead>
            <TableHead className="text-right">Last Active</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rosterNames.map((name, i) => {
            const open = openIdx === i
            return (
              <Fragment key={name}>
                <TableRow onClick={() => setOpenIdx(open ? null : i)} className="cursor-pointer">
                  <TableCell className="font-medium">
                    <button type="button" aria-expanded={open} className="flex items-center gap-2 text-left">
                      <ChevronRight size={14} className={`shrink-0 text-brand-subtext transition-transform ${open ? 'rotate-90' : ''}`} />
                      {name}
                    </button>
                  </TableCell>
                  <TableCell className="text-brand-subtext text-right">{getLastActive(school.id, i)}</TableCell>
                </TableRow>
                {open && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={2} className="pl-10 py-3 bg-brand-bg/50">
                      <EducatorActivityGrid schoolId={school.id} teacherIndex={i} weeks={weeks} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}

function SitePanel({ school, onClose }) {
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
        <SiteDetailContent school={school} onClose={onClose} />
      </motion.div>
    </div>
  )
}

function SiteDetailModal({ school, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}
        className="absolute inset-0 bg-brand-text/30 backdrop-blur-sm" onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: 0.2 }}
        className="relative w-full max-w-[calc(42rem+15vw)] max-h-[85vh] bg-white rounded-xl shadow-lg overflow-y-auto p-6"
      >
        <SiteDetailContent school={school} onClose={onClose} />
      </motion.div>
    </div>
  )
}

export default function Report2ConceptE() {
  const [preset, setPreset] = useState('30d')
  const activePreset = RANGE_PRESETS.find(p => p.value === preset)
  const weeks = useMemo(() => schoolWeeks.slice(-activePreset.weeks), [activePreset])

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const [selectedSite, setSelectedSite] = useState(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  function exportCsv() {
    const header = `Site,Users meeting goal,Total users\n`
    const body = siteRows.map(r => `"${r.school.name}",${r.meetingGoal},${r.totalTeachers}`).join('\n')
    const url = URL.createObjectURL(new Blob([header + body], { type: 'text/csv' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'site-engagement.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const siteRows = useMemo(() => schools.map(school => {
    const data = getWeekData(school.id, weeks[weeks.length - 1], GOAL)
    return { school, meetingGoal: data.meetingGoal, totalTeachers: data.totalTeachers }
  }).sort((a, b) => a.school.name.localeCompare(b.school.name)), [weeks])

  return (
    <div className="px-6 pt-8 pb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text">Site Engagement</h2>
          <p className="text-sm text-brand-subtext mt-1">This report shows Move This World lesson completion rates by site across your district.</p>
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

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
        className="bg-white rounded-xl border border-brand-border p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-lg font-semibold text-brand-text">% of sites meeting goal</p>
          <p className="text-sm font-medium text-brand-text">{rangeLabel(weeks)}</p>
        </div>
        <div className="flex items-center gap-6 border-b border-brand-border mb-5">
          {RANGE_PRESETS.map(p => (
            <button
              key={p.value}
              onClick={() => setPreset(p.value)}
              className={`pb-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                preset === p.value ? 'border-dessa-teal text-dessa-teal' : 'border-transparent text-brand-subtext hover:text-brand-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <SiteGoalLineChart weeks={weeks} />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.14 }}
        className="bg-white rounded-xl border border-brand-border overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead className="text-right">Users meeting goal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {siteRows.map(({ school, meetingGoal, totalTeachers }) => (
              <TableRow key={school.id} onClick={() => setSelectedSite(school)} className="cursor-pointer">
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell className="text-brand-text text-right">{meetingGoal} of {totalTeachers}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>

      <AnimatePresence>
        {selectedSite && (
          <SiteDetailModal key="modal" school={selectedSite} onClose={() => setSelectedSite(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
