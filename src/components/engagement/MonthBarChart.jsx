import { useMemo, useState } from 'react'
import { parseISO, addDays, format } from 'date-fns'
import { schoolWeeks } from '../../lib/report2Data'
import { Y_TICKS } from '../../pages/Report2ConceptE'
import { weekBands } from './StackedGoalChart'

// Graph B (2026-10-06): one month at a time, one bar per school week, each
// bar the % of educators who met the weekly goal. A week belongs to the
// month its Monday falls in, so a month has 4 or 5 bars. Every bar is
// labeled inside with its % and "met of total" so nothing needs hovering, and the
// x-axis names the whole Monday to Friday range instead of a lone date.
// `schoolId` null means the whole district.
export const MONTHS = (() => {
  const out = []
  schoolWeeks.forEach(w => {
    const key = format(parseISO(w), 'yyyy-MM')
    const last = out[out.length - 1]
    if (last && last.key === key) last.weeks.push(w)
    else out.push({ key, label: format(parseISO(w), 'MMMM yyyy'), weeks: [w] })
  })
  return out
})()

// Open on the latest month that has a full 4 weeks of data.
export const DEFAULT_MONTH_IDX = MONTHS.reduce((acc, m, i) => (m.weeks.length >= 4 ? i : acc), 0)

export function weekRangeLabel(week) {
  const start = parseISO(week)
  const end = addDays(start, 4)
  return start.getMonth() === end.getMonth()
    ? `${format(start, 'MMM d')} to ${format(end, 'd')}`
    : `${format(start, 'MMM d')} to ${format(end, 'MMM d')}`
}

export default function MonthBarChart({ schoolId = null, weeks }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const data = useMemo(() => weeks.map(w => weekBands(schoolId, w)), [schoolId, weeks])

  const width = 960
  const height = 300
  const padding = { top: 40, right: 12, bottom: 32, left: 40 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const slotW = innerW / data.length
  const barW = Math.min(120, slotW * 0.5)
  const yFor = pct => padding.top + innerH - (pct / 100) * innerH

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-auto"
      role="img"
      aria-label={`Educators who met the weekly goal, by week: ${data.map(d => `${weekRangeLabel(d.week)}, ${d.pct}%`).join('; ')}`}
    >
      {Y_TICKS.map(v => (
        <g key={v}>
          <line x1={padding.left} y1={yFor(v)} x2={width - padding.right} y2={yFor(v)} stroke="#E2E6EA" strokeWidth={1} />
          <text x={padding.left - 8} y={yFor(v) + 3} textAnchor="end" fontSize={11} fill="#6B7A8D">{v}%</text>
        </g>
      ))}

      {data.map((d, i) => {
        const cx = padding.left + i * slotW + slotW / 2
        const top = yFor(d.pct)
        const inside = padding.top + innerH - top >= 52
        return (
          <g key={d.week} opacity={hoverIdx == null || hoverIdx === i ? 1 : 0.55} className="transition-opacity">
            <rect x={cx - barW / 2} y={top} width={barW} height={Math.max(0, padding.top + innerH - top)} rx={2} fill="#2A7F8F" />
            {/* Labels sit inside the bar; a bar too short to hold them gets them above instead. */}
            <text x={cx} y={inside ? top + 24 : top - 20} textAnchor="middle" fontSize={14} fontWeight={600} fill={inside ? 'white' : '#1B2B4B'}>{d.pct}%</text>
            <text x={cx} y={inside ? top + 40 : top - 6} textAnchor="middle" fontSize={11} fill={inside ? 'white' : '#6B7A8D'}>{d.met} of {d.total}</text>
            <text x={cx} y={height - 10} textAnchor="middle" fontSize={11} fill="#6B7A8D">{weekRangeLabel(d.week)}</text>
            <rect
              x={padding.left + i * slotW} y={padding.top - 30} width={slotW} height={innerH + 30}
              fill="transparent"
              onMouseEnter={() => setHoverIdx(i)}
              onMouseLeave={() => setHoverIdx(null)}
            />
          </g>
        )
      })}
    </svg>
  )
}
