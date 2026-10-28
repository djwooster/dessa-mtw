import { createContext, useContext, useState } from 'react'

// Which Courses view the Content report renders (2026-10-27), same convention as settingsConceptContext.jsx: the
// switcher lives in Nav, ReportContent reads from context. 'a' = the course table, 'b' = grade band cards with
// each course's pace (where its classes are in the course), 'c' = one row per grade, each opening its course page,
// with user names opening a user page.
// The applied filters live here too (2026-10-27), so they survive a trip to a course or user page and back.
const ContentConceptContext = createContext(null)

export function ContentConceptProvider({ children }) {
  const [contentConcept, setContentConcept] = useState('c') // C opens first (2026-10-28); A is commented out
  const [contentFilters, setContentFilters] = useState(null) // null = the report's defaults
  return (
    <ContentConceptContext.Provider value={{ contentConcept, setContentConcept, contentFilters, setContentFilters }}>
      {children}
    </ContentConceptContext.Provider>
  )
}

export function useContentConcept() {
  return useContext(ContentConceptContext)
}
