import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as Tooltip from '@radix-ui/react-tooltip'
import { BookOpen, ChevronRight, Download } from 'lucide-react'
import { ALL_COURSES, COMPETENCIES, contentData, unitName as courseInsightsName, gradeLabel, gradeMark, gradeCourse, gradePath, teachesGrade, gradePart, teachesCourse, coursePart } from '../lib/contentReportData'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { ContentFilters, DEFAULT_FILTERS, Defined, EmptyState, ExportButton, MoreMenu, UsersTable, LESSON_DEFINITION, download, useContentScope } from './ReportContent'
import { Select, MultiSelect } from '../components/engagement/FiltersPanel'
import { useContentConcept } from '../lib/contentConceptContext'
import { SortButton, nextSort, agoRank } from './Report2ConceptE'
import { schools } from '../lib/report2Data'
import { useRole } from '../lib/roleContext'
import CompetencyMix, { ConceptSelect } from '../components/content/CompetencyMix'
import { courseInsights, hasStarted, lessonsDone, ProgressDistribution, /* UnitLessons, UnitUsers, */ UnitView, UNIT_VIEWS, WeeklyLessons } from '../components/content/CourseInsights'
import { format, parseISO } from 'date-fns'
import ProfileCard, { CourseTile } from '../components/content/ProfileCard'

// Course page (Content concept C, 2026-10-27): a course row in the Content report opens here. Follows the report's
// dates and Site filter, and counts every user taking the course (role and course type don't narrow it).
// Layout (2026-10-27): the user page's profile card (course tile, type and grade, three numbers), then the schools
// using the course, its full competency mix and its users, in one stack.
// Grade pages (2026-10-29): the Courses table's rows are a grade and a tier, so they open a grade page instead, titled
// with the grade and its tier. Focus and Top competencies came out of the card (the competency chart covers them), and
// the chart moved above the schools. Course pages stay for Adult wellness and Family, opened from a user page.

// "Content > Grade 4 Self-Management in Action", the same breadcrumb as an Engagement site page.
export function ContentBreadcrumb({ trail }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex items-center gap-1.5 text-[13px] text-brand-subtext">
        {trail.map((t, i) => (
          <Fragment key={i}>
            {i > 0 && <li aria-hidden="true"><ChevronRight size={12} /></li>}
            {t.to
              ? <li><Link to={t.to} className="hover:text-brand-text hover:underline transition-colors">{t.label}</Link></li>
              : <li aria-current="page" className="text-brand-text truncate">{t.label}</li>}
          </Fragment>
        ))}
      </ol>
    </nav>
  )
}

export function NotFound({ what }) {
  return (
    <div className="px-6 pt-8 pb-8">
      <ContentBreadcrumb trail={[{ label: 'Lesson completion', to: '/reports/content' }, { label: `${what} not found` }]} />
      <div className="bg-white rounded-lg border border-brand-border py-12 text-center">
        <p className="text-sm font-semibold text-brand-text">We couldn't find that {what.toLowerCase()}</p>
        <p className="text-sm text-brand-subtext mt-1">It may be outside the sites you can see.</p>
        <Link to="/reports/content" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4">Back to Lesson completion</Link>
      </div>
    </div>
  )
}

// The users count reveals who they are on hover or focus (2026-11-03): each name with their lessons, most first.
function SiteUsers({ row }) {
  const list = [...row.list].sort((a, b) => b.lessons - a.lessons || a.name.localeCompare(b.name))
  return (
    <Tooltip.Provider delayDuration={150}>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <button type="button" aria-label={`${row.users} ${row.users === 1 ? 'user' : 'users'} at ${row.sc.name}: ${list.map(u => u.name).join(', ')}`} className="tabular-nums underline decoration-dotted decoration-brand-subtext/60 underline-offset-4 cursor-pointer rounded-sm">
            {row.users}
          </button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content side="left" sideOffset={8} className="z-50 min-w-48 max-w-64 px-3 py-2 rounded-md bg-brand-text text-white text-xs leading-5 shadow-lg">
            <ul>
              {list.map(u => (
                <li key={u.key} className="flex items-center justify-between gap-4">
                  <span className="truncate">{u.name}</span>
                  <span className="tabular-nums shrink-0">{u.lessons} {u.lessons === 1 ? 'lesson' : 'lessons'}</span>
                </li>
              ))}
            </ul>
            <Tooltip.Arrow className="fill-brand-text" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  )
}

