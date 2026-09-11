import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Search, Video, FileText, Mic, ChevronDown, ClipboardList, Check,
  ExternalLink, MoreHorizontal, Image as ImageIcon, MousePointerClick,
  Baby, Smile, BookOpen, Users, GraduationCap, Layers,
} from 'lucide-react'

// ─── Resources Concepts — page-structure comparison ────────────────────────
// Rebuilt against the ACTUAL shipped /resources implementation (read
// directly from Resources.jsx, not reconstructed from memory): the real
// gate copy ("Curriculum Resource Library"), the real left-aligned/
// scroll-visual split layout, the real no-sidebar Filters-bar architecture,
// and the real per-type badge colors. "Current" is meant to be a faithful
// reproduction; A/B/C/D vary only the grade-selection mechanism on top of
// that same real structure, so the comparison is apples-to-apples. Content
// is still mocked. Lives at its own route so the live /resources page is
// untouched while these are in flux. Inspired by the TPT/LearningMole
// competitive analysis at /competitive-analysis.

const ELEMENTARY_GROUP = ['Pre-K', 'Kindergarten', '1st Grade', '2nd Grade', '3rd Grade', '4th Grade', '5th Grade']
const MIDDLE_GROUP = ['6th Grade', '7th Grade', '8th Grade']
const HIGH_GROUP = ['9th Grade', '10th Grade', '11th Grade', '12th Grade']
const SELECTABLE_GRADES = [...ELEMENTARY_GROUP, ...MIDDLE_GROUP, ...HIGH_GROUP, 'All Grades']
const COURSE_TYPES = ['Tier 1', 'Tier 2', 'Family']
const COMPETENCIES = ['Self-Awareness', 'Self-Management', 'Relationship Skills', 'Social Awareness', 'Responsible Decision-Making']

// Real TYPE_META from Resources.jsx — same icons/colors, so badges read
// exactly as they do in production.
const TYPE_META = {
  Video: { icon: Video, label: 'Video', color: 'text-dessa-magenta', bg: 'bg-dessa-magenta' },
  PDF: { icon: FileText, label: 'PDF', color: 'text-mtw-purple', bg: 'bg-mtw-purple' },
  Worksheet: { icon: ClipboardList, label: 'Worksheet', color: 'text-mtw-coral', bg: 'bg-mtw-coral' },
  Audio: { icon: Mic, label: 'Audio', color: 'text-mtw-blue', bg: 'bg-mtw-blue' },
}

const MOCK_RESOURCES = [
  { title: 'Emotion Check-In Video', type: 'Video', grade: 'Kindergarten', competency: 'Self-Awareness', courseType: 'Tier 1', unit: 'Unit 1: Naming Emotions', desc: 'A short video prompting students to name how they feel before the school day starts.' },
  { title: 'Calm Down Corner Guide', type: 'PDF', grade: '1st Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 2: Self-Management Basics', desc: 'Printable steps for setting up a calm-down space in an early elementary classroom.' },
  { title: 'Active Listening Worksheet', type: 'Worksheet', grade: '3rd Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit 5: Communication Skills', desc: 'Partner activity where students practice reflecting back what they heard.' },
  { title: 'Growth Mindset Poster', type: 'PDF', grade: '4th Grade', competency: 'Self-Awareness', courseType: 'Tier 2', unit: 'Unit 3: Building Confidence', desc: 'Classroom poster reframing common "I can\'t" statements into growth language.' },
  { title: 'Conflict Resolution Roleplay', type: 'Video', grade: '6th Grade', competency: 'Relationship Skills', courseType: 'Tier 1', unit: 'Unit 8: Resolving Conflict', desc: 'Modeled roleplay showing two students working through a disagreement.' },
  { title: 'Study Habits Audio Guide', type: 'Audio', grade: '7th Grade', competency: 'Self-Management', courseType: 'Tier 1', unit: 'Unit 6: Staying Organized', desc: 'A 6-minute audio walkthrough of building a weekly study routine.' },
  { title: 'Peer Pressure Discussion Cards', type: 'Worksheet', grade: '9th Grade', competency: 'Social Awareness', courseType: 'Tier 1', unit: 'Unit 11: Navigating Peer Influence', desc: 'Scenario cards for small-group discussion on navigating peer pressure.' },
  { title: 'Career Goals Reflection', type: 'PDF', grade: '11th Grade', competency: 'Responsible Decision-Making', courseType: 'Family', unit: 'Unit 14: Planning Ahead', desc: 'A guided worksheet for mapping near-term goals to a career interest.' },
]

