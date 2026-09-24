import { createContext, useContext, useState } from 'react'

// Which full-page concept renders on the Site Engagement report (2026-09-23)
// — lives above Nav and the report route so the Nav-hosted dropdown can set
// it, same "switcher control lives in Nav, page reads from context"
// convention as resourcesConceptContext.jsx. Lettered like every other
// concept comparison in this app (see Nav.jsx's SITE_ENGAGEMENT_CONCEPTS and
// Report2.jsx for what each letter means): 'a' = Original (what's live in
// prod today, the baseline), 'b' = the positive, window-based reframe. Both
// are frozen — all new simplification work lands in 'c' onward. 'c' = a
// from-scratch rebuild around just two numbers (% of sites meeting goal,
// consistency), driven by real user feedback that the old metrics/labels
// were confusing (the two stat cards were later dropped as redundant with
// the table). 'd' = two-column layout — the same table plus a
// "Consistency over time" trend card. 'e' = trend-first — a stock-chart-
// style range-preset line chart (30/60/90 days, All time) above a full-
// width "Users meeting goal" table. Defaults to 'a', the baseline.
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
