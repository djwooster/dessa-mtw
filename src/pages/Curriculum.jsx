import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, ChevronRight, MoreHorizontal, Bookmark } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'

const stagger = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.06 },
})

const filters = [
  { value: 'all',              label: 'All' },
  { value: 'Early Elementary', label: 'Early Elementary' },
  { value: 'Late Elementary',  label: 'Late Elementary' },
  { value: 'Middle School',    label: 'Middle School' },
  { value: 'High School',      label: 'High School' },
]

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

function CourseCard({ course, isEnrolled, completedLessons, onEnroll, onContinue, index }) {
  const pct = isEnrolled ? Math.round((completedLessons / course.lessons) * 100) : 0

  return (
    <motion.div {...stagger(index)} whileHover={{ y: -2 }} className="h-full">
      <Card className="h-full flex flex-col transition-shadow hover:shadow-md">
        <CardHeader>
          {/* Active badge — only rendered when enrolled */}
          {isEnrolled && (
            <div className="flex items-center justify-end mb-4">
              <span
                className="text-xs font-semibold px-2.5 py-0.5 rounded-full"
                style={{ background: 'rgba(245,166,35,0.15)', color: '#F5A623' }}
              >
                Active
              </span>
            </div>
          )}

          {/* Emoji */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3 flex-shrink-0"
            style={{ background: `${course.color}14` }}
          >
            {course.emoji}
          </div>

          <CardTitle>{course.grade}</CardTitle>
          <p className="text-sm text-brand-subtext mt-0.5">{course.title}</p>

          {/* Competency badge */}
          <div className="mt-2">
            <span
              className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: `${course.color}12`, color: course.color }}
            >
              {course.competency}
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-end pt-4">
          {/* Progress */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-subtext">
                {isEnrolled
                  ? `${completedLessons} of ${course.lessons} lessons`
                  : 'Not enrolled'}
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

        <CardFooter className="border-t border-brand-border pt-4 justify-between">
          <span className="text-sm text-brand-subtext">{course.lessons} lessons</span>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all hover:brightness-95 text-white"
            style={{ background: isEnrolled ? course.color : '#F5A623' }}
            onClick={() => (isEnrolled ? onContinue() : onEnroll(course))}
          >
            {isEnrolled ? (
              <>
                <Play size={11} fill="currentColor" /> Continue
              </>
            ) : (
              <>
                Enroll <ChevronRight size={12} />
              </>
            )}
          </button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

// ─── Curriculum ───────────────────────────────────────────────────────────────

export default function Curriculum({
  enrolledCourse,
  hideUnenrolled,
  bookmarkedLessons = [],
  onEnroll,
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
    navigate('/mtw/lesson', { state: { course } })
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
        className="mb-6"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-1">
          Move This World
        </p>
        <h1 className="text-2xl font-semibold text-brand-text">Curriculum</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        <Tabs defaultValue="all">

          {/* TabsList + toolbar in one row */}
          <div className="flex items-center justify-between">
            <TabsList>
              {filters.map((f) => (
                <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
              ))}
            </TabsList>

            <div className="flex items-center gap-2">

              {/* Bookmarks button */}
              <div className="relative" ref={bookmarksRef}>
                <button
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-medium border border-brand-border bg-white hover:shadow-sm transition-all text-brand-text"
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
                              navigate('/mtw/lesson', { state: { course: bm.course } })
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
                  className="w-9 h-9 rounded-full flex items-center justify-center text-brand-subtext border border-brand-border bg-white hover:shadow-sm transition-all"
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

          {filters.map((f) => {
            const filtered =
              f.value === 'all'
                ? visibleCourses
                : visibleCourses.filter((c) => c.level === f.value)

            return (
              <TabsContent key={f.value} value={f.value}>
                {filtered.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-brand-subtext text-sm">
                      {hideUnenrolled
                        ? 'No enrolled course in this view.'
                        : 'No courses in this category.'}
                    </p>
                    {hideUnenrolled && (
                      <button
                        className="mt-3 text-sm font-semibold hover:text-dessa-navy transition-colors"
                        style={{ color: '#F5A623' }}
                        onClick={onToggleHideUnenrolled}
                      >
                        Show all courses
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((course, i) => (
                      <CourseCard
                        key={course.id}
                        course={course}
                        isEnrolled={enrolledCourse?.id === course.id}
                        completedLessons={
                          enrolledCourse?.id === course.id ? enrolledCourse.completed : 0
                        }
                        onEnroll={handleEnroll}
                        onContinue={() => navigate('/mtw/lesson', { state: { course: enrolledCourse } })}
                        index={i}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )
          })}

        </Tabs>
      </motion.div>
    </div>
  )
}
