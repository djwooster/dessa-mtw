import { useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Printer, School, Users } from 'lucide-react'
import { schools } from '../lib/report2Data'
import { COMPETENCIES, contentData, coursePart } from '../lib/contentReportData'
import { useRole } from '../lib/roleContext'
import CompetencyMix from '../components/content/CompetencyMix'
import ProfileCard from '../components/content/ProfileCard'
// import EducatorCalendar from '../components/engagement/EducatorCalendar'
// import { educatorDayMap, otherDayMap } from './Report2ConceptE'
import { ContentFilters, Defined, EmptyState, ExportButton, ListCard, MoreMenu, UsersTable, LESSON_DEFINITION, courseGroups, download, groupsOrderLabel, useContentScope } from './ReportContent'
import { ContentBreadcrumb, NotFound } from './ContentCourse'

// Site page (2026-11-05): a site name on a course page, in the report's users table or on a user page opens here.
// The user page's layout, one stack: the strip header with the site's numbers, then lessons completed by course and
// by competency, the site's lesson days, and its users. Follows the report's dates, roles and course types. For
// Program Admins drilling in; a Site Leader's report is already their site, so other sites read as not found.

const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)
const fileName = s => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
// The stat's noun and total read quieter than the count, like the course page's Completed by.
const outOf = (n, total, one, many) => <>{n.toLocaleString()} <span className="text-sm font-normal text-brand-subtext">of {total.toLocaleString()} {total === 1 ? one : many}</span></>

export default function ContentSite() {
  const { siteId } = useParams()
  // Open at the top, not at the scroll position of the table the link was in.
  useEffect(() => { window.scrollTo(0, 0) }, [siteId])
  const { isSiteLeaderView } = useRole()
  const { weeks, role, type, range } = useContentScope()
  const site = schools.find(s => String(s.id) === siteId)
  const data = useMemo(() => (site ? contentData({ siteIds: [site.id], role, type, weeks }) : null), [site, role.join(), type.join(), weeks])
  // Grades and courses open inside the site (2026-11-06): /sites/:id/grades/9, scoped to this site.
  const groups = useMemo(() => (data ? courseGroups(data).map(g => ({ ...g, rows: g.rows.map(r => ({ ...r, to: r.to.replace('/reports/content', `/reports/content/sites/${site.id}`) })) })) : []), [data, site])
  // Every course a user here takes, and those with a lesson in these dates.
  const courses = useMemo(() => {
    if (!data) return { all: 0, done: 0 }
    const ids = new Set(data.users.flatMap(u => u.courses.map(c => c.id)))
    return { all: ids.size, done: [...ids].filter(id => data.users.some(u => coursePart(u, id).lessons > 0)).length }
  }, [data])
  // The calendar counted users per day across the school year, like the user page's lesson days. Removed 2026-11-06,
  // with the calendar below.
  // const dayMap = useMemo(() => {
  //   const map = {}
  //   data?.users.filter(u => !u.quiet).forEach(u => {
  //     Object.keys(u.other ? otherDayMap(u.sc.id, u.i) : educatorDayMap(u.sc.id, u.i)).forEach(k => { map[k] = (map[k] ?? 0) + 1 })
  //   })
  //   return map
  // }, [data])
  // const busiest = Math.max(1, ...Object.values(dayMap))
  if (!site || (isSiteLeaderView && site.id !== schools[0].id)) return <NotFound what="Site" />

  const path = `/reports/content/sites/${site.id}`
  const empty = data.lessons === 0
  const card = 'bg-white rounded-lg border border-brand-border p-5'

  // Each card exports what it shows, like the report's concept E.
  function exportCard(which) {
    if (which === 'courses') {
      download(`${fileName(site.name)}-lessons-completed-by-course.csv`, ['Course type', 'Course', 'Lessons completed'], groups.flatMap(g => g.rows.map(r => [g.label, r.name, r.lessons])))
    } else {
      const total = COMPETENCIES.reduce((sum, c) => sum + data.compTotals[c.key], 0)
      download(`${fileName(site.name)}-lessons-completed-by-competency.csv`, ['Competency', 'Lessons completed', 'Percent of lessons'],
        COMPETENCIES.map(c => [c.label, data.compTotals[c.key], pct(data.compTotals[c.key], total)]).sort((a, b) => b[1] - a[1]))
    }
  }

  function printPage() {
    const prevTitle = document.title
    document.title = `${site.name}, ${range}`
    window.addEventListener('afterprint', () => { document.title = prevTitle }, { once: true })
    window.print()
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="px-6 pt-8 pb-8">
      <ContentBreadcrumb trail={[{ label: 'Content', to: '/reports/content' }, { label: site.name }]} />
      {/* Filters: dates, role and course type. No Site field, since the page is one site. The cards have their own
          Export CSV, so the 3-dot menu is just Print. */}
      <ContentFilters key={siteId} showSite={false} showType action={<MoreMenu items={[{ icon: Printer, label: 'Print', onSelect: printPage }]} />} />
      <div className="flex flex-col gap-4">
        <ProfileCard
          banner={false}
          title={site.name}
          titleIcon={School}
          meta={[[Users, `${data.users.length.toLocaleString()} ${data.users.length === 1 ? 'user' : 'users'}`]]}
          stats={[
            [<Defined key="l" definition={LESSON_DEFINITION}>Lessons completed</Defined>, data.lessons.toLocaleString()],
            ['Completed by', outOf(data.activeUsers, data.users.length, 'user', 'users')],
            ['Completed in', outOf(courses.done, courses.all, 'course', 'courses')],
            ['Power of Pause', data.pop.toLocaleString()],
          ]}
          // The user page's header: a teal strip on top, the numbers beside the name.
          statsInHeader
          headerStyle="strip"
        />
        <ListCard
          title="Lessons completed by course"
          groups={groups}
          columns={[groupsOrderLabel(groups), 'Lessons completed']}
          action={groups.length > 0 ? <ExportButton onClick={() => exportCard('courses')} /> : undefined}
        />
        {empty ? <section className={card}><EmptyState /></section>
          : <CompetencyMix totals={data.compTotals} title="Lessons completed by competency" view="bars" action={<ExportButton onClick={() => exportCard('competencies')} />} />}
        {/* Lesson days removed 2026-11-06:
        <section className={card}>
          <h3 className="text-base font-semibold text-brand-text mb-4">Lesson days this school year</h3>
          <EducatorCalendar dayMap={dayMap} max={busiest} />
        </section> */}
        <UsersTable users={data.users} oneSite linked linkState={{ back: { label: site.name, to: path } }} />
      </div>
    </motion.div>
  )
}
