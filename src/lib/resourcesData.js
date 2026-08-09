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
export const TYPES = ['video', 'pdf', 'audio']

const GRADE_ORDER = [
  'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5',
  'Grade 6', 'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  'Early Elementary', 'Late Elementary', 'Middle School', 'High School',
  'Adult Wellness',
]

function inferType(title) {
  if (/podcast/i.test(title)) return 'audio'
  if (/guide|materials|printouts|poster|notes|worksheet/i.test(title)) return 'pdf'
  return 'video'
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

const rows = [
  ...courses.flatMap((course) => flattenCourse({ course, unitsList: tier1Units, category: 'Tier 1' })),
  ...tier2Courses.flatMap((course) => flattenCourse({ course, unitsList: tier2EarlyElementaryUnits, category: 'Tier 2' })),
  ...adultWellnessCourses.flatMap((course) => flattenCourse({ course, unitsList: adultWellnessUnits, category: 'Adult Wellness' })),
  ...familyCourses.flatMap((course) => flattenCourse({
    course,
    unitsList: familyUnitsByGrade[course.grade] ?? [],
    category: 'Family',
  })),
]

export const resources = rows.map((r, i) => ({ id: i + 1, ...r }))

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