// Schools using the course, most lessons first. The inline bar came out 2026-10-29; the numbers are enough.
// Sortable columns (2026-11-03), like the users table: Site A to Z first, the numbers most first.
// `siteTo(r)` and `onUsers(r)` (2026-11-06, concept G): the site opens this page for that site, and the users count
// filters the page to it.
function SchoolsTable({ rows, sort, onSort, siteTo, onUsers }) {
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.key === 'site') return dir * a.sc.name.localeCompare(b.sc.name)
    return dir * (a[sort.key] - b[sort.key]) || a.sc.name.localeCompare(b.sc.name)
  }), [rows, sort])
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead><SortButton label="Site" col="site" sort={sort} onSort={k => onSort(k, 'asc')} /></TableHead>
          <TableHead className="w-48 text-right"><SortButton label="Lessons completed" col="lessons" sort={sort} onSort={k => onSort(k, 'desc')} align="right" /></TableHead>
          <TableHead className="w-24 text-right"><SortButton label="Users" col="users" sort={sort} onSort={k => onSort(k, 'desc')} align="right" /></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map(r => (
          <TableRow key={r.sc.id} className="hover:bg-transparent">
            {/* Site names open the site page (2026-11-05). */}
            <TableCell className="font-medium"><Link to={siteTo ? siteTo(r) : `/reports/content/sites/${r.sc.id}`} className="text-dessa-teal hover:underline underline-offset-4">{r.sc.name}</Link></TableCell>
            <TableCell className="text-right tabular-nums">{r.lessons.toLocaleString()}</TableCell>
            {/* Users on hover removed 2026-11-05, most sites have 20+ users: <SiteUsers row={r} /> */}
            <TableCell className="text-right tabular-nums">
              {onUsers
                ? <button type="button" onClick={() => onUsers(r)} aria-label={`Show the ${r.users} users at ${r.sc.name}`} className="font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4">{r.users.toLocaleString()}</button>
                : r.users}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// Course page concepts (2026-11-06), picked in a switcher above the Filters panel and remembered per browser. A is the
// page as it was. B to D add where users are in the course, lessons by unit and by week, and each user's progress
// in the users table: B stacks them, C pairs them side by side, D puts them in tabs.
const PAGE_CONCEPTS = [
  { value: 'a', label: 'Concept A, as it was' },
  { value: 'b', label: 'Concept B, stacked' },
  { value: 'c', label: 'Concept C, side by side' },
  { value: 'd', label: 'Concept D, tabs' },
  // G (2026-11-06): the filters do the work. See GroupPageG.
  { value: 'g', label: 'Concept G, filters' },
]
const PAGE_KEY = 'content.coursePageConcept'
const readPage = () => { try { const v = localStorage.getItem(PAGE_KEY); return PAGE_CONCEPTS.some(c => c.value === v) ? v : 'b' } catch { return 'b' } }
const UNIT_KEY = 'content.unitView'
// Weeks out 2026-11-06, with lessons by week.
// Units first (2026-11-06).
const D_TABS = [['units', 'Units'], ['progress', 'Course progress'], /* ['weeks', 'Weeks'], */ ['competencies', 'Competencies'], ['sites', 'Sites']]

// A course or grade page. `part(u)` is the slice of a user's lessons that counts here: { lessons, comps, weeks }.
// `progressOf(u)` (2026-11-06) is how far the user is into the course: { done, total }.
// `site` (2026-11-06) is set when the page opened from a site page (/sites/:id/grades/9): the page covers that site
// only, the breadcrumb runs through it, and the Site field, the sites stat and the sites table come off.
function GroupPage(props) {
  const [concept, setConcept] = useState(readPage)
  const choose = v => { setConcept(v); try { localStorage.setItem(PAGE_KEY, v) } catch { /* private window */ } }
  const switcher = <ConceptSelect value={concept} onChange={choose} options={PAGE_CONCEPTS} name="Course page concept" />
  return concept === 'g' ? <GroupPageG {...props} switcher={switcher} /> : <GroupPageClassic {...props} concept={concept} switcher={switcher} />
}

function GroupPageClassic({ title, avatar, meta, users, part, progressOf, path, action, site, course, concept, switcher }) {
  const scope = useContentScope()
  const { weeks } = scope
  const siteIds = site ? [site.id] : scope.siteIds
  const [tab, setTab] = useState('units')
  // The units card's own concepts (2026-11-06), remembered per browser.
  const [unitView, setUnitView] = useState(() => { try { const v = localStorage.getItem(UNIT_KEY); return UNIT_VIEWS.some(c => c.value === v) ? v : 'columns' } catch { return 'columns' } })
  const chooseUnit = v => { setUnitView(v); try { localStorage.setItem(UNIT_KEY, v) } catch { /* private window */ } }
  const tabRefs = useRef({})
  const insights = useMemo(() => courseInsights({ users, part, progressOf, weeks, course }), [users, part, progressOf, weeks, course])
  const userProgress = useCallback(u => ({ lessons: part(u).lessons, ...(progressOf(u) ?? { done: 0, total: insights.total }) }), [part, progressOf, insights.total])
  const active = users.filter(u => part(u).lessons > 0)
  const lessons = active.reduce((sum, u) => sum + part(u).lessons, 0)
  const comps = Object.fromEntries(COMPETENCIES.map(c => [c.key, active.reduce((sum, u) => sum + part(u).comps[c.key], 0)]))
  const bySchool = [...active.reduce((m, u) => {
    const r = m.get(u.sc.id) ?? { sc: u.sc, lessons: 0, users: 0, list: [] }
    r.lessons += part(u).lessons
    r.users += 1
    r.list.push({ key: u.key, name: u.name, lessons: part(u).lessons })
    return m.set(u.sc.id, r)
  }, new Map()).values()].sort((a, b) => b.lessons - a.lessons)
  const siteTotal = new Set(users.map(u => u.sc.id)).size
  // Most lessons first, as before sorting came in (2026-11-03).
  const [siteSort, setSiteSort] = useState({ key: 'lessons', dir: 'desc' })
  const onSiteSort = (k, first) => setSiteSort(st => nextSort(st, k, first))
  // The export follows the table's sort.
  function exportCsv() {
    const name = `${title}${meta[0]?.[1] ? ` ${meta[0][1]}` : ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const dir = siteSort.dir === 'asc' ? 1 : -1
    const rows = [...bySchool].sort((a, b) => (siteSort.key === 'site' ? dir * a.sc.name.localeCompare(b.sc.name) : dir * (a[siteSort.key] - b[siteSort.key]) || a.sc.name.localeCompare(b.sc.name)))
    download(`${name}-sites.csv`, ['Site', 'Lessons completed', 'Users'], rows.map(r => [r.sc.name, r.lessons, r.users]))
  }
  const fileBase = `${title}${meta[0]?.[1] ? ` ${meta[0][1]}` : ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  // The new sections' own exports (2026-11-06).
  function exportInsight(which) {
    if (which === 'progress') download(`${fileBase}-course-progress.csv`, ['Course progress', 'Users'], insights.buckets.map(b => [b.label, b.users]))
    if (which === 'units') download(`${fileBase}-unit-completion.csv`, ['Unit', 'Users who completed it', 'Users who started the course', 'Percent'], insights.unitRows.map(u => [u.name, u.users, insights.started, insights.started ? Math.round((u.users / insights.started) * 100) : 0]))
    if (which === 'weeks') download(`${fileBase}-lessons-by-week.csv`, ['Week of', 'Lessons completed', 'Users'], insights.weekly.map(w => [format(parseISO(w.week), 'MMM d yyyy'), w.lessons, w.users]))
  }
  // Tabs follow the ARIA tabs pattern: arrow keys move between them.
  function onTabKey(e) {
    const i = D_TABS.findIndex(([k]) => k === tab)
    const next = e.key === 'ArrowRight' ? (i + 1) % D_TABS.length : e.key === 'ArrowLeft' ? (i - 1 + D_TABS.length) % D_TABS.length : null
    if (next == null) return
    e.preventDefault()
    setTab(D_TABS[next][0])
    tabRefs.current[D_TABS[next][0]]?.focus()
  }

  const competencies = <CompetencyMix totals={comps} view="bars" />
  const sites = (
    // The standard table (2026-11-02): edge to edge in its card, like the users table, not inset.
    <section className="bg-white rounded-lg border border-brand-border overflow-hidden">
      {/* Its own Export CSV (2026-11-03), like the users table. */}
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-brand-border">
        <h3 className="text-base font-semibold text-brand-text">Lessons completed by site</h3>
        {bySchool.length > 0 && <ExportButton onClick={exportCsv} />}
      </div>
      {bySchool.length ? <SchoolsTable rows={bySchool} sort={siteSort} onSort={onSiteSort} /> : <EmptyState />}
    </section>
  )
  const progressCard = <ProgressDistribution data={insights} action={<ExportButton onClick={() => exportInsight('progress')} />} />
  // One thing first (2026-11-06): users who completed lessons in each unit. Lessons by unit, with its Columns, Grid
  // and List views, is kept below.
  // The unit view (2026-11-06, from the manager's mock) in place of users by unit, which is kept:
  // <UnitUsers data={insights} action={<ExportButton onClick={() => exportInsight('units')} />} />
  const unitsCard = <UnitView data={insights} action={<ExportButton onClick={() => exportInsight('units')} />} />
  // const unitsCard = (
  //   <UnitLessons
  //     data={insights} view={unitView}
  //     action={<div className="flex items-center gap-2"><ConceptSelect value={unitView} onChange={chooseUnit} options={UNIT_VIEWS} name="Units concept" /><ExportButton onClick={() => exportInsight('units')} /></div>}
  //   />
  // )
  const weeksCard = <WeeklyLessons data={insights} action={<ExportButton onClick={() => exportInsight('weeks')} />} />
  // A user page's breadcrumb runs back through the site too.
  const siteCrumb = site && { label: site.name, to: `/reports/content/sites/${site.id}` }
  const back = site ? [siteCrumb, { label: title, to: path }] : { label: title, to: path }
  const usersTable = <UsersTable users={users} oneSite={siteIds.length === 1} linked linkState={{ back }} progress={userProgress} />

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="px-6 pt-8 pb-8">
      <ContentBreadcrumb trail={[{ label: 'Lesson completion', to: '/reports/content' }, ...(site ? [siteCrumb] : []), { label: title }]} />
      <div className="flex justify-end mb-3">{switcher}</div>
      {/* Filters (2026-10-29): Site, User role and dates. Course type is left off, since the page is one grade or course. */}
      {/* 3-dot menu (2026-11-02): Export CSV of the page's schools, like the report's own menu. */}
      {/* For one site (2026-11-06), no Site field and no sites export. */}
      <ContentFilters key={site?.id ?? 'all'} showSite={!site} action={site ? undefined : <MoreMenu items={[{ icon: Download, label: 'Export CSV', onSelect: exportCsv }]} />} />
      <div className="flex flex-col gap-4">
        {/* The same profile card as a user page (2026-10-27). */}
        <ProfileCard
          avatar={avatar}
          title={title}
          meta={meta}
          stats={[
            [<Defined key="l" definition={LESSON_DEFINITION}>Lessons completed</Defined>, lessons.toLocaleString()],
            // "Completed at" and "Completed by" (2026-11-03): the label carries the verb, the value its noun, so the row
            // reads 344 lessons completed, at 10 sites, by 27 users. The noun and total read quieter than the count.
            // Out of every site with a user taking it (2026-11-03), like Completed by.
            ...(site ? [] : [['Completed at', <>{bySchool.length.toLocaleString()} <span className="text-sm font-normal text-brand-subtext">of {siteTotal.toLocaleString()} {siteTotal === 1 ? 'site' : 'sites'}</span></>]]),
            ['Completed by', <>{active.length.toLocaleString()} <span className="text-sm font-normal text-brand-subtext">of {users.length.toLocaleString()} {users.length === 1 ? 'user' : 'users'}</span></>],
          ]}
          // No date range here (2026-11-02); the Filters panel above shows it.
          action={action}
          banner={false}
          // The user page's header (2026-11-03): a teal strip on top, the numbers beside the name.
          statsInHeader
          headerStyle="strip"
        />
        {concept === 'a' ? (<>
          {/* Bars only, no dropdown (2026-11-03), like the user page. */}
          {competencies}
          {!site && sites}
          <UsersTable users={users} oneSite={siteIds.length === 1} linked linkState={{ back }} />
        </>) : concept === 'b' ? (<>
          {progressCard}
          {unitsCard}
          {/* Lessons by week removed 2026-11-06: {weeksCard} */}
          {competencies}
          {!site && sites}
          {usersTable}
        </>) : concept === 'c' ? (<>
          {/* Lessons by week removed 2026-11-06, so progress pairs with competencies, and the units get the full width
              their 36 columns need. Was progress beside weeks, then units beside competencies. */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {progressCard}
            {competencies}
          </div>
          {unitsCard}
          {!site && sites}
          {usersTable}
        </>) : (<>
          <div>
            <div role="tablist" aria-label="Course views" className="flex flex-wrap gap-x-4 border-b border-brand-border mb-4" onKeyDown={onTabKey}>
              {D_TABS.filter(([k]) => !site || k !== 'sites').map(([k, label]) => (
                <button
                  key={k} ref={el => { tabRefs.current[k] = el }} type="button" role="tab" id={`course-tab-${k}`} aria-selected={tab === k} aria-controls="course-panel" tabIndex={tab === k ? 0 : -1}
                  onClick={() => setTab(k)}
                  className={`pb-2 -mb-px text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === k ? 'border-dessa-teal text-brand-text' : 'border-transparent text-brand-subtext hover:text-brand-text'}`}
                >{label}</button>
              ))}
            </div>
            <motion.div key={tab} id="course-panel" role="tabpanel" aria-labelledby={`course-tab-${tab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
              {{ progress: progressCard, units: unitsCard, weeks: weeksCard, competencies, sites }[tab]}
            </motion.div>
          </div>
          {usersTable}
        </>)}
      </div>
    </motion.div>
  )
}

// ─── Concept G (2026-11-06): the filters do the work ────────────────────────────
// For "which of my users haven't finished which lessons" and "how far along is each user", the page gets more
// global filters rather than table gymnastics: Completion in the main row, and Unit, Lesson, Progress and Last
// active behind More filters. They belong to this page, so they live in the address (shareable, and they don't
// follow you to another course). Everything narrows to the matching users, a results line says how many, and the
// units and sites tables' counts are shortcuts that set the filters. Tabs: Units, Users, Competencies, Sites; the
// Users tab replaces both the Course progress tab and the users table under the tabs.
const G_TABS = [['units', 'Units'], ['users', 'Users'], ['competencies', 'Competencies'], ['sites', 'Sites']]
const COURSE_BLANK = { unit: '', lesson: '', status: '', progress: [], active: '' }
const readCourse = params => ({
  unit: params.get('unit') ?? '',
  lesson: params.get('lesson') ?? '',
  status: params.get('status') ?? '',
  progress: params.get('progress') ? params.get('progress').split(',') : [],
  active: params.get('active') ?? '',
})
const writeCourse = v => Object.fromEntries(Object.entries({ ...v, progress: v.progress.join(',') }).filter(([, x]) => x))
// Progress bands by units finished, in quarters of the course: 36 units read 1 to 9, 10 to 18, 19 to 27, 28 to 35.
function progressBands(total) {
  const q = Math.max(1, Math.round(total / 4))
  const bands = [{ value: 'none', label: 'Not started', test: d => d === 0 }]
  for (let i = 0; i < 4; i++) {
    const lo = i * q + 1
    const hi = i === 3 ? total - 1 : Math.min(total - 1, (i + 1) * q)
    if (lo <= hi) bands.push({ value: `b${i}`, label: `${lo} to ${hi} units`, test: d => d >= lo && d <= hi })
  }
  bands.push({ value: 'all', label: `All ${total} units`, test: d => d >= total })
  return bands
}
const ACTIVE = [
  { value: 'week', label: 'In the past week', test: m => m <= 7 * 1440 },
  { value: 'two', label: 'In the past 2 weeks', test: m => m <= 14 * 1440 },
  { value: 'month', label: 'Over a month ago', test: m => m > 30 * 1440 && m !== Infinity },
  { value: 'none', label: 'Not yet', test: m => m === Infinity },
]
const minutesAgo = u => { try { return agoRank(u.last) } catch { return Infinity } }

// The five lessons of the picked unit for one user, as dots, filled when done. The picked lesson gets a ring.
function LessonDots({ done, lesson }) {
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${done} of 5 lessons done`}>
      {[1, 2, 3, 4, 5].map(k => (
        <span key={k} className={`w-2.5 h-2.5 rounded-full ${k <= done ? 'bg-dessa-teal' : 'bg-brand-border'} ${String(k) === lesson ? 'ring-2 ring-offset-1 ring-dessa-teal/40' : ''}`} />
      ))}
      <span className="ml-1.5 text-xs text-brand-subtext tabular-nums" aria-hidden="true">{done} of 5</span>
    </span>
  )
}

function GroupPageG({ title, avatar, meta, users: all, part, progressOf, path, site, course, switcher }) {
  const { weeks } = useContentScope()
  const { contentFilters, setContentFilters } = useContentConcept()
  const [params, setParams] = useSearchParams()
  const query = params.toString()
  const f = useMemo(() => readCourse(params), [query])
  // Bumped when a shortcut sets the filters, so the Filters panel picks them up.
  const [filterKey, setFilterKey] = useState(0)
  const [tab, setTab] = useState('units')
  const tabRefs = useRef({})
  const total = course.lessons
  const bands = useMemo(() => progressBands(total), [total])
  const unitNum = Number(f.unit) || null
  const applyCourse = v => setParams(writeCourse(v), { replace: true })
  const filtering = !!(f.unit || f.status || f.progress.length || f.active)

  const matches = useMemo(() => all.filter(u => {
    const p = progressOf(u) ?? { done: 0, total, units: [] }
    if (f.status) {
      const started = hasStarted(u, p)
      const finished = f.lesson && unitNum ? lessonsDone(u, p, unitNum) >= Number(f.lesson) : unitNum ? p.units.includes(unitNum) : p.done >= p.total
      if (f.status === 'finished' && !finished) return false
      if (f.status === 'not-finished' && (!started || finished)) return false
      if (f.status === 'not-started' && started) return false
    }
    if (f.progress.length && !bands.some(b => f.progress.includes(b.value) && b.test(p.done))) return false
    if (f.active && !ACTIVE.find(a => a.value === f.active).test(minutesAgo(u))) return false
    return true
  }), [all, f, progressOf, total, bands, unitNum])

  const insights = useMemo(() => courseInsights({ users: matches, part, progressOf, weeks, course }), [matches, part, progressOf, weeks, course])
  const userProgress = useCallback(u => ({ lessons: part(u).lessons, ...(progressOf(u) ?? { done: 0, total }) }), [part, progressOf, total])
  const active = matches.filter(u => part(u).lessons > 0)
  const lessons = active.reduce((sum, u) => sum + part(u).lessons, 0)
  const comps = Object.fromEntries(COMPETENCIES.map(c => [c.key, active.reduce((sum, u) => sum + part(u).comps[c.key], 0)]))
  const bySchool = [...matches.reduce((m, u) => {
    const r = m.get(u.sc.id) ?? { sc: u.sc, lessons: 0, users: 0 }
    r.lessons += part(u).lessons
    r.users += 1
    return m.set(u.sc.id, r)
  }, new Map()).values()]
  const siteTotal = new Set(all.map(u => u.sc.id)).size
  const [siteSort, setSiteSort] = useState({ key: 'lessons', dir: 'desc' })

  // Shortcuts: a Not yet count picks its unit (and lesson) and Not finished; a site's users count picks that site.
  // Both open the Users tab.
  function showNotYet(unit, lesson) {
    applyCourse({ ...f, unit: String(unit), lesson: lesson ? String(lesson) : '', status: 'not-finished' })
    setFilterKey(k => k + 1)
    setTab('users')
  }
  function showSite(r) {
    setContentFilters({ ...(contentFilters ?? DEFAULT_FILTERS), site: [String(r.sc.id)] })
    setFilterKey(k => k + 1)
    setTab('users')
  }
  function clearCourse() { applyCourse(COURSE_BLANK); setFilterKey(k => k + 1) }

  const fileBase = `${title}${meta[0]?.[1] ? ` ${meta[0][1]}` : ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
  const exportUnits = () => download(`${fileBase}-unit-completion.csv`, ['Unit', 'Finished', 'Not yet', 'Users who started the course'], insights.unitRows.map(u => [u.name, u.users, insights.started - u.users, insights.started]))
  const exportSites = () => download(`${fileBase}-sites.csv`, ['Site', 'Lessons completed', 'Users'], bySchool.map(r => [r.sc.name, r.lessons, r.users]))

  const unitOptions = Array.from({ length: total }, (_, i) => i + 1)
  const extra = {
    initial: f,
    blank: COURSE_BLANK,
    main: (d, set) => (
      <Select label="Completion" value={d.status} onChange={v => set({ status: v })} className="flex-1 min-w-36">
        <option value="">Any</option>
        <option value="finished">Finished</option>
        <option value="not-finished">Not finished</option>
        <option value="not-started">Not started course</option>
      </Select>
    ),
    more: (d, set) => <>
      <Select label="Unit" value={d.unit} onChange={v => set({ unit: v, lesson: '' })} className="flex-[2] min-w-48">
        <option value="">All units</option>
        {unitOptions.map(n => <option key={n} value={String(n)}>{courseInsightsName(course, n)}</option>)}
      </Select>
      <Select label="Lesson" value={d.lesson} onChange={v => set({ lesson: v })} disabled={!d.unit} className="flex-1 min-w-32">
        <option value="">All lessons</option>
        {[1, 2, 3, 4, 5].map(k => <option key={k} value={String(k)}>Lesson {k}</option>)}
      </Select>
      <MultiSelect label="Progress" value={d.progress} onChange={v => set({ progress: v })} noun="ranges" className="flex-1 min-w-36" options={bands.map(b => ({ value: b.value, label: b.label }))} />
      <Select label="Last active" value={d.active} onChange={v => set({ active: v })} className="flex-1 min-w-36">
        <option value="">Any time</option>
        {ACTIVE.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
      </Select>
    </>,
    moreCount: d => [d.unit, d.progress.length, d.active].filter(Boolean).length,
    apply: v => applyCourse(v),
  }

  function onTabKey(e) {
    const tabs = G_TABS.filter(([k]) => !site || k !== 'sites')
    const i = tabs.findIndex(([k]) => k === tab)
    const next = e.key === 'ArrowRight' ? (i + 1) % tabs.length : e.key === 'ArrowLeft' ? (i - 1 + tabs.length) % tabs.length : null
    if (next == null) return
    e.preventDefault()
    setTab(tabs[next][0])
    tabRefs.current[tabs[next][0]]?.focus()
  }

  const siteCrumb = site && { label: site.name, to: `/reports/content/sites/${site.id}` }
  const back = site ? [siteCrumb, { label: title, to: path }] : { label: title, to: path }
  const panels = {
    units: <UnitView data={insights} onNotYet={showNotYet} highlight={unitNum} action={<ExportButton onClick={exportUnits} />} />,
    users: (
      <UsersTable
        users={matches} oneSite={!!site} linked linkState={{ back }} progress={userProgress}
        column={unitNum ? {
          header: `Unit ${unitNum}`,
          cell: u => <LessonDots done={lessonsDone(u, progressOf(u), unitNum)} lesson={f.lesson} />,
          csv: u => lessonsDone(u, progressOf(u), unitNum),
        } : undefined}
      />
    ),
    competencies: <CompetencyMix totals={comps} view="bars" />,
    sites: (
      <section className="bg-white rounded-lg border border-brand-border overflow-hidden">
        <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-brand-border">
          <h3 className="text-base font-semibold text-brand-text">Lessons completed by site</h3>
          {bySchool.length > 0 && <ExportButton onClick={exportSites} />}
        </div>
        {bySchool.length ? (
          <SchoolsTable
            rows={bySchool} sort={siteSort} onSort={(k, first) => setSiteSort(st => nextSort(st, k, first))}
            siteTo={r => `${path.replace('/reports/content', `/reports/content/sites/${r.sc.id}`)}${query ? `?${query}` : ''}`}
            onUsers={showSite}
          />
        ) : <EmptyState />}
      </section>
    ),
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="px-6 pt-8 pb-8">
      <ContentBreadcrumb trail={[{ label: 'Lesson completion', to: '/reports/content' }, ...(site ? [siteCrumb] : []), { label: title }]} />
      <div className="flex justify-end mb-3">{switcher}</div>
      <ContentFilters key={`${site?.id ?? 'all'}-${filterKey}`} showSite={!site} extra={extra} />
      <div className="flex flex-col gap-4">
        <ProfileCard
          avatar={avatar}
          title={title}
          meta={meta}
          stats={[
            [<Defined key="l" definition={LESSON_DEFINITION}>Lessons completed</Defined>, lessons.toLocaleString()],
            ...(site ? [] : [['Completed at', <>{bySchool.filter(r => r.lessons > 0).length.toLocaleString()} <span className="text-sm font-normal text-brand-subtext">of {siteTotal.toLocaleString()} {siteTotal === 1 ? 'site' : 'sites'}</span></>]]),
            // With the page's filters on, the users stat counts the matches.
            filtering
              ? ['Matching users', <>{matches.length.toLocaleString()} <span className="text-sm font-normal text-brand-subtext">of {all.length.toLocaleString()} {all.length === 1 ? 'user' : 'users'}</span></>]
              : ['Completed by', <>{active.length.toLocaleString()} <span className="text-sm font-normal text-brand-subtext">of {all.length.toLocaleString()} {all.length === 1 ? 'user' : 'users'}</span></>],
          ]}
          banner={false}
          statsInHeader
          headerStyle="strip"
        />
        <div>
          <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-b border-brand-border mb-4">
            <div role="tablist" aria-label="Course views" className="flex flex-wrap gap-x-4" onKeyDown={onTabKey}>
              {G_TABS.filter(([k]) => !site || k !== 'sites').map(([k, label]) => (
                <button
                  key={k} ref={el => { tabRefs.current[k] = el }} type="button" role="tab" id={`course-g-tab-${k}`} aria-selected={tab === k} aria-controls="course-g-panel" tabIndex={tab === k ? 0 : -1}
                  onClick={() => setTab(k)}
                  className={`pb-2 -mb-px text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === k ? 'border-dessa-teal text-brand-text' : 'border-transparent text-brand-subtext hover:text-brand-text'}`}
                >{label}{k === 'users' && filtering ? ` (${matches.length.toLocaleString()})` : ''}</button>
              ))}
            </div>
            {/* The results line: how many users the page's filters leave, and a way out. */}
            {filtering && (
              <p className="pb-2 text-sm text-brand-subtext" aria-live="polite">
                <span className="font-semibold text-brand-text tabular-nums">{matches.length.toLocaleString()}</span> {matches.length === 1 ? 'user matches' : 'users match'}
                <button type="button" onClick={clearCourse} className="ml-3 font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4">Clear</button>
              </p>
            )}
          </div>
          <motion.div key={tab} id="course-g-panel" role="tabpanel" aria-labelledby={`course-g-tab-${tab}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            {panels[tab]}
          </motion.div>
        </div>
      </div>
    </motion.div>
  )
}

// `site` narrows to one site, for a grade or course opened from a site page.
function useScopedUsers(site) {
  const { weeks, siteIds: filtered, role } = useContentScope()
  const siteIds = site ? [site.id] : filtered
  return useMemo(() => contentData({ siteIds, role, weeks }).users, [siteIds.join(), role.join(), weeks])
}

// The site in the address (/reports/content/sites/:siteId/...), if any. A Site Leader sees only their own.
function useSiteParam() {
  const { siteId } = useParams()
  const { isSiteLeaderView } = useRole()
  if (siteId == null) return { site: null, missing: false }
  const site = schools.find(s => String(s.id) === siteId)
  return { site, missing: !site || (isSiteLeaderView && site.id !== schools[0].id) }
}
const sitePrefix = site => (site ? `/sites/${site.id}` : '')

// Both tiers of a grade, for the All tiers view (no longer linked to, 2026-11-02).
const sumParts = (a, b) => ({ lessons: a.lessons + b.lessons, comps: Object.fromEntries(COMPETENCIES.map(c => [c.key, a.comps[c.key] + b.comps[c.key]])), weeks: (a.weeks.length ? a.weeks : b.weeks).map((_, i) => (a.weeks[i] ?? 0) + (b.weeks[i] ?? 0)) })

// All tiers, Tier 1 or Tier 2 for one grade page (2026-11-02). Links, so each view has its own URL and Back works.
function TierSwitch({ g, tier }) {
  const opts = [[null, 'All tiers'], [1, 'Tier 1'], [2, 'Tier 2']]
  return (
    <nav aria-label="Tier" className="inline-flex items-center gap-0.5 p-0.5 rounded-md border border-brand-border bg-brand-bg">
      {opts.map(([t, label]) => (
        <Link
          key={label} to={gradePath(g, t)} replace aria-current={t === tier ? 'page' : undefined}
          className={`inline-flex items-center h-8 px-3 rounded text-sm whitespace-nowrap transition-colors ${t === tier ? 'bg-white border border-brand-border font-medium text-brand-text' : 'border border-transparent text-brand-subtext hover:text-brand-text'}`}
        >{label}</Link>
      ))}
    </nav>
  )
}

// "1st grade": everyone teaching that grade, at both tiers or one (`/grades/1/2` is 1st grade, Tier 2). A Tier 2
// user counts on each grade their level serves, with only that grade's lessons.
export function ContentGrade() {
  const { grade, tier } = useParams()
  useEffect(() => { window.scrollTo(0, 0) }, [grade])
  const g = Number(grade)
  const t = tier ? Number(tier) : null
  const { site, missing } = useSiteParam()
  const all = useScopedUsers(site)
  const users = useMemo(() => all.filter(u => (t ? teachesGrade(u, g, t) : teachesGrade(u, g, 1) || teachesGrade(u, g, 2))), [all, g, t])
  const course = t ? gradeCourse(g, t) : gradeCourse(g, 1) ?? gradeCourse(g, 2)
  const part = useCallback(u => (t ? gradePart(u, g, t) : sumParts(gradePart(u, g, 1), gradePart(u, g, 2))), [g, t])
  // Progress in the grade's course at this tier (Tier 1 for both tiers).
  const progressOf = useCallback(u => u.courseProgress?.[course?.id], [course])
  if (missing) return <NotFound what="Site" />
  if (!course || (t && t !== 1 && t !== 2)) return <NotFound what="Grade" />
  return (
    <GroupPage
      key={`${site?.id}-${g}-${t}`}
      site={site}
      course={course}
      title={gradeLabel(g)}
      avatar={<CourseTile course={course} size="lg" mark={gradeMark(g)} />}
      meta={[[BookOpen, t ? `Tier ${t}` : 'Tier 1 and Tier 2']]}
      users={users}
      part={part}
      progressOf={progressOf}
      path={gradePath(g, t).replace('/reports/content', `/reports/content${sitePrefix(site)}`)}
      // The tier switch came off 2026-11-02; grade links open Tier 1. Kept below for later.
      // action={<TierSwitch g={g} tier={t} />}
    />
  )
}

export default function ContentCourse() {
  const { courseId } = useParams()
  // Open at the top (2026-10-28), not at the scroll position of the table the link was in.
  useEffect(() => { window.scrollTo(0, 0) }, [courseId])
  const course = ALL_COURSES.find(c => String(c.id) === courseId)
  const { site, missing } = useSiteParam()
  const all = useScopedUsers(site)
  const users = useMemo(() => all.filter(u => course && teachesCourse(u, course.id)), [all, course])
  const part = useCallback(u => coursePart(u, course?.id), [course])
  const progressOf = useCallback(u => u.courseProgress?.[course?.id], [course])
  if (missing) return <NotFound what="Site" />
  if (!course) return <NotFound what="Course" />
  return (
    <GroupPage
      key={`${site?.id}-${course.id}`}
      site={site}
      course={course}
      title={course.title}
      avatar={<CourseTile course={course} size="lg" />}
      meta={[[BookOpen, course.typeLabel]]}
      users={users}
      part={part}
      progressOf={progressOf}
      path={`/reports/content${sitePrefix(site)}/courses/${course.id}`}
    />
  )
}
