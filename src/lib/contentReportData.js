import { schools, schoolWeeks, getWeekData, matchesSite, getOtherUsers, getOtherDays, DISTRICT_OFFICE, PAST_WEEKS } from './report2Data'
import { courses, tier2Courses, adultWellnessCourses, familyCourses } from './courseData'
import { getLastActive, getOtherLastActive } from '../pages/Report2ConceptE'

// Content report mock data (2026-10-26). Built on the Engagement report's data so the two agree: each user's
// lessons in a week are their days active that week (one lesson a day) from report2Data. Each user takes one
// course, picked by their role and their site's grade band, and every lesson is tagged with one competency
// (usually the course's own) and whether it was a Power of Pause lesson. Mock only.
// All user types count (2026-10-26): Educators teach core courses, School Support runs Tier 2, families take the
// Family series, and Site Leaders and Program Admins take Adult wellness. This folds the legacy Extra Courses tab in.

// The legacy Content report's six competencies. Colors are org and MTW tokens that each clear 3:1 on white
// (2026-10-26, the first pass's yellow and light coral did not), with no red.
export const COMPETENCIES = [
  { key: 'sa',  label: 'Self-Awareness',              color: '#007da8' }, // org primary 600
  { key: 'soc', label: 'Social Awareness',            color: '#108d1d' }, // org green 600
  { key: 'sm',  label: 'Self-Management',             color: '#E8653A' }, // mtw coral (3.3:1)
  { key: 'rs',  label: 'Relationship Skills',         color: '#2A7F8F' }, // dessa teal
  { key: 'rd',  label: 'Responsible Decision-Making', color: '#414a4d' }, // org gray 700
  { key: 'ot',  label: 'Optimistic Thinking',         color: '#7B5EA7' }, // mtw purple
]
// Two courses are tagged Goal-Directed Behavior, which isn't one of the six; it counts as Self-Management.
const COMPETENCY_ALIASES = { 'Goal-Directed Behavior': 'Self-Management' }

export const COURSE_TYPES = [
  { value: 'core', label: 'Tier 1' }, // "Core" until 2026-10-29
  { value: 'tier2', label: 'Tier 2' },
  { value: 'adult', label: 'Adult wellness' },
  { value: 'family', label: 'Family' },
]
const TYPE_LABEL = Object.fromEntries(COURSE_TYPES.map(t => [t.value, t.label]))

// No dashes in user-facing titles: "Tier 2 — Early Elementary" reads "Tier 2, Early Elementary".
const tidy = (list, type) => list.map(c => ({ ...c, type, typeLabel: TYPE_LABEL[type], title: c.title.replace(' — ', ', ') }))
const CORE = tidy(courses.filter(c => c.grade === 'Kindergarten' || c.grade.startsWith('Grade ')), 'core')
const TIER2 = tidy(tier2Courses, 'tier2')
const ADULT = tidy(adultWellnessCourses, 'adult')
const FAMILY = tidy(familyCourses, 'family')
// Every course the report can show, for the course page (Content concept C, 2026-10-27).
export const ALL_COURSES = [...CORE, ...TIER2, ...ADULT, ...FAMILY]

