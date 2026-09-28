import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, Video, FileText, Mic, ClipboardList, Link2, PlayCircle,
  ChevronDown, Check, X,
} from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '../components/ui/pagination'

// ─── Resource Library ───────────────────────────────────────────────────────
// A "Resources" nav entry (2026-09-28), cloned from the results experience
// that's actually live on /resources today (Concept D's table layout, see
// ResourcesAltConcepts.jsx's ConceptD/ResultsExperience/
// CondensedResultsTable) so the two are apples-to-apples. Self-contained,
// same convention CompetitiveAnalysis.jsx/ResourcesConcepts.jsx used before
// it — a fresh one-off file rather than another axis layered onto the
// already-deep Resources.jsx/ResourcesAltConcepts.jsx concept machinery.
//
// Started as an A/B comparison (fold the DESSA Strategy Library's PDFs into
// this catalog, or keep them separate). Concept B won and is now the only
// version (2026-09-28 feedback) — the catalog always includes the DESSA
// Strategy Library rows and the standalone "Strategies" nav item is
// permanently retired (see Nav.jsx).
const PREVIEW_URL = '/resource-library/preview'

const ELEMENTARY_GROUP = ['Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade']
const MIDDLE_GROUP = ['6th Grade', '7th Grade', '8th Grade']
const HIGH_GROUP = ['9th Grade', '10th Grade', '11th Grade', '12th Grade']
const SELECTABLE_GRADES = ['All Grades', ...ELEMENTARY_GROUP, ...MIDDLE_GROUP, ...HIGH_GROUP]

const COURSE_TYPES = ['Tier 1', 'Tier 2', 'Family', 'Adult Wellness', 'DESSA', 'Foundational Practices']
const COMPETENCIES = ['Self-Awareness', 'Self-Management', 'Relationship Skills', 'Social Awareness', 'Responsible Decision-Making']

// 'Webinar' removed 2026-09-28 — discovered to be out of scope. The two
// resources that used to carry that type are reclassified as 'Link' below
// (reusing the freed mtw-green slot) rather than deleted, since they're
// still real family-facing content.
const TYPE_META = {
  Video: { icon: Video, label: 'Video', color: 'text-dessa-magenta', bg: 'bg-dessa-magenta' },
  PDF: { icon: FileText, label: 'PDF', color: 'text-mtw-purple', bg: 'bg-mtw-purple' },
  Worksheet: { icon: ClipboardList, label: 'Worksheet', color: 'text-mtw-coral', bg: 'bg-mtw-coral' },
  Audio: { icon: Mic, label: 'Audio', color: 'text-mtw-blue', bg: 'bg-mtw-blue' },
  Link: { icon: Link2, label: 'Link', color: 'text-mtw-green', bg: 'bg-mtw-green' },
  Lesson: { icon: PlayCircle, label: 'Lesson', color: 'text-mtw-amber', bg: 'bg-mtw-amber' },
}

