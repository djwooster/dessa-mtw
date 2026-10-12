import { useMemo, useState } from 'react'
import { parseISO, addDays, format } from 'date-fns'
import { schoolWeeks } from '../../lib/report2Data'
import GoalStatusBadge from './GoalStatusBadge'

// User drill-down (2026-10-12, Concept F), in the pattern of GitHub's
// contribution graph: one column per school week, Monday to Friday down the
// side, a small square per day, month labels along the top, and a tooltip on
// hover. A day is filled teal when the user completed a lesson. The whole
// school year fits in one row, so there is nothing to page through.
// `dayMap` is { 'yyyy-MM-dd': true } for active days (see educatorDayMap).
const CELL = 12
const GAP = 3
const LABEL_W = 28
const TOP = 18
const ROWS = ['Mon', '', 'Wed', '', 'Fri']

export default function ContributionGraph({ name, role, daysActive, dayMap }) {
  const [hover, setHover] = useState(null)
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

  const width = LABEL_W + weeks.length * (CELL + GAP) - GAP
  const height = TOP + 5 * (CELL + GAP) - GAP

  return (
    <div className="pr-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-medium text-brand-text">{name}</span>
        <span className="text-xs text-brand-subtext">{role}</span>
        <GoalStatusBadge daysActive={daysActive} />
        <span className="ml-auto text-xs text-brand-subtext tabular-nums">{total} {total === 1 ? 'lesson' : 'lessons'} this school year</span>
      </div>

      <div className="overflow-x-auto">
        <div className="relative" style={{ width, height }} onMouseLeave={() => setHover(null)}>
          {monthLabels.map(m => (
            <span key={m.i} className="absolute top-0 text-xs text-brand-subtext" style={{ left: LABEL_W + m.i * (CELL + GAP) }}>{m.label}</span>
          ))}
          {ROWS.map((r, d) => (
            <span key={d} className="absolute text-xs text-brand-subtext leading-none" style={{ left: 0, top: TOP + d * (CELL + GAP) + 2 }}>{r}</span>
          ))}
          {weeks.map((w, wi) => [0, 1, 2, 3, 4].map(d => {
            const date = addDays(w, d)
            const key = format(date, 'yyyy-MM-dd')
            const on = !!dayMap[key]
            const left = LABEL_W + wi * (CELL + GAP)
            const top = TOP + d * (CELL + GAP)
            return (
              <span
                key={key}
                role="img"
                aria-label={`${format(date, 'EEE, MMM d, yyyy')}: ${on ? 'lesson completed' : 'no lesson'}`}
                onMouseEnter={() => setHover({ left, top, date, on })}
                className={`absolute rounded-[3px] ${on ? 'bg-dessa-teal' : 'bg-brand-border/70'} ${hover?.date.getTime() === date.getTime() ? 'ring-1 ring-brand-text/40' : ''}`}
                style={{ left, top, width: CELL, height: CELL }}
              />
            )
          }))}
          {hover && (
            <div
              className="absolute z-10 px-2 py-1 rounded-md bg-brand-text text-white text-xs whitespace-nowrap pointer-events-none shadow-lg"
              style={{ left: hover.left + CELL / 2, top: hover.top - 6, transform: 'translate(-50%, -100%)' }}
            >
              <span className="font-medium">{hover.on ? 'Lesson completed' : 'No lesson'}</span> on {format(hover.date, 'EEE, MMM d')}
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end items-center gap-1.5 mt-2 text-xs text-brand-subtext">
        <span>No lesson</span>
        <span className="inline-block w-3 h-3 rounded-[3px] bg-brand-border/70" />
        <span className="inline-block w-3 h-3 rounded-[3px] bg-dessa-teal" />
        <span>Lesson completed</span>
      </div>
    </div>
  )
}