const gradeNum = c => (c.grade === 'Kindergarten' ? 0 : Number(c.grade.split(' ')[1]))
const BANDS = {
  Elementary: CORE.filter(c => gradeNum(c) <= 5),
  Middle: CORE.filter(c => gradeNum(c) >= 6 && gradeNum(c) <= 8),
  High: CORE.filter(c => gradeNum(c) >= 9),
  Academy: CORE.filter(c => gradeNum(c) <= 8),
}
// Tier 2 and Family courses come in four levels; each band picks the levels that fit it.
const LEVELS = {
  Elementary: ['Early Elementary', 'Late Elementary'],
  Middle: ['Middle School'],
  High: ['High School'],
  Academy: ['Late Elementary', 'Middle School'],
}
// Grade pages (2026-10-29): two rows per grade in the Courses table, Tier 1 and Tier 2. Tier 2 courses come in four
// levels, not grades, so a small group's lessons land on the grades its level serves. Mock only.
const LEVEL_GRADES = { 'Early Elementary': [0, 1, 2], 'Late Elementary': [3, 4, 5], 'Middle School': [6, 7, 8], 'High School': [9, 10, 11, 12] }
const ordinal = n => `${n}${n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th'}`
export const gradeLabel = g => (g === 0 ? 'Kindergarten' : `${ordinal(g)} grade`)
export const gradeMark = g => (g === 0 ? 'K' : String(g))
export const gradePath = (g, tier) => `/reports/content/grades/${g}/${tier}`
export const tierOf = course => (course.type === 'core' ? 1 : course.type === 'tier2' ? 2 : null)
const gradesFor = course => (course.type === 'core' ? [gradeNum(course)] : course.type === 'tier2' ? LEVEL_GRADES[course.grade] : [])
// The course behind a grade row, for its tile color.
export const gradeCourse = (g, tier) => (tier === 1 ? CORE.find(c => gradeNum(c) === g) : TIER2.find(c => LEVEL_GRADES[c.grade].includes(g)))
// What the users table shows for a course: "1st grade, Tier 1", "Early elementary, Tier 2", or the course's title.
const sentence = t => t.charAt(0) + t.slice(1).toLowerCase()
const courseLabel = c => (c.type === 'core' ? `${gradeLabel(gradeNum(c))}, Tier 1` : c.type === 'tier2' ? `${sentence(c.grade)}, Tier 2` : c.title)

const bandFor = name => Object.keys(BANDS).find(b => name.includes(b)) ?? 'Elementary'

function hash(a, b, c) {
  let h = 2166136261
  const s = `${a}|${b}|${c}`
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h % 100
}
const pick = (list, h) => list[h % list.length]

// `ti` is the staff roster index, or 'o' plus the index for users without a weekly goal.
export function courseFor(site, ti, role) {
  const band = bandFor(site.name)
  const h = hash(site.id, ti, 'course')
  if (role === 'Site Leader' || role === 'Program Admin') return ADULT[0]
  if (role === 'School Support') return pick(TIER2.filter(c => LEVELS[band].includes(c.grade)), h)
  if (role === 'Family User') return pick(FAMILY.filter(c => LEVELS[band].includes(c.grade)), h)
  return pick(BANDS[band], h)
}

// A few users teach more than one course (2026-10-29), for the user page: Aisha Garcia at Heritage Elementary
// teaches Kindergarten, 1st and 2nd grade. Same tier only, so a user's grades all sit on one tier's pages.
const EXTRA_COURSES = { '20-11': [1, 2].map(g => CORE.find(c => gradeNum(c) === g)) }
// "1st grade, Tier 1", or "3 grades, Tier 1" for a user who teaches several.
const usersCourseLabel = list => (list.length > 1 ? `${list.length} grades, Tier ${tierOf(list[0])}` : courseLabel(list[0]))

const keyFor = label => COMPETENCIES.find(c => c.label === (COMPETENCY_ALIASES[label] ?? label))?.key

// One user's lessons in one week: [{ comp, pop }]. Half are the course's own competency. Optimistic Thinking, which
// no course is built around, gets a tenth of every course (2026-10-26) as a newer strand, so it isn't last by
// construction; the rest spread over all six.
// A user with several courses spreads their lessons across them.
function userWeekLessons(seed, ti, weekIdx, days, list) {
  return Array.from({ length: days }, (_, j) => {
    const h = hash(seed * 31, `${ti}`, `${weekIdx}-${j}`)
    const course = list[hash(seed * 13, `${ti}`, `${weekIdx}-${j}`) % list.length]
    const own = keyFor(course.competency)
    const grades = gradesFor(course)
    return {
      course,
      grade: grades.length ? grades[hash(seed * 17, `${ti}`, `${weekIdx}-${j}`) % grades.length] : null,
      comp: h < 50 ? own : h < 60 ? 'ot' : COMPETENCIES[h % COMPETENCIES.length].key,
      pop: hash(seed + 7, `${ti}-${weekIdx}`, j) < 9,
    }
  })
}

