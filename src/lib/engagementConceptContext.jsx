import { createContext, useContext, useState } from 'react'

// Which concept renders on the combined Engagement report (2026-10-06), same
// convention as siteEngagementConceptContext.jsx: the switcher lives in Nav,
// the page reads from context. 'a' = the chart of "sites where every
// educator met the goal" at district level and "% of educators meeting goal"
// at site level (a single line). 'b' = educators who met their weekly goal,
// stacked per week with the educators who are making progress and those not
// yet active, so one chart answers both readings of "meeting goal". 'c' =
// an analytics layout: a borderless stat strip and a 2x2 grid of weekly
// charts, with one date dropdown and a Download button. 'd' = an insights
// layout: stat cards with change pills and a horizontal-bar ladder of how
// often users are engaged.
const EngagementConceptContext = createContext(null)

export function EngagementConceptProvider({ children }) {
  const [engagementConcept, setEngagementConcept] = useState('b')
  return (
    <EngagementConceptContext.Provider value={{ engagementConcept, setEngagementConcept }}>
      {children}
    </EngagementConceptContext.Provider>
  )
}

export function useEngagementConcept() {
  return useContext(EngagementConceptContext)
}
