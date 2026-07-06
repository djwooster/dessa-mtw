import { motion } from 'framer-motion'
import { ChevronRight, BookOpen } from 'lucide-react'
import { Card } from './ui/card'

function cardImage(grade) {
  if (grade === 'Kindergarten') return '/card-images/kind.png';
  const match = grade?.match(/^Grade (\d+)$/);
  if (match) return `/card-images/gr-${match[1]}.png`;
  return null;
}

const stagger = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.06 },
})

export function CourseCard({ course, onGoToCourse, index }) {
  return (
    <motion.div {...stagger(index)} className="h-full">
      <Card className="h-full flex flex-col overflow-hidden">
        {/* Course banner */}
        {cardImage(course.grade) ? (
          <img
            src={cardImage(course.grade)}
            alt={course.grade}
            className="w-full h-44 shrink-0 object-cover"
          />
        ) : (
          <div
            className="w-full h-44 shrink-0 flex flex-col items-center justify-center gap-1"
            style={{ background: course.color }}
          >
            <span className="text-white font-black text-5xl leading-none tracking-tight">{course.grade}</span>
            <span className="text-white/60 text-sm font-medium">{course.level}</span>
          </div>
        )}

        <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
          {/* Title */}
          <h3 className="text-[20px] font-bold text-brand-text leading-snug mb-3">{course.grade}</h3>

          {/* Metadata */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center gap-2 text-sm text-brand-subtext">
              <BookOpen size={13} className="shrink-0" />
              <span>{course.lessons} Lessons</span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-brand-border mb-4" />

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-brand-subtext">Progress</span>
              <span className="text-xs text-brand-subtext">Not started</span>
            </div>
            <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: '0%', background: course.color }}
              />
            </div>
          </div>

          {/* Action */}
          <div className="flex mt-auto items-center justify-end">
            <button
              className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-md transition-all hover:brightness-95 text-white"
              style={{ background: '#2A7F8F' }}
              onClick={() => onGoToCourse(course)}
            >
              Go to Course <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </Card>
    </motion.div>
  )
}
