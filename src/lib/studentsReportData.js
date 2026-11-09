import { schools, schoolWeeks, getWeekData, matchesSite, NO_SCHOOL_WEEKS, TODAY_WEEK_IDX } from './report2Data'

// Students report mock data (2026-10-26). Replaces the legacy MTW Students tab (Content Flagging Score, Student
// Mood Breakdown pie, Mood History lines). Each enrolled student checks in on about 30 percent of weeks, once or
// twice, with one mood per check-in. A very small share of journals gets a high flag score (5 or 6) and lands in
// Needs a check-in. Students are names only, never emails or IDs. Deterministic, so every render agrees. Mock only.

// Mood order, labels and colors are fixed. Each fill clears 3:1 against white and none is red, so Lonely reads calm.
export const MOODS = [
  { key: 'grateful', label: 'Grateful', weight: 30, fill: 'bg-org-green-600' },
  { key: 'happy',    label: 'Happy',    weight: 28, fill: 'bg-org-primary-500' },
  { key: 'ok',       label: 'Ok',       weight: 20, fill: 'bg-mtw-purple' },
  { key: 'neutral',  label: 'Neutral',  weight: 14, fill: 'bg-org-gray-500' },
  { key: 'lonely',   label: 'Lonely',   weight: 8,  fill: 'bg-org-primary-800' },
]

// Privacy threshold: a site's week only counts toward moods once 10 or more of its students checked in.
export const MIN_STUDENTS = 10

export const FLAG_REASONS = ['Worried', 'Feeling down', 'Feeling left out', 'Safety']

// Enrolled students per site, 250 to 700. Summit Academy is deliberately tiny so picking it alone shows the
// privacy empty state.
const SMALL_SITE = 3
export const ENROLLMENT = Object.fromEntries(schools.map(s => [s.id, s.id === SMALL_SITE ? 18 : 250 + (hash(s.id, 'enrolled', 0) % 451)]))

const FIRST = [
  'Ava', 'Liam', 'Mia', 'Noah', 'Zoe', 'Mateo', 'Layla', 'Ethan', 'Chloe', 'Jayden', 'Nora', 'Elijah', 'Isla', 'Kai',
  'Amelia', 'Lucas', 'Aria', 'Diego', 'Maya', 'Owen', 'Leah', 'Caleb', 'Ruby', 'Jamal', 'Ella', 'Theo', 'Imani', 'Leo',
]
const LAST = [
  'Alvarez', 'Bennett', 'Brooks', 'Castillo', 'Chang', 'Diaz', 'Foster', 'Gomez', 'Hayes', 'Ibrahim', 'Jensen', 'Kim',
  'Lopez', 'Morales', 'Nash', 'Okafor', 'Price', 'Quinn', 'Reyes', 'Shah', 'Sullivan', 'Tran', 'Vargas', 'Wells',
]

function hash(a, b, c) {
  let h = 2166136261
  const s = `${a}|${b}|${c}`
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h
}

const studentName = (siteId, si) => `${FIRST[hash(siteId, si, 'first') % FIRST.length]} ${LAST[hash(siteId, si, 'last') % LAST.length]}`

const GRADES = {
  Elementary: ['K', '1', '2', '3', '4', '5'],
  Middle: ['6', '7', '8'],
  High: ['9', '10', '11', '12'],
  Academy: ['K', '1', '2', '3', '4', '5', '6', '7', '8'],
}
function gradeFor(site, si) {
  const list = GRADES[Object.keys(GRADES).find(b => site.name.includes(b)) ?? 'Elementary']
  const g = list[hash(site.id, si, 'grade') % list.length]
  return g === 'K' ? 'Kindergarten' : `Grade ${g}`
}

// Each student has one educator, picked from the site's educators.
function educatorFor(siteId, si) {
  const staff = getWeekData(siteId, schoolWeeks[0]).teachers.filter(t => t.role === 'Educator')
  return staff[hash(siteId, si, 'educator') % staff.length].name
}

