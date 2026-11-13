import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useSearchParams } from 'react-router-dom'
import {
  Search, Video, FileText, Mic, Link2, PlayCircle,
  ChevronDown, Check, X, Plus, MoreHorizontal, Target, Trash2, ChevronRight,
  // ExternalLink, Download, Printer, // the row menu's first items, out 2026-11-11
} from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { schools } from '../lib/report2Data'
import { CLASS_ROSTER } from '../lib/classRosterData'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis, pageWindow,
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
// still real family-facing content. 'Worksheet' removed the same day, also
// out of scope — its resources are reclassified as 'PDF' (see
// REAL_FILE_TYPE below and FOUNDATIONAL_PRACTICES_RESOURCES), not deleted.
const TYPE_META = {
  Video: { icon: Video, label: 'Video', color: 'text-dessa-magenta', bg: 'bg-dessa-magenta', brand: 'bg-org-red-100/90 text-org-red-700' },
  PDF: { icon: FileText, label: 'PDF', color: 'text-mtw-purple', bg: 'bg-mtw-purple', brand: 'bg-org-gray-50/90 text-org-gray-700' },
  Audio: { icon: Mic, label: 'Audio', color: 'text-mtw-blue', bg: 'bg-mtw-blue', brand: 'bg-org-primary-50/90 text-org-primary-700' },
  Link: { icon: Link2, label: 'Link', color: 'text-mtw-green', bg: 'bg-mtw-green', brand: 'bg-org-green-100/90 text-org-green-700' },
  Lesson: { icon: PlayCircle, label: 'Lesson', color: 'text-mtw-amber', bg: 'bg-mtw-amber', brand: 'bg-org-yellow-200/90 text-org-gray-700' },
}

// Two switchable looks for the type pills. 'legacy' is
// the prototype's original palette, kept so it can be brought back as a
// future proposition; 'brand' is the org design system (org-* tokens).
// Shift+B flips between them on this page only (see ResourceLibraryView).
const PALETTE_KEY = 'resourceLibraryPalette'
const PALETTE_LABELS = { legacy: 'Original', brand: 'Brand' }
// Filter chips keep the original teal look in both palettes.
const CHIP_STYLE = {
  chip: 'border-dessa-teal/30 bg-dessa-tealLight text-dessa-teal',
  xHover: 'hover:bg-dessa-teal/10 focus-visible:outline-dessa-teal',
  plus: 'bg-dessa-teal hover:bg-dessa-teal/90',
}
const PaletteContext = createContext('brand')

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

// 'Worksheet' removed 2026-09-28 as a selectable file type (out of scope) —
// the grid keeps its own "Worksheet" slot internally, for title/desc/
// course-type variety, but every row generated from that slot is written
// out as a real PDF, per explicit request ("reclassify as PDF"). Slots not
// listed here pass through unchanged.
const REAL_FILE_TYPE = { Worksheet: 'PDF' }

const ALL_INDIVIDUAL_GRADES = [...ELEMENTARY_GROUP, ...MIDDLE_GROUP, ...HIGH_GROUP]

