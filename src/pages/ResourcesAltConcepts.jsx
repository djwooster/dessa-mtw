import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, Video, FileText, Mic, ClipboardList, MousePointerClick,
  BookOpen, Users, GraduationCap, Layers, ChevronDown, Presentation, PlayCircle,
  Check, LayoutList, LayoutGrid, PanelLeft, SlidersHorizontal,
} from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { useResourcesConcept } from '../lib/resourcesConceptContext'

// ─── Resources — alternate concepts B/C/D/E ────────────────────────────────
// Rendered by Resources.jsx whenever the nav's A/B/C/D/E switcher (see
// resourcesConceptContext.jsx + Nav.jsx) is on anything other than 'a' — 'a'
// is the live, already-shipped experience defined directly in Resources.jsx.
// These three used to live at their own /resources-concepts sandbox route
// (Concepts A/D/E there); folded in here, relettered B/C/D respectively, so
// every concept is reachable from one switcher instead of split across a
// settings-menu link and an always-on nav hover. Content is still mocked —
// this is page-structure/mechanism exploration, not a data migration.

const ELEMENTARY_GROUP = ['Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade']
const MIDDLE_GROUP = ['6th Grade', '7th Grade', '8th Grade']
const HIGH_GROUP = ['9th Grade', '10th Grade', '11th Grade', '12th Grade']
const SELECTABLE_GRADES = [...ELEMENTARY_GROUP, ...MIDDLE_GROUP, ...HIGH_GROUP, 'All Grades']
const COURSE_TYPES = ['Tier 1', 'Tier 2', 'Family']
const COMPETENCIES = ['Self-Awareness', 'Self-Management', 'Relationship Skills', 'Social Awareness', 'Responsible Decision-Making']

// Six types, covering every base the Monday review needs to demonstrate:
// standalone assets (Video/PDF/Worksheet/Audio), links to recorded sessions
// (Webinar), and resources that open a full lesson inside a course (Lesson)
// rather than a standalone clip.
const TYPE_META = {
  Video: { icon: Video, label: 'Video', color: 'text-dessa-magenta', bg: 'bg-dessa-magenta' },
  PDF: { icon: FileText, label: 'PDF', color: 'text-mtw-purple', bg: 'bg-mtw-purple' },
  Worksheet: { icon: ClipboardList, label: 'Worksheet', color: 'text-mtw-coral', bg: 'bg-mtw-coral' },
  Audio: { icon: Mic, label: 'Audio', color: 'text-mtw-blue', bg: 'bg-mtw-blue' },
  Webinar: { icon: Presentation, label: 'Webinar', color: 'text-mtw-green', bg: 'bg-mtw-green' },
  Lesson: { icon: PlayCircle, label: 'Lesson', color: 'text-mtw-amber', bg: 'bg-mtw-amber' },
}

