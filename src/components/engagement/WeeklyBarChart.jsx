import { useEffect, useRef, useState } from 'react'
import { parseISO, format } from 'date-fns'
import { weekRangeLabel } from './MonthBarChart'
import { monthTransitionLabels } from '../../pages/Report2ConceptE'

// Concept C chart (2026-10-06): a quiet single-series weekly bar chart for
// the 2x2 analytics grid. The x-axis adapts to the date range: with 5 weeks
// or fewer every bar gets its full Monday to Friday range ("Apr 6 to 10");
// longer ranges label the first bar of each month, and hovering any bar
// names its exact week either way, so a lone date never has to be decoded.
// `points` is [{ week, value, detail }]; `percent` fixes the axis at 0-100%.
// `kind` is 'bar' (counts of things that happened) or 'line' (a level over
// time: a dotted line with a soft fill, like the reference analytics page).
const STEPS = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000]

function niceScale(max) {
  const step = STEPS.find(s => max / s <= 4) ?? STEPS[STEPS.length - 1]
  const top = Math.max(step, Math.ceil(max / step) * step)
  const ticks = []
  for (let v = 0; v <= top; v += step) ticks.push(v)
  return { top, ticks }
}

export default function WeeklyBarChart({ points, percent = false, label, kind = 'bar' }) {
  const [hoverIdx, setHoverIdx] = useState(null)
  // Draw at the real pixel width (fixed height) so labels stay 10px on wide
  // screens instead of scaling up with a stretched viewBox.
  const wrapRef = useRef(null)
  const [width, setWidth] = useState(520)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(240, Math.round(entry.contentRect.width))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { top, ticks } = percent
    ? { top: 100, ticks: [0, 25, 50, 75, 100] }
    : niceScale(Math.max(...points.map(p => p.value), 1))

  const height = 336
  const padding = { top: 12, right: 8, bottom: 30, left: 42 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const slotW = innerW / points.length
  const barW = Math.min(56, slotW * 0.62)
  const yFor = v => padding.top + innerH - (v / top) * innerH
  const fmt = v => (percent ? `${v}%` : v.toLocaleString())

  const exact = points.length <= 5
  const months = exact ? null : monthTransitionLabels(points.map(p => p.week))
  const hovered = hoverIdx != null ? points[hoverIdx] : null
  const xFor = i => padding.left + i * slotW + slotW / 2
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xFor(i)},${yFor(p.value)}`).join(' ')
  const baseY = padding.top + innerH
  const areaPath = `${linePath} L${xFor(points.length - 1)},${baseY} L${xFor(0)},${baseY} Z`

  return (
    <div ref={wrapRef} className="relative">
      <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} className="block" role="img" aria-label={`${label}, by week. Latest week: ${fmt(points[points.length - 1].value)}.`}>
        {ticks.map(v => (
          <g key={v}>
            <line x1={padding.left} y1={yFor(v)} x2={width - padding.right} y2={yFor(v)} stroke="#E2E6EA" strokeWidth={1} />
            <text x={padding.left - 8} y={yFor(v) + 3} textAnchor="end" fontSize={11} fill="#6B7A8D">{fmt(v)}</text>
          </g>
        ))}

        {kind === 'line' && (
          <>
            <path d={areaPath} fill="#2A7F8F" fillOpacity={0.08} stroke="none" />
            <path d={linePath} fill="none" stroke="#2A7F8F" strokeWidth={2} strokeLinejoin="round" />
          </>
        )}

        {points.map((p, i) => {
          const cx = xFor(i)
          const barH = (p.value / top) * innerH
          const text = exact ? weekRangeLabel(p.week) : months[i]
          return (
            <g key={p.week} opacity={kind === 'bar' && hoverIdx != null && hoverIdx !== i ? 0.55 : 1} className="transition-opacity">
              {kind === 'bar'
                ? <rect x={cx - barW / 2} y={yFor(p.value)} width={barW} height={barH} rx={1.5} fill="#2A7F8F" />
                : <circle cx={cx} cy={yFor(p.value)} r={hoverIdx === i ? 4.5 : 3} fill="#2A7F8F" stroke="white" strokeWidth={1.5} />}
              {text && <text x={cx} y={height - 10} textAnchor="middle" fontSize={11} fill="#6B7A8D">{text}</text>}
              <rect
                x={padding.left + i * slotW} y={padding.top} width={slotW} height={innerH}
                fill="transparent"
                onMouseEnter={() => setHoverIdx(i)}
                onMouseLeave={() => setHoverIdx(null)}
              />
            </g>
          )
        })}
      </svg>

      {hovered && (
        <div
          className="absolute px-2.5 py-1.5 rounded-md bg-brand-text text-white text-xs whitespace-nowrap pointer-events-none shadow-lg"
          style={{
            left: `${((padding.left + hoverIdx * slotW + slotW / 2) / width) * 100}%`,
            top: `${(yFor(hovered.value) / height) * 100}%`,
            transform: 'translate(-50%, -130%)',
          }}
        >
          {hovered.detail} · {weekRangeLabel(hovered.week)}
        </div>
      )}
    </div>
  )
}
