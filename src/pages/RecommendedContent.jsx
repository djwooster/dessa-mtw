import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight } from 'lucide-react'
import { topRecommendations } from '../lib/recommendations'

const stagger = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.07 },
})

export default function RecommendedContent() {
  const navigate = useNavigate()
  const recommendations = topRecommendations(3)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-2xl font-semibold text-brand-text mb-1">Recommended Content</h1>
      <p className="text-sm text-brand-subtext mb-6 max-w-[640px]">
        Based on your class's most recent DESSA ratings, these MTW courses target the
        competencies where the most students rated Need.
      </p>

      <div className="flex flex-col gap-4">
        {recommendations.map((rec, i) => {
          const needPct = Math.round((rec.need / rec.total) * 100)
          return (
            <motion.div
              key={rec.abbr}
              {...stagger(i)}
              className="flex rounded-xl border border-dessa-teal/30 bg-white overflow-hidden shadow-sm"
            >
              <div className="w-40 flex-shrink-0 flex flex-col items-center justify-center px-4 py-5 text-center bg-dessa-tealLight">
                <p className="text-xs font-semibold text-dessa-teal uppercase tracking-wide mb-1">
                  {rec.label}
                </p>
                <p className="text-2xl font-bold text-dessa-salmon leading-none">{needPct}%</p>
                <p className="text-[11px] text-brand-subtext mt-1">
                  {rec.need} of {rec.total} rated Need
                </p>
              </div>

              <div className="flex-1 px-5 py-4 flex items-center justify-between gap-4 min-w-0">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-mtw-amber uppercase tracking-wide mb-1">
                    MTW &middot; {rec.course.grade}
                  </p>
                  <p className="text-base font-semibold text-brand-text mb-0.5 truncate">
                    {rec.course.title}
                  </p>
                  <p className="text-sm text-brand-subtext">{rec.course.lessons} lessons</p>
                </div>
                <button
                  onClick={() => navigate('/mtw/lesson', { state: { course: rec.course } })}
                  className="flex items-center gap-1 text-sm font-semibold text-dessa-teal hover:text-dessa-navy transition-colors shrink-0"
                >
                  Go to course
                  <ChevronRight size={15} />
                </button>
              </div>
            </motion.div>
          )
        })}
      </div>

      {recommendations.length === 0 && (
        <p className="text-sm text-brand-subtext">
          No matching MTW content found for this class's current DESSA results.
        </p>
      )}
    </motion.div>
  )
}
