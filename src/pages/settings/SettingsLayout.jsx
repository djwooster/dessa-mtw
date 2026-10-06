import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronLeft } from 'lucide-react'
import RoleSwitcher from '../../components/RoleSwitcher'
import { useRole } from '../../lib/roleContext'

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
  // Internal-only role switcher: the control and its state are shared with
  // the Reports sidebar (components/RoleSwitcher.jsx, lib/roleContext.jsx).
  // Passed down to routed children via <Outlet context>. Only Curriculum
  // Setup honors it today; other settings pages simply don't read it.
  const { isSiteLeaderView } = useRole()

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      {/* sticky + an explicit viewport-relative height, not just flex
          stretch — the row's height (and so its default align-items:
          stretch behavior) is driven by the content column, which can be
          much taller than the viewport, so a plain stretched aside grows
          to match that content height rather than staying screen-sized. */}
      <aside className="w-56 flex-shrink-0 border-r border-brand-border bg-white pt-6 flex flex-col self-start sticky top-14 h-[calc(100vh-3.5rem)]">
        <div className="flex items-center justify-between px-6 mb-4">
          <h2 className="text-sm font-semibold text-brand-text">Settings</h2>
          <ChevronLeft size={14} className="text-brand-subtext" />
        </div>
        <nav className="flex flex-col flex-1 overflow-y-auto">
          {SETTINGS_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-6 py-2 text-sm transition-colors ${
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

        <RoleSwitcher />
      </aside>

      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex-1 min-w-0 px-6 py-8"
      >
        <Outlet context={{ isSiteLeaderView }} />
      </motion.div>
    </div>
  )
}