// A course is its unit count times about 4 lessons a unit (mtwData.js).
const LESSONS_PER_UNIT = 4
const emptyComps = () => Object.fromEntries(COMPETENCIES.map(c => [c.key, 0]))

// Lessons a user has completed in their course from the first week of school through `endIdx`.
const toDateCache = {}
function lessonsToDate(key, daysFor, endIdx) {
  const k = `${key}|${endIdx}`
  if (toDateCache[k] == null) toDateCache[k] = PAST_WEEKS.slice(0, endIdx + 1).reduce((sum, w, i) => sum + daysFor(w, i), 0)
  return toDateCache[k]
}

// Everyone the report can count at a site scope, with how to read their days active in a week.
function people(siteIds) {
  const picked = schools.filter(s => matchesSite(siteIds, s.id))
  const staff = picked.flatMap(sc => getWeekData(sc.id, schoolWeeks[0]).teachers.map((t, ti) => ({
    key: `${sc.id}-${ti}`, sc, i: ti, name: t.name, role: t.role, seed: sc.id, ti,
    daysFor: w => getWeekData(sc.id, w).teachers[ti].daysActive,
    last: () => getLastActive(sc.id, ti),
  })))
  const sites = siteIds && siteIds.length ? picked : [...picked, DISTRICT_OFFICE]
  const others = sites.flatMap(sc => getOtherUsers(sc.id).map(u => ({
    key: `${sc.id}-o${u.idx}`, sc, i: u.idx, name: u.name, role: u.role, seed: sc.id + 1000, ti: `o${u.idx}`, other: true,
    daysFor: (w, weekIdx = schoolWeeks.indexOf(w)) => getOtherDays(sc.id, u.idx, weekIdx),
    last: () => getOtherLastActive(sc.id, u.idx),
  })))
  return [...staff, ...others]
}

// Where a group of users is in their course: the typical (median) unit and the middle half's spread.
const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.max(0, Math.round(q * (sorted.length - 1))))]
export function pace(users) {
  const units = users.map(u => u.unit).sort((a, b) => a - b)
  return units.length ? { unitTypical: quantile(units, 0.5), unitLow: quantile(units, 0.25), unitHigh: quantile(units, 0.75) } : { unitTypical: 1, unitLow: 1, unitHigh: 1 }
}

// Grade bands for the Content B concept (2026-10-27): core courses by grade, the other course types as their own band.
export const BANDS_ORDER = ['Elementary', 'Middle school', 'High school', 'Tier 2', 'Adult wellness', 'Family']
export function bandOf(course) {
  if (course.type !== 'core') return course.typeLabel
  const g = gradeNum(course)
  return g <= 5 ? 'Elementary' : g <= 8 ? 'Middle school' : 'High school'
}

