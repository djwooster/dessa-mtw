import { useState } from 'react'
import { Info, Plus, Pencil, Trash2, Check, X, ChevronDown, ChevronRight } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
// import FamilyAccessUrl from './FamilyAccessUrl'
import FamilyAccessCodes from './FamilyAccessCodes'
import { SidePanel } from '../../components/ui/side-panel'
import { DatePicker } from '../../components/ui/date-picker'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { schools } from '../../lib/familyAccessData'

const TABS = [
  { key: 'engagement', label: 'Engagement' },
  { key: 'school-year', label: 'School year' },
  { key: 'blackout', label: 'Blackout periods' },
]

const GOAL_OPTIONS = [1, 2, 3, 4, 5]

// Mock per-site Weekly goal overrides (JIRA AP-4933) — reuses the same
// `schools` list Family Access Codes already renders further down this
// page, so "Site" means the same thing in both places. schools[0] is
// SITE_LEADER_SCHOOL elsewhere in this file's family, so it's included
// here too — a Site Leader viewing their own site would see it as custom.
const DEFAULT_SITE_OVERRIDES = [
  { school: schools[0], weeklyGoal: 5 },
  { school: schools[3], weeklyGoal: 2 },
  { school: schools[7], weeklyGoal: 4 },
]

const DEFAULT_BLACKOUT_PERIODS = [
  { id: 1, name: 'Fall Break',   from: '2025-10-13', to: '2025-10-17' },
  { id: 2, name: 'Thanksgiving', from: '2025-11-24', to: '2025-11-28' },
  { id: 3, name: 'Winter Break', from: '2025-12-22', to: '2026-01-02' },
  { id: 4, name: 'MLK Day',      from: '2026-01-19', to: '2026-01-19' },
  { id: 5, name: 'Spring Break', from: '2026-03-16', to: '2026-03-20' },
  { id: 6, name: 'Memorial Day', from: '2026-05-25', to: '2026-05-25' },
]

