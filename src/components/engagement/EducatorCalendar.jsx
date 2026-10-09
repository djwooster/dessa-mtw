import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Educator drill-down calendar (2026-10-09), brought back from the old Report1C
// concept ("Ranked List + Calendar Detail"): six months at a time, a day filled
// in teal when the educator completed a lesson, weekends muted. Six across was
// too wide for the site modal, so the months wrap into two rows of three.
// `dayMap` is { 'yyyy-MM-dd': true } for active days (see educatorDayMap).
const FIRST_MONTH = new Date(2025, 8, 1) // Sep 2025, the start of the data
const MONTH_COUNT = 9 // Sep 2025 to May 2026
const WINDOW = 6
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
  const maxStart = MONTH_COUNT - WINDOW
  const [start, setStart] = useState(maxStart) // open on the most recent six months
  const months = Array.from({ length: WINDOW }, (_, i) => monthAt(start + i))
  const first = months[0]
  const last = months[WINDOW - 1]

  return (
    <div className="pr-2">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => setStart(s => s - 1)}
          disabled={start === 0}
          aria-label="Earlier months"
          className="p-1 rounded border border-brand-border hover:bg-brand-border/60 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronLeft size={14} className="text-brand-subtext" />
        </button>
        <span className="text-xs font-medium text-brand-subtext" aria-live="polite">
          {monthName(first, { month: 'short' })} to {monthName(last, { month: 'short', year: 'numeric' })}
        </span>
        <button
          type="button"
          onClick={() => setStart(s => s + 1)}
          disabled={start === maxStart}
          aria-label="Later months"
          className="p-1 rounded border border-brand-border hover:bg-brand-border/60 disabled:opacity-25 disabled:hover:bg-transparent transition-colors"
        >
          <ChevronRight size={14} className="text-brand-subtext" />
        </button>
      </div>
      <div className="grid grid-cols-3 gap-x-6 gap-y-5">
        {months.map(m => <MonthGrid key={m.toISOString()} date={m} dayMap={dayMap} />)}
      </div>
      <div className="flex justify-end items-center gap-x-5 mt-3 text-xs text-brand-subtext">
        <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded-sm bg-dessa-teal" /> Lesson completed</span>
        <span className="flex items-center gap-1.5"><span className="inline-block w-3.5 h-3.5 rounded-sm bg-brand-border" /> No lesson</span>
      </div>
    </div>
  )
}
