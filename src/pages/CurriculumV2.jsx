import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bookmark, MoreHorizontal } from 'lucide-react'
import { CourseCard } from '../components/CourseCard'
import { courses } from '../lib/courseData'

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
