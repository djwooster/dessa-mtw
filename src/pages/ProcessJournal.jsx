import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Quote } from 'lucide-react'
import { PROCESS_JOURNAL_ENTRIES, STATUSES } from '../lib/processJournalData'

// ─── Process Journal ────────────────────────────────────────────────────────
// Editorial one-off page (2026-09-12), sibling to /user-feedback and
// /competitive-analysis — same black/white/research-accent palette, since
// this is also a document the designer shares with their manager rather
// than a product surface. Unlike those two (fixed, numbered sections with a
// scroll-spy rail), this is an open-ended, growing chronological feed — a
// "process journal" of what got built/iterated/shipped/shelved — so it uses
// a timeline layout instead of the rail, and paginates via a simple
// IntersectionObserver "load more on scroll" rather than a fixed section
// list, since new entries get appended over time (see
// processJournalData.js). Content is written up from the actual session
// history, not generated from raw git log — commit messages aren't meant
// for an outside audience.

const reveal = (i = 0) => ({
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.4, delay: Math.min(i, 4) * 0.05 },
})

function Kicker({ children }) {
  return (
    <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-research-accent mb-3">
      {children}
    </p>
  )
}

function StatusBadge({ status }) {
  const meta = STATUSES[status]
  return (
    <span className={`inline-flex items-center font-sans text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
      {meta.label}
    </span>
  )
}

function formatDateRange(start, end) {
  const opts = { month: 'short', day: 'numeric', year: 'numeric' }
  const s = new Date(`${start}T00:00:00`).toLocaleDateString('en-US', opts)
  if (!end) return s
  const e = new Date(`${end}T00:00:00`).toLocaleDateString('en-US', opts)
  return `${s} – ${e}`
}

// Screenshot placeholder: shows the real image once it exists at
// public/process-journal/<entryId>/<n>.jpg; until then, falls back to a
// bordered box naming the expected path — same convention as
// CompetitiveAnalysis's Screenshot, so dropping real photos in later
// requires zero code changes.
function Screenshot({ entryId, n, alt }) {
  const [failed, setFailed] = useState(false)
  const path = `process-journal/${entryId}/${n}.jpg`
  if (failed) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 aspect-[16/9] flex flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-sans text-sm text-gray-400">Screenshot not added yet</p>
        <code className="font-mono text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-2 py-1">
          public/{path}
        </code>
      </div>
    )
  }
  return (
    <img
      src={`/${path}`}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full rounded-lg border border-gray-200"
    />
  )
}

function JournalEntry({ entry, index }) {
  return (
    <motion.div id={entry.id} className="relative scroll-mt-24" {...reveal(index)}>
      <span className="absolute -left-[2.28rem] top-1.5 w-2.5 h-2.5 rounded-full bg-black ring-4 ring-white" />
      <div className="flex items-center gap-3 mb-3">
        <StatusBadge status={entry.status} />
        <span className="font-sans text-xs uppercase tracking-wider text-gray-400">
          {formatDateRange(entry.date, entry.dateEnd)}
        </span>
      </div>
      <h2 className="font-sans text-2xl font-semibold text-black mb-2">{entry.title}</h2>
      <p className="font-sans text-base text-gray-700 leading-relaxed mb-5 max-w-2xl">{entry.summary}</p>
      {entry.screenshots?.length > 0 && (
        <div className={`grid gap-4 mb-5 max-w-2xl ${entry.screenshots.length > 1 ? 'sm:grid-cols-2' : ''}`}>
          {entry.screenshots.map((s) => (
            <Screenshot key={s.n} entryId={entry.id} n={s.n} alt={s.alt} />
          ))}
        </div>
      )}
      <div className="space-y-3 max-w-2xl">
        {entry.body.map((p, i) => (
          <p key={i} className="font-sans text-sm text-gray-500 leading-relaxed">{p}</p>
        ))}
      </div>
    </motion.div>
  )
}

const PAGE_SIZE = 4

export default function ProcessJournal() {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef(null)
  const hasMore = visibleCount < PROCESS_JOURNAL_ENTRIES.length

  useEffect(() => {
    if (!hasMore) return
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (observed) => {
        if (observed[0].isIntersecting) {
          setVisibleCount((c) => Math.min(c + PAGE_SIZE, PROCESS_JOURNAL_ENTRIES.length))
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore])

  const visibleEntries = PROCESS_JOURNAL_ENTRIES.slice(0, visibleCount)

  return (
    <div className="bg-white min-h-[calc(100vh-3.5rem)]">
      <div className="max-w-3xl mx-auto px-6 md:px-10 py-16">
        {/* ── Masthead ── */}
        <motion.div {...reveal(0)}>
          <Kicker>Process Journal</Kicker>
          <h1 className="font-sans text-[34px] font-semibold text-black leading-[1.2] max-w-2xl">
            What we've built, iterated on, and shipped
          </h1>
          <p className="font-sans text-lg text-gray-500 mt-5 max-w-2xl">
            A running record of this prototype's process, written up from the actual working
            sessions rather than the commit log, so it's easy to walk through live instead of
            describing it from memory.
          </p>
          <div className="flex items-center gap-3 mt-8 font-sans text-xs uppercase tracking-wider text-gray-400">
            <span>DJ Wooster</span>
            <span className="w-1 h-1 rounded-full bg-gray-400" />
            <span>UX Design, Riverside Insights</span>
            <span className="w-1 h-1 rounded-full bg-gray-400" />
            <span>Updated as we go</span>
          </div>
        </motion.div>

        {/* ── Timeline feed ── */}
        <div className="relative mt-16 pl-8 border-l border-gray-200 space-y-16">
          {visibleEntries.map((entry, i) => (
            <JournalEntry key={entry.id} entry={entry} index={i} />
          ))}
        </div>

        {hasMore && <div ref={sentinelRef} className="h-10" aria-hidden="true" />}

        {/* ── Footer ── */}
        <motion.div {...reveal(1)} className="flex items-start gap-3 mt-16">
          <Quote size={16} className="text-research-accent shrink-0 mt-1" />
          <p className="font-sans text-xs text-gray-500 leading-relaxed max-w-2xl">
            New entries get added here as work happens — this isn't a one-time historical dump, it's
            meant to stay current.
          </p>
        </motion.div>
      </div>
    </div>
  )
}
