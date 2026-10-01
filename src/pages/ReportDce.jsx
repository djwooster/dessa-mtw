import { useDceConcept } from '../lib/dceConceptContext'
import Report1C from './Report1C'
import ReportDceB from './ReportDceB'
import ReportDceC from './ReportDceC'
import ReportDceD from './ReportDceD'

// Daily Curriculum Engagement report: a thin switcher between concepts,
// selected via the dropdown in Nav (only visible on this route). See
// dceConceptContext.jsx for what each letter means. 'a' is the original
// page, kept untouched as the baseline.
export default function ReportDce() {
  const { dceConcept } = useDceConcept()
  if (dceConcept === 'b') return <ReportDceB />
  if (dceConcept === 'c') return <ReportDceC />
  if (dceConcept === 'd') return <ReportDceD />
  return <Report1C />
}
