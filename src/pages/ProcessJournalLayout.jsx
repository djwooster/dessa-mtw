import { NavLink, Outlet } from 'react-router-dom'

// ─── Process Journal layout ─────────────────────────────────────────────────
// Subnav (2026-09-25), scoped to this page only — sits directly under the
// primary Nav, aligned to the same 88px gutter as the page content below it.
// Same editorial black/white palette as ProcessJournal.jsx/ProcessJournalTodo.jsx,
// not the app's brand-teal tab styling, since this whole page is a document
// for the designer's manager rather than a product surface.
const TABS = [
  { label: 'Journal', to: '/process-journal', end: true },
  { label: 'Todo', to: '/process-journal/todo', end: false },
]

export default function ProcessJournalLayout() {
  return (
    <div className="bg-white min-h-[calc(100vh-3.5rem)]">
      <div className="border-b border-gray-200">
        <nav className="flex items-center gap-8 px-6 md:px-[88px]">
          {TABS.map((tab) => (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                `py-3.5 font-sans text-xs normal-case tracking-normal border-b-2 -mb-px transition-colors ${
                  isActive
                    ? 'font-semibold text-black border-black'
                    : 'font-medium text-gray-400 border-transparent hover:text-black'
                }`
              }
            >
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>
      <Outlet />
    </div>
  )
}
