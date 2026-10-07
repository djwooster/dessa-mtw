import { useMemo, useState } from 'react'
import { schools, getWeekData } from '../../lib/report2Data'
import { GOAL, weekLabel, monthTransitionLabels, Y_TICKS } from '../../pages/Report2ConceptE'

// Engagement Concept B chart (2026-10-06): every week is one bar of 100% of
// the educators, split into three bands, so a single chart answers both
// readings of "meeting goal". Met goal sits on the baseline so its trend is
// the easiest thing to read; "Making progress" (some activity, below the
// weekly goal) is a lighter tint of the same hue; "Not yet active" is
// neutral. No red or amber, on purpose (positive framing brief).
// `schoolId` null means the whole district.
const BANDS = [
  { key: 'met', label: 'Met goal', fill: '#2A7F8F', opacity: 1, swatch: 'bg-dessa-teal' },
  { key: 'progress', label: 'Making progress', fill: '#2A7F8F', opacity: 0.3, swatch: 'bg-dessa-teal/30' },
  { key: 'none', label: 'Not yet active', fill: '#E2E6EA', opacity: 0.6, swatch: 'bg-brand-border/60' },
]

export function weekBands(schoolId, week) {
  const ids = schoolId == null ? schools.map(s => s.id) : [schoolId]
  const counts = { met: 0, progress: 0, none: 0 }
  ids.forEach(id => {
    getWeekData(id, week, GOAL).teachers.forEach(t => {
      if (t.metGoal) counts.met += 1
      else if (t.daysActive > 0) counts.progress += 1
      else counts.none += 1
    })
  })
  const total = counts.met + counts.progress + counts.none
  return { week, total, ...counts, pct: Math.round((counts.met / total) * 100) }
}

export default function StackedGoalChart({ schoolId = null, weeks }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  const data = useMemo(() => weeks.map(w => weekBands(schoolId, w)), [schoolId, weeks])

  const width = 960
  const height = 280
  const padding = { top: 12, right: 12, bottom: 28, left: 40 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const slotW = innerW / data.length
  const barW = Math.min(44, slotW * 0.64)
  const yFor = pct => padding.top + innerH - (pct / 100) * innerH
  const showLabels = data.length <= 13
  const monthLabels = data.length > 13 ? monthTransitionLabels(weeks) : null

  const shown = data[hoverIdx ?? data.length - 1]
  const latest = data[data.length - 1]

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto"
        role="img"
        aria-label={`Educators by weekly goal status. Latest week: ${latest.met} of ${latest.total} met the goal, ${latest.progress} making progress, ${latest.none} not yet active.`}
      >
        {Y_TICKS.map(v => (
          <g key={v}>
            <line x1={padding.left} y1={yFor(v)} x2={width - padding.right} y2={yFor(v)} stroke="#E2E6EA" strokeWidth={1} />
            <text x={padding.left - 8} y={yFor(v) + 3} textAnchor="end" fontSize={11} fill="#6B7A8D">{v}%</text>
          </g>
        ))}

        {data.map((d, i) => {
          const x = padding.left + i * slotW + (slotW - barW) / 2
          let acc = 0
          return (
            <g key={d.week} opacity={hoverIdx == null || hoverIdx === i ? 1 : 0.55} className="transition-opacity">
              {BANDS.map(b => {
                const pct = (d[b.key] / d.total) * 100
                const rect = (
                  <rect key={b.key} x={x} y={yFor(acc + pct)} width={barW} height={Math.max(0, (pct / 100) * innerH)} fill={b.fill} fillOpacity={b.opacity} />
                )
                acc += pct
                return rect
              })}
              {showLabels && d.pct >= 8 && (
                <text x={x + barW / 2} y={yFor(d.pct / 2) + 4} textAnchor="middle" fontSize={11} fontWeight={600} fill="white">{d.pct}%</text>
              )}
            </g>
          )
        })}

        {data.map((d, i) => (
          <rect
            key={`hit-${d.week}`}
            x={padding.left + i * slotW} y={padding.top} width={slotW} height={innerH}
            fill="transparent"
            onMouseEnter={() => setHoverIdx(i)}
            onMouseLeave={() => setHoverIdx(null)}
          />
        ))}

        {data.map((d, i) => {
          const label = monthLabels ? monthLabels[i] : weekLabel(d.week)
          return label && (
            <text key={`x-${d.week}`} x={padding.left + i * slotW + slotW / 2} y={height - 8} textAnchor="middle" fontSize={10} fill="#6B7A8D">{label}</text>
          )
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 mt-3 pt-3 border-t border-brand-border" aria-live="polite">
        <p className="text-sm text-brand-text">
          <span className="font-semibold">{shown.met} of {shown.total} educators</span> met the goal
          <span className="text-brand-subtext"> ({shown.pct}%) · {hoverIdx == null ? 'latest week, ' : 'week of '}{weekLabel(shown.week)}</span>
        </p>
        <ul className="flex items-center gap-4">
          {BANDS.map(b => (
            <li key={b.key} className="flex items-center gap-1.5 text-xs text-brand-subtext">
              <span className={`w-2.5 h-2.5 rounded-sm ${b.swatch}`} aria-hidden="true" />
              {b.label}
              <span className="font-medium text-brand-text tabular-nums">{shown[b.key]}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
