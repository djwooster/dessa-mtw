import { useSiteEngagementConcept } from '../lib/siteEngagementConceptContext'
// Concepts A-D commented out 2026-10-02 and F commented out 2026-10-07 (files
// kept); E is the only live concept. Uncomment these, the branches below, and
// the matching entries in Nav.jsx's SITE_ENGAGEMENT_CONCEPTS to bring them back.
// import Report2ConceptA from './Report2ConceptA'
// import Report2ConceptB from './Report2ConceptB'
// import Report2ConceptC from './Report2ConceptC'
// import Report2ConceptD from './Report2ConceptD'
import Report2ConceptE from './Report2ConceptE'
// import Report2ConceptF from './Report2ConceptF'

// Site Engagement report — thin switcher between concepts, selected via
// Nav's dropdown (site-engagement route only). See
// siteEngagementConceptContext.jsx for what each letter means.
export default function Report2() {
  const { statConcept } = useSiteEngagementConcept()
  // if (statConcept === 'b') return <Report2ConceptB />
  // if (statConcept === 'c') return <Report2ConceptC />
  // if (statConcept === 'd') return <Report2ConceptD />
  // if (statConcept === 'f') return <Report2ConceptF />
  return <Report2ConceptE />
  // return <Report2ConceptA />
}
