import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Nav from './components/Nav'
import Dashboard from './pages/Dashboard'
import Curriculum from './pages/Curriculum'
import LessonView from './pages/LessonView'
import Ratings from './pages/Ratings'

function Placeholder({ title }) {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-16 text-center">
      <h1 className="text-2xl font-semibold text-brand-text mb-2">{title}</h1>
      <p className="text-brand-subtext text-sm">Coming soon in a future prototype iteration.</p>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-brand-bg">
        <Nav />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/mtw" element={<Curriculum />} />
          <Route path="/mtw/lesson" element={<LessonView />} />
          {/* legacy paths kept so existing links still resolve */}
          <Route path="/curriculum" element={<Curriculum />} />
          <Route path="/curriculum/lesson" element={<LessonView />} />
          <Route path="/ratings" element={<Ratings />} />
          <Route path="/insights" element={<Placeholder title="Data & Insights" />} />
          <Route path="/strategies" element={<Placeholder title="Strategies" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}
