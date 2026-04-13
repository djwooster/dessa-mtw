import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, ArrowRight, ChevronRight } from 'lucide-react'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '../components/ui/table'

const stagger = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.06 },
})

// ─── Pie chart ────────────────────────────────────────────────────────────────

function polarToCart(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
}

function pieSlicePath(cx, cy, r, startDeg, endDeg) {
  const [x1, y1] = polarToCart(cx, cy, r, startDeg)
  const [x2, y2] = polarToCart(cx, cy, r, endDeg)
  const large = endDeg - startDeg > 180 ? 1 : 0
  return `M${cx},${cy} L${x1},${y1} A${r},${r},0,${large},1,${x2},${y2}Z`
}

const pieData = [
  { label: 'Unrated',  value: 14, color: '#CBD5E0' },
  { label: 'Typical',  value: 9,  color: '#A8C8E8' },
  { label: 'Strength', value: 5,  color: '#5DB87A' },
  { label: 'Need',     value: 2,  color: '#F08080' },
]

function PieChart() {
  const cx = 80, cy = 80, r = 68
  const total = pieData.reduce((s, d) => s + d.value, 0)
  let angle = 0

  return (
    <svg width="160" height="160" viewBox="0 0 160 160" className="flex-shrink-0">
      {pieData.map((seg) => {
        const start = angle
        const sweep = (seg.value / total) * 360
        angle += sweep
        return (
          <path
            key={seg.label}
            d={pieSlicePath(cx, cy, r, start, angle)}
            fill={seg.color}
            stroke="white"
            strokeWidth="2.5"
          />
        )
      })}
    </svg>
  )
}

// ─── Competency data ──────────────────────────────────────────────────────────

const competencies = [
  { abbr: 'SA',  label: 'Self-Awareness',         strength: 6,  typical: 20, need: 4 },
  { abbr: 'SM',  label: 'Self-Management',         strength: 5,  typical: 19, need: 6 },
  { abbr: 'SOC', label: 'Social Awareness',        strength: 7,  typical: 18, need: 5 },
  { abbr: 'RS',  label: 'Relationship Skills',     strength: 5,  typical: 22, need: 3 },
  { abbr: 'PR',  label: 'Personal Responsibility', strength: 8,  typical: 17, need: 5 },
  { abbr: 'RD',  label: 'Decision-Making',         strength: 4,  typical: 20, need: 6 },
  { abbr: 'OT',  label: 'Optimistic Thinking',     strength: 6,  typical: 18, need: 6 },
  { abbr: 'GD',  label: 'Goal-Directed Behavior',  strength: 5,  typical: 21, need: 4 },
]

function MiniBar({ strength, typical, need }) {
  const total = strength + typical + need
  return (
    <div className="flex h-1.5 w-24 rounded-full overflow-hidden gap-px bg-brand-border">
      <div style={{ width: `${(strength / total) * 100}%`, background: '#5DB87A' }} />
      <div style={{ width: `${(typical  / total) * 100}%`, background: '#A8C8E8' }} />
      <div style={{ width: `${(need     / total) * 100}%`, background: '#F08080' }} />
    </div>
  )
}

function Dot({ color }) {
  return (
    <span
      className="inline-block w-2 h-2 rounded-full mr-1.5 flex-shrink-0"
      style={{ background: color }}
    />
  )
}

function CompetencyTable() {
  return (
    <Table>
      <TableHeader>
        <TableRow className="border-brand-border">
          <TableHead className="pl-5">Competency</TableHead>
          <TableHead>
            <span className="flex items-center gap-1.5">
              <Dot color="#5DB87A" />Strength
            </span>
          </TableHead>
          <TableHead>
            <span className="flex items-center gap-1.5">
              <Dot color="#A8C8E8" />Typical
            </span>
          </TableHead>
          <TableHead>
            <span className="flex items-center gap-1.5">
              <Dot color="#F08080" />Need
            </span>
          </TableHead>
          <TableHead>Distribution</TableHead>
          <TableHead className="text-right pr-5">Total</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {competencies.map((row) => {
          const total = row.strength + row.typical + row.need
          const pctS = Math.round((row.strength / total) * 100)
          const pctN = Math.round((row.need     / total) * 100)
          return (
            <TableRow key={row.abbr}>
              <TableCell className="pl-5 font-medium">
                <span className="text-brand-text">{row.label}</span>
                <span className="ml-2 text-xs text-brand-subtext font-normal">{row.abbr}</span>
              </TableCell>
              <TableCell>
                <span className="font-medium text-dessa-green">{row.strength}</span>
                <span className="text-xs text-brand-subtext ml-1">({pctS}%)</span>
              </TableCell>
              <TableCell>
                <span className="font-medium text-brand-text">{row.typical}</span>
              </TableCell>
              <TableCell>
                <span className="font-medium text-dessa-salmon">{row.need}</span>
                <span className="text-xs text-brand-subtext ml-1">({pctN}%)</span>
              </TableCell>
              <TableCell>
                <MiniBar strength={row.strength} typical={row.typical} need={row.need} />
              </TableCell>
              <TableCell className="text-right pr-5 text-brand-subtext">{total}</TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ─── Strategy cards ───────────────────────────────────────────────────────────

const strategies = [
  {
    competency: 'Responsible Decision-Making',
    title: 'What\u2019s Important to Me?',
    duration: '15\u201320 min',
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

// ─── Weekly progress chart ────────────────────────────────────────────────────

const weeklyData = [
  { label: 'Wk 1',  lessons: 1 },
  { label: 'Wk 2',  lessons: 2 },
  { label: 'Wk 3',  lessons: 0 },
  { label: 'Wk 4',  lessons: 2 },
  { label: 'Wk 5',  lessons: 0 },
  { label: 'Wk 6',  lessons: 0 },
  { label: 'Wk 7',  lessons: 0 },
  { label: 'Wk 8',  lessons: 0 },
  { label: 'Wk 9',  lessons: 0 },
  { label: 'Wk 10', lessons: 0 },
]

function WeeklyProgressChart() {
  const maxLessons = 3
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-3">
        Lessons Completed — by Week
      </p>
      <div className="flex items-end gap-1.5" style={{ height: '56px' }}>
        {weeklyData.map((w) => (
          <div key={w.label} className="flex-1 flex flex-col items-center justify-end gap-1">
            <div
              className="w-full rounded-t-sm"
              style={{
                height: `${Math.max(3, (w.lessons / maxLessons) * 44)}px`,
                background: w.lessons > 0 ? '#F5A623' : '#E2E6EA',
              }}
            />
            <span className="text-brand-subtext leading-none" style={{ fontSize: '9px' }}>
              {w.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard({ enrolledCourse }) {
  const navigate = useNavigate()
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  })

  const offset = enrolledCourse ? 1 : 0
  const pct = enrolledCourse
    ? Math.round((enrolledCourse.completed / enrolledCourse.lessons) * 100)
    : 0

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-7">

      {/* ── Greeting row ── */}
      <motion.div {...stagger(0)} className="flex items-start justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-0.5">
            {today}
          </p>
          <h1 className="text-2xl font-semibold text-brand-text">Welcome back, Tara!</h1>
          <p className="text-sm text-brand-subtext mt-0.5">
            Assess your students and identify targeted strategies to develop their social and
            emotional competencies.
          </p>
        </div>
        <button
          className="flex-shrink-0 px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-all hover:brightness-105 mt-1"
          style={{ background: '#2A7F8F' }}
        >
          Manage Students
        </button>
      </motion.div>

      {/* ── MTW CTA ── */}
      <motion.div {...stagger(1)} className="mb-6">
        <div className="bg-dessa-navy rounded-2xl overflow-hidden shadow-md">
          <div className="flex items-center px-6 py-4 gap-5">

            {/* MTW image */}
            <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
              <img src="/logo-png.png" alt="Move This World" className="w-full h-full object-contain" />
            </div>

            {enrolledCourse ? (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-white/50 text-xs font-medium mb-0.5">
                    Continue Today's Lesson · {enrolledCourse.grade} · {enrolledCourse.competency}
                  </p>
                  <p className="text-white font-semibold text-base truncate">
                    {enrolledCourse.title}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: '#F5A623' }}
                      />
                    </div>
                    <span className="text-white/40 text-xs flex-shrink-0">
                      {enrolledCourse.completed}/{enrolledCourse.lessons} lessons
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/mtw/lesson', { state: { course: enrolledCourse } })}
                  className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-95 flex-shrink-0"
                  style={{ background: '#2A7F8F' }}
                >
                  <Play size={12} fill="currentColor" />
                  Continue Lesson
                </button>
              </>
            ) : (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-white/50 text-xs font-medium mb-0.5">
                    Move This World · Curriculum Ready
                  </p>
                  <p className="text-white font-semibold text-base">
                    Choose a course to get started with your students
                  </p>
                </div>
                <button
                  onClick={() => navigate('/mtw')}
                  className="flex items-center gap-2 px-5 py-2 rounded-md text-sm font-semibold text-white transition-all hover:brightness-105 active:scale-95 flex-shrink-0"
                  style={{ background: '#2A7F8F' }}
                >
                  Browse Courses
                  <ChevronRight size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </motion.div>

      {/* ── MTW Progress card ── (only when enrolled) */}
      {enrolledCourse && (
        <motion.div {...stagger(2)} className="mb-5">
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
            <div className="px-5 pt-5 pb-4 border-b border-brand-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-brand-text">MTW Progress</h3>
                <p className="text-sm text-brand-subtext mt-0.5">
                  {enrolledCourse.title} · {enrolledCourse.grade}
                </p>
              </div>
              <button
                onClick={() => navigate('/mtw')}
                className="text-sm font-semibold hover:text-dessa-navy transition-colors"
                style={{ color: '#F5A623' }}
              >
                View Course
              </button>
            </div>
            <div className="px-5 py-4 flex gap-8 items-start">
              {/* Overall progress */}
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-brand-subtext">Overall Progress</span>
                  <span className="text-sm font-bold" style={{ color: '#F5A623' }}>{pct}%</span>
                </div>
                <div className="h-2 bg-brand-border rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${pct}%`, background: '#F5A623' }}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-brand-subtext">
                    {enrolledCourse.completed} lessons completed
                  </span>
                  <span className="text-xs text-brand-subtext">
                    {enrolledCourse.lessons - enrolledCourse.completed} remaining
                  </span>
                </div>
              </div>

              <div className="w-px bg-brand-border self-stretch" />

              {/* Weekly chart */}
              <div className="flex-1">
                <WeeklyProgressChart />
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── Two-column: Ratings + Strategies ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5 mb-5">

        {/* Left: DESSA Ratings */}
        <motion.div {...stagger(2 + offset)} className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm h-full flex flex-col">
            <div className="px-5 pt-5 pb-4 border-b border-brand-border flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-brand-text">
                  My Student's DESSA Ratings
                </h3>
                <p className="text-sm text-brand-subtext mt-0.5">25-26 Mid</p>
              </div>
              <button className="text-sm font-semibold text-dessa-teal hover:text-dessa-navy transition-colors">
                View Details
              </button>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex items-center gap-5">
                <PieChart />
                <div className="space-y-2.5">
                  {pieData.map((seg) => (
                    <div key={seg.label} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                        style={{ background: seg.color }}
                      />
                      <span className="text-sm font-medium text-brand-text">{seg.value}</span>
                      <span className="text-sm text-brand-subtext">{seg.label}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-auto pt-4">
                <button
                  onClick={() => navigate('/ratings')}
                  className="w-full py-2.5 rounded-md text-sm font-semibold border border-dessa-teal text-dessa-teal hover:bg-dessa-tealLight transition-colors"
                >
                  Rate Students
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Classroom Strategies */}
        <motion.div {...stagger(3 + offset)} className="lg:col-span-3">
          <div className="bg-white rounded-2xl border border-brand-border shadow-sm h-full flex flex-col">
            <div className="px-5 pt-5 pb-4 border-b border-brand-border">
              <h3 className="text-base font-semibold text-brand-text">
                Try These Classroom Strategies
              </h3>
              <p className="text-sm text-brand-subtext mt-0.5">
                We've built a full library of proven strategies. Here are two samples to explore.
              </p>
            </div>
            <div className="p-5 flex-1 flex flex-col gap-3">
              {strategies.map((s) => (
                <motion.div
                  key={s.title}
                  whileHover={{ y: -1 }}
                  className="flex rounded-xl border overflow-hidden cursor-pointer hover:shadow-sm transition-shadow"
                  style={{ borderColor: `${s.color}40` }}
                >
                  <div
                    className="w-36 flex-shrink-0 flex flex-col items-center justify-center px-3 py-4 text-center"
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

              <p className="text-sm text-center text-brand-subtext px-2">
                Class-level strategy recommendations will appear once a Full DESSA has been
                completed.
              </p>

              <div className="mt-auto">
                <button className="w-full py-2.5 rounded-md text-sm font-semibold border border-dessa-teal text-dessa-teal hover:bg-dessa-tealLight transition-colors">
                  Browse the DESSA Strategy Library
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Competencies — data table ── */}
      <motion.div {...stagger(4 + offset)}>
        <div className="bg-white rounded-2xl border border-brand-border shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4 border-b border-brand-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h3 className="text-base font-semibold text-brand-text">Competencies</h3>
              <span className="text-sm text-brand-subtext">25-26 Mid</span>
            </div>
            <div className="flex items-center gap-4">
              {[
                { label: 'Strength', color: '#5DB87A' },
                { label: 'Typical',  color: '#A8C8E8' },
                { label: 'Need',     color: '#F08080' },
              ].map((l) => (
                <div key={l.label} className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
                  <span className="text-xs text-brand-subtext">{l.label}</span>
                </div>
              ))}
              <button className="text-sm font-semibold text-dessa-teal hover:text-dessa-navy transition-colors ml-2">
                View Details
              </button>
            </div>
          </div>

          <CompetencyTable />

          <div className="px-5 py-3.5 border-t border-brand-border">
            <p className="text-sm text-brand-subtext">
              Go deeper by completing a Full DESSA to uncover actionable insights and next steps.{' '}
              <button className="text-dessa-teal font-semibold hover:text-dessa-navy transition-colors">
                Learn more <ArrowRight size={11} className="inline -mt-0.5" />
              </button>
            </p>
          </div>
        </div>
      </motion.div>

    </div>
  )
}
