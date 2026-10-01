import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { ALL_TEACHERS, SCHOOL_DAYS, REPORT_TODAY } from './reportData'

// Shared logic for the Site Leader concepts on the Daily Curriculum
// Engagement report. "Completed a lesson" reuses the prototype's existing
// rule: any day with a level other than 'n' counts. A school day is the unit
// for "days since", so weekends never inflate the count.

export const DCE_SITES = [...new Set(ALL_TEACHERS.map((t) => t.school))].sort()
export const DEFAULT_SITE = 'Riverside Elementary'

const TODAY_IDX = SCHOOL_DAYS.findIndex((d) => d.date === REPORT_TODAY)
const CURRENT_WEEK = SCHOOL_DAYS[TODAY_IDX].week
export const WINDOW_DAYS = SCHOOL_DAYS.length

export const completed = (day) => day.level !== 'n'
export const todayLabel = () => format(parseISO(REPORT_TODAY), 'EEEE, MMM d')
export const formatDay = (iso) => format(parseISO(iso), 'EEE, MMM d')

export function getDceRow(teacher) {
  const doneToday = completed(teacher.days[TODAY_IDX])
  let since = null // null = no lesson completed in the whole window
  for (let i = TODAY_IDX; i >= 0; i--) {
    if (completed(teacher.days[i])) { since = TODAY_IDX - i; break }
  }
  const weekDays = teacher.days.filter((d) => d.week === CURRENT_WEEK)
  const lastDate = since === null ? null : teacher.days[TODAY_IDX - since].date
  return {
    teacher,
    name: `${teacher.firstName} ${teacher.lastName}`,
    doneToday,
    since,
    sinceSort: since === null ? WINDOW_DAYS : since,
    lastDate,
    weekDays,
    weekCount: weekDays.filter(completed).length,
    windowCount: teacher.days.filter(completed).length,
  }
}

export function sinceLabel(since) {
  if (since === 0) return 'Today'
  if (since === 1) return 'Yesterday'
  if (since === null) return `None in ${WINDOW_DAYS} school days`
  return `${since} school days ago`
}

// Severity of a gap, for a small marker next to the label. Never the only
// signal: the label text always carries the same information.
export function sinceTone(since) {
  if (since === null || since >= 5) return 'high'
  if (since >= 2) return 'medium'
  return 'none'
}

// Not-yet-today teachers first, longest gap first, then by name.
export function byPriority(a, b) {
  if (a.doneToday !== b.doneToday) return a.doneToday ? 1 : -1
  return b.sinceSort - a.sinceSort || a.name.localeCompare(b.name)
}

export function useDceRoster(site, search) {
  return useMemo(() => {
    const q = search.trim().toLowerCase()
    return ALL_TEACHERS
      .filter((t) => t.school === site)
      .map(getDceRow)
      .filter((r) => !q || r.name.toLowerCase().includes(q))
  }, [site, search])
}
