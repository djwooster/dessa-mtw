import { createContext, useContext, useState } from 'react'

// Engagement report version switcher (2026-10-14). Concept F was decided, so this is a fresh
// switcher for the next round on top of it: 'a' is the version as it stands today (Concept F);
// 'b' will be a new table design for the Chart | Table view. The switcher lives in Nav, the page
// reads from context. It is separate from engagementConceptContext.jsx (the retired A-F one).
const EngagementVersionContext = createContext(null)

export function EngagementVersionProvider({ children }) {
  const [engagementVersion, setEngagementVersion] = useState('a')
  return (
    <EngagementVersionContext.Provider value={{ engagementVersion, setEngagementVersion }}>
      {children}
    </EngagementVersionContext.Provider>
  )
}

export function useEngagementVersion() {
  return useContext(EngagementVersionContext)
}