// ── Real gate visual (GateScrollRows), copied from Resources.jsx so the
// right-side visual is identical, not an approximation ──
const GATE_SCROLL_ROWS = [
  { label: 'Anti-Bullying Poster', type: 'PDF', tag: 'Social Awareness' },
  { label: 'Bounce-Back Stories Guide', type: 'Video', tag: 'Social Awareness' },
  { label: 'Calm-Down Toolkit', type: 'Worksheet', tag: 'Self-Management' },
  { label: 'Mindful Moments Podcast', type: 'Audio', tag: 'Self-Management' },
  { label: 'Growth Mindset Worksheet', type: 'Worksheet', tag: 'Self-Awareness' },
  { label: 'MTW Parent Newsletter', type: 'external', tag: 'Relationship Skills' },
  { label: 'Active Listening Guide', type: 'PDF', tag: 'Relationship Skills' },
  { label: 'Feelings Check-In Cards', type: 'Worksheet', tag: 'Self-Awareness' },
]
const GATE_SCROLL_TYPE_META = { ...TYPE_META, external: { icon: ExternalLink, color: 'text-mtw-blue' } }
const GATE_SCROLL_SCALES = [0.91, 0.93, 0.95, 0.97, 1.05, 0.97, 0.95, 0.93]
const GATE_SCROLL_SELECTED_INDEX = 4
const GATE_SCROLL_MASK = 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)'
const GATE_GLOW_PEAK = '0 0 0 2px rgba(42, 127, 143, 0.9), 0 0 20px 4px rgba(42, 127, 143, 0.45)'

