import { useState, useRef, useEffect } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from './calendar'
import { cn } from '../../lib/utils'

// value / onChange use 'YYYY-MM-DD' strings (or '')
export function DatePicker({ value, onChange, placeholder = 'Pick a date', min, max, className }) {
  const [open, setOpen] = useState(false)
  const ref  = useRef(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const selected  = value ? parseISO(value) : undefined
  const minDate   = min   ? parseISO(min)   : undefined
  const maxDate   = max   ? parseISO(max)   : undefined

  function handleSelect(day) {
    onChange(day ? format(day, 'yyyy-MM-dd') : '')
    setOpen(false)
  }

  return (
    <div className={cn('relative', className)} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className={cn(
          'w-full flex items-center gap-2 text-sm border border-brand-border rounded-lg px-3 py-1.5 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal',
          value ? 'text-brand-text' : 'text-brand-subtext',
          open && 'ring-2 ring-dessa-teal/25 border-dessa-teal'
        )}
      >
        <CalendarIcon size={13} className="shrink-0 text-brand-subtext" />
        <span className="flex-1 text-left">
          {value ? format(parseISO(value), 'MMM d, yyyy') : placeholder}
        </span>
      </button>

      {open && (
        <div className="absolute top-full mt-1.5 left-0 z-50 bg-white border border-brand-border rounded-xl shadow-lg">
          <Calendar
            mode="single"
            selected={selected}
            onSelect={handleSelect}
            disabled={d =>
              (minDate && d < minDate) ||
              (maxDate && d > maxDate)
            }
            initialFocus
          />
          {value && (
            <div className="px-3 pb-3">
              <button
                onClick={() => { onChange(''); setOpen(false) }}
                className="text-xs text-brand-subtext hover:text-brand-text transition-colors"
              >
                Clear date
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
