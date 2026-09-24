// Concept E — Trend-first (2026-09-24) — inspired by a stock-chart layout:
// a row of range-preset tabs above a full-width line chart, then a full-
// width detail table below. Same strict per-site "every educator met the
// weekly goal" metric as Concepts C/D, just as a continuous line across a
// user-chosen range instead of a short bar strip. The underlying data is
// weekly, not daily, so the day-based presets (30/60/90) are converted to
// the nearest whole week count — "30 days" renders as ~4 weekly points,
// not 30 daily ones.
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { schools, schoolWeeks, getWeekData } from '../lib/report2Data'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

const GOAL = 3 // weekly login/completion goal, ×/week — matches report2Data.js's district default

const RANGE_PRESETS = [
  { value: '30d', label: '30 days', weeks: Math.round(30 / 7) },
  { value: '60d', label: '60 days', weeks: Math.round(60 / 7) },
  { value: '90d', label: '90 days', weeks: Math.round(90 / 7) },
  { value: 'all', label: 'All time', weeks: schoolWeeks.length },
]

// Each point is one real calendar week's data — labeled with a single real
// date (the week's start), not a range, so a point on the line never
// implies it spans more than one moment. Used for both the axis and the
// hover tooltip (2026-09-24 — a range read as if the point covered that
// whole span, which misrepresented a single weekly value).
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

export default function Report2ConceptE() {
  const [preset, setPreset] = useState('30d')
  const activePreset = RANGE_PRESETS.find(p => p.value === preset)
  const weeks = useMemo(() => schoolWeeks.slice(-activePreset.weeks), [activePreset])

  const siteRows = useMemo(() => schools.map(school => {
    const data = getWeekData(school.id, weeks[weeks.length - 1], GOAL)
    return { school, meetingGoal: data.meetingGoal, totalTeachers: data.totalTeachers }
  }).sort((a, b) => a.school.name.localeCompare(b.school.name)), [weeks])

  return (
    <div className="px-6 pt-8 pb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-brand-text">Site Engagement</h2>
        <p className="text-sm text-brand-subtext mt-1">This report shows Move This World lesson completion rates by site across your district.</p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
        className="bg-white rounded-xl border border-brand-border p-5 mb-6"
      >
        <div className="flex items-center justify-between mb-1">
          <p className="text-lg font-semibold text-brand-text">% of sites meeting goal</p>
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
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell className="text-brand-text text-right">{meetingGoal} of {totalTeachers}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  )
}
