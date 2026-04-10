import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Curriculum from './pages/Curriculum'
import LessonView from './pages/LessonView'
import Ratings from './pages/Ratings'
import BrandGuide from './pages/BrandGuide'

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
    onToggleHideUnenrolled: handleToggleHideUnenrolled,
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
          <Route path="/ratings" element={<Ratings />} />
          <Route path="/insights" element={<Placeholder title="Data & Insights" />} />
          <Route path="/strategies" element={<Placeholder title="Strategies" />} />
          <Route path="/brand" element={<BrandGuide />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
