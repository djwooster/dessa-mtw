import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, Download, School, User } from 'lucide-react'
import { COMPETENCIES, contentData, gradeLabel, gradeMark } from '../lib/contentReportData'
import CompetencyMix /* , { ConceptSelect } */ from '../components/content/CompetencyMix'
import ProfileCard, { ProfileSection, CourseTile } from '../components/content/ProfileCard'
import { educatorDayMap, otherDayMap } from './Report2ConceptE'
import EducatorCalendar from '../components/engagement/EducatorCalendar'
import { addDays, format, parseISO } from 'date-fns'
import { ContentFilters, Defined, LESSON_DEFINITION, MoreMenu, download, useContentScope } from './ReportContent'
import { ContentBreadcrumb, NotFound } from './ContentCourse'
import { agoRank } from './Report2ConceptE'
// import { useContentConcept } from '../lib/contentConceptContext' // the header switcher's, commented out 2026-11-03

// User page (Content concept C, 2026-10-27): a user's name in the Content report or on a course page opens here.
// Finds the user at any site the viewer can see (a Site Leader only their own), and follows the report's dates.
// The Engagement report's user names open it too (2026-10-27), with Engagement's dates and breadcrumb.
// Layout (2026-10-27, from profile references the user shared): one full-width stack, the user's pick over a card on
// the left. An identity card (teal banner with navy flowers, avatar, name, three numbers, then top competencies and
// course sections split by dotted lines), then the Engagement drill down's lesson calendar and the full competency
// mix. Read only.

// One link row in the card: a tile, a name and a line under it.
// Display only (2026-11-02): the course rows were links, now they just say what the user teaches.
// `progress` (2026-11-03) adds how far into the course the user is: on the right, lessons done of the course's
// total and the percent over a bar.
function PageLink({ tile, name, sub, progress }) {
  const share = progress?.total ? progress.done / progress.total : 0
  return (
    <div className="flex items-center gap-3 min-w-0 py-1.5">
      {tile}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-brand-text truncate">{name}</span>
        <span className="block text-xs text-brand-subtext truncate">
          {sub}
        </span>
      </span>
      {progress && (
        // The lesson count moved from under the name to the bar (2026-11-03).
        <span className="w-40 sm:w-56 shrink-0">
          <span className="flex items-center justify-between gap-2 text-xs tabular-nums" aria-hidden="true">
            <span className="text-brand-subtext truncate">{progress.done} of {progress.total} lessons</span>
            <span className="font-medium text-brand-text">{Math.round(share * 100)}%</span>
          </span>
          <span
            role="progressbar" aria-label={`${name} progress`} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}
            aria-valuetext={`${progress.done} of ${progress.total} lessons, ${Math.round(share * 100)}%`}
            className="block mt-1.5 h-2 rounded-full bg-brand-bg overflow-hidden"
          >
            <span className="block h-full rounded-full bg-dessa-teal" style={{ width: `${share * 100}%` }} />
          </span>
        </span>
      )}
    </div>
  )
}

// ─── Course progress concepts (2026-11-03) ──────────────────────────────────
// The list stacked courses down the card; these lay them side by side. A switcher in the section header picks one,
// remembered per browser. `items` is [{ key, tile, name, sub, progress: { done, total } }].
const PROGRESS_CONCEPTS = [
  { value: 'list', label: 'List' },
  // { value: 'cards', label: 'Cards' }, // removed 2026-11-03
  { value: 'rings', label: 'Rings' },
  { value: 'columns', label: 'Columns' },
]
const PROGRESS_KEY = 'content.courseProgressView'
// const readProgress = () => { try { const v = localStorage.getItem(PROGRESS_KEY); return PROGRESS_CONCEPTS.some(c => c.value === v) ? v : 'rings' } catch { return 'rings' } }
const shareOf = p => (p?.total ? p.done / p.total : 0)
const pctOf = p => Math.round(shareOf(p) * 100)
const lessonsOf = p => `${p.done} of ${p.total} lessons`

function ProgressBar({ name, progress, className = '' }) {
  return (
    <span
      role="progressbar" aria-label={`${name} progress`} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}
      aria-valuetext={`${lessonsOf(progress)}, ${pctOf(progress)}%`}
      className={`block h-2 rounded-full bg-brand-bg overflow-hidden ${className}`}
    >
      <span className="block h-full rounded-full bg-dessa-teal" style={{ width: `${shareOf(progress) * 100}%` }} />
    </span>
  )
}

