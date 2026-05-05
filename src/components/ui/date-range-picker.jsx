import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { DayPicker } from 'react-day-picker'

const CAL_CLASS_NAMES = {
  months:          'flex gap-8',
  month:           'flex flex-col flex-1',
  month_caption:   'flex justify-center items-center relative h-9 mb-4',
  caption_label:   'text-sm font-bold text-brand-text',
  nav:             'absolute inset-x-0 top-6 flex items-center justify-between px-6 pointer-events-none z-10',
  button_previous: 'pointer-events-auto p-1.5 rounded-lg text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors',
  button_next:     'pointer-events-auto p-1.5 rounded-lg text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors',
  month_grid:      'w-full border-collapse',
  weekdays:        'flex mb-1',
  weekday:         'flex-1 text-center text-xs font-medium text-brand-subtext pb-1',
  week:            'flex',
  day:             'flex-1 relative p-0 text-center',
  day_button:      'w-9 h-9 mx-auto flex items-center justify-center text-sm rounded-full transition-colors text-brand-text hover:bg-brand-bg',
  today:           '[&>button]:font-bold',
  outside:         '[&>button]:text-brand-subtext/30',
  disabled:        '[&>button]:opacity-30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
  hidden:          'invisible',
  selected:        '',
  range_start:     'bg-gradient-to-r from-transparent to-[#F0F2F5] [&>button]:!bg-brand-text [&>button]:!text-white [&>button]:rounded-full',
  range_end:       'bg-gradient-to-l from-transparent to-[#F0F2F5] [&>button]:!bg-brand-text [&>button]:!text-white [&>button]:rounded-full',
  range_middle:    'bg-[#F0F2F5] [&>button]:rounded-none [&>button]:hover:bg-[#E2E6EA]',
}

export function DateRangePicker({ from, to, onFromChange, onToChange, align = 'end', buttonClassName = '' }) {
  const [open, setOpen] = useState(false)

  const hasRange = from || to
  const label = from && to
    ? `${format(parseISO(from), 'MMM d')} – ${format(parseISO(to), 'MMM d, yyyy')}`
    : from ? `From ${format(parseISO(from), 'MMM d, yyyy')}` : 'Date range'

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={`flex items-center gap-1.5 text-xs font-medium border rounded-lg px-3 py-1.5 transition-colors whitespace-nowrap ${
            hasRange
              ? 'bg-dessa-teal text-white border-dessa-teal'
              : 'bg-white text-brand-subtext border-brand-border hover:text-brand-text hover:bg-brand-bg'
          } ${buttonClassName}`}
        >
          <CalendarDays size={13} className="shrink-0" />
          <span className="flex-1 text-left">{label}</span>
          {buttonClassName.includes('w-full') && <ChevronDown size={13} className="shrink-0 opacity-50" />}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align={align}
          sideOffset={6}
          className="z-50 bg-white border border-brand-border rounded-xl shadow-lg outline-none p-5"
        >
          <div style={{ minHeight: 290 }}>
            <DayPicker
              mode="range"
              numberOfMonths={2}
              defaultMonth={from ? parseISO(from) : new Date()}
              selected={{ from: from ? parseISO(from) : undefined, to: to ? parseISO(to) : undefined }}
              onSelect={r => {
                onFromChange(r?.from ? format(r.from, 'yyyy-MM-dd') : '')
                onToChange(r?.to ? format(r.to, 'yyyy-MM-dd') : '')
              }}
              showOutsideDays={false}
              classNames={CAL_CLASS_NAMES}
              components={{
                Chevron: ({ orientation }) =>
                  orientation === 'left' ? <ChevronLeft size={15} /> : <ChevronRight size={15} />,
              }}
            />
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-brand-border">
            <span className="text-xs text-brand-subtext">
              {from && to
                ? `${format(parseISO(from), 'MMM d')} – ${format(parseISO(to), 'MMM d, yyyy')}`
                : from ? `From ${format(parseISO(from), 'MMM d, yyyy')}` : ''}
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={!from && !to}
                onClick={() => { onFromChange(''); onToChange('') }}
                className="text-xs font-semibold disabled:opacity-35 disabled:cursor-not-allowed"
                style={{ color: '#0061FF' }}
              >Clear</button>
              <button
                disabled={!from && !to}
                onClick={() => setOpen(false)}
                className="text-xs font-semibold text-white px-3 py-1 rounded-md transition-colors hover:opacity-90 disabled:opacity-35 disabled:cursor-not-allowed"
                style={{ background: '#1B2B4B' }}
              >Save</button>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
