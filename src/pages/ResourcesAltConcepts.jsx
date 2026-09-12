import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, Video, FileText, Mic, ClipboardList, MousePointerClick,
  BookOpen, Users, GraduationCap, Layers,
} from 'lucide-react'

// ─── Resources — alternate concepts B/C/D ──────────────────────────────────
// Rendered by Resources.jsx whenever the nav's A/B/C/D switcher (see
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
          <span key={c} className="inline-flex items-center pl-3 pr-3 py-1.5 rounded-full bg-dessa-tealLight text-dessa-teal text-sm font-medium">
            {c}
          </span>
        ))}
      </div>
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

// ── Concept B — Search hero ──
// (was sandbox "Concept A") — eyebrow + centered headline + search bar +
// single-select pill row per individual grade. Used to also have a
// "Browse by grade" card grid below the pills, but that duplicated Concept
// C's card grid one-for-one — condensed (2026-09-12) so the card-grid
// pattern lives only in C; B is now just the hero.
const GRADES_B = [
  { id: 'All Grades', label: 'All Grades', grades: SELECTABLE_GRADES },
  ...ELEMENTARY_GROUP.map((g) => ({ id: g, label: g, grades: [g] })),
  ...MIDDLE_GROUP.map((g) => ({ id: g, label: g, grades: [g] })),
  ...HIGH_GROUP.map((g) => ({ id: g, label: g, grades: [g] })),
]

function GradePillB({ label, onChange }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className="px-3 py-2 rounded-full text-xs font-medium bg-white border border-brand-border text-brand-text hover:border-dessa-teal/50 transition-colors"
    >
      {label}
    </button>
  )
}

export function ConceptB() {
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
            {GRADES_B.map((g) => (
              <GradePillB key={g.id} label={g.label} onChange={() => setBand(g)} />
            ))}
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
      <div className="w-screen mx-[calc(50%-50vw)] pt-28 pb-16 px-6 md:px-[172px]">
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

export function ConceptD() {
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

export const RESOURCES_GRADE_GROUPS = [
  { label: 'Elementary', grades: ELEMENTARY_GROUP },
  { label: 'Middle School', grades: MIDDLE_GROUP },
  { label: 'High School', grades: HIGH_GROUP },
]