/* Cards removed from the switcher 2026-11-03, kept for later:
// Cards: one small bordered card per course, side by side. Tile and name on top, the percent large, then the bar
// and the lesson count.
function ProgressCards({ items }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map(it => (
        <li key={it.key} className="rounded-lg border border-brand-border p-4 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            {it.tile}
            <span className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-brand-text truncate">{it.name}</span>
              <span className="block text-xs text-brand-subtext truncate">{it.sub}</span>
            </span>
          </div>
          <p className="mt-4 text-2xl font-semibold text-brand-text tabular-nums">{pctOf(it.progress)}%</p>
          <ProgressBar name={it.name} progress={it.progress} className="mt-2" />
          <p className="mt-2 text-xs text-brand-subtext tabular-nums">{lessonsOf(it.progress)}</p>
        </li>
      ))}
    </ul>
  )
}
*/

// Rings: no card per course, just a progress ring in the tile's place with the percent inside, and the name, type
// and lesson count beside it. The lightest of the three.
function Ring({ progress, name }) {
  const r = 26
  const c = 2 * Math.PI * r
  return (
    <span
      role="progressbar" aria-label={`${name} progress`} aria-valuemin={0} aria-valuemax={progress.total} aria-valuenow={progress.done}
      aria-valuetext={`${lessonsOf(progress)}, ${pctOf(progress)}%`}
      className="relative w-16 h-16 shrink-0"
    >
      <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90" aria-hidden="true">
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" className="stroke-brand-bg" />
        <circle cx="32" cy="32" r={r} fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-dessa-teal" strokeDasharray={`${shareOf(progress) * c} ${c}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold text-brand-text tabular-nums" aria-hidden="true">{pctOf(progress)}%</span>
    </span>
  )
}
function ProgressRings({ items }) {
  return (
    // Thin lines between courses (2026-11-03), like Columns.
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:divide-x divide-brand-border">
      {items.map(it => (
        <li key={it.key} className="flex items-center gap-3 min-w-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
          <Ring progress={it.progress} name={it.name} />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium text-brand-text truncate">{it.name}</span>
            {/* The type only when it adds something: Adult wellness is its own type (2026-11-03). */}
            {it.sub !== it.name && <span className="block text-xs text-brand-subtext truncate">{it.sub}</span>}
            <span className="block mt-1 text-xs text-brand-subtext tabular-nums">{lessonsOf(it.progress)}</span>
          </span>
        </li>
      ))}
    </ul>
  )
}

// Columns: the stats row's pattern above it (label, then a large value), one column per course split by thin lines,
// with the bar and lesson count under the percent. No tiles, so it reads as more numbers in the same card.
function ProgressColumns({ items }) {
  return (
    <ul className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-0 sm:divide-x divide-brand-border">
      {items.map(it => (
        <li key={it.key} className="min-w-0 sm:px-5 sm:first:pl-0 sm:last:pr-0">
          <span className="block text-xs text-brand-subtext truncate">{it.sub === it.name ? it.name : `${it.name}, ${it.sub}`}</span>
          <span className="flex items-baseline justify-between gap-2 mt-1">
            <span className="text-lg font-semibold text-brand-text tabular-nums">{pctOf(it.progress)}%</span>
            <span className="text-xs text-brand-subtext tabular-nums truncate">{lessonsOf(it.progress)}</span>
          </span>
          <ProgressBar name={it.name} progress={it.progress} className="mt-2" />
        </li>
      ))}
    </ul>
  )
}

const gradeNum = c => (c.grade === 'Kindergarten' ? 0 : Number(c.grade.replace('Grade ', '')))
const levelName = t => t.charAt(0) + t.slice(1).toLowerCase()

// The header concepts (2026-11-03). Their switcher sits above the Filters panel on the right, so the global Nav keeps
// the report's own concept switcher.
const HEADER_CONCEPTS = [
  { value: 'a', label: 'Header A' },
  { value: 'b', label: 'Header B' },
  // Header B's visual variants (2026-11-03), in place of the light teal.
  { value: 'b-banner', label: 'Header B, teal banner' },
  { value: 'b-strip', label: 'Header B, banner strip' },
  { value: 'b-watermark', label: 'Header B, watermark' },
  { value: 'c', label: 'Header C' },
  { value: 'd', label: 'Header D' },
]

