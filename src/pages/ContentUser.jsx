import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ChevronRight, School, User } from 'lucide-react'
import { contentData, gradeLabel, gradeMark } from '../lib/contentReportData'
import CompetencyMix from '../components/content/CompetencyMix'
import ProfileCard, { ProfileSection, CourseTile } from '../components/content/ProfileCard'
import { educatorDayMap, otherDayMap } from './Report2ConceptE'
import EducatorCalendar from '../components/engagement/EducatorCalendar'
import { addDays, format, parseISO } from 'date-fns'
import { ContentFilters, Defined, LESSON_DEFINITION, useContentScope } from './ReportContent'
import { ContentBreadcrumb, NotFound } from './ContentCourse'

// User page (Content concept C, 2026-10-27): a user's name in the Content report or on a course page opens here.
// Finds the user at any site the viewer can see (a Site Leader only their own), and follows the report's dates.
// The Engagement report's user names open it too (2026-10-27), with Engagement's dates and breadcrumb.
// Layout (2026-10-27, from profile references the user shared): one full-width stack, the user's pick over a card on
// the left. An identity card (teal banner with navy flowers, avatar, name, three numbers, then top competencies and
// course sections split by dotted lines), then the Engagement drill down's lesson calendar and the full competency
// mix. Read only.

// One link row in the card: a tile, a name and a line under it.
// Display only (2026-11-02): the course rows were links, now they just say what the user teaches.
function PageLink({ tile, name, sub }) {
  return (
    <div className="flex items-center gap-3 min-w-0 py-1.5">
      {tile}
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-brand-text truncate">{name}</span>
        <span className="block text-xs text-brand-subtext truncate">{sub}</span>
      </span>
    </div>
  )
}

const gradeNum = c => (c.grade === 'Kindergarten' ? 0 : Number(c.grade.replace('Grade ', '')))
const levelName = t => t.charAt(0) + t.slice(1).toLowerCase()

function IdentityCard({ user }) {
  // Every course the user teaches (2026-11-02), Tier 1 by its grade, Tier 2 and Family by band, Adult wellness by
  // name. Display only.
  const items = user.courses.map(c => (c.type === 'core'
    ? { key: c.id, tile: <CourseTile course={c} mark={gradeMark(gradeNum(c))} />, name: gradeLabel(gradeNum(c)), sub: 'Tier 1' }
    : { key: c.id, tile: <CourseTile course={c} />, name: c.type === 'adult' ? 'Adult wellness' : levelName(c.grade), sub: c.typeLabel }))
  return (
    <ProfileCard
      banner={false}
      title={user.name}
      meta={[[User, user.role], [School, user.sc.name]]}
      stats={[
        [<Defined key="l" definition={LESSON_DEFINITION}>Lessons completed</Defined>, user.lessons.toLocaleString()],
        ['Power of Pause', user.pop.toLocaleString()],
        ['Last active', user.last],
      ]}
      // No date range (2026-11-02); the Filters panel above shows it.
    >
      {/* Top competencies removed 2026-10-29; the competency chart below covers it. */}
      <ProfileSection title={items.length > 1 ? 'Courses' : 'Course'}>
        {items.length ? (
          <div className="flex flex-col gap-1">
            {items.map(it => <PageLink key={it.key} tile={it.tile} name={it.name} sub={it.sub} />)}
          </div>
        ) : <p className="text-sm text-brand-subtext">No courses of this type. Try another course type.</p>}
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
  const typed = useMemo(() => (type === 'all' ? data : contentData({ siteIds, weeks, type, family: fromEngagement })), [data, siteIds.join(), weeks, type, fromEngagement])
  const base = data.users.find(u => u.key === userKey)
  const user = typed.users.find(u => u.key === userKey) ?? (base && { ...base, courses: [], lessons: 0, pop: 0, comps: Object.fromEntries(Object.keys(base.comps).map(k => [k, 0])) })
  const dayMap = useMemo(() => (!user ? {} : user.other ? otherDayMap(user.sc.id, user.i) : educatorDayMap(user.sc.id, user.i)), [user])
  if (!user) return <NotFound what="User" />

  const back = state?.back // the grade or course page the user was opened from
  const card = 'bg-white rounded-lg border border-brand-border p-5'

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="px-6 pt-8 pb-8">
      <ContentBreadcrumb trail={[
        fromEngagement ? { label: 'Engagement', to: '/reports/engagement' } : { label: 'Lessons', to: '/reports/content' },
        ...(back ? [back] : []),
        { label: user.name },
      ]} />
      {/* Filters (2026-10-29): dates, and Course type since 2026-11-03 (a user can teach several types). Site and role
          are fixed for one user. */}
      <ContentFilters
        key={userKey}
        showSite={false}
        showRole={false}
        showType
        initial={engWeeks?.length ? { start: engWeeks[0], end: format(addDays(parseISO(engWeeks[engWeeks.length - 1]), 4), 'yyyy-MM-dd') } : undefined}
        onApply={() => setEngWeeks(null)}
      />
      <div className="flex flex-col gap-4">
        <IdentityCard user={user} />
        <div className="flex flex-col gap-4 min-w-0">
          {/* Competencies first (2026-11-02), then the lesson days. */}
          <CompetencyMix totals={user.comps} />
          <section className={card}>
            <h3 className="text-base font-semibold text-brand-text mb-4">Lesson days this school year</h3>
            <EducatorCalendar dayMap={dayMap} />
          </section>
        </div>
      </div>
    </motion.div>
  )
}
