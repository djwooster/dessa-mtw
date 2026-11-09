import { format, parseISO } from 'date-fns'
import * as Tooltip from '@radix-ui/react-tooltip'
import { LESSONS_PER_UNIT, unitName } from '../../lib/contentReportData'
import { Fragment, useState } from 'react'
import { SortButton, nextSort } from '../../pages/Report2ConceptE'
import { Defined } from '../../pages/ReportContent'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'

// Course page sections (2026-11-06), for its concepts B to D: where users are in the course, which units are being
// taught, and lessons week by week. Each takes rows worked out on the page (see `courseInsights`) and an `action` for
// its Export CSV. `bare` drops the card, for a tab panel that already sits in one.

const card = 'bg-white rounded-lg border border-brand-border p-5'
const lessonsText = n => `${n.toLocaleString()} ${n === 1 ? 'lesson' : 'lessons'}`
const usersText = n => `${n.toLocaleString()} ${n === 1 ? 'user' : 'users'}`

function Card({ title, action, bare, children }) {
  return (
    <section className={bare ? '' : card}>
      <div className="flex items-center justify-between gap-4 min-h-9 mb-4">
        <h3 className="text-base font-semibold text-brand-text">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

// Progress buckets, by the share of the course a user has done by the end of the dates.
const BUCKETS = [
  { key: 'none', label: 'Not started yet', test: s => s === 0 },
  { key: 'q1', label: '1 to 25%', test: s => s > 0 && s <= 0.25 },
  { key: 'q2', label: '26 to 50%', test: s => s > 0.25 && s <= 0.5 },
  { key: 'q3', label: '51 to 75%', test: s => s > 0.5 && s <= 0.75 },
  { key: 'q4', label: '76 to 99%', test: s => s > 0.75 && s < 1 },
  { key: 'done', label: 'Finished', test: s => s >= 1 },
]

// Lessons within a unit (2026-11-06, concept G): a finished unit has all five; the first unit a user hasn't finished
// has a few of its lessons done (mock, steady per user); the rest have none. A user has started the course once
// they've done any lesson.
const LESSONS_IN_UNIT = 5
const steady = str => { let x = 7; for (let i = 0; i < str.length; i++) x = (x * 31 + str.charCodeAt(i)) >>> 0; return x }
const firstMissing = p => { for (let n = 1; n <= p.total; n++) if (!p.units?.includes(n)) return n; return null }
export function lessonsDone(u, p, unit) {
  if (!p) return 0
  if (p.units?.includes(unit)) return LESSONS_IN_UNIT
  return unit === firstMissing(p) ? steady(`${u.key}|${unit}`) % LESSONS_IN_UNIT : 0
}
export const hasStarted = (u, p) => !!p && (p.done > 0 || lessonsDone(u, p, firstMissing(p)) > 0)

// What the page's sections need from its users. `progressOf(u)` is { done, total } in this course; `part(u)` is the
// lessons that count here, with `weeks` for each week of the range.
export function courseInsights({ users, part, progressOf, weeks, course }) {
  const progress = users.map(u => ({ u, p: progressOf(u) })).filter(x => x.p)
  const total = progress[0]?.p.total ?? 0
  const shares = progress.map(x => (x.p.total ? x.p.done / x.p.total : 0))
  const buckets = BUCKETS.map(b => ({ ...b, users: shares.filter(b.test).length }))
  const dones = progress.map(x => x.p.done).sort((a, b) => a - b)
  const median = dones.length ? dones[Math.floor((dones.length - 1) / 2)] : 0
  const furthest = dones.length ? dones[dones.length - 1] : 0

  // Lessons by unit: a user's lessons in the dates are the ones just behind where they are now, so they land on the
  // units being taught. Repeats wrap back over what they've done. A course's total is its units (36 for Tier 1,
  // 2026-11-06), about four lessons each. Mock.
  const unitCount = Math.max(1, total)
  const units = Array.from({ length: unitCount }, (_, i) => ({ unit: i + 1, lessons: 0, users: new Set() }))
  progress.forEach(({ u, p }) => {
    const n = part(u).lessons
    const at = Math.max(1, p.done) * LESSONS_PER_UNIT
    for (let k = 0; k < n; k++) {
      const pos = at - (k % at)
      const unit = units[Math.min(unitCount, Math.ceil(pos / LESSONS_PER_UNIT)) - 1]
      unit.lessons += 1
      unit.users.add(u.key)
    }
  })

  const weekly = weeks.map((w, i) => ({
    week: w,
    lessons: users.reduce((sum, u) => sum + (part(u).weeks?.[i] ?? 0), 0),
    users: users.filter(u => (part(u).weeks?.[i] ?? 0) > 0).length,
  }))

  // Users who have completed lessons in each unit (2026-11-06), from the start of the year to the end of the dates:
  // everyone whose progress has reached it.
  const unitUsers = Array.from({ length: unitCount }, (_, i) => ({ unit: i + 1, users: progress.filter(x => x.p.done >= i + 1).length }))

  // The unit view (2026-11-06, from the manager's mock): of the users who have started the course, how many have
  // marked each unit complete. Units, not a furthest unit, since Tier 2 can go in any order.
  const started = progress.filter(x => hasStarted(x.u, x.p))
  const unitRows = Array.from({ length: unitCount }, (_, i) => ({
    unit: i + 1,
    name: course ? unitName(course, i + 1) : `Unit ${i + 1}`,
    // The name without "Unit 2, ", for the table's own number column.
    title: (course ? unitName(course, i + 1) : `Unit ${i + 1}`).replace(/^Unit \d+, /, ''),
    users: started.filter(x => x.p.units?.includes(i + 1)).length,
  }))
  // Five lessons a unit (2026-11-06), "Lesson 1" to "Lesson 5". A unit is complete once all five are, so lesson 5's
  // users are the unit's. Mock: users partway through it (they finished the unit before, or it's the first) have done
  // the earlier lessons, fewer the later.
  // Counted from each user's lessons (2026-11-06, see lessonsDone), so lesson 5's users are the unit's.
  unitRows.forEach(r => {
    r.lessons = Array.from({ length: LESSONS_IN_UNIT }, (_, k) => ({ lesson: k + 1, users: started.filter(x => lessonsDone(x.u, x.p, r.unit) >= k + 1).length }))
  })

  return { total, buckets, median, furthest, users: progress.length, started: started.length, units: units.map(x => ({ ...x, users: x.users.size })), unitUsers, unitRows, weekly }
}

// Horizontal bars with a label and a count on the right, the competency bars' shape in one color.
function BarList({ rows, max, valueText, emptyText }) {
  return (
    <ul className="flex flex-col gap-3 text-sm">
      {rows.map(r => (
        <li key={r.key}>
          <div className="flex items-center justify-between gap-3">
            <span className="text-brand-text truncate">{r.label}</span>
            <span className={`shrink-0 tabular-nums ${r.value ? 'text-brand-text' : 'text-brand-subtext'}`}>{r.value ? valueText(r.value) : emptyText}</span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-brand-bg overflow-hidden" aria-hidden="true">
            <div className="h-full rounded-full bg-dessa-teal" style={{ width: `${max ? (r.value / max) * 100 : 0}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

// Where users are in the course: the typical place and the furthest along as two numbers, then how many users are
// in each quarter of it.
export function ProgressDistribution({ data, action, bare }) {
  const max = Math.max(1, ...data.buckets.map(b => b.users))
  return (
    <Card title="Course progress" action={action} bare={bare}>
      <dl className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <dt className="text-xs text-brand-subtext">Typical user</dt>
          <dd className="mt-0.5 text-lg font-semibold text-brand-text tabular-nums">{data.median} <span className="text-sm font-normal text-brand-subtext">of {data.total} units</span></dd>
        </div>
        <div>
          <dt className="text-xs text-brand-subtext">Most units completed</dt>
          <dd className="mt-0.5 text-lg font-semibold text-brand-text tabular-nums">{data.furthest} <span className="text-sm font-normal text-brand-subtext">of {data.total} units</span></dd>
        </div>
      </dl>
      <BarList rows={data.buckets.map(b => ({ key: b.key, label: b.label, value: b.users }))} max={max} valueText={usersText} emptyText="No users" />
    </Card>
  )
}

// Lessons completed in each unit within the dates. Units nobody has taught yet read "Not yet".
// 36 units don't fit as a list (2026-11-06), so two concepts, picked in the card's header: Columns, one thin column
// per unit with a hover for its numbers, or Grid, a tile per unit shaded by its lessons. Both open with two numbers:
// how many units have lessons, and the unit with the most. The list is kept for courses with few units.
export const UNIT_VIEWS = [
  { value: 'columns', label: 'Columns' },
  { value: 'grid', label: 'Grid' },
  { value: 'list', label: 'List' },
]
// The calendar's four steps of teal; letters stay dark until the full teal, for contrast.
const STEPS = ['bg-dessa-teal/25 text-brand-text', 'bg-dessa-teal/50 text-brand-text', 'bg-dessa-teal/75 text-brand-text', 'bg-dessa-teal text-white']
const stepOf = (n, max) => STEPS[Math.min(STEPS.length - 1, Math.ceil((n / max) * STEPS.length) - 1)]
// Early units read empty in a short range because users finished them before it, so an empty unit says "in these
// dates", not "not yet".
const unitText = u => `Unit ${u.unit}: ${u.lessons ? `${lessonsText(u.lessons)} by ${usersText(u.users)}` : 'no lessons in these dates'}`

function UnitColumns({ units, max }) {
  const every = units.length > 12 ? 5 : 1
  return (
    <Tooltip.Provider delayDuration={100}>
      <ol className="flex items-end gap-1 h-40" aria-label="Lessons completed by unit">
        {units.map(u => (
          <li key={u.unit} className="flex-1 min-w-0 h-full">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button type="button" aria-label={unitText(u)} className="group w-full h-full flex flex-col justify-end rounded-sm cursor-pointer">
                  <span className={`block w-full rounded-t-sm transition-colors ${u.lessons ? 'bg-dessa-teal group-hover:bg-dessa-navy' : 'bg-brand-bg'}`} style={{ height: u.lessons ? `${(u.lessons / max) * 100}%` : 4 }} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content side="top" sideOffset={6} className="z-50 px-3 py-2 rounded-md bg-brand-text text-white text-xs leading-5 shadow-lg">
                  <p className="font-semibold">Unit {u.unit}</p>
                  <p>{u.lessons ? `${lessonsText(u.lessons)}, ${usersText(u.users)}` : 'No lessons in these dates'}</p>
                  <Tooltip.Arrow className="fill-brand-text" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
          </li>
        ))}
      </ol>
      {/* Unit numbers under the columns, every fifth when there are many. */}
      <div className="flex gap-1 mt-2" aria-hidden="true">
        {units.map(u => (
          <span key={u.unit} className="flex-1 min-w-0 text-center text-xs text-brand-subtext tabular-nums">{u.unit === 1 || u.unit % every === 0 ? u.unit : ''}</span>
        ))}
      </div>
      <p className="mt-1 text-xs text-brand-subtext text-center" aria-hidden="true">Unit</p>
    </Tooltip.Provider>
  )
}

function UnitGrid({ units, max }) {
  return (
    <>
      <ol className="grid grid-cols-6 sm:grid-cols-9 lg:grid-cols-12 gap-1.5">
        {units.map(u => (
          <li key={u.unit} title={unitText(u)} aria-label={unitText(u)} className={`flex flex-col justify-between h-14 px-2 py-1.5 rounded-md ${u.lessons ? stepOf(u.lessons, max) : 'bg-brand-bg text-brand-subtext'}`}>
            <span className="text-xs">Unit {u.unit}</span>
            <span className={`text-sm tabular-nums ${u.lessons ? 'font-semibold' : ''}`}>{u.lessons.toLocaleString()}</span>
          </li>
        ))}
      </ol>
      <div className="flex justify-end items-center gap-1.5 mt-3 text-xs text-brand-subtext" aria-hidden="true">
        Fewer lessons
        {STEPS.map(c => <span key={c} className={`inline-block w-3.5 h-3.5 rounded-sm ${c.split(' ')[0]}`} />)}
        More lessons
      </div>
    </>
  )
}

// One thing (2026-11-06): each unit, and how many of the course's users have completed lessons in it. A column per
// unit, its full height every user in the course, with the count on top. The two numbers and the Columns, Grid and
// List views are kept below in UnitLessons.
export function UnitUsers({ data, action, bare }) {
  const all = data.users
  const label = u => `Unit ${u.unit}: ${u.users} of ${usersText(all)}`
  return (
    <Card title="Users who completed lessons in each unit" action={action} bare={bare}>
      <Tooltip.Provider delayDuration={100}>
        <div className="relative">
          {/* A faint line at the top: every user in the course. */}
          <div className="flex items-center gap-2 mb-1 text-xs text-brand-subtext" aria-hidden="true">
            <span className="shrink-0 tabular-nums">All {usersText(all)}</span>
            <span className="flex-1 border-t border-dashed border-brand-border" />
          </div>
          <ol className="flex items-end gap-0.5 sm:gap-1 h-44" aria-label={`Users who completed lessons in each unit, of ${usersText(all)}`}>
            {data.unitUsers.map(u => (
              <li key={u.unit} className="flex-1 min-w-0 h-full">
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <button type="button" aria-label={label(u)} className="group w-full h-full flex flex-col items-center justify-end gap-1 cursor-pointer">
                      <span className="hidden md:block text-xs text-brand-text tabular-nums" aria-hidden="true">{u.users || ''}</span>
                      <span className={`block w-full rounded-t-sm transition-colors ${u.users ? 'bg-dessa-teal group-hover:bg-dessa-navy' : 'bg-brand-bg'}`} style={{ height: u.users ? `${(u.users / Math.max(1, all)) * 85}%` : 4 }} />
                    </button>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content side="top" sideOffset={6} className="z-50 px-3 py-2 rounded-md bg-brand-text text-white text-xs leading-5 shadow-lg">
                      <p className="font-semibold">Unit {u.unit}</p>
                      <p>{u.users ? `${u.users} of ${usersText(all)}` : 'No users yet'}</p>
                      <Tooltip.Arrow className="fill-brand-text" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </li>
            ))}
          </ol>
          <div className="flex gap-0.5 sm:gap-1 mt-2 border-t border-brand-border pt-1.5" aria-hidden="true">
            {data.unitUsers.map(u => (
              <span key={u.unit} className="flex-1 min-w-0 text-center text-xs text-brand-subtext tabular-nums">{u.unit === 1 || u.unit % 5 === 0 ? u.unit : ''}</span>
            ))}
          </div>
          <p className="mt-1 text-xs text-brand-subtext text-center" aria-hidden="true">Unit</p>
        </div>
      </Tooltip.Provider>
    </Card>
  )
}

export function UnitLessons({ data, action, bare, view = 'columns' }) {
  const max = Math.max(1, ...data.units.map(u => u.lessons))
  const reached = data.units.filter(u => u.lessons > 0).length
  const top = data.units.reduce((best, u) => (u.lessons > best.lessons ? u : best), data.units[0])
  return (
    <Card title="Lessons completed by unit" action={action} bare={bare}>
      <dl className="grid grid-cols-2 gap-4 mb-5">
        <div>
          <dt className="text-xs text-brand-subtext">Units with lessons</dt>
          <dd className="mt-0.5 text-lg font-semibold text-brand-text tabular-nums">{reached} <span className="text-sm font-normal text-brand-subtext">of {data.units.length} units</span></dd>
        </div>
        <div>
          <dt className="text-xs text-brand-subtext">Most lessons</dt>
          <dd className="mt-0.5 text-lg font-semibold text-brand-text tabular-nums">{top?.lessons ? <>Unit {top.unit} <span className="text-sm font-normal text-brand-subtext">{lessonsText(top.lessons)}</span></> : <span className="text-sm font-normal text-brand-subtext">No lessons yet</span>}</dd>
        </div>
      </dl>
      {view === 'grid' ? <UnitGrid units={data.units} max={max} />
        : view === 'list' ? <BarList rows={data.units.map(u => ({ key: u.unit, label: `Unit ${u.unit}`, value: u.lessons }))} max={max} valueText={lessonsText} emptyText="None" />
        : <UnitColumns units={data.units} max={max} />}
    </Card>
  )
}

// Unit view (2026-11-06): every unit by name, with the share of users who started the course who completed it.
// Sorts by curriculum order, most completed or least; the first 12 show, the rest behind Show all.
const UNIT_SORTS = [['order', 'Curriculum order'], ['most', 'Most completed'], ['least', 'Least completed']]
const FIRST = 12
// The table's layout (2026-11-06): the standard table, edge to edge; the unit number in its own column so names
// scan; a short bar beside the percent, next to the name; the users count on its own with its base in the header's
// definition; and units nobody has completed read "None yet". The earlier list is kept below as UnitViewList.
// Concept G (2026-11-06): `onNotYet(unit, lesson)` swaps the columns for Finished (bar, percent and count) and Not
// yet, a link that filters the page to the users who haven't finished it; `highlight` marks the unit in the filters.
export function UnitView({ data, action, onNotYet, highlight }) {
  const [sort, setSort] = useState({ key: 'unit', dir: 'asc' })
  const [all, setAll] = useState(false)
  // Each unit row drills down to its lessons (2026-11-06), opened by the triangle beside its number.
  const [open, setOpen] = useState(() => new Set())
  const toggle = unit => setOpen(o => { const next = new Set(o); next.has(unit) ? next.delete(unit) : next.add(unit); return next })
  const n = data.started
  const share = u => (n ? u.users / n : 0)
  const pct = u => `${Math.round(share(u) * 100)}%`
  const rows = [...data.unitRows].sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * (sort.key === 'users' ? a.users - b.users : a.unit - b.unit) || a.unit - b.unit)
  const shown = all ? rows : rows.slice(0, FIRST)
  const onSort = (k, first) => setSort(st => nextSort(st, k, first))
  return (
    <section className="bg-white rounded-lg border border-brand-border overflow-hidden">
      <div className="flex items-center justify-between gap-4 min-h-9 px-5 pt-5 pb-4">
        <h3 className="text-base font-semibold text-brand-text">Unit completion</h3>
        {action}
      </div>
      {!n ? <p className="px-5 pb-5 text-sm text-brand-subtext">No users have started this course yet.</p> : (<>
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {/* The unit's number and name in one column (2026-11-06), sorting by curriculum order. */}
              <TableHead className="pl-5"><SortButton label="Unit" col="unit" sort={sort} onSort={k => onSort(k, 'asc')} /></TableHead>
              {onNotYet ? <>
                <TableHead className="w-96"><SortButton label="Finished" col="users" sort={sort} onSort={k => onSort(k, 'desc')} /></TableHead>
                <TableHead className="w-28 pr-5 text-right">
                  <Defined definition={`Of the ${usersText(n)} who started this course`}>Not yet</Defined>
                </TableHead>
              </> : <>
                <TableHead className="w-80"><SortButton label="Completed" col="users" sort={sort} onSort={k => onSort(k, 'desc')} /></TableHead>
                <TableHead className="w-24 pr-5 text-right">
                  <Defined definition={`Out of the ${usersText(n)} who started this course`}>Users</Defined>
                </TableHead>
              </>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {shown.map(u => {
              const expanded = open.has(u.unit)
              const bar = (users, label, sub) => (users ? (
                <span className="flex items-center gap-3">
                  <span
                    role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={n} aria-valuenow={users} aria-valuetext={`${users} of ${usersText(n)}, ${pct({ users })}`}
                    className={`w-48 shrink-0 ${sub ? 'h-1.5' : 'h-2'} rounded-full bg-brand-bg overflow-hidden`}
                  >
                    <span className="block h-full rounded-full bg-dessa-teal" style={{ width: `${share({ users }) * 100}%` }} />
                  </span>
                  <span className={`w-10 text-right tabular-nums ${sub ? 'text-brand-subtext' : 'font-medium'}`} aria-hidden="true">{pct({ users })}</span>
                  {onNotYet && <span className={`w-12 text-right tabular-nums ${sub ? 'text-brand-subtext' : ''}`}>{users.toLocaleString()}</span>}
                </span>
              ) : <span className="text-brand-subtext">None yet</span>)
              // Not yet links stop the row's toggle, so a click filters instead of opening the lessons.
              const notYet = (users, lesson) => {
                const left = n - users
                if (!left) return <span className="text-brand-subtext">None</span>
                return (
                  <button
                    type="button" onClick={e => { e.stopPropagation(); onNotYet(u.unit, lesson) }}
                    aria-label={`${left} users haven't finished unit ${u.unit}${lesson ? ` lesson ${lesson}` : ''}. Show them`}
                    className="font-semibold text-dessa-teal tabular-nums hover:text-dessa-navy hover:underline underline-offset-4"
                  >{left.toLocaleString()}</button>
                )
              }
              return (
                <Fragment key={u.unit}>
                  {/* The whole row opens it (2026-11-06). The button inside carries focus and the open state for the
                      keyboard and screen readers; its click bubbles up to the row, so it toggles once. */}
                  <TableRow onClick={() => toggle(u.unit)} className={`cursor-pointer hover:bg-brand-bg/60 ${highlight === u.unit ? 'bg-dessa-teal/5' : ''}`}>
                    <TableCell className="pl-3 py-1.5 max-w-0 w-full">
                      <button
                        type="button" aria-expanded={expanded} aria-controls={`unit-${u.unit}-lessons`} title={u.name}
                        className="w-full flex items-center gap-2 min-w-0 h-8 px-2 rounded-md text-left"
                      >
                        {/* A small filled teal triangle, turning down when open. */}
                        <svg viewBox="0 0 8 8" className={`w-2.5 h-2.5 shrink-0 fill-dessa-teal transition-transform ${expanded ? 'rotate-90' : ''}`} aria-hidden="true"><path d="M2 0.5 L7 4 L2 7.5 Z" /></svg>
                        <span className="w-6 shrink-0 text-right tabular-nums text-brand-subtext">{u.unit}</span>
                        <span className="truncate">{u.title}</span>
                      </button>
                    </TableCell>
                    <TableCell className="py-1.5">{bar(u.users, `Unit ${u.unit}, users who completed it`)}</TableCell>
                    <TableCell className="pr-5 py-1.5 text-right tabular-nums">{onNotYet ? notYet(u.users) : u.users ? u.users : ''}</TableCell>
                  </TableRow>
                  {expanded && u.lessons.map(l => (
                    <TableRow key={l.lesson} id={l.lesson === 1 ? `unit-${u.unit}-lessons` : undefined} className="hover:bg-transparent bg-brand-bg/40">
                      {/* Lined up under the unit's name: the triangle's and number's space, then the lesson. */}
                      <TableCell className="pl-3 py-2 max-w-0 w-full">
                        <span className="flex items-center gap-2 min-w-0 px-2">
                          <span className="w-2.5 shrink-0" aria-hidden="true" />
                          <span className="w-6 shrink-0" aria-hidden="true" />
                          <span className="truncate text-brand-subtext">Lesson {l.lesson}</span>
                        </span>
                      </TableCell>
                      <TableCell className="py-2">{bar(l.users, `Unit ${u.unit} lesson ${l.lesson}, users who completed it`, true)}</TableCell>
                      <TableCell className="pr-5 py-2 text-right tabular-nums text-brand-subtext">{onNotYet ? notYet(l.users, l.lesson) : l.users ? l.users : ''}</TableCell>
                    </TableRow>
                  ))}
                </Fragment>
              )
            })}
          </TableBody>
        </Table>
        {rows.length > FIRST && (
          <div className="px-5 py-3 border-t border-brand-border">
            <button type="button" onClick={() => setAll(a => !a)} className="inline-flex items-center gap-1.5 text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4">
              {all ? 'Show fewer units' : `Show all ${rows.length} units`}
            </button>
          </div>
        )}
      </>)}
    </section>
  )
}

