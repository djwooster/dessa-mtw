import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, X, Video, FileText, Mic, ChevronDown, ChevronRight, ExternalLink,
  ClipboardList, Star,
} from 'lucide-react'
import {
  resources, CATEGORIES, TYPES, ALL_GRADES, ALL_COMPETENCIES, courseFor,
} from '../lib/resourcesData'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '../components/ui/pagination'

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

function TypePill({ type }) {
  return (
    <span className="text-[11px] font-semibold text-brand-subtext px-2 py-0.5 rounded-full bg-brand-bg shrink-0">
      {TYPE_META[type].label}
    </span>
  )
}

// Shared identity for "the same lesson across grades" — used both to collapse
// duplicate grade rows in search results and to key the saved/starred list,
// so starring a resource from Popular picks and starring its counterpart in
// search results (if it's the same lesson) reflect as the same saved item.
function groupKey(r) {
  return `${r.category}::${r.type}::${r.title}`
}

// Adult Wellness lesson titles are authored with an "Independent: " prefix
// (they're self-guided, as opposed to facilitated) — useful in the source
// data but redundant noise in a resource list, so strip it for display only.
function displayTitle(title) {
  return title.replace(/^Independent:\s*/, '')
}

// Quick-browse category tiles shown below the search bar — a curated set of
// entry points into the library (not the same taxonomy as the sidebar's
// Grade Band/Competency/Type facets), so clicking one runs a title search
// for its label rather than toggling a facet that doesn't exist.
const CATEGORY_TILES = [
  'Getting Started Tools',
  'Worksheets',
  'Videos',
  'Webinars',
  'Common Language Resources',
  'Family Resources',
  'Implementation & Engagement',
]

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

function Chip({ label, onRemove }) {
  return (
    <span className="flex items-center gap-1.5 pl-3 pr-2 py-1 rounded-full text-xs font-medium bg-dessa-navy text-white">
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
        <X size={11} />
      </button>
    </span>
  )
}

