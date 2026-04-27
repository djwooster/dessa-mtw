export const schools = [
  { id:  1, name: 'Riverside Elementary',  color: '#2A7F8F', initials: 'RE' },
  { id:  2, name: 'Oakwood Middle',         color: '#F5A623', initials: 'OM' },
  { id:  3, name: 'Summit Academy',         color: '#7B5EA7', initials: 'SA' },
  { id:  4, name: 'Lincoln Elementary',     color: '#E8653A', initials: 'LE' },
  { id:  5, name: 'Jefferson Middle',       color: '#5B9E4D', initials: 'JM' },
  { id:  6, name: 'Washington High',        color: '#3B7DD8', initials: 'WH' },
  { id:  7, name: 'Cedar Park Elementary',  color: '#C0874A', initials: 'CP' },
  { id:  8, name: 'Maple Grove Middle',     color: '#16A085', initials: 'MG' },
  { id:  9, name: 'Pine Ridge High',        color: '#8E44AD', initials: 'PR' },
  { id: 10, name: 'Valley View Elementary', color: '#D35400', initials: 'VV' },
  { id: 11, name: 'Sunset Middle',          color: '#2980B9', initials: 'SM' },
  { id: 12, name: 'Meadowbrook Elementary', color: '#27AE60', initials: 'ME' },
  { id: 13, name: 'Lakeside High',          color: '#C0392B', initials: 'LH' },
  { id: 14, name: 'Hillcrest Elementary',   color: '#1ABC9C', initials: 'HC' },
  { id: 15, name: 'Westwood Middle',        color: '#E74C3C', initials: 'WM' },
  { id: 16, name: 'Northside Elementary',   color: '#3498DB', initials: 'NE' },
  { id: 17, name: 'Eastgate High',          color: '#9B59B6', initials: 'EH' },
  { id: 18, name: 'Creekside Elementary',   color: '#F39C12', initials: 'CE' },
  { id: 19, name: 'Fairview Middle',        color: '#1B7A4B', initials: 'FM' },
  { id: 20, name: 'Heritage Elementary',    color: '#2C3E50', initials: 'HE' },
]

// Teachers per school (district total: ~460)
const TEACHER_COUNTS = {
   1: 24,  2: 28,  3: 21,  4: 18,  5: 22,
   6: 32,  7: 19,  8: 25,  9: 30, 10: 17,
  11: 23, 12: 16, 13: 31, 14: 20, 15: 26,
  16: 18, 17: 29, 18: 15, 19: 24, 20: 22,
}

// School-level engagement tendency (0–1) — varied to tell different stories
const SCHOOL_TENDENCY = {
   1: 0.76,  2: 0.67,  3: 0.61,  4: 0.79,  5: 0.68,
   6: 0.72,  7: 0.58,  8: 0.74,  9: 0.65, 10: 0.82,
  11: 0.69, 12: 0.56, 13: 0.71, 14: 0.84, 15: 0.63,
  16: 0.77, 17: 0.60, 18: 0.87, 19: 0.70, 20: 0.73,
}

const TITLES   = ['Ms.', 'Mr.', 'Ms.', 'Mr.', 'Ms.', 'Mr.', 'Ms.', 'Mr.']
const SURNAMES = [
  'Garcia',    'Thompson', 'Lee',       'Davis',    'Patel',    'Chen',
  'Nguyen',    'Rodriguez','Williams',  'Johnson',  'Brown',    'Taylor',
  'Jackson',   'White',    'Martinez',  'Lewis',    'Thomas',   'Moore',
  'Walker',    'Allen',    'Young',     'Hernandez','King',     'Wright',
  'Scott',     'Torres',   'Hill',      'Adams',    'Baker',    'Nelson',
  'Carter',    'Mitchell', 'Roberts',   'Turner',   'Phillips', 'Campbell',
  'Parker',    'Evans',    'Edwards',   'Collins',  'Stewart',  'Morris',
  'Murphy',    'Cook',     'Rogers',
]

function det(a, b, c) {
  let h = 5381
  const s = `${a}|${b}|${c}`
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) + h + s.charCodeAt(i)) & 0x7fffffff
  }
  return h % 97
}

function getRoster(schoolId) {
  const count = TEACHER_COUNTS[schoolId]
  const pool = [...SURNAMES]
  for (let i = pool.length - 1; i > 0; i--) {
    const j = det(schoolId, i, 77) % (i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]]
  }
  return pool.slice(0, count).map((surname, ti) => {
    const title = TITLES[det(schoolId * 3, ti, 0) % TITLES.length]
    return `${title} ${surname}`
  })
}

function getBaseline(schoolId, ti) {
  const base  = SCHOOL_TENDENCY[schoolId]
  const noise = (det(schoolId * 7, ti, 42) / 97) * 0.36 - 0.18
  return Math.max(0.15, Math.min(0.95, base + noise))
}

function formatDate(d) {
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function generateSchoolWeeks() {
  const weeks = []
  const d = new Date(2025, 8, 1)
  const end = new Date(2026, 3, 21)
  while (d < end) {
    weeks.push(formatDate(new Date(d)))
    d.setDate(d.getDate() + 7)
  }
  return weeks
}

export const schoolWeeks = generateSchoolWeeks()

const rosterCache = {}
function getCachedRoster(schoolId) {
  if (!rosterCache[schoolId]) rosterCache[schoolId] = getRoster(schoolId)
  return rosterCache[schoolId]
}

export function getWeekData(schoolId, weekStart, goal = 3) {
  const weekIdx = schoolWeeks.indexOf(weekStart)
  if (weekIdx === -1) return null
  const teachers = getCachedRoster(schoolId)
  const count    = teachers.length

  const teacherData = teachers.map((name, ti) => {
    const h1 = det(schoolId, ti, weekIdx)
    const metGoal = h1 < Math.round(getBaseline(schoolId, ti) * 97)
    const h2 = det(schoolId + 10, ti, weekIdx)
    const daysActive = metGoal ? goal + (h2 % (5 - goal + 1)) : h2 % goal
    return { name, daysActive, metGoal }
  })

  const meetingGoal = teacherData.filter(t => t.metGoal).length
  const pct = Math.round((meetingGoal / count) * 100)
  return { weekStart, totalTeachers: count, meetingGoal, pct, teachers: teacherData }
}

export const MOST_RECENT_WEEK = schoolWeeks[schoolWeeks.length - 1]

export function getDistrictWeekData(weekStart, goal = 3) {
  const all = schools.map(s => getWeekData(s.id, weekStart, goal))
  const totalTeachers = all.reduce((s, d) => s + d.totalTeachers, 0)
  const totalOnTrack  = all.reduce((s, d) => s + d.meetingGoal,   0)
  return { weekStart, totalTeachers, totalOnTrack, pct: Math.round((totalOnTrack / totalTeachers) * 100) }
}

export function getDistrictTrend(goal = 3) {
  return schoolWeeks.map(w => getDistrictWeekData(w, goal))
}

export function getSchoolTrend(schoolId, goal = 3) {
  return schoolWeeks.map(w => ({ weekStart: w, pct: getWeekData(schoolId, w, goal).pct }))
}
