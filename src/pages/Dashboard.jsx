import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Calendar, ChevronDown, ClipboardCheck, BookOpen, ArrowRight, ArrowUpRight } from 'lucide-react'
import { useDashboardConcept } from '../lib/dashboardConceptContext'

const stagger = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.06 },
})

// ─── Shared bits ──────────────────────────────────────────────────────────────

function Dot({ color }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
      style={{ background: color }}
    />
  )
}

// Decorative only — matches prod's rating-window picker chrome, but this
// prototype has no rating-window data model to actually filter by.
function RatingWindowSelect({ label }) {
  return (
    <button
      type="button"
      className="flex items-center gap-2 px-3.5 py-2 rounded-md border border-brand-border text-sm font-medium text-brand-text bg-white hover:bg-brand-bg transition-colors flex-shrink-0"
    >
      <Calendar size={14} className="text-brand-subtext" />
      {label}
      <ChevronDown size={14} className="text-brand-subtext" />
    </button>
  )
}

// ─── Timeline card ────────────────────────────────────────────────────────────

// Weights are month-counts within the Aug 1 – Jul 31 school year (5 + 4 + 3 = 12).
const RATING_WINDOWS = [
  { key: 'pre',  label: 'Pre',  start: 'Aug 1', months: 5, color: '#5DB87A' },
  { key: 'mid',  label: 'Mid',  start: 'Jan 1', months: 4, color: '#A8C8E8' },
  { key: 'post', label: 'Post', start: 'May 1', months: 3, color: '#CBD5E0' },
]

const YEAR_MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul']

function schoolYearStart(now) {
  return now.getMonth() >= 7 ? now.getFullYear() : now.getFullYear() - 1
}

function yearProgress(now) {
  const startYear = schoolYearStart(now)
  const start = new Date(startYear, 7, 1)
  const end = new Date(startYear + 1, 7, 1)
  return Math.min(Math.max((now - start) / (end - start), 0), 1)
}

