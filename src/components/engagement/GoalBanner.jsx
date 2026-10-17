import { Link } from 'react-router-dom'
import { ExternalLink, Info } from 'lucide-react'
import { GOAL } from '../../pages/Report2ConceptE'

// Weekly goal callout (2026-10-13, shared 2026-10-16): sits under the page title on the Engagement and
// Year to date reports so the goal is on screen in screenshots.
export default function GoalBanner() {
  return (
    <div role="note" className="flex items-center gap-2 rounded-lg border border-state-info/30 bg-state-infoLight px-4 py-2.5 mb-6 text-[13px] text-[#134fb2]">
      <Info size={14} className="shrink-0" aria-hidden="true" />
      <p className="min-w-0">
        <span className="font-medium">Weekly goal: {GOAL} lessons per week.</span>
      </p>
      <Link to="/settings" className="ml-auto shrink-0 inline-flex items-center gap-1 font-medium hover:underline">
        Change in Settings <ExternalLink size={12} aria-hidden="true" />
      </Link>
    </div>
  )
}
