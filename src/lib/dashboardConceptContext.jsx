import { createContext, useContext, useState } from 'react'

// Which concept renders on the Dashboard (2026-10-19), same convention as dceConceptContext.jsx: the switcher
// lives in Nav, the page reads from context. 'a' = the current Dashboard; 'b' always recreates the production empty state, 'c' is the rating invite, 'd' the invite with icon tiles, 'e' and 'f' are other ideas (reordered 2026-10-20) for a new Move
// This World customer with no DESSA ratings yet, guiding them to rate their students or explore the curriculum.
// Reordered 2026-10-19 so the big greeting concept is B; C replaced the production empty state the same day.
const DashboardConceptContext = createContext(null)

export function DashboardConceptProvider({ children }) {
  const [dashboardConcept, setDashboardConcept] = useState('a')
  // Concept B's illustration subtab (2026-10-19): 'circles' (overlapping circles and the dot grid) or 'hero'
  // (one large style guide shape with a cutout, formerly concept H).
  const [showcaseArt, setShowcaseArt] = useState('circles')
  return (
    <DashboardConceptContext.Provider value={{ dashboardConcept, setDashboardConcept, showcaseArt, setShowcaseArt }}>
      {children}
    </DashboardConceptContext.Provider>
  )
}

export function useDashboardConcept() {
  return useContext(DashboardConceptContext)
}