// Everything the report shows for a site scope, role, course type and list of weeks.
export function contentData({ siteIds, role = 'all', type = 'all', weeks }) {
  const weekly = weeks.map(week => ({ week, comps: emptyComps(), total: 0 }))
  const compTotals = emptyComps()
  const byCourse = new Map()
  const users = []
  let lessons = 0
  let pop = 0
  // Course progress runs through the end of the selected range (2026-10-26), like every other column.
  const endIdx = Math.min(PAST_WEEKS.length - 1, schoolWeeks.indexOf(weeks[weeks.length - 1]))

  people(siteIds).forEach(p => {
    if (role !== 'all' && p.role !== role) return
    const course = courseFor(p.sc, p.ti, p.role)
    if (type !== 'all' && course.type !== type) return
    const list = [course, ...(EXTRA_COURSES[p.key] ?? [])]
    const grades = list.flatMap(gradesFor)
    // `byGrade` is { grade: { lessons, comps } }, for the grade pages; `byCourseLessons` is lessons per course id.
    const user = { key: p.key, sc: p.sc, i: p.i, name: p.name, role: p.role, other: !!p.other, course, courses: list, courseLabel: usersCourseLabel(list), tier: tierOf(course), grades, byGrade: {}, byCourseLessons: {}, lessons: 0, pop: 0, comps: emptyComps(), last: p.last() }
    weeks.forEach((w, wi) => {
      const weekIdx = schoolWeeks.indexOf(w)
      userWeekLessons(p.seed, p.ti, weekIdx, p.daysFor(w, weekIdx), list).forEach(l => {
        user.lessons += 1
        user.byCourseLessons[l.course.id] = (user.byCourseLessons[l.course.id] ?? 0) + 1
        user.comps[l.comp] += 1
        if (l.grade != null) {
          const bg = (user.byGrade[l.grade] ??= { lessons: 0, comps: emptyComps() })
          bg.lessons += 1
          bg.comps[l.comp] += 1
        }
        weekly[wi].comps[l.comp] += 1
        weekly[wi].total += 1
        compTotals[l.comp] += 1
        if (l.pop) { user.pop += 1; pop += 1 }
      })
    })
    lessons += user.lessons
    // Most covered: the competency with the most lessons, or "Mixed" when two or more tie for the top.
    const best = Math.max(...Object.values(user.comps))
    const tops = COMPETENCIES.filter(c => best > 0 && user.comps[c.key] === best)
    user.top = tops.length === 1 ? tops[0] : tops.length > 1 ? { key: 'mixed', label: 'Mixed', color: null } : null
    // Not every lesson moves a class forward (repeats, extra practice, a late start), so each user's place in the
    // course runs at 50 to 110% of their lessons completed. Mock spread, so classes aren't all on the same unit.
    const done = endIdx < 0 ? 0 : Math.round(lessonsToDate(p.key, p.daysFor, endIdx) * (0.5 + hash(p.seed, p.ti, 'pace') * 0.006))
    user.progress = Math.min(1, done / (course.lessons * LESSONS_PER_UNIT))
    // Pace (2026-10-27): the unit the user is on by the end of the range, 1 to the course's unit count.
    user.unit = Math.min(course.lessons, Math.floor(done / LESSONS_PER_UNIT) + 1)
    users.push(user)

    list.forEach(c => {
      const n = user.byCourseLessons[c.id] ?? 0
      const row = byCourse.get(c.id) ?? { course: c, lessons: 0, users: [], pop: 0 }
      row.lessons += n
      row.pop += c === course ? user.pop : 0
      if (n > 0) row.users.push(user)
      byCourse.set(c.id, row)
    })
  })

  const courseRows = [...byCourse.values()]
    .filter(r => r.lessons > 0)
    .map(r => ({ ...r, progress: Math.round((r.users.reduce((sum, u) => sum + u.progress, 0) / r.users.length) * 100), ...pace(r.users) }))

  // A Tier 1 and a Tier 2 row per grade, for every grade and tier with users in scope.
  const gradeRows = []
  for (let g = 0; g <= 12; g++) {
    [1, 2].forEach(tier => {
      const eligible = users.filter(u => u.tier === tier && u.grades.includes(g))
      if (eligible.length) gradeRows.push({ key: `${g}-${tier}`, g, tier, course: gradeCourse(g, tier), lessons: eligible.reduce((sum, u) => sum + (u.byGrade[g]?.lessons ?? 0), 0) })
    })
  }

  return { gradeRows, lessons, pop, activeUsers: users.filter(u => u.lessons > 0).length, users, courseRows, weekly, compTotals }
}
