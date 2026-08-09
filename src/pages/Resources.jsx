import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, X, Video, FileText, Headphones } from 'lucide-react'
import {
  resources, CATEGORIES, TYPES, ALL_GRADES, ALL_COMPETENCIES, courseFor,
} from '../lib/resourcesData'
import {
  Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext,
} from '../components/ui/pagination'

const TYPE_META = {
  video: { icon: Video, label: 'Video' },
  pdf: { icon: FileText, label: 'PDF' },
  audio: { icon: Headphones, label: 'Audio' },
}

const PAGE_SIZE = 20

function FacetGroup({ title, options, selected, onToggle, scrollable }) {
  return (
    <div className="py-4 border-b border-brand-border last:border-b-0">
      <p className="text-sm font-semibold text-brand-text mb-2 px-4">{title}</p>
      <div className={`flex flex-col ${scrollable ? 'max-h-48 overflow-y-auto' : ''}`}>
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
    </div>
  )
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

function Pill({ label, tone }) {
  const tones = {
    grade: 'bg-mtw-amberLight text-brand-text',
    competency: 'bg-dessa-tealLight text-dessa-navy',
    category: 'bg-brand-bg text-brand-subtext border border-brand-border',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${tones[tone]}`}>
      {label}
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

  // Reset to page 1 whenever the filter set changes — adjusted during render
  // (not in an effect) so it takes effect in the same commit as the filter change.
  const filterKey = JSON.stringify([search, selectedCategories, selectedGrades, selectedCompetencies, selectedTypes])
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

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
        {/* Facet rail */}
        <div className="w-64 flex-shrink-0 bg-white rounded-xl border border-brand-border overflow-hidden sticky top-20">
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
          />
          <FacetGroup
            title="Competency"
            options={ALL_COMPETENCIES}
            selected={selectedCompetencies}
            onToggle={(v) => toggle(setSelectedCompetencies, v)}
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
                const TypeIcon = TYPE_META[r.type].icon
                return (
                  <button
                    key={r.id}
                    onClick={() => openResource(r)}
                    className="w-full flex items-start gap-3 px-5 py-4 border-b border-brand-border last:border-b-0 text-left hover:bg-brand-bg transition-colors"
                  >
                    <TypeIcon size={16} className="text-brand-subtext mt-0.5 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-brand-text mb-1.5">{r.title}</p>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Pill label={r.grade} tone="grade" />
                        <Pill label={r.competency} tone="competency" />
                        <Pill label={r.category} tone="category" />
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-xs text-brand-subtext">Page {page} of {totalPages}</p>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