// Per-grade catalog (2026-09-28) — was 18 hand-written rows shared thinly
// across 15 individual grades (some grades had just 1). Per explicit
// request ("~25 resources to look realistic"), rebuilt as a 5x5 grid — one
// resource per competency x file type combination, 25 total — reused
// identically across every individual grade (same title/description, only
// `grade` changes), rather than hand-authoring 25 rows per grade. Keeps the
// lift light: write the 25-item grid once, then cross it with the grade
// list below.
const CORE_TEMPLATE_GRID = {
  'Self-Awareness': {
    Video: { title: 'Emotion Check-In Video', desc: 'A short video prompting students to name how they feel before the day starts.' },
    PDF: { title: 'Naming My Feelings Guide', desc: 'A printable guide with simple language for naming different emotions.' },
    Worksheet: { title: 'My Strengths Worksheet', desc: 'A guided worksheet helping students reflect on what they are good at.' },
    Audio: { title: 'Mindful Check-In Audio', desc: 'A short audio track guiding students through noticing how they feel right now.' },
    Lesson: { title: 'Naming Emotions: Full Lesson', desc: 'Opens the full guided lesson inside the course, not just a standalone clip.' },
  },
  'Self-Management': {
    Video: { title: 'Calm-Down Strategies Video', desc: 'A short video modeling simple steps for calming down when upset.' },
    PDF: { title: 'Calm Down Corner Guide', desc: 'Printable steps for setting up a calm-down space in the classroom.' },
    Worksheet: { title: 'Managing Big Feelings Worksheet', desc: 'A worksheet activity for practicing self-management in the moment.' },
    Audio: { title: 'Breathing Break Audio', desc: 'A short guided breathing break for transitioning between activities.' },
    Lesson: { title: 'Self-Management Basics: Full Lesson', desc: 'Opens the full guided lesson inside the course, not just a standalone clip.' },
  },
  'Relationship Skills': {
    Video: { title: 'Active Listening Video', desc: 'A short video modeling what active listening looks like between peers.' },
    PDF: { title: 'Building Friendships Guide', desc: 'A printable guide with tips for starting and keeping a friendship.' },
    Worksheet: { title: 'Active Listening Worksheet', desc: 'Partner activity where students practice reflecting back what they heard.' },
    Audio: { title: 'Community Building Audio', desc: 'A short audio track supporting relationship skills practice.' },
    Lesson: { title: 'Working Together: Full Lesson', desc: 'Opens the full guided lesson inside the course, not just a standalone clip.' },
  },
  'Social Awareness': {
    Video: { title: 'Understanding Others Video', desc: 'A short video introducing social awareness through a classroom scenario.' },
    PDF: { title: 'Empathy in Action Guide', desc: 'A printable guide with prompts for practicing empathy toward classmates.' },
    Worksheet: { title: 'Perspective-Taking Worksheet', desc: 'A worksheet activity for practicing social awareness.' },
    Audio: { title: 'Walking in Their Shoes Audio', desc: 'A short audio track guiding students through a perspective-taking exercise.' },
    Lesson: { title: 'Understanding Others: Full Lesson', desc: 'Opens the full guided lesson inside the course, not just a standalone clip.' },
  },
  'Responsible Decision-Making': {
    Video: { title: 'Making Good Choices Video', desc: 'A short video walking through weighing a decision out loud.' },
    PDF: { title: 'Weighing Consequences Guide', desc: 'A printable guide supporting responsible decision-making.' },
    Worksheet: { title: 'Decision-Making Scenarios Worksheet', desc: 'A worksheet activity for practicing responsible decision-making.' },
    Audio: { title: 'Thinking It Through Audio', desc: 'A short audio track supporting responsible decision-making practice.' },
    Lesson: { title: 'Weighing My Options: Full Lesson', desc: 'Opens the full guided lesson inside the course, not just a standalone clip.' },
  },
}

const UNIT_BY_COMPETENCY = {
  'Self-Awareness': 'Naming Emotions',
  'Self-Management': 'Self-Management Basics',
  'Relationship Skills': 'Communication Skills',
  'Social Awareness': 'Understanding Others',
  'Responsible Decision-Making': 'Weighing Consequences',
}

// Course Type varies by file type rather than by grade, matching the
// pattern this app's other mock resource lists already use (a PDF tends to
// be Tier 2, an Audio tends to be a Family take-home) — gives every grade
// a believable course-type mix, not just a wall of Tier 1.
const COURSE_TYPE_BY_FILE_TYPE = { Video: 'Tier 1', PDF: 'Tier 2', Worksheet: 'Tier 1', Audio: 'Family', Lesson: 'Tier 1' }

const ALL_INDIVIDUAL_GRADES = [...ELEMENTARY_GROUP, ...MIDDLE_GROUP, ...HIGH_GROUP]

function buildGradeResources(grade) {
  return COMPETENCIES.flatMap((competency) =>
    Object.entries(CORE_TEMPLATE_GRID[competency]).map(([type, { title, desc }]) => ({
      title, type, grade, competency, desc,
      courseType: COURSE_TYPE_BY_FILE_TYPE[type],
      unit: `Unit: ${UNIT_BY_COMPETENCY[competency]}`,
    }))
  )
}

