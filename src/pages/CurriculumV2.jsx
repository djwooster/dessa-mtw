import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, ChevronRight, MoreHorizontal, Bookmark } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../components/ui/card'

const stagger = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.06 },
})

const courses = [
  {
    id: 1,
    grade: 'Grade 3',
    level: 'Early Elementary',
    title: 'Understanding Our Emotions',
    competency: 'Self-Awareness',
    emoji: '🌱',
    color: '#2D7D78',
    lessons: 36,
  },
  {
    id: 2,
    grade: 'Grade 4',
    level: 'Late Elementary',
    title: 'Self-Management in Action',
    competency: 'Self-Management',
    emoji: '🦋',
    color: '#F5A623',
    lessons: 36,
  },
  {
    id: 3,
    grade: 'Grade 5',
    level: 'Late Elementary',
    title: 'Building Responsible Decisions',
    competency: 'Responsible Decision-Making',
    emoji: '🌟',
    color: '#E8653A',
    lessons: 36,
  },
  {
    id: 4,
    grade: 'Grade 6',
    level: 'Middle School',
    title: 'Social Awareness & Empathy',
    competency: 'Social Awareness',
    emoji: '🤝',
    color: '#7B5EA7',
    lessons: 36,
  },
  {
    id: 5,
    grade: 'Grade 7',
    level: 'Middle School',
    title: 'Relationship Skills',
    competency: 'Relationship Skills',
    emoji: '💬',
    color: '#5B9E4D',
    lessons: 36,
  },
  {
    id: 6,
    grade: 'Grade 8',
    level: 'Middle School',
    title: 'Goal-Directed Behavior',
    competency: 'Goal-Directed Behavior',
    emoji: '🎯',
    color: '#2A7F8F',
    lessons: 36,
  },
]

// ─── Course card ──────────────────────────────────────────────────────────────

function CourseCard({ course, isEnrolled, completedLessons, onEnroll, onContinue, onUnenroll, index }) {
  const pct = isEnrolled ? Math.round((completedLessons / course.lessons) * 100) : 0
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
      <motion.div {...stagger(index)} className="h-full">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ background: `${course.color}14` }}
              >
                {course.emoji}
              </div>
              {isEnrolled && (
                <span
                  className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                  style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}
                >
                  Enrolled
                </span>
              )}
            </div>
            <CardTitle className="text-2xl font-bold">{course.grade}</CardTitle>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col justify-end pt-4">
            <div className="space-y-1.5 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-brand-subtext">
                  {isEnrolled ? `${completedLessons} of ${course.lessons} lessons` : 'Not enrolled'}
                </span>
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
          </CardContent>

          <CardFooter className={`border-t border-brand-border px-4 py-4 ${isEnrolled ? 'justify-between' : 'justify-end'}`}>
            {isEnrolled && (
              <button
                className="text-sm font-medium text-brand-subtext px-3.5 py-1.5 rounded-md hover:bg-brand-bg hover:text-brand-text transition-colors"
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
          </CardFooter>
        </Card>
      </motion.div>

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

// ─── CurriculumV2 ─────────────────────────────────────────────────────────────

export default function CurriculumV2({
  enrolledCourse,
  hideUnenrolled,
  bookmarkedLessons = [],
  onEnroll,
  onUnenroll,
  onToggleHideUnenrolled,
}) {
  const navigate = useNavigate()

  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  const [bookmarksOpen, setBookmarksOpen] = useState(false)
  const bookmarksRef = useRef(null)

  // Close ⋯ menu on outside click
  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Close bookmarks dropdown on outside click
  useEffect(() => {
    if (!bookmarksOpen) return
    const handler = (e) => {
      if (bookmarksRef.current && !bookmarksRef.current.contains(e.target)) setBookmarksOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [bookmarksOpen])

  const handleEnroll = (course) => {
    onEnroll(course)
    navigate('/mtw2/course', { state: { course } })
  }

  const visibleCourses = hideUnenrolled
    ? courses.filter((c) => enrolledCourse?.id === c.id)
    : courses

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">

      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className=""
      >
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-1">
              Move This World
            </p>
            <h1 className="text-2xl font-semibold text-brand-text">Curriculum</h1>
          </div>

          <div className="flex items-center gap-2">

          {/* Bookmarks button */}
          <div className="relative" ref={bookmarksRef}>
            <button
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium border border-brand-border bg-white hover:shadow-sm transition-all text-brand-text"
              onClick={() => { setBookmarksOpen((o) => !o); setMenuOpen(false) }}
            >
              <Bookmark size={14} />
              Bookmarks
              {bookmarkedLessons.length > 0 && (
                <span
                  className="text-white text-xs font-bold leading-none px-1.5 py-0.5 rounded-full"
                  style={{ background: '#F5A623' }}
                >
                  {bookmarkedLessons.length}
                </span>
              )}
            </button>

            {bookmarksOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-xl border border-brand-border shadow-lg z-10 w-72">
                {bookmarkedLessons.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Bookmark size={20} className="text-brand-border mx-auto mb-2" />
                    <p className="text-sm text-brand-subtext">No bookmarked lessons yet.</p>
                  </div>
                ) : (
                  <div className="py-1">
                    {bookmarkedLessons.map((bm, i) => (
                      <button
                        key={i}
                        className="w-full text-left px-4 py-3 hover:bg-brand-bg transition-colors"
                        onClick={() => {
                          navigate('/mtw2/course', { state: { course: bm.course } })
                          setBookmarksOpen(false)
                        }}
                      >
                        <p className="text-sm font-semibold text-brand-text">{bm.lesson}</p>
                        <p className="text-xs text-brand-subtext mt-0.5">
                          {bm.unit} · {bm.grade}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ⋯ options menu */}
          <div className="relative" ref={menuRef}>
            <button
              className="w-9 h-9 rounded-md flex items-center justify-center text-brand-subtext border border-brand-border bg-white hover:shadow-sm transition-all"
              onClick={() => { setMenuOpen((o) => !o); setBookmarksOpen(false) }}
              aria-label="Course options"
            >
              <MoreHorizontal size={17} />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] bg-white rounded-xl border border-brand-border shadow-lg py-1 z-10 w-56">
                <button
                  className="w-full text-left px-4 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors flex items-center gap-2"
                  onClick={() => { onToggleHideUnenrolled(); setMenuOpen(false) }}
                >
                  {hideUnenrolled ? (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0" style={{ borderColor: '#F5A623', background: '#F5A623' }} />
                      Show all courses
                    </>
                  ) : (
                    <>
                      <span className="w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 border-brand-border" />
                      Hide unenrolled courses
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

        </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        {visibleCourses.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-brand-subtext text-sm">No enrolled course in this view.</p>
            <button
              className="mt-3 text-sm font-semibold hover:text-dessa-navy transition-colors"
              style={{ color: '#F5A623' }}
              onClick={onToggleHideUnenrolled}
            >
              Show all courses
            </button>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleCourses.map((course, i) => (
              <CourseCard
                key={course.id}
                course={course}
                index={i}
                isEnrolled={enrolledCourse?.id === course.id}
                completedLessons={enrolledCourse?.id === course.id ? enrolledCourse.completed : 0}
                onEnroll={handleEnroll}
                onContinue={() => navigate('/mtw2/course', { state: { course: enrolledCourse } })}
                onUnenroll={onUnenroll}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
