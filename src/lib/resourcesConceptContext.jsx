import { createContext, useContext, useState } from 'react'

// Global "which Resources page concept is active" switch — lives above Nav
// and the /resources route so both can read/write it without prop-drilling.
// In-memory only (no URL param, no localStorage): per explicit instruction,
// picking a letter elsewhere in the app just sets the selection, it doesn't
// navigate you to /resources to see it.
const ResourcesConceptContext = createContext(null)

export function ResourcesConceptProvider({ children }) {
  const [resourcesConcept, setResourcesConcept] = useState('a')
  return (
    <ResourcesConceptContext.Provider value={{ resourcesConcept, setResourcesConcept }}>
      {children}
    </ResourcesConceptContext.Provider>
  )
}

export function useResourcesConcept() {
  return useContext(ResourcesConceptContext)
}