// Header concept D's status (2026-11-03): last active as a chip, its dot green within the past week.
function ActiveStatus({ last }) {
  let recent = false
  try { recent = agoRank(last) <= 7 * 1440 } catch { /* an unexpected label reads as not recent */ }
  return (
    <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-brand-border bg-white text-xs font-medium text-brand-text whitespace-nowrap">
      <span className={`w-2 h-2 rounded-full ${recent ? 'bg-state-success' : 'bg-brand-subtext/50'}`} aria-hidden="true" />
      {last === 'Never' ? 'Not active yet' : `Last active ${last}`}
    </span>
  )
}

function IdentityCard({ user }) {
  // Header B with the banner strip and Rings are the picks (2026-11-03); both switchers are commented out.
  // const { userHeader } = useContentConcept()
  const userHeader = 'b-strip'
  // const [view, setView] = useState(readProgress)
  // const choose = v => { setView(v); try { localStorage.setItem(PROGRESS_KEY, v) } catch { /* private window */ } }
  const view = 'rings'
  // Every course the user teaches (2026-11-02), Tier 1 by its grade, Tier 2 and Family by band, Adult wellness by
  // name. Display only.
  const items = user.courses.map(c => ({ progress: user.courseProgress?.[c.id], ...(c.type === 'core'
    ? { key: c.id, tile: <CourseTile course={c} mark={gradeMark(gradeNum(c))} />, name: gradeLabel(gradeNum(c)), sub: 'Tier 1' }
    : { key: c.id, tile: <CourseTile course={c} />, name: c.type === 'adult' ? 'Adult wellness' : levelName(c.grade), sub: c.typeLabel }) }))
  return (
    <ProfileCard
      banner={false}
      title={user.name}
      meta={[[User, user.role], [School, user.sc.name]]}
      // Header concepts (2026-11-03), picked in Nav's switcher on this page: A as it was, B the numbers in the header,
      // C lessons completed large in the header, D last active as a status chip with a course count in its place.
      stats={userHeader === 'c' ? [
        ['Power of Pause', user.pop.toLocaleString()],
        ['Last active', user.last],
        [user.courses.length === 1 ? 'Course' : 'Courses', user.courses.length.toLocaleString()],
      ] : userHeader === 'd' ? [
        [<Defined key="l" definition={LESSON_DEFINITION}>Lessons completed</Defined>, user.lessons.toLocaleString()],
        ['Power of Pause', user.pop.toLocaleString()],
        [user.courses.length === 1 ? 'Course' : 'Courses', user.courses.length.toLocaleString()],
      ] : [
        [<Defined key="l" definition={LESSON_DEFINITION}>Lessons completed</Defined>, user.lessons.toLocaleString()],
        ['Power of Pause', user.pop.toLocaleString()],
        ['Last active', user.last],
      ]}
      statsInHeader={userHeader.startsWith('b')}
      headerStyle={{ 'b-banner': 'banner', 'b-strip': 'strip', 'b-watermark': 'watermark' }[userHeader] ?? 'tint'}
      aside={userHeader === 'c' ? (
        <div className="sm:text-right">
          <p className="text-xs text-brand-subtext"><Defined definition={LESSON_DEFINITION}>Lessons completed</Defined></p>
          <p className="text-[28px] font-bold leading-tight text-brand-text tabular-nums">{user.lessons.toLocaleString()}</p>
        </div>
      ) : userHeader === 'd' ? <ActiveStatus last={user.last} /> : undefined}
      // No date range (2026-11-02); the Filters panel above shows it.
    >
      {/* Top competencies removed 2026-10-29; the competency chart below covers it. */}
      <ProfileSection
        title="Course progress"
        // action={items.length ? <ConceptSelect value={view} onChange={choose} options={PROGRESS_CONCEPTS} name="Course progress concept" /> : null}
      >
        {!items.length ? <p className="text-sm text-brand-subtext">No courses of this type. Try another course type.</p>
          // : view === 'cards' ? <ProgressCards items={items} />
          : view === 'rings' ? <ProgressRings items={items} />
          : view === 'columns' ? <ProgressColumns items={items} />
          : (
            <div className="flex flex-col gap-1">
              {items.map(it => <PageLink key={it.key} tile={it.tile} name={it.name} sub={it.sub} progress={it.progress} />)}
            </div>
          )}
      </ProfileSection>
    </ProfileCard>
  )
}

