import { useState } from 'react'
// import FamilyAccessUrl from './FamilyAccessUrl'
import FamilyAccessCodes from './FamilyAccessCodes'

const TABS = [
  { key: 'engagement', label: 'Engagement' },
  { key: 'school-year', label: 'School year' },
]

const GOAL_OPTIONS = [1, 2, 3, 4, 5]

const FAMILY_ACCESS_TABS = [
  // { key: 'url', label: 'Registration Link' },
  { key: 'codes', label: 'Access Codes' },
]

export default function CurriculumSetup() {
  const [tab, setTab] = useState('engagement')
  const [goal, setGoal] = useState(3)
  const [familyAccessTab, setFamilyAccessTab] = useState('codes')

  return (
    <div className="flex flex-col gap-8">
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-semibold text-brand-text mb-4">Curriculum Setup</h1>
        <div className="flex items-center gap-5 border-b border-brand-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'text-brand-text border-dessa-teal'
                  : 'text-brand-subtext border-transparent hover:text-brand-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'engagement' ? (
        <>
          <div className="bg-brand-bg px-6 py-4">
            <p className="text-sm font-semibold text-brand-text">Engagement settings</p>
            <p className="text-sm text-brand-subtext mt-0.5">
              Configure how user engagement is measured and reported across your district.
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm font-semibold text-brand-text">Weekly goal</p>
            <p className="text-sm text-brand-subtext mt-0.5 mb-3">
              Days per week a user must access a lesson to be on track.
            </p>
            <div className="flex gap-2">
              {GOAL_OPTIONS.map((n) => (
                <button
                  key={n}
                  onClick={() => setGoal(n)}
                  className={`w-10 h-10 rounded-md border text-sm font-medium transition-colors ${
                    goal === n
                      ? 'bg-dessa-teal text-white border-dessa-teal'
                      : 'bg-white text-brand-text border-brand-border hover:bg-brand-bg'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-brand-border">
            <button className="px-4 py-2 rounded-md text-sm font-medium text-brand-text border border-dashed border-brand-border hover:bg-brand-bg transition-colors">
              Cancel
            </button>
            <button className="px-4 py-2 rounded-md text-sm font-medium text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors">
              Save
            </button>
          </div>
        </>
      ) : (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-brand-subtext">Coming soon in a future prototype iteration.</p>
        </div>
      )}
    </div>

    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-semibold text-brand-text mb-4">Family Access</h1>
        <div className="flex items-center gap-5 border-b border-brand-border">
          {FAMILY_ACCESS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFamilyAccessTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                familyAccessTab === t.key
                  ? 'text-brand-text border-dessa-teal'
                  : 'text-brand-subtext border-transparent hover:text-brand-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* familyAccessTab === 'url' && <FamilyAccessUrl /> */}
      {familyAccessTab === 'codes' && <FamilyAccessCodes role="program_admin" />}
    </div>
    </div>
  )
}
