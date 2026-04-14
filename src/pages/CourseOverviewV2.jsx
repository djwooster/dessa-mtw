import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { ChevronLeft, ChevronRight, ChevronDown, CheckCircle2, Circle } from 'lucide-react'
import { units, totalLessons, getFlatIndex } from '../lib/mtwData'

export default function CourseOverviewV2({ enrolledCourse }) {
  const navigate = useNavigate()
  const location = useLocation()
  const course = location.state?.course

  const [expandedUnit, setExpandedUnit] = useState(null)

  const completedCount = enrolledCourse?.id === course?.id ? enrolledCourse.completed : 0
  const overallPct = Math.round((completedCount / totalLessons) * 100)

  const getNextLesson = () => {
    let idx = 0
    for (const unit of units) {
      for (let i = 0; i < unit.sub.length; i++) {
        if (idx === completedCount) return { unitId: unit.id, lessonIndex: i }
        idx++
      }
    }
    const last = units[units.length - 1]
    return { unitId: last.id, lessonIndex: last.sub.length - 1 }
  }

  const isLessonCompleted = (unitId, lessonIndex) =>
    getFlatIndex(unitId, lessonIndex) < completedCount

  const unitDoneCount = (unit) =>
    unit.sub.filter((_, i) => isLessonCompleted(unit.id, i)).length

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">

      {/* Back */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <button
          onClick={() => navigate('/mtw2')}
          className="flex items-center gap-1.5 text-sm font-medium text-brand-subtext hover:text-brand-text transition-colors mb-6"
        >
          <ChevronLeft size={14} />
          Back to Courses
        </button>
      </motion.div>

      {/* Course header card */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.04 }}
        className="bg-white rounded-2xl border border-brand-border px-6 py-5 mb-5"
      >
        <div className="flex items-start justify-between gap-6">
          <div className="flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: course ? `${course.color}14` : '#f0f2f5' }}
            >
              {course?.emoji}
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-0.5">
                Move This World
              </p>
              <h1 className="text-xl font-semibold text-brand-text">
                {course?.grade} — {course?.title}
              </h1>
              <span
                className="inline-block mt-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full"
                style={{ background: `${course?.color}12`, color: course?.color }}
              >
                {course?.competency}
              </span>
            </div>
          </div>

          {completedCount > 0 && (
            <div className="text-right flex-shrink-0">
              <p className="text-2xl font-bold text-brand-text">{overallPct}%</p>
              <p className="text-xs text-brand-subtext mt-0.5">
                {completedCount} of {totalLessons} lessons
              </p>
              <button
                onClick={() => {
                  const next = getNextLesson()
                  navigate('/mtw2/lesson', { state: { course, ...next } })
                }}
                className="mt-3 flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-md text-white transition-all hover:brightness-95 ml-auto"
                style={{ background: '#2A7F8F' }}
              >
                Continue <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>

        {completedCount > 0 && (
          <div className="mt-4">
            <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${overallPct}%`, background: course?.color }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Summary */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.25, delay: 0.08 }}
        className="text-sm text-brand-subtext mb-3 px-1"
      >
        {units.length} units · {totalLessons} lessons
      </motion.p>

      {/* Accordion table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.12 }}
        className="bg-white rounded-xl border border-brand-border overflow-hidden"
      >
        {/* Column header */}
        <div className="px-6 py-3 bg-brand-bg border-b border-brand-border">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">
            Lesson Name
          </span>
        </div>

        {units.map((unit, unitIdx) => {
          const isExpanded = expandedUnit === unit.id
          const doneCount = unitDoneCount(unit)
          const allDone = doneCount === unit.sub.length

          return (
            <div key={unit.id} className={unitIdx < units.length - 1 ? 'border-b border-brand-border' : ''}>

              {/* Unit row */}
              <button
                onClick={() => setExpandedUnit(isExpanded ? null : unit.id)}
                className="w-full px-6 py-4 flex items-center gap-3 text-left hover:bg-brand-bg transition-colors"
              >
                {allDone && doneCount > 0 ? (
                  <CheckCircle2 size={15} className="flex-shrink-0" style={{ color: '#5B9E4D' }} />
                ) : (
                  <div className="w-[15px] flex-shrink-0" />
                )}
                <span className="flex-1 text-sm font-semibold text-brand-text">{unit.title}</span>
                <span className="text-xs text-brand-subtext mr-2">
                  {doneCount > 0
                    ? `${doneCount} / ${unit.sub.length}`
                    : `${unit.sub.length} lessons`}
                </span>
                <ChevronDown
                  size={14}
                  className={`flex-shrink-0 text-brand-subtext transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>

              {/* Lesson rows */}
              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {unit.sub.map((lesson, i) => {
                      const done = isLessonCompleted(unit.id, i)
                      return (
                        <button
                          key={i}
                          onClick={() =>
                            navigate('/mtw2/lesson', {
                              state: { course, unitId: unit.id, lessonIndex: i },
                            })
                          }
                          className="w-full flex items-center gap-3 px-6 py-3 text-left hover:bg-brand-bg transition-colors border-t border-brand-border"
                          style={{ paddingLeft: '3.5rem' }}
                        >
                          {done ? (
                            <CheckCircle2 size={15} className="flex-shrink-0" style={{ color: '#5B9E4D' }} />
                          ) : (
                            <Circle size={15} className="flex-shrink-0 text-brand-border" />
                          )}
                          <span className={`flex-1 text-sm ${done ? 'text-brand-subtext' : 'text-brand-text'}`}>
                            {lesson}
                          </span>
                          {done && (
                            <span className="text-xs font-medium" style={{ color: '#5B9E4D' }}>
                              Completed
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>

            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
