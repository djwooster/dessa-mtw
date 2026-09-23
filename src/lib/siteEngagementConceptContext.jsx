import { createContext, useContext, useState } from 'react'

// Which full-page concept renders on the Site Engagement report (2026-09-23)
// — lives above Nav and the report route so the Nav-hosted dropdown can set
// it, same "switcher control lives in Nav, page reads from context"
// convention as resourcesConceptContext.jsx. Lettered like every other
// concept comparison in this app (see Nav.jsx's SITE_ENGAGEMENT_CONCEPTS and
// Report2.jsx for what each letter means): 'a' = Original (what's live in
// prod today, the baseline), 'b' = the positive, window-based reframe.
// More concepts land here as they're built. Defaults to 'a', the baseline.
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
