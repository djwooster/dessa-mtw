import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, X, Video, FileText, Mic, ChevronDown, ChevronRight, GraduationCap, Target,
  BookOpen, Layers, HeartHandshake, Users, Smile, Anchor, MessageCircle, Handshake, Flag,
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
  audio: { icon: Mic, label: 'Audio', color: 'text-mtw-blue', bg: 'bg-mtw-blue' },
}

// Real illustrated file-type icons, dropped in by design.
const TYPE_IMAGES = {
  video: '/file-types/video-newly.png',
  pdf: '/file-types/PDF-newly.png',
  audio: '/file-types/audio-newly.png',
}

function FileTypeBadge({ type }) {
  const { icon: Icon, color, bg } = TYPE_META[type]
  return (
    <div className={`w-14 h-16 rounded-lg ${bg} bg-opacity-15 flex items-center justify-center shrink-0`}>
      <Icon size={22} strokeWidth={2} className={color} />
    </div>
  )
}

// Browse tiles — deliberately just two axes (Category, Competency) rather
// than mixing in Type: Category is the library's core organizing structure
// and Competency is the axis an educator actually thinks in ("something for
// Self-Management"), so together they're a more useful browse entry point
// than gluing every facet into one flat tile row. Each tile maps to a real,
// non-empty filter — no categories invented beyond what the data supports.
const CATEGORY_TILES = [
  { group: 'category', value: 'Tier 1', icon: BookOpen },
  { group: 'category', value: 'Tier 2', icon: Layers },
  { group: 'category', value: 'Adult Wellness', icon: HeartHandshake },
  { group: 'category', value: 'Family', icon: Users },
  { group: 'competency', value: 'Self-Awareness', icon: Smile },
  { group: 'competency', value: 'Self-Management', icon: Anchor },
  { group: 'competency', value: 'Social Awareness', icon: MessageCircle },
  { group: 'competency', value: 'Relationship Skills', icon: Handshake },
  { group: 'competency', value: 'Responsible Decision-Making', icon: Target },
  { group: 'competency', value: 'Goal-Directed Behavior', icon: Flag },
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

function IconTag({ icon, label }) {
  const Icon = icon
  return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-brand-subtext">
      <Icon size={13} />
      {label}
    </span>
  )
}

function CompetencyTag({ primary, extra }) {
  return (
    <span className="relative flex items-center gap-1.5 text-xs font-medium text-brand-subtext group/comp">
      <Target size={13} />
      {primary}
      {extra.length > 0 && (
        <>
          <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-brand-bg text-[11px] font-semibold text-brand-subtext">
            +{extra.length} more
          </span>
          <div className="absolute left-0 top-full mt-1.5 hidden group-hover/comp:flex flex-col gap-1 bg-dessa-navy text-white text-xs rounded-lg px-3 py-2 shadow-lg z-20 whitespace-nowrap">
            {extra.map((c) => (
              <span key={c}>{c}</span>
            ))}
          </div>
        </>
      )}
    </span>
  )
}