function GateScrollRows() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ WebkitMaskImage: GATE_SCROLL_MASK, maskImage: GATE_SCROLL_MASK }}
    >
      <div className="absolute inset-x-0 top-0 flex flex-col items-center" style={{ gap: 11 }}>
        {GATE_SCROLL_ROWS.map((row, i) => {
          const { icon: Icon, color } = GATE_SCROLL_TYPE_META[row.type]
          const selected = i === GATE_SCROLL_SELECTED_INDEX
          return (
            <div
              key={row.label}
              className={`rounded-xl bg-white border border-brand-border flex items-center gap-3 px-4 shrink-0 ${selected ? 'z-10' : ''}`}
              style={{ height: 50, width: 468, boxShadow: selected ? GATE_GLOW_PEAK : 'none', transform: `scale(${GATE_SCROLL_SCALES[i]})` }}
            >
              <Icon size={16} className={`${color} shrink-0`} />
              <span className="flex-1 text-sm font-medium text-brand-text truncate">{row.label}</span>
              <span className="shrink-0 text-[11px] font-medium px-2 py-1 rounded-full bg-dessa-tealLight text-dessa-teal">
                {row.tag}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Page-structure shells, mirroring Resources.jsx's actual DOM ──

// Matches the real decorConcept==='c' gate branch: full-bleed break-out,
// left-aligned text/controls, GateScrollRows filling the right column.
function GateSplitShell({ children }) {
  return (
    <div className="relative w-screen mx-[calc(50%-50vw)] grid grid-cols-1 md:grid-cols-2 gap-16 items-center pt-28 pb-16 px-6 md:px-[172px] overflow-hidden">
      <div className="flex flex-col items-start text-left">{children}</div>
      <div className="relative hidden md:block min-w-0" style={{ height: 480 }}>
        <GateScrollRows />
      </div>
    </div>
  )
}

// Matches the real sticky search band above results.
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

// ── Leaf components matching real classnames exactly ──

function GateHeading({ heading, subcopy }) {
  return (
    <>
      <h1 className="text-4xl font-semibold text-brand-text mb-3">{heading}</h1>
      <p className="text-base text-brand-subtext mb-8 max-w-lg">{subcopy}</p>
    </>
  )
}

function ConfirmButton({ children, disabled, onClick }) {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className="h-12 px-10 rounded-full text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors disabled:bg-brand-border disabled:text-brand-subtext"
    >
      {children}
    </button>
  )
}

function GradePill({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors border-2 ${
        checked
          ? 'border-dessa-teal bg-dessa-tealLight text-dessa-teal'
          : 'border-dashed border-[#C9CDD3] text-brand-subtext hover:border-dessa-teal/50 hover:text-brand-text'
      }`}
    >
      {label}
    </button>
  )
}

function RememberCheckbox({ checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm text-brand-subtext mb-6 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-dessa-teal w-3.5 h-3.5" />
      Remember my choice
    </label>
  )
}

function FilterChip({ label }) {
  return (
    <span className="inline-flex items-center pl-3 pr-3 py-1.5 rounded-full bg-dessa-tealLight text-dessa-teal text-sm font-medium">
      {label}
    </span>
  )
}

// Simplified version of the real FilterFieldDropdown — same trigger/option
// list structure, without the chip-removal micro-interactions.
function FilterField({ label, options, selected, onToggle, onReset, single = false }) {
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
                onClick={() => onToggle(opt, single)}
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
          <button type="button" onClick={onReset} className="w-full text-left px-3 py-2 mt-1 text-xs font-medium text-dessa-teal hover:underline">
            Reset
          </button>
        </div>
      )}
    </div>
  )
}

// Matches the real FilterBarC — collapsed by default, 4-field grid, Apply / Reset Filters.
function FiltersBar({ fields }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="mt-6 mb-6 rounded-2xl border border-brand-border bg-white">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="w-full flex items-center gap-1.5 px-5 py-4 text-base font-semibold text-brand-text"
      >
        Filters
        <ChevronDown size={16} className={`transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-5 pt-5 pb-5 border-t border-brand-border">
          <div className={`grid gap-4 ${fields.length === 4 ? 'grid-cols-4' : 'grid-cols-3'}`}>
            {fields.map((f) => (
              <FilterField key={f.label} {...f} />
            ))}
          </div>
        </div>
      )}
    </div>
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
              className={`w-full flex items-center gap-3 px-6 py-4 hover:bg-[rgba(15,148,172,0.1)] transition-colors cursor-pointer ${
                isLast ? 'rounded-b-2xl' : 'border-b border-brand-border'
              }`}
            >
              <div className="w-72 shrink-0">
                <p className="text-[16px] font-semibold text-brand-text truncate">{r.title}</p>
                <p className="text-xs text-brand-subtext truncate mt-0.5">{r.unit}</p>
              </div>
              <p className="w-[550px] shrink-0 truncate text-left text-sm text-brand-subtext">{r.desc}</p>
              <div className="flex items-center gap-3 shrink-0 ml-auto">
                <div className="w-20 shrink-0">
                  <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-[5px] ${typeMeta.bg} bg-opacity-10 ${typeMeta.color}`}>
                    <typeMeta.icon size={14} />
                    <span className="text-xs font-medium">{typeMeta.label}</span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 min-w-[130px] shrink-0">
                  <span className="inline-flex items-center px-2.5 py-1 rounded-[5px] bg-brand-bg text-brand-text text-xs font-medium shrink-0">
                    {r.competency}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

function ResultsHeader({ chips }) {
  return (
    <div className="px-6 pt-6 pb-4 flex items-center justify-between gap-4">
      <div className="flex flex-wrap gap-2 flex-1">
        {chips.map((c) => (
          <FilterChip key={c} label={c} />
        ))}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button type="button" className="flex items-center gap-1.5 px-3 py-2 rounded-md text-sm font-medium text-brand-text border border-brand-border hover:bg-brand-bg transition-colors">
          Sort <ChevronDown size={14} />
        </button>
        <button type="button" className="w-9 h-9 flex items-center justify-center rounded-md border border-brand-border text-brand-text hover:bg-brand-bg transition-colors">
          <MoreHorizontal size={16} />
        </button>
      </div>
    </div>
  )
}

function ImagePlaceholder({ className = '' }) {
  return (
    <div className={`bg-gradient-to-br from-dessa-tealLight to-white flex items-center justify-center ${className}`}>
      <ImageIcon size={28} className="text-dessa-teal/40" />
    </div>
  )
}

// Shared post-gate results experience for the multi-select concepts
// (Current, B): Grade is one of the 4 Filters-bar fields, exactly like
// production — clearing it back to empty re-opens the gate.
function MultiSelectResults({ grades, setGrades }) {
  const [courseTypes, setCourseTypes] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [types, setTypes] = useState([])

  function toggle(setFn, current, value) {
    setFn(current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }

  let rows = MOCK_RESOURCES.filter((r) => grades.includes(r.grade))
  if (courseTypes.length) rows = rows.filter((r) => courseTypes.includes(r.courseType))
  if (competencies.length) rows = rows.filter((r) => competencies.includes(r.competency))
  if (types.length) rows = rows.filter((r) => types.includes(r.type))

  return (
    <>
      <FiltersBar
        fields={[
          { label: 'Grade', options: SELECTABLE_GRADES, selected: grades, onToggle: (v) => toggle(setGrades, grades, v), onReset: () => setGrades([]) },
          { label: 'Course Type', options: COURSE_TYPES, selected: courseTypes, onToggle: (v) => toggle(setCourseTypes, courseTypes, v), onReset: () => setCourseTypes([]) },
          { label: 'Competency', options: COMPETENCIES, selected: competencies, onToggle: (v) => toggle(setCompetencies, competencies, v), onReset: () => setCompetencies([]) },
          { label: 'Type', options: Object.keys(TYPE_META), selected: types, onToggle: (v) => toggle(setTypes, types, v), onReset: () => setTypes([]) },
        ]}
      />
      <div className="rounded-2xl border border-brand-border bg-white">
        <ResultsHeader chips={[...grades, ...courseTypes, ...competencies, ...types]} />
        <ResultRows rows={rows} showDividers={grades.length > 1} />
      </div>
    </>
  )
}

// Shared post-gate results for single-grade concepts (A, C): Grade is a
// single-select field in the same Filters bar; picking a new one replaces
// rather than adds, clearing it reopens the entry point.
function SingleGradeResults({ grade, setGrade, showGradeField = true }) {
  const [courseTypes, setCourseTypes] = useState([])
  const [competencies, setCompetencies] = useState([])
  const [types, setTypes] = useState([])

  function toggle(setFn, current, value) {
    setFn(current.includes(value) ? current.filter((v) => v !== value) : [...current, value])
  }

  let rows = MOCK_RESOURCES.filter((r) => r.grade === grade)
  if (courseTypes.length) rows = rows.filter((r) => courseTypes.includes(r.courseType))
  if (competencies.length) rows = rows.filter((r) => competencies.includes(r.competency))
  if (types.length) rows = rows.filter((r) => types.includes(r.type))

  const fields = [
    ...(showGradeField
      ? [{ label: 'Grade', options: SELECTABLE_GRADES, selected: grade ? [grade] : [], onToggle: (v) => setGrade(v === grade ? null : v), onReset: () => setGrade(null), single: true }]
      : []),
    { label: 'Course Type', options: COURSE_TYPES, selected: courseTypes, onToggle: (v) => toggle(setCourseTypes, courseTypes, v), onReset: () => setCourseTypes([]) },
    { label: 'Competency', options: COMPETENCIES, selected: competencies, onToggle: (v) => toggle(setCompetencies, competencies, v), onReset: () => setCompetencies([]) },
    { label: 'Type', options: Object.keys(TYPE_META), selected: types, onToggle: (v) => toggle(setTypes, types, v), onReset: () => setTypes([]) },
  ]

  return (
    <>
      <FiltersBar fields={fields} />
      <div className="rounded-2xl border border-brand-border bg-white">
        <ResultsHeader chips={[grade, ...courseTypes, ...competencies, ...types].filter(Boolean)} />
        <ResultRows rows={rows} showDividers={false} />
      </div>
    </>
  )
}

const SUBCOPY = 'Explore a full range of resources organized by topic and skill area, from student-facing lesson videos and worksheets to tools for school engagement and implementation, built for every grade level.'

// ── Concept 0 — Current experience (faithful reproduction) ──
function ConceptCurrent() {
  const [pending, setPending] = useState([])
  const [grades, setGrades] = useState([])
  const toggle = (g) => setPending((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]))

  if (grades.length === 0) {
    return (
      <GateSplitShell>
        <GateHeading heading="Curriculum Resource Library" subcopy={SUBCOPY} />
        <h6 className="text-xs font-semibold text-[#5B6878] uppercase tracking-wide mb-4">Select one or more grade levels</h6>
        <div className="flex flex-wrap gap-2 max-w-lg mb-6">
          {SELECTABLE_GRADES.map((g) => (
            <GradePill key={g} label={g} checked={pending.includes(g)} onChange={() => toggle(g)} />
          ))}
        </div>
        <RememberCheckbox checked={false} onChange={() => {}} />
        <ConfirmButton disabled={pending.length === 0} onClick={() => setGrades(pending)}>View Resources</ConfirmButton>
      </GateSplitShell>
    )
  }

  return (
    <>
      <SearchBand />
      <MultiSelectResults grades={grades} setGrades={setGrades} />
    </>
  )
}

// ── Concept A — Search-hero + browse-by-grade cards ──
// Rescaffolded (2026-09-11) from a reference screenshot (Merit's resource
// center: eyebrow + big centered headline + search bar + single-select pill
// row, then a "Browse by topic" card grid below). Pills map to grade bands
// instead of content topics; the card grid gives the same single-select
// entry point a second, more visual way in — both drive the same `band`
// state, so there's no conflict between the two, just two ways to arrive.
// Per-grade (not grouped-by-band) as of 2026-09-11 — each pill/card is one
// specific grade rather than a band like "Early Elementary", per explicit
// request. Icons still cluster by tier (shared per group of nearby grades)
// so the grid doesn't read as 15 unrelated icons.
const GRADES_A = [
  { id: 'All Grades', label: 'All Grades', icon: Layers, grades: SELECTABLE_GRADES },
  ...ELEMENTARY_GROUP.map((g) => ({
    id: g,
    label: g,
    icon: g === 'Pre-K' ? Baby : ['Kindergarten', '1st Grade', '2nd Grade'].includes(g) ? Smile : BookOpen,
    grades: [g],
  })),
  ...MIDDLE_GROUP.map((g) => ({ id: g, label: g, icon: Users, grades: [g] })),
  ...HIGH_GROUP.map((g) => ({ id: g, label: g, icon: GraduationCap, grades: [g] })),
]

function GradePillA({ label, checked, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`px-3 py-2 rounded-full text-xs font-medium transition-colors ${
        checked ? 'bg-dessa-teal text-white' : 'bg-white border border-brand-border text-brand-text hover:border-dessa-teal/50'
      }`}
    >
      {label}
    </button>
  )
}

function ConceptA() {
  const [band, setBand] = useState(null)

  if (!band) {
    return (
      <div className="w-screen mx-[calc(50%-50vw)]">
        <div className="bg-brand-bg border-b border-brand-border px-6 pt-20 pb-16 flex flex-col items-center text-center">
          <span className="inline-block px-3 py-1 rounded-full bg-dessa-tealLight text-dessa-teal text-xs font-semibold mb-4">
            Resource Library
          </span>
          <h1 className="text-[38px] font-semibold text-brand-text max-w-2xl mb-4 leading-[1.15]">
            Everything you need to teach SEL, by grade
          </h1>
          <p className="text-base text-brand-subtext max-w-xl mb-8">
            Lesson videos, worksheets, and guides organized by grade level and SEL competency.
          </p>
          <div className="flex items-stretch gap-3 w-full max-w-xl mb-6">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
              <input
                type="text"
                placeholder="Search guides, videos, worksheets..."
                className="w-full pl-11 pr-4 h-12 rounded-full border border-brand-border bg-white text-sm text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
              />
            </div>
            <button type="button" className="shrink-0 px-6 h-12 rounded-full text-sm font-semibold bg-dessa-teal text-white hover:bg-dessa-teal/90 transition-colors">
              Search
            </button>
          </div>
          <div className="flex flex-wrap justify-center gap-2 max-w-3xl">
            {GRADES_A.map((g) => (
              <GradePillA key={g.id} label={g.label} checked={false} onChange={() => setBand(g)} />
            ))}
          </div>
        </div>

        <div className="px-6 md:px-[172px] py-16">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wide text-brand-subtext mb-2">Browse by grade</p>
            <h2 className="text-2xl font-semibold text-brand-text">Find exactly what you need</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {GRADES_A.map((g) => {
              const count = MOCK_RESOURCES.filter((r) => g.grades.includes(r.grade)).length
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setBand(g)}
                  className="text-left rounded-2xl border border-brand-border bg-white p-5 hover:border-dessa-teal/50 hover:shadow-sm transition-all"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-dessa-tealLight flex items-center justify-center">
                      <g.icon size={18} className="text-dessa-teal" />
                    </div>
                    <span className="text-xs text-brand-subtext">{count} resource{count === 1 ? '' : 's'}</span>
                  </div>
                  <p className="text-base font-semibold text-brand-text">{g.label}</p>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const rows = MOCK_RESOURCES.filter((r) => band.grades.includes(r.grade))
  return (
    <>
      <SearchBand />
      <div className="mt-6 mb-2 flex items-center justify-between">
        <p className="text-sm text-brand-subtext">
          Browsing <span className="font-semibold text-brand-text">{band.label}</span>
        </p>
        <button type="button" onClick={() => setBand(null)} className="text-sm font-medium text-dessa-teal hover:underline">
          Browse a different grade
        </button>
      </div>
      <div className="rounded-2xl border border-brand-border bg-white">
        <ResultsHeader chips={[band.label]} />
        <ResultRows rows={rows} showDividers={false} />
      </div>
    </>
  )
}

// ── Concept B — Grouped multi-select gate ──
// Retired from the manager review set (2026-09-11) — kept for reference,
// not rendered; commented out rather than deleted per this codebase's
// convention for shelved concepts. D absorbed C's nav-hover interaction
// instead (see ConceptD below).
/*
function ConceptB() {
  const [pending, setPending] = useState([])
  const [grades, setGrades] = useState([])
  const toggle = (g) => setPending((s) => (s.includes(g) ? s.filter((x) => x !== g) : [...s, g]))
  const columns = [
    { label: 'Elementary', grades: ELEMENTARY_GROUP },
    { label: 'Middle School', grades: MIDDLE_GROUP },
    { label: 'High School', grades: HIGH_GROUP },
  ]

  if (grades.length === 0) {
    return (
      <GateSplitShell>
        <GateHeading heading="Curriculum Resource Library" subcopy={SUBCOPY} />
        <h6 className="text-xs font-semibold text-[#5B6878] uppercase tracking-wide mb-4">Select one or more grade levels</h6>
        <div className="grid grid-cols-3 gap-8 mb-6">
          {columns.map((col) => (
            <div key={col.label}>
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-subtext mb-2">{col.label}</p>
              <div className="flex flex-col gap-1.5 items-start">
                {col.grades.map((g) => (
                  <GradePill key={g} label={g} checked={pending.includes(g)} onChange={() => toggle(g)} />
                ))}
              </div>
            </div>
          ))}
        </div>
        <RememberCheckbox checked={false} onChange={() => {}} />
        <ConfirmButton disabled={pending.length === 0} onClick={() => setGrades(pending)}>
          View Resources
        </ConfirmButton>
      </GateSplitShell>
    )
  }

  return (
    <>
      <SearchBand />
      <MultiSelectResults grades={grades} setGrades={setGrades} />
    </>
  )
}
*/

// ── Concept C — Nav-level hover mega-menu ──
// Retired from the manager review set (2026-09-11) — kept for reference,
// not rendered; commented out rather than deleted. Its nav-hover mechanism
// moved onto Concept D instead of being its own concept (see ConceptD and
// Nav.jsx's goToGrade, now targeting ?concept=d).
/*
function ConceptC() {
  const [searchParams] = useSearchParams()
  const grade = searchParams.get('grade')

  return (
    <>
      {grade ? (
        <>
          <SearchBand />
          <SingleGradeResults grade={grade} setGrade={() => {}} showGradeField={false} />
        </>
      ) : (
        <GateSplitShell>
          <GateHeading heading="Curriculum Resource Library" subcopy={SUBCOPY} />
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl border border-dashed border-brand-border bg-white text-sm text-brand-subtext">
            <MousePointerClick size={16} className="text-dessa-teal shrink-0" />
            Hover <span className="font-semibold text-brand-text">Resources</span> in the nav above to choose a grade
          </div>
        </GateSplitShell>
      )}
    </>
  )
}
*/

// ── Concept D — Visual browse landing ──
// Back to its own card-grid page only (2026-09-11) — the nav-hover
// interaction moved to Concept E exclusively, which has no page of its own
// at all. D no longer reads/writes the `grade` URL param.
function ConceptD() {
  // One card per individual grade (was 4 grade-band cards) — 2026-09-11.
  const grades = SELECTABLE_GRADES.map((g) => ({ label: g, grades: g === 'All Grades' ? SELECTABLE_GRADES : [g] }))
  const [band, setBand] = useState(null)

  if (!band) {
    return (
      <div className="w-screen mx-[calc(50%-50vw)] pt-28 pb-16 px-6 md:px-[172px]">
        <GateHeading heading="Curriculum Resource Library" subcopy={SUBCOPY} />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {grades.map((b) => (
            <div key={b.label} className="rounded-2xl border border-brand-border bg-white overflow-hidden shadow-sm text-left">
              <ImagePlaceholder className="h-32" />
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

  const rows = MOCK_RESOURCES.filter((r) => band.grades.includes(r.grade))
  return (
    <>
      <SearchBand />
      <div className="mt-6 mb-2 flex items-center justify-between">
        <p className="text-sm text-brand-subtext">
          Browsing <span className="font-semibold text-brand-text">{band.label}</span>
        </p>
        <button type="button" onClick={() => setBand(null)} className="text-sm font-medium text-dessa-teal hover:underline">
          Browse a different grade
        </button>
      </div>
      <div className="rounded-2xl border border-brand-border bg-white">
        <ResultsHeader chips={[band.label]} />
        <ResultRows rows={rows} showDividers={false} />
      </div>
    </>
  )
}

// ── Concept E — Nav hover only, no page at all ──
// The purest version of the nav-hover idea: this concept has zero landing
// UI of its own. The only way in is hovering "Resources" in the real global
// nav and picking a grade (see Nav.jsx's goToGrade, which targets
// ?concept=e&grade=). Left-sidebar filters + right-side row list, structure
// borrowed literally from LearningMole's filter sidebar (see
// competitive-analysis/learning-mole/Screenshot 2026-09-10 at 3.12.50 PM.png):
// "Filters" heading, then the search input, then one bordered box per
// facet (Grade now included, single-select to keep the "one grade, no
// page" premise intact even when changed from the sidebar), then Reset —
// all stacked in the one narrow column, matching the reference's order
// exactly. The page-level SearchBand was removed in favor of this
// sidebar-scoped input rather than showing two search boxes.
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

function SidebarRadioGroup({ label, options, selected, onChange }) {
  return (
    <div className="rounded-2xl border border-brand-border bg-white p-4">
      <p className="text-sm font-semibold text-brand-text mb-3">{label}</p>
      <div className="flex flex-col gap-2">
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
            <input type="radio" checked={selected === opt} onChange={() => onChange(opt)} className="accent-dessa-teal w-3.5 h-3.5" />
            {opt}
          </label>
        ))}
      </div>
    </div>
  )
}

function ConceptE() {
  const [searchParams] = useSearchParams()
  const initialGrade = searchParams.get('grade')
  const [selectedGrade, setSelectedGrade] = useState(initialGrade)
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

  const matchGrades = selectedGrade === 'All Grades' ? SELECTABLE_GRADES : [selectedGrade]
  let rows = MOCK_RESOURCES.filter((r) => matchGrades.includes(r.grade))
  if (courseTypes.length) rows = rows.filter((r) => courseTypes.includes(r.courseType))
  if (competencies.length) rows = rows.filter((r) => competencies.includes(r.competency))
  if (types.length) rows = rows.filter((r) => types.includes(r.type))
  const hasActiveFilters = courseTypes.length > 0 || competencies.length > 0 || types.length > 0

  return (
    <div className="pt-6">
      <div className="flex gap-6 items-start">
        <div className="w-64 shrink-0 flex flex-col gap-4">
          <p className="text-base font-semibold text-brand-text">Filters</p>
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
            <input
              type="text"
              placeholder="Search by competency, file type, or grade level"
              className="w-full pl-9 pr-3 h-10 text-sm border border-brand-border rounded-lg bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            />
          </div>
          <SidebarRadioGroup label="Grade" options={SELECTABLE_GRADES} selected={selectedGrade} onChange={setSelectedGrade} />
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
        <div className="flex-1 min-w-0 flex flex-col gap-4">
          {/* Breadcrumb, sitting at the same height as the sidebar's
              "Filters" label (both flex-col gap-4, first child) so the two
              columns start even with each other. */}
          <p className="text-sm">
            <span className="text-brand-subtext">Resources</span>
            <span className="mx-1.5 text-brand-border">/</span>
            <span className="font-semibold text-brand-text">{selectedGrade}</span>
          </p>
          <div className="rounded-2xl border border-brand-border bg-white">
            <ResultsHeader chips={[...courseTypes, ...competencies, ...types]} />
            <ResultRows rows={rows} showDividers={false} />
          </div>
        </div>
      </div>
    </div>
  )
}

// B and C retired from the manager review set (2026-09-11) — see the
// commented-out ConceptB/ConceptC above. The nav-hover interaction that was
// briefly folded into D now lives only in E, which has no page of its own
// at all. Presented set: Current (baseline) / A / D / E.
const CONCEPTS = [
  { id: 'current', label: 'Current', component: ConceptCurrent },
  { id: 'a', label: 'A — Search hero + browse cards', component: ConceptA },
  { id: 'd', label: 'D — Visual browse cards', component: ConceptD },
  { id: 'e', label: 'E — Nav hover only, no page', component: ConceptE },
]

export default function ResourcesConcepts() {
  const [searchParams, setSearchParams] = useSearchParams()
  const activeId = searchParams.get('concept') || 'current'
  const active = CONCEPTS.find((c) => c.id === activeId) || CONCEPTS[0]
  const Active = active.component

  return (
    <div>
      <div className="fixed bottom-4 right-4 z-[60] bg-white border border-brand-border rounded-full shadow-md px-3 py-1.5 flex items-center gap-2">
        <span className="text-xs text-brand-subtext">Concept</span>
        <select
          value={activeId}
          onChange={(e) => setSearchParams({ concept: e.target.value })}
          className="text-xs font-medium text-brand-text bg-transparent focus:outline-none"
        >
          {CONCEPTS.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <motion.div
        key={`${activeId}-${searchParams.get('grade') || ''}`}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-6 pb-16"
      >
        <Active />
      </motion.div>
    </div>
  )
}
