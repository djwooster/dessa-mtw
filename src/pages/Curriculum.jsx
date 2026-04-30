import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Bookmark, Flame } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'
import { CourseCard } from '../components/CourseCard'
import { courses } from '../lib/courseData'

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
        <Flame size={16} style={{ color: '#F5A623' }} />
        <div>
          <p className="font-semibold text-brand-text" style={{ fontSize: 15 }}>4-week streak</p>
          <p className="text-xs text-brand-subtext mt-0.5">3×/week goal · Best: 6 weeks</p>
        </div>
      </div>
    </div>
  )
}

const filters = [
  { value: 'all',              label: 'All' },
  { value: 'Early Elementary', label: 'Early Elementary' },
  { value: 'Late Elementary',  label: 'Late Elementary' },
  { value: 'Middle School',    label: 'Middle School' },
  { value: 'High School',      label: 'High School' },
]

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
                    <Flame size={14} style={{ color: '#F5A623' }} /> 4
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    align="end"
                    sideOffset={8}
                    className="z-50 bg-white rounded-2xl border border-brand-border shadow-xl outline-none"
                  >
                    <StreakCalendarContent />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>


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
