import { useEffect, useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, School, User } from 'lucide-react'
import { ALL_COURSES, contentData } from '../lib/contentReportData'
import CompetencyMix from '../components/content/CompetencyMix'
import ProfileCard, { ProfileSection, TopCompetencies, CourseTile, initials } from '../components/content/ProfileCard'
import { educatorDayMap, otherDayMap } from './Report2ConceptE'
import EducatorCalendar from '../components/engagement/EducatorCalendar'
import { Defined, LESSON_DEFINITION, useContentScope } from './ReportContent'
import { ContentBreadcrumb, NotFound } from './ContentCourse'

// User page (Content concept C, 2026-10-27): a user's name in the Content report or on a course page opens here.
// Finds the user at any site the viewer can see (a Site Leader only their own), and follows the report's dates.
// The Engagement report's user names open it too (2026-10-27), with Engagement's dates and breadcrumb.
// Layout (2026-10-27, from profile references the user shared): one full-width stack, the user's pick over a card on
// the left. An identity card (teal banner with navy flowers, avatar, name, three numbers, then top competencies and
// course sections split by dotted lines), then the Engagement drill down's lesson calendar and the full competency
// mix. Read only.

function IdentityCard({ user, range }) {
  const c = user.course
  return (
    <ProfileCard
      avatar={
        <span className="w-20 h-20 rounded-full ring-4 ring-white bg-white flex items-center justify-center" aria-hidden="true">
          <span className="w-full h-full rounded-full bg-dessa-teal/10 text-dessa-teal text-2xl font-semibold flex items-center justify-center">{initials(user.name)}</span>
        </span>
      }
      title={user.name}
      meta={[[User, user.role], [School, user.sc.name]]}
      stats={[
        [<Defined key="l" definition={LESSON_DEFINITION}>Lessons</Defined>, user.lessons.toLocaleString()],
        ['Power of Pause', user.pop.toLocaleString()],
        ['Last active', user.last],
      ]}
      range={range}
    >
      <ProfileSection title="Top competencies">
        <TopCompetencies comps={user.comps} />
      </ProfileSection>

      <ProfileSection title="Course">
        <Link to={`/reports/content/courses/${c.id}`} className="group flex items-center gap-3 min-w-0 -mx-2 px-2 py-1.5 rounded-md hover:bg-brand-bg transition-colors">
          <CourseTile course={c} />
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-medium text-brand-text truncate group-hover:text-dessa-teal">{c.title}</span>
            <span className="block text-xs text-brand-subtext truncate">{c.typeLabel} · {c.grade}</span>
          </span>
          <ChevronRight size={14} className="shrink-0 text-brand-subtext transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
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
  const { weeks, siteIds, range } = useContentScope({ allSites: true, weeks: fromEngagement ? state.weeks : null })
  const data = useMemo(() => contentData({ siteIds, weeks }), [siteIds.join(), weeks])
  const user = data.users.find(u => u.key === userKey)
  const dayMap = useMemo(() => (!user ? {} : user.other ? otherDayMap(user.sc.id, user.i) : educatorDayMap(user.sc.id, user.i)), [user])
  if (!user) return <NotFound what="User" />

  const fromCourse = ALL_COURSES.find(c => c.id === state?.fromCourse)
  const card = 'bg-white rounded-lg border border-brand-border p-5'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="px-6 pt-8 pb-8">
      <ContentBreadcrumb trail={[
        fromEngagement ? { label: 'Engagement', to: '/reports/engagement' } : { label: 'Content', to: '/reports/content' },
        ...(fromCourse ? [{ label: fromCourse.title, to: `/reports/content/courses/${fromCourse.id}` }] : []),
        { label: user.name },
      ]} />
      <div className="flex flex-col gap-4">
        <IdentityCard user={user} range={range} />
        <div className="flex flex-col gap-4 min-w-0">
          <section className={card}>
            <h3 className="text-base font-semibold text-brand-text mb-4">Lesson days this school year</h3>
            <EducatorCalendar dayMap={dayMap} />
          </section>
          <CompetencyMix totals={user.comps} />
        </div>
      </div>
    </motion.div>
  )
}
