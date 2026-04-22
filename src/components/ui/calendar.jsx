import { DayPicker } from 'react-day-picker'
import { cn } from '../../lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      captionLayout="dropdown"
      className={cn('p-3', className)}
      classNames={{
        months:         'flex flex-col',
        month:          'flex flex-col gap-3',
        month_caption:  'flex justify-center items-center relative pt-1 h-7',
        caption_label:  'hidden',
        dropdowns:      'flex items-center gap-1',
        dropdown:       'text-sm font-semibold text-brand-text bg-transparent border-none cursor-pointer focus:outline-none',
        dropdown_root:  'relative',
        nav:            'flex items-center absolute inset-x-0 top-0 justify-between px-0 pointer-events-none',
        button_previous:'pointer-events-auto p-1 rounded border border-brand-border bg-white hover:bg-brand-bg text-brand-subtext transition-colors',
        button_next:    'pointer-events-auto p-1 rounded border border-brand-border bg-white hover:bg-brand-bg text-brand-subtext transition-colors',
        month_grid:     'w-full border-collapse',
        weekdays:       'flex',
        weekday:        'text-brand-subtext w-8 text-center text-[0.75rem] font-normal pb-1',
        week:           'flex w-full mt-1',
        day:            'relative p-0 text-center text-sm focus-within:relative focus-within:z-20',
        day_button:     'h-8 w-8 p-0 rounded-md hover:bg-brand-bg transition-colors text-brand-text text-sm mx-auto flex items-center justify-center font-normal',
        selected:       '[&>button]:!bg-dessa-teal [&>button]:!text-white [&>button]:hover:!bg-dessa-teal',
        today:          '[&>button]:border [&>button]:border-dessa-teal/50 [&>button]:text-dessa-teal [&>button]:font-semibold',
        outside:        '[&>button]:text-brand-subtext/30',
        disabled:       '[&>button]:text-brand-subtext/25 [&>button]:cursor-default [&>button]:hover:bg-transparent',
        hidden:         'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left'
            ? <ChevronLeft size={13} />
            : <ChevronRight size={13} />,
      }}
      {...props}
    />
  )
}