function TimelineCard() {
  const now = new Date()
  const startYear = schoolYearStart(now)
  const progress = yearProgress(now)

  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm h-full flex flex-col">
      <div className="px-5 pt-5 pb-4 border-b border-brand-border flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-brand-text">Timeline</h3>
        <RatingWindowSelect label="Default Rating Window" />
      </div>

      <div className="p-5 flex-1">
        <div className="rounded-xl border border-brand-border p-5 h-full">
          <p className="text-sm text-brand-subtext mb-0.5">Year at a glance</p>
          <p className="text-lg font-semibold text-brand-text mb-5">{startYear}-{startYear + 1}</p>

          <div className="flex text-xs font-medium text-brand-subtext mb-2">
            {YEAR_MONTHS.map((m) => (
              <span key={m} className="flex-1 text-center">{m}</span>
            ))}
          </div>

          <div className="relative">
            <div className="flex h-9 rounded-md overflow-hidden gap-px bg-brand-border">
              {RATING_WINDOWS.map((w) => (
                <div
                  key={w.key}
                  className="flex items-center justify-center text-sm font-semibold text-brand-text"
                  style={{ flex: w.months, background: `${w.color}33` }}
                >
                  {w.label}
                </div>
              ))}
            </div>
            <div
              className="absolute -top-1.5 w-0.5 bg-red-500"
              style={{ left: `${progress * 100}%`, height: 'calc(100% + 0.75rem)' }}
            >
              <span className="absolute -top-1 -left-[3px] w-2 h-2 rounded-full bg-red-500" />
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-x-6 gap-y-2 mt-4">
            {RATING_WINDOWS.map((w) => (
              <div key={w.key} className="flex items-center text-xs">
                <Dot color={w.color} />
                <span className="font-medium text-brand-text mr-1.5">{w.label}</span>
                <span className="text-brand-subtext">{w.start}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── My Students chart ────────────────────────────────────────────────────────

// Educator series reuses the existing rated-student split (Need 2, Typical 9,
// Strength 5 of 16 rated) so it doesn't contradict the numbers shown
// elsewhere in the app. Student (self-report) is fabricated — this prototype
// has no student self-rating data model — chosen to read as a plausible,
// slightly more optimistic self-view than the educator's ratings.
const MY_STUDENTS_DATA = [
  { key: 'need',     label: 'Need',     color: '#F08080', educator: 13, student: 6 },
  { key: 'typical',  label: 'Typical',  color: '#A8C8E8', educator: 56, student: 51 },
  { key: 'strength', label: 'Strength', color: '#5DB87A', educator: 31, student: 43 },
]

function StudentBar({ value, color }) {
  const labelInside = value >= 15
  return (
    <div className="w-14 h-full flex flex-col justify-end items-center relative">
      {!labelInside && (
        <span className="absolute -top-5 text-xs font-semibold text-brand-text">{value}%</span>
      )}
      <div
        className="w-full rounded-t-sm border flex items-start justify-center pt-1.5 text-xs font-semibold text-brand-text"
        style={{ height: `${Math.max(value, 3)}%`, background: `${color}33`, borderColor: color }}
      >
        {labelInside && `${value}%`}
      </div>
    </div>
  )
}

function MyStudentsChart() {
  return (
    <div className="flex items-end justify-around h-56 pt-6">
      {MY_STUDENTS_DATA.map((d) => (
        <div key={d.key} className="flex flex-col items-center h-full">
          <div className="flex items-end gap-2 flex-1">
            <StudentBar value={d.educator} color={d.color} />
            <StudentBar value={d.student} color={d.color} />
          </div>
          <div className="flex gap-2 mt-2">
            <span className="w-14 text-center text-[11px] text-brand-subtext">Educator</span>
            <span className="w-14 text-center text-[11px] text-brand-subtext">Student</span>
          </div>
          <p className="text-sm font-semibold text-brand-text mt-1">{d.label}</p>
        </div>
      ))}
    </div>
  )
}

// ─── Grade Level Comparison chart ─────────────────────────────────────────────

const GRADE_LEVEL_DATA = [
  { grade: '1st', need: 6, typical: 64, strength: 30 },
  { grade: '2nd', need: 8, typical: 64, strength: 28 },
  { grade: '3rd', need: 8, typical: 56, strength: 36 },
  { grade: '4th', need: 8, typical: 60, strength: 32 },
  { grade: '5th', need: 7, typical: 64, strength: 30 },
  { grade: '6th', need: 7, typical: 64, strength: 29 },
  { grade: '7th', need: 4, typical: 60, strength: 35 },
  { grade: '8th', need: 6, typical: 69, strength: 25 },
]

const GRADE_LEGEND = [
  { label: 'Need for Instruction', color: '#F08080' },
  { label: 'Typical',              color: '#A8C8E8' },
  { label: 'Strength',             color: '#5DB87A' },
]

function GradeStackedBar({ need, typical, strength }) {
  const segment = (value, color, rounding) => (
    <div
      className={`w-full flex items-start justify-center pt-1 text-[11px] font-semibold text-brand-text border ${rounding}`}
      style={{ height: `${value}%`, background: `${color}26`, borderColor: color }}
    >
      {value}%
    </div>
  )
  return (
    <div className="flex-1 h-full flex flex-col justify-end">
      {segment(strength, '#5DB87A', 'rounded-t-sm')}
      {segment(typical, '#A8C8E8', '')}
      {segment(need, '#F08080', 'rounded-b-sm')}
    </div>
  )
}

function GradeLevelChart() {
  return (
    <div>
      <div className="flex gap-3">
        <span className="text-xs text-brand-subtext [writing-mode:vertical-rl] rotate-180 whitespace-nowrap pb-2">
          % of Students
        </span>
        <div className="flex-1">
          <div className="flex gap-4 h-64 border-b border-brand-border">
            {GRADE_LEVEL_DATA.map((g) => (
              <GradeStackedBar key={g.grade} {...g} />
            ))}
          </div>
          <div className="flex gap-4 mt-2">
            {GRADE_LEVEL_DATA.map((g) => (
              <p key={g.grade} className="flex-1 text-center text-sm text-brand-subtext">{g.grade}</p>
            ))}
          </div>
          <p className="text-center text-sm font-medium text-brand-subtext mt-3">Student Grade Level</p>
        </div>
      </div>

      <div className="flex items-center justify-center flex-wrap gap-x-6 gap-y-2 mt-5">
        {GRADE_LEGEND.map((l) => (
          <div key={l.label} className="flex items-center text-xs">
            <Dot color={l.color} />
            <span className="text-brand-subtext">{l.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Strategy cards ───────────────────────────────────────────────────────────

const strategies = [
  {
    competency: 'Responsible Decision-Making',
    title: 'What’s Important to Me?',
    duration: '15–20 min',
    description:
      'Students consider their personal values and how they support and influence responsible decision-making.',
    emoji: '🎯',
    color: '#2A7F8F',
    bg: '#E8F4F6',
  },
  {
    competency: 'Optimistic Thinking',
    title: 'Warming-Up With Strengths',
    duration: 'Less than 5 min',
    description:
      'This activity gives all students the opportunity to experience success by practicing a skill they have already mastered.',
    emoji: '✨',
    color: '#F5A623',
    bg: '#FEF3DC',
  },
]

// ─── Dashboard ────────────────────────────────────────────────────────────────

// Concept C (2026-10-19): an editorial layout after an agency site the user shared. Thin rules, a large
// headline above the subtext, then the two cards as columns split by a rule: icon,
// large title, description, topic chips and a teal text link. Replaced the production empty state that held C.
function EditorialDashboard() {
  const navigate = useNavigate()
  const look = {
    ratings: { Icon: ClipboardCheck, badge: 'bg-dessa-teal text-white', chips: ['Competencies', 'Strengths', 'Strategies'] },
    curriculum: { Icon: BookOpen, badge: 'bg-mtw-amber text-brand-text', chips: ['Courses', 'Video lessons', 'Activities'] },
  }

  return (
    <div className="px-6 pt-10 pb-7">
      <motion.section {...stagger(0)} className="rounded-xl border border-brand-border bg-white px-8 pb-2">
        <header className="flex flex-col gap-1 py-8 border-b border-brand-text/15">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-brand-text">
            Welcome to your new platform, Tara.
          </h1>
          <p className="text-base text-brand-subtext max-w-2xl">Rate your students to see where they shine, or bring your first lesson to class.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2">
          {NEW_CUSTOMER_CARDS.map((c, i) => {
            const { Icon, badge, chips } = look[c.key]
            return (
              <div key={c.key} className={`flex flex-col py-6 ${i === 0 ? 'md:pr-8 md:border-r border-brand-text/15' : 'md:pl-8 border-t md:border-t-0 border-brand-text/15'}`}>
                <span className={`flex items-center justify-center w-12 h-12 rounded-full mb-16 ${badge}`}>
                  <Icon size={20} aria-hidden="true" />
                </span>
                <h2 className="text-2xl font-semibold leading-tight tracking-tight text-brand-text">{c.title}</h2>
                <p className="text-sm text-brand-subtext mt-3">{c.body}</p>
                <ul className="flex flex-wrap gap-1.5 mt-5" aria-label="Topics">
                  {chips.map(chip => (
                    <li key={chip} className="rounded-full border border-brand-text/25 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-brand-text">{chip}</li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate(c.to)}
                  className="self-start inline-flex items-center gap-2 mt-6 pb-1 border-b-2 border-dessa-teal text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:border-dessa-navy transition-colors"
                >
                  {c.cta}
                  <ArrowRight size={14} aria-hidden="true" />
                </button>
              </div>
            )
          })}
        </div>

      </motion.section>
    </div>
  )
}

// New customer concepts B, D and E (2026-10-19): the page has two jobs, getting the user to rate their students or
// to explore the curriculum, so each gets a card with its own button. No "no data" message.
const NEW_CUSTOMER_CARDS = [
  {
    key: 'ratings', to: '/ratings', title: 'Rate your students', cta: 'Start rating',
    body: 'See where each student shines and where they could use support.',
  },
  {
    key: 'curriculum', to: '/mtw', title: 'Explore the curriculum', cta: 'Browse courses',
    body: 'Find a course and bring your first lesson to class.',
  },
]

// Concept D (was C): two plain cards side by side. Ratings is DESSA (teal, rounded-md button); the curriculum is
// MTW (amber, rounded-full button), per the brand split.
function TwoCardsDashboard() {
  const navigate = useNavigate()
  const look = {
    ratings: { Icon: ClipboardCheck, tile: 'bg-dessa-tealLight text-dessa-teal', button: 'rounded-md bg-dessa-teal text-white hover:bg-dessa-teal/90' },
    curriculum: { Icon: BookOpen, tile: 'bg-mtw-amberLight text-brand-text', button: 'rounded-full bg-mtw-amber text-brand-text hover:brightness-105' },
  }

  return (
    <div className="px-6 pt-10 pb-7">
      <motion.h1 {...stagger(0)} className="text-2xl font-semibold text-brand-text mb-6">Welcome back, Tara!</motion.h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {NEW_CUSTOMER_CARDS.map((c, i) => {
          const { Icon, tile, button } = look[c.key]
          return (
            <motion.section key={c.key} {...stagger(i + 1)} className="flex flex-col items-start rounded-xl border border-brand-border bg-white p-5">
              <div className={`flex items-center justify-center w-11 h-11 rounded-lg mb-4 ${tile}`}>
                <Icon size={20} aria-hidden="true" />
              </div>
              <h2 className="text-lg font-semibold text-brand-text">{c.title}</h2>
              <p className="text-sm text-brand-subtext mt-1 mb-5">{c.body}</p>
              <button
                onClick={() => navigate(c.to)}
                className={`mt-auto flex items-center gap-1.5 h-10 px-5 text-sm font-semibold transition-all ${button}`}
              >
                {c.cta}
                <ChevronRight size={14} aria-hidden="true" />
              </button>
            </motion.section>
          )
        })}
      </div>
    </div>
  )
}

// Shapes from the brand style guide (2026-10-19), each drawn in a perfect square as the guide asks.
// Ratings: the 3 by 3 grid of dots. Curriculum: the two arches.
function DotGridShape({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {[8, 24, 40].flatMap(y => [8, 24, 40].map(x => <circle key={`${x}-${y}`} cx={x} cy={y} r="7.6" fill="currentColor" />))}
    </svg>
  )
}
const ARCH_PATHS = ['M0 0 A24 24 0 0 0 48 0 L36 0 A12 12 0 0 1 12 0 Z', 'M0 48 A24 24 0 0 1 48 48 L36 48 A12 12 0 0 0 12 48 Z']
function ArchesShape({ className }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      {ARCH_PATHS.map(d => <path key={d} d={d} fill="currentColor" />)}
    </svg>
  )
}

// Concept E (was D): the same two cards as bold color blocks, after an agency site the user shared. A shape at the top,
// then the number, a large title with a round arrow, and the description. Everything shows without hover.
// The whole card is the button.
function BoldCardsDashboard() {
  const navigate = useNavigate()
  const look = {
    ratings: { Shape: DotGridShape, card: 'bg-dessa-teal text-white', rule: 'border-white/60', ring: 'border-white' },
    curriculum: { Shape: ArchesShape, card: 'bg-mtw-amber text-brand-text', rule: 'border-brand-text/60', ring: 'border-brand-text' },
  }

  return (
    <div className="px-6 pt-10 pb-7">
      <motion.h1 {...stagger(0)} className="text-2xl font-semibold text-brand-text mb-6">Welcome back, Tara!</motion.h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {NEW_CUSTOMER_CARDS.map((c, i) => {
          const { Shape, card, rule, ring } = look[c.key]
          return (
            <motion.button
              key={c.key}
              {...stagger(i + 1)}
              whileHover={{ y: -2 }}
              onClick={() => navigate(c.to)}
              aria-label={`${c.title}. ${c.cta}`}
              className={`flex flex-col justify-between min-h-80 rounded-2xl p-6 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-dessa-teal ${card}`}
            >
              <Shape className="w-12 h-12" />
              <div>
                <p className="text-sm font-medium mb-1">0{i + 1}.</p>
                <div className={`flex items-end justify-between gap-4 pb-4 border-b ${rule}`}>
                  <h2 className="text-3xl font-semibold leading-tight">{c.title}</h2>
                  <span className={`flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 ${ring}`}>
                    <ArrowRight size={18} aria-hidden="true" />
                  </span>
                </div>
                <p className="text-sm mt-4">{c.body}</p>
              </div>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}

// Concept B (2026-10-19, was E): a big greeting above the two cards, after a kids' sports
// site the user shared. Each card has a tag, title and description over a tinted panel with a shape
// illustration from the style guide (shapes only, no faces: the brand has none yet). The whole card is the button.
// A burst with `n` points, for the Ratings illustration.
const burstPoints = (cx, cy, R, r, n) => Array.from({ length: n * 2 }, (_, k) => {
  const a = (Math.PI * k) / n - Math.PI / 2
  const rad = k % 2 ? r : R
  return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`
}).join(' ')

function RatingsIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full" aria-hidden="true">
      <polygon points={burstPoints(96, 88, 52, 34, 12)} className="fill-dessa-teal stroke-dessa-teal" strokeWidth="8" strokeLinejoin="round" />
      <circle cx="150" cy="40" r="14" className="fill-mtw-coral" />
      {[0, 1, 2].map(i => <circle key={i} cx={30 + i * 14} cy="132" r="5" className="fill-dessa-navy" />)}
    </svg>
  )
}

function CurriculumIllustration() {
  return (
    <svg viewBox="0 0 200 160" className="w-full h-full" aria-hidden="true">
      <g transform="translate(58 38) scale(1.75)" className="fill-mtw-amber">
        {ARCH_PATHS.map(d => <path key={d} d={d} />)}
      </g>
      <g className="fill-mtw-coral">
        {[[0, -11], [11, 0], [0, 11], [-11, 0]].map(([x, y]) => <circle key={`${x}${y}`} cx={160 + x} cy={40 + y} r="10" />)}
      </g>
      <rect x="22" y="122" width="36" height="16" rx="8" className="fill-dessa-navy" />
    </svg>
  )
}

function ShowcaseDashboard() {
  const navigate = useNavigate()
  const look = {
    ratings: { tag: 'DESSA', panel: 'bg-dessa-tealLight', Illustration: RatingsIllustration },
    curriculum: { tag: 'Move This World', panel: 'bg-mtw-amberLight', Illustration: CurriculumIllustration },
  }

  return (
    <div className="px-6 pt-10 pb-7">
      {/* Vertical (2026-10-19): the greeting sits above the cards instead of beside them. Narrowed and centered
          the same day at the user's request (too wide at full width). */}
      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        <motion.div {...stagger(0)}>
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-brand-text">Welcome to your new platform, Tara.</h1>
          <p className="text-base text-brand-subtext mt-4 max-w-2xl">DESSA and Move This World now live together in one place. Rate your students to see their strengths, then find lessons that help them grow, all from one home.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {NEW_CUSTOMER_CARDS.map((c, i) => {
            const { tag, panel, Illustration } = look[c.key]
            return (
              <motion.button
                key={c.key}
                {...stagger(i + 1)}
                whileHover={{ y: -2 }}
                onClick={() => navigate(c.to)}
                aria-label={`${c.title}. ${c.cta}`}
                className="flex flex-col rounded-2xl border border-brand-border bg-white text-left overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-dessa-teal"
              >
                <div className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-text">{tag}</span>
                    <span className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-bg text-brand-text">
                      <ArrowUpRight size={14} aria-hidden="true" />
                    </span>
                  </div>
                  <h2 className="text-3xl font-semibold leading-tight tracking-tight text-brand-text mt-4">{c.title}</h2>
                  <p className="text-sm text-brand-subtext mt-3">{c.body}</p>
                </div>
                <div className={`mt-auto h-56 rounded-2xl p-6 ${panel}`}>
                  <Illustration />
                </div>
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { dashboardConcept } = useDashboardConcept()
  if (dashboardConcept === 'b') return <ShowcaseDashboard />
  if (dashboardConcept === 'c') return <EditorialDashboard />
  if (dashboardConcept === 'd') return <TwoCardsDashboard />
  if (dashboardConcept === 'e') return <BoldCardsDashboard />

  return (
    <div className="px-6 pt-10 pb-7">

      {/* ── Greeting row ── */}
      <motion.div {...stagger(0)} className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-brand-text">Welcome back, Tara!</h1>
        </div>
      </motion.div>

      {/* ── MTW CTA ── */}
      <motion.div {...stagger(1)} className="mb-6">
        <div className="bg-dessa-navy rounded-2xl overflow-hidden shadow-md">
          <div className="flex items-center px-6 py-4 gap-5">

            {/* MTW image */}
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <img src="/logo-png.png" alt="Move This World" className="w-full h-full object-contain" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-white/70 text-xs font-semibold mb-0.5">
                Curriculum
              </p>
              <p className="text-white font-semibold text-base">
                Pick up where you left off or explore something new with your students.
              </p>
            </div>
            <button
              onClick={() => navigate('/mtw')}
              className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-95 flex-shrink-0"
              style={{ background: '#2A7F8F' }}
            >
              Go to Courses
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Two-column: Timeline + My Students ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        <motion.div {...stagger(2)}>
          <TimelineCard />
        </motion.div>

        <motion.div {...stagger(2)}>
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm h-full flex flex-col">
            <div className="px-5 pt-5 pb-4 border-b border-brand-border flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-brand-text">My Students</h3>
                <button className="text-sm font-semibold text-dessa-teal hover:text-dessa-navy transition-colors mt-0.5">
                  View Details
                </button>
              </div>
              <RatingWindowSelect label="26-27 Pre - Default" />
            </div>
            <div className="p-5 flex-1">
              <MyStudentsChart />
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Grade Level Comparison ── */}
      <motion.div {...stagger(3)} className="mb-5">
        <div className="bg-white rounded-2xl border border-brand-border shadow-sm">
          <div className="px-5 pt-5 pb-4 border-b border-brand-border flex items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-semibold text-brand-text">Grade Level Comparison</h3>
              <button className="text-sm font-semibold text-dessa-teal hover:text-dessa-navy transition-colors mt-0.5">
                View Details
              </button>
            </div>
            <RatingWindowSelect label="26-27 Pre - Default" />
          </div>
          <div className="p-5">
            <GradeLevelChart />
          </div>
        </div>
      </motion.div>

      {/* ── Classroom Strategies ── */}
      <motion.div {...stagger(4)}>
        <div className="bg-white rounded-2xl border border-brand-border shadow-sm flex flex-col">
          <div className="px-5 pt-5 pb-4 border-b border-brand-border">
            <h3 className="text-base font-semibold text-brand-text">
              Try These Classroom Strategies
            </h3>
            <p className="text-sm text-brand-subtext mt-0.5">
              We've built a full library of proven strategies. Here are two samples to explore.
            </p>
          </div>
          <div className="p-5 flex flex-col gap-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {strategies.map((s) => (
                <motion.div
                  key={s.title}
                  whileHover={{ y: -1 }}
                  className="flex rounded-xl border overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
                  style={{ borderColor: `${s.color}40` }}
                >
                  <div
                    className="w-32 flex-shrink-0 flex flex-col items-center justify-center px-3 py-4 text-center"
                    style={{ background: s.bg }}
                  >
                    <span className="text-xl mb-1.5">{s.emoji}</span>
                    <p
                      className="text-xs font-semibold leading-snug"
                      style={{ color: s.color }}
                    >
                      {s.competency}
                    </p>
                  </div>
                  <div className="flex-1 px-4 py-4">
                    <p className="text-sm text-brand-subtext mb-1.5">
                      <span className="font-semibold text-brand-text">Title:</span>{' '}
                      {s.title}
                    </p>
                    <p className="text-sm text-brand-subtext mb-1.5">
                      <span className="font-semibold text-brand-text">Duration:</span>{' '}
                      {s.duration}
                    </p>
                    <p className="text-sm text-brand-subtext leading-relaxed">
                      <span className="font-semibold text-brand-text">Description:</span>{' '}
                      {s.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>

            <p className="text-sm text-center text-brand-subtext px-2">
              Class-level strategy recommendations will appear once a Full DESSA has been
              completed.
            </p>

            <button className="w-full py-2.5 rounded-md text-sm font-semibold border border-dessa-teal text-dessa-teal hover:bg-dessa-tealLight transition-colors">
              Browse the DESSA Strategy Library
            </button>
          </div>
        </div>
      </motion.div>

    </div>
  )
}
