import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Curriculum from './pages/Curriculum'
import LessonView from './pages/LessonView'
import Ratings from './pages/Ratings'
import BrandGuide from './pages/BrandGuide'
import CurriculumV2 from './pages/CurriculumV2'
import CurriculumV3 from './pages/CurriculumV3'
import LessonViewV3 from './pages/LessonViewV3'
import CurriculumV4 from './pages/CurriculumV4'
import LessonViewV4 from './pages/LessonViewV4'
import CourseOverviewV2 from './pages/CourseOverviewV2'
import LessonViewV2 from './pages/LessonViewV2'

function Placeholder({ title }) {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-brand-text mb-2">{title}</h1>
      <p className="text-brand-subtext text-sm">Coming soon in a future prototype iteration.</p>
    </div>
  )
}

export default function App() {
  const [enrolledCourse, setEnrolledCourse] = useState(null)
  const [hideUnenrolled, setHideUnenrolled] = useState(false)
  const [bookmarkedLessons, setBookmarkedLessons] = useState([])

  const handleEnroll = (course) => {
    setEnrolledCourse({ ...course, completed: 5 })
  }

  const handleUnenroll = () => {
    setEnrolledCourse(null)
  }

  const handleToggleHideUnenrolled = () => {
    setHideUnenrolled((prev) => !prev)
  }

  const handleBookmark = (lessonData) => {
    setBookmarkedLessons((prev) => {
      const alreadyBookmarked = prev.some(
        (b) => b.lesson === lessonData.lesson && b.unit === lessonData.unit
      )
      return alreadyBookmarked ? prev : [...prev, lessonData]
    })
  }

  const curriculumProps = {
    enrolledCourse,
    hideUnenrolled,
    bookmarkedLessons,
    onEnroll: handleEnroll,
    onUnenroll: handleUnenroll,
    onToggleHideUnenrolled: handleToggleHideUnenrolled,
  }

  // ── MTW 2 state (independent from MTW) ────────────────────────────────────
  const [enrolledCourseV2, setEnrolledCourseV2] = useState(null)
  const [hideUnenrolledV2, setHideUnenrolledV2] = useState(false)
  const [bookmarkedLessonsV2, setBookmarkedLessonsV2] = useState([])

  const handleEnrollV2 = (course) => setEnrolledCourseV2({ ...course, completed: 5 })
  const handleUnenrollV2 = () => setEnrolledCourseV2(null)
  const handleToggleHideUnenrolledV2 = () => setHideUnenrolledV2((prev) => !prev)
  const handleBookmarkV2 = (lessonData) => {
    setBookmarkedLessonsV2((prev) => {
      const alreadyBookmarked = prev.some(
        (b) => b.lesson === lessonData.lesson && b.unit === lessonData.unit
      )
      return alreadyBookmarked ? prev : [...prev, lessonData]
    })
  }

  // ── MTW 3 state (independent) ─────────────────────────────────────────────
  const [enrolledCourseV3, setEnrolledCourseV3] = useState(null)
  const [hideUnenrolledV3, setHideUnenrolledV3] = useState(false)
  const [bookmarkedLessonsV3, setBookmarkedLessonsV3] = useState([])

  const handleEnrollV3 = (course) => setEnrolledCourseV3({ ...course, completed: 5 })
  const handleUnenrollV3 = () => setEnrolledCourseV3(null)
  const handleToggleHideUnenrolledV3 = () => setHideUnenrolledV3((prev) => !prev)
  const handleBookmarkV3 = (lessonData) => {
    setBookmarkedLessonsV3((prev) => {
      const alreadyBookmarked = prev.some(
        (b) => b.lesson === lessonData.lesson && b.unit === lessonData.unit
      )
      return alreadyBookmarked ? prev : [...prev, lessonData]
    })
  }

  // ── MTW 4 state (independent) ─────────────────────────────────────────────
  const [enrolledCourseV4, setEnrolledCourseV4] = useState(null)
  const [hideUnenrolledV4, setHideUnenrolledV4] = useState(false)
  const [bookmarkedLessonsV4, setBookmarkedLessonsV4] = useState([])

  const handleEnrollV4 = (course) => setEnrolledCourseV4({ ...course, completed: 5 })
  const handleUnenrollV4 = () => setEnrolledCourseV4(null)
  const handleToggleHideUnenrolledV4 = () => setHideUnenrolledV4((prev) => !prev)
  const handleBookmarkV4 = (lessonData) => {
    setBookmarkedLessonsV4((prev) => {
      const alreadyBookmarked = prev.some(
        (b) => b.lesson === lessonData.lesson && b.unit === lessonData.unit
      )
      return alreadyBookmarked ? prev : [...prev, lessonData]
    })
  }

  const curriculumPropsV3 = {
    enrolledCourse: enrolledCourseV3,
    hideUnenrolled: hideUnenrolledV3,
    bookmarkedLessons: bookmarkedLessonsV3,
    onEnroll: handleEnrollV3,
    onUnenroll: handleUnenrollV3,
    onToggleHideUnenrolled: handleToggleHideUnenrolledV3,
  }

  const curriculumPropsV2 = {
    enrolledCourse: enrolledCourseV2,
    hideUnenrolled: hideUnenrolledV2,
    bookmarkedLessons: bookmarkedLessonsV2,
    onEnroll: handleEnrollV2,
    onUnenroll: handleUnenrollV2,
    onToggleHideUnenrolled: handleToggleHideUnenrolledV2,
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-bg">
        <Nav />
        <Routes>
          <Route path="/" element={<Dashboard enrolledCourse={enrolledCourse} />} />
          <Route path="/mtw" element={<Curriculum {...curriculumProps} />} />
          <Route path="/mtw/lesson" element={<LessonView onBookmark={handleBookmark} />} />
          {/* legacy paths kept so existing links still resolve */}
          <Route path="/curriculum" element={<Curriculum {...curriculumProps} />} />
          <Route path="/curriculum/lesson" element={<LessonView onBookmark={handleBookmark} />} />
          <Route path="/mtw2" element={<CurriculumV2 {...curriculumPropsV2} />} />
          <Route path="/mtw2/course" element={<CourseOverviewV2 enrolledCourse={enrolledCourseV2} />} />
          <Route path="/mtw2/lesson" element={<LessonViewV2 onBookmark={handleBookmarkV2} enrolledCourse={enrolledCourseV2} />} />
          <Route path="/mtw3" element={<CurriculumV3 {...curriculumPropsV3} />} />
          <Route path="/mtw3/lesson" element={<LessonViewV3 onBookmark={handleBookmarkV3} />} />
          <Route path="/mtw4" element={<CurriculumV4 enrolledCourse={enrolledCourseV4} hideUnenrolled={hideUnenrolledV4} bookmarkedLessons={bookmarkedLessonsV4} onEnroll={handleEnrollV4} onUnenroll={handleUnenrollV4} onToggleHideUnenrolled={handleToggleHideUnenrolledV4} />} />
          <Route path="/mtw4/lesson" element={<LessonViewV4 onBookmark={handleBookmarkV4} />} />
          <Route path="/ratings" element={<Ratings />} />
          <Route path="/insights" element={<Placeholder title="Data & Insights" />} />
          <Route path="/strategies" element={<Placeholder title="Strategies" />} />
          <Route path="/brand" element={<BrandGuide />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
