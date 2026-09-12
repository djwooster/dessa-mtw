import { createContext, useContext, useState } from 'react'

// Global "which Resources page concept is active" switch — lives above Nav
// and the /resources route so both can read/write it without prop-drilling.
// In-memory only (no URL param, no localStorage): per explicit instruction,
// picking a letter elsewhere in the app just sets the selection, it doesn't
// navigate you to /resources to see it.
//
// Also holds two independent axes layered on top of B/C/D/E (2026-09-12):
// resultsView ('list'|'cards') and filterMechanic ('bar'|'sidebar'). These
// are orthogonal to which entry concept is active — how results are
// displayed and how filtering is presented are separate questions from how
// you arrive at a grade — so they live in the same context (a preference
// persists across switching B/C/D/E) but the controls for them live in
// ResourcesAltConcepts' results UI itself, not the Nav switcher.
const ResourcesConceptContext = createContext(null)

export function ResourcesConceptProvider({ children }) {
  const [resourcesConcept, setResourcesConcept] = useState('a')
  const [resultsView, setResultsView] = useState('list')
  const [filterMechanic, setFilterMechanic] = useState('bar')
  return (
    <ResourcesConceptContext.Provider
      value={{
        resourcesConcept, setResourcesConcept,
        resultsView, setResultsView,
        filterMechanic, setFilterMechanic,
      }}
    >
      {children}
    </ResourcesConceptContext.Provider>
  )
}

export function useResourcesConcept() {
  return useContext(ResourcesConceptContext)
}