// Two hand-kept rows (unchanged since the Webinar-to-Link reclassification)
// so the 'Link' file type still has real, specific content rather than
// only appearing in the generated grid above.
const LINK_RESOURCES = [
  { title: 'Family Wellness Webinar Replay', type: 'Link', grade: '2nd Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit: Belonging at Home and School', desc: 'Recorded parent session on reinforcing social-awareness skills at home.' },
  { title: 'Weekly Check-In Webinar for Families', type: 'Link', grade: '8th Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit: Resolving Conflict', desc: 'Recorded session on keeping communication open during the middle school years.' },
]

const MOCK_RESOURCES = [...ALL_INDIVIDUAL_GRADES.flatMap(buildGradeResources), ...LINK_RESOURCES]

// New for this page (2026-09-28) — invented, since no real DESSA Strategy
// Library content exists anywhere in the app yet. Titling/voice modeled on
// the two real sample strategies shown on Dashboard/RatingSummary ("What's
// Important to Me?"). Grade is "All Grades" rather than any specific grade
// since a DESSA strategy isn't grade-locked the way a curriculum unit is —
// same treatment "All Grades" already gets elsewhere in this app. All are
// PDFs, per the request ("DESSA strategies (all PDF documents)"). Only
// merged into the catalog when Concept B is active.
const DESSA_STRATEGY_RESOURCES = [
  { title: 'Naming My Strengths', type: 'PDF', grade: 'All Grades', competency: 'Self-Awareness', courseType: 'DESSA', unit: 'DESSA Strategy Library', desc: 'A guided reflection helping students identify and name their own personal strengths.' },
  { title: 'Cool Down Countdown', type: 'PDF', grade: 'All Grades', competency: 'Self-Management', courseType: 'DESSA', unit: 'DESSA Strategy Library', desc: 'A simple countdown routine students can use to de-escalate before reacting.' },
  { title: 'Building Bridges', type: 'PDF', grade: 'All Grades', competency: 'Relationship Skills', courseType: 'DESSA', unit: 'DESSA Strategy Library', desc: 'A partner activity for repairing and strengthening a strained peer relationship.' },
  { title: 'Walking in Their Shoes', type: 'PDF', grade: 'All Grades', competency: 'Social Awareness', courseType: 'DESSA', unit: 'DESSA Strategy Library', desc: 'A perspective-taking exercise for understanding a classmate’s point of view.' },
  { title: 'What’s Important to Me?', type: 'PDF', grade: 'All Grades', competency: 'Responsible Decision-Making', courseType: 'DESSA', unit: 'DESSA Strategy Library', desc: 'Students consider their personal values and how those values inform a decision.' },
]

// New for this page (2026-09-28) — invented demo resources for the new
// 'Foundational Practices' Course Type, per explicit request. These are
// universal classroom routines (distinct from a specific Tier 1 unit or a
// DESSA strategy) — same "All Grades" treatment as the DESSA rows above.
const FOUNDATIONAL_PRACTICES_RESOURCES = [
  { title: 'Morning Meeting Routine', type: 'PDF', grade: 'All Grades', competency: 'Relationship Skills', courseType: 'Foundational Practices', unit: 'Foundational Practices', desc: 'A repeatable opening routine for building classroom community at the start of the day.' },
  { title: 'Classroom Agreements Poster', type: 'PDF', grade: 'All Grades', competency: 'Responsible Decision-Making', courseType: 'Foundational Practices', unit: 'Foundational Practices', desc: 'A printable poster template for co-creating classroom norms with students.' },
  { title: 'Daily Check-In Circle Guide', type: 'Worksheet', grade: 'All Grades', competency: 'Self-Awareness', courseType: 'Foundational Practices', unit: 'Foundational Practices', desc: 'A facilitation guide for a short daily circle where students name how they are doing.' },
  { title: 'Transition Signal Cues', type: 'Video', grade: 'All Grades', competency: 'Self-Management', courseType: 'Foundational Practices', unit: 'Foundational Practices', desc: 'A short video modeling consistent signals for moving smoothly between activities.' },
  { title: 'Restorative Conversation Starters', type: 'Worksheet', grade: 'All Grades', competency: 'Relationship Skills', courseType: 'Foundational Practices', unit: 'Foundational Practices', desc: 'Prompt cards for guiding a student conversation after a classroom conflict.' },
]

