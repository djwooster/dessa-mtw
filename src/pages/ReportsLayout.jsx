import { NavLink, Outlet } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'

// Sidebar mirrors the real DESSA Reports nav — grouped sections with many
// report names for visual fidelity, but only the two reports we've actually
// built (Site Engagement, Daily Curriculum Engagement) are real links.
// Everything else is decorative text, same convention as the Ratings roster.
const REPORT_GROUPS = [
  {
    label: 'Curriculum',
    items: [
      { label: 'Site Engagement', to: 'site-engagement' },
      { label: 'Daily Curriculum Engagement', to: 'dce' },
    ],
  },
  {
    label: 'Ratings',
    items: [
      'My Students',
      'Competencies',
      'Rating Window Overview',
      'Rating Window Breakdown',
      'Impact Report',
      'Summary Comparison of Ratings by Educators and Students',
      'Grade Level',
      'Batch - Individual Rating',
      'Rating Export',
      'SEIR Risk Report',
    ],
  },
  {
    label: 'Completion reports',
    items: ['Rating Completion', 'EdSERT Completion'],
  },
  {
    label: 'Student portal',
    items: ['Student Portal Usage', 'Login Activity'],
  },
]

export default function ReportsLayout() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)]">
      <aside className="w-72 flex-shrink-0 border-r border-brand-border bg-white pt-6 overflow-y-auto">
        <div className="flex items-center justify-between px-6 mb-4">
          <h2 className="text-sm font-semibold text-brand-text">Reports</h2>
          <ChevronLeft size={14} className="text-brand-subtext" />
        </div>

        <nav className="flex flex-col pb-6">
          {REPORT_GROUPS.map((group) => (
            <div key={group.label} className="mb-4">
              <p className="px-6 mb-3 text-[15px] font-semibold text-brand-text">
                {group.label}
              </p>
              {group.items.map((item) =>
                typeof item === 'string' ? (
                  <span key={item} className="block px-6 py-1.5 text-sm text-brand-subtext cursor-default">
                    {item}
                  </span>
                ) : (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `block px-6 py-1.5 text-sm transition-colors ${
                        isActive
                          ? 'font-semibold text-dessa-teal'
                          : 'text-brand-text hover:text-dessa-teal'
                      }`
                    }
                  >
                    {item.label}
                  </NavLink>
                )
              )}
            </div>
          ))}
        </nav>
      </aside>

      <div className="flex-1 min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
