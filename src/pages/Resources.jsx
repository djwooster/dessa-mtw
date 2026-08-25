import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as Popover from '@radix-ui/react-popover'
import {
  Search, X, Video, FileText, Mic, ChevronDown,
  ClipboardList, Star, Check, ImagePlus,
} from 'lucide-react'
import {
  resources, CATEGORIES, TYPES, ALL_GRADES, ALL_COMPETENCIES, courseFor,
} from '../lib/resourcesData'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '../components/ui/pagination'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

// Simple placeholder: lucide icon over a low-opacity colored rectangle.
const TYPE_META = {
  video: { icon: Video, label: 'Video', color: 'text-dessa-magenta', bg: 'bg-dessa-magenta' },
  pdf: { icon: FileText, label: 'PDF', color: 'text-mtw-purple', bg: 'bg-mtw-purple' },
  worksheets: { icon: ClipboardList, label: 'Worksheet', color: 'text-mtw-coral', bg: 'bg-mtw-coral' },
  audio: { icon: Mic, label: 'Audio', color: 'text-mtw-blue', bg: 'bg-mtw-blue' },
}

// Small round icon badge — stands in for the "author avatar" slot in the
// card-list reference this row/card layout is based on, using our real
// type data instead of an invented person.
function TypeIconBadge({ type, size = 28 }) {
  const { icon: Icon, color, bg } = TYPE_META[type]
  return (
    <span
      className={`flex items-center justify-center rounded-full ${bg} bg-opacity-15 shrink-0`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.45)} className={color} />
    </span>
  )
}

// Tinted, borderless pill with a small icon + label — the file-type equivalent
// of the "status badge" pattern (e.g. a colored "Bookmarked" or "Flagged"
// chip), so type reads as a labeled category rather than an abstract icon.
function TypeBadge({ type }) {
  const { icon: Icon, color, bg, label } = TYPE_META[type]
  return (
    <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-[5px] ${bg} bg-opacity-10 ${color} shrink-0`}>
      <Icon size={14} />
      <span className="text-xs font-medium">{label}</span>
    </span>
  )
}

// Concept 3's sortable table column header — click toggles asc/desc on that
// field, chevron only turns teal/flips when it's the active sort column.
function SortButton({ label, field, sortKey, sortDir, onSort }) {
  const active = sortKey === field
  return (
    <button onClick={() => onSort(field)} className="flex items-center gap-1 hover:text-brand-text transition-colors">
      {label}
      <ChevronDown
        size={12}
        className={`transition-transform ${active ? 'text-dessa-teal' : 'text-brand-subtext/50'} ${
          active && sortDir === 'desc' ? 'rotate-180' : ''
        }`}
      />
    </button>
  )
}

// Adult Wellness lesson titles are authored with an "Independent: " prefix
// (they're self-guided, as opposed to facilitated) — useful in the source
// data but redundant noise in a resource list, so strip it for display only.
function displayTitle(title) {
  return title.replace(/^Independent:\s*/, '')
}

const PAGE_SIZE = 20

function FacetGroup({ title, options, selected, onToggle, scrollable, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-brand-border last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-brand-bg transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-brand-text">
          {title}
          {selected.length > 0 && (
            <span className="flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[11px] font-semibold bg-dessa-teal text-white">
              {selected.length}
            </span>
          )}
        </span>
        <ChevronDown size={14} className={`text-brand-subtext shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`flex flex-col pb-3 ${scrollable ? 'max-h-48 overflow-y-auto' : ''}`}>
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2.5 px-4 py-1.5 text-sm text-brand-text cursor-pointer hover:bg-brand-bg transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="accent-dessa-teal w-3.5 h-3.5"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// Windowed page list (first, last, current ±1) with gaps marked by '…' —
// results can span 100+ pages, so listing every page number isn't viable.
function pageWindow(current, total) {
  const shown = new Set([1, total, current - 1, current, current + 1])
  const pages = [...shown].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const withGaps = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) withGaps.push('ellipsis')
    withGaps.push(p)
  })
  return withGaps
}

