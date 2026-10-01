import { motion } from 'framer-motion'
import { Search, X, CheckCircle2, Circle, ChevronDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { DCE_SITES, todayLabel, sinceLabel, sinceTone } from '../../lib/dceData'

// Page shell + header card shared by the Site Leader concepts (B, C, D).
export function DcePage({ children }) {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="px-6 pt-8 pb-8">
      {children}
    </motion.div>
  )
}

export function DceHeader({ site, onSite, search, onSearch, summary, children }) {
  return (
    <div className="bg-white rounded-xl border border-brand-border p-5 mb-6">
      <div className="flex items-start justify-between gap-6 mb-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-brand-text">Daily Curriculum Engagement</h1>
          <p className="text-sm text-brand-subtext mt-1">{todayLabel()}. A lesson counts as completed when a teacher marks it complete or watches at least 60% of its video.</p>
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-xs font-semibold uppercase tracking-wide text-brand-subtext">Site</span>
          <span className="relative">
            <select
              value={site}
              onChange={(e) => onSite(e.target.value)}
              className="appearance-none h-10 pl-3 pr-9 text-sm rounded-md border border-brand-border bg-white text-brand-text hover:border-dessa-teal/50 focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            >
              {DCE_SITES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
          </span>
        </label>
        <div className="relative flex-1 min-w-48 max-w-sm">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search teachers"
            aria-label="Search teachers"
            className="w-full h-10 pl-9 pr-8 text-sm rounded-md border border-brand-border bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
          />
          {search && (
            <button type="button" onClick={() => onSearch('')} aria-label="Clear search" className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext hover:text-brand-text">
              <X size={14} />
            </button>
          )}
        </div>
        {summary && <p className="ml-auto text-sm text-brand-text pb-2.5">{summary}</p>}
      </div>
      {children}
    </div>
  )
}

export function StatusCell({ done }) {
  return done ? (
    <span className="inline-flex items-center gap-1.5 text-sm text-brand-text">
      <CheckCircle2 size={16} className="text-dessa-teal" aria-hidden="true" />Completed
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-sm text-brand-subtext">
      <Circle size={16} aria-hidden="true" />Not yet
    </span>
  )
}

const TONE_DOT = { high: 'bg-state-error', medium: 'bg-state-warning', none: 'bg-transparent' }

export function SinceCell({ since }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-brand-text">
      <span className={`w-1.5 h-1.5 rounded-full ${TONE_DOT[sinceTone(since)]}`} aria-hidden="true" />
      {sinceLabel(since)}
    </span>
  )
}

export function SortHead({ label, col, sort, onSort }) {
  const active = sort.key === col
  return (
    <button
      type="button"
      onClick={() => onSort(col)}
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className="inline-flex items-center gap-1 font-semibold text-brand-text hover:text-dessa-teal transition-colors"
    >
      {label}
      {active && (sort.dir === 'asc' ? <ArrowUp size={13} /> : <ArrowDown size={13} />)}
    </button>
  )
}

export function Pager({ page, pageSize, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  if (total <= pageSize) return null
  const from = (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  const btn = 'h-8 w-8 inline-flex items-center justify-center rounded-md border border-brand-border text-brand-text hover:bg-brand-bg disabled:opacity-40 disabled:hover:bg-transparent'
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-brand-border">
      <p className="text-sm text-brand-subtext">Showing {from} to {to} of {total}</p>
      <div className="flex items-center gap-2">
        <button type="button" className={btn} disabled={page <= 1} onClick={() => onPage(page - 1)} aria-label="Previous page"><ChevronLeft size={15} /></button>
        <span className="text-sm text-brand-subtext">Page {page} of {pages}</span>
        <button type="button" className={btn} disabled={page >= pages} onClick={() => onPage(page + 1)} aria-label="Next page"><ChevronRight size={15} /></button>
      </div>
    </div>
  )
}

export function EmptyRoster() {
  return (
    <div className="py-14 text-center">
      <p className="text-sm font-semibold text-brand-text">No teachers match</p>
      <p className="text-sm text-brand-subtext mt-1">Try a different name or switch to another filter.</p>
    </div>
  )
}
