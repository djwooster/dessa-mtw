// Shown in place of a goal chart or table (2026-10-26) when the User role filter is a type the weekly goal doesn't
// apply to (report2Data's OTHER_ROLES), so the report shows no goal data rather than a misleading 0%.
const PLURALS = {
  'School Support': 'School support staff',
  'Program Admin': 'Program admins',
  'Family User': 'Family users',
}

export default function NoGoalNotice({ role }) {
  return (
    <div className="py-12 text-center">
      <p className="text-sm font-semibold text-brand-text">{PLURALS[role] ?? role} don't have a weekly goal</p>
      <p className="text-sm text-brand-subtext mt-1">You can see their activity in the users table below.</p>
    </div>
  )
}
