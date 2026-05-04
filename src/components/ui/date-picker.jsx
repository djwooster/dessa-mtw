import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { Calendar } from './calendar'
import { cn } from '../../lib/utils'

export function DatePicker({ value, onChange, placeholder = 'Pick a date', min, max, className, disabled }) {
  const [open, setOpen] = useState(false)

  const selected = value ? parseISO(value) : undefined
  const minDate  = min   ? parseISO(min)   : undefined
  const maxDate  = max   ? parseISO(max)   : undefined

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          disabled={disabled}
          className={cn(
            'w-full flex items-center gap-2 text-sm border border-brand-border rounded-lg px-3 py-2 bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal',
            value ? 'text-brand-text' : 'text-brand-subtext',
            disabled && 'opacity-50 cursor-not-allowed bg-brand-bg',
            className
          )}
        >
          <CalendarIcon size={14} className="shrink-0 text-brand-subtext" />
          <span className="flex-1 text-left">
            {value ? format(parseISO(value), 'MMM d, yyyy') : placeholder}
          </span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-50 bg-white border border-brand-border rounded-xl shadow-lg outline-none"
        >
          <Calendar
            mode="single"
            selected={selected}
            onSelect={d => { onChange(d ? format(d, 'yyyy-MM-dd') : ''); setOpen(false) }}
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
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
