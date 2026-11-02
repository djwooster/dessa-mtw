import { useEffect, useRef, useState } from 'react'
import * as Popover from '@radix-ui/react-popover'
import { Check, ChevronDown } from 'lucide-react'
import { COMPETENCIES } from '../../lib/contentReportData'

// "Competencies covered" card for the Content course and user pages (2026-10-27): how the whole 100% of a group's
// lessons splits across the six competencies. The 100% stacked bar is the pick; a concept dropdown in the card
// header switches to a donut for comparison (waffle, treemap, radar and the original ranked bars were cut 2026-10-27).
// The choice is remembered per browser. Competencies with no lessons are left out (no "Not yet" line, 2026-10-27).

const CONCEPTS = [
  { value: 'bar', label: '100% bar' },
  { value: 'donut', label: 'Donut' },
]
const STORE_KEY = 'content.competencyMix'
// const readConcept = () => { try { return localStorage.getItem(STORE_KEY) ?? 'bar' } catch { return 'bar' } }

const pctText = n => `${Math.round(n * 100)}%`
const describe = rows => rows.map(r => `${r.label} ${pctText(r.share)}`).join(', ')

// Hooks a box's width, for the bar's label layout.
function useWidth() {
  const ref = useRef(null)
  const [w, setW] = useState(0)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  return [ref, w]
}

