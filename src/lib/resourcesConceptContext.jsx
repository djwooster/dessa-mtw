import { createContext, useContext, useState } from 'react'

// Global "which Resources page concept is active" switch — lives above Nav
// and the /resources route so both can read/write it without prop-drilling.
// In-memory only (no URL param, no localStorage): per explicit instruction,
// picking a letter elsewhere in the app just sets the selection, it doesn't
// navigate you to /resources to see it.
//
// Also holds resultsView ('list'|'cards'), layered on top of B/C/D/E
// (2026-09-12) — orthogonal to which entry concept is active, since how
// results are displayed is a separate question from how you arrive at a
// grade — so it lives in the same context (a preference persists across
// switching B/C/D/E) but the control for it lives in ResourcesAltConcepts'
// results UI itself, not the Nav switcher. A second axis, filterMechanic
// ('bar'|'sidebar'), used to live here too; removed 2026-09-16 once every
// concept was standardized on the bar filter and the toggle was deleted.
const ResourcesConceptContext = createContext(null)

export function ResourcesConceptProvider({ children }) {
  // Default landing concept for /resources — D as of 2026-09-18, per
  // manager direction (user testing favored D); was 'c' before that, and
  // 'a' (the live shipped experience) before that.
  const [resourcesConcept, setResourcesConcept] = useState('d')
  const [resultsView, setResultsView] = useState('list')
  // Rows vs. Table for Concept D's results (2026-09-18) — a manager-review
  // comparison of the existing row list against a denser table layout.
  // Lives here (not local state in ResourcesAltConcepts.jsx) because the
  // control for it sits in Nav.jsx, same pattern as the old B/C/D/E
  // switcher before it.
  const [resultsLayout, setResultsLayout] = useState('rows')
  // Bumped on every switcher click (see Nav.jsx) — including re-clicking
  // the concept you're already on — so Resources.jsx can key the active
  // B/C/E concept component on it, forcing a fresh remount that clears all
  // of that concept's own local state (grade picks, search text, filters)
  // back to its initial values. Lets the designer re-run a QA pass on a
  // concept without a full page reload.
  const [resetNonce, setResetNonce] = useState(0)
  function bumpReset() {
    setResetNonce((n) => n + 1)
  }
  return (
    <ResourcesConceptContext.Provider
      value={{
        resourcesConcept, setResourcesConcept,
        resultsView, setResultsView,
        resultsLayout, setResultsLayout,
        resetNonce, bumpReset,
      }}
    >
      {children}
    </ResourcesConceptContext.Provider>
  )
}

export function useResourcesConcept() {
  return useContext(ResourcesConceptContext)
}
