import { CopyField } from '../../components/ui/copy-field'
import { JOIN_URL_DISPLAY } from '../../lib/familyAccessData'

export default function FamilyAccessUrl() {
  return (
    <>
      <div className="bg-brand-bg px-6 py-4">
        <p className="text-sm font-semibold text-brand-text">Registration link</p>
        <p className="text-sm text-brand-subtext mt-0.5">
          Share this link with families so they can create their own Family account and connect it to your site with an access code.
        </p>
      </div>
      <div className="px-6 py-5">
        <CopyField value={JOIN_URL_DISPLAY} />
      </div>
    </>
  )
}
