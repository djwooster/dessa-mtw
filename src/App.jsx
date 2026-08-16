import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Curriculum from './pages/Curriculum'
import Resources from './pages/Resources'
import LessonView from './pages/LessonView'
import Ratings from './pages/Ratings'
import ClassRatingsLayout from './pages/ClassRatingsLayout'
import RecommendedContent from './pages/RecommendedContent'
import RatingSummary from './pages/RatingSummary'
import BrandGuide from './pages/BrandGuide'
import Report1C from './pages/Report1C'
import Report2 from './pages/Report2'
import SettingsLayout from './pages/settings/SettingsLayout'
import SettingsPlaceholder from './pages/settings/SettingsPlaceholder'
import CurriculumSetup from './pages/settings/CurriculumSetup'
import JoinPage from './pages/JoinPage'

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
      <AppShell handleBookmark={handleBookmark} />
    </BrowserRouter>
  )
}

function AppShell({ handleBookmark }) {
  const location = useLocation()
  const hideNav = location.pathname === '/join'

  return (
    <div className="min-h-screen bg-brand-bg">
      {!hideNav && <Nav />}
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/mtw" element={<Curriculum />} />
        <Route path="/mtw/lesson" element={<LessonView onBookmark={handleBookmark} />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/ratings" element={<Ratings />} />
        <Route path="/class-ratings" element={<ClassRatingsLayout />}>
          <Route index element={<Navigate to="recommended" replace />} />
          <Route path="recommended" element={<RecommendedContent />} />
          <Route path="summary" element={<RatingSummary />} />
        </Route>
        <Route path="/report1c" element={<Report1C />} />
        <Route path="/report2" element={<Report2 />} />
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="curriculum-setup" replace />} />
          <Route path="curriculum-setup" element={<CurriculumSetup />} />
          <Route path="imports" element={<SettingsPlaceholder title="Imports" />} />
          <Route path="sites" element={<SettingsPlaceholder title="Sites" />} />
          <Route path="students" element={<SettingsPlaceholder title="Students" />} />
          <Route path="staff" element={<SettingsPlaceholder title="Staff" />} />
          <Route path="yearly-rating-setup" element={<SettingsPlaceholder title="Yearly Rating Setup" />} />
          <Route path="assignment-review" element={<SettingsPlaceholder title="Assignment Review" />} />
          <Route path="student-self-report" element={<SettingsPlaceholder title="Student Self-Report" />} />
          <Route path="email-reminders" element={<SettingsPlaceholder title="Email Reminders" />} />
          <Route path="parent-guardian-rating" element={<SettingsPlaceholder title="Parent/Guardian Rating" />} />
        </Route>
        <Route path="/join" element={<JoinPage />} />
        <Route path="/insights" element={<Placeholder title="Data & Insights" />} />
        <Route path="/strategies" element={<Placeholder title="Strategies" />} />
        <Route path="/brand" element={<BrandGuide />} />
      </Routes>
    </div>
  )
}