export default function ContentUser() {
  const { userKey } = useParams()
  // Open at the top (2026-10-28), not at the scroll position of the table the link was in.
  useEffect(() => { window.scrollTo(0, 0) }, [userKey])
  const { state } = useLocation()
  const fromEngagement = state?.from === 'engagement'
  // Engagement's dates hold until the viewer applies their own in the Filters panel.
  const [engWeeks, setEngWeeks] = useState(fromEngagement ? state.weeks : null)
  const { weeks, siteIds, type } = useContentScope({ allSites: true, weeks: engWeeks })
  // Course type (2026-11-03) narrows the page to the user's courses of that type. The user is found without it, so
  // a type they don't teach shows their page with nothing in it rather than "not found".
  const data = useMemo(() => contentData({ siteIds, weeks, family: fromEngagement }), [siteIds.join(), weeks, fromEngagement])
  const typed = useMemo(() => (!type.length ? data : contentData({ siteIds, weeks, type, family: fromEngagement })), [data, siteIds.join(), weeks, type.join(), fromEngagement])
  const base = data.users.find(u => u.key === userKey)
  const user = typed.users.find(u => u.key === userKey) ?? (base && { ...base, courses: [], lessons: 0, pop: 0, comps: Object.fromEntries(Object.keys(base.comps).map(k => [k, 0])) })
  const dayMap = useMemo(() => (!user ? {} : user.other ? otherDayMap(user.sc.id, user.i) : educatorDayMap(user.sc.id, user.i)), [user])
  if (!user) return <NotFound what="User" />

  const back = state?.back // the grade or course page the user was opened from
  // const { userHeader, setUserHeader } = useContentConcept()
  const card = 'bg-white rounded-lg border border-brand-border p-5'
  // Export CSV (2026-11-03), in the Filters panel's 3-dot menu like the course page: the user's course progress, then
  // their lessons completed by competency, in one file.
  function exportCsv() {
    const courseName = c => (c.type === 'core' ? `${gradeLabel(gradeNum(c))}, Tier 1` : c.type === 'adult' ? 'Adult wellness' : `${levelName(c.grade)}, ${c.typeLabel}`)
    const compTotal = COMPETENCIES.reduce((sum, c) => sum + user.comps[c.key], 0)
    const name = user.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    download(`${name}.csv`, ['Section', 'Name', 'Lessons completed', 'Lessons in course', 'Percent'], [
      ...user.courses.map(c => {
        const pr = user.courseProgress?.[c.id] ?? { done: 0, total: c.lessons }
        return ['Course progress', courseName(c), pr.done, pr.total, pr.total ? Math.round((pr.done / pr.total) * 100) : 0]
      }),
      ...COMPETENCIES.map(c => ['Competency', c.label, user.comps[c.key], '', compTotal ? Math.round((user.comps[c.key] / compTotal) * 100) : 0])
        .sort((a, b) => b[2] - a[2]),
    ])
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="px-6 pt-8 pb-8">
      <ContentBreadcrumb trail={[
        fromEngagement ? { label: 'Engagement', to: '/reports/engagement' } : { label: 'Content', to: '/reports/content' },
        ...(back ? [back] : []),
        { label: user.name },
      ]} />
      {/* Filters (2026-10-29): dates, and Course type since 2026-11-03 (a user can teach several types). Site and role
          are fixed for one user. */}
      {/* Header switcher commented out 2026-11-03, Header B with the banner strip picked:
      <div className="flex justify-end mb-3">
        <ConceptSelect value={userHeader} onChange={setUserHeader} options={HEADER_CONCEPTS} name="Header concept" />
      </div> */}
      <ContentFilters
        key={userKey}
        showSite={false}
        showRole={false}
        showType
        initial={engWeeks?.length ? { start: engWeeks[0], end: format(addDays(parseISO(engWeeks[engWeeks.length - 1]), 4), 'yyyy-MM-dd') } : undefined}
        onApply={() => setEngWeeks(null)}
        action={<MoreMenu items={[{ icon: Download, label: 'Export CSV', onSelect: exportCsv }]} />}
      />
      <div className="flex flex-col gap-4">
        <IdentityCard user={user} />
        <div className="flex flex-col gap-4 min-w-0">
          {/* Competencies first (2026-11-02), then the lesson days. */}
          {/* Bars only, with each competency's lessons under its bar (2026-11-03), like the report's concept E. */}
          <CompetencyMix totals={user.comps} view="bars" />
          <section className={card}>
            <h3 className="text-base font-semibold text-brand-text mb-4">Lesson days this school year</h3>
            <EducatorCalendar dayMap={dayMap} />
          </section>
        </div>
      </div>
    </motion.div>
  )
}
