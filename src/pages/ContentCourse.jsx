import { Fragment, useEffect, useMemo } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react'
import { ALL_COURSES, COMPETENCIES, contentData } from '../lib/contentReportData'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { Defined, EmptyState, UsersTable, LESSON_DEFINITION, useContentScope } from './ReportContent'
import CompetencyMix from '../components/content/CompetencyMix'
import ProfileCard, { ProfileSection, TopCompetencies, CourseTile } from '../components/content/ProfileCard'

// Course page (Content concept C, 2026-10-27): a course row in the Content report opens here. Follows the report's
// dates and Site filter, and counts every user taking the course (role and course type don't narrow it).
// Layout (2026-10-27): the user page's profile card (course tile, type and grade, three numbers, focus and top
// competencies), then the schools using the course, its full competency mix and its users, in one stack.

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
        <Link to="/reports/content" className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4">Back to Content</Link>
      </div>
    </div>
  )
}

// Schools using the course, most lessons first, with an inline bar against the top school.
function SchoolsTable({ rows }) {
  const max = Math.max(1, ...rows.map(r => r.lessons))
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>School</TableHead>
          <TableHead className="w-[45%]">Lessons completed</TableHead>
          <TableHead className="w-24 text-right">Users</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map(r => (
          <TableRow key={r.sc.id} className="hover:bg-transparent">
            <TableCell className="font-medium">{r.sc.name}</TableCell>
            <TableCell>
              <div className="flex items-center gap-3">
                <span className="w-12 shrink-0 tabular-nums text-brand-text">{r.lessons.toLocaleString()}</span>
                <span className="flex-1 h-2 rounded-full bg-brand-bg overflow-hidden" aria-hidden="true">
                  <span className="block h-full rounded-full bg-dessa-teal" style={{ width: `${(r.lessons / max) * 100}%` }} />
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right tabular-nums">{r.users}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export default function ContentCourse() {
  const { courseId } = useParams()
  // Open at the top (2026-10-28), not at the scroll position of the table the link was in.
  useEffect(() => { window.scrollTo(0, 0) }, [courseId])
  const course = ALL_COURSES.find(c => String(c.id) === courseId)
  const { weeks, siteIds, range } = useContentScope()
  const data = useMemo(() => contentData({ siteIds, weeks }), [siteIds.join(), weeks])
  const users = useMemo(() => data.users.filter(u => u.course.id === course?.id), [data, course])
  if (!course) return <NotFound what="Course" />

  const active = users.filter(u => u.lessons > 0)
  const lessons = active.reduce((sum, u) => sum + u.lessons, 0)
  const comps = Object.fromEntries(COMPETENCIES.map(c => [c.key, active.reduce((sum, u) => sum + u.comps[c.key], 0)]))
  const bySchool = [...active.reduce((m, u) => {
    const r = m.get(u.sc.id) ?? { sc: u.sc, lessons: 0, users: 0 }
    r.lessons += u.lessons
    r.users += 1
    return m.set(u.sc.id, r)
  }, new Map()).values()].sort((a, b) => b.lessons - a.lessons)
  const oneSite = siteIds.length === 1
  const card = 'bg-white rounded-lg border border-brand-border p-5'
  const focus = COMPETENCIES.find(c => c.label === course.competency)

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="px-6 pt-8 pb-8">
      <ContentBreadcrumb trail={[{ label: 'Content', to: '/reports/content' }, { label: course.title }]} />
      <div className="flex flex-col gap-4">
        {/* The same profile card as a user page (2026-10-27), with the course's tile as its avatar. */}
        <ProfileCard
          avatar={<CourseTile course={course} size="lg" />}
          title={course.title}
          meta={[[BookOpen, course.typeLabel], [GraduationCap, course.grade]]}
          stats={[
            [<Defined key="l" definition={LESSON_DEFINITION}>Lessons</Defined>, lessons.toLocaleString()],
            ['Schools', bySchool.length.toLocaleString()],
            ['Users', `${active.length.toLocaleString()} of ${users.length.toLocaleString()}`],
          ]}
          range={range}
        >
          <ProfileSection title="Focus">
            <span className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-brand-border text-xs font-medium text-brand-text">
              {focus && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: focus.color }} aria-hidden="true" />}
              {course.competency}
            </span>
          </ProfileSection>
          <ProfileSection title="Top competencies">
            <TopCompetencies comps={comps} />
          </ProfileSection>
        </ProfileCard>

        <section className={card}>
          <h3 className="text-base font-semibold text-brand-text mb-4">Lessons completed by school</h3>
          {bySchool.length ? <SchoolsTable rows={bySchool} /> : <EmptyState />}
        </section>
        <CompetencyMix totals={comps} />
        <UsersTable users={users} oneSite={oneSite} linked showCourse={false} linkState={{ fromCourse: course.id }} />
      </div>
    </motion.div>
  )
}