function buildGradeResources(grade) {
  return COMPETENCIES.flatMap((competency) =>
    Object.entries(CORE_TEMPLATE_GRID[competency]).map(([slotType, { title, desc }]) => ({
      title, grade, competency, desc,
      type: REAL_FILE_TYPE[slotType] || slotType,
      courseType: COURSE_TYPE_BY_FILE_TYPE[slotType],
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
  { title: 'Daily Check-In Circle Guide', type: 'PDF', grade: 'All Grades', competency: 'Self-Awareness', courseType: 'Foundational Practices', unit: 'Foundational Practices', desc: 'A facilitation guide for a short daily circle where students name how they are doing.' },
  { title: 'Transition Signal Cues', type: 'Video', grade: 'All Grades', competency: 'Self-Management', courseType: 'Foundational Practices', unit: 'Foundational Practices', desc: 'A short video modeling consistent signals for moving smoothly between activities.' },
  { title: 'Restorative Conversation Starters', type: 'PDF', grade: 'All Grades', competency: 'Relationship Skills', courseType: 'Foundational Practices', unit: 'Foundational Practices', desc: 'Prompt cards for guiding a student conversation after a classroom conflict.' },
]

// A 3-dot menu on DESSA rows only (2026-11-11), in a column of its own at the far right. A popover, so it isn't
// clipped by the table, and its clicks don't reach the row, which opens the preview. One item, Track strategy, which
// opens the Track strategy modal (2026-11-11, modelled on the production Add strategy modal).
// The first items, each opening the preview:
// const ROW_MENU = [
//   { icon: ExternalLink, label: 'Open in new tab' },
//   { icon: Download, label: 'Download PDF' },
//   { icon: Printer, label: 'Print' },
// ]
function RowMenu({ title, onTrack }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          aria-label={`More options for ${title}`}
          // Stays in its hover state while its menu is open (2026-11-13), so it's clear which row the menu belongs to.
          className="flex items-center justify-center w-8 h-8 rounded-md text-brand-subtext hover:bg-brand-bg hover:text-brand-text data-[state=open]:bg-brand-bg data-[state=open]:text-brand-text transition-colors"
        >
          <MoreHorizontal size={16} aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end" sideOffset={4} role="menu" onClick={(e) => e.stopPropagation()}
          className="z-50 w-48 py-1 bg-white border border-brand-border rounded-lg shadow-lg"
        >
          <button
            type="button" role="menuitem"
            onClick={() => { setOpen(false); onTrack() }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-brand-text hover:bg-brand-bg transition-colors"
          >
            {/* Icon out 2026-11-13: <Target size={14} className="text-brand-subtext" aria-hidden="true" /> */}
            Track strategy
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// ─── Track strategy modal (2026-11-11) ──────────────────────────────────────
// Modelled on the production "Add SEL Strategy" modal, renamed since "SEL" isn't used in the product. Pick a site,
// then add students by searching, by pasting student IDs, or all the students you rate; each can be removed. Next
// is ready once there's at least one student.
// Mock students: every site has the fictional class roster, with its own student IDs. Tara rates her own site's.
const studentsAt = site => CLASS_ROSTER.map((name, i) => {
  const [first, last] = name.split(' ')
  return { id: String(100000 + site.id * 1000 + i), name: `${last}, ${first}`, site: site.name }
}).sort((a, b) => a.name.localeCompare(b.name))
const MY_SITE = schools[0]

function TrackStrategyModal({ strategy, onClose }) {
  const [siteId, setSiteId] = useState(String(MY_SITE.id))
  const [query, setQuery] = useState('')
  const [chosen, setChosen] = useState([])
  const [pasted, setPasted] = useState(null)
  const panelRef = useRef(null)
  const searchRef = useRef(null)
  const site = schools.find(sc => String(sc.id) === siteId)
  const roster = useMemo(() => studentsAt(site), [site])
  const chosenIds = new Set(chosen.map(st => st.id))
  const q = query.trim().toLowerCase()
  const matches = q ? roster.filter(st => !chosenIds.has(st.id) && (st.name.toLowerCase().includes(q) || st.id.includes(q))).slice(0, 8) : []
  const add = list => setChosen(c => [...c, ...list.filter(st => !c.some(x => x.id === st.id))])

  // Escape closes; focus starts in the search and goes back to the row's menu button on close.
  useEffect(() => {
    const before = document.activeElement
    searchRef.current?.focus()
    const onKey = e => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); before?.focus?.() }
  }, [onClose])
  // Tab stays inside the modal.
  function trap(e) {
    if (e.key !== 'Tab') return
    const els = panelRef.current.querySelectorAll('button:not([disabled]), input, select')
    const first = els[0], last = els[els.length - 1]
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
  }
  // Pasting student IDs adds every one found at the site, and says how many it found.
  function onPaste(e) {
    const ids = e.clipboardData.getData('text').match(/\d{6}/g)
    if (!ids || ids.length < 2) return
    e.preventDefault()
    const found = roster.filter(st => ids.includes(st.id))
    add(found)
    setPasted({ found: found.length, missed: ids.length - found.length })
  }

  return createPortal(
    <>
      <div className="fixed inset-0 z-50 bg-dessa-navy/40" onClick={onClose} aria-hidden="true" />
      <div
        ref={panelRef} role="dialog" aria-modal="true" aria-labelledby="track-title" aria-describedby="track-strategy" onKeyDown={trap}
        className="fixed z-50 inset-x-4 top-1/2 -translate-y-1/2 mx-auto max-w-2xl max-h-[85vh] flex flex-col bg-white rounded-lg shadow-xl"
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4">
          <div className="min-w-0">
            <h2 id="track-title" className="text-lg font-semibold text-brand-text">Track strategy</h2>
            <p id="track-strategy" className="mt-0.5 text-sm text-brand-subtext truncate">{strategy.title}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 -mr-1.5 rounded-md text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-5 flex flex-col gap-4">
          <label className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-brand-subtext">Site</span>
            <span className="relative">
              <select
                value={siteId} onChange={e => { setSiteId(e.target.value); setQuery('') }}
                className="w-full h-9 pl-3 pr-9 appearance-none rounded-md border border-brand-border bg-white text-sm text-brand-text hover:bg-brand-bg cursor-pointer"
              >
                {schools.map(sc => <option key={sc.id} value={sc.id}>{sc.name}</option>)}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" aria-hidden="true" />
            </span>
          </label>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-end justify-between gap-4">
              <label htmlFor="track-search" className="text-xs font-medium text-brand-subtext">Add students</label>
              {site.id === MY_SITE.id && (
                <button type="button" onClick={() => add(roster)} className="text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4">
                  Add all students I rate
                </button>
              )}
            </div>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" aria-hidden="true" />
              <input
                ref={searchRef} id="track-search" type="search" value={query} onChange={e => { setQuery(e.target.value); setPasted(null) }} onPaste={onPaste}
                placeholder="Search by name, or paste student IDs"
                role="combobox" aria-expanded={matches.length > 0} aria-controls="track-results" autoComplete="off"
                className="w-full h-9 pl-9 pr-3 rounded-md border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-subtext/70"
              />
              {matches.length > 0 && (
                <ul id="track-results" role="listbox" className="absolute z-10 left-0 right-0 top-full mt-1 py-1 bg-white border border-brand-border rounded-lg shadow-lg max-h-64 overflow-y-auto">
                  {matches.map(st => (
                    <li key={st.id} role="option" aria-selected="false">
                      <button
                        type="button" onClick={() => { add([st]); setQuery(''); searchRef.current?.focus() }}
                        className="w-full flex items-center justify-between gap-3 px-3 py-2 text-sm text-left hover:bg-brand-bg"
                      >
                        <span className="truncate text-brand-text">{st.name}</span>
                        <span className="shrink-0 text-xs text-brand-subtext tabular-nums">{st.id}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {pasted && (
              <p className="text-xs text-brand-subtext" aria-live="polite">
                Added {pasted.found} {pasted.found === 1 ? 'student' : 'students'}{pasted.missed > 0 ? `. ${pasted.missed} ${pasted.missed === 1 ? 'ID wasn’t' : 'IDs weren’t'} found at ${site.name}` : ''}
              </p>
            )}
          </div>

          <section aria-label="Students" className="rounded-lg border border-brand-border overflow-hidden">
            <div className="flex items-center justify-between gap-4 px-4 h-9 bg-brand-bg">
              <h3 className="text-sm font-semibold text-brand-text">Students{chosen.length > 0 && <span className="ml-1.5 font-normal text-brand-subtext tabular-nums">{chosen.length}</span>}</h3>
              {chosen.length > 0 && (
                <button type="button" onClick={() => setChosen([])} className="text-xs font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4">Remove all</button>
              )}
            </div>
            {chosen.length ? (
              <ul className="divide-y divide-brand-border max-h-64 overflow-y-auto">
                {chosen.map(st => (
                  <li key={st.id} className="flex items-center justify-between gap-3 pl-4 pr-2 py-1.5 text-sm">
                    <span className="min-w-0 flex items-baseline gap-2">
                      <span className="truncate text-brand-text">{st.name}</span>
                      <span className="shrink-0 text-xs text-brand-subtext tabular-nums">{st.id}</span>
                      <span className="hidden sm:inline truncate text-xs text-brand-subtext">{st.site}</span>
                    </span>
                    <button
                      type="button" onClick={() => setChosen(c => c.filter(x => x.id !== st.id))} aria-label={`Remove ${st.name}`}
                      className="shrink-0 p-1.5 rounded-md text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            ) : <p className="px-4 py-8 text-sm text-center text-brand-subtext">No students added yet</p>}
          </section>
        </div>

        <div className="flex justify-end gap-2 px-6 py-4 border-t border-brand-border">
          <button type="button" onClick={onClose} className="inline-flex items-center h-9 px-4 rounded-md border border-brand-border bg-white text-sm font-medium text-brand-text hover:bg-brand-bg">Cancel</button>
          {/* Next's step isn't designed yet, so it closes the modal for now. */}
          <button
            type="button" onClick={onClose} disabled={!chosen.length}
            className="inline-flex items-center gap-1 h-9 px-4 rounded-md bg-dessa-teal text-sm font-semibold text-white hover:bg-dessa-teal/90 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
    </>,
    document.body,
  )
}

const TABLE_PAGE_SIZE = 20

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
  // The DESSA strategy whose Track strategy modal is open. Closing is stable, so the modal's focus handling runs once.
  const [tracking, setTracking] = useState(null)
  const closeTracking = useCallback(() => setTracking(null), [])
  const [sortDir, setSortDir] = useState('asc')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(TABLE_PAGE_SIZE)
  const palette = useContext(PaletteContext)

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
      <TableHeader className="bg-brand-bg/50">
        <TableRow className="hover:bg-transparent">
          <SortableHead label="Type" sortKey="type" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortableHead label="Title" sortKey="title" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
          <TableHead>Description</TableHead>
          <SortableHead label="Course Type" sortKey="courseType" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
          <SortableHead label="Competency" sortKey="competency" activeKey={sortKey} dir={sortDir} onSort={handleSort} />
          <TableHead className="w-12"><span className="sr-only">Actions</span></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {pagedRows.map((r) => {
          const typeMeta = TYPE_META[r.type]
          const typeClasses = palette === 'brand' ? typeMeta.brand : `${typeMeta.bg} bg-opacity-10 ${typeMeta.color}`
          return (
            <TableRow
              key={`${r.grade}-${r.title}`}
              onClick={() => window.open(PREVIEW_URL, '_blank', 'noopener,noreferrer')}
              className="cursor-pointer"
            >
              <TableCell className="py-1.5">
                <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-[5px] whitespace-nowrap ${typeClasses}`}>
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
              <TableCell className="py-1.5 pr-3 text-right">{r.courseType === 'DESSA' && <RowMenu title={r.title} onTrack={() => setTracking(r)} />}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
    {tracking && <TrackStrategyModal strategy={tracking} onClose={closeTracking} />}
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

// maxHeightClass defaults to fitting ~5 rows (Competency, unaffected by
// the 2026-09-28 scrolling feedback). Course Type/File Type pass a taller
// value sized to their current 6 options with no scrollbar; Grade Level
// passes a taller-still value that shows more of its 15 options at once
// without trying to fit all of them (still scrolls for the rest).
function FilterField({ label, options, selected, onToggle, single = false, open, onOpenChange, maxHeightClass = 'max-h-56' }) {
  // Grade Level's "All Grades" is the empty state, not a chip.
  const chipStyle = CHIP_STYLE
  const values = single ? selected.filter((v) => v !== 'All Grades') : selected
  const hasSelection = values.length > 0
  const canAdd = hasSelection && !single
  const remove = (v) => onToggle(single ? 'All Grades' : v)
  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-semibold text-brand-text">{label}</p>
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Anchor asChild>
          <div
            onClick={(e) => { if (!e.target.closest('button')) onOpenChange(!open) }}
            className="w-full flex items-center justify-between gap-2 h-10 pl-3 pr-1.5 text-sm border border-brand-border rounded-md bg-white text-brand-subtext hover:border-dessa-teal/50 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              {hasSelection ? (
                <>
                  <span className={`inline-flex items-center gap-1.5 min-w-0 max-w-36 px-2 py-1 rounded border text-sm ${chipStyle.chip}`}>
                    <span className="truncate">{values[0]}</span>
                    <button
                      type="button"
                      onClick={() => remove(values[0])}
                      aria-label={`Remove ${values[0]}`}
                      className={`shrink-0 rounded-sm focus-visible:outline focus-visible:outline-2 ${chipStyle.xHover}`}
                    >
                      <X size={12} strokeWidth={2.5} />
                    </button>
                  </span>
                  {values.length > 1 && (
                    <span className="shrink-0 px-2 py-1 rounded bg-brand-border text-brand-text text-xs font-semibold" title={values.slice(1).join(', ')}>
                      +{values.length - 1}
                    </span>
                  )}
                </>
              ) : (
                <span className="truncate text-left">All</span>
              )}
            </div>
            <Popover.Trigger asChild>
              {canAdd ? (
                <button
                  type="button"
                  aria-label={`Add ${label}`}
                  className={`shrink-0 w-7 h-7 flex items-center justify-center rounded text-white transition-colors ${chipStyle.plus}`}
                >
                  <Plus size={16} strokeWidth={2.5} />
                </button>
              ) : (
                <button type="button" aria-label={`Open ${label} options`} className="shrink-0 w-7 h-7 flex items-center justify-center rounded">
                  <ChevronDown size={14} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
                </button>
              )}
            </Popover.Trigger>
          </div>
        </Popover.Anchor>
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
        Filters
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
  const [palette, setPalette] = useState(() => (localStorage.getItem(PALETTE_KEY) === 'legacy' ? 'legacy' : 'brand'))
  const [toast, setToast] = useState(null)
  const toastTimer = useRef(null)
  const paletteRef = useRef(palette)

  // Hidden Shift+B switch between the original and brand palettes. Bound
  // only while this page is mounted, and ignored while typing in a field.
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key !== 'B' || !e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target
      if (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName)) return
      const next = paletteRef.current === 'brand' ? 'legacy' : 'brand'
      paletteRef.current = next
      localStorage.setItem(PALETTE_KEY, next)
      setPalette(next)
      setToast(`Palette: ${PALETTE_LABELS[next]}`)
      clearTimeout(toastTimer.current)
      toastTimer.current = setTimeout(() => setToast(null), 1800)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      clearTimeout(toastTimer.current)
    }
  }, [])

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
  // 'All Grades'-tagged resources (DESSA Strategy Library, Foundational
  // Practices) aren't grade-locked by design, so they stay visible no
  // matter which specific grade is selected — previously they vanished
  // entirely once any single grade was picked, which made Course Type =
  // DESSA look empty everywhere but the "All Grades" view.
  if (selectedGrade !== 'All Grades') rows = rows.filter((r) => r.grade === selectedGrade || r.grade === 'All Grades')
  const q = query.trim().toLowerCase()
  if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q))
  if (courseTypes.length) rows = rows.filter((r) => courseTypes.includes(r.courseType))
  if (competencies.length) rows = rows.filter((r) => competencies.includes(r.competency))
  if (types.length) rows = rows.filter((r) => types.includes(r.type))

  return (
    <PaletteContext.Provider value={palette}>
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
        <CondensedResultsTable rows={rows} />
      </div>
      <div role="status" aria-live="polite" className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
        {toast && (
          <div className="px-4 py-2 rounded-md bg-brand-text text-white text-sm font-medium shadow-lg">{toast}</div>
        )}
      </div>
    </div>
    </PaletteContext.Provider>
  )
}
