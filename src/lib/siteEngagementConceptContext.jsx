import { createContext, useContext, useState } from 'react'

// Which alternate stat-card concept shows next to the fixed "Building
// momentum" card on the Site Engagement report (2026-09-23) — lives above
// Nav and the report route so the Nav-hosted dropdown can set it, same
// "switcher control lives in Nav, page reads from context" convention as
// resourcesConceptContext.jsx. Lettered like every other concept comparison
// in this app (see Nav.jsx's SITE_ENGAGEMENT_CONCEPTS for what each letter
// means): 'a' = Coverage (sites that went quiet), 'b' = Consistency (steady
// vs. bursty weekly participation), 'c' = Lessons completed (raw count).
// Defaults to 'a', the first option.
const SiteEngagementConceptContext = createContext(null)

export function SiteEngagementConceptProvider({ children }) {
  const [statConcept, setStatConcept] = useState('a')
  return (
    <SiteEngagementConceptContext.Provider value={{ statConcept, setStatConcept }}>
      {children}
    </SiteEngagementConceptContext.Provider>
  )
}

export function useSiteEngagementConcept() {
  return useContext(SiteEngagementConceptContext)
}
