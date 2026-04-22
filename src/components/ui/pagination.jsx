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

const PaginationLink = ({ className, isActive, disabled, ...props }) => (
  <button
    aria-current={isActive ? 'page' : undefined}
    disabled={disabled}
    className={cn(
      'flex items-center justify-center rounded-md text-sm h-8 w-8 transition-colors disabled:opacity-40 disabled:cursor-default',
      isActive
        ? 'bg-dessa-teal text-white font-semibold'
        : 'text-brand-subtext hover:bg-brand-border/60 hover:text-brand-text',
      className
    )}
    {...props}
  />
)

const PaginationPrevious = ({ className, ...props }) => (
  <button
    className={cn(
      'flex items-center gap-1.5 px-3 h-8 rounded-md text-xs text-brand-subtext hover:bg-brand-border/60 hover:text-brand-text transition-colors disabled:opacity-40 disabled:cursor-default',
      className
    )}
    {...props}
  >
    <ChevronLeft size={13} />
    Previous
  </button>
)

const PaginationNext = ({ className, ...props }) => (
  <button
    className={cn(
      'flex items-center gap-1.5 px-3 h-8 rounded-md text-xs text-brand-subtext hover:bg-brand-border/60 hover:text-brand-text transition-colors disabled:opacity-40 disabled:cursor-default',
      className
    )}
    {...props}
  >
    Next
    <ChevronRight size={13} />
  </button>
)

const PaginationEllipsis = ({ className, ...props }) => (
  <span className={cn('flex h-8 w-8 items-center justify-center text-brand-subtext', className)} {...props}>
    <MoreHorizontal size={14} />
  </span>
)

export { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis }
