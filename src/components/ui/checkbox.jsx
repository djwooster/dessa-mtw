import { Check } from 'lucide-react'
import { cn } from '../../lib/utils'

// Checkbox (2026-10-08): the native input restyled, not a lookalike, so
// keyboard, focus, and screen reader behavior all come for free. The box is
// 16px with a thin border and turns dessa-teal with a white check when on.
// Pass `className` to the outer wrapper; other props go to the input.
export function Checkbox({ className, ...props }) {
  return (
    <span className={cn('relative inline-flex h-4 w-4 shrink-0', className)}>
      <input
        type="checkbox"
        className={cn(
          'peer h-4 w-4 appearance-none rounded border border-brand-subtext/50 bg-white cursor-pointer transition-colors',
          'hover:border-dessa-teal',
          'checked:bg-dessa-teal checked:border-dessa-teal',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dessa-teal/30 focus-visible:ring-offset-1',
          'disabled:cursor-not-allowed disabled:opacity-40'
        )}
        {...props}
      />
      <Check
        size={12}
        strokeWidth={3}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 m-auto text-white opacity-0 peer-checked:opacity-100 transition-opacity"
      />
    </span>
  )
}
