import { motion } from 'framer-motion'

// Same two sample strategies shown on the Dashboard's "Try These Classroom
// Strategies" widget — kept as a local copy here (rather than importing from
// Dashboard.jsx) since that file exports a page component, not shared data.
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

export default function RatingSummary() {
  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-semibold text-brand-text mb-1">Try These Classroom Strategies</h1>
      <p className="text-sm text-brand-subtext mb-6 max-w-[640px]">
        We've built a full library of proven strategies for your use. Here are two samples to explore.
      </p>

      <div className="flex flex-col gap-3 max-w-[880px]">
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
              <p className="text-xs font-semibold leading-snug" style={{ color: s.color }}>
                {s.competency}
              </p>
            </div>
            <div className="flex-1 px-4 py-4">
              <p className="text-sm text-brand-subtext mb-1.5">
                <span className="font-semibold text-brand-text">Title:</span> {s.title}
              </p>
              <p className="text-sm text-brand-subtext mb-1.5">
                <span className="font-semibold text-brand-text">Duration:</span> {s.duration}
              </p>
              <p className="text-sm text-brand-subtext leading-relaxed">
                <span className="font-semibold text-brand-text">Description:</span> {s.description}
              </p>
            </div>
          </motion.div>
        ))}

        <p className="text-sm text-center text-brand-subtext px-2">
          Class level strategy recommendations will appear once a Full DESSA has been completed.
        </p>

        <button className="w-full max-w-[880px] py-2.5 rounded-md text-sm font-semibold border border-dessa-teal text-dessa-teal hover:bg-dessa-tealLight transition-colors">
          Browse the DESSA Strategy Library
        </button>
      </div>
    </motion.div>
  )
}
