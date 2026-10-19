import { createContext, useContext, useState } from 'react'

// Engagement report state shared with Nav. It held a version switcher (A, B, C) from 2026-10-14; that was
// deleted 2026-10-19, leaving the Table tab's state. Separate from engagementConceptContext.jsx (the retired A-F one).
const EngagementVersionContext = createContext(null)

export function EngagementVersionProvider({ children }) {
  // YTD's Today | End of year preview (2026-10-16), switched from Nav on the Table tab.
  const [ytdPreview, setYtdPreview] = useState('today')
  // Graph | Table tabs on the Engagement page (2026-10-16), kept here so Nav can show Today | End of year on Table.
  const [overviewTab, setOverviewTab] = useState('graph')
  return (
    <EngagementVersionContext.Provider value={{ ytdPreview, setYtdPreview, overviewTab, setOverviewTab }}>
      {children}
    </EngagementVersionContext.Provider>
  )
}

export function useEngagementVersion() {
  return useContext(EngagementVersionContext)
}