// Expanded (2026-09-12) from 8 to 22 entries so every type/competency/course
// type/grade band has real coverage — filtering needs to actually produce
// varied, non-trivial result sets across B/C/D/E, not just prove the UI
// wires up. Still all mock data, not the real resourcesData catalog.
const MOCK_RESOURCES = [
  { title: 'Emotion Check-In Video', type: 'Video', grade: 'Kindergarten', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit 1: Naming Emotions', desc: 'A short video prompting students to name how they feel before the school day starts.' },
  { title: 'Calm Down Corner Guide', type: 'PDF', grade: '1st Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 2: Self-Management Basics', desc: 'Printable steps for setting up a calm-down space in an early elementary classroom.' },
  { title: 'Active Listening Worksheet', type: 'Worksheet', grade: '3rd Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit 5: Communication Skills', desc: 'Partner activity where students practice reflecting back what they heard.' },
  { title: 'Growth Mindset Poster', type: 'PDF', grade: '4th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit 3: Building Confidence', desc: 'Classroom poster reframing common "I can\'t" statements into growth language.' },
  { title: 'Conflict Resolution Roleplay', type: 'Video', grade: '6th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit 8: Resolving Conflict', desc: 'Modeled roleplay showing two students working through a disagreement.' },
  { title: 'Study Habits Audio Guide', type: 'Audio', grade: '7th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 6: Staying Organized', desc: 'A 6-minute audio walkthrough of building a weekly study routine.' },
  { title: 'Peer Pressure Discussion Cards', type: 'Worksheet', grade: '9th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit 11: Navigating Peer Influence', desc: 'Scenario cards for small-group discussion on navigating peer pressure.' },
  { title: 'Career Goals Reflection', type: 'PDF', grade: '11th Grade', competency: 'Responsible Decision-Making', courseType: 'Family', unit: 'Unit 14: Planning Ahead', desc: 'A guided worksheet for mapping near-term goals to a career interest.' },
  { title: 'Family Wellness Webinar Replay', type: 'Webinar', grade: '2nd Grade', competency: 'Social Awareness', courseType: 'Family', unit: 'Unit 4: Belonging at Home and School', desc: 'Recorded parent session on reinforcing social-awareness skills at home.' },
  { title: 'Understanding SEL at Home', type: 'Webinar', grade: '5th Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit 9: Talking About Feelings', desc: 'A live Q&A recording for families new to SEL vocabulary.' },
  { title: 'Mindful Minute: Full Lesson', type: 'Lesson', grade: 'Kindergarten', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 2: Self-Management Basics', desc: 'Opens the full guided lesson inside the Tier 1 course, not just a standalone clip.' },
  { title: 'Building Empathy: Full Lesson', type: 'Lesson', grade: '8th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit 10: Understanding Others', desc: 'Opens directly into the matching unit and lesson inside the course library.' },
  { title: 'Responsible Choices Case Studies', type: 'Worksheet', grade: '10th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit 13: Weighing Consequences', desc: 'Real-world scenarios for small-group discussion on weighing outcomes.' },
  { title: 'Self-Talk Reframe Cards', type: 'PDF', grade: '2nd Grade', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit 1: Naming Emotions', desc: 'Printable cards pairing common negative self-talk with a reframed alternative.' },
  { title: 'Community Circle Facilitation Guide', type: 'PDF', grade: '6th Grade', competency: 'Relationship Skills', courseType: 'Tier 2', unit: 'Unit 8: Resolving Conflict', desc: 'Step-by-step guide for running a restorative community circle discussion.' },
  { title: 'Breathing Break Audio', type: 'Audio', grade: '3rd Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 2: Self-Management Basics', desc: 'A 3-minute guided breathing break for transitioning between subjects.' },
  { title: 'Building Confidence at Home', type: 'Webinar', grade: '4th Grade', competency: 'Self-Awareness', courseType: 'Family', unit: 'Unit 3: Building Confidence', desc: 'Recorded family session on reinforcing growth-mindset language at home.' },
  { title: 'Navigating Peer Pressure: Full Lesson', type: 'Lesson', grade: '9th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit 11: Navigating Peer Influence', desc: 'Opens directly into the matching lesson inside the Tier 1 course.' },
  { title: 'Emotion Vocabulary Flashcards', type: 'Worksheet', grade: 'Pre-K', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit 1: Naming Emotions', desc: 'Picture-paired flashcards for building an early emotion vocabulary.' },
  { title: 'Staying Organized Audio Series', type: 'Audio', grade: '12th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 6: Staying Organized', desc: 'A short audio series on building sustainable study systems before graduation.' },
  { title: 'Decision-Making Roleplay Video', type: 'Video', grade: '5th Grade', competency: 'Responsible Decision-Making', courseType: 'Tier 1', unit: 'Unit 13: Weighing Consequences', desc: 'Modeled roleplay walking through weighing a tough decision out loud.' },
  { title: 'Weekly Check-In Webinar for Families', type: 'Webinar', grade: '8th Grade', competency: 'Relationship Skills', courseType: 'Family', unit: 'Unit 8: Resolving Conflict', desc: 'Recorded session on keeping communication open during the middle school years.' },
]

// ── Shared leaf pieces, used by two or more of B/C/D ──

function SearchBand() {
  return (
    <div className="w-screen mx-[calc(50%-50vw)] bg-brand-bg border-b border-brand-border sticky top-14 z-40">
      <div className="px-6 pt-[1.35rem] pb-4">
        <div className="flex items-stretch gap-4">
          <div className="relative w-[500px] shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
            <input
              type="text"
              placeholder="Search by competency, file type, or grade level"
              className="w-full pl-10 pr-9 h-11 text-sm border border-brand-border rounded-full bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            />
          </div>
          <button type="button" className="shrink-0 px-6 h-11 rounded-full text-sm font-semibold bg-dessa-teal text-white hover:bg-dessa-teal/90 transition-colors">
            Search
          </button>
        </div>
      </div>
    </div>
  )
}

function GateHeading({ heading, subcopy }) {
  return (
    <>
      <h1 className="text-4xl font-semibold text-brand-text mb-3">{heading}</h1>
      <p className="text-base text-brand-subtext mb-8 max-w-lg">{subcopy}</p>
    </>
  )
}

function ResultRows({ rows, showDividers }) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-lg font-semibold text-brand-text mb-1.5">No resources found</p>
        <p className="text-sm text-brand-subtext max-w-sm mx-auto">Try adjusting your keywords or clearing the filters.</p>
      </div>
    )
  }
  return (
    <div className="border-t border-brand-border">
      {rows.map((r, i) => {
        const showDivider = showDividers && (i === 0 || rows[i - 1].grade !== r.grade)
        const isLast = i === rows.length - 1
        const typeMeta = TYPE_META[r.type]
        return (
          <div key={r.title}>
            {showDivider && (
              <div
                className="px-6 py-2 border-b border-brand-border text-xs font-semibold text-brand-text uppercase tracking-wide"
                style={{ backgroundColor: 'rgba(241,242,245,0.29)' }}
              >
                {r.grade}
              </div>
            )}
            <div
              className={`w-full flex items-center gap-4 px-6 py-4 hover:bg-[rgba(15,148,172,0.1)] transition-colors cursor-pointer ${
                isLast ? 'rounded-b-2xl' : 'border-b border-brand-border'
              }`}
            >
              {/* Title and description are flexible + truncating (not
                  fixed pixel widths) so this row degrades gracefully when
                  its container is narrower than a full-width page — e.g.
                  Concept B's permanent sidebar eats real width that the
                  no-sidebar "Current" page doesn't have to share. Only the
                  trailing badge cluster stays shrink-0; everything else
                  absorbs the squeeze via min-w-0 + truncate instead of
                  pushing the badges past the visible edge. */}
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-semibold text-brand-text truncate">{r.title}</p>
                <p className="text-xs text-brand-subtext truncate mt-0.5">{r.unit}</p>
              </div>
              <p className="hidden lg:block flex-1 min-w-0 truncate text-left text-sm text-brand-subtext">{r.desc}</p>
              <div className="flex items-center gap-3 shrink-0">
                <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-[5px] whitespace-nowrap ${typeMeta.bg} bg-opacity-10 ${typeMeta.color}`}>
                  <typeMeta.icon size={14} />
                  <span className="text-xs font-medium">{typeMeta.label}</span>
                </span>
                <span className="hidden md:inline-flex items-center px-2.5 py-1 rounded-[5px] bg-brand-bg text-brand-text text-xs font-medium max-w-[160px] truncate">
                  {r.competency}
                </span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ResultsHeader({ chips, right }) {
  return (
    <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2 flex-1">
        {chips.map((c) => (
          <span key={c} className="inline-flex items-center pl-3 pr-3 py-1.5 rounded-full bg-dessa-tealLight text-dessa-teal text-sm font-medium">
            {c}
          </span>
        ))}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  )
}

// ── Shared results-view + filter-mechanic pieces, used by B/C/D/E ──
// Two independent axes, orthogonal to which entry concept (B/C/D/E) got you
// here: how filtering is presented (Bar vs. Sidebar) and how the result set
// itself is displayed (List vs. Cards). Both are held in
// resourcesConceptContext so a preference persists across switching entry
// concepts, but the controls for them live in the results UI itself, not
// the global nav — they only mean something once you're looking at results.

function SegToggle({ options, value, onChange }) {
  return (
    <div className="flex items-center rounded-md border border-brand-border overflow-hidden text-xs font-medium shrink-0">
      {options.map((opt, i) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          title={opt.title}
          aria-label={opt.title}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 transition-colors ${i > 0 ? 'border-l border-brand-border' : ''} ${
            value === opt.value ? 'bg-dessa-teal text-white' : 'text-brand-subtext hover:bg-brand-bg'
          }`}
        >
          <opt.icon size={13} />
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function ResultsCards({ rows }) {
  if (rows.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="text-lg font-semibold text-brand-text mb-1.5">No resources found</p>
        <p className="text-sm text-brand-subtext max-w-sm mx-auto">Try adjusting your keywords or clearing the filters.</p>
      </div>
    )
  }
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 px-6 pb-6">
      {rows.map((r) => {
        const typeMeta = TYPE_META[r.type]
        return (
          <div
            key={r.title}
            className="rounded-xl border border-brand-border bg-white p-4 flex flex-col gap-3 hover:border-dessa-teal/40 hover:shadow-sm transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-[5px] ${typeMeta.bg} bg-opacity-10 ${typeMeta.color}`}>
                <typeMeta.icon size={14} />
                <span className="text-xs font-medium">{typeMeta.label}</span>
              </span>
              <span className="inline-flex items-center px-2.5 py-1 rounded-[5px] bg-brand-bg text-brand-text text-xs font-medium shrink-0">
                {r.competency}
              </span>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-brand-text leading-snug">{r.title}</p>
              <p className="text-xs text-brand-subtext mt-0.5">{r.unit}</p>
            </div>
            <p className="text-sm text-brand-subtext leading-relaxed">{r.desc}</p>
          </div>
        )
      })}
    </div>
  )
}

// Course Type / Competency / Type only — Grade is already fixed by whichever
// entry concept got the user here (that's axis 1's job), so it's
// deliberately left out of both filter mechanics below to keep the two axes
// from tangling back together.
function FilterBarShared({ courseTypes, competencies, types, onToggleCourseType, onToggleCompetency, onToggleType, onResetAll }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="mb-6 rounded-2xl border border-brand-border bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
        className="w-full flex items-center gap-1.5 px-5 py-4 text-base font-semibold text-brand-text"
      >
        Filters
        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-5 pt-5 pb-5 border-t border-brand-border">
          <div className="grid grid-cols-3 gap-4">
            <FilterField label="Course Type" options={COURSE_TYPES} selected={courseTypes} onToggle={onToggleCourseType} />
            <FilterField label="Competency" options={COMPETENCIES} selected={competencies} onToggle={onToggleCompetency} />
            <FilterField
              label="Type"
              options={Object.keys(TYPE_META).map((t) => TYPE_META[t].label)}
              selected={types.map((t) => TYPE_META[t].label)}
              onToggle={(label) => onToggleType(Object.keys(TYPE_META).find((t) => TYPE_META[t].label === label))}
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

function FilterField({ label, options, selected, onToggle }) {
  const [open, setOpen] = useState(false)
  const summary = selected.length === 0 ? 'All' : selected.length === 1 ? selected[0] : `${selected.length} selected`
  return (
    <div className="flex flex-col gap-1.5 relative">
      <p className="text-sm font-semibold text-brand-text">{label}</p>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-2 h-10 px-3 text-sm border border-brand-border rounded-md bg-white text-brand-subtext hover:border-dessa-teal/50 transition-colors"
      >
        <span className="truncate text-left">{summary}</span>
        <ChevronDown size={14} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 w-full z-30 bg-white border border-brand-border rounded-xl shadow-lg p-2 max-h-56 overflow-y-auto">
          {options.map((opt) => {
            const isSelected = selected.includes(opt)
            return (
              <button
                key={opt}
                type="button"
                onClick={() => onToggle(opt)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left rounded-md transition-colors ${
                  isSelected ? 'bg-[rgba(15,148,172,0.1)] text-brand-text' : 'text-brand-text hover:bg-brand-bg'
                }`}
              >
                <span className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${isSelected ? 'bg-dessa-teal border-dessa-teal' : 'border-brand-border'}`}>
                  {isSelected && <Check size={11} strokeWidth={3} className="text-white" />}
                </span>
                <span className="truncate">{opt}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

function FilterSidebarShared({ courseTypes, competencies, types, onToggleCourseType, onToggleCompetency, onToggleType, onResetAll }) {
  const hasActiveFilters = courseTypes.length > 0 || competencies.length > 0 || types.length > 0
  return (
    <div className="w-64 shrink-0 flex flex-col gap-4">
      <p className="text-base font-semibold text-brand-text">Filters</p>
      <SidebarFacetGroup label="Course Type" options={COURSE_TYPES} selected={courseTypes} onToggle={onToggleCourseType} />
      <SidebarFacetGroup label="Competency" options={COMPETENCIES} selected={competencies} onToggle={onToggleCompetency} />
      <SidebarFacetGroup label="Type" options={Object.keys(TYPE_META)} selected={types} onToggle={onToggleType} />
      <button
        type="button"
        onClick={onResetAll}
        disabled={!hasActiveFilters}
        className="w-full px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors disabled:bg-brand-border disabled:text-brand-subtext"
      >
        Reset all filters
      </button>
    </div>
  )
}

const RESULTS_VIEW_OPTIONS = [
  { value: 'list', label: 'List', icon: LayoutList, title: 'List view' },
  { value: 'cards', label: 'Cards', icon: LayoutGrid, title: 'Card view' },
]
const FILTER_MECHANIC_OPTIONS = [
  { value: 'bar', label: 'Bar', icon: SlidersHorizontal, title: 'Expandable filter bar' },
  { value: 'sidebar', label: 'Sidebar', icon: PanelLeft, title: 'Persistent filter sidebar' },
]

// Shared post-gate results experience for B/C/D/E: same grade-scoped data,
// same two switchable axes (results view + filter mechanic), so the only
// thing that differs between concepts is how you arrive here (the gate
// itself) — not what the results look like once you have. `topLeft` is
// each concept's own way of surfacing/changing the current grade (a
// "Browse a different grade" link for B/C, nothing for D since its whole
// premise is nav-hover-only, the paired field itself for E).
function ResultsExperience({ grade, topLeft }) {
  const { resultsView, setResultsView, filterMechanic, setFilterMechanic } = useResourcesConcept()
  const [courseTypes, setCourseTypes] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [types, setTypes] = useState([])

  function toggle(setFn, current, value) {
    setFn(current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }
  function resetAll() {
    setCourseTypes([])
    setCompetencies([])
    setTypes([])
  }

  const matchGrades = grade === 'All Grades' ? SELECTABLE_GRADES : [grade]
  let rows = MOCK_RESOURCES.filter((r) => matchGrades.includes(r.grade))
  if (courseTypes.length) rows = rows.filter((r) => courseTypes.includes(r.courseType))
  if (competencies.length) rows = rows.filter((r) => competencies.includes(r.competency))
  if (types.length) rows = rows.filter((r) => types.includes(r.type))

  const filterProps = {
    courseTypes, competencies, types,
    onToggleCourseType: (v) => toggle(setCourseTypes, courseTypes, v),
    onToggleCompetency: (v) => toggle(setCompetencies, competencies, v),
    onToggleType: (v) => toggle(setTypes, types, v),
    onResetAll: resetAll,
  }
  const chips = [...courseTypes, ...competencies, ...types.map((t) => TYPE_META[t].label)]

  const resultsCard = (
    <div className="flex-1 min-w-0 rounded-2xl border border-brand-border bg-white">
      <ResultsHeader
        chips={chips}
        right={<SegToggle options={RESULTS_VIEW_OPTIONS} value={resultsView} onChange={setResultsView} />}
      />
      {resultsView === 'cards' ? <ResultsCards rows={rows} /> : <ResultRows rows={rows} showDividers={false} />}
    </div>
  )

  return (
    <div className="px-6 pt-2 pb-16">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>{topLeft}</div>
        <SegToggle options={FILTER_MECHANIC_OPTIONS} value={filterMechanic} onChange={setFilterMechanic} />
      </div>
      {filterMechanic === 'sidebar' ? (
        <div className="flex gap-6 items-start">
          <FilterSidebarShared {...filterProps} />
          {resultsCard}
        </div>
      ) : (
        <>
          <FilterBarShared {...filterProps} />
          {resultsCard}
        </>
      )}
    </div>
  )
}

function slugifyGrade(label) {
  return label.toLowerCase().replace(/\s+/g, '-')
}

// One tier per grade band, each with its own brand-color gradient + icon —
// a colorful, "inviting" placeholder tile (bold gradient + icon in a
// translucent circle, avatar-placeholder-style) rather than a flat gray box,
// per explicit feedback that the plain gray+icon treatment wasn't inviting.
// Falls through to 'All Grades' for anything that isn't a specific grade.
const CARD_TIERS = [
  { test: (g) => ELEMENTARY_GROUP.includes(g), icon: BookOpen, gradient: 'from-mtw-amber to-mtw-coral' },
  { test: (g) => MIDDLE_GROUP.includes(g), icon: Users, gradient: 'from-mtw-teal to-dessa-teal' },
  { test: (g) => HIGH_GROUP.includes(g), icon: GraduationCap, gradient: 'from-mtw-blue to-mtw-purple' },
  { test: () => true, icon: Layers, gradient: 'from-dessa-teal to-mtw-amber' },
]

function tierFor(grade) {
  return CARD_TIERS.find((t) => t.test(grade))
}

// Real <img> pointing at an expected-but-not-yet-supplied file path, falling
// back to the tiered gradient+icon tile on error — so dropping real photos
// into /public/resources-grade-cards/ later requires zero code changes.
function GradeCardImage({ grade, className = '' }) {
  const [errored, setErrored] = useState(false)
  if (errored) {
    const { icon: Icon, gradient } = tierFor(grade)
    return (
      <div className={`relative bg-gradient-to-br ${gradient} flex items-center justify-center ${className}`}>
        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
          <Icon size={26} className="text-white" strokeWidth={1.75} />
        </div>
      </div>
    )
  }
  return (
    <img
      src={`/resources-grade-cards/${slugifyGrade(grade)}.jpg`}
      alt=""
      onError={() => setErrored(true)}
      className={`object-cover ${className}`}
    />
  )
}

const SUBCOPY = 'Explore a full range of resources organized by topic and skill area, from student-facing lesson videos and worksheets to tools for school engagement and implementation, built for every grade level.'

// ── Concept B — Everything visible, filter down ──
// (was sandbox "Concept A") — rebuilt (2026-09-12) from a centered marketing
// hero into a plain utility page: left-aligned "Resources" title, a search
// bar in its own small container up top, and a persistent left filter
// sidebar next to results that are visible immediately — no grade gate,
// upfront or fused, anywhere. This is the deliberate control concept,
// testing whether the mandatory gate is needed at all.
//
// B's sidebar is its own thing, not the shared FilterSidebarShared/
// FilterBarShared used by C/D/E — it always renders as a sidebar
// (explicitly not wired to the shared filterMechanic toggle, since the
// left-panel layout is part of this concept's identity) and it includes
// Grade as a facet, which the shared sidebar deliberately leaves out
// (there, grade is already fixed by the entry concept; here, there's no
// gate to fix it, so Grade has to live somewhere). Results view (List/
// Cards) still comes from the shared context, since that axis is genuinely
// orthogonal to how filtering is presented.
export function ConceptB() {
  const { resultsView, setResultsView } = useResourcesConcept()
  const [grades, setGrades] = useState([])
  const [courseTypes, setCourseTypes] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [types, setTypes] = useState([])
  const [search, setSearch] = useState('')

  function toggle(setFn, current, value) {
    setFn(current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }
  function resetAll() {
    setGrades([])
    setCourseTypes([])
    setCompetencies([])
    setTypes([])
  }

  const q = search.trim().toLowerCase()
  let rows = MOCK_RESOURCES
  if (grades.length) rows = rows.filter((r) => grades.includes(r.grade))
  if (courseTypes.length) rows = rows.filter((r) => courseTypes.includes(r.courseType))
  if (competencies.length) rows = rows.filter((r) => competencies.includes(r.competency))
  if (types.length) rows = rows.filter((r) => types.includes(r.type))
  if (q) rows = rows.filter((r) => r.title.toLowerCase().includes(q))
  const hasActiveFilters = grades.length > 0 || courseTypes.length > 0 || competencies.length > 0 || types.length > 0
  const chips = [...grades, ...courseTypes, ...competencies, ...types.map((t) => TYPE_META[t].label)]

  return (
    <div className="px-6 pt-10 pb-16">
      <h1 className="text-2xl font-semibold text-brand-text mb-5">Resources</h1>

      {/* Own container, 10px internal padding — pill-shaped input/button
          floating inside a slightly larger rounded card rather than a
          full-bleed search band. */}
      <div className="rounded-2xl border border-brand-border bg-white p-2.5 mb-6">
        <div className="flex items-stretch gap-2.5">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search guides, videos, worksheets..."
              className="w-full pl-11 pr-4 h-11 rounded-full border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            />
          </div>
          <button type="button" className="shrink-0 px-6 h-11 rounded-full text-sm font-semibold bg-dessa-teal text-white hover:bg-dessa-teal/90 transition-colors">
            Search
          </button>
        </div>
      </div>

      <div className="flex gap-6 items-start">
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <p className="text-base font-semibold text-brand-text">Filters</p>
          <SidebarFacetGroup label="Grade" options={SELECTABLE_GRADES} selected={grades} onToggle={(v) => toggle(setGrades, grades, v)} />
          <SidebarFacetGroup label="Course Type" options={COURSE_TYPES} selected={courseTypes} onToggle={(v) => toggle(setCourseTypes, courseTypes, v)} />
          <SidebarFacetGroup label="Competency" options={COMPETENCIES} selected={competencies} onToggle={(v) => toggle(setCompetencies, competencies, v)} />
          <SidebarFacetGroup label="Type" options={Object.keys(TYPE_META)} selected={types} onToggle={(v) => toggle(setTypes, types, v)} />
          <button
            type="button"
            onClick={resetAll}
            disabled={!hasActiveFilters}
            className="w-full px-4 py-2.5 rounded-full text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors disabled:bg-brand-border disabled:text-brand-subtext"
          >
            Reset all filters
          </button>
        </div>
        <div className="flex-1 min-w-0 rounded-2xl border border-brand-border bg-white">
          <ResultsHeader
            chips={chips}
            right={<SegToggle options={RESULTS_VIEW_OPTIONS} value={resultsView} onChange={setResultsView} />}
          />
          {resultsView === 'cards' ? <ResultsCards rows={rows} /> : <ResultRows rows={rows} showDividers={grades.length !== 1} />}
        </div>
      </div>
    </div>
  )
}

// ── Concept C — Visual browse cards ──
// (was sandbox "Concept D") — pure card-grid landing, one card per
// individual grade. Now the sole home for the card-grid pattern (absorbed
// from Concept B's now-removed duplicate grid, 2026-09-12). Each card shows
// a real photo via GradeCardImage — falls back to an icon tile if the file
// isn't there yet, so real photos can be dropped into
// /public/resources-grade-cards/ later with no code changes.
export function ConceptC() {
  const grades = SELECTABLE_GRADES.map((g) => ({ label: g, grades: g === 'All Grades' ? SELECTABLE_GRADES : [g] }))
  const [band, setBand] = useState(null)

  if (!band) {
    return (
      <div className="pt-28 pb-16 px-6">
        <GateHeading heading="Curriculum Resource Library" subcopy={SUBCOPY} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {grades.map((b) => (
            <div key={b.label} className="rounded-2xl border border-brand-border bg-white overflow-hidden shadow-sm text-left">
              <GradeCardImage grade={b.label} className="h-32 w-full" />
              <div className="p-4">
                <p className="text-base font-semibold text-brand-text mb-3">{b.label}</p>
                <button
                  type="button"
                  onClick={() => setBand(b)}
                  className="w-full px-4 py-2 rounded-full text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors"
                >
                  View Resources
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <SearchBand />
      <ResultsExperience
        key={band.label}
        grade={band.label}
        topLeft={
          <p className="text-sm text-brand-subtext">
            Browsing <span className="font-semibold text-brand-text">{band.label}</span>
            {' · '}
            <button type="button" onClick={() => setBand(null)} className="font-medium text-dessa-teal hover:underline">
              Browse a different grade
            </button>
          </p>
        }
      />
    </>
  )
}

// ── Concept D — Nav hover only, no page of its own ──
// (was sandbox "Concept E") — the only way in is hovering "Resources" in
// the real global nav (see Nav.jsx, gated on resourcesConcept === 'd') and
// picking a grade, which sets the `grade` URL param this reads. Left-
// sidebar filters + right-side row list, structure borrowed from
// LearningMole's filter sidebar (see the competitive-analysis reference).
function SidebarFacetGroup({ label, options, selected, onToggle }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4">
      <p className="text-sm font-semibold text-brand-text mb-3">{label}</p>
      <div className="flex flex-col gap-2 max-h-48 overflow-y-auto">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
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

// Grade is derived straight from the URL param and never changes without
// leaving via the nav hover again — no inline "change grade" control here,
// which reinforces rather than undermines the concept's premise (hovering
// the nav is the *only* way in, not just the first way in).
export function ConceptD() {
  const [searchParams] = useSearchParams()
  const selectedGrade = searchParams.get('grade')

  if (!selectedGrade) {
    return (
      <div className="w-screen mx-[calc(50%-50vw)] flex justify-center py-24 px-6">
        <div className="max-w-md flex flex-col items-center gap-3 text-center">
          <MousePointerClick size={20} className="text-dessa-teal" />
          <p className="text-sm text-brand-subtext">
            Hover <span className="font-semibold text-brand-text">Resources</span> in the nav above and pick a
            grade — there's no page here otherwise, hovering is the only way in.
          </p>
        </div>
      </div>
    )
  }

  return (
    <ResultsExperience
      key={selectedGrade}
      grade={selectedGrade}
      topLeft={
        <p className="text-sm">
          <span className="text-brand-subtext">Resources</span>
          <span className="mx-1.5 text-brand-border">/</span>
          <span className="font-semibold text-brand-text">{selectedGrade}</span>
        </p>
      }
    />
  )
}

// ── Concept E — Paired grade + search field ──
// Explores whether grade selection needs to be a separate mandatory step at
// all (the A/C/D gate, and the version of B that was considered) — or
// whether it can just be baked into the search field itself, the way a
// flight-search combo box fuses origin/destination into one control. B is
// left completely untouched (its search bar/pill row are still ungated); E
// is a distinct concept so the two can be compared side by side rather than
// B being modified in place.
// Mechanism: pressing Search (or Enter) with no grade chosen doesn't run a
// gradeless search and doesn't block with an error either — it just opens
// the grade dropdown, since picking a grade IS what was missing to complete
// the search, not a prerequisite screen before it.
// Grade selector redesigned (2026-09-12) from a left-side segmented field
// into a rounded-full chip floating inside the search bar's right edge,
// 12px in — reads as a filter chip riding inside the field rather than a
// separate joined segment, and frees the field from needing a visible
// Search button (Enter submits, same handleSubmit logic as before: no
// grade yet just reopens this same dropdown instead of searching blind).
function PairedSearchField({ grade, onGradeChange, query, onQueryChange, open, onOpenChange, onSubmit }) {
  return (
    <div className="relative flex items-center h-12 w-full max-w-2xl rounded-full border border-brand-border bg-white shadow-sm">
      <Search size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
      <input
        type="text"
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit()
        }}
        placeholder="Search guides, videos, worksheets..."
        className="w-full h-full pl-12 pr-36 text-sm text-brand-text placeholder:text-brand-subtext bg-transparent rounded-full focus:outline-none"
      />
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 pl-3.5 pr-2.5 h-8 rounded-full text-xs font-semibold bg-dessa-tealLight text-dessa-teal hover:bg-dessa-teal/20 transition-colors"
          >
            {grade || 'Grade'}
            <ChevronDown size={14} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            className="z-30 w-56 max-h-72 overflow-y-auto bg-white border border-brand-border rounded-xl shadow-lg outline-none p-1.5"
          >
            {SELECTABLE_GRADES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => {
                  onGradeChange(g)
                  onOpenChange(false)
                }}
                className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${
                  g === grade ? 'bg-dessa-tealLight text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                }`}
              >
                {g}
              </button>
            ))}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

export function ConceptE() {
  // pendingGrade: whatever's currently showing in the field's grade segment
  // (set as soon as it's picked, even before Search is pressed). activeGrade:
  // only set once Search actually succeeds — this is what gates the
  // transition from hero to results, same role gateOpen/selectedGrades plays
  // in the other concepts.
  const [pendingGrade, setPendingGrade] = useState(null)
  const [query, setQuery] = useState('')
  const [gradeOpen, setGradeOpen] = useState(false)
  const [activeGrade, setActiveGrade] = useState(null)

  function handleSubmit() {
    if (!pendingGrade) {
      setGradeOpen(true)
      return
    }
    setActiveGrade(pendingGrade)
  }

  if (!activeGrade) {
    return (
      <div className="w-screen mx-[calc(50%-50vw)]">
        <div className="bg-brand-bg border-b border-brand-border px-6 pt-20 pb-16 flex flex-col items-center text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-dessa-tealLight text-dessa-teal text-xs font-semibold mb-4">
            Resource Library
          </span>
          <h1 className="text-[38px] font-semibold text-brand-text max-w-2xl mb-4 leading-[1.15]">
            Everything you need to teach SEL, by grade
          </h1>
          <p className="text-base text-brand-subtext max-w-xl mb-6">
            Lesson videos, worksheets, and guides organized by grade level and SEL competency.
          </p>
          <PairedSearchField
            grade={pendingGrade}
            onGradeChange={setPendingGrade}
            query={query}
            onQueryChange={setQuery}
            open={gradeOpen}
            onOpenChange={setGradeOpen}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="w-screen mx-[calc(50%-50vw)] bg-brand-bg border-b border-brand-border sticky top-14 z-40">
        <div className="px-6 pt-[1.35rem] pb-4 flex justify-center">
          <PairedSearchField
            grade={pendingGrade}
            onGradeChange={(g) => {
              setPendingGrade(g)
              setActiveGrade(g)
            }}
            query={query}
            onQueryChange={setQuery}
            open={gradeOpen}
            onOpenChange={setGradeOpen}
            onSubmit={handleSubmit}
          />
        </div>
      </div>
      <ResultsExperience key={activeGrade} grade={activeGrade} />
    </>
  )
}

export const RESOURCES_GRADE_GROUPS = [
  { label: 'Elementary', grades: ELEMENTARY_GROUP },
  { label: 'Middle School', grades: MIDDLE_GROUP },
  { label: 'High School', grades: HIGH_GROUP },
]
