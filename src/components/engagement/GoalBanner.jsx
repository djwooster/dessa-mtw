import { Info } from 'lucide-react'
import { GOAL } from '../../pages/Report2ConceptE'

// Weekly goal callout (2026-10-13, shared 2026-10-16): sits under the page title on the Engagement and
// Year to date reports so the goal is on screen in screenshots. The Settings link was removed 2026-10-21.
// `siteLevel` (2026-10-26): a Site Leader reads it as their site's goal.
export default function GoalBanner({ siteLevel = false }) {
  return (
    <div role="note" className="flex items-center gap-2 rounded-lg border border-state-info/30 bg-state-infoLight px-4 py-3.5 mb-6 text-sm text-brand-text">
      <Info size={14} className="shrink-0 text-state-info" aria-hidden="true" />
      <p className="min-w-0">
        {siteLevel ? 'Your site' : 'Your district'}'s goal is <span className="font-semibold">{GOAL} lessons per week</span>.
      </p>
    </div>
  )
}
