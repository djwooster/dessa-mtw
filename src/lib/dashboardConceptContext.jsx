import { createContext, useContext, useState } from 'react'

// Which concept renders on the Dashboard (2026-10-19), same convention as dceConceptContext.jsx: the switcher
// lives in Nav, the page reads from context. 'a' = the current Dashboard; 'b' always recreates the production empty state, 'c' is the rating invite (mark or icon tiles), 'd' and 'e' are other ideas (reordered 2026-10-20) for a new Move
// This World customer with no DESSA ratings yet, guiding them to rate their students or explore the curriculum.
// Reordered 2026-10-19 so the big greeting concept is B; C replaced the production empty state the same day.
const DashboardConceptContext = createContext(null)

export function DashboardConceptProvider({ children }) {
  const [dashboardConcept, setDashboardConcept] = useState('a')
  // Simulated ratings (2026-10-20): a concept's "Start rating" stands in for the whole rating flow and flips this
  // on, so the dashboard shows that concept's after ratings view. The Nav Before | After control resets it.
  const [rated, setRated] = useState(false)
  // Concept D after ratings (2026-10-20): the Move This World banner style, 'card' or 'recommend'.
  const [bannerStyle, setBannerStyle] = useState('card')
  return (
    <DashboardConceptContext.Provider value={{ dashboardConcept, setDashboardConcept, rated, setRated, bannerStyle, setBannerStyle }}>
      {children}
    </DashboardConceptContext.Provider>
  )
}

export function useDashboardConcept() {
  return useContext(DashboardConceptContext)
}
