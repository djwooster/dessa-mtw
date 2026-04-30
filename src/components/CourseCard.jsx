import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, ChevronRight, BookOpen, GraduationCap } from 'lucide-react'
import { Card } from './ui/card'

const stagger = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.06 },
})

export function CourseCard({ course, isEnrolled, completedLessons, onEnroll, onContinue, onUnenroll, index }) {
  const pct = isEnrolled ? Math.round((completedLessons / course.lessons) * 100) : 0
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <motion.div {...stagger(index)} className="h-full">
        <Card className="h-full flex flex-col overflow-hidden">
          {/* Course image */}
          <div className="w-full shrink-0 overflow-hidden">
            <img src={course.image} alt={course.grade} className="w-full h-44 object-cover" />
          </div>

          <div className="flex flex-col flex-1 px-5 pt-4 pb-5">
            {/* Title + enrolled badge */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <h3 className="text-[20px] font-bold text-brand-text leading-snug">{course.grade}</h3>
              {isEnrolled && (
                <span
                  className="text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 mt-0.5"
                  style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}
                >
                  Enrolled
                </span>
              )}
            </div>

            {/* Metadata */}
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center gap-2 text-sm text-brand-subtext">
                <BookOpen size={13} className="shrink-0" />
                <span>{course.lessons} Lessons</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-brand-subtext">
                <GraduationCap size={13} className="shrink-0" />
                <span>{course.competency}</span>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px bg-brand-border mb-4" />

            {/* Progress */}
            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm text-brand-subtext">Progress</span>
                {isEnrolled && (
                  <span className="text-sm font-semibold text-brand-text">{pct}%</span>
                )}
              </div>
              <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${pct}%`, background: course.color }}
                />
              </div>
            </div>

            {/* Last activity */}
            <p className="text-xs text-brand-subtext mb-4">
              {isEnrolled ? 'Last Activity: Apr 18 · 9:45 am' : 'Not yet enrolled'}
            </p>

            {/* Actions */}
            <div className={`flex mt-auto items-center ${isEnrolled ? 'justify-between' : 'justify-end'}`}>
              {isEnrolled && (
                <button
                  className="text-sm font-medium text-brand-subtext hover:text-brand-text transition-colors"
                  onClick={() => setConfirmOpen(true)}
                >
                  Unenroll
                </button>
              )}
              <button
                className="flex items-center gap-1.5 text-sm font-semibold px-3.5 py-1.5 rounded-md transition-all hover:brightness-95 text-white"
                style={{ background: '#2A7F8F' }}
                onClick={() => (isEnrolled ? onContinue() : onEnroll(course))}
              >
                {isEnrolled ? (
                  <><Play size={11} fill="currentColor" /> Continue</>
                ) : (
                  <>Enroll <ChevronRight size={12} /></>
                )}
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Unenroll confirmation modal */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-brand-text/40 backdrop-blur-sm"
            onClick={() => setConfirmOpen(false)}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.15 }}
            className="relative bg-white rounded-2xl border border-brand-border shadow-xl p-6 w-full max-w-sm mx-4 z-10"
          >
            <p className="text-base font-semibold text-brand-text mb-1">
              Unenroll from {course.title}?
            </p>
            <p className="text-sm text-brand-subtext mb-5 leading-relaxed">
              Your progress will be lost and you'll need to re-enroll to continue.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-md text-sm font-semibold border border-brand-border text-brand-subtext bg-white hover:bg-brand-bg transition-colors"
                onClick={() => setConfirmOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-md text-sm font-semibold text-white transition-all hover:brightness-90"
                style={{ background: '#C0392B' }}
                onClick={() => { onUnenroll(); setConfirmOpen(false) }}
              >
                Unenroll
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
