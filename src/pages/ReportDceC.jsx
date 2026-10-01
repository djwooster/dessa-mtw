import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DcePage, DceHeader, EmptyRoster, SinceCell } from '../components/dce/DceParts'
import { DEFAULT_SITE, formatDay, useDceRoster } from '../lib/dceData'

// Concept C, Needs follow-up: teachers grouped by how long they have been
// quiet, longest gap first. Teachers who already completed a lesson today
// sit in a collapsed group at the bottom so a large site stays short.
const GROUPS = [
  { key: 'long', title: 'Quiet for 5 or more school days', hint: 'Includes teachers with no lesson completed in the last 20 school days', open: true, test: (r) => !r.doneToday && (r.since === null || r.since >= 5) },
  { key: 'mid', title: 'Quiet for 2 to 4 school days', open: true, test: (r) => !r.doneToday && r.since !== null && r.since >= 2 && r.since < 5 },
  { key: 'yesterday', title: 'Last lesson was yesterday', hint: 'Not yet today', open: false, test: (r) => !r.doneToday && r.since === 1 },
  { key: 'today', title: 'Completed a lesson today', open: false, test: (r) => r.doneToday },
]
const INITIAL_SHOWN = 10

function Group({ group, rows }) {
  const [open, setOpen] = useState(group.open)
  const [shown, setShown] = useState(INITIAL_SHOWN)
  const visible = rows.slice(0, shown)
  return (
    <section className="bg-white rounded-xl border border-brand-border overflow-hidden mb-4">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-brand-bg/50 transition-colors"
      >
        <ChevronDown size={16} className={`text-brand-subtext shrink-0 transition-transform ${open ? '' : '-rotate-90'}`} />
        <span className="min-w-0 flex-1">
          <span className="block text-base font-semibold text-brand-text">{group.title}</span>
          {group.hint && <span className="block text-xs text-brand-subtext mt-0.5">{group.hint}</span>}
        </span>
        <span className="text-sm font-semibold text-brand-text tabular-nums">{rows.length}</span>
      </button>
      {open && (rows.length === 0 ? (
        <p className="px-4 pb-4 pl-11 text-sm text-brand-subtext">Nobody here right now.</p>
      ) : (
        <>
          <ul className="border-t border-brand-border divide-y divide-brand-border">
            {visible.map((r) => (
              <li key={r.teacher.id} className="flex items-center gap-4 pl-11 pr-4 py-2.5">
                <span className="flex-1 min-w-0 truncate text-sm font-medium text-brand-text">{r.name}</span>
                <span className="hidden sm:block w-44 text-sm text-brand-subtext">
                  {r.lastDate ? `Last lesson ${formatDay(r.lastDate)}` : 'No lesson in this window'}
                </span>
                <span className="w-44"><SinceCell since={r.since} /></span>
              </li>
            ))}
          </ul>
          {rows.length > shown && (
            <button
              type="button"
              onClick={() => setShown((n) => n + 25)}
              className="w-full py-2.5 text-sm font-medium text-dessa-teal border-t border-brand-border hover:bg-brand-bg/50"
            >
              Show {Math.min(25, rows.length - shown)} more of {rows.length - shown}
            </button>
          )}
        </>
      ))}
    </section>
  )
}

export default function ReportDceC() {
  const [site, setSite] = useState(DEFAULT_SITE)
  const [search, setSearch] = useState('')
  const roster = useDceRoster(site, search)
  const needing = roster.filter((r) => !r.doneToday).length

  return (
    <DcePage>
      <DceHeader
        site={site}
        onSite={setSite}
        search={search}
        onSearch={setSearch}
        summary={`${needing} of ${roster.length} teachers have not completed a lesson today`}
      />
      {roster.length === 0 ? (
        <div className="bg-white rounded-xl border border-brand-border"><EmptyRoster /></div>
      ) : (
        GROUPS.map((g) => (
          <Group
            key={`${site}-${g.key}`}
            group={g}
            rows={roster.filter(g.test).sort((a, b) => b.sinceSort - a.sinceSort || a.name.localeCompare(b.name))}
          />
        ))
      )}
    </DcePage>
  )
}