// Mood weights drift a little per site and per week (plus or minus about 25 percent each) so the chart has shape.
function moodFor(siteId, weekIdx, h) {
  const w = MOODS.map(m => m.weight * (0.75 + (hash(siteId, m.key, 'site') % 26) / 100 + (hash(weekIdx, m.key, 'week') % 26) / 100))
  let r = (h % 10000) / 10000 * w.reduce((a, b) => a + b, 0)
  for (let i = 0; i < MOODS.length; i++) { r -= w[i]; if (r < 0) return MOODS[i].key }
  return MOODS[MOODS.length - 1].key
}

// Days of the week (Mon 0 to Fri 4) that have happened. Only today's week is cut short.
function lastDay(weekIdx) {
  if (weekIdx !== TODAY_WEEK_IDX) return 4
  const d = new Date().getDay()
  return d === 0 || d === 6 ? 4 : d - 1
}

const addDays = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return d
}
const toKey = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

// One site's week: every check-in, and how many distinct students checked in.
const weekCache = {}
function siteWeek(siteId, week) {
  const k = `${siteId}|${week}`
  if (weekCache[k]) return weekCache[k]
  const weekIdx = schoolWeeks.indexOf(week)
  const checkins = []
  const students = new Set()
  if (!NO_SCHOOL_WEEKS.includes(week)) {
    const maxDay = lastDay(weekIdx)
    for (let si = 0; si < ENROLLMENT[siteId]; si++) {
      if (hash(siteId * 1000 + si, weekIdx, 'in') % 100 >= 30) continue
      const times = hash(siteId * 1000 + si, weekIdx, 'times') % 100 < 20 ? 2 : 1
      for (let j = 0; j < times; j++) {
        const h = hash(siteId * 1000 + si, weekIdx, j)
        const day = (h >>> 8) % 5
        if (day > maxDay) continue
        students.add(si)
        // Flag score 0 to 6, as in the legacy report. Only 5 and 6 need a check-in, about 2 in 1,000 journals.
        const f = (h >>> 16) % 1000
        const score = f < 1 ? 6 : f < 2 ? 5 : f % 5
        checkins.push({ si, day, mood: moodFor(siteId, weekIdx, h), score })
      }
    }
  }
  weekCache[k] = { checkins, students }
  return weekCache[k]
}

const emptyMoods = () => Object.fromEntries(MOODS.map(m => [m.key, 0]))

// Everything the report shows for a site scope and list of weeks.
export function studentsData({ siteIds, weeks }) {
  const picked = schools.filter(s => matchesSite(siteIds, s.id))
  const enrolled = picked.reduce((sum, s) => sum + ENROLLMENT[s.id], 0)
  const moodTotals = emptyMoods()
  const flagged = []
  let checkins = 0
  let checkedIn = 0

  const weekly = weeks.map(week => ({ week, moods: emptyMoods(), total: 0, checkins: 0 }))
  picked.forEach(sc => {
    const seen = new Set()
    weeks.forEach((week, wi) => {
      const { checkins: list, students } = siteWeek(sc.id, week)
      checkins += list.length
      weekly[wi].checkins += list.length
      students.forEach(si => seen.add(si))
      // Below the threshold, this site's moods for the week stay out of every mood number.
      if (students.size >= MIN_STUDENTS) {
        list.forEach(c => {
          weekly[wi].moods[c.mood] += 1
          weekly[wi].total += 1
          moodTotals[c.mood] += 1
        })
      }
      list.forEach(c => {
        if (c.score < 5) return
        const date = addDays(week, c.day)
        flagged.push({
          id: `${sc.id}-${week}-${c.si}-${c.day}`,
          name: studentName(sc.id, c.si),
          grade: gradeFor(sc, c.si),
          sc,
          educator: educatorFor(sc.id, c.si),
          date: toKey(date),
          reason: FLAG_REASONS[hash(sc.id, c.si, week) % FLAG_REASONS.length],
          score: c.score,
        })
      })
    })
    checkedIn += seen.size
  })

  flagged.sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name))
  return {
    enrolled,
    checkins,
    checkedIn,
    weekly,
    moodTotals,
    moodTotal: Object.values(moodTotals).reduce((a, b) => a + b, 0),
    flagged,
  }
}