// Concept 3's blocking grade gate — replaces the search-bar combobox
// entirely for this concept. Selection is staged in local `pending` state
// (not written to selectedGrades until "View Resources" is pressed) so
// picking several pills doesn't close the modal after the first tap; the
// component unmounts on confirm and remounts fresh if grades are later
// cleared back to zero (e.g. via the sidebar facet), which is what resets
// `pending` — no extra effect/sync needed.
function GradeGateModal({ onConfirm }) {
  const [pending, setPending] = useState([])
  const [imgErrored, setImgErrored] = useState(false)

  function togglePending(grade) {
    setPending((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]))
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-dessa-navy/50 backdrop-blur-sm p-6">
      <div className="w-full max-w-xl max-h-[85vh] overflow-y-auto bg-white rounded-3xl shadow-2xl p-8 sm:p-10">
        <div className="flex flex-col items-center text-center mb-7">
          {/* Lives at public/Yearly Setup/search-modal.svg. Sized small and
              capped so a wide or tall illustration still sits proportionally
              in the modal rather than dominating it. */}
          {!imgErrored ? (
            <img
              src="/Yearly%20Setup/search-modal.svg"
              alt=""
              onError={() => setImgErrored(true)}
              className="h-20 w-auto max-w-[160px] object-contain mb-5"
            />
          ) : (
            <div className="h-20 w-20 mb-5 rounded-2xl bg-brand-bg flex flex-col items-center justify-center gap-1 shrink-0">
              <ImagePlus size={18} className="text-brand-subtext" />
              <code className="text-[8px] font-mono text-brand-subtext/70 text-center leading-tight">
                search-modal.svg
              </code>
            </div>
          )}
          <h2 className="text-xl font-semibold text-brand-text mb-1.5">Select a grade level</h2>
          <p className="text-sm text-brand-subtext max-w-sm">
            Choose one or more grades to see the resources built for them.
          </p>
        </div>

        <div className="flex flex-wrap justify-start gap-2 mb-8">
          {ALL_GRADES.map((grade) => {
            const active = pending.includes(grade)
            return (
              <button
                key={grade}
                type="button"
                onClick={() => togglePending(grade)}
                className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors ${
                  active
                    ? 'border-2 border-dessa-teal bg-dessa-tealLight text-dessa-teal'
                    : 'border-2 border-dashed border-brand-border text-brand-subtext hover:border-dessa-teal/50 hover:text-brand-text'
                }`}
              >
                {grade}
              </button>
            )
          })}
        </div>

        <button
          type="button"
          disabled={pending.length === 0}
          onClick={() => onConfirm(pending)}
          className="w-full h-12 rounded-full text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors disabled:bg-brand-border disabled:text-brand-subtext disabled:hover:bg-brand-border"
        >
          View Resources
        </button>
      </div>
    </div>
  )
}

export default function Resources() {
  const navigate = useNavigate()
  // Design-review toggle set via the select in Nav (Resources-only) — lets a
  // reviewer flip between two grade-picker layout concepts on the same data.
  const [searchParams] = useSearchParams()
  const concept = searchParams.get('concept') || '1'
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  // A set of grades, driven by two controls that both read/write it: the
  // top combobox (a quick-pick — choosing one grade replaces the whole set
  // with just that grade; "All Grades" checks every box) and the sidebar's
  // Grade facet (ordinary multi-select, like the other facets, so any
  // combination — e.g. just Grade 2 + Grade 4 — is possible). Empty =
  // nothing picked yet (empty state, unless a search is submitted — see
  // `q` below, which bypasses the gate and searches every grade).
  const [selectedGrades, setSelectedGrades] = useState([])
  const [gradeMenuOpen, setGradeMenuOpen] = useState(false)
  const [gradeQuery, setGradeQuery] = useState('')
  const [selectedCompetencies, setSelectedCompetencies] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  // Sort — drives both the header "Sort" dropdown (concepts 1/2's list rows)
  // and Concept 3's clickable table columns; same state either way, so the
  // dropdown and column headers always agree on what's active.
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  // Saved/starred resources — Map value is the representative resource, so
  // the sidebar panel can render + navigate without re-deriving it from
  // current filters. (Currently unreachable: the star button that adds to
  // this is commented out below, see "star button disabled for now".)
  const [savedKeys, setSavedKeys] = useState(() => new Map())

  function toggleSaved(e, key, representative) {
    e.stopPropagation()
    setSavedKeys((prev) => {
      const next = new Map(prev)
      if (next.has(key)) next.delete(key)
      else next.set(key, representative)
      return next
    })
  }

  // Scoped to selectedGrades first — with no grades chosen AND no search
  // submitted there's nothing to show, by design, so a resource shared
  // across grades never surfaces that fact side by side in the same view.
  // An empty set otherwise means "no grade constraint" — covers both the
  // explicit "All Grades" pick (every box checked) and a submitted search
  // before any grade was picked (bypasses the gate and searches every
  // grade — see `showGradeColumn` below for how those rows disclose grade).
  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (selectedGrades.length === 0 && !q) return []
    return resources.filter((r) =>
      (selectedGrades.length === 0 || selectedGrades.includes(r.grade)) &&
      (!q || r.title.toLowerCase().includes(q)) &&
      (selectedCategories.length === 0 || selectedCategories.includes(r.category)) &&
      (selectedCompetencies.length === 0 || selectedCompetencies.includes(r.competency)) &&
      (selectedTypes.length === 0 || selectedTypes.includes(r.type))
    )
  }, [selectedGrades, q, selectedCategories, selectedCompetencies, selectedTypes])

  // Rows disclose their own grade whenever the result set can legitimately
  // span more than one grade: exactly one grade selected is the only case
  // that doesn't need it (0 selected, or 2+ selected via either control).
  const showGradeColumn = selectedGrades.length !== 1

  // Concept 1/2's card-list clusters multi-grade result sets into "Grade X"
  // divider rows per grade instead of a per-row grade tag — whether that's
  // an explicit multi-select, "All Grades", or a grade-less search. Concept
  // 3's table keeps its Grade column and is intentionally left out of this.
  const groupByGrade = concept !== '3' && showGradeColumn

  // Reset to page 1 whenever the filter set or page size changes — adjusted
  // during render (not in an effect) so it takes effect in the same commit.
  const filterKey = JSON.stringify([selectedGrades, query, selectedCategories, selectedCompetencies, selectedTypes, pageSize])
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  // Shared across all three concepts — Concept 3's column headers and the
  // header "Sort" dropdown (1/2/3) both read/write the same sortKey/sortDir.
  const sortedFiltered = useMemo(() => {
    let result = filtered
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let cmp = 0
        if (sortKey === 'title') cmp = displayTitle(a.title).localeCompare(displayTitle(b.title))
        else if (sortKey === 'type') cmp = TYPE_META[a.type].label.localeCompare(TYPE_META[b.type].label)
        else if (sortKey === 'competency') cmp = a.competency.localeCompare(b.competency)
        else if (sortKey === 'grade') cmp = ALL_GRADES.indexOf(a.grade) - ALL_GRADES.indexOf(b.grade)
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    // Grade always wins as the primary sort when grouping is active — a
    // stable sort (guaranteed by spec) preserves whatever order the chosen
    // sort above already produced within each grade.
    if (groupByGrade) {
      result = [...result].sort((a, b) => ALL_GRADES.indexOf(a.grade) - ALL_GRADES.indexOf(b.grade))
    }
    return result
  }, [filtered, sortKey, sortDir, groupByGrade])

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize))
  const pagedResults = sortedFiltered.slice((page - 1) * pageSize, page * pageSize)

  // Grade sort is only meaningful once rows can span more than one grade —
  // with a single grade selected every row already shares it.
  const sortOptions = [
    { key: null, dir: 'asc', label: 'Relevance' },
    { key: 'title', dir: 'asc', label: 'Title (A–Z)' },
    { key: 'title', dir: 'desc', label: 'Title (Z–A)' },
    { key: 'competency', dir: 'asc', label: 'Competency (A–Z)' },
    { key: 'type', dir: 'asc', label: 'Type (A–Z)' },
    ...(showGradeColumn ? [{ key: 'grade', dir: 'asc', label: 'Grade' }] : []),
  ]
  const activeSortLabel = sortOptions.find((o) => o.key === sortKey && (o.key === null || o.dir === sortDir))?.label
    ?? 'Sort'

  function renderSortMenu() {
    return (
      <Popover.Root open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="shrink-0 flex items-center gap-1.5 pl-2 pr-2 h-9 text-[13px] font-medium border border-brand-border rounded-md bg-white text-brand-text hover:bg-brand-bg transition-colors"
          >
            Sort: {activeSortLabel}
            <ChevronDown size={13} className="text-brand-subtext" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            className="z-30 w-52 bg-white border border-brand-border rounded-xl shadow-lg outline-none overflow-hidden py-1"
          >
            {sortOptions.map((opt) => {
              const active = opt.key === sortKey && (opt.key === null || opt.dir === sortDir)
              return (
                <button
                  key={opt.label}
                  onClick={() => {
                    setSortKey(opt.key)
                    setSortDir(opt.dir)
                    setSortMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    active ? 'text-dessa-teal font-semibold bg-dessa-tealLight' : 'text-brand-text hover:bg-brand-bg'
                  }`}
                >
                  {opt.label}
                  {active && <Check size={14} />}
                </button>
              )
            })}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    )
  }

  const gradeChoices = [{ value: 'ALL', label: 'All Grades' }, ...ALL_GRADES.map((g) => ({ value: g, label: g }))]
  const filteredGradeChoices = gradeQuery.trim()
    ? gradeChoices.filter((o) => o.label.toLowerCase().includes(gradeQuery.trim().toLowerCase()))
    : gradeChoices
  // The combobox is a quick-pick, not the sole source of truth — it can only
  // ever land the set in one of two states (a single grade, or every grade),
  // so its label falls back to a generic count once the sidebar's Grade
  // facet has put the set into some other combination (e.g. 2 of 6 checked).
  const selectedGradeLabel =
    selectedGrades.length === 0
      ? 'Select grade'
      : selectedGrades.length === ALL_GRADES.length
      ? 'All Grades'
      : selectedGrades.length === 1
      ? selectedGrades[0]
      : `${selectedGrades.length} grades selected`

  function pickGrade(value) {
    setSelectedGrades(value === 'ALL' ? [...ALL_GRADES] : [value])
    setGradeMenuOpen(false)
    setGradeQuery('')
  }

  function clearGrade(e) {
    e.stopPropagation()
    setSelectedGrades([])
    setGradeMenuOpen(false)
    setGradeQuery('')
  }

  // Shared between Concept 1 (lives in the search bar) and Concept 2 (lives
  // centered in the empty state, then relocates to the card's top-right once
  // a grade is picked) so both concepts drive the exact same picker state.
  function renderGradeCombobox(wrapperClassName) {
    return (
      <div className={wrapperClassName}>
        <Popover.Root open={gradeMenuOpen} onOpenChange={setGradeMenuOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              className="w-full flex items-center gap-1 pl-4 pr-7 h-11 text-sm border border-brand-border rounded-full bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal transition-colors"
            >
              <span className={`flex-1 truncate text-left ${selectedGrades.length > 0 ? 'text-brand-text' : 'text-brand-subtext'}`}>
                {selectedGradeLabel}
              </span>
              {selectedGrades.length === 0 && <ChevronDown size={14} className="shrink-0 text-brand-subtext" />}
            </button>
          </Popover.Trigger>
          <Popover.Portal>
            <Popover.Content
              align="start"
              sideOffset={8}
              className="z-30 w-64 bg-white border border-brand-border rounded-xl shadow-lg outline-none overflow-hidden"
            >
              <div className="p-2 border-b border-brand-border">
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
                  <input
                    autoFocus
                    type="text"
                    value={gradeQuery}
                    onChange={(e) => setGradeQuery(e.target.value)}
                    placeholder="Search grades"
                    className="w-full pl-7 pr-2 h-8 text-sm rounded-md border border-brand-border focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                  />
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {filteredGradeChoices.length === 0 ? (
                  <p className="px-3 py-3 text-xs text-brand-subtext text-center">No matches</p>
                ) : (
                  filteredGradeChoices.map((opt) => {
                    const active =
                      opt.value === 'ALL'
                        ? selectedGrades.length === ALL_GRADES.length
                        : selectedGrades.length === 1 && selectedGrades[0] === opt.value
                    return (
                      <button
                        key={opt.value}
                        onClick={() => pickGrade(opt.value)}
                        className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                          active ? 'bg-dessa-tealLight text-dessa-teal font-semibold' : 'text-brand-text hover:bg-brand-bg'
                        }`}
                      >
                        {opt.label}
                      </button>
                    )
                  })
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        {selectedGrades.length > 0 && (
          <button
            onClick={clearGrade}
            aria-label="Clear grade selection"
            className="absolute top-1/2 -translate-y-1/2 right-3.5 text-brand-subtext hover:text-brand-text transition-colors"
          >
            <X size={15} />
          </button>
        )}
      </div>
    )
  }

  function toggle(setFn, value) {
    setFn((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  function clearAll() {
    setSearch('')
    setQuery('')
    setSelectedCategories([])
    setSelectedCompetencies([])
    setSelectedTypes([])
  }

  function submitSearch() {
    setQuery(search)
  }

  function openResource(r) {
    const course = courseFor(r)
    if (course) navigate('/mtw/lesson', { state: { course } })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-screen-xl mx-auto px-6 pb-16"
    >
      {/* Concept 3 only — a hard gate, not just an empty state: the modal's
          backdrop (z-[100], above the sticky search bar and nav) blocks
          interaction with the whole page, including a submitted search,
          until at least one grade is confirmed. Reappears automatically if
          the sidebar's Grade facet is later cleared back to zero. */}
      {concept === '3' && selectedGrades.length === 0 && (
        <GradeGateModal onConfirm={(grades) => setSelectedGrades(grades)} />
      )}

      {/* Top bar — eBay-style: a compact search container, a category row
          directly beneath it, then the results content below that. Light
          gray instead of a bold hero color so it reads as a utility bar,
          not a banner. Search and categories are separate full-bleed bands
          so each gets its own edge-to-edge divider rather than one border
          shared (and visually mis-attributed) across both. */}
      {/* Sticky right under the nav (top-14 = nav's h-14) so the query stays
          visible while scrolling through a long results list. */}
      <div className="w-screen mx-[calc(50%-50vw)] bg-brand-bg border-b border-brand-border sticky top-14 z-40">
      <div className="max-w-screen-xl mx-auto px-6 pt-[1.35rem] pb-4">

        {/* Grade-level picker — the primary gate into the library, so it comes
            before search in both reading order and tab order. A quick-pick:
            choosing one grade here reveals just that grade's results; the
            sidebar's Grade facet is the one that supports arbitrary
            combinations. Concept 2 moves this into the results card instead
            — see below. Concept 3 has no combobox here at all: it gates
            entry with GradeGateModal instead (rendered further down), and
            the sidebar facet is the only way to change grades afterward. */}
        <div className="flex items-stretch gap-2">
        {concept === '1' && renderGradeCombobox('relative shrink-0 w-40')}

        {/* Search — results list only updates on submit (Enter or the
            search button), not while typing. */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
          <input
            type="text"
            placeholder="Search by competency, file type, grade level, or grade band"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitSearch()
              } else if (e.key === 'Escape') {
                e.currentTarget.blur()
              }
            }}
            className="w-full pl-10 pr-9 h-11 text-sm border border-brand-border rounded-full bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
          />
          {search && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSearch('')
                setQuery('')
              }}
              aria-label="Clear search"
              className="absolute top-1/2 -translate-y-1/2 text-brand-subtext hover:text-brand-text transition-colors"
              style={{ right: 8 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={submitSearch}
          className="shrink-0 px-6 h-11 rounded-full text-sm font-semibold bg-dessa-teal text-white hover:bg-dessa-teal/90 transition-colors"
        >
          Search
        </button>
        </div>
      </div>
      </div>

      <div className="flex gap-6 items-start mt-6">
        {/* top-[160px] clears the now-sticky search bar band above it
            (56px nav + ~82px band) so the two don't overlap while scrolling. */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-4 sticky top-[160px] max-h-[calc(100vh-178px)]">
          {/* Facet rail — each section collapses so all four are always
              reachable without scrolling the results; capped height + internal
              scroll is a backstop in case everything is expanded at once. */}
          <div className="bg-white rounded-xl border border-brand-border overflow-y-auto">
            {/* Ordinary multi-select facet — the top combobox is still the
                quick way to gate into a single grade or "All Grades," but
                this lets any combination (e.g. just Grade 2 + Grade 4) get
                checked directly. Both controls read/write selectedGrades. */}
            <FacetGroup
              title="Grade"
              options={ALL_GRADES}
              selected={selectedGrades}
              onToggle={(v) => toggle(setSelectedGrades, v)}
              scrollable
            />
            <FacetGroup
              title="Course Type"
              options={CATEGORIES}
              selected={selectedCategories}
              onToggle={(v) => toggle(setSelectedCategories, v)}
            />
            <FacetGroup
              title="Competency"
              options={ALL_COMPETENCIES}
              selected={selectedCompetencies}
              onToggle={(v) => toggle(setSelectedCompetencies, v)}
              defaultOpen={false}
            />
            <FacetGroup
              title="Type"
              options={TYPES.map((t) => TYPE_META[t].label)}
              selected={selectedTypes.map((t) => TYPE_META[t].label)}
              onToggle={(label) => toggle(setSelectedTypes, TYPES.find((t) => TYPE_META[t].label === label))}
            />
          </div>

          {/* Saved/starred resources — commented out for now (disabled along
              with the star buttons that populate it; see "star button
              disabled for now" below).
          <div className="bg-white rounded-xl border border-brand-border p-4 overflow-y-auto">
            <p className="text-sm font-semibold text-brand-text mb-3">Saved</p>
            {savedKeys.size === 0 ? (
              <p className="text-xs text-brand-subtext leading-relaxed">
                Tap the star on any resource to save it here for quick access later.
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {[...savedKeys.entries()].map(([key, r]) => (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => openResource(r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openResource(r)
                    }}
                    className="group w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left cursor-pointer hover:bg-brand-bg transition-colors"
                  >
                    <TypeIconBadge type={r.type} size={22} />
                    <span className="flex-1 min-w-0 text-xs font-medium text-brand-text truncate">{displayTitle(r.title)}</span>
                    <button
                      onClick={(e) => toggleSaved(e, key, r)}
                      aria-label="Remove from saved"
                      className="shrink-0 text-dessa-teal opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star size={13} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
          */}
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-brand-border bg-white overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
              {/* Nothing to label before a grade is picked — the empty state
                  below already explains what to do, so this stays blank
                  rather than showing a generic "All resources" heading. */}
              {selectedGrades.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-brand-text">
                  {selectedGrades.length === ALL_GRADES.length
                    ? 'All grades'
                    : selectedGrades.length === 1
                    ? `${selectedGrades[0]} resources`
                    : `${selectedGrades.length} grades selected`}
                </h2>
              </div>
              )}
              {(selectedGrades.length > 0 || q) && (
                <div className="flex items-center gap-2 shrink-0">
                  {renderSortMenu()}
                  {concept === '2' && renderGradeCombobox('relative w-40')}
                </div>
              )}
            </div>

            {selectedGrades.length === 0 && !q ? (
              <div className="px-6 py-16 text-center">
                <img src="/Search/search-empty.svg" alt="" className="mx-auto h-56 w-auto mb-6" />
                <p className="text-lg font-semibold text-brand-text mb-1.5">Pick a grade level to get started</p>
                {concept === '2' ? (
                  <div className="flex justify-center">
                    {renderGradeCombobox('relative w-56')}
                  </div>
                ) : (
                  <p className="text-sm text-brand-subtext max-w-sm mx-auto">
                    Choose a grade from the dropdown above to browse the resources available for it.
                  </p>
                )}
              </div>
            ) : pagedResults.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <img src="/Search/no-found.png" alt="" className="mx-auto h-64 w-auto mb-6" />
                <p className="text-lg font-semibold text-brand-text mb-1.5">No resources found</p>
                <p className="text-sm text-brand-subtext max-w-sm mx-auto mb-5">
                  We couldn't find any resources matching your search. Try adjusting your
                  keywords or clearing the filters.
                </p>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 rounded-md text-sm font-semibold border border-brand-border text-brand-text hover:bg-brand-bg transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : concept === '3' ? (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>
                      <SortButton label="Resource" field="title" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    </TableHead>
                    <TableHead>
                      <SortButton label="Type" field="type" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    </TableHead>
                    <TableHead>
                      <SortButton label="Competency" field="competency" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                    </TableHead>
                    {showGradeColumn && (
                      <TableHead>
                        <SortButton label="Grade" field="grade" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                      </TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedResults.map((r) => (
                    <TableRow
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openResource(r)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openResource(r)
                      }}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <TypeIconBadge type={r.type} size={32} />
                          <div className="min-w-0">
                            <p className="text-[15px] font-semibold text-brand-text truncate">
                              {displayTitle(r.title)}
                            </p>
                            <p className="text-xs text-brand-subtext truncate">{r.unitTitle}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{TYPE_META[r.type].label}</TableCell>
                      <TableCell className="whitespace-nowrap">{r.competency}</TableCell>
                      {showGradeColumn && <TableCell className="whitespace-nowrap">{r.grade}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="border-t border-brand-border">
                {pagedResults.map((r, i) => {
                  // Grade divider row — grade-less search clusters results by
                  // grade (see groupByGrade), so it gets its own full-width
                  // row marking the start of each grade's block instead of a
                  // per-row grade tag. Re-shown on every page (not just once
                  // per true group) so a page never opens mid-group with no
                  // grade context above it.
                  const showGradeDivider = groupByGrade && (i === 0 || pagedResults[i - 1].grade !== r.grade)
                  return (
                    <div key={r.id}>
                      {showGradeDivider && (
                        <div className="px-6 py-2 bg-brand-bg border-b border-brand-border text-xs font-semibold text-brand-text uppercase tracking-wide">
                          {r.grade}
                        </div>
                      )}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => openResource(r)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openResource(r)
                        }}
                        className={`w-full flex flex-col gap-2 px-6 py-4 text-left hover:bg-brand-bg transition-colors cursor-pointer ${
                          i === pagedResults.length - 1 ? '' : 'border-b border-brand-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-brand-text truncate">
                              {displayTitle(r.title)}
                            </p>
                            {/* Single meta line — unit and competency read
                                left-to-right in one scan instead of splitting
                                attention between a left-aligned title block
                                and a right-floating badge cluster. Grade never
                                appears inline here — any multi-grade result
                                set gets a divider row instead (groupByGrade). */}
                            <p className="text-xs text-brand-subtext truncate mt-0.5">
                              {r.unitTitle}
                              {r.competency && <> · {r.competency}</>}
                            </p>
                          </div>
                          <TypeBadge type={r.type} />
                          {/* <button
                            onClick={(e) => toggleSaved(e, key, r)}
                            aria-label={isSaved ? 'Remove from saved' : 'Save resource'}
                            className={`shrink-0 p-1 rounded-full transition-colors ${
                              isSaved ? 'text-dessa-teal' : 'text-brand-subtext hover:text-dessa-teal'
                            }`}
                          >
                            <Star size={16} fill={isSaved ? 'currentColor' : 'none'} />
                          </button> */}
                        </div>
                        {/* Flush left, spanning the icon's column too — not
                            indented to align under the title — so the row reads
                            as a compact header cluster with a full-width body
                            beneath it, rather than one uniformly dense block. */}
                        <p className="text-sm text-brand-subtext leading-relaxed line-clamp-2 max-w-[640px]">
                          {r.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-8 h-8 p-0 justify-center rounded-lg text-dessa-teal"
                    >
                      {''}
                    </PaginationPrevious>
                  </PaginationItem>
                  {pageWindow(page, totalPages).map((p, i) =>
                    p === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="w-9 h-9 rounded-lg">
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-8 h-8 p-0 justify-center rounded-lg text-dessa-teal"
                    >
                      {''}
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="appearance-none pl-3 pr-8 h-9 text-sm border border-brand-border rounded-md bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                >
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
