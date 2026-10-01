import { createContext, useContext, useState } from 'react'

// Which full-page concept renders on the Daily Curriculum Engagement report
// (2026-10-01) — same convention as siteEngagementConceptContext.jsx: the
// switcher lives in Nav, the page reads from context. 'a' = the original
// page (Report1C, the frozen baseline); 'b' = Today's roster (no history);
// 'c' = Needs follow-up (grouped by how long a teacher has been quiet);
// 'd' = Today plus this week (day dots, with a calendar on demand).
const DceConceptContext = createContext(null)

export function DceConceptProvider({ children }) {
  const [dceConcept, setDceConcept] = useState('a')
  return (
    <DceConceptContext.Provider value={{ dceConcept, setDceConcept }}>
      {children}
    </DceConceptContext.Provider>
  )
}

export function useDceConcept() {
  return useContext(DceConceptContext)
}
