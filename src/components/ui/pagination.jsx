import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { cn } from '../../lib/utils'

const Pagination = ({ className, ...props }) => (
  <nav role="navigation" aria-label="pagination" className={cn('flex items-center', className)} {...props} />
)

const PaginationContent = ({ className, ...props }) => (
  <ul className={cn('flex flex-row items-center gap-1', className)} {...props} />
)

const PaginationItem = ({ className, ...props }) => (
  <li className={cn('', className)} {...props} />
)

// Canonical pagination look (2026-09-02, cemented from the real DESSA
// product's own pagination) — the active page is the only one that gets a
// filled rounded-square background; every other page is plain bold text,
// no box even at rest. Applies across Resources, Family Access Codes,
// Report1C, and Curriculum Setup — a page only needs to pass a className
// here if it genuinely needs to deviate from the default.
const PaginationLink = ({ className, isActive, disabled, ...props }) => (
  <button
    aria-current={isActive ? 'page' : undefined}
    disabled={disabled}
    className={cn(
      'flex items-center justify-center rounded-lg text-sm h-9 w-9 font-semibold transition-colors disabled:opacity-40 disabled:cursor-default',
      isActive
        ? 'bg-dessa-teal text-white'
        : 'text-brand-text hover:bg-brand-bg',
      className
    )}
    {...props}
  />
)

// Icon-only by default (no "Previous"/"Next" label) — a muted teal chevron
// with no visible border/background at rest, per the same reference. Pass
// children to opt back into a labeled button where that reads better.
const PaginationPrevious = ({ className, children, ...props }) => (
  <button
    className={cn(
      'flex items-center justify-center gap-1.5 h-9 w-9 rounded-lg text-dessa-teal transition-colors hover:bg-brand-bg disabled:opacity-40 disabled:cursor-default',
      className
    )}
    {...props}
  >
    <ChevronLeft size={16} />
    {children}
  </button>
)

const PaginationNext = ({ className, children, ...props }) => (
  <button
    className={cn(
      'flex items-center justify-center gap-1.5 h-9 w-9 rounded-lg text-dessa-teal transition-colors hover:bg-brand-bg disabled:opacity-40 disabled:cursor-default',
      className
    )}
    {...props}
  >
    {children}
    <ChevronRight size={16} />
  </button>
)

const PaginationEllipsis = ({ className, ...props }) => (
  <span className={cn('flex h-9 w-9 items-center justify-center text-brand-subtext', className)} {...props}>
    <MoreHorizontal size={14} />
  </span>
)

export { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis }
