import { motion } from 'framer-motion'
import { Users, Clock, CheckCircle2 } from 'lucide-react'

const stagger = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.07 },
})

const gradeData = [
  { grade: 'K', total: 1240, strength: 580, typical: 440, need: 220 },
  { grade: '1', total: 1320, strength: 610, typical: 480, need: 230 },
  { grade: '2', total: 1180, strength: 540, typical: 420, need: 220 },
  { grade: '3', total: 1290, strength: 600, typical: 450, need: 240 },
  { grade: '4', total: 1350, strength: 650, typical: 460, need: 240 },
  { grade: '5', total: 1310, strength: 620, typical: 450, need: 240 },
  { grade: '6', total: 1205, strength: 550, typical: 430, need: 225 },
]

const timelineSteps = [
  { id: 'pre', label: 'Pre', date: 'Aug 26', done: true },
  { id: 'mid', label: 'Mid', date: 'Jan 27', done: false, current: true },
  { id: 'post', label: 'Post', date: 'May 27', done: false },
]

function StatCard({ icon: Icon, label, value, sub, color, index }) {
  return (
    <motion.div {...stagger(index)} className="bg-white rounded-2xl border border-brand-border p-5 shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">{label}</p>
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `${color}18` }}
        >
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <p className="text-3xl font-semibold text-brand-text mb-0.5">{value}</p>
      <p className="text-sm text-brand-subtext">{sub}</p>
    </motion.div>
  )
}

function GradeBar({ row, maxTotal, index }) {
  const pctStrength = row.strength / row.total
  const pctTypical = row.typical / row.total
  const pctNeed = row.need / row.total
  const barWidth = (row.total / maxTotal) * 100

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05 }}
      className="flex items-center gap-3"
    >
      <span className="text-xs font-semibold text-brand-subtext w-5 text-right flex-shrink-0">
        {row.grade}
      </span>
      <div className="flex-1 flex h-7 rounded-md overflow-hidden gap-px bg-brand-border">
        <div
          className="h-full rounded-l-md"
          style={{ width: `${pctStrength * 100}%`, background: '#5DB87A' }}
          title={`Strength: ${row.strength}`}
        />
        <div
          className="h-full"
          style={{ width: `${pctTypical * 100}%`, background: '#A8C8E8' }}
          title={`Typical: ${row.typical}`}
        />
        <div
          className="h-full rounded-r-md"
          style={{ width: `${pctNeed * 100}%`, background: '#F08080' }}
          title={`Need: ${row.need}`}
        />
      </div>
      <span className="text-xs text-brand-subtext w-16 text-right flex-shrink-0">
        {row.total.toLocaleString()}
      </span>
    </motion.div>
  )
}

export default function Ratings() {
  const maxTotal = Math.max(...gradeData.map((r) => r.total))

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      {/* Header */}
      <motion.div {...stagger(0)} className="flex items-end justify-between mb-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-1">DESSA · 25-26 Mid</p>
          <h1 className="text-2xl font-semibold text-brand-text">Ratings</h1>
        </div>
        <button
          className="px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-all hover:brightness-105"
          style={{ background: '#2A7F8F' }}
        >
          Rate Students
        </button>
      </motion.div>

      {/* Stat cards */}
      <div className="grid grid-cols-3 gap-4 mb-7">
        <StatCard
          index={1}
          icon={Users}
          label="Students Rated"
          value="9,892"
          sub="of 9,895 enrolled"
          color="#2A7F8F"
        />
        <StatCard
          index={2}
          icon={CheckCircle2}
          label="Rating Window Progress"
          value="99.97%"
          sub={
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-full max-w-[120px] rounded-full overflow-hidden bg-brand-border">
                <span
                  className="block h-full rounded-full"
                  style={{ width: '99.97%', background: '#5DB87A' }}
                />
              </span>
              complete
            </span>
          }
          color="#5DB87A"
        />
        <StatCard
          index={3}
          icon={Clock}
          label="Days Remaining"
          value="47"
          sub="Window closes June 6, 2026"
          color="#F5A623"
        />
      </div>

      {/* Timeline */}
      <motion.div {...stagger(4)} className="bg-white rounded-2xl border border-brand-border shadow-sm p-6 mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-5">Assessment Timeline</p>
        <div className="relative flex items-center justify-between">
          {/* Track */}
          <div
            className="absolute left-0 right-0 top-1/2 h-0.5 -translate-y-1/2"
            style={{ background: '#E2E6EA' }}
          />
          {/* Filled track to current */}
          <div
            className="absolute left-0 top-1/2 h-0.5 -translate-y-1/2"
            style={{ width: '50%', background: '#2A7F8F' }}
          />

          {timelineSteps.map((step) => (
            <div key={step.id} className="relative flex flex-col items-center z-10">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 text-xs font-bold ${
                  step.current
                    ? 'bg-dessa-teal border-dessa-teal text-white shadow-md'
                    : step.done
                    ? 'bg-dessa-teal border-dessa-teal text-white'
                    : 'bg-white border-brand-border text-brand-subtext'
                }`}
              >
                {step.done && !step.current ? '✓' : step.label}
              </div>
              <span className="mt-2 text-sm text-brand-subtext">{step.date}</span>
              {step.current && (
                <span
                  className="mt-1 text-xs font-semibold px-2 py-0.5 rounded-full"
                  style={{ background: '#E8F4F6', color: '#2A7F8F' }}
                >
                  Current
                </span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Grade comparison chart */}
      <motion.div {...stagger(5)} className="bg-white rounded-2xl border border-brand-border shadow-sm p-6">
        <div className="flex items-center justify-between mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">Grade Level Comparison</p>
          <div className="flex items-center gap-4">
            {[
              { label: 'Strength', color: '#5DB87A' },
              { label: 'Typical', color: '#A8C8E8' },
              { label: 'Need', color: '#F08080' },
            ].map((l) => (
              <div key={l.label} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm" style={{ background: l.color }} />
                <span className="text-xs text-brand-subtext">{l.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-2.5">
          {gradeData.map((row, i) => (
            <GradeBar key={row.grade} row={row} maxTotal={maxTotal} index={i} />
          ))}
        </div>

        <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between text-sm text-brand-subtext">
          <span>Showing all grades — 25-26 Mid Assessment Window</span>
          <button className="text-dessa-teal font-medium hover:text-dessa-navy transition-colors">
            Export Data
          </button>
        </div>
      </motion.div>
    </div>
  )
}
