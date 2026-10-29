import { Fragment, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { parseISO, addDays, format } from 'date-fns'
import { ChevronRight, Download, MoreHorizontal, Printer } from 'lucide-react'
import * as Tooltip from '@radix-ui/react-tooltip'
import { schools, PAST_WEEKS, USER_ROLES } from '../lib/report2Data'
import { COMPETENCIES, COURSE_TYPES, BANDS_ORDER, bandOf, pace, contentData, gradeLabel, gradePath } from '../lib/contentReportData'
import { useContentConcept } from '../lib/contentConceptContext'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { PaginationBar } from '../components/ui/pagination'
import FiltersPanel, { Select } from '../components/engagement/FiltersPanel'
import PrintReport from '../components/engagement/PrintReport'
import CompetencyMix from '../components/content/CompetencyMix'
import { useRole } from '../lib/roleContext'
import { FIRST_DATE, LAST_DATE, rangeLabel, weeksForDates, SortButton, nextSort, SearchField, agoRank } from './Report2ConceptE'

// Content report (2026-10-26): "What are we teaching?" Replaces the legacy Content Overview's four charts
// (lessons per course by school, competencies per day, competencies per user, Power of Pause) and the legacy
// Extra Courses tab (now the Course type filter), in the Engagement report's shell: Filters, a few headline
// numbers, Courses | Competencies tabs, then a users table. Every user type counts.

const toKey = d => format(d, 'yyyy-MM-dd')
const FILTER_MIN = toKey(FIRST_DATE)
const FILTER_MAX = toKey(LAST_DATE)
export const DEFAULT_FILTERS = { site: [], role: 'all', type: 'all', start: PAST_WEEKS[Math.max(0, PAST_WEEKS.length - 4)], end: FILTER_MAX }
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

// Two rows per grade (2026-10-29), Tier 1 and Tier 2, each with its lessons completed. Styled like the Engagement
// users table: edge to edge in its card, one line per row, and the grade is the link, like a user's name.
function GradeTable({ rows }) {
  const [sort, setSort] = useState({ key: 'grade', dir: 'asc' })
  const onSort = (k, first = 'asc') => setSort(s => nextSort(s, k, first))
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.key === 'lessons') return dir * (a.lessons - b.lessons) || a.g - b.g || a.tier - b.tier
    if (sort.key === 'tier') return dir * (a.tier - b.tier) || a.g - b.g
    return dir * (a.g - b.g) || a.tier - b.tier
  }), [rows, sort])
  return (
    <div className="bg-white rounded-lg border border-brand-border overflow-hidden [&_td]:text-[13px]">
      {sorted.length ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-[13px] font-medium"><SortButton label="Grade" col="grade" sort={sort} onSort={onSort} /></TableHead>
              <TableHead className="text-[13px] font-medium w-40"><SortButton label="Tier" col="tier" sort={sort} onSort={onSort} /></TableHead>
              <TableHead className="text-[13px] font-medium w-48 text-right"><SortButton label="Lessons completed" col="lessons" sort={sort} onSort={k => onSort(k, 'desc')} align="right" /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map(r => (
              <TableRow key={r.key} className="hover:bg-transparent">
                <TableCell className="font-medium">
                  <Link to={gradePath(r.g, r.tier)} className="text-dessa-teal hover:underline underline-offset-4">{gradeLabel(r.g)}</Link>
                </TableCell>
                <TableCell className="text-brand-subtext">Tier {r.tier}</TableCell>
                <TableCell className="text-right tabular-nums">{r.lessons.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : <EmptyState />}
    </div>
  )
}

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
// Lessons and Most covered columns removed 2026-10-29; the user page has both.
export function UsersTable({ users, oneSite, linked = false, showCourse = true, linkState }) {
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState({ key: 'name', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return users
      .filter(u => !q || u.name.toLowerCase().includes(q) || u.sc.name.toLowerCase().includes(q) || u.courseLabel.toLowerCase().includes(q))
      .sort((a, b) => {
        const dir = sort.dir === 'asc' ? 1 : -1
        if (sort.key === 'name') return dir * a.name.localeCompare(b.name)
        if (sort.key === 'site') return dir * a.sc.name.localeCompare(b.sc.name) || a.name.localeCompare(b.name)
        if (sort.key === 'role') return dir * a.role.localeCompare(b.role) || a.name.localeCompare(b.name)
        if (sort.key === 'course') return dir * a.courseLabel.localeCompare(b.courseLabel) || a.name.localeCompare(b.name)
        if (sort.key === 'last') return dir * (agoRank(a.last) - agoRank(b.last) || 0) || a.name.localeCompare(b.name)
        return dir * a.name.localeCompare(b.name)
      })
  }, [users, query, sort])
  useEffect(() => { setPage(1) }, [users, query, sort, pageSize])
  const shown = rows.slice((page - 1) * pageSize, page * pageSize)
  const onSort = (k, first = 'asc') => setSort(s => nextSort(s, k, first))
  const cols = 3 + !oneSite + showCourse

  function exportUsers() {
    download('content-users.csv', ['User', !oneSite && 'Site', 'Role', 'Course', 'Last active'].filter(Boolean),
      rows.map(u => [u.name, !oneSite && u.sc.name, u.role, u.courseLabel, u.last].filter(v => v !== false)))
  }

  return (
    <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-brand-border">
        <div className="flex-1 min-w-0">
          <SearchField value={query} onChange={setQuery} placeholder={oneSite ? 'Search users or courses' : 'Search users, sites or courses'} bg="bg-brand-bg/60" />
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
            {showCourse && <TableHead><SortButton label="Course" col="course" sort={sort} onSort={onSort} /></TableHead>}
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
              {showCourse && <TableCell className="text-brand-subtext">{u.courseLabel}</TableCell>}
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
  return { weeks, siteIds, range: rangeLabel(weeks) }
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
  const [courseSort, setCourseSort] = useState({ key: 'lessons', dir: 'desc' })
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const tabRefs = useRef({})
  useEffect(() => {
    if (!menuOpen) return
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    const k = e => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [menuOpen])

  // The date pickers only allow school days, so a range always holds a week; the fallback is a safety net.
  const weeks = useMemo(() => {
    const ws = weeksForDates(parseISO(applied.start), parseISO(applied.end))
    return ws.length ? ws : PAST_WEEKS.slice(-1)
  }, [applied])
  // A Site Leader sees only their own site (the same first site the Engagement report uses).
  const siteIds = isSiteLeaderView ? [schools[0].id] : applied.site.map(Number)
  const oneSite = siteIds.length === 1
  const data = useMemo(() => contentData({ siteIds, role: applied.role, type: applied.type, weeks }), [siteIds.join(), applied.role, applied.type, weeks])
  const range = rangeLabel(weeks)
  const empty = data.lessons === 0

  function exportCsv() {
    if (tab === 'courses') {
      download('content-courses.csv', ['Course', 'Course type', 'Grade', 'Lessons completed', 'Users', 'Course progress percent', 'Typical unit', 'Units in course'],
        sortCourses(data.courseRows, courseSort).map(r => [r.course.title, r.course.typeLabel, r.course.grade, r.lessons, r.users.length, r.progress, r.unitTypical, r.course.lessons]))
    } else {
      download('content-competencies.csv', ['Week of', ...COMPETENCIES.map(c => c.label), 'Total'],
        data.weekly.map(w => [format(parseISO(w.week), 'MMM d yyyy'), ...COMPETENCIES.map(c => w.comps[c.key]), w.total]))
    }
  }

  function printReport() {
    const prevTitle = document.title
    document.title = `Content, ${range}`
    window.addEventListener('afterprint', () => { document.title = prevTitle }, { once: true })
    window.print()
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

  const menuItem = 'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-brand-text hover:bg-brand-bg transition-colors'
  const menu = (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        className="flex items-center justify-center w-9 h-9 rounded-md bg-white text-brand-text hover:bg-brand-bg transition-all"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
      >
        <MoreHorizontal size={16} aria-hidden="true" />
      </button>
      {menuOpen && (
        <div role="menu" className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-brand-border rounded-lg shadow-lg z-20 overflow-hidden py-1">
          <button role="menuitem" className={menuItem} onClick={() => { exportCsv(); setMenuOpen(false) }}>
            <Download size={14} className="text-brand-subtext" aria-hidden="true" /> Export {tab === 'courses' ? 'courses' : 'competencies'} CSV
          </button>
          <button role="menuitem" className={menuItem} onClick={() => { setMenuOpen(false); printReport() }}>
            <Printer size={14} className="text-brand-subtext" aria-hidden="true" /> Print
          </button>
        </div>
      )}
    </div>
  )

  const card = 'bg-white rounded-lg border border-brand-border p-5'
  const typeLabel = COURSE_TYPES.find(t => t.value === applied.type)?.label
  return (
    <div className="px-6 pt-8 pb-8">
      <h1 className="text-[28px] font-bold leading-tight text-brand-text mb-6">Content</h1>

      <FiltersPanel
        draft={draft}
        onChange={setDraft}
        onApply={() => setApplied(draft)}
        onReset={() => { setDraft(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS) }}
        sites={schools}
        roles={USER_ROLES}
        showSite={!isSiteLeaderView}
        minDate={FILTER_MIN}
        maxDate={FILTER_MAX}
        action={menu}
        extraFields={
          <Select label="Course type" value={draft.type} onChange={v => setDraft(d => ({ ...d, type: v }))} className="flex-1 min-w-36">
            <option value="all">All</option>
            {COURSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </Select>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Stat label={<Defined definition={LESSON_DEFINITION}>Lessons completed</Defined>} value={data.lessons.toLocaleString()} note={range} />
        <Stat label="Users who completed a lesson" value={`${data.activeUsers.toLocaleString()} of ${data.users.length.toLocaleString()}`} note={`${pct(data.activeUsers, data.users.length)}% of users`} />
        <Stat label="Power of Pause lessons" value={data.pop.toLocaleString()} note={`${pct(data.pop, data.lessons)}% of all lessons`} />
      </div>

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
            <CompetencyMix totals={data.compTotals} />
            <CompetencyTrends weekly={data.weekly} totals={data.compTotals} />
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

      <UsersTable users={data.users} oneSite={oneSite} linked={contentConcept === 'c'} />

      <PrintReport
        title="Content"
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
