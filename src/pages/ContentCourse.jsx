import { Fragment, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as Tooltip from '@radix-ui/react-tooltip'
import { BookOpen, ChevronRight, Download } from 'lucide-react'
import { ALL_COURSES, COMPETENCIES, contentData, gradeLabel, gradeMark, gradeCourse, gradePath, teachesGrade, gradePart, teachesCourse, coursePart } from '../lib/contentReportData'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { ContentFilters, Defined, EmptyState, MoreMenu, UsersTable, LESSON_DEFINITION, download, useContentScope } from './ReportContent'
import CompetencyMix from '../components/content/CompetencyMix'
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
      <ContentBreadcrumb trail={[{ label: 'Content', to: '/reports/content' }, { label: `${what} not found` }]} />
      <div className="bg-white rounded-lg border border-brand-border py-12 text-center">
        <p className="text-sm font-semibold text-brand-text">We couldn't find that {what.toLowerCase()}</p>
        <p className="text-sm text-brand-subtext mt-1">It may be outside the sites you can see.</p>
        <Link to="/reports/content" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4">Back to Lessons</Link>
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
function SchoolsTable({ rows }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Site</TableHead>
          <TableHead className="w-48 text-right">Lessons completed</TableHead>
          <TableHead className="w-24 text-right">Users</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(r => (
          <TableRow key={r.sc.id} className="hover:bg-transparent">
            <TableCell className="font-medium">{r.sc.name}</TableCell>
            <TableCell className="text-right tabular-nums">{r.lessons.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums"><SiteUsers row={r} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// A course or grade page. `part(u)` is the slice of a user's lessons that counts here: { lessons, comps }.
function GroupPage({ title, avatar, meta, users, part, path, action }) {
  const { siteIds } = useContentScope()
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
  function exportCsv() {
    const name = `${title}${meta[0]?.[1] ? ` ${meta[0][1]}` : ''}`.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    download(`${name}-sites.csv`, ['Site', 'Lessons completed', 'Users'], bySchool.map(r => [r.sc.name, r.lessons, r.users]))
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="px-6 pt-8 pb-8">
      <ContentBreadcrumb trail={[{ label: 'Content', to: '/reports/content' }, { label: title }]} />
      {/* Filters (2026-10-29): Site, User role and dates. Course type is left off, since the page is one grade or course. */}
      {/* 3-dot menu (2026-11-02): Export CSV of the page's schools, like the report's own menu. */}
      <ContentFilters action={<MoreMenu items={[{ icon: Download, label: 'Export CSV', onSelect: exportCsv }]} />} />
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
            ['Completed at', <>{bySchool.length.toLocaleString()} <span className="text-sm font-normal text-brand-subtext">{bySchool.length === 1 ? 'site' : 'sites'}</span></>],
            ['Completed by', <>{active.length.toLocaleString()} <span className="text-sm font-normal text-brand-subtext">of {users.length.toLocaleString()} {users.length === 1 ? 'user' : 'users'}</span></>],
          ]}
          // No date range here (2026-11-02); the Filters panel above shows it.
          action={action}
          banner={false}
          // The user page's header (2026-11-03): a teal strip on top, the numbers beside the name.
          statsInHeader
          headerStyle="strip"
        />
        {/* Bars only, no dropdown (2026-11-03), like the user page. */}
        <CompetencyMix totals={comps} view="bars" />
        {/* The standard table (2026-11-02): edge to edge in its card, like the users table, not inset. */}
        <section className="bg-white rounded-lg border border-brand-border overflow-hidden">
          <div className="px-4 py-3 border-b border-brand-border">
            <h3 className="text-base font-semibold text-brand-text">Lessons completed by site</h3>
          </div>
          {bySchool.length ? <SchoolsTable rows={bySchool} /> : <EmptyState />}
        </section>
        <UsersTable users={users} oneSite={siteIds.length === 1} linked linkState={{ back: { label: title, to: path } }} />
      </div>
    </motion.div>
  )
}

function useScopedUsers() {
  const { weeks, siteIds, role } = useContentScope()
  return useMemo(() => contentData({ siteIds, role, weeks }).users, [siteIds.join(), role.join(), weeks])
}

// Both tiers of a grade, for the All tiers view (no longer linked to, 2026-11-02).
const sumParts = (a, b) => ({ lessons: a.lessons + b.lessons, comps: Object.fromEntries(COMPETENCIES.map(c => [c.key, a.comps[c.key] + b.comps[c.key]])) })

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
  const all = useScopedUsers()
  const users = useMemo(() => all.filter(u => (t ? teachesGrade(u, g, t) : teachesGrade(u, g, 1) || teachesGrade(u, g, 2))), [all, g, t])
  const course = t ? gradeCourse(g, t) : gradeCourse(g, 1) ?? gradeCourse(g, 2)
  if (!course || (t && t !== 1 && t !== 2)) return <NotFound what="Grade" />
  return (
    <GroupPage
      key={`${g}-${t}`}
      title={gradeLabel(g)}
      avatar={<CourseTile course={course} size="lg" mark={gradeMark(g)} />}
      meta={[[BookOpen, t ? `Tier ${t}` : 'Tier 1 and Tier 2']]}
      users={users}
      part={u => (t ? gradePart(u, g, t) : sumParts(gradePart(u, g, 1), gradePart(u, g, 2)))}
      path={gradePath(g, t)}
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
  const all = useScopedUsers()
  const users = useMemo(() => all.filter(u => course && teachesCourse(u, course.id)), [all, course])
  if (!course) return <NotFound what="Course" />
  return (
    <GroupPage
      key={course.id}
      title={course.title}
      avatar={<CourseTile course={course} size="lg" />}
      meta={[[BookOpen, course.typeLabel]]}
      users={users}
      part={u => coursePart(u, course.id)}
      path={`/reports/content/courses/${course.id}`}
    />
  )
}