function formatRange(from, to) {
  const start = parseISO(from)
  const end = parseISO(to)
  if (from === to) return format(start, 'MMM d, yyyy')
  const sameYear = format(start, 'yyyy') === format(end, 'yyyy')
  const sameMonth = sameYear && format(start, 'MMM') === format(end, 'MMM')
  if (sameMonth) return `${format(start, 'MMM d')} – ${format(end, 'd')}, ${format(end, 'yyyy')}`
  if (sameYear) return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}, ${format(end, 'yyyy')}`
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
}

const FAMILY_ACCESS_TABS = [
  // { key: 'url', label: 'Registration Link' },
  { key: 'codes', label: 'Access Codes' },
]

export default function CurriculumSetup() {
  const [tab, setTab] = useState('engagement')
  const [goal, setGoal] = useState(3)
  const [familyAccessTab, setFamilyAccessTab] = useState('codes')
  const [isSiteLeaderView, setIsSiteLeaderView] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Program Admin's Weekly-goal overrides (AP-4933) — kept as real state
  // (not a plain constant) so a Save/Reset in the expanded row actually
  // updates the list, rather than being a static mockup.
  const [overrides, setOverrides] = useState(DEFAULT_SITE_OVERRIDES)
  const [overridesOpen, setOverridesOpen] = useState(false)
  // Accordion, not a drill-in screen — id of the one row expanded at a
  // time (null = none), so managing a site's setting happens in place
  // instead of navigating away from the list.
  const [expandedSchoolId, setExpandedSchoolId] = useState(null)
  const [editOverrideGoal, setEditOverrideGoal] = useState(null)

  const [periods, setPeriods] = useState(DEFAULT_BLACKOUT_PERIODS)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editFrom, setEditFrom] = useState('')
  const [editTo, setEditTo] = useState('')

  const canAdd = newName.trim() && newFrom && newTo && newFrom <= newTo

  function startAdd() {
    setIsAdding(true)
  }

  function cancelAdd() {
    setIsAdding(false)
    setNewName(''); setNewFrom(''); setNewTo('')
  }

  function saveNewPeriod() {
    if (!canAdd) return
    setPeriods((ps) => [...ps, { id: Date.now(), name: newName.trim(), from: newFrom, to: newTo }]
      .sort((a, b) => a.from.localeCompare(b.from)))
    setNewName(''); setNewFrom(''); setNewTo('')
    setIsAdding(false)
    toast.success('Blackout period added')
  }

  function startEdit(p) {
    setEditingId(p.id); setEditName(p.name); setEditFrom(p.from); setEditTo(p.to)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function saveEdit() {
    if (!editName.trim() || !editFrom || !editTo || editFrom > editTo) return
    setPeriods((ps) => ps.map((p) => p.id === editingId
      ? { ...p, name: editName.trim(), from: editFrom, to: editTo }
      : p
    ).sort((a, b) => a.from.localeCompare(b.from)))
    setEditingId(null)
    toast.success('Blackout period updated')
  }

  function deletePeriod(id) {
    setPeriods((ps) => ps.filter((p) => p.id !== id))
    toast.success('Blackout period removed')
  }

  function toggleExpanded(o) {
    if (expandedSchoolId === o.school.id) {
      setExpandedSchoolId(null)
    } else {
      setExpandedSchoolId(o.school.id)
      setEditOverrideGoal(o.weeklyGoal)
    }
  }

  function closeOverridesPanel() {
    setOverridesOpen(false)
    setExpandedSchoolId(null)
  }

  function saveOverrideGoal() {
    const school = overrides.find((o) => o.school.id === expandedSchoolId)?.school
    setOverrides((os) => os.map((o) =>
      o.school.id === expandedSchoolId ? { ...o, weeklyGoal: editOverrideGoal } : o
    ))
    if (school) toast.success(`Updated ${school.name}'s weekly goal`)
  }

  // Removing the override entirely is what "back to program default" means
  // — there's no separate "inherit" flag to flip, since being in this list
  // at all is what makes a site custom in the first place.
  function resetOverrideToDefault() {
    const school = overrides.find((o) => o.school.id === expandedSchoolId)?.school
    setOverrides((os) => os.filter((o) => o.school.id !== expandedSchoolId))
    if (school) toast.success(`${school.name} now uses the program default`)
    setExpandedSchoolId(null)
  }

  return (
    <>
    <div className="flex flex-col gap-8">
    {/* Internal-only role switcher — not a real end-user control, just lets
        the team flip between the Program Admin and Site Leader views of
        this page while reviewing the design. Drives the same
        isSiteLeaderView state the old single toggle button did. */}
    <div className="flex items-center justify-end">
      <Tabs
        value={isSiteLeaderView ? 'site_leader' : 'program_admin'}
        onValueChange={(v) => setIsSiteLeaderView(v === 'site_leader')}
      >
        <TabsList>
          <TabsTrigger value="program_admin">Program Admin</TabsTrigger>
          <TabsTrigger value="site_leader">Site Leader</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    {!isSiteLeaderView && (
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

      {tab === 'engagement' && (
        <>
          <div className="bg-brand-bg px-6 py-4 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-brand-text">Engagement settings</p>
              <p className="text-sm text-brand-subtext mt-0.5">
                Configure how user engagement is measured and reported across your district.
              </p>
            </div>
            {/* AP-4933 — deliberately not a table bolted under the default
                control: stays out of the way entirely when nothing's been
                customized, and only asks for attention (this pill) when a
                site has actually diverged. Pill shape + trailing chevron
                (not just teal text) so it reads as an actionable control at
                rest, not a plain status label. */}
            {overrides.length > 0 && (
              <button
                type="button"
                onClick={() => setOverridesOpen(true)}
                className="shrink-0 flex items-center gap-1 pl-3 pr-2.5 py-1.5 rounded-full text-sm font-medium text-dessa-teal bg-dessa-tealLight hover:bg-dessa-teal/20 transition-colors"
              >
                {overrides.length} site{overrides.length === 1 ? '' : 's'} customized
                <ChevronRight size={14} />
              </button>
            )}
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
      )}

      {tab === 'school-year' && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-brand-subtext">Coming soon in a future prototype iteration.</p>
        </div>
      )}

      {tab === 'blackout' && (
        <>
          <div className="bg-brand-bg px-6 py-4">
            <p className="text-sm font-semibold text-brand-text">Blackout periods</p>
            <p className="text-sm text-brand-subtext mt-0.5">
              Mark non-instructional days so they're excluded from engagement calculations.
            </p>
          </div>

          <div className="px-6">
            {periods.length === 0 ? (
              <p className="text-sm text-brand-subtext py-8 text-center">No blackout periods yet.</p>
            ) : (
              periods.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3 border-b border-brand-border last:border-b-0">
                  {editingId === p.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-9 text-sm border border-brand-border rounded-lg px-3 text-brand-text focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                      />
                      <div className="w-36">
                        <DatePicker value={editFrom} onChange={setEditFrom} placeholder="From" max={editTo || undefined} />
                      </div>
                      <div className="w-36">
                        <DatePicker value={editTo} onChange={setEditTo} placeholder="To" min={editFrom || undefined} />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={saveEdit}
                          className="p-2 rounded-md text-dessa-teal hover:bg-brand-bg transition-colors"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 rounded-md text-brand-subtext hover:bg-brand-bg transition-colors"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="flex-1 text-sm font-medium text-brand-text">{p.name}</p>
                      <p className="text-sm text-brand-subtext w-52 text-right">{formatRange(p.from, p.to)}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(p)}
                          className="p-2 rounded-md text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deletePeriod(p.id)}
                          className="p-2 rounded-md text-brand-subtext hover:text-red-600 hover:bg-brand-bg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 px-6 py-4 border-t border-brand-border">
            {isAdding && (
              <>
                <input
                  type="text"
                  placeholder="Period name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  className="flex-1 h-9 text-sm border border-brand-border rounded-lg px-3 text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                />
                <div className="w-36">
                  <DatePicker value={newFrom} onChange={setNewFrom} placeholder="From" max={newTo || undefined} />
                </div>
                <div className="w-36">
                  <DatePicker value={newTo} onChange={setNewTo} placeholder="To" min={newFrom || undefined} />
                </div>
              </>
            )}
            <div className={`flex items-center gap-1 shrink-0 ${isAdding ? '' : 'ml-auto'}`}>
              {isAdding && (
                <button
                  onClick={cancelAdd}
                  className="h-9 px-4 rounded-md text-sm font-medium text-brand-text border border-dashed border-brand-border hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={isAdding ? saveNewPeriod : startAdd}
                disabled={isAdding && !canAdd}
                className="flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium text-white bg-dessa-teal hover:bg-dessa-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isAdding ? (
                  <>Save</>
                ) : (
                  <><Plus size={14} /> Add period</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    )}

    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-semibold text-brand-text">Family Access</h1>
          <button
            onClick={() => setHelpOpen(true)}
            aria-label="About Family Access"
            className="text-brand-subtext hover:text-brand-text transition-colors"
          >
            <Info size={17} />
          </button>
        </div>
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
      {familyAccessTab === 'codes' && (
        <FamilyAccessCodes role={isSiteLeaderView ? 'site_leader' : 'program_admin'} />
      )}
    </div>
    </div>

    <SidePanel open={helpOpen} onClose={() => setHelpOpen(false)} title="About Family Access">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">What is Family Access?</h3>
          <p className="text-sm text-brand-subtext leading-relaxed">
            Family Access gives families a way to create their own account and connect it to your
            site, so they can complete supportive SEL activities at home with their student —
            without sharing a single login across your whole district.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">How families get access</h3>
          <ol className="flex flex-col gap-3">
            <li className="flex gap-2.5 text-sm text-brand-subtext leading-relaxed">
              <span className="font-semibold text-brand-text">1.</span>
              Share the registration link with a family.
            </li>
            <li className="flex gap-2.5 text-sm text-brand-subtext leading-relaxed">
              <span className="font-semibold text-brand-text">2.</span>
              They enter the code for their site to connect their account.
            </li>
            <li className="flex gap-2.5 text-sm text-brand-subtext leading-relaxed">
              <span className="font-semibold text-brand-text">3.</span>
              Once registered, they can access Family curriculum activities anytime.
            </li>
          </ol>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">Program Admin vs. Site Leader</h3>
          <p className="text-sm text-brand-subtext leading-relaxed">
            Program Admins see registration links for every site in the district. Site Leaders
            only see the link for their own site.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">Access expiration</h3>
          <p className="text-sm text-brand-subtext leading-relaxed">
            Family access follows your district's account — if it doesn't renew, Family logins
            provisioned under it lose access automatically.
          </p>
        </div>
      </div>
    </SidePanel>

    <SidePanel open={overridesOpen} onClose={closeOverridesPanel} title="Site overrides">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-brand-subtext mb-2">
          These sites use their own weekly goal instead of the program default ({goal} day{goal === 1 ? '' : 's'}/week).
          Select a site to manage its setting.
        </p>
        {overrides.map((o) => {
          const isExpanded = expandedSchoolId === o.school.id
          return (
            <div key={o.school.id} className="border-b border-brand-border last:border-b-0">
              <button
                type="button"
                onClick={() => toggleExpanded(o)}
                aria-expanded={isExpanded}
                className="w-full flex items-center justify-between gap-3 px-1 py-2.5 text-left hover:bg-brand-bg transition-colors"
              >
                <span className="text-sm font-medium text-brand-text truncate">{o.school.name}</span>
                <span className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-semibold text-dessa-teal bg-dessa-tealLight px-2 py-0.5 rounded-full">
                    {o.weeklyGoal} day{o.weeklyGoal === 1 ? '' : 's'}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`text-brand-subtext shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </span>
              </button>
              {isExpanded && (
                <div className="px-1 pb-5 flex flex-col gap-4">
                  <div className="rounded-lg border border-brand-border bg-brand-bg px-4 py-3">
                    <p className="text-xs font-medium text-brand-subtext mb-0.5">Program default</p>
                    <p className="text-sm font-semibold text-brand-text">{goal} day{goal === 1 ? '' : 's'} per week</p>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-brand-text mb-2">This site's setting</p>
                    <div className="flex gap-2">
                      {GOAL_OPTIONS.map((n) => (
                        <button
                          key={n}
                          onClick={() => setEditOverrideGoal(n)}
                          className={`w-10 h-10 rounded-md border text-sm font-medium transition-colors ${
                            editOverrideGoal === n
                              ? 'bg-dessa-teal text-white border-dessa-teal'
                              : 'bg-white text-brand-text border-brand-border hover:bg-brand-bg'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={saveOverrideGoal}
                      className="w-full h-9 rounded-md text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors"
                    >
                      Save changes
                    </button>
                    <button
                      type="button"
                      onClick={resetOverrideToDefault}
                      className="w-full h-9 rounded-md text-sm font-medium text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors"
                    >
                      Reset to program default
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </SidePanel>
    </>
  )
}
