import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { parseISO, addDays, format } from 'date-fns'
import { Calendar as CalendarIcon, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { cn } from '../../lib/utils'
import { Checkbox } from './checkbox'

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

// Weekly picker (2026-10-08): the first and last day of a finished range get a
// small teal pointer (a 5px by 24px box clipped to a triangle with a curved tip) on the side facing the range, to guide the eye from one
// end to the other, like the Shopify date picker. Only shown once both ends are
// picked and differ, so a lone first click never points at nothing. The
// button needs z-10: day cells are positioned, so without it the next cell's
// fill paints over a pointer that sticks out into it (the start day's).
const POINTER = "[&>button]:relative [&>button]:z-10 [&>button]:after:content-[''] [&>button]:after:absolute [&>button]:after:top-1/2 [&>button]:after:-translate-y-1/2 [&>button]:after:w-[5px] [&>button]:after:h-[24px] [&>button]:after:bg-dessa-teal"
// The tip is a short curve (Q) in a clip path, not a flat cut, so it reads as softly rounded.
const POINTER_START = `${POINTER} [&>button]:after:-right-[5px] [&>button]:after:[clip-path:path('M0_0_L3.75_9_Q5_12_3.75_15_L0_24_Z')]`
const POINTER_END = `${POINTER} [&>button]:after:-left-[5px] [&>button]:after:[clip-path:path('M5_0_L1.25_9_Q0_12_1.25_15_L5_24_Z')]`

// Custom ranges are picked in two clicks (start, then end) and only take
// effect when Apply is clicked (2026-10-02). `range` is the current range,
// shown pre-selected when the popover opens.
//
// `weekly` (2026-10-08) turns on the week-based extras used by the Engagement
// report: a "Last [N] weeks" field (weeks only, no day or month units), an
// "Include current week" checkbox, and a footer readout of the picked range
// with its week count. It needs `weekStarts`, every Monday in the data.
export function RangePicker({ presets, value, label, range, month, minDate, maxDate, onPreset, onRange, className, iconOnly = false, weekly = false, weekStarts = [] }) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(range)
  const [lastN, setLastN] = useState('')
  // Every week in the mock data is complete, so the latest one is on by default.
  const [includeCurrent, setIncludeCurrent] = useState(true)
  const [viewMonth, setViewMonth] = useState(month)

  function pickLastWeeks(nText, include) {
    setLastN(nText)
    const n = Math.min(parseInt(nText, 10), weekStarts.length)
    if (!n || n < 1) return
    const endIdx = weekStarts.length - (include ? 1 : 2)
    const startIdx = Math.max(0, endIdx - n + 1)
    const from = parseISO(weekStarts[startIdx])
    setDraft({ from, to: addDays(parseISO(weekStarts[endIdx]), 4) })
    setViewMonth(from)
  }
  const weekCount = weekly && draft?.from && draft?.to
    ? weekStarts.filter(w => addDays(parseISO(w), 4) >= draft.from && parseISO(w) <= draft.to).length
    : 0
  const readout = draft?.from && draft?.to
    ? `${format(draft.from, draft.from.getFullYear() === draft.to.getFullYear() ? 'MMM d' : 'MMM d, yyyy')} to ${format(draft.to, 'MMM d, yyyy')}${weekCount ? ` · ${weekCount} ${weekCount === 1 ? 'week' : 'weeks'}` : ''}`
    : draft?.from ? 'Pick an end date' : 'Pick a start date'

  // First click starts a range; second click ends it (an earlier date swaps
  // the ends); a click after a finished range starts over.
  function handleDayClick(day) {
    setDraft(d => {
      if (!d?.from || d.to) return { from: day, to: undefined }
      return day < d.from ? { from: day, to: d.from } : { from: d.from, to: day }
    })
  }
  const complete = draft?.from && draft?.to
  const pointers = weekly && complete && draft.from.getTime() !== draft.to.getTime()
  const calClassNames = pointers
    ? { ...CAL_CLASS_NAMES, range_start: `${CAL_CLASS_NAMES.range_start} ${POINTER_START}`, range_end: `${CAL_CLASS_NAMES.range_end} ${POINTER_END}` }
    : CAL_CLASS_NAMES

  return (
    <Popover.Root open={open} onOpenChange={o => { setOpen(o); if (o) { setDraft(range); setLastN(''); setViewMonth(month) } }}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={iconOnly ? 'Pick a custom date range' : undefined}
          className={cn(
            iconOnly
              ? 'inline-flex items-center justify-center h-8 w-8 rounded-md text-brand-subtext hover:bg-brand-bg transition-colors'
              : 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-md border border-brand-border bg-white text-xs font-medium text-brand-text hover:bg-brand-bg transition-colors',
            iconOnly && value === 'custom' && 'bg-dessa-tealLight text-dessa-teal hover:bg-dessa-tealLight',
            className
          )}
        >
          <CalendarIcon size={14} className={iconOnly ? undefined : 'text-brand-subtext'} aria-hidden="true" />
          {!iconOnly && label}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-50 flex bg-white border border-brand-border rounded-xl shadow-lg outline-none overflow-hidden"
        >
          {presets.length > 0 && <div className={cn('flex flex-col gap-0.5 p-2 border-r border-brand-border min-w-44', weekly && 'bg-brand-bg/60')}>
            {presets.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => { onPreset(p.value); setOpen(false) }}
                className={cn(
                  'flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors',
                  value === p.value ? 'text-dessa-teal font-medium' : weekly ? 'text-brand-text hover:bg-brand-border/50' : 'text-brand-text hover:bg-brand-bg'
                )}
              >
                {p.label}
                {value === p.value && <Check size={13} />}
              </button>
            ))}
          </div>}
          <div className="flex flex-col">
            {weekly && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-2 px-4 pt-4">
                <label className="flex items-center gap-2 text-sm text-brand-text">
                  Last
                  <input
                    type="number" min={1} max={weekStarts.length} inputMode="numeric"
                    value={lastN} placeholder="4"
                    onChange={e => pickLastWeeks(e.target.value, includeCurrent)}
                    className="w-16 h-9 px-2 rounded-md border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-subtext/60 focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                  />
                  weeks
                </label>
                <label className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
                  <Checkbox
                    checked={includeCurrent}
                    onChange={e => { setIncludeCurrent(e.target.checked); pickLastWeeks(lastN, e.target.checked) }}
                  />
                  Include current week
                </label>
              </div>
            )}
            <div className="p-4">
              <DayPicker
                mode="range"
                numberOfMonths={2}
                {...(weekly ? { month: viewMonth, onMonthChange: setViewMonth } : { defaultMonth: month })}
                startMonth={minDate}
                endMonth={maxDate}
                disabled={{ before: minDate, after: maxDate }}
                selected={draft}
                onDayClick={handleDayClick}
                classNames={calClassNames}
                components={{
                  Chevron: ({ orientation }) =>
                    orientation === 'left' ? <ChevronLeft size={15} /> : <ChevronRight size={15} />,
                }}
              />
            </div>
            <div className={cn('flex items-center px-4 py-3 border-t border-brand-border', weekly ? 'justify-between gap-6' : 'justify-end')}>
              {weekly && <p className="text-[13px] font-medium text-brand-subtext tabular-nums" aria-live="polite">{readout}</p>}
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
