import { createContext, useContext, useState } from 'react'

// Engagement report version switcher (2026-10-14). Concept F was decided, so this is a fresh
// switcher for the next round on top of it: 'a' is the version as it stands today (Concept F);
// 'b' will be a new table design for the Chart | Table view. The switcher lives in Nav, the page
// reads from context. It is separate from engagementConceptContext.jsx (the retired A-F one).
const EngagementVersionContext = createContext(null)

export function EngagementVersionProvider({ children }) {
  const [engagementVersion, setEngagementVersion] = useState('a')
  // Week by week page (2026-10-15, Version A): three layouts to compare, switched from Nav while on that page.
  // YTD is first in the switcher and the default (2026-10-16).
  const [yearLayout, setYearLayout] = useState('halves5')
  // YTD's Today | End of year preview (2026-10-16), switched from Nav.
  const [ytdPreview, setYtdPreview] = useState('today')
  return (
    <EngagementVersionContext.Provider value={{ engagementVersion, setEngagementVersion, yearLayout, setYearLayout, ytdPreview, setYtdPreview }}>
      {children}
    </EngagementVersionContext.Provider>
  )
}

export function useEngagementVersion() {
  return useContext(EngagementVersionContext)
}
