import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { parseISO, addDays, format } from 'date-fns'
import { ArrowRight, Check, ChevronDown, ChevronRight, Download, MoreHorizontal, Printer } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import * as Popover from '@radix-ui/react-popover'
import { schools, PAST_WEEKS } from '../lib/report2Data'
import { ALL_COURSES, COMPETENCIES, COURSE_TYPES, BANDS_ORDER, TIER2_BANDS, bandOf, pace, contentData, gradeLabel, gradePath, teachesCourse, coursePart, teachesType, typePart } from '../lib/contentReportData'
import { useContentConcept } from '../lib/contentConceptContext'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { PaginationBar } from '../components/ui/pagination'
import FiltersPanel, { MultiSelect, Select } from '../components/engagement/FiltersPanel'
import PrintReport from '../components/engagement/PrintReport'
import CompetencyMix from '../components/content/CompetencyMix'
import CompetencyMixOriginal from '../components/content/CompetencyMixOriginal'
import { useRole } from '../lib/roleContext'
import { FIRST_DATE, LAST_DATE, rangeLabel, weeksForDates, SortButton, nextSort, SearchField, agoRank } from './Report2ConceptE'

// Content report (2026-10-26): "What are we teaching?" Replaces the legacy Content Overview's four charts
// (lessons per course by school, competencies per day, competencies per user, Power of Pause) and the legacy
// Extra Courses tab (now the Course type filter), in the Engagement report's shell: Filters, a few headline
// numbers, Courses | Competencies tabs, then a users table. Every user type counts.

const toKey = d => format(d, 'yyyy-MM-dd')
const FILTER_MIN = toKey(FIRST_DATE)
const FILTER_MAX = toKey(LAST_DATE)
// No Family users on this report (2026-11-02), so no Family user role in its filter.
// Three roles, in this order (2026-11-03): no Family users, and School Support reads as Educator.
// Was USER_ROLES (report2Data.js) without Family User.
const CONTENT_ROLES = ['Program Admin', 'Site Leader', 'Educator']
// Role and Course type are lists (2026-11-03), multi select like Site; empty means all.
export const DEFAULT_FILTERS = { site: [], role: [], type: [], start: PAST_WEEKS[Math.max(0, PAST_WEEKS.length - 4)], end: FILTER_MAX }
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)
export const LESSON_DEFINITION = 'A lesson counts once it is marked complete or 60% of its video is watched.'

