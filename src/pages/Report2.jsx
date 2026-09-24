import { useSiteEngagementConcept } from '../lib/siteEngagementConceptContext'
import Report2ConceptA from './Report2ConceptA'
import Report2ConceptB from './Report2ConceptB'
import Report2ConceptC from './Report2ConceptC'
import Report2ConceptD from './Report2ConceptD'
import Report2ConceptE from './Report2ConceptE'

// Site Engagement report — thin switcher between concepts, selected via
// Nav's dropdown (site-engagement route only). See
// siteEngagementConceptContext.jsx for what each letter means.
export default function Report2() {
  const { statConcept } = useSiteEngagementConcept()
  if (statConcept === 'b') return <Report2ConceptB />
  if (statConcept === 'c') return <Report2ConceptC />
  if (statConcept === 'd') return <Report2ConceptD />
  if (statConcept === 'e') return <Report2ConceptE />
  return <Report2ConceptA />
}
