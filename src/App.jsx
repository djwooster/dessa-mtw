import { useState } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'sonner'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Curriculum from './pages/Curriculum'
import LessonView from './pages/LessonView'
import Ratings from './pages/Ratings'
import BrandGuide from './pages/BrandGuide'
import Report1C from './pages/Report1C'
import Report2 from './pages/Report2'

function Placeholder({ title }) {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-brand-text mb-2">{title}</h1>
      <p className="text-brand-subtext text-sm">Coming soon in a future prototype iteration.</p>
    </div>
  )
}

export default function App() {
  const [, setBookmarkedLessons] = useState([])

  const handleBookmark = (lessonData) => {
    setBookmarkedLessons((prev) => {
      const alreadyBookmarked = prev.some(
        (b) => b.lesson === lessonData.lesson && b.unit === lessonData.unit
      )
      return alreadyBookmarked ? prev : [...prev, lessonData]
    })
  }

  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <div className="min-h-screen bg-brand-bg">
        <Nav />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mtw" element={<Curriculum />} />
          <Route path="/mtw/lesson" element={<LessonView onBookmark={handleBookmark} />} />
          <Route path="/ratings" element={<Ratings />} />
          <Route path="/report1c" element={<Report1C />} />
          <Route path="/report2" element={<Report2 />} />
          <Route path="/insights" element={<Placeholder title="Data & Insights" />} />
          <Route path="/strategies" element={<Placeholder title="Strategies" />} />
          <Route path="/brand" element={<BrandGuide />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