// Dot, name, a share bar, share and lessons, one row per competency; used beside the donut. The bars fill the
// card's width (2026-10-29) instead of leaving it empty, scaled to the top competency so small shares still read.
function Legend({ rows }) {
  const max = Math.max(...rows.map(r => r.share))
  return (
    // Two lines per competency (2026-11-02): the name and lessons, then its bar and percent under the name.
    <ul className="flex flex-col gap-3 text-sm min-w-0">
      {rows.map(r => (
        <li key={r.key} className="min-w-0">
          <span className="flex items-center gap-1.5 min-w-0">
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: r.color }} aria-hidden="true" />
            <span className="flex-1 min-w-0 truncate text-brand-text">{r.label}</span>
            <span className="shrink-0 tabular-nums whitespace-nowrap text-brand-subtext">{r.n.toLocaleString()} {r.n === 1 ? 'lesson' : 'lessons'}</span>
          </span>
          <span className="flex items-center gap-3 mt-1.5 pl-4 min-w-0">
            <span className="flex-1 min-w-12 h-2 rounded-full bg-brand-bg overflow-hidden" aria-hidden="true">
              <span className="block h-full rounded-full" style={{ width: `${(r.share / max) * 100}%`, background: r.color }} />
            </span>
            <span className="w-10 shrink-0 text-right tabular-nums text-brand-text">{pctText(r.share)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// ─── 100% stacked bar ────────────────────────────────────────────────────────

// One bar split by share, white 2px seams, each name and share under the start of its segment. Names that would
// run into the one before move to a line under it, with their color dot.
function StackedBar({ rows }) {
  const [ref, width] = useWidth()
  let lastEnd = -Infinity
  let start = 0
  const placed = []
  const spill = []
  rows.forEach(r => {
    const left = start * width
    const need = Math.max(r.label.length * 7.2, 40) + 12
    if (width && left >= lastEnd && left + need <= width + 12) { placed.push({ ...r, left }); lastEnd = left + need } else spill.push(r)
    start += r.share
  })
  return (
    <div ref={ref}>
      <div role="img" aria-label={`Share of lessons: ${describe(rows)}`} className="flex gap-0.5 h-10 rounded-md overflow-hidden">
        {rows.map(r => <span key={r.key} title={`${r.label}, ${pctText(r.share)}`} className="h-full" style={{ width: `${r.share * 100}%`, background: r.color }} />)}
      </div>
      <div className="relative h-11 mt-2" aria-hidden="true">
        {placed.map(r => (
          <span key={r.key} className="absolute top-0 whitespace-nowrap" style={{ left: r.left }}>
            <span className="block text-sm font-medium text-brand-text">{r.label}</span>
            <span className="block text-sm text-brand-subtext tabular-nums">{pctText(r.share)}</span>
          </span>
        ))}
      </div>
      {spill.length > 0 && (
        <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm" aria-hidden="true">
          {spill.map(r => (
            <li key={r.key} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: r.color }} />
              <span className="font-medium text-brand-text">{r.label}</span>
              <span className="text-brand-subtext tabular-nums">{pctText(r.share)}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ─── Donut ───────────────────────────────────────────────────────────────────

// `stacked` puts the legend under the donut, for a narrow column (concept C's shared card, 2026-11-02).
function Donut({ rows, total, stacked }) {
  const r = 60
  const c = 2 * Math.PI * r
  const gap = rows.length > 1 ? 2 : 0
  let offset = 0
  return (
    <div className={`flex flex-col items-center ${stacked ? 'gap-6' : 'sm:flex-row gap-8'}`}>
      <div className="relative w-44 h-44 shrink-0">
        <svg viewBox="0 0 160 160" className="w-full h-full -rotate-90" role="img" aria-label={`Share of lessons: ${describe(rows)}`}>
          {rows.map(row => {
            const len = row.share * c
            const el = <circle key={row.key} cx="80" cy="80" r={r} fill="none" stroke={row.color} strokeWidth="22" strokeDasharray={`${Math.max(0, len - gap)} ${c}`} strokeDashoffset={-offset} />
            offset += len
            return el
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className="text-2xl font-semibold text-brand-text tabular-nums">{total.toLocaleString()}</span>
          <span className="text-xs text-brand-subtext">lessons</span>
        </div>
      </div>
      <div className="flex-1 min-w-0 w-full"><Legend rows={rows} /></div>
    </div>
  )
}

// ─── Card ────────────────────────────────────────────────────────────────────

function ConceptSelect({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const current = CONCEPTS.find(c => c.value === value) ?? CONCEPTS[0]
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" aria-label={`Chart concept: ${current.label}`} className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-brand-border bg-white text-sm text-brand-text whitespace-nowrap shrink-0 hover:bg-brand-bg transition-colors">
          {current.label}
          <ChevronDown size={16} className="text-brand-subtext" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="z-50 w-44 bg-white border border-brand-border rounded-lg shadow-lg outline-none py-1">
          <div role="listbox" aria-label="Chart concept">
            {CONCEPTS.map(c => (
              <button
                key={c.value} type="button" role="option" aria-selected={c.value === value}
                onClick={() => { onChange(c.value); setOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-brand-bg ${c.value === value ? 'text-dessa-teal font-medium' : 'text-brand-text'}`}
              >
                {c.label}
                {c.value === value && <Check size={14} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// `totals` is { competencyKey: lessons }.
// The donut is the pick (2026-11-02): the 100% bar and the concept dropdown are commented out, and a remembered
// "bar" choice is ignored.
// `bare` drops the card's own border, for sitting inside another card; `stacked` is the donut's narrow layout.
// `divided` runs a line under the header, edge to edge, level with the list card beside it (concept C, 2026-11-02).
export default function CompetencyMix({ totals, title = 'Competencies covered', bare = false, stacked = false, divided = false }) {
  // const [concept, setConcept] = useState(readConcept)
  // const choose = v => { setConcept(v); try { localStorage.setItem(STORE_KEY, v) } catch { /* private window */ } }
  const total = Object.values(totals).reduce((a, b) => a + b, 0)
  const all = COMPETENCIES.map(c => ({ ...c, n: totals[c.key] ?? 0, share: total ? (totals[c.key] ?? 0) / total : 0 }))
  const rows = all.filter(r => r.n > 0).sort((a, b) => b.n - a.n)
  // const View = concept === 'donut' ? Donut : StackedBar
  const View = Donut

  return (
    <section className={`${bare ? '' : 'bg-white rounded-lg border border-brand-border '}${divided ? '' : 'p-5'}`}>
      {/* min-h-9 keeps the title level with a card header that has a control (concept C's list card, 2026-11-02). */}
      <div className={divided ? 'px-5 pt-5 pb-4 border-b border-brand-border' : 'mb-4'}>
        <div className="flex items-center justify-between gap-4 min-h-9">
          <h3 className="text-base font-semibold text-brand-text">{title}</h3>
          {/* <ConceptSelect value={concept} onChange={choose} /> */}
        </div>
      </div>
      <div className={divided ? 'p-5' : ''}>
        {total ? (
          <View rows={rows} total={total} stacked={stacked} />
        ) : <p className="text-sm text-brand-subtext">No lessons in these dates yet.</p>}
      </div>
    </section>
  )
}
