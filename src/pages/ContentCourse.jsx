import { Fragment, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ChevronRight } from 'lucide-react'
import { ALL_COURSES, COMPETENCIES, contentData, gradeLabel, gradeMark, gradeCourse, gradePath } from '../lib/contentReportData'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { ContentFilters, Defined, EmptyState, UsersTable, LESSON_DEFINITION, useContentScope } from './ReportContent'
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
      <ContentBreadcrumb trail={[{ label: 'Lessons', to: '/reports/content' }, { label: `${what} not found` }]} />
      <div className="bg-white rounded-lg border border-brand-border py-12 text-center">
        <p className="text-sm font-semibold text-brand-text">We couldn't find that {what.toLowerCase()}</p>
        <p className="text-sm text-brand-subtext mt-1">It may be outside the sites you can see.</p>
        <Link to="/reports/content" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4">Back to Lessons</Link>
      </div>
    </div>
  )
}

// Schools using the course, most lessons first. The inline bar came out 2026-10-29; the numbers are enough.
function SchoolsTable({ rows }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>School</TableHead>
          <TableHead className="w-48 text-right">Lessons completed</TableHead>
          <TableHead className="w-24 text-right">Users</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(r => (
          <TableRow key={r.sc.id} className="hover:bg-transparent">
            <TableCell className="font-medium">{r.sc.name}</TableCell>
            <TableCell className="text-right tabular-nums">{r.lessons.toLocaleString()}</TableCell>
            <TableCell className="text-right tabular-nums">{r.users}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

// A course or grade page. `part(u)` is the slice of a user's lessons that counts here: { lessons, comps }.
function GroupPage({ title, avatar, meta, users, part, path }) {
  const { siteIds, range } = useContentScope()
  const active = users.filter(u => part(u).lessons > 0)
  const lessons = active.reduce((sum, u) => sum + part(u).lessons, 0)
  const comps = Object.fromEntries(COMPETENCIES.map(c => [c.key, active.reduce((sum, u) => sum + part(u).comps[c.key], 0)]))
  const bySchool = [...active.reduce((m, u) => {
    const r = m.get(u.sc.id) ?? { sc: u.sc, lessons: 0, users: 0 }
    r.lessons += part(u).lessons
    r.users += 1
    return m.set(u.sc.id, r)
  }, new Map()).values()].sort((a, b) => b.lessons - a.lessons)
  const card = 'bg-white rounded-lg border border-brand-border p-5'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="px-6 pt-8 pb-8">
      <ContentBreadcrumb trail={[{ label: 'Lessons', to: '/reports/content' }, { label: title }]} />
      {/* Filters (2026-10-29): Site, User role and dates. Course type is left off, since the page is one grade or course. */}
      <ContentFilters />
      <div className="flex flex-col gap-4">
        {/* The same profile card as a user page (2026-10-27). */}
        <ProfileCard
          avatar={avatar}
          title={title}
          meta={meta}
          stats={[
            [<Defined key="l" definition={LESSON_DEFINITION}>Lessons</Defined>, lessons.toLocaleString()],
            ['Schools', bySchool.length.toLocaleString()],
            ['Users', `${active.length.toLocaleString()} of ${users.length.toLocaleString()}`],
          ]}
          range={range}
        />
        <CompetencyMix totals={comps} />
        <section className={card}>
          <h3 className="text-base font-semibold text-brand-text mb-4">Lessons completed by school</h3>
          {bySchool.length ? <SchoolsTable rows={bySchool} /> : <EmptyState />}
        </section>
        <UsersTable users={users} oneSite={siteIds.length === 1} linked linkState={{ back: { label: title, to: path } }} />
      </div>
    </motion.div>
  )
}

function useScopedUsers() {
  const { weeks, siteIds, role } = useContentScope()
  return useMemo(() => contentData({ siteIds, role, weeks }).users, [siteIds.join(), role, weeks])
}

const whole = u => u
const NONE = { lessons: 0, comps: Object.fromEntries(COMPETENCIES.map(c => [c.key, 0])) }

// "1st grade" with "Tier 1": everyone teaching that grade at that tier. A Tier 2 user counts on each grade their
// level serves, with only that grade's lessons.
export function ContentGrade() {
  const { grade, tier } = useParams()
  useEffect(() => { window.scrollTo(0, 0) }, [grade, tier])
  const g = Number(grade)
  const t = Number(tier)
  const all = useScopedUsers()
  const users = useMemo(() => all.filter(u => u.tier === t && u.grades.includes(g)), [all, g, t])
  const course = gradeCourse(g, t)
  if (!course) return <NotFound what="Grade" />
  return (
    <GroupPage
      key={`${g}-${t}`}
      title={gradeLabel(g)}
      avatar={<CourseTile course={course} size="lg" mark={gradeMark(g)} />}
      meta={[[BookOpen, `Tier ${t}`]]}
      users={users}
      part={u => u.byGrade[g] ?? NONE}
      path={gradePath(g, t)}
    />
  )
}

export default function ContentCourse() {
  const { courseId } = useParams()
  // Open at the top (2026-10-28), not at the scroll position of the table the link was in.
  useEffect(() => { window.scrollTo(0, 0) }, [courseId])
  const course = ALL_COURSES.find(c => String(c.id) === courseId)
  const all = useScopedUsers()
  const users = useMemo(() => all.filter(u => u.course.id === course?.id), [all, course])
  if (!course) return <NotFound what="Course" />
  return (
    <GroupPage
      key={course.id}
      title={course.title}
      avatar={<CourseTile course={course} size="lg" />}
      meta={[[BookOpen, course.typeLabel]]}
      users={users}
      part={whole}
      path={`/reports/content/courses/${course.id}`}
    />
  )
}
