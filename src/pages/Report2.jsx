import { useSiteEngagementConcept } from '../lib/siteEngagementConceptContext'
import Report2ConceptA from './Report2ConceptA'
import Report2ConceptB from './Report2ConceptB'

// Site Engagement report — thin switcher between concepts, selected via
// Nav's dropdown (site-engagement route only). See
// siteEngagementConceptContext.jsx for what each letter means.
export default function Report2() {
  const { statConcept } = useSiteEngagementConcept()
  return statConcept === 'b' ? <Report2ConceptB /> : <Report2ConceptA />
}
