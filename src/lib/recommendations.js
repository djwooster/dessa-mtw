import { courses } from './courseData'
import { CLASS_COMPETENCY_DATA } from './classCompetencyData'

// The class-level "insight -> impact" recommendation engine: ranks
// competencies by how many students rated Need, then anchors each to a real
// Tier 1 MTW course tagged with that competency. Competencies with no
// matching course (matchKey === null) are skipped rather than surfacing a
// dead-end recommendation.
export function topRecommendations(limit = 3) {
  return [...CLASS_COMPETENCY_DATA]
    .filter((c) => c.matchKey)
    .sort((a, b) => b.need - a.need)
    .slice(0, limit)
    .map((c) => ({
      ...c,
      total: c.strength + c.typical + c.need,
      course: courses.find((course) => course.competency === c.matchKey) ?? null,
    }))
    .filter((c) => c.course)
}
