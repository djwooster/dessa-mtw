// Concept E — Trend-first (2026-09-24) — inspired by a stock-chart layout:
// a row of range-preset tabs above a full-width line chart, then a full-
// width detail table below. Same strict per-site "every educator met the
// weekly goal" metric as Concepts C/D, just as a continuous line across a
// user-chosen range instead of a short bar strip. The underlying data is
// weekly, not daily, so the day-based presets (30/60/90) are converted to
// the nearest whole week count — "30 days" renders as ~4 weekly points,
// not 30 daily ones.
import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, parseISO } from 'date-fns'
import { X, Check, ChevronDown } from 'lucide-react'
import { schools, schoolWeeks, getWeekData, MOST_RECENT_WEEK } from '../lib/report2Data'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

const GOAL = 3 // weekly login/completion goal, ×/week — matches report2Data.js's district default

const RANGE_PRESETS = [
  { value: '30d', label: '30 days', weeks: Math.round(30 / 7) },
  { value: '60d', label: '60 days', weeks: Math.round(60 / 7) },
  { value: '90d', label: '90 days', weeks: Math.round(90 / 7) },
  { value: 'all', label: 'All time', weeks: schoolWeeks.length },
]

// Per-site detail overlay (2026-09-24) — two interchangeable presentation
// shells (a right-anchored slide-over vs. a centered dialog), switched via
// a control in the page header, same "compare two ways of doing the same
// thing" pattern as every other lettered concept in this app. Both shells
// wrap the same SiteDetailContent — only the chrome differs.
const OVERLAY_STYLES = [
  { value: 'panel', label: 'Panel' },
  { value: 'modal', label: 'Modal' },
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
function getLastActive(schoolId, teacherIndex) {
  for (let i = schoolWeeks.length - 1; i >= 0; i--) {
    const data = getWeekData(schoolId, schoolWeeks[i], GOAL)
    if (data.teachers[teacherIndex].daysActive > 0) {
      const weeksAgo = schoolWeeks.length - 1 - i
      return weeksAgo === 0 ? 'This week' : `${weeksAgo}w ago`
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

  const width = 520
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
    <div className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" role="img" aria-label="% of this site's educators meeting goal, by week">
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

      <div className="flex items-center gap-5 border-b border-brand-border mb-5">
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

      <div className="grid grid-cols-3 gap-3 mb-5">
        {cards.map(c => (
          <div key={c.label} className="bg-brand-bg rounded-lg px-3 py-2.5">
            <p className="text-xs text-brand-subtext mb-1">{c.label}</p>
            <p className="text-lg font-bold text-brand-text">{c.value}</p>
          </div>
        ))}
      </div>

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
          {rosterNames.map((name, i) => (
            <TableRow key={name}>
              <TableCell className="font-medium">{name}</TableCell>
              <TableCell className="text-brand-subtext text-right">{getLastActive(school.id, i)}</TableCell>
            </TableRow>
          ))}
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
        className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-xl shadow-lg overflow-y-auto p-6"
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

  const [overlayStyle, setOverlayStyle] = useState('panel')
  const [styleMenuOpen, setStyleMenuOpen] = useState(false)
  const styleMenuRef = useRef(null)
  const [selectedSite, setSelectedSite] = useState(null)

  useEffect(() => {
    if (!styleMenuOpen) return
    const handler = e => { if (styleMenuRef.current && !styleMenuRef.current.contains(e.target)) setStyleMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [styleMenuOpen])

  const siteRows = useMemo(() => schools.map(school => {
    const data = getWeekData(school.id, weeks[weeks.length - 1], GOAL)
    return { school, meetingGoal: data.meetingGoal, totalTeachers: data.totalTeachers }
  }).sort((a, b) => a.school.name.localeCompare(b.school.name)), [weeks])

  const activeOverlayStyle = OVERLAY_STYLES.find(s => s.value === overlayStyle)

  return (
    <div className="px-6 pt-8 pb-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text">Site Engagement</h2>
          <p className="text-sm text-brand-subtext mt-1">This report shows Move This World lesson completion rates by site across your district.</p>
        </div>
        <div className="relative shrink-0" ref={styleMenuRef}>
          <button
            onClick={() => setStyleMenuOpen(o => !o)}
            title="Which overlay style opens when you click a site"
            className="flex items-center gap-2 px-3 h-9 rounded-lg border border-brand-border bg-white text-sm font-medium text-brand-text hover:bg-brand-bg transition-colors"
          >
            {activeOverlayStyle.label}
            <ChevronDown size={13} className={`text-brand-subtext transition-transform ${styleMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {styleMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+6px)] w-44 bg-white rounded-xl border border-brand-border shadow-lg z-30 py-1.5"
              >
                {OVERLAY_STYLES.map(s => (
                  <button
                    key={s.value}
                    onClick={() => { setOverlayStyle(s.value); setStyleMenuOpen(false) }}
                    className={`w-full flex items-center justify-between px-3.5 py-2 text-sm text-left transition-colors ${
                      overlayStyle === s.value ? 'text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                    }`}
                  >
                    {s.label}
                    {overlayStyle === s.value && <Check size={13} className="text-dessa-teal" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
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
          overlayStyle === 'panel'
            ? <SitePanel key="panel" school={selectedSite} onClose={() => setSelectedSite(null)} />
            : <SiteDetailModal key="modal" school={selectedSite} onClose={() => setSelectedSite(null)} />
        )}
      </AnimatePresence>
    </div>
  )
}
