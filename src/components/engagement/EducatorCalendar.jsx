import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// User drill-down calendar (2026-10-09), brought back from the old Report1C
// concept ("Ranked List + Calendar Detail"): a day filled in teal when the user
// completed a lesson, weekends muted. Three months in a single row (two rows
// took too much scrolling in the modal); the arrows page one month at a time.
// `dayMap` is { 'yyyy-MM-dd': true } for active days (see educatorDayMap).
const FIRST_MONTH = new Date(2026, 8, 1) // Sep 2026, the start of the data (moved a year on 2026-10-19)
const MONTH_COUNT = 9 // Sep 2026 to May 2027
const MIN_WINDOW = 3 // never fewer than three months
const MONTH_W = 174 // one month grid: 7 cells of 24px plus gaps
const MONTH_GAP = 24
const WEEKDAY_HEADS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

const pad = n => String(n).padStart(2, '0')
const monthAt = i => new Date(FIRST_MONTH.getFullYear(), FIRST_MONTH.getMonth() + i, 1)
const monthName = (d, opts) => d.toLocaleDateString('en-US', opts)

function MonthGrid({ date, dayMap }) {
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div>
      <p className="text-sm font-medium text-brand-text mb-2">{monthName(date, { month: 'long', year: 'numeric' })}</p>
      <div className="grid grid-cols-7 gap-px w-fit">
        {WEEKDAY_HEADS.map(d => <div key={d} className="w-6 text-xs text-brand-subtext text-center py-0.5">{d}</div>)}
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const key = `${year}-${pad(month + 1)}-${pad(day)}`
          const weekend = (firstDay + day - 1) % 7 === 0 || (firstDay + day - 1) % 7 === 6
          const on = !weekend && dayMap[key]
          return (
            <div
              key={day}
              title={`${key}${on ? ': lesson completed' : ''}`}
              aria-label={`${key}: ${weekend ? 'weekend' : on ? 'lesson completed' : 'no lesson'}`}
              className={`w-6 h-6 flex items-center justify-center rounded text-xs ${
                weekend ? 'text-brand-subtext/30'
                : on ? 'bg-dessa-teal text-white font-semibold'
                : 'bg-brand-border text-brand-subtext'
              }`}
            >
              {day}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function EducatorCalendar({ dayMap }) {
  // As many months as fit the width (2026-10-13), at least three, so a wide table
  // is not left with empty space; the modal stays at three.
  const bodyRef = useRef(null)
  const [fit, setFit] = useState(MIN_WINDOW)
  useEffect(() => {
    const el = bodyRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setFit(Math.floor((e.contentRect.width + MONTH_GAP) / (MONTH_W + MONTH_GAP))))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  const count = Math.min(MONTH_COUNT, Math.max(MIN_WINDOW, fit))
  const maxStart = MONTH_COUNT - count
  const [rawStart, setStart] = useState(MONTH_COUNT) // opens on the most recent months
  const start = Math.min(rawStart, maxStart)
  const months = Array.from({ length: count }, (_, i) => monthAt(start + i))
  const first = months[0]
  const last = months[count - 1]

  return (
    <div className="flex items-center gap-3 pr-2">
      <button
        type="button"
        onClick={() => setStart(start - 1)}
        disabled={start === 0}
        aria-label="Earlier months"
        className="shrink-0 p-1 rounded border border-brand-border hover:bg-brand-border/60 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronLeft size={14} className="text-brand-subtext" />
      </button>
      <div ref={bodyRef} className="flex-1 min-w-0">
        <span className="sr-only" aria-live="polite">
          {monthName(first, { month: 'short' })} to {monthName(last, { month: 'short', year: 'numeric' })}
        </span>
        <div className="flex justify-between gap-x-6">
          {months.map(m => <MonthGrid key={m.toISOString()} date={m} dayMap={dayMap} />)}
        </div>
        <div className="flex justify-end items-center gap-x-5 mt-3 text-xs text-brand-subtext">
          <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded-sm bg-dessa-teal" /> Lesson completed</span>
          <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded-sm bg-brand-border" /> No lesson</span>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setStart(start + 1)}
        disabled={start === maxStart}
        aria-label="Later months"
        className="shrink-0 p-1 rounded border border-brand-border hover:bg-brand-border/60 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
      >
        <ChevronRight size={14} className="text-brand-subtext" />
      </button>
    </div>
  )
}
