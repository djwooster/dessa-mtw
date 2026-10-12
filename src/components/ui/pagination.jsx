import { ChevronLeft, ChevronRight, ChevronDown, MoreHorizontal } from 'lucide-react'
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

// Which page numbers to show: first, last, and the current page with one on each side,
// with 'ellipsis' where numbers are skipped. Moved here from ResourceLibrary (2026-10-12)
// so every table uses the same logic.
export function pageWindow(current, total) {
  const shown = new Set([1, total, current - 1, current, current + 1])
  const pages = [...shown].filter(p => p >= 1 && p <= total).sort((a, b) => a - b)
  const withGaps = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) withGaps.push('ellipsis')
    withGaps.push(p)
  })
  return withGaps
}

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// The Resources page footer as one component (2026-10-12): the page numbers at the left, a rows-per-page
// select at the right. The whole footer hides when everything fits on one page at the smallest size, so
// a table with a handful of rows stays clean. Pass `className` to match the table's own padding.
function PaginationBar({ page, pageSize, total, onPage, onPageSize, className }) {
  if (total <= PAGE_SIZE_OPTIONS[0]) return null
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious aria-label="Previous page" onClick={() => onPage(Math.max(1, page - 1))} disabled={page === 1} />
          </PaginationItem>
          {pageWindow(page, totalPages).map((p, i) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${i}`}><PaginationEllipsis /></PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === page} aria-label={`Page ${p}`} onClick={() => onPage(p)}>{p}</PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext aria-label="Next page" onClick={() => onPage(Math.min(totalPages, page + 1))} disabled={page === totalPages} />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
      <div className="relative">
        <select
          value={pageSize}
          onChange={e => onPageSize(Number(e.target.value))}
          aria-label="Rows per page"
          className="appearance-none pl-3 pr-8 h-9 text-sm border border-brand-border rounded-md bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
        >
          {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" aria-hidden="true" />
      </div>
    </div>
  )
}

export { PaginationBar, Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis }
