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
        months:          'flex flex-col',
        month:           'space-y-3',
        month_caption:   'relative flex justify-center items-center h-9',
        caption_label:   'hidden',
        dropdowns:       'flex items-center gap-1',
        dropdown:        'text-sm font-semibold text-brand-text bg-transparent border-none cursor-pointer focus:outline-none',
        dropdown_root:   'relative',
        nav:             '',
        button_previous: 'absolute left-1 h-7 w-7 flex items-center justify-center rounded-md hover:bg-brand-bg text-brand-subtext hover:text-brand-text transition-colors',
        button_next:     'absolute right-1 h-7 w-7 flex items-center justify-center rounded-md hover:bg-brand-bg text-brand-subtext hover:text-brand-text transition-colors',
        month_grid:      'w-full border-collapse',
        weekdays:        'flex',
        weekday:         'w-9 h-9 text-center text-[0.8rem] font-normal text-brand-subtext/70 flex items-center justify-center',
        week:            'flex w-full',
        day:             'relative p-0 text-center',
        day_button:      'h-9 w-9 rounded-md hover:bg-brand-bg transition-colors text-brand-text text-sm mx-auto flex items-center justify-center font-normal',
        selected:        '[&>button]:!bg-brand-text [&>button]:!text-white',
        today:           '[&>button]:font-bold',
        outside:         '[&>button]:text-brand-subtext/30',
        disabled:        '[&>button]:opacity-30 [&>button]:cursor-not-allowed [&>button]:hover:bg-transparent',
        hidden:          'invisible',
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === 'left'
            ? <ChevronLeft size={15} />
            : <ChevronRight size={15} />,
      }}
      {...props}
    />
  )
}
