import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, Calendar, ChevronDown } from 'lucide-react'

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

export default function Dashboard() {
  const navigate = useNavigate()

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
