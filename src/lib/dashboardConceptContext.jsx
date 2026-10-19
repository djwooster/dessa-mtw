import { createContext, useContext, useState } from 'react'

// Which concept renders on the Dashboard (2026-10-19), same convention as dceConceptContext.jsx: the switcher
// lives in Nav, the page reads from context. 'a' = the current Dashboard; 'b' to 'e' are ideas for a new Move
// This World customer with no DESSA ratings yet, guiding them to rate their students or explore the curriculum.
// Reordered 2026-10-19 so the big greeting concept is B; C replaced the production empty state the same day.
const DashboardConceptContext = createContext(null)

export function DashboardConceptProvider({ children }) {
  const [dashboardConcept, setDashboardConcept] = useState('a')
  return (
    <DashboardConceptContext.Provider value={{ dashboardConcept, setDashboardConcept }}>
      {children}
    </DashboardConceptContext.Provider>
  )
}

export function useDashboardConcept() {
  return useContext(DashboardConceptContext)
}
