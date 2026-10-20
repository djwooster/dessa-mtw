import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { ChevronRight, Calendar, ChevronDown, ClipboardCheck, BookOpen, ArrowRight, ArrowUpRight, Info, Users, Sparkles, Lightbulb, TrendingUp } from 'lucide-react'
import { SidePanel } from '../components/ui/side-panel'
import { useDashboardConcept } from '../lib/dashboardConceptContext'
import { toast } from 'sonner'

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

// Classroom Strategies card (pulled out of concept A 2026-10-20 so concept D's after ratings view can reuse it).
// `stacked` puts the two samples in one column, for a half width card. `quiet` (2026-10-20, concept D after
// ratings) makes the samples static and swaps the library button for a text link, the only hover interaction.
function StrategiesCard({ stacked = false, quiet = false }) {
  const navigate = useNavigate()
  return (
    <div className="bg-white rounded-2xl border border-brand-border shadow-sm flex flex-col h-full">
      <div className="px-5 pt-5 pb-4 border-b border-brand-border">
        <h3 className="text-base font-semibold text-brand-text">
          Try These Classroom Strategies
        </h3>
        <p className="text-sm text-brand-subtext mt-0.5">
          We've built a full library of proven strategies. Here are two samples to explore.
        </p>
      </div>
      <div className="p-5 flex flex-col gap-3">
        <div className={`grid grid-cols-1 gap-3 ${stacked ? '' : 'md:grid-cols-2'}`}>
          {strategies.map((s) => (
            <motion.div
              key={s.title}
              whileHover={quiet ? undefined : { y: -1 }}
              className={`flex rounded-xl border overflow-hidden ${quiet ? '' : 'cursor-pointer hover:shadow-sm transition-shadow'}`}
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

        {quiet ? (
          <button
            onClick={() => navigate('/resource-library')}
            className="group self-center inline-flex items-center gap-1.5 text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4 transition-colors"
          >
            Browse the DESSA Strategy Library
            <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </button>
        ) : (
          <button className="w-full py-2.5 rounded-md text-sm font-semibold border border-dessa-teal text-dessa-teal hover:bg-dessa-tealLight transition-colors">
            Browse the DESSA Strategy Library
          </button>
        )}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

// Concept E (2026-10-19, earlier C, D, E and F): an editorial layout after an agency site the user shared. Thin rules, a large
// headline above the subtext, then the two cards as columns split by a rule: icon,
// large title, description, topic chips and a teal text link. Replaced the production empty state that held C.
function EditorialDashboard() {
  const navigate = useNavigate()
  const simulateRating = useSimulateRating()
  const look = {
    // Badges are a
    // light tint of the card's color with a darker icon; full amber is unreadable on its own tint, so the book
    // uses a darker amber (one-off, about 4 to 1 contrast).
    ratings: { Icon: ClipboardCheck, badge: 'bg-dessa-teal/15 text-dessa-teal', chips: ['Competencies', 'Strengths', 'Strategies'], copy: { title: 'Rate with the DESSA' } },
    // `copy` (2026-10-20) overrides the shared card copy for this concept only.
    curriculum: { Icon: BookOpen, badge: 'bg-mtw-amber/15 text-[#A86500]', chips: ['Courses', 'Video lessons', 'Activities'] },
  }

  return (
    <div className="px-6 pt-10 pb-7">
      {/* Full width with the standard 24px gutter, 40px top and a 20px gap to the cards, matching concept E (2026-10-20). */}
      <div>
        {/* Heading out of the panel (2026-10-19), sized like concept B. */}
        <motion.header {...stagger(0)} className="flex flex-col gap-1 mb-5">
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-brand-text">Welcome back, Tara</h1>
          </motion.header>
        <motion.section {...stagger(1)} className="rounded-xl border border-brand-border bg-white px-8 py-2">

          <div className="grid grid-cols-1 md:grid-cols-2">
            {NEW_CUSTOMER_CARDS.map((shared, i) => {
              const { Icon, badge, chips, copy } = look[shared.key]
              const c = { ...shared, ...copy }
              return (
                <div key={c.key} className={`flex flex-col py-6 ${i === 0 ? 'md:pr-8 md:border-r border-brand-text/15' : 'md:pl-8 border-t md:border-t-0 border-brand-text/15'}`}>
                  <span className={`flex items-center justify-center w-[60px] h-[60px] rounded-md mb-16 ${badge}`}>
                    <Icon size={24} aria-hidden="true" />
                  </span>
                  <h2 className="text-2xl font-semibold leading-tight tracking-tight text-brand-text">{c.title}</h2>
                  <p className="text-sm text-brand-subtext mt-3 max-w-lg">{c.body}</p>
                  <ul className="flex flex-wrap gap-1.5 mt-5" aria-label="Topics">
                    {chips.map(chip => (
                      <li key={chip} className="rounded-full border border-brand-text/25 px-2 py-0.5 text-xs font-medium text-brand-text">{chip}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => (c.key === 'ratings' ? simulateRating() : navigate(c.to))}
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
    </div>
  )
}

// New customer concepts B to F (2026-10-19): the page has two jobs, getting the user to rate their students or
// to explore the curriculum, so each gets a card with its own button. No "no data" message.
// Curriculum comes first in every concept (2026-10-19). The two sentence descriptions started in concept C and
// were shared with every concept the same day. The curriculum card welcomes users back (2026-10-20): they've
// already been using it this school year.
const NEW_CUSTOMER_CARDS = [
  {
    key: 'curriculum', to: '/mtw', title: 'Jump back into the curriculum', cta: 'Continue your course',
    body: 'Pick up where you left off. Each lesson pairs a short video with an activity your whole class can do together.',
  },
  {
    key: 'ratings', to: '/ratings', title: 'Rate your students', cta: 'Start rating',
    body: 'See where each student shines and where they could use support. Your ratings unlock strategies and lessons matched to your class.',
  },
]

// Concept D (2026-10-19, earlier B, C, D and E): a big greeting above the two cards, after a kids' sports
// site the user shared. Each card has a tag, title and description over a tinted panel with a shape
// illustration from the style guide (shapes only, no faces: the brand has none yet). The whole card is the button.
// A burst with `n` points, for the Ratings illustration.
const burstPoints = (cx, cy, R, r, n) => Array.from({ length: n * 2 }, (_, k) => {
  const a = (Math.PI * k) / n - Math.PI / 2
  const rad = k % 2 ? r : R
  return `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)}`
}).join(' ')

// Card illustrations (refined 2026-10-19 after a Pinterest board the user shared): one bold, deliberate shape
// from the style guide per card, filling the panel, in tones of the card's brand color. Circles overlap with a
// multiply blend so the overlaps read as darker tones, like a printed poster.
function RatingsIllustration() {
  // The style guide's 3 by 3 dot grid, stepping from light to full teal like a rating scale.
  return (
    <svg viewBox="0 0 136 136" className="w-full h-full" aria-hidden="true">
      {[0, 1, 2].flatMap(row => [0, 1, 2].map(col => (
        <circle
          key={`${row}-${col}`} cx={24 + col * 44} cy={24 + row * 44} r="24"
          className="fill-dessa-teal" fillOpacity={0.25 + (0.75 * (row + col)) / 4} style={{ mixBlendMode: 'multiply' }}
        />
      )))}
    </svg>
  )
}

function CurriculumIllustration() {
  // The style guide's four petal flower, made of four large overlapping amber circles.
  return (
    <svg viewBox="0 0 120 120" className="w-full h-full" aria-hidden="true">
      {[[60, 34], [86, 60], [60, 86], [34, 60]].map(([cx, cy]) => (
        <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="34" className="fill-mtw-amber" fillOpacity="0.7" style={{ mixBlendMode: 'multiply' }} />
      ))}
    </svg>
  )
}

// "About the DESSA" (2026-10-19, concept B): opened from the DESSA link in the subtext, for new Move This World
// customers who may not know it yet.
function AboutDessaPanel({ open, onClose }) {
  const navigate = useNavigate()
  const sections = [
    ['What it is', 'The DESSA (Devereux Student Strengths Assessment) is a short rating that helps you see the strengths each student brings to class, like self awareness, relationship skills and decision making.'],
    ['How it works', "You rate each student on everyday behaviors you've seen in class. Most educators rate three times a year: fall, winter and spring."],
    ['What you get', 'A picture of where each student shines and where they could use support, plus classroom strategies and Move This World lessons matched to what you see.'],
  ]
  return (
    <SidePanel
      open={open}
      onClose={onClose}
      title="About the DESSA"
      action={
        <button onClick={() => navigate('/ratings')} className="flex-1 h-9 rounded-lg bg-dessa-teal text-sm font-medium text-white hover:bg-dessa-teal/90 transition-colors">
          Start rating
        </button>
      }
    >
      <div className="flex flex-col gap-6">
        {sections.map(([heading, body]) => (
          <div key={heading}>
            <h3 className="text-sm font-semibold text-brand-text mb-1.5">{heading}</h3>
            <p className="text-sm text-brand-subtext leading-relaxed">{body}</p>
          </div>
        ))}
      </div>
    </SidePanel>
  )
}

// Style guide star and flower shapes (2026-10-19), each drawn in a 100 by 100 square in currentColor, for
// concept B's Hero shape subtab. Solid fills, no opacity.
const turns = (n, offset = 0) => Array.from({ length: n }, (_, k) => offset + (360 * k) / n)
const petalPath = (len, w) => `M50 50 C${50 - w} ${50 - len * 0.35} ${50 - w} ${50 - len} 50 ${50 - len} C${50 + w} ${50 - len} ${50 + w} ${50 - len * 0.35} 50 50 Z`
const Petals = ({ n, len = 48, w = 14, offset = 0 }) => turns(n, offset).map(a => <path key={a} d={petalPath(len, w)} transform={`rotate(${a} 50 50)`} />)
const scallopPath = (n, R, r) => {
  const pt = (a, rad) => `${(50 + rad * Math.cos(a)).toFixed(1)} ${(50 + rad * Math.sin(a)).toFixed(1)}`
  const step = (2 * Math.PI) / n
  let d = `M${pt(-Math.PI / 2, R)}`
  for (let k = 0; k < n; k++) {
    const a = -Math.PI / 2 + k * step
    d += ` Q${pt(a + step / 2, r)} ${pt(a + step, R)}`
  }
  return `${d} Z`
}
const STYLE_SHAPES = {
  sparkle: () => <path d="M50 2 C54 36 64 46 98 50 C64 54 54 64 50 98 C46 64 36 54 2 50 C36 46 46 36 50 2 Z" />,
  badge: () => <path d={scallopPath(8, 48, 34)} />,
}

// Concept D's "Hero shape" subtab (was concept H): one large style guide shape, solid, with a smaller shape cut into its center in the
// panel's tint. Ratings: a sparkle inside the scalloped badge. Curriculum: a circle inside the eight petal flower.
function RatingsHeroShape() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <g className="fill-dessa-teal">{STYLE_SHAPES.badge()}</g>
      <g className="fill-dessa-tealLight" transform="translate(50 50) scale(0.45) translate(-50 -50)">{STYLE_SHAPES.sparkle()}</g>
    </svg>
  )
}
function CurriculumHeroShape() {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full" aria-hidden="true">
      <g className="fill-mtw-amber"><Petals n={8} w={13} /></g>
      <circle cx="50" cy="50" r="11" className="fill-mtw-amberLight" />
    </svg>
  )
}

const SHOWCASE_ILLUSTRATIONS = {
  b: { ratings: RatingsIllustration, curriculum: CurriculumIllustration },
  hero: { ratings: RatingsHeroShape, curriculum: CurriculumHeroShape },
}

// The Nav subtab picks Circles or Hero shape.
// The new customer subtext (2026-10-19, from concept B, shared with every concept): DESSA is a dashed link that
// opens the About the DESSA panel.
function PlatformSubtext({ className = '' }) {
  const [aboutOpen, setAboutOpen] = useState(false)
  return (
    <>
      <p className={`text-base text-brand-subtext max-w-2xl ${className}`}>
        <button
          type="button"
          onClick={() => setAboutOpen(true)}
          className="inline-flex items-center gap-1 font-medium text-dessa-teal underline decoration-dashed decoration-1 underline-offset-4 hover:text-dessa-navy transition-colors"
        >
          DESSA <Info size={14} aria-hidden="true" />
        </button>{' '}
        and Move This World now live together in one place. Rate your students to see their strengths, then find lessons that help them grow, all from one home.
      </p>
      <AboutDessaPanel open={aboutOpen} onClose={() => setAboutOpen(false)} />
    </>
  )
}

function ShowcaseDashboard() {
  const navigate = useNavigate()
  const simulateRating = useSimulateRating()
  const { showcaseArt } = useDashboardConcept()
  const art = SHOWCASE_ILLUSTRATIONS[showcaseArt === 'hero' ? 'hero' : 'b']
  const look = {
    ratings: { tag: 'DESSA', panel: 'bg-dessa-tealLight', Illustration: art.ratings },
    curriculum: { tag: 'Move This World', panel: 'bg-mtw-amberLight', Illustration: art.curriculum },
  }

  return (
    <div className="px-6 pt-10 pb-7">
      {/* Vertical (2026-10-19): the greeting sits above the cards instead of beside them. Full width with a 20px gap
          to the cards since 2026-10-20, matching concept E. */}
      <div className="flex flex-col gap-5">
        <motion.div {...stagger(0)}>
          <h1 className="text-[32px] font-semibold leading-tight tracking-tight text-brand-text">Welcome to your new platform, Tara.</h1>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {NEW_CUSTOMER_CARDS.map((c, i) => {
            const { tag, panel, Illustration } = look[c.key]
            return (
              <motion.button
                key={c.key}
                {...stagger(i + 1)}
                whileHover={{ y: -2 }}
                onClick={() => (c.key === 'ratings' ? simulateRating() : navigate(c.to))}
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
                  <h2 className="text-2xl font-semibold leading-tight tracking-tight text-brand-text mt-4">{c.title}</h2>
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

// Concept B (2026-10-20, always B; first E): a recreation of today's production dashboard for a new Move This World customer, the
// empty state before any ratings this school year, copy included, so the proposals can be compared against it.
// Colors come from the org design system palette, which is what production uses. No gray organization bar.
// The user's rating illustration (public/rating.svg, 2026-10-20), inlined so its dark shapes take the text color;
// the white dots stay white.
function RatingMarkPaths() {
  return (
    <>
      <path d="M30.8928 73.6528C21.4669 72.2185 13.0089 67.08 7.39313 59.3792C1.39978 51.2643 -1.07857 41.078 0.527898 31.1182C2.1275 21.4338 7.53732 12.7943 15.5628 7.13747C28.2566 -1.92422 45.7218 0.234436 60.7978 0.22551L109.053 0.210403L159.177 0.229628C179.649 0.246106 200.698 -3.16353 214.16 15.7446C219.996 23.9817 222.234 34.2374 220.36 44.1567C218.568 53.7992 212.979 62.3192 204.851 67.7989C201.309 70.2253 194.258 73.486 189.823 73.7146L190.956 75.1043C223.833 76.9519 238.086 136.286 188.848 147.318C202.846 151.218 213.913 157.308 219.076 172.181C226.113 192.446 213.192 217.522 191.251 220.357C177.926 222.078 162.698 221.377 149.009 221.382L95.4878 221.379C75.5305 221.371 55.6557 221.537 35.6298 221.135C8.04533 220.581 -8.51364 190.457 4.53717 166.537C10.8738 154.924 20.3753 150.668 32.4169 147.283C24.9475 145.986 18.9886 143.783 13.0982 138.821C5.66313 132.568 1.0291 123.605 0.225868 113.922C-0.611691 103.992 2.56003 94.1395 9.04768 86.5718C14.1485 80.7159 22.7712 75.5272 30.6388 75.0391L30.8928 73.6528Z" fill="currentColor" />
      <path d="M30.893 73.6528C21.467 72.2185 13.0091 67.08 7.3933 59.3792C1.39995 51.2643 -1.0784 41.078 0.528068 31.1182C2.12767 21.4338 7.53749 12.7943 15.5629 7.13747C28.2568 -1.92422 45.7219 0.234436 60.798 0.22551L109.054 0.210403L159.177 0.229628C179.649 0.246106 200.698 -3.16353 214.16 15.7446C219.996 23.9817 222.234 34.2374 220.36 44.1567C218.568 53.7992 212.98 62.3192 204.851 67.7989C201.309 70.2253 194.258 73.486 189.823 73.7146C187.153 73.3706 176.003 73.7641 172.722 73.7757L135.547 73.7778L65.329 73.7359C54.3103 73.7201 41.6783 73.2718 30.893 73.6528Z" fill="currentColor" />
      <path d="M31.9293 17.3754C42.8793 14.6056 54.0079 21.2224 56.8089 32.1688C59.6099 43.1159 53.0262 54.2634 42.083 57.0936C31.1055 59.9347 19.9082 53.3166 17.0935 42.3276C14.2856 31.338 20.9312 20.1554 31.9293 17.3754Z" fill="white" />
      <path d="M30.8927 73.6529C41.678 73.2718 54.31 73.7201 65.3287 73.7359L135.546 73.7778L172.722 73.7758C176.003 73.7641 187.152 73.3707 189.823 73.7146L190.956 75.1043C188.244 75.4517 175.31 75.0913 171.692 75.0721L132.134 75.0501L67.0725 75.1002C56.9738 75.1414 40.3324 75.7703 30.6387 75.0391L30.8927 73.6529Z" fill="currentColor" />
      <path d="M181.393 90.8797C192.466 89.4077 202.675 97.0611 204.371 108.1C206.066 119.138 198.618 129.504 187.62 131.422C180.301 132.698 172.873 129.918 168.184 124.156C163.502 118.393 162.294 110.547 165.033 103.644C167.772 96.7412 174.033 91.8581 181.393 90.8797Z" fill="white" />
      <path d="M67.086 164.331C74.3014 162.823 81.7776 165.309 86.6519 170.841C91.5262 176.374 93.0572 184.099 90.6544 191.072C88.2516 198.045 82.2926 203.191 75.0429 204.547C64.0036 206.615 53.3487 199.403 51.1656 188.379C48.9824 177.355 56.0879 166.629 67.086 164.331Z" fill="white" />
    </>
  )
}

// Concept C settled on one mark (2026-10-20): the Stack composition's front mark, without the lighter copies.
function RatingMark({ className }) {
  return (
    <svg viewBox="0 0 221 222" fill="none" className={className} aria-hidden="true"><RatingMarkPaths /></svg>
  )
}

// Concept C (2026-10-20, first F) is the same page with `invite` on: the "No data" card becomes an empty state that
// invites the user to complete their first DESSA rating.
// Concept C's Icon tiles image (2026-10-20, first its own concept D; after a Sprig empty state the user shared): a loose grid of tinted tiles,
// three over two, each with a dark line icon for part of the rating story: students, rating, strengths,
// strategies, growth. Tints come from brand colors.
const INVITE_TILES = [
  { Icon: Users, tint: 'bg-dessa-teal/20' },
  { Icon: ClipboardCheck, tint: 'bg-mtw-amber/25' },
  { Icon: Sparkles, tint: 'bg-mtw-coral/20' },
  { Icon: Lightbulb, tint: 'bg-mtw-purple/20' },
  { Icon: TrendingUp, tint: 'bg-mtw-green/20' },
]
function InviteTiles() {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6" aria-hidden="true">
      {INVITE_TILES.map(({ Icon, tint }) => (
        <span key={tint} className={`flex items-center justify-center w-14 h-14 rounded-xl ${tint}`}>
          <Icon size={24} strokeWidth={1.75} className="text-brand-text" />
        </span>
      ))}
    </div>
  )
}

// Concept C's Nav subtab (2026-10-20) picks the rating mark or the tile grid.
function ProductionEmptyDashboard({ invite = false }) {
  const navigate = useNavigate()
  const simulateRating = useSimulateRating()
  const { inviteArt } = useDashboardConcept()

  return (
    <div className="px-6 pt-10 pb-7 min-h-[calc(100vh-3.5rem)] bg-org-gray-50">
      <motion.h1 {...stagger(0)} className="text-[28px] font-bold text-brand-text mb-5">Welcome back, Tara!</motion.h1>

      <motion.div {...stagger(1)} className="flex items-center gap-4 rounded-sm bg-org-primary-900 px-5 py-3 mb-3">
        <div className="w-12 h-10 rounded-sm bg-white p-1 shrink-0">
          <img src="/logo-png.png" alt="Move This World" className="w-full h-full object-contain" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-white">Move This World · Curriculum</p>
          <p className="text-base font-semibold text-white">Choose a course to get started with your students</p>
        </div>
        <button
          onClick={() => navigate('/mtw')}
          className="flex items-center gap-1.5 h-9 px-3.5 rounded-md bg-org-primary-700 text-sm font-semibold text-white hover:bg-org-primary-hover transition-colors shrink-0"
        >
          Browse Courses
          <ChevronRight size={14} aria-hidden="true" />
        </button>
      </motion.div>

      {invite ? (
        <motion.section {...stagger(2)} className="flex flex-col items-center justify-center min-h-[310px] rounded-md bg-white px-6 py-12 text-center">
          {inviteArt === 'tiles' ? <InviteTiles /> : <RatingMark className="w-32 h-32 mb-6 text-mtw-purple" />}
          <h2 className="text-2xl font-semibold text-brand-text">See your students' strengths</h2>
          <p className="text-base text-brand-subtext mt-2 max-w-xl">
            Complete your first DESSA rating and this dashboard fills in with where each student shines, where they could use support, and strategies to try.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <button
              onClick={simulateRating}
              className="flex items-center gap-1.5 h-10 px-5 rounded-md bg-dessa-teal text-sm font-semibold text-white hover:bg-dessa-teal/90 transition-colors"
            >
              Start rating
              <ChevronRight size={14} aria-hidden="true" />
            </button>
          </div>
        </motion.section>
      ) : (
        <motion.section {...stagger(2)} className="flex flex-col items-center justify-center gap-3 min-h-[310px] rounded-md bg-white px-6 py-16 text-center">
          <h2 className="text-[28px] font-semibold text-brand-text">No Data Available for the 2026-2027 School Year</h2>
          <p className="text-base text-brand-text">This dashboard will activate once ratings have occurred this school year. Historical data is found in Reports.</p>
        </motion.section>
      )}
    </div>
  )
}

// Simulated rating flow (2026-10-20). Each concept's "Start rating" stands in for the whole flow (rating every
// student) and lands back on the dashboard, now in its after ratings view, with a toast to mark the moment.
function useSimulateRating() {
  const { setRated } = useDashboardConcept()
  return () => {
    setRated(true)
    window.scrollTo({ top: 0 })
    toast.success('Your first ratings are in', { description: 'Your dashboard now shows where your students shine.' })
  }
}

// After ratings view, one per concept (2026-10-20). A placeholder until the user shares the mock dashboard
// designs; it keeps the concept's greeting so the switch reads as the same page filling in.
function AfterRatingsPlaceholder({ concept }) {
  return (
    <div className="px-6 pt-10 pb-7">
      <motion.h1 {...stagger(0)} className="text-[32px] font-semibold leading-tight tracking-tight text-brand-text mb-5">Welcome back, Tara</motion.h1>
      <motion.section {...stagger(1)} className="flex flex-col items-center justify-center min-h-80 rounded-xl border-2 border-dashed border-brand-border bg-white px-6 text-center">
        <p className="text-lg font-semibold text-brand-text">Concept {concept.toUpperCase()} dashboard after ratings</p>
        <p className="text-sm text-brand-subtext mt-1">Mock dashboard coming next. Use Before ratings in the top bar to start over.</p>
      </motion.section>
    </div>
  )
}

// Concept D after ratings (2026-10-20): the production dashboard a user lands on after rating (from the user's
// screenshot: ratings pie, classroom strategies, competencies) with mock data. The design work is the Move This
// World banner, offered two ways with the Nav subtab: a compact version of D's curriculum card, or the card
// recommending a lesson matched to the ratings (a soft amber strip was tried and removed 2026-10-20).
const MOCK_RATINGS = [
  { key: 'strength', label: 'Strength', count: 3, fill: 'fill-dessa-green' },
  { key: 'typical', label: 'Typical', count: 1, fill: 'fill-dessa-blue' },
]
function RatingsPie() {
  const total = MOCK_RATINGS.reduce((n, r) => n + r.count, 0)
  let start = -Math.PI / 2
  const slices = MOCK_RATINGS.map(r => {
    const end = start + (2 * Math.PI * r.count) / total
    const large = end - start > Math.PI ? 1 : 0
    const pt = a => `${(100 + 90 * Math.cos(a)).toFixed(2)} ${(100 + 90 * Math.sin(a)).toFixed(2)}`
    const mid = (start + end) / 2
    const slice = { ...r, d: `M100 100 L${pt(start)} A90 90 0 ${large} 1 ${pt(end)} Z`, lx: 100 + 50 * Math.cos(mid), ly: 100 + 50 * Math.sin(mid) }
    start = end
    return slice
  })
  return (
    <svg viewBox="0 0 200 200" className="w-64 h-64" role="img" aria-label="3 students strength, 1 student typical">
      {slices.map(sl => <path key={sl.key} d={sl.d} className={sl.fill} stroke="white" strokeWidth="2" />)}
      {slices.map(sl => (
        <text key={`t${sl.key}`} x={sl.lx} y={sl.ly} textAnchor="middle" className="fill-brand-text text-[10px] font-semibold">
          <tspan x={sl.lx} dy="-2">{sl.count} {sl.count === 1 ? 'student' : 'students'}</tspan>
          <tspan x={sl.lx} dy="12">{sl.label}</tspan>
        </text>
      ))}
    </svg>
  )
}

const MOCK_COMPETENCIES = [
  { name: 'Self-Awareness', need: 0, typical: 1, strength: 3 },
  { name: 'Self-Management', need: 1, typical: 2, strength: 1 },
  { name: 'Social Awareness', need: 0, typical: 2, strength: 2 },
  { name: 'Relationship Skills', need: 0, typical: 0, strength: 4 },
  { name: 'Responsible Decision Making', need: 0, typical: 1, strength: 3 },
  { name: 'Optimistic Thinking', need: 0, typical: 2, strength: 2 },
]
function CompetencyRows() {
  return (
    <div className="flex flex-col gap-3">
      {MOCK_COMPETENCIES.map(c => {
        const total = c.need + c.typical + c.strength
        return (
          <div key={c.name} className="flex items-center gap-4">
            <p className="w-56 shrink-0 text-sm text-brand-text">{c.name}</p>
            <div className="flex-1 flex h-4 rounded-full overflow-hidden bg-brand-bg">
              {[['need', 'bg-dessa-salmon'], ['typical', 'bg-dessa-blue'], ['strength', 'bg-dessa-green']].map(([k, bg]) => (
                c[k] > 0 && <span key={k} className={bg} style={{ width: `${(c[k] / total) * 100}%` }} />
              ))}
            </div>
          </div>
        )
      })}
      <div className="flex items-center gap-4 mt-1 text-xs text-brand-subtext">
        <span className="flex items-center"><Dot color="#F08080" />Need</span>
        <span className="flex items-center"><Dot color="#A8C8E8" />Typical</span>
        <span className="flex items-center"><Dot color="#5DB87A" />Strength</span>
      </div>
    </div>
  )
}

// Banner image variations (2026-10-20): D's amber flower, then the user's idea-1 to idea-3 (public/). Each idea file
// is a white canvas around a tinted square, so the square's tint becomes the panel background and the shape is
// drawn cropped to that square. Clicking the image cycles through them; a prototype shortcut, with no hover styling.
const BANNER_ARTS = [
  null,
  { tint: 'rgba(160, 201, 235, 0.32)', fill: '#142C4D', d: 'M179.089 97C179.715 97.7127 183.937 105.899 184.477 107.054C197.053 133.906 214.62 144.838 240.287 158.043C206.027 174.709 196.096 185.052 179.309 218.875C178.217 217.573 171.097 203.439 169.102 200.147C155.692 178.03 140.335 169.093 118 157.997C152.752 140.711 161.823 131.312 179.089 97Z' },
  { tint: 'rgba(255, 162, 0, 0.22)', fill: '#FA5A27', d: 'M137.481 97.1207C164.07 97.1808 174.473 136.645 179.107 157.353C182.98 139.241 193.795 101.198 215.276 97.3182C220.69 96.3574 226.269 97.5925 230.768 100.75C235.537 104.112 238.772 109.236 239.754 114.987C244.314 141.269 198.92 155.06 179.549 158.249C200.006 162.81 254.177 177.517 236.63 209.97C233.634 215.511 227.104 218.317 221.181 219.629C195.2 220.822 182.82 179.726 179.31 159.474C173.933 176.853 166.022 214.131 144.417 219.154C138.85 220.445 132.994 219.454 128.158 216.403C123.321 213.403 119.878 208.605 118.577 203.066C112.28 175.376 159.178 162.6 178.641 158.24C160.583 155.629 149.444 150.361 133.909 141.758C112.562 129.931 111.887 102.009 137.481 97.1207Z' },
  { tint: 'rgba(255, 120, 124, 0.2)', fill: '#FFA200', d: 'M177.911 89.8213C192.54 93.1064 192.245 115.877 191.519 127.761C219.625 91.9367 249.637 110.436 209.767 145.597C212.221 145.47 214.689 145.385 217.15 145.342C256.232 144.844 259.124 173.343 209.541 171.358C212.331 173.581 214.957 176.007 217.39 178.617C244.31 207.199 220.4 223.612 191.491 189.19C192.561 201.938 192.245 219.221 180.482 227C179.988 227.003 179.488 226.985 178.994 226.948C165.64 225.848 165.133 199.176 165.983 189.222C163.824 191.902 161.486 194.434 158.991 196.796C131.042 223.68 113.171 201.599 147.838 171.394C145.13 171.515 142.422 171.591 139.714 171.622C101.209 171.848 98.8024 143.883 147.7 145.535C110.093 114.449 134.401 89.3875 165.784 127.622C165.017 115.244 165.257 96.0975 177.911 89.8213Z' },
]

function CurriculumBanner({ style }) {
  const navigate = useNavigate()
  const [art, setArt] = useState(0)
  // Card and Recommendation: a compact version of D's curriculum card. A static card (2026-10-20); only the
  // Browse courses link is interactive.
  const recommend = style === 'recommend'
  return (
    <div className="w-full flex items-stretch rounded-xl border border-brand-border bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setArt(a => (a + 1) % BANNER_ARTS.length)}
        aria-label="Show the next image"
        className={`w-28 shrink-0 cursor-default focus:outline-none ${BANNER_ARTS[art] ? '' : 'bg-mtw-amberLight p-3'}`}
        style={BANNER_ARTS[art] ? { background: BANNER_ARTS[art].tint } : undefined}
      >
        {BANNER_ARTS[art] ? (
          <svg viewBox="86 65 186 186" preserveAspectRatio="xMidYMid slice" className="w-full h-full" aria-hidden="true">
            <path d={BANNER_ARTS[art].d} fill={BANNER_ARTS[art].fill} />
          </svg>
        ) : <CurriculumIllustration />}
      </button>
      <div className="flex-1 min-w-0 px-5 py-4">
        <span className="rounded-full bg-brand-bg px-2.5 py-1 text-xs font-medium text-brand-text">{recommend ? 'Recommended for your class' : 'Curriculum'}</span>
        <p className="text-lg font-semibold text-brand-text mt-2">{recommend ? 'Cooling Down Strategies' : 'Jump back into the curriculum'}</p>
        <p className="text-sm text-brand-subtext mt-0.5">{recommend ? 'A Move This World lesson to build Self-Management, based on your ratings.' : 'Pick up where you left off.'}</p>
      </div>
      {/* "Browse courses" with the arrow (2026-10-20), in place of the arrow alone. */}
      <button
        onClick={() => navigate('/mtw')}
        className="group self-center inline-flex items-center gap-1.5 mr-5 text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4 transition-colors shrink-0"
      >
        Browse courses
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </button>
    </div>
  )
}

function AfterRatingsD() {
  const { bannerStyle } = useDashboardConcept()
  const card = 'bg-white rounded-2xl border border-brand-border shadow-sm'
  const header = (title) => (
    <div className="px-5 pt-5 pb-4 border-b border-brand-border flex items-center justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-brand-text">{title}</h3>
        <button className="text-sm font-semibold text-dessa-teal hover:text-dessa-navy transition-colors mt-0.5">View details</button>
      </div>
      <RatingWindowSelect label="26-27 Pre" />
    </div>
  )
  return (
    <div className="px-6 pt-10 pb-7">
      <motion.h1 {...stagger(0)} className="text-[32px] font-semibold leading-tight tracking-tight text-brand-text mb-5">Welcome back, Tara</motion.h1>
      <motion.div {...stagger(1)} className="mb-5"><CurriculumBanner style={bannerStyle} /></motion.div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">
        <motion.div {...stagger(2)} className={`${card} flex flex-col`}>
          {header("My students' DESSA ratings")}
          <div className="flex-1 flex items-center justify-center p-5"><RatingsPie /></div>
        </motion.div>
        <motion.div {...stagger(2)}><StrategiesCard stacked quiet /></motion.div>
      </div>
      <motion.div {...stagger(3)} className={card}>
        {header('Competencies')}
        <div className="p-5"><CompetencyRows /></div>
      </motion.div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { dashboardConcept, rated } = useDashboardConcept()
  if (rated && dashboardConcept === 'd') return <AfterRatingsD />
  if (rated && ['c', 'e'].includes(dashboardConcept)) return <AfterRatingsPlaceholder concept={dashboardConcept} />
  // Order (2026-10-20): B is always the production empty state, right after A; the proposals follow.
  if (dashboardConcept === 'b') return <ProductionEmptyDashboard />
  if (dashboardConcept === 'c') return <ProductionEmptyDashboard invite />
  if (dashboardConcept === 'd') return <ShowcaseDashboard />
  if (dashboardConcept === 'e') return <EditorialDashboard />

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
        <StrategiesCard />
      </motion.div>

    </div>
  )
}
