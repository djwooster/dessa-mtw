// Flattened, searchable index of every lesson-level resource across all four
// MTW content categories — generated from the same course/unit data that
// powers Curriculum.jsx and LessonView.jsx, so there's one source of truth.
// A resource used across multiple grades (e.g. a Tier 1 video that appears
// in every grade's Unit 1) produces one row per grade — matching how the
// content actually renders in each course, and how it should be found/
// filtered by grade.
import { units as tier1Units } from './mtwData'
import { courses, tier2Courses, adultWellnessCourses, familyCourses } from './courseData'
import { tier2EarlyElementaryUnits, adultWellnessUnits, familyUnitsByGrade } from './lessonUnitsData'

export const CATEGORIES = ['Tier 1', 'Tier 2', 'Adult Wellness', 'Family']
export const TYPES = ['video', 'pdf', 'worksheets', 'audio']

const GRADE_ORDER = [
  'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  'Early Elementary', 'Late Elementary', 'Middle School', 'High School',
  'Adult Wellness',
]

// Titles that don't otherwise match the pdf/audio keyword patterns below but
// render as an image-link-out resource in LessonView.jsx, not a video.
const PDF_TITLE_OVERRIDES = new Set(['Overview of MTW Competencies'])

function inferType(title) {
  if (/podcast/i.test(title)) return 'audio'
  if (PDF_TITLE_OVERRIDES.has(title)) return 'pdf'
  // Student-facing practice materials get their own type, distinct from
  // facilitator-facing guides/posters/notes (still 'pdf').
  if (/materials|printouts|worksheet/i.test(title)) return 'worksheets'
  if (/guide|poster|notes/i.test(title)) return 'pdf'
  return 'video'
}

// Placeholder summary text standing in for real Facilitation Guide copy
// (not yet authored per-lesson) — generated from each row's own category/
// competency/grade so results read as distinct, sensible blurbs rather than
// one repeated sentence.
const TYPE_VERB = { video: 'walks through', pdf: 'outlines', worksheets: 'provides', audio: 'introduces' }
function placeholderDescription({ title, type, category, competency, grade }) {
  return `This ${category.toLowerCase()} resource ${TYPE_VERB[type]} "${title}", building ${competency} skills for ${grade}.`
}

function flattenCourse({ course, unitsList, category }) {
  const rows = []
  for (const unit of unitsList) {
    for (const lessonTitle of unit.sub) {
      rows.push({
        title: lessonTitle,
        type: inferType(lessonTitle),
        category,
        grade: course.grade,
        competency: course.competency,
        courseId: course.id,
        courseTitle: course.title,
        unitId: unit.id,
        unitTitle: unit.title,
      })
    }
  }
  return rows
}

// Tier 1 lessons render as a video plus a printable Facilitation Guide
// (LessonView.jsx's "Facilitation Guide" section with a Print button) — every
// lesson gets one except Power of Pause, which shows a video collection
// instead. Each video's companion guide is generated right alongside it.
function flattenTier1Course({ course, unitsList, category }) {
  const rows = []
  for (const video of flattenCourse({ course, unitsList, category })) {
    rows.push(video)
    if (video.title !== 'Power of Pause') {
      rows.push({ ...video, title: `${video.title} — Facilitation Guide`, type: 'pdf' })
    }
  }
  return rows
}

// Two Adult Wellness lessons carry more than one media type in LessonView.jsx
// (a dev-reference demo of the audio media type): "Breathe Easier" adds audio
// alongside its video, and "Flight, Fight or Freeze" is PDF + audio with no
// video at all. Overriding here keeps the index honest to what's really there.
const ADULT_WELLNESS_MEDIA_OVERRIDES = {
  'Independent: Breathe Easier': ['video', 'audio'],
  'Independent: Flight, Fight or Freeze': ['pdf', 'audio'],
}

function flattenAdultWellnessCourse({ course, unitsList, category }) {
  const rows = []
  for (const unit of unitsList) {
    for (const lessonTitle of unit.sub) {
      const types = ADULT_WELLNESS_MEDIA_OVERRIDES[lessonTitle] ?? [inferType(lessonTitle)]
      for (const type of types) {
        rows.push({
          title: lessonTitle,
          type,
          category,
          grade: course.grade,
          competency: course.competency,
          courseId: course.id,
          courseTitle: course.title,
          unitId: unit.id,
          unitTitle: unit.title,
        })
      }
    }
  }
  return rows
}

const rows = [
  ...courses.flatMap((course) => flattenTier1Course({ course, unitsList: tier1Units, category: 'Tier 1' })),
  ...tier2Courses.flatMap((course) => flattenCourse({ course, unitsList: tier2EarlyElementaryUnits, category: 'Tier 2' })),
  ...adultWellnessCourses.flatMap((course) => flattenAdultWellnessCourse({ course, unitsList: adultWellnessUnits, category: 'Adult Wellness' })),
  ...familyCourses.flatMap((course) => flattenCourse({
    course,
    unitsList: familyUnitsByGrade[course.grade] ?? [],
    category: 'Family',
  })),
]

// Sorted with rare types (audio has only 3 rows total) floated to the very
// front, then everything else alphabetically by title — rather than left in
// data-generation order (which would otherwise dump all ~4,000 Tier 1 rows
// first, burying rare types past page 200 even alphabetically).
// A handful of rows also touch on secondary competencies (e.g. a Relationship
// Skills lesson that also builds Self-Awareness) — surfaced in the UI as a
// "+N more" badge next to the primary competency tag. Assigned deterministically
// by id so the set is stable across renders, not randomly on every load.
const COMPETENCY_POOL = [...new Set(rows.map((r) => r.competency))].sort()
function extraCompetenciesFor(id, primary) {
  const pool = COMPETENCY_POOL.filter((c) => c !== primary)
  const count = id % 5 === 0 ? 2 : id % 5 === 1 ? 1 : 0
  return Array.from({ length: count }, (_, k) => pool[(id + k) % pool.length])
}

const RARE_TYPES = new Set(['audio'])
export const resources = [...rows]
  .sort((a, b) => {
    const rareDiff = (RARE_TYPES.has(b.type) ? 1 : 0) - (RARE_TYPES.has(a.type) ? 1 : 0)
    return rareDiff !== 0 ? rareDiff : a.title.localeCompare(b.title)
  })
  .map((r, i) => {
    const id = i + 1
    return { id, ...r, description: placeholderDescription(r), extraCompetencies: extraCompetenciesFor(id, r.competency) }
  })

function sortByGradeOrder(values) {
  return [...values].sort((a, b) => GRADE_ORDER.indexOf(a) - GRADE_ORDER.indexOf(b))
}

export const ALL_GRADES = sortByGradeOrder([...new Set(resources.map((r) => r.grade))])
export const ALL_COMPETENCIES = [...new Set(resources.map((r) => r.competency))].sort()

export function courseFor(resource) {
  const byCategory = {
    'Tier 1': courses,
    'Tier 2': tier2Courses,
    'Adult Wellness': adultWellnessCourses,
    Family: familyCourses,
  }
  return byCategory[resource.category]?.find((c) => c.id === resource.courseId)
}
