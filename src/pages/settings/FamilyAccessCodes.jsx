import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table'
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-3 text-sm text-brand-text normal-case tracking-normal">Site</TableHead>
              <TableHead className="h-8 px-3 text-sm text-brand-text normal-case tracking-normal text-right">Registration link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {schools.map((school) => (
              <TableRow key={school.id}>
                <TableCell className="px-3 py-2 text-sm whitespace-nowrap">{school.name}</TableCell>
                <TableCell className="px-3 py-2">
                  <div className="flex justify-end">
                    <CopyField value={getSiteJoinUrl(school)} variant="bare" />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  )
}