export function download(name, header, rows) {
  const q = v => `"${String(v).replace(/"/g, '""')}"`
  const url = URL.createObjectURL(new Blob([[header, ...rows].map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

// A metric name with its definition on hover and focus (2026-10-26), instead of a caption under it.
export function Defined({ children, definition }) {
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button type="button" className="text-left underline decoration-dotted decoration-brand-subtext/60 underline-offset-4 cursor-help rounded-sm">{children}</button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="top" sideOffset={6} className="z-50 max-w-64 px-2.5 py-1.5 rounded-md bg-brand-text text-white text-xs leading-5 shadow-lg">
            {definition}
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

export function Stat({ label, value, note }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-4">
      <p className="text-sm text-brand-subtext">{label}</p>
      <p className="text-2xl font-semibold text-brand-text tabular-nums mt-1">{value}</p>
      {note && <p className="text-xs text-brand-subtext mt-0.5">{note}</p>}
    </div>
  )
}

export function EmptyState() {
  return (
    <div className="py-12 text-center">
      <p className="text-sm font-semibold text-brand-text">No lessons in these dates yet</p>
      <p className="text-sm text-brand-subtext mt-1">Try a wider date range, or another site or course type.</p>
    </div>
  )
}

// ─── Courses tab ──────────────────────────────────────────────────────────────

const sortCourses = (rows, sort) => [...rows].sort((a, b) => {
  const dir = sort.dir === 'asc' ? 1 : -1
  if (sort.key === 'name') return dir * a.course.title.localeCompare(b.course.title)
  if (sort.key === 'users') return dir * (a.users.length - b.users.length)
  if (sort.key === 'progress') return dir * (a.progress - b.progress)
  return dir * (a.lessons - b.lessons)
})

// One row per course, most taught first, with an inline bar against the top course. A row opens the users taking it.
function CoursesTable({ rows, sort, onSortChange, oneSite }) {
  const [openId, setOpenId] = useState(null)
  const max = Math.max(1, ...rows.map(r => r.lessons))
  const sorted = useMemo(() => sortCourses(rows, sort), [rows, sort])
  const onSort = (k, first = 'desc') => onSortChange(s => nextSort(s, k, first))

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><SortButton label="Course" col="name" sort={sort} onSort={k => onSort(k, 'asc')} /></TableHead>
          <TableHead className="w-[38%]"><SortButton label="Lessons completed" col="lessons" sort={sort} onSort={onSort} /></TableHead>
          <TableHead className="w-28 text-right"><SortButton label="Users" col="users" sort={sort} onSort={onSort} align="right" /></TableHead>
          <TableHead className="w-44 text-right"><SortButton label="Course progress" col="progress" sort={sort} onSort={onSort} align="right" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map(r => {
          const open = openId === r.course.id
          return (
            <Fragment key={r.course.id}>
              <TableRow onClick={() => setOpenId(open ? null : r.course.id)} className="cursor-pointer">
                <TableCell>
                  <button type="button" aria-expanded={open} className="flex items-center gap-2 text-left">
                    <ChevronRight size={14} className={`shrink-0 text-brand-subtext transition-transform ${open ? 'rotate-90' : ''}`} aria-hidden="true" />
                    <span className="min-w-0">
                      <span className="block font-medium text-brand-text">{r.course.title}</span>
                      <span className="block text-xs text-brand-subtext">{r.course.typeLabel} · {r.course.grade}</span>
                    </span>
                  </button>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <span className="w-12 shrink-0 tabular-nums text-brand-text">{r.lessons.toLocaleString()}</span>
                    <span className="flex-1 h-2 rounded-full bg-brand-bg overflow-hidden" aria-hidden="true">
                      <span className="block h-full rounded-full bg-dessa-teal" style={{ width: `${(r.lessons / max) * 100}%` }} />
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right tabular-nums">{r.users.length}</TableCell>
                <TableCell className="text-right tabular-nums">{r.progress}%</TableCell>
              </TableRow>
              {open && (
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={4} className="pl-10 py-3 bg-brand-bg/50">
                    <p className="text-xs font-medium text-brand-subtext mb-2">Users taking {r.course.title}</p>
                    <ul className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-x-6 gap-y-1.5">
                      {[...r.users].sort((a, b) => b.lessons - a.lessons).map(u => (
                        <li key={u.key} className="flex items-baseline justify-between gap-3 min-w-0">
                          <span className="min-w-0 truncate text-brand-text">{u.name}{!oneSite && <span className="text-brand-subtext"> · {u.sc.name}</span>}</span>
                          <span className="shrink-0 tabular-nums text-brand-subtext">{u.lessons}</span>
                        </li>
                      ))}
                    </ul>
                  </TableCell>
                </TableRow>
              )}
            </Fragment>
          )
        })}
      </TableBody>
    </Table>
  )
}

// ─── Courses tab, concept B: grade band cards ────────────────────────────────

// Where a course's classes are (2026-10-27): a track for the whole course, a light band for the middle half of its
// classes, and a dot at the typical class. Read only, no pacing target.
function PaceTrack({ low, typical, high, total }) {
  const at = u => ((u - 0.5) / total) * 100
  return (
    <span className="relative block h-1.5 rounded-full bg-brand-bg" aria-hidden="true">
      <span className="absolute inset-y-0 rounded-full bg-dessa-teal/25" style={{ left: `${((low - 1) / total) * 100}%`, width: `${((high - low + 1) / total) * 100}%` }} />
      <span className="absolute top-1/2 w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-dessa-teal ring-2 ring-white" style={{ left: `${at(typical)}%` }} />
    </span>
  )
}

const courseGrade = c => (c.type === 'adult' ? 'Adults' : c.type === 'core' ? c.grade : c.grade.replace('Elementary', 'elementary').replace('School', 'school'))

// One card per grade band (Elementary, Middle school, High school, Tier 2, Adult wellness, Family), each leading with
// where its classes typically are, then every course in grade order with its own pace.
function BandCards({ rows }) {
  const bands = BANDS_ORDER
    .map(name => {
      const courses = rows.filter(r => bandOf(r.course) === name).sort((a, b) => a.course.id - b.course.id)
      const users = courses.flatMap(r => r.users)
      return { name, courses, users, lessons: courses.reduce((sum, r) => sum + r.lessons, 0), total: courses[0]?.course.lessons, ...pace(users) }
    })
    .filter(b => b.courses.length)
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 items-start">
      {bands.map(b => (
        <section key={b.name} aria-label={b.name} className="bg-white rounded-lg border border-brand-border p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <h3 className="text-base font-semibold text-brand-text">{b.name}</h3>
              <p className="text-sm text-brand-subtext mt-0.5 tabular-nums">
                {b.courses.length} {b.courses.length === 1 ? 'course' : 'courses'} · {b.users.length.toLocaleString()} users · {b.lessons.toLocaleString()} lessons
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-xs font-medium text-brand-subtext">Typical class</p>
              <p className="text-lg font-semibold text-brand-text tabular-nums leading-tight">Unit {b.unitTypical} <span className="text-sm font-normal text-brand-subtext">of {b.total}</span></p>
            </div>
          </div>
          <ul className="mt-4 pt-4 border-t border-brand-border flex flex-col gap-4">
            {b.courses.map(r => (
              <li key={r.course.id} className="min-w-0">
                <div className="flex items-baseline justify-between gap-3 mb-2 text-sm">
                  <span className="min-w-0 truncate">
                    <span className="text-brand-subtext">{courseGrade(r.course)}</span>
                    {/* Only core courses add a title; Tier 2 and Family titles just repeat the band and grade. */}
                    {r.course.type === 'core' && <span className="font-medium text-brand-text"> · {r.course.title}</span>}
                  </span>
                  <span className="shrink-0 tabular-nums text-brand-text">
                    Unit {r.unitTypical} <span className="text-brand-subtext">of {r.course.lessons}</span>
                  </span>
                </div>
                <PaceTrack low={r.unitLow} typical={r.unitTypical} high={r.unitHigh} total={r.course.lessons} />
                <span className="sr-only">Most classes are on units {r.unitLow} to {r.unitHigh}. {r.users.length} users, {r.lessons} lessons.</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

// ─── Courses tab, concept C: one row per grade, opening its grade page ──────

// The two rows per grade table, commented out 2026-11-02 for one row per grade with a column per tier (below).
// // Two rows per grade (2026-10-29), Tier 1 and Tier 2, each with its lessons completed. Styled like the Engagement
// // users table: edge to edge in its card, one line per row, and the grade is the link, like a user's name.
// function GradeTable({ rows }) {
//   const [sort, setSort] = useState({ key: 'grade', dir: 'asc' })
//   const onSort = (k, first = 'asc') => setSort(s => nextSort(s, k, first))
//   const sorted = useMemo(() => [...rows].sort((a, b) => {
//     const dir = sort.dir === 'asc' ? 1 : -1
//     if (sort.key === 'lessons') return dir * (a.lessons - b.lessons) || a.g - b.g || a.tier - b.tier
//     if (sort.key === 'tier') return dir * (a.tier - b.tier) || a.g - b.g
//     return dir * (a.g - b.g) || a.tier - b.tier
//   }), [rows, sort])
//   return (
//     <div className="bg-white rounded-lg border border-brand-border overflow-hidden [&_td]:text-[13px]">
//       {sorted.length ? (
//         <Table>
//           <TableHeader>
//             <TableRow>
//               <TableHead className="text-[13px] font-medium"><SortButton label="Grade" col="grade" sort={sort} onSort={onSort} /></TableHead>
//               <TableHead className="text-[13px] font-medium w-40"><SortButton label="Tier" col="tier" sort={sort} onSort={onSort} /></TableHead>
//               <TableHead className="text-[13px] font-medium w-48 text-right"><SortButton label="Lessons completed" col="lessons" sort={sort} onSort={k => onSort(k, 'desc')} align="right" /></TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             {sorted.map(r => (
//               <TableRow key={r.key} className="hover:bg-transparent">
//                 <TableCell className="font-medium">
//                   <Link to={gradePath(r.g, r.tier)} className="text-dessa-teal hover:underline underline-offset-4">{gradeLabel(r.g)}</Link>
//                 </TableCell>
//                 <TableCell className="text-brand-subtext">Tier {r.tier}</TableCell>
//                 <TableCell className="text-right tabular-nums">{r.lessons.toLocaleString()}</TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       ) : <EmptyState />}
//     </div>
//   )
// }

// One row per grade (2026-11-02), with a column per tier and a total, replacing two rows per grade. The columns stay
// put whatever the filters say: a tier the filters leave out is left blank, not 0, so it can't read as
// "none taught". The grade opens its page with both tiers, where a switch narrows it to one.
function TierCell({ n }) {
  return n == null
    ? <TableCell className="text-right"><span className="sr-only">Not in these filters</span></TableCell>
    : <TableCell className="text-right tabular-nums">{n.toLocaleString()}</TableCell>
}

// `bare` drops the table's own card, for concept C's shared card with the competency donut (2026-11-02).
function GradeTable({ rows, bare = false }) {
  const [sort, setSort] = useState({ key: 'grade', dir: 'asc' })
  const onSort = (k, first = 'asc') => setSort(s => nextSort(s, k, first))
  const grades = useMemo(() => {
    const byG = new Map()
    rows.forEach(r => {
      const row = byG.get(r.g) ?? { g: r.g, t1: null, t2: null }
      row[`t${r.tier}`] = r.lessons
      byG.set(r.g, row)
    })
    return [...byG.values()].filter(r => r.t1 != null).map(r => ({ ...r, total: (r.t1 ?? 0) + (r.t2 ?? 0) }))
  }, [rows])
  const sorted = useMemo(() => [...grades].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.key === 'grade') return dir * (a.g - b.g)
    return dir * ((a[sort.key] ?? -1) - (b[sort.key] ?? -1)) || a.g - b.g
  }), [grades, sort])
  const num = (label, col) => (
    <TableHead className="text-[13px] font-medium w-48 text-right"><SortButton label={label} col={col} sort={sort} onSort={k => onSort(k, 'desc')} align="right" /></TableHead>
  )
  return (
    <div className={`${bare ? '' : 'bg-white rounded-lg border border-brand-border overflow-hidden '}[&_td]:text-[13px]`}>
      {sorted.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[13px] font-medium"><SortButton label="Grade" col="grade" sort={sort} onSort={onSort} /></TableHead>
              {num('Lessons completed', 't1')}
              {/* Tier 2 out of the table (2026-11-02): it's built by band, not grade. Total went with it, since it
                  would only repeat Tier 1. */}
              {/* {num('Tier 2', 't2')} */}
              {/* {num('Total', 'total')} */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(r => (
              <TableRow key={r.g} className="hover:bg-transparent">
                <TableCell className="font-medium">
                  <Link to={gradePath(r.g, 1)} className="text-dessa-teal hover:underline underline-offset-4">{gradeLabel(r.g)}</Link>
                </TableCell>
                <TierCell n={r.t1} />
                {/* <TierCell n={r.t2} /> */}
                {/* <TableCell className="text-right tabular-nums font-medium">{r.total.toLocaleString()}</TableCell> */}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : <EmptyState />}
    </div>
  )
}

// Concept C's Tier 2 and Adult wellness tabs (2026-11-02): one row per course, styled like the grade table. Tier 2
// rows are its four bands. `rows` is [{ key, name, to, lessons, order }].
function CourseTable({ label, rows }) {
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const onSort = (k, first = 'asc') => setSort(s => nextSort(s, k, first))
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    return sort.key === 'lessons' ? dir * (a.lessons - b.lessons) || a.order - b.order : dir * (a.order - b.order)
  }), [rows, sort])
  return (
    <div className="bg-white rounded-lg border border-brand-border overflow-hidden [&_td]:text-[13px]">
      {sorted.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[13px] font-medium"><SortButton label={label} col="name" sort={sort} onSort={onSort} /></TableHead>
              <TableHead className="text-[13px] font-medium w-48 text-right"><SortButton label="Lessons completed" col="lessons" sort={sort} onSort={k => onSort(k, 'desc')} align="right" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(r => (
              <TableRow key={r.key} className="hover:bg-transparent">
                <TableCell className="font-medium"><Link to={r.to} className="text-dessa-teal hover:underline underline-offset-4">{r.name}</Link></TableCell>
                <TableCell className="text-right tabular-nums">{r.lessons.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : <EmptyState />}
    </div>
  )
}

const C_TABS = [['core', 'Tier 1'], ['tier2', 'Tier 2'], ['adult', 'Adult wellness']]

// Concept C's list card (2026-11-02), replacing its tables so it matches the Competencies covered card beside it: a
// title with a control on the right, then the body. Rows are a plain list, the whole row a link; sorting moves from
// the column headers to a Sort dropdown. `rows` is [{ key, name, to, lessons, order }]; `orderLabel` names the
// natural order (Grade, Band or Course).
function SortSelect({ value, options, onChange }) {
  const [open, setOpen] = useState(false)
  const current = options.find(o => o.value === value) ?? options[0]
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" aria-label={`Sort by ${current.label}`} className="inline-flex items-center gap-2 h-9 px-3 rounded-md border border-brand-border bg-white text-sm text-brand-text whitespace-nowrap shrink-0 hover:bg-brand-bg transition-colors">
          <span className="text-brand-subtext">Sort:</span> {current.label}
          <ChevronDown size={16} className="text-brand-subtext" aria-hidden="true" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content align="end" sideOffset={6} className="z-50 w-44 bg-white border border-brand-border rounded-lg shadow-lg outline-none py-1">
          <div role="listbox" aria-label="Sort by">
            {options.map(o => (
              <button
                key={o.value} type="button" role="option" aria-selected={o.value === value}
                onClick={() => { onChange(o.value); setOpen(false) }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-brand-bg ${o.value === value ? 'text-dessa-teal font-medium' : 'text-brand-text'}`}
              >
                {o.label}
                {o.value === value && <Check size={14} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// `groups` (2026-11-02) is [{ label, rows }] for one list split by course type, each sorted on its own; a label shows
// only when there's more than one group.
// `columns` (concept E, 2026-11-03) swaps the Sort dropdown for a header row naming both columns; each header sorts,
// within each group, like a table's.
// `action` (2026-11-03) sits at the header's right, for the card's own Export CSV.
function ListCard({ title, orderLabel, rows, groups, columns, action }) {
  const [sort, setSort] = useState('order')
  const [colSort, setColSort] = useState({ key: 'order', dir: 'asc' })
  const sets = useMemo(() => (groups ?? [{ label: null, rows }]).filter(g => g.rows.length)
    .map(g => ({ ...g, rows: [...g.rows].sort((a, b) => {
      if (columns) {
        const dir = colSort.dir === 'asc' ? 1 : -1
        return colSort.key === 'lessons' ? dir * (a.lessons - b.lessons) || a.order - b.order : dir * (a.order - b.order)
      }
      return (sort === 'lessons' ? b.lessons - a.lessons : 0) || a.order - b.order
    }) })), [groups, rows, sort, columns, colSort])
  const labelled = sets.length > 1
  const row = r => (
    <li key={r.key}>
      <Link to={r.to} className="group flex items-center justify-between gap-4 px-5 py-2.5 text-sm hover:bg-brand-bg/60 transition-colors focus-visible:outline-none focus-visible:bg-brand-bg/60">
        <span className="font-medium text-dessa-teal group-hover:underline underline-offset-4 truncate">{r.name}</span>
        <span className="tabular-nums text-brand-text">{r.lessons.toLocaleString()}</span>
      </Link>
    </li>
  )
  return (
    <section className="bg-white rounded-lg border border-brand-border overflow-hidden">
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center justify-between gap-4 min-h-9">
          <h3 className="text-base font-semibold text-brand-text">{title}</h3>
          {!columns && <SortSelect value={sort} onChange={setSort} options={[{ value: 'order', label: orderLabel }, { value: 'lessons', label: 'Most lessons' }]} />}
          {action}
        </div>
      </div>
      {columns && sets.length > 0 && (
        <div className="flex items-center justify-between gap-4 px-5 py-2.5 border-t border-brand-border bg-brand-bg text-sm">
          <SortButton label={columns[0]} col="order" sort={colSort} onSort={k => setColSort(st => nextSort(st, k, 'asc'))} />
          <SortButton label={columns[1]} col="lessons" sort={colSort} onSort={k => setColSort(st => nextSort(st, k, 'desc'))} align="right" />
        </div>
      )}
      {sets.length ? (
        <div className="border-t border-brand-border divide-y divide-brand-border">
          {sets.map(g => (
            <section key={g.label ?? 'all'} aria-label={g.label ?? undefined}>
              {labelled && <h4 className="px-5 py-2 bg-brand-bg/[0.44] border-b border-brand-border text-xs font-medium text-brand-subtext">{g.label}</h4>}
              <ul className="divide-y divide-brand-border">{g.rows.map(row)}</ul>
            </section>
          ))}
        </div>
      ) : <EmptyState />}
    </section>
  )
}

// Concepts F, G and H (band sections, course type buttons over tile cards, and a card per grade) deleted 2026-11-03.
// Tier 2 bands and courses read in sentence case: "Early elementary".
const levelName = t => t.charAt(0) + t.slice(1).toLowerCase()

// ─── Competencies tab ─────────────────────────────────────────────────────────

const weekLabel = w => {
  const s = parseISO(w)
  const e = addDays(s, 4)
  return `${format(s, 'MMM d')} to ${format(e, s.getMonth() === e.getMonth() ? 'd' : 'MMM d')}`
}
const breakdown = comps => COMPETENCIES.filter(c => comps[c.key]).map(c => `${c.label} ${comps[c.key].toLocaleString()}`).join(', ')

// Lessons per week, stacked by competency, first competency at the bottom (the legend, stack and readout share
// one order). Each bar is a button (2026-10-26): hover, focus or tap shows that week in the readout, which is a
// live region, and otherwise shows the whole range. 1px gaps keep neighbouring colors apart.
function CompetencyChart({ weekly, totals, range }) {
  const [active, setActive] = useState(null)
  const max = Math.max(1, ...weekly.map(w => w.total))
  const ticks = [max, Math.round(max / 2), 0]
  const h = active == null
    ? { label: range, comps: totals, total: Object.values(totals).reduce((a, b) => a + b, 0) }
    : { ...weekly[active], label: `Week of ${weekLabel(weekly[active].week)}` }
  return (
    <div>
      <div aria-live="polite" className="min-h-10 mb-3 text-sm">
        <p className="font-medium text-brand-text">{h.label} · {h.total.toLocaleString()} lessons</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-brand-subtext">
          {COMPETENCIES.map(c => (
            <li key={c.key} className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ background: c.color }} aria-hidden="true" />
              {c.label} <span className="tabular-nums text-brand-text">{(h.comps[c.key] ?? 0).toLocaleString()}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex gap-2">
        <div className="flex flex-col justify-between h-48 text-xs text-brand-subtext tabular-nums text-right w-8 -mt-1.5" aria-hidden="true">
          {ticks.map((t, i) => <span key={i}>{t.toLocaleString()}</span>)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="relative h-48 border-b border-brand-border" onMouseLeave={() => setActive(null)}>
            <div className="absolute inset-x-0 top-0 border-t border-dashed border-brand-border" aria-hidden="true" />
            <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-brand-border" aria-hidden="true" />
            <div className="relative flex items-end gap-1.5 h-full">
              {weekly.map((w, i) => (
                <button
                  key={w.week}
                  type="button"
                  onMouseEnter={() => setActive(i)}
                  onFocus={() => setActive(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => setActive(a => (a === i ? null : i))}
                  aria-label={`Week of ${weekLabel(w.week)}, ${w.total.toLocaleString()} lessons${w.total ? `: ${breakdown(w.comps)}` : ''}`}
                  className={`flex-1 h-full flex flex-col-reverse gap-px rounded-t-sm transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-dessa-teal focus-visible:ring-offset-2 ${active != null && active !== i ? 'opacity-40' : ''}`}
                >
                  {COMPETENCIES.map(c => w.comps[c.key] > 0 && (
                    <span key={c.key} style={{ height: `${(w.comps[c.key] / max) * 100}%`, background: c.color }} className="block w-full last:rounded-t-sm" />
                  ))}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-1.5 mt-1.5 text-xs text-brand-subtext" aria-hidden="true">
            {weekly.map((w, i) => (
              <span key={w.week} className="flex-1 text-center truncate">{i === 0 || parseISO(w.week).getDate() <= 7 ? format(parseISO(w.week), 'MMM d') : ''}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// Competencies over time (2026-10-28), in place of the stacked weekly chart: one small card per competency with its
// share, its lessons and a weekly bar chart in its own color. Every card shares one scale, so a taller bar means
// more lessons wherever it is. Cards run in the same order as the 100% bar above them, largest share first.
function CompetencyTrends({ weekly, totals }) {
  const sum = Object.values(totals).reduce((a, b) => a + b, 0)
  const max = Math.max(1, ...weekly.flatMap(w => COMPETENCIES.map(c => w.comps[c.key])))
  const cards = COMPETENCIES.map(c => ({ ...c, n: totals[c.key] })).filter(c => c.n > 0).sort((a, b) => b.n - a.n)
  const many = weekly.length > 12
  // Name every week up to six weeks; past that, the first week and each new month, so labels never crowd.
  const tick = (w, i) => (weekly.length <= 6 || i === 0 || parseISO(w.week).getDate() <= 7 ? format(parseISO(w.week), 'MMM d') : '')
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {cards.map(c => (
        <section key={c.key} aria-label={c.label} className="bg-white rounded-lg border border-brand-border p-4 min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <h4 className="text-sm font-medium text-brand-text truncate">{c.label}</h4>
            <span className="text-lg font-semibold text-brand-text tabular-nums">{pct(c.n, sum)}%</span>
          </div>
          <p className="text-xs text-brand-subtext tabular-nums">{c.n.toLocaleString()} lessons</p>
          <div
            role="img"
            aria-label={`${c.label} lessons by week: ${weekly.map(w => `week of ${weekLabel(w.week)}, ${w.comps[c.key]}`).join('; ')}`}
            className={`flex items-end h-20 mt-4 border-b border-brand-border ${many ? 'gap-px' : 'gap-1.5'}`}
          >
            {weekly.map(w => (
              <span
                key={w.week}
                title={`Week of ${weekLabel(w.week)}: ${w.comps[c.key].toLocaleString()} lessons`}
                className="flex-1 rounded-t-sm"
                style={{ height: `${(w.comps[c.key] / max) * 100}%`, background: c.color }}
              />
            ))}
          </div>
          <div className={`flex mt-1.5 text-xs text-brand-subtext ${many ? 'gap-px' : 'gap-1.5'}`} aria-hidden="true">
            {weekly.map((w, i) => <span key={w.week} className="flex-1 min-w-0 text-center whitespace-nowrap overflow-visible">{tick(w, i)}</span>)}
          </div>
        </section>
      ))}
    </div>
  )
}

// Each competency's share of the lessons in the range, most covered first. No "least covered" call out
// (2026-10-26): the ranked list already shows it, and naming a last place reads like a grade.
export function Coverage({ totals }) {
  const sum = Object.values(totals).reduce((a, b) => a + b, 0)
  const rows = COMPETENCIES.map(c => ({ ...c, n: totals[c.key] })).sort((a, b) => b.n - a.n)
  return (
    <ul className="flex flex-col gap-3">
      {rows.map(c => (
        <li key={c.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-brand-text">{c.label}</span>
            <span className="tabular-nums text-brand-subtext">{pct(c.n, sum)}%</span>
          </div>
          <span className="block h-2 mt-1 rounded-full bg-brand-bg overflow-hidden" aria-hidden="true">
            <span className="block h-full rounded-full" style={{ width: `${pct(c.n, sum)}%`, background: c.color }} />
          </span>
        </li>
      ))}
    </ul>
  )
}

// ─── Users table ──────────────────────────────────────────────────────────────

// `linkState` rides along to the user page, so its breadcrumb can lead back to the page it was opened from.
// Lessons and Most covered columns removed 2026-10-29, then Course; the user page has all three.
export function UsersTable({ users, oneSite, linked = false, linkState }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users
      .filter(u => !q || u.name.toLowerCase().includes(q) || u.sc.name.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1
        if (sort.key === 'name') return dir * a.name.localeCompare(b.name)
        if (sort.key === 'site') return dir * a.sc.name.localeCompare(b.sc.name) || a.name.localeCompare(b.name)
        if (sort.key === 'role') return dir * a.role.localeCompare(b.role) || a.name.localeCompare(b.name)
        if (sort.key === 'last') return dir * (agoRank(a.last) - agoRank(b.last) || 0) || a.name.localeCompare(b.name)
        return dir * a.name.localeCompare(b.name)
      })
  }, [users, query, sort])
  useEffect(() => { setPage(1) }, [users, query, sort, pageSize])
  const shown = rows.slice((page - 1) * pageSize, page * pageSize)
  const onSort = (k, first = 'asc') => setSort(s => nextSort(s, k, first))
  const cols = 3 + !oneSite

  function exportUsers() {
    download('lessons-users.csv', ['User', !oneSite && 'Site', 'Role', 'Last active'].filter(Boolean),
      rows.map(u => [u.name, !oneSite && u.sc.name, u.role, u.last].filter(v => v !== false)))
  }

  return (
    <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-brand-border">
        <div className="flex-1 min-w-0">
          <SearchField value={query} onChange={setQuery} placeholder="Search users" bg="bg-brand-bg/60" />
        </div>
        <button type="button" onClick={exportUsers} className="inline-flex items-center gap-1.5 h-9 px-2 shrink-0 whitespace-nowrap text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4 transition-colors">
          <Download size={14} aria-hidden="true" /> Export CSV
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead><SortButton label="User" col="name" sort={sort} onSort={onSort} /></TableHead>
            {!oneSite && <TableHead><SortButton label="Site" col="site" sort={sort} onSort={onSort} /></TableHead>}
            <TableHead><SortButton label="Role" col="role" sort={sort} onSort={onSort} /></TableHead>
            <TableHead className="text-right"><SortButton label="Last active" col="last" sort={sort} onSort={onSort} align="right" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map(u => (
            <TableRow key={u.key} className="hover:bg-transparent">
              <TableCell className="font-medium">
                {linked ? <Link to={`/reports/content/users/${u.key}`} state={linkState} className="text-dessa-teal hover:underline underline-offset-4">{u.name}</Link> : u.name}
              </TableCell>
              {!oneSite && <TableCell className="text-brand-subtext">{u.sc.name}</TableCell>}
              <TableCell className="text-brand-subtext">{u.role}</TableCell>
              <TableCell className="text-right text-brand-subtext">{u.last}</TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={cols} className="text-center text-brand-subtext py-8">
                {query.trim() ? 'No users match your search.' : 'No users for these filters yet. Try another site, role or course type.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PaginationBar page={page} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={setPageSize} className="px-4 py-3 border-t border-brand-border" />
    </div>
  )
}

// The Filters panel's 3-dot menu (2026-11-02, shared by the report and the grade and course pages). `items` is
// [{ icon, label, onSelect }].
// The users table's Export CSV link button, for any card's header (2026-11-03, concept E's cards).
export function ExportButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 h-9 px-2 shrink-0 whitespace-nowrap text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4 transition-colors">
      <Download size={14} aria-hidden="true" /> Export CSV
    </button>
  )
}

export function MoreMenu({ items }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    if (!open) return
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    const k = e => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [open])
  const menuItem = 'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-brand-text hover:bg-brand-bg transition-colors'
  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        className="flex items-center justify-center w-9 h-9 rounded-md bg-white text-brand-text hover:bg-brand-bg transition-all"
        onClick={() => setOpen(o => !o)}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-brand-border rounded-lg shadow-lg z-20 overflow-hidden py-1">
          {items.map(({ icon: Icon, label, onSelect }) => (
            <button key={label} role="menuitem" className={menuItem} onClick={() => { setOpen(false); onSelect() }}>
              <Icon size={14} className="text-brand-subtext" aria-hidden="true" /> {label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// The Filters panel on the course, grade and user pages (2026-10-29). It edits the report's own applied filters, so
// a change here carries back to the report and on to the next page. Each page picks the fields that change it.
// `initial` patches the draft (a user page opened from Engagement shows Engagement's dates); `onApply` runs after.
// `showType` adds the Course type field (the user page, 2026-11-03).
export function ContentFilters({ showSite = true, showRole = true, showType = false, initial, onApply, action }) {
  const { isSiteLeaderView } = useRole()
  const { contentFilters, setContentFilters } = useContentConcept()
  const applied = contentFilters ?? DEFAULT_FILTERS
  const [draft, setDraft] = useState(() => {
    const d = { ...applied, ...initial }
    return { ...d, end: d.end > FILTER_MAX ? FILTER_MAX : d.end }
  })
  return (
    <FiltersPanel
      draft={draft}
      onChange={setDraft}
      onApply={() => { setContentFilters(draft); onApply?.() }}
      onReset={() => { setDraft(DEFAULT_FILTERS); setContentFilters(DEFAULT_FILTERS); onApply?.() }}
      sites={schools}
      roles={CONTENT_ROLES}
      showSite={showSite && !isSiteLeaderView}
      showRole={showRole}
      multiRole
      minDate={FILTER_MIN}
      maxDate={FILTER_MAX}
      action={action}
      extraFields={showType ? <CourseTypeSelect value={draft.type} onChange={v => setDraft(d => ({ ...d, type: v }))} /> : null}
    />
  )
}

// The Course type field, shared by the report and the user page. Family out of the filter (2026-11-02).
// Multi select like Site (2026-11-03); the single select is kept below.
function CourseTypeSelect({ value, onChange }) {
  return (
    <MultiSelect
      label="Course type" value={value} onChange={onChange} noun="types" className="flex-1 min-w-36"
      options={COURSE_TYPES.filter(t => t.value !== 'family').map(t => ({ value: t.value, label: t.label }))}
    />
  )
  // return (
  //   <Select label="Course type" value={value} onChange={onChange} className="flex-1 min-w-36">
  //     <option value="all">All</option>
  //     {COURSE_TYPES.filter(t => t.value !== 'family').map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
  //   </Select>
  // )
}

// The weeks and sites the applied filters cover, shared with the course and user pages (concept C, 2026-10-27).
// `allSites` ignores the Site filter, for a user page, which should find a user wherever they are. `weeks` overrides
// the dates, for a user page opened from the Engagement report with its own range.
export function useContentScope({ allSites = false, weeks: override = null } = {}) {
  const { isSiteLeaderView } = useRole()
  const { contentFilters } = useContentConcept()
  const applied = contentFilters ?? DEFAULT_FILTERS
  const weeks = useMemo(() => {
    if (override?.length) return override
    const ws = weeksForDates(parseISO(applied.start), parseISO(applied.end))
    return ws.length ? ws : PAST_WEEKS.slice(-1)
  }, [applied, override?.join()])
  const siteIds = isSiteLeaderView ? [schools[0].id] : allSites ? [] : applied.site.map(Number)
  return { weeks, siteIds, role: applied.role, type: applied.type, range: rangeLabel(weeks) }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const TABS = [['courses', 'Courses'], ['competencies', 'Competencies']]

export default function ReportContent() {
  const { isSiteLeaderView } = useRole()
  const { contentConcept, contentFilters, setContentFilters } = useContentConcept()
  const applied = contentFilters ?? DEFAULT_FILTERS
  const setApplied = setContentFilters
  const [draft, setDraft] = useState(applied)
  const [tab, setTab] = useState('courses')
  // Concept C's course type tabs (2026-11-02): everything under them follows the tab; the KPI cards above don't.
  const [cTab, setCTab] = useState('core')
  const cTabRefs = useRef({})
  const [courseSort, setCourseSort] = useState({ key: 'lessons', dir: 'desc' })
  const tabRefs = useRef({})

  // The date pickers only allow school days, so a range always holds a week; the fallback is a safety net.
  const weeks = useMemo(() => {
    const ws = weeksForDates(parseISO(applied.start), parseISO(applied.end))
    return ws.length ? ws : PAST_WEEKS.slice(-1)
  }, [applied])
  // A Site Leader sees only their own site (the same first site the Engagement report uses).
  const siteIds = isSiteLeaderView ? [schools[0].id] : applied.site.map(Number)
  const oneSite = siteIds.length === 1
  const data = useMemo(() => contentData({ siteIds, role: applied.role, type: applied.type, weeks }), [siteIds.join(), applied.role.join(), applied.type.join(), weeks])
  const range = rangeLabel(weeks)
  const empty = data.lessons === 0

  function exportCsv(which) {
    if (which === 'courses') {
      download('lessons-courses.csv', ['Course', 'Course type', 'Grade', 'Lessons completed', 'Users', 'Course progress percent', 'Typical unit', 'Units in course'],
        sortCourses(data.courseRows, courseSort).map(r => [r.course.title, r.course.typeLabel, r.course.grade, r.lessons, r.users.length, r.progress, r.unitTypical, r.course.lessons]))
    } else {
      download('lessons-competencies.csv', ['Week of', ...COMPETENCIES.map(c => c.label), 'Total'],
        data.weekly.map(w => [format(parseISO(w.week), 'MMM d yyyy'), ...COMPETENCIES.map(c => w.comps[c.key]), w.total]))
    }
  }

  // Concept E's cards export what they show (2026-11-03): the grouped course list, and lessons by competency.
  function exportCard(which) {
    if (which === 'courses') {
      download('lessons-completed-by-course.csv', ['Course type', 'Course', 'Lessons completed'], cGroups.flatMap(g => g.rows.map(r => [g.label, r.name, r.lessons])))
    } else {
      const total = COMPETENCIES.reduce((sum, c) => sum + data.compTotals[c.key], 0)
      download('lessons-completed-by-competency.csv', ['Competency', 'Lessons completed', 'Percent of lessons'],
        COMPETENCIES.map(c => [c.label, data.compTotals[c.key], total ? Math.round((data.compTotals[c.key] / total) * 100) : 0]).sort((a, b) => b[1] - a[1]))
    }
  }

  function printReport() {
    const prevTitle = document.title
    document.title = `Content, ${range}`
    window.addEventListener('afterprint', () => { document.title = prevTitle }, { once: true })
    window.print()
  }

  const cUsers = useMemo(() => data.users.filter(u => teachesType(u, cTab)), [data, cTab])
  const cComps = useMemo(() => Object.fromEntries(COMPETENCIES.map(c => [c.key, cUsers.reduce((sum, u) => sum + typePart(u, cTab).comps[c.key], 0)])), [cUsers, cTab])
  const cEmpty = !cUsers.some(u => typePart(u, cTab).lessons > 0)
  const cRows = cTab === 'core' ? null : ALL_COURSES.filter(c => c.type === cTab).map((c, i) => {
    const us = cUsers.filter(u => teachesCourse(u, c.id))
    return us.length ? { key: c.id, order: i, name: cTab === 'adult' ? 'Adult wellness' : levelName(c.grade), to: `/reports/content/courses/${c.id}`, lessons: us.reduce((sum, u) => sum + coursePart(u, c.id).lessons, 0) } : null
  }).filter(Boolean)
  // Concept C's grouped list (2026-11-02): every course type in the filtered data, Tier 1 by grade, the rest by course.
  const cGroups = [
    { type: 'core', label: 'Tier 1', rows: data.gradeRows.filter(r => r.tier === 1).map(r => ({ key: r.key, order: r.g, name: gradeLabel(r.g), to: gradePath(r.g, 1), lessons: r.lessons })) },
    // Family out of the list (2026-11-02), as it is out of the filter.
    ...['tier2', 'adult'].map(type => ({
      type,
      label: COURSE_TYPES.find(t => t.value === type).label,
      rows: ALL_COURSES.filter(c => c.type === type).map((c, i) => {
        const us = data.users.filter(u => teachesCourse(u, c.id))
        return us.length ? { key: c.id, order: i, name: type === 'adult' ? 'Adult wellness' : levelName(c.grade), to: `/reports/content/courses/${c.id}`, lessons: us.reduce((sum, u) => sum + coursePart(u, c.id).lessons, 0) } : null
      }).filter(Boolean),
    })),
  ].filter(g => g.rows.length)

  const cOrderLabel = cGroups.length === 1 && cGroups[0].type === 'core' ? 'Grade' : cGroups.length === 1 && cGroups[0].type !== 'adult' ? 'Band' : 'Course'

  function onCTabKey(e) {
    const i = C_TABS.findIndex(([k]) => k === cTab)
    const next = e.key === 'ArrowRight' ? (i + 1) % C_TABS.length : e.key === 'ArrowLeft' ? (i - 1 + C_TABS.length) % C_TABS.length : null
    if (next == null) return
    e.preventDefault()
    setCTab(C_TABS[next][0])
    cTabRefs.current[C_TABS[next][0]]?.focus()
  }

  // Tabs follow the ARIA tabs pattern (2026-10-26): arrow keys move between them.
  function onTabKey(e) {
    const i = TABS.findIndex(([k]) => k === tab)
    const next = e.key === 'ArrowRight' ? (i + 1) % TABS.length : e.key === 'ArrowLeft' ? (i - 1 + TABS.length) % TABS.length : null
    if (next == null) return
    e.preventDefault()
    setTab(TABS[next][0])
    tabRefs.current[TABS[next][0]]?.focus()
  }

  // D and E share the side by side layout (2026-11-03); E is D's copy with the titles carrying the measure.
  const sideBySide = contentConcept === 'd' || contentConcept === 'e'
  const menu = (
    <MoreMenu items={[
      // Concept E's cards have their own Export CSV (2026-11-03), so its menu is just Print.
      ...(contentConcept === 'e' ? [] : sideBySide
        ? [{ icon: Download, label: 'Export courses CSV', onSelect: () => exportCsv('courses') }, { icon: Download, label: 'Export competencies CSV', onSelect: () => exportCsv('competencies') }]
        : [{ icon: Download, label: `Export ${tab === 'courses' ? 'courses' : 'competencies'} CSV`, onSelect: () => exportCsv(tab) }]),
      { icon: Printer, label: 'Print', onSelect: printReport },
    ]} />
  )

  const card = 'bg-white rounded-lg border border-brand-border p-5'
  const typeLabel = applied.type.length ? COURSE_TYPES.filter(t => applied.type.includes(t.value)).map(t => t.label).join(' and ') : null
  return (
    <div className="px-6 pt-8 pb-8">
      <h1 className="text-[28px] font-bold leading-tight text-brand-text mb-6">Content</h1>

      <FiltersPanel
        draft={draft}
        onChange={setDraft}
        onApply={() => setApplied(draft)}
        onReset={() => { setDraft(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS) }}
        sites={schools}
        roles={CONTENT_ROLES}
        multiRole
        showSite={!isSiteLeaderView}
        minDate={FILTER_MIN}
        maxDate={FILTER_MAX}
        action={menu}
        extraFields={<CourseTypeSelect value={draft.type} onChange={v => setDraft(d => ({ ...d, type: v }))} />}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label={<Defined definition={LESSON_DEFINITION}>Lessons completed</Defined>} value={data.lessons.toLocaleString()} note={range} />
        {/* KPI cards refined 2026-11-02: the percent leads for users. Lessons completed keeps its date range. */}
        <Stat label="Users who completed a lesson" value={`${pct(data.activeUsers, data.users.length)}%`} note={`${data.activeUsers.toLocaleString()} of ${data.users.length.toLocaleString()} users`} />
        {/* Power of Pause card back 2026-11-05 */}
        <Stat label="Power of Pause lessons" value={data.pop.toLocaleString()} note={`${pct(data.pop, data.lessons)}% of all lessons`} />
      </div>

      {/* Concept C has no tabs (2026-11-02): its grades and competencies sit side by side. */}
      {sideBySide ? (
        // Concept D (2026-11-02, was C until the user brought C's first table back): no tabs; the Course type filter
        // does their job, and All shows every type in one grouped list.
        // The Tier 1, Tier 2 and Adult wellness tabs are kept below, commented out.
        <>
          {/* The measure said once (2026-11-02): one heading over both cards, each card titled by how it splits it.
              Concept E (2026-11-03) drops the heading and puts the measure in each card's title. */}
          {contentConcept === 'd' && <h2 className="text-lg font-semibold text-brand-text mb-3">Lessons completed</h2>}
          <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ListCard
              title={contentConcept === 'd' ? 'By course' : 'Lessons completed by course'}
              orderLabel={cOrderLabel}
              groups={cGroups}
              // Concept E (2026-11-03): no Sort dropdown, a header row instead.
              columns={contentConcept === 'e' ? [cOrderLabel, 'Lessons completed'] : undefined}
              action={contentConcept === 'e' ? <ExportButton onClick={() => exportCard('courses')} /> : undefined}
            />
            {empty ? <section className={card}><EmptyState /></section> : (contentConcept === 'd'
              ? <CompetencyMix totals={data.compTotals} title="By competency" stacked divided />
              // Concept E is bars only (2026-11-03); its donut is commented out:
              // <CompetencyMix totals={data.compTotals} title="Lessons completed by competency" stacked divided />
              : <CompetencyMix totals={data.compTotals} title="Lessons completed by competency" view="bars" divided action={<ExportButton onClick={() => exportCard('competencies')} />} />)}
          </div>
          <UsersTable users={data.users} oneSite={oneSite} linked />
        </>
      ) : contentConcept === 'c-tabs' ? (
        <>
          <div role="tablist" aria-label="Course type" className="flex gap-4 border-b border-brand-border mb-6" onKeyDown={onCTabKey}>
            {C_TABS.map(([k, label]) => (
              <button
                key={k} ref={el => { cTabRefs.current[k] = el }} type="button" role="tab" id={`content-ctab-${k}`} aria-selected={cTab === k} aria-controls="content-cpanel" tabIndex={cTab === k ? 0 : -1}
                onClick={() => setCTab(k)}
                className={`pb-2 -mb-px text-sm font-medium border-b-2 transition-colors ${cTab === k ? 'border-dessa-teal text-brand-text' : 'border-transparent text-brand-subtext hover:text-brand-text'}`}
              >{label}</button>
            ))}
          </div>
          <motion.div key={cTab} id="content-cpanel" role="tabpanel" aria-labelledby={`content-ctab-${cTab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {/* Side by side in their own cards (2026-11-02), not one shared card. */}
            <div className="mb-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* List cards (2026-11-02) in place of the tables, which are kept:
                  {cTab === 'core' ? <GradeTable rows={data.gradeRows} /> : <CourseTable label={cTab === 'tier2' ? 'Band' : 'Course'} rows={cRows} />} */}
              {cTab === 'core'
                ? <ListCard title="Lessons by grade" orderLabel="Grade" rows={data.gradeRows.filter(r => r.tier === 1).map(r => ({ key: r.key, order: r.g, name: gradeLabel(r.g), to: gradePath(r.g, 1), lessons: r.lessons }))} />
                : <ListCard title={cTab === 'tier2' ? 'Lessons by band' : 'Lessons by course'} orderLabel={cTab === 'tier2' ? 'Band' : 'Course'} rows={cRows} />}
              {cEmpty ? <section className={card}><EmptyState /></section> : <CompetencyMix totals={cComps} stacked divided />}
            </div>
            <UsersTable users={cUsers} oneSite={oneSite} linked />
          </motion.div>
        </>
      ) : (<>
      <div role="tablist" aria-label="Content views" className="flex gap-4 border-b border-brand-border mb-6" onKeyDown={onTabKey}>
        {TABS.map(([k, label]) => (
          <button
            key={k} ref={el => { tabRefs.current[k] = el }} type="button" role="tab" id={`content-tab-${k}`} aria-selected={tab === k} aria-controls={`content-panel-${k}`} tabIndex={tab === k ? 0 : -1}
            onClick={() => setTab(k)}
            className={`pb-2 -mb-px text-sm font-medium border-b-2 transition-colors ${tab === k ? 'border-dessa-teal text-brand-text' : 'border-transparent text-brand-subtext hover:text-brand-text'}`}
          >{label}</button>
        ))}
      </div>

      <motion.div
        key={tab} id={`content-panel-${tab}`} role="tabpanel" aria-labelledby={`content-tab-${tab}`}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="mb-6"
      >
        {tab === 'courses' && contentConcept === 'c' ? (
          <GradeTable rows={data.gradeRows} />
        ) : tab === 'courses' ? (
          // Concept A (the ranked course table) commented out 2026-10-28; any concept other than C shows B's cards.
          // <section className={card}>
          //   <h3 className="text-base font-semibold text-brand-text mb-4">Lessons completed by course</h3>
          //   {empty ? <EmptyState /> : <CoursesTable rows={data.courseRows} sort={courseSort} onSortChange={setCourseSort} oneSite={oneSite} />}
          // </section>
          empty ? <section className={card}><EmptyState /></section> : <BandCards rows={data.courseRows} />
        ) : empty ? (
          <section className={card}><EmptyState /></section>
        ) : (
          // The whole on top, then each competency over time (2026-10-28). The stacked weekly chart and the Coverage
          // panel it replaces are commented out below.
          <div className="flex flex-col gap-4">
            {/* Concept C keeps a control version of the card (2026-11-03): the donut with share bars in its legend. */}
            {contentConcept === 'c' ? <CompetencyMixOriginal totals={data.compTotals} /> : <CompetencyMix totals={data.compTotals} />}
            {/* Weekly bar charts per competency commented out 2026-11-02, concept C included since 2026-11-03. */}
            {/* <CompetencyTrends weekly={data.weekly} totals={data.compTotals} /> */}
          </div>
          // <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
          //   <section className={card}>
          //     <h3 className="text-base font-semibold text-brand-text mb-4">Lessons by competency each week</h3>
          //     <CompetencyChart weekly={data.weekly} totals={data.compTotals} range={range} />
          //   </section>
          //   <section className={card}>
          //     <h3 className="text-base font-semibold text-brand-text mb-4">Coverage</h3>
          //     <Coverage totals={data.compTotals} />
          //   </section>
          // </div>
        )}
      </motion.div>
      </>)}

      {!sideBySide && <UsersTable users={data.users} oneSite={oneSite} linked={contentConcept === 'c'} />}

      <PrintReport
        title="Lessons"
        rangeText={range}
        goalText={typeLabel ? `${typeLabel} courses` : null}
        generated={format(new Date(), 'MMM d, yyyy')}
        stats={[
          { label: 'Lessons completed', value: data.lessons.toLocaleString() },
          { label: 'Users who completed a lesson', value: `${data.activeUsers} of ${data.users.length}`, note: `${pct(data.activeUsers, data.users.length)}% of users` },
          { label: 'Power of Pause lessons', value: data.pop.toLocaleString(), note: `${pct(data.pop, data.lessons)}% of all lessons` },
        ]}
        chartTitle="Coverage by competency"
        chart={<Coverage totals={data.compTotals} />}
        columns={['Course', 'Lessons completed']}
        rows={sortCourses(data.courseRows, courseSort).map(r => ({ name: `${r.course.title}, ${r.course.grade}`, value: `${r.lessons.toLocaleString()} (${r.users.length} users, ${r.progress}% through)` }))}
      />
    </div>
  )
}
