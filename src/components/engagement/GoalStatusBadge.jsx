import { GOAL } from '../../pages/Report2ConceptE'

// Goal status wording (2026-10-12, Concept F): Not started (no lessons this
// week), In progress (at least one lesson, short of the goal), Goal met.
export function goalStatus(daysActive) {
  if (daysActive >= GOAL) return 'Goal met'
  return daysActive > 0 ? 'In progress' : 'Not started'
}

const STYLES = {
  'Goal met': 'bg-org-green-100/85 text-org-green-800',
  'In progress': 'bg-state-infoLight text-state-info',
  'Not started': 'bg-brand-bg text-brand-text',
}

export default function GoalStatusBadge({ daysActive }) {
  const status = goalStatus(daysActive)
  return <span className={`inline-flex items-center rounded-[5px] px-2 py-0.5 text-xs font-medium ${STYLES[status]}`}>{status}</span>
}
