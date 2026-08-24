import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as Popover from '@radix-ui/react-popover'
import {
  Search, X, Video, FileText, Mic, ChevronDown,
  ClipboardList, Star,
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

// Tinted, outlined pill with a small icon + label — the file-type equivalent
// of the "status badge" pattern (e.g. a colored "Bookmarked" or "Flagged"
// chip), so type reads as a labeled category rather than an abstract icon.
function TypeBadge({ type }) {
  const { icon: Icon, color, bg, label } = TYPE_META[type]
  return (
    <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full border border-current ${bg} bg-opacity-10 ${color} shrink-0`}>
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

export default function Resources() {
  const navigate = useNavigate()
  // Design-review toggle set via the select in Nav (Resources-only) — lets a
  // reviewer flip between two grade-picker layout concepts on the same data.
  const [searchParams] = useSearchParams()
  const concept = searchParams.get('concept') || '1'
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  // Single-select, not a facet array — stakeholders don't want educators to
  // see that the same content also exists at other grade levels, so grade
  // is a gate you pick before browsing, not a narrowing filter like the rest.
  // null = nothing picked yet (empty state); 'ALL' = explicit "every grade".
  const [selectedGrade, setSelectedGrade] = useState(null)
  const [gradeMenuOpen, setGradeMenuOpen] = useState(false)
  const [gradeQuery, setGradeQuery] = useState('')
  const [selectedCompetencies, setSelectedCompetencies] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  // Concept 3's sortable table columns.
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
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

  // Scoped to selectedGrade first — with no grade chosen there's nothing to
  // show, by design, so a resource shared across grades never surfaces that
  // fact side by side in the same view. "ALL" is an explicit, deliberate
  // choice (not the default) to see every grade's copy as its own row.
  const filtered = useMemo(() => {
    if (!selectedGrade) return []
    const q = query.trim().toLowerCase()
    return resources.filter((r) =>
      (selectedGrade === 'ALL' || r.grade === selectedGrade) &&
      (!q || r.title.toLowerCase().includes(q)) &&
      (selectedCategories.length === 0 || selectedCategories.includes(r.category)) &&
      (selectedCompetencies.length === 0 || selectedCompetencies.includes(r.competency)) &&
      (selectedTypes.length === 0 || selectedTypes.includes(r.type))
    )
  }, [selectedGrade, query, selectedCategories, selectedCompetencies, selectedTypes])

  // Reset to page 1 whenever the filter set or page size changes — adjusted
  // during render (not in an effect) so it takes effect in the same commit.
  const filterKey = JSON.stringify([selectedGrade, query, selectedCategories, selectedCompetencies, selectedTypes, pageSize])
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  // Concept 3 only — live column sorting for the table layout; other
  // concepts just use filtered's natural (title-alphabetical) order.
  const sortedFiltered = useMemo(() => {
    if (concept !== '3' || !sortKey) return filtered
    return [...filtered].sort((a, b) => {
      let result = 0
      if (sortKey === 'title') result = displayTitle(a.title).localeCompare(displayTitle(b.title))
      else if (sortKey === 'type') result = TYPE_META[a.type].label.localeCompare(TYPE_META[b.type].label)
      else if (sortKey === 'competency') result = a.competency.localeCompare(b.competency)
      else if (sortKey === 'grade') result = ALL_GRADES.indexOf(a.grade) - ALL_GRADES.indexOf(b.grade)
      return sortDir === 'asc' ? result : -result
    })
  }, [filtered, concept, sortKey, sortDir])

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

  const gradeChoices = [{ value: 'ALL', label: 'All Grades' }, ...ALL_GRADES.map((g) => ({ value: g, label: g }))]
  const filteredGradeChoices = gradeQuery.trim()
    ? gradeChoices.filter((o) => o.label.toLowerCase().includes(gradeQuery.trim().toLowerCase()))
    : gradeChoices
  const selectedGradeLabel = gradeChoices.find((o) => o.value === selectedGrade)?.label ?? 'Select grade'

  function pickGrade(value) {
    setSelectedGrade(value)
    setGradeMenuOpen(false)
    setGradeQuery('')
  }

  function clearGrade(e) {
    e.stopPropagation()
    setSelectedGrade(null)
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
              <span className={`flex-1 truncate text-left ${selectedGrade ? 'text-brand-text' : 'text-brand-subtext'}`}>
                {selectedGradeLabel}
              </span>
              {!selectedGrade && <ChevronDown size={14} className="shrink-0 text-brand-subtext" />}
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
                  filteredGradeChoices.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => pickGrade(opt.value)}
                      className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                        selectedGrade === opt.value ? 'bg-dessa-tealLight text-dessa-teal font-semibold' : 'text-brand-text hover:bg-brand-bg'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))
                )}
              </div>
            </Popover.Content>
          </Popover.Portal>
        </Popover.Root>
        {selectedGrade && (
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
      {/* Top bar — eBay-style: a compact search container, a category row
          directly beneath it, then the results content below that. Light
          gray instead of a bold hero color so it reads as a utility bar,
          not a banner. Search and categories are separate full-bleed bands
          so each gets its own edge-to-edge divider rather than one border
          shared (and visually mis-attributed) across both. */}
      <div className="w-screen mx-[calc(50%-50vw)] bg-brand-bg border-b border-brand-border">
      <div className="max-w-screen-xl mx-auto px-6 pt-[1.35rem] pb-4">

        {/* Grade-level picker — the primary gate into the library, so it comes
            before search in both reading order and tab order. Single-select:
            picking a grade is what reveals results at all, so a resource shared
            across grades never surfaces that fact side by side in one view.
            Concept 2 moves this into the results card instead — see below.
            Concept 3 (table layout) reuses this same search-bar placement,
            since that concept is only about the results table, not this. */}
        <div className="flex items-stretch gap-2">
        {(concept === '1' || concept === '3') && renderGradeCombobox('relative shrink-0 w-40')}

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
        <div className="w-64 flex-shrink-0 flex flex-col gap-4 sticky top-20 max-h-[calc(100vh-6rem)]">
          {/* Facet rail — each section collapses so all four are always
              reachable without scrolling the results; capped height + internal
              scroll is a backstop in case everything is expanded at once. */}
          <div className="bg-white rounded-xl border border-brand-border overflow-y-auto">
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

          {/* Saved/starred resources — populated by the star button on
              Popular picks cards and search result rows. */}
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
        </div>

        {/* Results */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl border border-brand-border bg-white overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-brand-text">
                  {query.trim() ? (
                    <span className="text-[14px] font-normal text-brand-subtext">
                      Showing results for <span className="font-semibold text-dessa-teal">{query.trim()}</span>
                      {' · '}
                      <button onClick={clearAll} className="font-semibold text-brand-text hover:text-dessa-teal transition-colors">
                        Clear all
                      </button>
                    </span>
                  ) : selectedGrade === 'ALL' ? (
                    'All grades'
                  ) : selectedGrade ? (
                    `${selectedGrade} resources`
                  ) : (
                    'All resources'
                  )}
                </h2>
                {/* Concept 2 stacks the result count under the title instead
                    of beside it, since the top-right slot now holds the
                    grade combobox once a grade is picked. */}
                {concept === '2' && selectedGrade && (
                  <p className="text-sm text-brand-subtext mt-1">
                    {filtered.length.toLocaleString()} result{filtered.length === 1 ? '' : 's'}
                  </p>
                )}
              </div>
              {concept === '1' && selectedGrade && (
                <p className="text-sm text-brand-subtext shrink-0">
                  {filtered.length.toLocaleString()} result{filtered.length === 1 ? '' : 's'}
                </p>
              )}
              {concept === '2' && selectedGrade && renderGradeCombobox('relative shrink-0 w-40')}
            </div>

            {!selectedGrade ? (
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
                    {selectedGrade === 'ALL' && (
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
                      {selectedGrade === 'ALL' && <TableCell className="whitespace-nowrap">{r.grade}</TableCell>}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="border-t border-brand-border">
                {pagedResults.map((r) => {
                  return (
                    <div
                      key={r.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => openResource(r)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') openResource(r)
                      }}
                      className="w-full flex flex-col gap-3 px-6 py-4 text-left border-b border-brand-border last:border-b-0 hover:bg-brand-bg transition-colors cursor-pointer"
                    >
                      <div className="flex items-start gap-4">
                        <span className="w-3.5 shrink-0" />
                        <TypeBadge type={r.type} />
                        <div className="flex-1 min-w-0 flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-[15px] font-semibold text-brand-text truncate">
                              {displayTitle(r.title)}
                            </p>
                            <p className="text-xs text-brand-subtext truncate mt-0.5">{r.unitTitle}</p>
                          </div>
                          <div className="shrink-0 flex items-center gap-1.5">
                            {selectedGrade === 'ALL' && (
                              <span className="text-[11px] font-medium text-brand-subtext bg-brand-bg px-2 py-0.5 rounded-full">
                                {r.grade}
                              </span>
                            )}
                            <span className="text-[11px] font-medium px-2 py-0.5 rounded-full">
                              {r.competency}
                            </span>
                          </div>
                        </div>
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
