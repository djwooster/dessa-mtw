import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Toaster } from 'sonner'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Curriculum from './pages/Curriculum'
import Resources from './pages/Resources'
import ResourceLibrary from './pages/ResourceLibrary'
import ResourcePreview from './pages/ResourcePreview'
import LessonView from './pages/LessonView'
import Ratings from './pages/Ratings'
import ClassRatingsLayout from './pages/ClassRatingsLayout'
import RecommendedContent from './pages/RecommendedContent'
import RatingSummary from './pages/RatingSummary'
import BrandGuide from './pages/BrandGuide'
import UserFeedback from './pages/UserFeedback'
import CompetitiveAnalysis from './pages/CompetitiveAnalysis'
import ProcessJournal from './pages/ProcessJournal'
import ProcessJournalLayout from './pages/ProcessJournalLayout'
import ProcessJournalTodo from './pages/ProcessJournalTodo'
// import ReportDce from './pages/ReportDce' // commented out 2026-10-08, Engagement is the only report
import ReportEngagement from './pages/ReportEngagement'
// import Report2 from './pages/Report2' // commented out 2026-10-08, Engagement is the only report
import ReportsLayout from './pages/ReportsLayout'
import SettingsLayout from './pages/settings/SettingsLayout'
import ReportContent from './pages/ReportContent'
import ReportStudents from './pages/ReportStudents'
import SettingsPlaceholder from './pages/settings/SettingsPlaceholder'
import CurriculumSetup from './pages/settings/CurriculumSetup'
import JoinPage from './pages/JoinPage'
import { ResourcesConceptProvider } from './lib/resourcesConceptContext'
import { SiteEngagementConceptProvider } from './lib/siteEngagementConceptContext'
import { DceConceptProvider } from './lib/dceConceptContext'
import { EngagementConceptProvider } from './lib/engagementConceptContext'
import { EngagementVersionProvider } from './lib/engagementVersionContext'
import { RoleProvider } from './lib/roleContext'
import { DashboardConceptProvider } from './lib/dashboardConceptContext'
import { SettingsConceptProvider } from './lib/settingsConceptContext'

function Placeholder({ title }) {
  return (
    <div className="px-6 py-16 text-center">
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
      {/* Dashboard toasts (2026-10-20): top right, just under the 56px nav, for custom white toasts. */}
      <Toaster id="dashboard" position="top-right" offset={{ top: 72, right: 24 }} />
      <ResourcesConceptProvider>
        <SiteEngagementConceptProvider>
          <DceConceptProvider>
            <EngagementConceptProvider>
            <EngagementVersionProvider>
            <RoleProvider>
            <DashboardConceptProvider>
            <SettingsConceptProvider>
              <AppShell handleBookmark={handleBookmark} />
            </SettingsConceptProvider>
            </DashboardConceptProvider>
            </RoleProvider>
            </EngagementVersionProvider>
            </EngagementConceptProvider>
          </DceConceptProvider>
        </SiteEngagementConceptProvider>
      </ResourcesConceptProvider>
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
        <Route path="/resource-library" element={<ResourceLibrary />} />
        <Route path="/resource-library/preview" element={<ResourcePreview />} />
        <Route path="/ratings" element={<Ratings />} />
        <Route path="/class-ratings" element={<ClassRatingsLayout />}>
          <Route index element={<Navigate to="recommended" replace />} />
          <Route path="recommended" element={<RecommendedContent />} />
          <Route path="summary" element={<RatingSummary />} />
        </Route>
        <Route path="/reports" element={<ReportsLayout />}>
          <Route index element={<Navigate to="engagement" replace />} />
          {/* Site Engagement and Daily Curriculum Engagement commented out 2026-10-08 (files kept).
          <Route path="site-engagement" element={<Report2 />} />
          <Route path="dce" element={<ReportDce />} />
          */}
          {/* engagement/* keeps one page mounted for the report and a site page (engagement/site/:id), so filters survive the trip. */}
          <Route path="engagement/*" element={<ReportEngagement />} />
          <Route path="content" element={<ReportContent />} />
          <Route path="students" element={<ReportStudents />} />
          {/* Old links to the retired reports land here. */}
          <Route path="*" element={<Navigate to="engagement" replace />} />
        </Route>
        <Route path="/settings" element={<SettingsLayout />}>
          <Route index element={<Navigate to="curriculum-setup" replace />} />
          <Route path="curriculum-setup" element={<CurriculumSetup />} />
          <Route path="imports" element={<SettingsPlaceholder title="Imports" />} />
          <Route path="sites" element={<SettingsPlaceholder title="Sites" />} />
          <Route path="students" element={<SettingsPlaceholder title="Students" />} />
          <Route path="staff" element={<SettingsPlaceholder title="Staff" />} />
          <Route path="yearly-rating-setup" element={<SettingsPlaceholder title="Yearly rating setup" />} />
          <Route path="assignment-review" element={<SettingsPlaceholder title="Assignment review" />} />
          <Route path="student-self-report" element={<SettingsPlaceholder title="Student self report" />} />
          <Route path="email-reminders" element={<SettingsPlaceholder title="Email reminders" />} />
          <Route path="parent-guardian-rating" element={<SettingsPlaceholder title="Parent and guardian rating" />} />
        </Route>
        <Route path="/join" element={<JoinPage />} />
        <Route path="/insights" element={<Placeholder title="Data & Insights" />} />
        <Route path="/strategies" element={<Placeholder title="Strategies" />} />
        <Route path="/training" element={<Placeholder title="Training" />} />
        <Route path="/brand" element={<BrandGuide />} />
        <Route path="/user-feedback" element={<UserFeedback />} />
        <Route path="/competitive-analysis" element={<CompetitiveAnalysis />} />
        <Route path="/process-journal" element={<ProcessJournalLayout />}>
          <Route index element={<ProcessJournal />} />
          <Route path="todo" element={<ProcessJournalTodo />} />
        </Route>
      </Routes>
    </div>
  )
}
