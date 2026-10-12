import { useEffect, useMemo, useRef, useState } from 'react'
import { parseISO, addDays, format } from 'date-fns'
import { schoolWeeks } from '../../lib/report2Data'

// User drill-down (2026-10-12, Concept F), in the pattern of GitHub's
// contribution graph: one column per school week, Monday to Friday down the
// side, a small square per day, month labels along the top, and a tooltip on
// hover. A day is filled teal when the user completed a lesson. The whole
// school year fits in one row, so there is nothing to page through.
// `dayMap` is { 'yyyy-MM-dd': true } for active days (see educatorDayMap).
// Cells keep a fixed height and stretch horizontally to fill the row (never narrower
// than they are tall), so the year fits without scrolling.
const CELL_H = 14
const GAP = 3
const MONTH_GAP = 6 // extra space before each new month so the eye can group its columns
const LABEL_W = 16
const TOP = 18
const ROWS = ['M', 'T', 'W', 'T', 'F']

export default function ContributionGraph({ dayMap }) {
  const [hover, setHover] = useState(null)
  const wrapRef = useRef(null)
  const [avail, setAvail] = useState(800)
  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setAvail(Math.round(entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const weeks = useMemo(() => schoolWeeks.map(w => parseISO(w)), [])
  const total = Object.keys(dayMap).length

  const monthLabels = useMemo(() => {
    const out = []
    let last = -1
    weeks.forEach((w, i) => {
      const m = w.getMonth()
      if (m !== last) { out.push({ i, label: format(w, 'MMM') }); last = m }
    })
    return out
  }, [weeks])

  // Month group of each week (by its Monday, the same rule as the labels).
  const groupOf = useMemo(() => {
    let g = -1, last = -1
    return weeks.map(w => { if (w.getMonth() !== last) { g += 1; last = w.getMonth() } return g })
  }, [weeks])
  const gaps = groupOf[groupOf.length - 1] * MONTH_GAP
  const CELL_W = Math.max(CELL_H, Math.floor((avail - LABEL_W - gaps + GAP) / weeks.length) - GAP)
  const xFor = wi => LABEL_W + wi * (CELL_W + GAP) + groupOf[wi] * MONTH_GAP
  const width = xFor(weeks.length - 1) + CELL_W
  const height = TOP + 5 * (CELL_H + GAP) - GAP

  return (
    <div className="pr-2">
      <div ref={wrapRef}>
        <div className="relative" style={{ width, height }} onMouseLeave={() => setHover(null)}>
          {monthLabels.map(m => (
            <span key={m.i} className="absolute top-0 text-xs text-brand-subtext" style={{ left: xFor(m.i) }}>{m.label}</span>
          ))}
          {ROWS.map((r, d) => (
            <span key={d} className="absolute text-xs text-brand-subtext leading-none" style={{ left: 0, top: TOP + d * (CELL_H + GAP) + (CELL_H - 12) / 2 }}>{r}</span>
          ))}
          {weeks.map((w, wi) => [0, 1, 2, 3, 4].map(d => {
            const date = addDays(w, d)
            const key = format(date, 'yyyy-MM-dd')
            const on = !!dayMap[key]
            const left = xFor(wi)
            const top = TOP + d * (CELL_H + GAP)
            return (
              <span
                key={key}
                role="img"
                aria-label={`${format(date, 'EEE, MMM d, yyyy')}: ${on ? 'lesson completed' : 'no lesson'}`}
                onMouseEnter={() => setHover({ left, top, date, on })}
                className={`absolute rounded-[3px] ${on ? 'bg-dessa-teal' : 'bg-brand-border/70'} ${hover?.date.getTime() === date.getTime() ? 'ring-1 ring-brand-text/40' : ''}`}
                style={{ left, top, width: CELL_W, height: CELL_H }}
              />
            )
          }))}
          {hover && (
            <div
              className="absolute z-10 px-2 py-1 rounded-md bg-brand-text text-white text-xs whitespace-nowrap pointer-events-none shadow-lg"
              style={{ left: Math.min(Math.max(hover.left + CELL_W / 2, 70), width - 70), top: hover.top - 6, transform: 'translate(-50%, -100%)' }}
            >
              <span className="font-medium">{hover.on ? 'Lesson completed' : 'No lesson'}</span> on {format(hover.date, 'EEE, MMM d')}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mt-2 text-xs text-brand-subtext">
        <span className="tabular-nums">{total} {total === 1 ? 'lesson' : 'lessons'} this school year</span>
        <span className="flex items-center gap-1.5">
        <span>No lesson</span>
        <span className="inline-block w-3 h-3 rounded-[3px] bg-brand-border/70" />
        <span className="inline-block w-3 h-3 rounded-[3px] bg-dessa-teal" />
        <span>Lesson completed</span>
        </span>
      </div>
    </div>
  )
}
