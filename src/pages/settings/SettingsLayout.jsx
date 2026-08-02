import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'

const SETTINGS_NAV = [
  { label: 'Imports', to: 'imports' },
  { label: 'Sites', to: 'sites' },
  { label: 'Students', to: 'students' },
  { label: 'Staff', to: 'staff' },
  { label: 'Curriculum Setup', to: 'curriculum-setup' },
  { label: 'Yearly Rating Setup', to: 'yearly-rating-setup' },
  { label: 'Assignment Review', to: 'assignment-review' },
  { label: 'Student Self-Report', to: 'student-self-report' },
  { label: 'Email Reminders', to: 'email-reminders' },
  { label: 'Parent/Guardian Rating', to: 'parent-guardian-rating' },
]

export default function SettingsLayout() {
  const location = useLocation()

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="w-56 flex-shrink-0 border-r border-brand-border bg-white pt-6">
        <div className="flex items-center justify-between px-5 mb-4">
          <h2 className="text-sm font-semibold text-brand-text">Settings</h2>
          <ChevronLeft size={14} className="text-brand-subtext" />
        </div>
        <nav className="flex flex-col">
          {SETTINGS_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-5 py-2 text-sm transition-colors ${
                  isActive
                    ? 'font-semibold text-dessa-teal'
                    : 'text-brand-subtext hover:text-brand-text'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 min-w-0 p-8"
      >
        <Outlet />
      </motion.div>
    </div>
  )
}