export default function Resources() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  const [selectedGrades, setSelectedGrades] = useState([])
  const [selectedCompetencies, setSelectedCompetencies] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  const [showAllTiles, setShowAllTiles] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return resources.filter((r) =>
      (!q || r.title.toLowerCase().includes(q)) &&
      (selectedCategories.length === 0 || selectedCategories.includes(r.category)) &&
      (selectedGrades.length === 0 || selectedGrades.includes(r.grade)) &&
      (selectedCompetencies.length === 0 || selectedCompetencies.includes(r.competency)) &&
      (selectedTypes.length === 0 || selectedTypes.includes(r.type))
    )
  }, [search, selectedCategories, selectedGrades, selectedCompetencies, selectedTypes])

  // Reset to page 1 whenever the filter set or page size changes — adjusted
  // during render (not in an effect) so it takes effect in the same commit.
  const filterKey = JSON.stringify([search, selectedCategories, selectedGrades, selectedCompetencies, selectedTypes, pageSize])
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const paged = filtered.slice((page - 1) * pageSize, page * pageSize)

  function toggle(setFn, value) {
    setFn((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  const chips = [
    ...selectedCategories.map((v) => ({ group: 'category', value: v, setFn: setSelectedCategories })),
    ...selectedGrades.map((v) => ({ group: 'grade', value: v, setFn: setSelectedGrades })),
    ...selectedCompetencies.map((v) => ({ group: 'competency', value: v, setFn: setSelectedCompetencies })),
    ...selectedTypes.map((v) => ({ group: 'type', value: v, setFn: setSelectedTypes })),
  ]

  const hasFilters = chips.length > 0 || search.trim().length > 0

  function clearAll() {
    setSearch('')
    setSelectedCategories([])
    setSelectedGrades([])
    setSelectedCompetencies([])
    setSelectedTypes([])
  }

  function selectTile(tile) {
    if (tile.group === 'category') setSelectedCategories([tile.value])
    if (tile.group === 'competency') setSelectedCompetencies([tile.value])
  }

  function openResource(r) {
    const course = courseFor(r)
    if (course) navigate('/mtw/lesson', { state: { course } })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-screen-xl mx-auto px-6 pt-8 pb-16"
    >
      <h1 className="text-2xl font-semibold text-brand-text mb-1">Resources</h1>
      <p className="text-sm text-brand-subtext mb-6">
        Search and filter every video, guide, and printable across the curriculum library.
      </p>

      <div className="flex gap-6 items-start">
        {/* Facet rail — each section collapses so all four are always reachable
            without scrolling the results; capped height + internal scroll is a
            backstop in case everything is expanded at once. */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-brand-border overflow-y-auto sticky top-20 max-h-[calc(100vh-6rem)]">
          <FacetGroup
            title="Category"
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

        {/* Search + results */}
        <div className="flex-1 min-w-0">
          {/* Browse categories */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-brand-text">Browse by category</h2>
              <button
                onClick={() => setShowAllTiles((v) => !v)}
                className="text-sm font-semibold text-dessa-teal hover:text-dessa-navy transition-colors"
              >
                {showAllTiles ? 'Show less' : 'See all'}
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {(showAllTiles ? CATEGORY_TILES : CATEGORY_TILES.slice(0, 6)).map((tile) => (
                <button
                  key={`${tile.group}-${tile.value}`}
                  onClick={() => selectTile(tile)}
                  className="relative h-28 flex items-end rounded-xl border border-brand-border bg-brand-border/30 px-4 py-3 text-left hover:border-dessa-teal/50 transition-colors"
                >
                  <tile.icon size={16} className="absolute top-3 right-3 text-brand-subtext" />
                  <span className="text-sm font-semibold text-brand-text">{tile.value}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="relative mb-3">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
            <input
              type="text"
              placeholder="Search resources…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 h-11 text-sm border border-brand-border rounded-lg bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            />
          </div>

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

          {!hasFilters ? (
            <div className="px-6 py-16 text-center">
              <img src="/Search/search-empty.svg" alt="" className="mx-auto h-56 w-auto mb-6" />
              <p className="text-base font-semibold text-brand-text mb-1">
                Search or pick a category to get started
              </p>
              <p className="text-sm text-brand-subtext max-w-sm mx-auto">
                Browse thousands of videos, guides, and printables across the curriculum
                library — use the categories above, the filters on the left, or search by title.
              </p>
            </div>
          ) : (
            <>
          <p className="text-sm text-brand-subtext mb-3">
            {filtered.length.toLocaleString()} result{filtered.length === 1 ? '' : 's'}
          </p>

          <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
            {paged.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <p className="text-sm text-brand-subtext">No resources match your filters.</p>
              </div>
            ) : (
              paged.map((r) => {
                return (
                  <button
                    key={r.id}
                    onClick={() => openResource(r)}
                    className="w-full flex items-center gap-6 px-5 py-4 border-b border-brand-border last:border-b-0 text-left hover:bg-brand-bg transition-colors"
                  >
                    {TYPE_IMAGES[r.type] ? (
                      <img
                        src={TYPE_IMAGES[r.type]}
                        alt={TYPE_META[r.type].label}
                        className="h-14 w-14 object-contain shrink-0"
                      />
                    ) : (
                      <FileTypeBadge type={r.type} />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-lg font-semibold text-brand-text mb-0">{r.title}</p>
                      <p className="text-sm text-brand-subtext mb-6 line-clamp-1 max-w-[580px]">{r.description}</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        <IconTag icon={GraduationCap} label={r.grade} />
                        <CompetencyTag primary={r.competency} extra={r.extraCompetencies} />
                      </div>
                    </div>
                    <span className="flex items-center gap-1 text-sm font-semibold text-dessa-teal shrink-0">
                      Go to content
                      <ChevronRight size={15} />
                    </span>
                  </button>
                )
              })
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
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}
