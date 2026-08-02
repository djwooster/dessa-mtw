import { CopyField } from '../../components/ui/copy-field'
import { schools, SITE_LEADER_SCHOOL, getSiteJoinUrl } from '../../lib/familyAccessData'

export default function FamilyAccessCodes({ role }) {
  if (role === 'site_leader') {
    return (
      <>
        <div className="bg-brand-bg px-6 py-4">
          <p className="text-sm font-semibold text-brand-text">Access code</p>
          <p className="text-sm text-brand-subtext mt-0.5">
            Give this link to families — it connects their account to {SITE_LEADER_SCHOOL.name}.
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm font-medium text-brand-text mb-2">{SITE_LEADER_SCHOOL.name}</p>
          <CopyField value={getSiteJoinUrl(SITE_LEADER_SCHOOL)} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="bg-brand-bg px-6 py-4">
        <p className="text-sm font-semibold text-brand-text">Access codes</p>
        <p className="text-sm text-brand-subtext mt-0.5">
          Every site in your district has its own link — families use it during registration to connect to the right site.
          Site Leaders only see the link for their own site.
        </p>
      </div>
      <div className="px-6 py-3">
        <div className="flex items-center justify-between px-1 pb-1.5">
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">Site</span>
          <span className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">Registration link</span>
        </div>
        <div className="divide-y divide-brand-border">
          {schools.map((school) => (
            <div key={school.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-brand-text">{school.name}</span>
              <CopyField value={getSiteJoinUrl(school)} />
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