const TABLE_PAGE_SIZE = 20

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

function SortableHead({ label, sortKey, activeKey, dir, onSort }) {
  const active = activeKey === sortKey
  return (
    <TableHead>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="inline-flex items-center gap-1 hover:text-dessa-teal transition-colors"
      >
        {label}
        <ChevronDown size={12} className={`transition-transform ${active ? 'text-dessa-teal' : 'text-brand-subtext/50'} ${active && dir === 'desc' ? 'rotate-180' : ''}`} />
      </button>
    </TableHead>
  )
}

function CondensedResultsTable({ rows }) {
  // Sorted by Title by default, per explicit request (was unsorted until a
  // column header was clicked).
  const [sortKey, setSortKey] = useState('title')
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE)

  const rowsKey = rows.map((r) => `${r.grade}|${r.title}`).join(',')
  const [prevRowsKey, setPrevRowsKey] = useState(rowsKey)
  if (rowsKey !== prevRowsKey) {
    setPrevRowsKey(rowsKey)
    setPage(1)
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  if (rows.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-lg font-semibold text-brand-text mb-1.5">No resources found</p>
        <p className="text-sm text-brand-subtext max-w-sm mx-auto">Try adjusting your keywords or clearing the filters.</p>
      </div>
    )
  }

  const sortedRows = sortKey
    ? [...rows].sort((a, b) => {
        const cmp = String(a[sortKey]).localeCompare(String(b[sortKey]))
        return sortDir === 'asc' ? cmp : -cmp
      })
    : rows
  const totalPages = Math.max(1, Math.ceil(sortedRows.length / pageSize))
  const pagedRows = sortedRows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <>
    <Table>
      <TableHeader>
        <TableRow className="hover:bg-transparent">
          <SortableHead label="Type" sortKey="type" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortableHead label="Title" sortKey="title" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
          <TableHead>Description</TableHead>
          <SortableHead label="Course Type" sortKey="courseType" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortableHead label="Competency" sortKey="competency" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagedRows.map((r) => {
          const typeMeta = TYPE_META[r.type]
          return (
            <TableRow
              key={`${r.grade}-${r.title}`}
              onClick={() => window.open(PREVIEW_URL, '_blank', 'noopener,noreferrer')}
              className="cursor-pointer"
            >
              <TableCell className="py-1.5">
                <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-[5px] whitespace-nowrap ${typeMeta.bg} bg-opacity-10 ${typeMeta.color}`}>
                  <typeMeta.icon size={14} />
                  <span className="text-xs font-medium">{typeMeta.label}</span>
                </span>
              </TableCell>
              <TableCell className="py-1.5">
                <a
                  href={PREVIEW_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="text-left font-medium text-brand-text hover:text-dessa-teal hover:underline transition-colors truncate max-w-xs block"
                >
                  {r.title}
                </a>
              </TableCell>
              <TableCell className="py-1.5 text-brand-subtext truncate max-w-xs">{r.desc}</TableCell>
              <TableCell className="py-1.5 whitespace-nowrap text-brand-subtext">{r.courseType}</TableCell>
              <TableCell className="py-1.5 whitespace-nowrap text-brand-subtext">{r.competency}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
    <div className="flex items-center justify-between px-6 py-4">
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
          </PaginationItem>
          {pageWindow(page, totalPages).map((p, i) =>
            p === 'ellipsis' ? (
              <PaginationItem key={`ellipsis-${i}`}>
                <PaginationEllipsis />
              </PaginationItem>
            ) : (
              <PaginationItem key={p}>
                <PaginationLink isActive={p === page} onClick={() => setPage(p)}>
                  {p}
                </PaginationLink>
              </PaginationItem>
            )
          )}
          <PaginationItem>
            <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
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
    </>
  )
}

function ResultsHeader({ chips }) {
  return (
    <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2 flex-1">
        {chips.map((c) => (
          <span key={c} className="inline-flex items-center pl-3 pr-3 py-1.5 rounded-full bg-dessa-tealLight text-dessa-teal text-sm font-medium">
            {c}
          </span>
        ))}
      </div>
    </div>
  )
}

// maxHeightClass defaults to fitting ~5 rows (Competency, unaffected by
// the 2026-09-28 scrolling feedback). Course Type/File Type pass a taller
// value sized to their current 6 options with no scrollbar; Grade Level
// passes a taller-still value that shows more of its 15 options at once
// without trying to fit all of them (still scrolls for the rest).
function FilterField({ label, options, selected, onToggle, single = false, open, onOpenChange, maxHeightClass = 'max-h-56' }) {
  const summary = selected.length === 0 ? 'All' : selected.length === 1 ? selected[0] : `${selected.length} selected`
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-semibold text-brand-text">{label}</p>
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="w-full flex items-center justify-between gap-2 h-10 px-3 text-sm border border-brand-border rounded-md bg-white text-brand-subtext hover:border-dessa-teal/50 transition-colors"
          >
            <span className="truncate text-left">{summary}</span>
            <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={4}
            className={`z-30 min-w-[--radix-popover-trigger-width] w-max max-w-xs bg-white border border-brand-border rounded-xl shadow-lg outline-none p-2 ${maxHeightClass} overflow-y-auto`}
          >
            {options.map((opt) => {
              const isSelected = selected.includes(opt)
              return (
                <button
                  key={opt}
                  type="button"
                  role={single ? 'radio' : 'checkbox'}
                  aria-checked={isSelected}
                  onClick={() => {
                    onToggle(opt)
                    if (single) onOpenChange(false)
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                    isSelected ? 'bg-[rgba(15,148,172,0.1)] text-brand-text' : 'text-brand-text hover:bg-brand-bg'
                  }`}
                >
                  <span className={`w-4 h-4 flex items-center justify-center shrink-0 border-2 ${single ? 'rounded-full' : 'rounded'} ${isSelected ? 'bg-dessa-teal border-dessa-teal' : 'border-brand-border'}`}>
                    {isSelected && (single
                      ? <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      : <Check size={11} strokeWidth={3} className="text-white" />
                    )}
                  </span>
                  <span>{opt}</span>
                </button>
              )
            })}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