/* The list version, before the table layout (2026-11-06):
export function UnitView({ data, action, bare }) {
  // Sortable headers (2026-11-06) in place of the Curriculum order, Most completed and Least completed buttons:
  // Unit sorts by curriculum order, the users column by how many completed it.
  const [sort, setSort] = useState({ key: 'unit', dir: 'asc' })
  const [all, setAll] = useState(false)
  const n = data.started
  const share = u => (n ? u.users / n : 0)
  const rows = [...data.unitRows].sort((a, b) => (sort.dir === 'asc' ? 1 : -1) * (sort.key === 'users' ? a.users - b.users : a.unit - b.unit) || a.unit - b.unit)
  const shown = all ? rows : rows.slice(0, FIRST)
  const most = [...data.unitRows].sort((a, b) => b.users - a.users || a.unit - b.unit)[0]
  const least = [...data.unitRows].sort((a, b) => a.users - b.users || b.unit - a.unit)[0]
  const pct = u => `${Math.round(share(u) * 100)}%`
  const stat = (label, u) => (
    <div className="min-w-0">
      <dt className="text-xs text-brand-subtext">{label}</dt>
      <dd className="mt-0.5 text-sm font-semibold text-brand-text truncate" title={u.name}>{u.name}</dd>
      <dd className="text-xs text-brand-subtext tabular-nums">{u.users} of {usersText(n)}, {pct(u)}</dd>
    </div>
  )
  return (
    <Card title="Unit completion" action={action} bare={bare}>
      {!n ? <p className="text-sm text-brand-subtext">No users have started this course yet.</p> : (<>
        {/* The three numbers came off 2026-11-06; the table carries it.
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
          <div>
            <dt className="text-xs text-brand-subtext">Users who started</dt>
            <dd className="mt-0.5 text-lg font-semibold text-brand-text tabular-nums">{n} <span className="text-sm font-normal text-brand-subtext">of {usersText(data.users)}</span></dd>
          </div>
          {stat('Most completed', most)}
          {stat('Least completed', least)}
        </dl> * /}
        {/* <div role="group" aria-label="Sort units" className="inline-flex items-center gap-0.5 p-0.5 mb-3 rounded-md border border-brand-border bg-brand-bg">
          {UNIT_SORTS.map(([k, label]) => (
            <button
              key={k} type="button" aria-pressed={sort === k} onClick={() => setSort(k)}
              className={`inline-flex items-center h-8 px-3 rounded text-sm whitespace-nowrap transition-colors ${sort === k ? 'bg-white border border-brand-border font-medium text-brand-text' : 'border border-transparent text-brand-subtext hover:text-brand-text'}`}
            >{label}</button>
          ))}
        </div> * /}
        {/* The table's header row, like the report's lists: on brand-bg, edge to edge. * /}
        <div className="flex items-center gap-4 -mx-5 px-5 py-2.5 border-y border-brand-border bg-brand-bg text-sm">
          <span className="w-2/5 min-w-0"><SortButton label="Unit" col="unit" sort={sort} onSort={k => setSort(st => nextSort(st, k, 'asc'))} /></span>
          <span className="flex-1 flex justify-end"><SortButton label="Users who completed it" col="users" sort={sort} onSort={k => setSort(st => nextSort(st, k, 'desc'))} align="right" /></span>
        </div>
        <ol className="divide-y divide-brand-border">
          {shown.map(u => (
            <li key={u.unit} className="flex items-center gap-4 py-2.5 text-sm">
              <span className="w-2/5 min-w-0 truncate text-brand-text" title={u.name}>{u.name}</span>
              <span
                role="progressbar" aria-label={`${u.name}, users who completed it`} aria-valuemin={0} aria-valuemax={n} aria-valuenow={u.users} aria-valuetext={`${u.users} of ${usersText(n)}, ${pct(u)}`}
                className="flex-1 h-2 rounded-full bg-brand-bg overflow-hidden"
              >
                <span className="block h-full rounded-full bg-dessa-teal" style={{ width: `${share(u) * 100}%` }} />
              </span>
              <span className="w-24 shrink-0 text-right tabular-nums" aria-hidden="true">
                <span className="font-semibold text-brand-text">{pct(u)}</span> <span className="text-xs text-brand-subtext">{u.users} of {n}</span>
              </span>
            </li>
          ))}
        </ol>
        {rows.length > FIRST && (
          <button type="button" onClick={() => setAll(a => !a)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4">
            {all ? 'Show fewer units' : `Show all ${rows.length} units`}
          </button>
        )}
      </>)}
    </Card>
  )
}

*/

// Lessons completed each week of the dates, as columns with the count on top.
export function WeeklyLessons({ data, action, bare }) {
  const max = Math.max(1, ...data.weekly.map(w => w.lessons))
  return (
    <Card title="Lessons completed by week" action={action} bare={bare}>
      <ol className="flex items-end gap-2 h-48" aria-label={`Lessons completed by week: ${data.weekly.map(w => `week of ${format(parseISO(w.week), 'MMM d')}, ${lessonsText(w.lessons)}`).join('; ')}`}>
        {data.weekly.map((w, i) => (
          <li key={w.week} className="flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-1.5" aria-hidden="true">
            <span className="text-xs font-medium text-brand-text tabular-nums">{w.lessons.toLocaleString()}</span>
            <span className="w-full max-w-12 rounded-t bg-dessa-teal" style={{ height: `${(w.lessons / max) * 70}%`, minHeight: w.lessons ? 2 : 0 }} />
            {/* Past eight weeks, every other date, so they don't crowd. */}
            <span className="text-xs text-brand-subtext whitespace-nowrap">{data.weekly.length <= 8 || i % 2 === 0 ? format(parseISO(w.week), 'MMM d') : '\u00a0'}</span>
          </li>
        ))}
      </ol>
    </Card>
  )
}