export default function Resources() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedGrades, setSelectedGrades] = useState([])
  const [selectedCompetencies, setSelectedCompetencies] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  // Saved/starred resources — keyed by groupKey() so a resource stays "saved"
  // regardless of which grade variant or view (card vs. result row) it was
  // starred from. Map value is the representative resource, so the sidebar
  // panel can render + navigate without re-deriving it from current filters.
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

  // Predictive search dropdown — lightweight typeahead over the search box,
  // not a full command bar: no global shortcut to open it, just live matches
  // while the field is focused. Title-starts-with matches rank above
  // title-contains matches; deduped by groupKey() so a lesson offered across
  // many grades still only takes one dropdown slot.
  const [searchFocused, setSearchFocused] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(0)

  const dropdownResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return []
    const seen = new Set()
    const startsWith = []
    const contains = []
    for (const r of resources) {
      const t = r.title.toLowerCase()
      if (!t.includes(q)) continue
      const key = groupKey(r)
      if (seen.has(key)) continue
      seen.add(key)
      ;(t.startsWith(q) ? startsWith : contains).push(r)
    }
    return [...startsWith, ...contains].slice(0, 5)
  }, [search])

  useEffect(() => {
    setHighlightIndex(0)
  }, [search])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return resources.filter((r) =>
      (!q || r.title.toLowerCase().includes(q)) &&
      (selectedCategories.length === 0 || selectedCategories.includes(r.category)) &&
      (selectedGrades.length === 0 || selectedGrades.includes(r.grade)) &&
      (selectedCompetencies.length === 0 || selectedCompetencies.includes(r.competency)) &&
      (selectedTypes.length === 0 || selectedTypes.includes(r.type))
    )
  }, [query, selectedCategories, selectedGrades, selectedCompetencies, selectedTypes])

  // Reset to page 1 whenever the filter set or page size changes — adjusted
  // during render (not in an effect) so it takes effect in the same commit.
  const filterKey = JSON.stringify([query, selectedCategories, selectedGrades, selectedCompetencies, selectedTypes, pageSize])
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  // The same lesson (e.g. "Welcome Video!") exists once per grade the course
  // is offered in — collapse those into a single expandable row instead of
  // one row per grade, so the list reads as "resources" rather than
  // "resources × grades". A group key of category+type+title is enough since
  // titles repeat across grades but not across unrelated resources; grouping
  // runs on the already-filtered set, so picking a single grade in the facet
  // rail naturally collapses every group back down to one item.
  const groupedResults = useMemo(() => {
    const byKey = new Map()
    for (const r of filtered) {
      const key = groupKey(r)
      if (!byKey.has(key)) byKey.set(key, [])
      byKey.get(key).push(r)
    }
    return [...byKey.entries()].map(([key, items]) => ({
      key,
      items: [...items].sort((a, b) => ALL_GRADES.indexOf(a.grade) - ALL_GRADES.indexOf(b.grade)),
    }))
  }, [filtered])

  const totalPages = Math.max(1, Math.ceil(groupedResults.length / pageSize))
  const pagedGroups = groupedResults.slice((page - 1) * pageSize, page * pageSize)

  function toggle(setFn, value) {
    setFn((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const chips = [
    ...selectedCategories.map((v) => ({ group: 'category', value: v, setFn: setSelectedCategories })),
    ...selectedGrades.map((v) => ({ group: 'grade', value: v, setFn: setSelectedGrades })),
    ...selectedCompetencies.map((v) => ({ group: 'competency', value: v, setFn: setSelectedCompetencies })),
    ...selectedTypes.map((v) => ({ group: 'type', value: v, setFn: setSelectedTypes })),
  ]

  const hasFilters = chips.length > 0 || query.trim().length > 0

  function clearAll() {
    setSearch('')
    setQuery('')
    setSelectedCategories([])
    setSelectedGrades([])
    setSelectedCompetencies([])
    setSelectedTypes([])
  }

  function submitSearch() {
    setQuery(search)
    setSearchFocused(false)
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

        {/* Search — kept in this one persistent JSX slot (never conditionally
            swapped elsewhere) so the <input> doesn't unmount and drop focus
            mid-keystroke. Typing only drives the autocomplete dropdown below;
            the results list only updates on submit (Enter or the search
            button), Google-style. */}
        <div className="flex items-stretch gap-2">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
          <input
            type="text"
            placeholder="Search by competency, file type, grade level, or grade band"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitSearch()
              } else if (e.key === 'Escape') {
                setSearchFocused(false)
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

          {/* Predictive dropdown — lightweight typeahead, not a full command
              bar: live suggestions while focused, but they don't filter the
              results list themselves — click one to jump straight to it, or
              hit Enter/the search button to search the typed text. */}
          {searchFocused && search.trim().length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-2 z-30 bg-white rounded-xl border border-brand-border shadow-lg overflow-hidden text-left">
              {dropdownResults.length === 0 ? (
                <p className="px-4 py-4 text-sm text-brand-subtext">No matches for &ldquo;{search}&rdquo;</p>
              ) : (
                <>
                  <p className="px-4 pt-3 pb-2 text-xs font-medium text-brand-subtext">
                    Suggestions ({dropdownResults.length})
                  </p>
                  <div className="border-t border-brand-border">
                    {dropdownResults.map((r, i) => (
                      <button
                        key={groupKey(r)}
                        onMouseDown={(e) => e.preventDefault()}
                        onMouseEnter={() => setHighlightIndex(i)}
                        onClick={() => openResource(r)}
                        className={`w-full flex items-start gap-3 px-4 py-2.5 text-left transition-colors ${
                          i === highlightIndex ? 'bg-brand-bg' : 'hover:bg-brand-bg'
                        }`}
                      >
                        <TypeIconBadge type={r.type} size={28} />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-brand-text truncate">{displayTitle(r.title)}</p>
                          <p className="text-xs text-brand-subtext truncate">{r.grade} · {r.description}</p>
                        </div>
                        <TypePill type={r.type} />
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 border-t border-brand-border text-[11px] text-brand-subtext">
                    <span>click to open</span>
                    <span>·</span>
                    <span>↵ search</span>
                    <span>·</span>
                    <span>esc close</span>
                  </div>
                </>
              )}
            </div>
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

      {/* Category row — curated browse shortcuts below the search bar;
          clicking one runs a title search for its label. */}
      <div className="flex items-center justify-center gap-10 flex-wrap pt-3 mb-6">
        {CATEGORY_TILES.map((label) => (
          <button
            key={label}
            onClick={() => {
              setSearch(label)
              setQuery(label)
            }}
            className="text-[13px] font-medium text-brand-text hover:text-dessa-teal transition-colors"
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex gap-6 items-start">
        <div className="w-64 flex-shrink-0 flex flex-col gap-4 sticky top-20 max-h-[calc(100vh-6rem)]">
          {/* Facet rail — each section collapses so all four are always
              reachable without scrolling the results; capped height + internal
              scroll is a backstop in case everything is expanded at once. */}
          <div className="bg-white rounded-xl border border-brand-border overflow-y-auto">
            <FacetGroup
              title="Grade Band"
              options={CATEGORIES}
              selected={selectedCategories}
              onToggle={(v) => toggle(setSelectedCategories, v)}
            />
            <FacetGroup
              title="Grade"
              options={ALL_GRADES}
              selected={selectedGrades}
              onToggle={(v) => toggle(setSelectedGrades, v)}
              scrollable
              defaultOpen={false}
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
          {hasFilters && (
            <div className="flex items-center gap-2 flex-wrap mb-4">
              {chips.map((c) => (
                <Chip
                  key={`${c.group}-${c.value}`}
                  label={c.value}
                  onRemove={() => c.setFn((prev) => prev.filter((v) => v !== c.value))}
                />
              ))}
              <button
                onClick={clearAll}
                className="px-3 py-1 rounded-full text-xs font-medium text-brand-text border border-brand-border hover:bg-brand-bg transition-colors"
              >
                Clear all
              </button>
            </div>
          )}

          <div className="rounded-2xl border border-brand-border bg-white overflow-hidden">
            <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-4">
              <h2 className="text-base font-semibold text-brand-text">All resources</h2>
              <p className="text-sm text-brand-subtext shrink-0">
                {groupedResults.length.toLocaleString()} result{groupedResults.length === 1 ? '' : 's'}
              </p>
            </div>

            {pagedGroups.length === 0 ? (
              <div className="px-6 py-16 text-center">
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
            ) : (
              <div className="border-t border-brand-border">
                {pagedGroups.map(({ key, items }) => {
                  const r = items[0]
                  const isGroup = items.length > 1
                  // const isSaved = savedKeys.has(key) — star button disabled for now, see below
                  const distinctCompetencies = [...new Set(items.map((i) => i.competency))]

                  const competencyPills = [distinctCompetencies[0], ...(isGroup ? distinctCompetencies.slice(1) : r.extraCompetencies)]

                  return (
                    <div
                      key={key}
                      role={isGroup ? undefined : 'button'}
                      tabIndex={isGroup ? undefined : 0}
                      onClick={isGroup ? undefined : () => openResource(r)}
                      onKeyDown={isGroup ? undefined : (e) => {
                        if (e.key === 'Enter' || e.key === ' ') openResource(r)
                      }}
                      className={`w-full flex items-start gap-4 px-6 py-4 text-left border-b border-brand-border last:border-b-0 transition-colors ${
                        isGroup ? '' : 'hover:bg-brand-bg cursor-pointer'
                      }`}
                    >
                      <span className="w-3.5 shrink-0" />
                      <TypeIconBadge type={r.type} size={44} />
                      <div className="flex-1 min-w-0">
                        <p className="text-[15px] font-semibold text-brand-text truncate">
                          {displayTitle(r.title)}
                        </p>
                        <p className="text-sm text-brand-subtext leading-relaxed line-clamp-2 mt-1 max-w-[640px]">
                          {isGroup
                            ? `Available across ${items.length} grades — open the grade you're working with below.`
                            : r.description}
                        </p>
                        <div className="flex items-center gap-1.5 flex-wrap mt-2">
                          <span className="text-[11px] font-medium text-brand-subtext bg-brand-bg px-2 py-0.5 rounded-full">
                            {competencyPills[0]}
                          </span>
                          {competencyPills.length > 1 && (
                            <span className="relative group/comp text-[11px] font-semibold text-brand-subtext bg-brand-bg px-2 py-0.5 rounded-full">
                              +{competencyPills.length - 1} more
                              <div className="absolute left-0 top-full mt-1.5 hidden group-hover/comp:flex flex-col gap-1 bg-dessa-navy text-white text-xs rounded-lg px-3 py-2 shadow-lg z-20 whitespace-nowrap">
                                {competencyPills.slice(1).map((c) => (
                                  <span key={c}>{c}</span>
                                ))}
                              </div>
                            </span>
                          )}
                        </div>

                        {/* One button per grade variant — content is often reused
                            across grades, so tracking needs to know exactly which
                            grade's copy the educator opened, not just the group. */}
                        {isGroup && (
                          <div className="flex items-center gap-2 flex-wrap mt-6">
                            {items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => openResource(item)}
                                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-brand-border bg-white text-[13px] font-medium text-brand-text hover:bg-brand-bg transition-colors"
                              >
                                {item.grade}
                                <ExternalLink size={12} className="text-brand-subtext" />
                              </button>
                            ))}
                          </div>
                        )}
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
                      {!isGroup && <ChevronRight size={16} className="self-center shrink-0 text-dessa-teal" />}
                      {isGroup && <span className="w-4 shrink-0" />}
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
