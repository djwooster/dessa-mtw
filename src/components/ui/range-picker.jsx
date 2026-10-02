import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '../../lib/utils'

// shadcn-style date range picker (2026-10-02): a Button trigger opening a
// Popover with preset ranges on the left and a two-month range Calendar on
// the right. Built from the shadcn recipe, with project tokens, and kept
// separate from ui/date-range-picker.jsx (the custom one the DCE report
// still uses). Controlled: `value` is a preset key or 'custom'; `label` is
// whatever text the trigger should show for the current range.
const CAL_CLASS_NAMES = {
  months:          'relative flex gap-6',
  month:           'flex flex-col',
  month_caption:   'flex justify-center items-center h-9 mb-2',
  caption_label:   'text-sm font-semibold text-brand-text',
  nav:             'absolute inset-x-0 top-0 flex items-center justify-between pointer-events-none z-10',
  button_previous: 'pointer-events-auto h-7 w-7 flex items-center justify-center rounded-md text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors',
  button_next:     'pointer-events-auto h-7 w-7 flex items-center justify-center rounded-md text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors',
  month_grid:      'w-full border-collapse',
  weekdays:        'flex',
  weekday:         'w-9 h-9 flex items-center justify-center text-xs font-medium text-brand-subtext',
  week:            'flex w-full mt-0.5',
  day:             'relative p-0 text-center',
  day_button:      'h-9 w-9 mx-auto flex items-center justify-center rounded-md text-sm text-brand-text hover:bg-brand-bg transition-colors',
  today:           '[&>button]:font-bold',
  outside:         '[&>button]:text-brand-subtext/30',
  disabled:        '[&>button]:opacity-30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
  hidden:          'invisible',
  range_start:     '[&>button]:!bg-dessa-teal [&>button]:!text-white',
  range_end:       '[&>button]:!bg-dessa-teal [&>button]:!text-white',
  range_middle:    'bg-dessa-tealLight [&>button]:rounded-none [&>button]:hover:bg-dessa-tealLight',
}

// Custom ranges are picked in two clicks (start, then end) and only take
// effect when Apply is clicked (2026-10-02). `range` is the current range,
// shown pre-selected when the popover opens.
export function RangePicker({ presets, value, label, range, month, minDate, maxDate, onPreset, onRange, className }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(range)

  // First click starts a range; second click ends it (an earlier date swaps
  // the ends); a click after a finished range starts over.
  function handleDayClick(day) {
    setDraft(d => {
      if (!d?.from || d.to) return { from: day, to: undefined }
      return day < d.from ? { from: day, to: d.from } : { from: d.from, to: day }
    })
  }
  const complete = draft?.from && draft?.to

  return (
    <Popover.Root open={open} onOpenChange={o => { setOpen(o); if (o) setDraft(range) }}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-brand-border bg-white text-xs font-medium text-brand-text hover:bg-brand-bg transition-colors',
            className
          )}
        >
          <CalendarIcon size={14} className="text-brand-subtext" aria-hidden="true" />
          {label}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 flex bg-white border border-brand-border rounded-xl shadow-lg outline-none overflow-hidden"
        >
          <div className="flex flex-col gap-0.5 p-2 border-r border-brand-border min-w-44">
            {presets.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => { onPreset(p.value); setOpen(false) }}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors',
                  value === p.value ? 'text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                )}
              >
                {p.label}
                {value === p.value && <Check size={13} />}
              </button>
            ))}
          </div>
          <div className="flex flex-col">
            <div className="p-4">
              <DayPicker
                mode="range"
                numberOfMonths={2}
                defaultMonth={month}
                startMonth={minDate}
                endMonth={maxDate}
                disabled={{ before: minDate, after: maxDate }}
                selected={draft}
                onDayClick={handleDayClick}
                classNames={CAL_CLASS_NAMES}
                components={{
                  Chevron: ({ orientation }) =>
                    orientation === 'left' ? <ChevronLeft size={15} /> : <ChevronRight size={15} />,
                }}
              />
            </div>
            <div className="flex items-center justify-end px-4 py-3 border-t border-brand-border">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="h-8 px-3 rounded-md border border-brand-border text-[13px] font-medium text-brand-text hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!complete}
                  onClick={() => { onRange(draft); setOpen(false) }}
                  className="h-8 px-3 rounded-md bg-dessa-teal text-[13px] font-medium text-white hover:bg-dessa-teal/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
