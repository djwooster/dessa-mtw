import { NavLink, Outlet } from 'react-router-dom'
import { ChevronLeft, Plus, Minus } from 'lucide-react'
import { CLASS_ROSTER } from '../lib/classRosterData'

const CLASS_RATINGS_NAV = [
  { label: 'Recommended Content', to: 'recommended' },
  { label: 'Rating Summary', to: 'summary' },
]

export default function ClassRatingsLayout() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="w-72 flex-shrink-0 border-r border-brand-border bg-white pt-6 overflow-y-auto">
        <div className="flex items-center justify-between px-6 mb-4">
          <h2 className="text-sm font-semibold text-brand-text">Students</h2>
          <ChevronLeft size={14} className="text-brand-subtext" />
        </div>

        <button className="flex items-center gap-2 w-full px-6 py-2 text-sm font-semibold text-dessa-teal hover:bg-dessa-tealLight transition-colors">
          <Plus size={14} />
          Add Students
        </button>

        <nav className="flex flex-col mt-2 mb-2 border-t border-b border-brand-border py-2">
          {CLASS_RATINGS_NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-6 py-2 text-sm transition-colors ${
                  isActive
                    ? 'font-semibold text-dessa-teal bg-dessa-tealLight'
                    : 'text-brand-subtext hover:text-brand-text hover:bg-brand-bg'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex flex-col">
          {CLASS_ROSTER.map((name) => (
            <div key={name} className="flex items-center gap-3 px-6 py-2 text-sm text-brand-text">
              <span className="w-6 h-6 rounded-full bg-brand-border flex items-center justify-center flex-shrink-0">
                <Minus size={11} className="text-brand-subtext" />
              </span>
              {name}
            </div>
          ))}
        </div>
      </aside>

      <div className="flex-1 min-w-0 px-6 py-8">
        <Outlet />
      </div>
    </div>
  )
}