function FilterBar({ grades, courseTypes, competencies, types, onSelectGrade, onToggleCourseType, onToggleCompetency, onToggleType, onResetAll }) {
  const [expanded, setExpanded] = useState(true)
  const [openField, setOpenField] = useState(null)
  const hasActiveFilters = (grades[0] && grades[0] !== 'All Grades') || courseTypes.length > 0 || competencies.length > 0 || types.length > 0
  return (
    <div className="mb-6 rounded-2xl border border-brand-border bg-white">
      <button
        type="button"
        onClick={() => {
          setExpanded((e) => !e)
          setOpenField(null)
        }}
        aria-expanded={expanded}
        className="w-full flex items-center gap-1.5 px-5 py-4 text-base font-semibold text-brand-text"
      >
        <span className="relative">
          Filters
          {hasActiveFilters && <span aria-hidden="true" className="absolute top-1 left-12 w-1.5 h-1.5 rounded-full bg-dessa-teal" />}
        </span>
        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-5 pt-5 pb-5 border-t border-brand-border">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <FilterField
              label="Grade Level"
              options={SELECTABLE_GRADES}
              selected={grades}
              onToggle={onSelectGrade}
              single
              open={openField === 'grade'}
              onOpenChange={(o) => setOpenField(o ? 'grade' : null)}
              maxHeightClass="max-h-80"
            />
            <FilterField
              label="Course Type"
              options={COURSE_TYPES}
              selected={courseTypes}
              onToggle={onToggleCourseType}
              open={openField === 'courseType'}
              onOpenChange={(o) => setOpenField(o ? 'courseType' : null)}
              maxHeightClass="max-h-64"
            />
            <FilterField
              label="Competency"
              options={COMPETENCIES}
              selected={competencies}
              onToggle={onToggleCompetency}
              open={openField === 'competency'}
              onOpenChange={(o) => setOpenField(o ? 'competency' : null)}
            />
            <FilterField
              label="File Type"
              options={Object.keys(TYPE_META).map((t) => TYPE_META[t].label)}
              selected={types.map((t) => TYPE_META[t].label)}
              onToggle={(label) => onToggleType(Object.keys(TYPE_META).find((t) => TYPE_META[t].label === label))}
              open={openField === 'type'}
              onOpenChange={(o) => setOpenField(o ? 'type' : null)}
              maxHeightClass="max-h-64"
            />
          </div>
          <div className="flex items-center gap-4 mt-5">
            <button type="button" onClick={onResetAll} className="text-sm font-medium text-brand-subtext hover:text-brand-text transition-colors">
              Reset filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Full catalog, always — Concept B (DESSA Strategy Library + Foundational
// Practices folded in) is the only version now.
const CATALOG = [...MOCK_RESOURCES, ...DESSA_STRATEGY_RESOURCES, ...FOUNDATIONAL_PRACTICES_RESOURCES]

export default function ResourceLibrary() {
  const [searchParams] = useSearchParams()
  const grade = searchParams.get('grade') || 'All Grades'
  // Keyed on grade so re-using the nav's hover grade menu while already on
  // this page forces a fresh instance seeded with the new grade, rather
  // than needing an effect to sync state pulled from the URL after mount.
  return <ResourceLibraryView key={grade} initialGrade={grade} />
}

function ResourceLibraryView({ initialGrade }) {
  const [selectedGrade, setSelectedGrade] = useState(initialGrade)
  const [courseTypes, setCourseTypes] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [types, setTypes] = useState([])
  const [query, setQuery] = useState('')

  function toggle(setFn, current, value) {
    setFn(current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }
  function resetAll() {
    setSelectedGrade('All Grades')
    setCourseTypes([])
    setCompetencies([])
    setTypes([])
  }

  let rows = CATALOG
  if (selectedGrade !== 'All Grades') rows = rows.filter((r) => r.grade === selectedGrade)
  const q = query.trim().toLowerCase()
  if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q))
  if (courseTypes.length) rows = rows.filter((r) => courseTypes.includes(r.courseType))
  if (competencies.length) rows = rows.filter((r) => competencies.includes(r.competency))
  if (types.length) rows = rows.filter((r) => types.includes(r.type))

  const chips = [...courseTypes, ...competencies, ...types.map((t) => TYPE_META[t].label)]

  return (
    <div className="px-6 pt-6 pb-16">
      <div className="rounded-2xl border border-brand-border bg-white p-5 mb-6">
        <div className="flex items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search guides, videos, worksheets..."
              className="w-full pl-11 pr-9 h-11 rounded-full border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-subtext hover:text-brand-text transition-colors"
              >
                <X size={15} />
              </button>
            )}
          </div>
          <button type="button" className="shrink-0 px-6 h-11 rounded-full text-sm font-semibold bg-dessa-teal text-white hover:bg-dessa-teal/90 transition-colors">
            Search
          </button>
        </div>
      </div>
      <FilterBar
        grades={[selectedGrade]}
        courseTypes={courseTypes}
        competencies={competencies}
        types={types}
        onSelectGrade={setSelectedGrade}
        onToggleCourseType={(v) => toggle(setCourseTypes, courseTypes, v)}
        onToggleCompetency={(v) => toggle(setCompetencies, competencies, v)}
        onToggleType={(v) => toggle(setTypes, types, v)}
        onResetAll={resetAll}
      />
      <div className="flex-1 min-w-0 rounded-2xl border border-brand-border bg-white overflow-hidden">
        <ResultsHeader chips={chips} />
        <CondensedResultsTable rows={rows} />
      </div>
    </div>
  )
}
