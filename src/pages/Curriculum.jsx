import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, ChevronRight, ChevronLeft, MoreHorizontal, Bookmark, Flame } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'

// ─── Streak calendar data ─────────────────────────────────────────────────────

const streakData = {
  '2026-3': new Set([1, 2, 3, 7, 8, 9, 10, 13, 14, 15, 16, 17, 20, 21, 22]),
  '2026-2': new Set([3, 4, 5, 6, 10, 11, 12, 13, 17, 18, 19, 24, 25, 26, 27]),
  '2026-1': new Set([6, 7, 8, 9, 12, 13, 14, 15, 16, 20, 22, 23, 27, 28, 29]),
  '2026-0': new Set([5, 6, 7, 8, 9, 13, 14, 15, 21, 22, 23, 26, 27, 28, 29, 30]),
  '2025-11': new Set([1, 2, 3, 4, 8, 9, 10, 11, 15, 16, 17, 18]),
  '2025-10': new Set([3, 4, 5, 6, 10, 11, 12, 13, 17, 18, 19, 20, 24, 25]),
  '2025-9':  new Set([1, 2, 3, 6, 7, 8, 9, 10, 13, 14, 15, 16, 20, 21, 22, 23, 24, 27, 28, 29, 30]),
  '2025-8':  new Set([3, 4, 5, 8, 9, 10, 11, 12, 15, 16, 17, 18, 19, 22, 23, 24, 25, 26, 29, 30]),
}

const MONTH_NAMES = ['January','February','March','April','May','June',
                     'July','August','September','October','November','December']
const DAY_HEADERS = ['Su','Mo','Tu','We','Th','Fr','Sa']

function StreakCalendarContent() {
  const [year, setYear]   = useState(2026)
  const [month, setMonth] = useState(3)

  const completed      = streakData[`${year}-${month}`] || new Set()
  const startOffset    = new Date(year, month, 1).getDay()
  const daysInMonth    = new Date(year, month + 1, 0).getDate()
  const isToday        = (d) => year === 2026 && month === 3 && d === 22
  const canGoPrev      = !(year === 2025 && month === 8)
  const canGoNext      = !(year === 2026 && month === 3)

  const goPrev = () => month === 0  ? (setYear(y => y - 1), setMonth(11)) : setMonth(m => m - 1)
  const goNext = () => month === 11 ? (setYear(y => y + 1), setMonth(0))  : setMonth(m => m + 1)

  const cells = [...Array(startOffset).fill(null),
                 ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  return (
    <div className="w-80 p-5">
      {/* Month header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs text-brand-subtext mb-0.5">{year}</p>
          <h2 className="text-xl font-bold text-brand-text">{MONTH_NAMES[month]}</h2>
        </div>
        <div className="flex gap-1 mt-1">
          <button
            onClick={goPrev} disabled={!canGoPrev}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-bg hover:bg-brand-border disabled:opacity-30 transition-colors"
          >
            <ChevronLeft size={14} className="text-brand-text" />
          </button>
          <button
            onClick={goNext} disabled={!canGoNext}
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-brand-bg hover:bg-brand-border disabled:opacity-30 transition-colors"
          >
            <ChevronRight size={14} className="text-brand-text" />
          </button>
        </div>
      </div>

      {/* Day-of-week headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_HEADERS.map((d, i) => (
          <div key={d} className={`text-center text-[10px] font-semibold uppercase text-brand-subtext py-1${i === 0 || i === 6 ? ' opacity-40' : ''}`}>
            {d}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-y-0.5">
        {cells.map((day, i) => {
          const col = i % 7
          const isWeekend = col === 0 || col === 6
          return (
          <div key={i} className={`flex justify-center items-center aspect-square${isWeekend ? ' opacity-40' : ''}`}>
            {day === null ? null : completed.has(day) && !isWeekend ? (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={isToday(day)
                  ? { background: 'rgba(245,166,35,0.2)', border: '1.5px solid #F5A623' }
                  : { border: '1.5px dashed rgba(245,166,35,0.45)', background: 'rgba(245,166,35,0.06)' }}
              >
                <Flame size={14} style={{ color: '#F5A623' }} />
              </div>
            ) : (
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs"
                style={isToday(day) ? { background: 'rgba(107,122,141,0.18)', fontWeight: 600 } : {}}
              >
                <span className="text-brand-subtext">{day}</span>
              </div>
            )}
          </div>
        )})}
      </div>

      {/* Footer */}
      <div className="border-t border-brand-border mt-4 pt-3 flex items-center gap-2">
        <Flame size={13} style={{ color: '#F5A623' }} />
        <p className="text-xs text-brand-subtext">
          You are on a <span className="font-semibold text-brand-text">12-day streak</span> · Best: 18 days
        </p>
      </div>
    </div>
  )
}

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

function CourseCard({ course, isEnrolled, completedLessons, onEnroll, onContinue, onUnenroll, index }) {
  const pct = isEnrolled ? Math.round((completedLessons / course.lessons) * 100) : 0
  const [confirmOpen, setConfirmOpen] = useState(false)

  return (
    <>
    <motion.div {...stagger(index)} className="h-full">
      <Card className="h-full flex flex-col">
        <CardHeader>
          {/* Emoji + Active badge row */}
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

// ─── Curriculum ───────────────────────────────────────────────────────────────

export default function Curriculum({
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

              {/* Streak button */}
              <Popover.Root>
                <Popover.Trigger asChild>
                  <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-md text-sm font-medium border border-brand-border bg-white hover:shadow-sm transition-all text-brand-text">
                    <Flame size={14} style={{ color: '#F5A623' }} /> Streak
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    align="center"
                    sideOffset={8}
                    className="z-50 bg-white rounded-2xl border border-brand-border shadow-xl outline-none"
                  >
                    <StreakCalendarContent />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>

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
                        onUnenroll={onUnenroll}
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
