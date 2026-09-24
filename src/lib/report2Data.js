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

// School-level engagement tendency (0–1) — varied to tell different stories.
// 4, 16, and 20 (2026-09-24) are durable "high achiever" schools — close to
// the 0.95 clamp ceiling below, not just scripted for a few recent weeks
// like PEAK_WEEKS — so the strict "every educator met goal" bar reads as
// genuinely, believably cleared by them across the whole year. Note this
// tendency bump alone mainly helps small rosters (the clamp means even a
// perfect-tendency school's odds of an all-pass week are ~0.95^N, weak for
// N>25) — the CHALLENGE_WEEKS override below is what gives the district
// trend its real height for the broader district. This intentionally
// changes what every concept (A/B/C/D/E) shows for these three schools
// across their full history, not just a few cells — confirmed with the
// user as the desired outcome, not an accepted side effect.
const SCHOOL_TENDENCY = {
   1: 0.76,  2: 0.67,  3: 0.33,  4: 0.92,  5: 0.68,
   6: 0.72,  7: 0.37,  8: 0.74,  9: 0.65, 10: 0.82,
  11: 0.69, 12: 0.30, 13: 0.71, 14: 0.84, 15: 0.40,
  16: 0.95, 17: 0.60, 18: 0.87, 19: 0.70, 20: 0.95,
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

// Recent-decline override (2026-09-23) — simulates 1-2 sites that were
// normal historically but dropped off sharply in just the trailing weeks,
// for the Coverage ("went quiet this window") stat concept on the Site
// Engagement report. Keyed by schoolId; `sinceWeeksAgo` counts back from
// the most recent week (inclusive) — everything before that still uses the
// school's normal baseline, so its longer history reads as healthy right
// up until the recent drop, not chronically dark.
const RECENT_DECLINE = {
  11: { sinceWeeksAgo: 4, factor: 0.05 }, // Sunset Middle — normally ~69%
  14: { sinceWeeksAgo: 4, factor: 0.05 }, // Hillcrest Elementary — normally ~84%
}

function getBaseline(schoolId, ti, weekIdx) {
  const base  = SCHOOL_TENDENCY[schoolId]
  const noise = (det(schoolId * 7, ti, 42) / 97) * 0.36 - 0.18
  const normal = Math.max(0.15, Math.min(0.95, base + noise))
  const decline = RECENT_DECLINE[schoolId]
  if (decline && weekIdx != null && weekIdx >= schoolWeeks.length - decline.sinceWeeksAgo) {
    return decline.factor
  }
  return normal
}

// Peak-week override (2026-09-23) — for Concept C's strict "every educator
// at the site met their weekly goal" bar. With real roster sizes (15-32
// teachers) and independent per-teacher odds, the probability of a full
// roster passing together is near zero — simulated, it never once happens
// in the trailing 4 weeks across all 20 schools. Rather than water down the
// all-or-nothing definition, a handful of specific school/weeks are forced
// to a clean pass so the metric has real, varied weeks to point to: a
// perfectly consistent site (Creekside, all 4 of the last 4 weeks), a
// recently-turned-around site (Riverside, most recent 2 weeks), and a
// just-hit-it-this-week site (Valley View, most recent week only). Keyed by
// schoolId; weeksAgo counts back from the most recent week (0 = most
// recent). This does shift what Concept A/B display for these specific
// school/weeks, since getWeekData is shared across all three concepts —
// accepted tradeoff, confirmed with the user.
const PEAK_WEEKS = {
  1:  [0, 1],       // Riverside Elementary
  10: [0],          // Valley View Elementary
  18: [0, 1, 2, 3], // Creekside Elementary
}

function isPeakWeek(schoolId, weekIdx) {
  const offsets = PEAK_WEEKS[schoolId]
  return !!offsets && offsets.includes(schoolWeeks.length - 1 - weekIdx)
}

// District-wide story events (2026-09-24) — the trend still read as too
// flat even after the high-achiever tendency bumps above, because with
// real roster sizes, tendency alone can't reliably lift many schools over
// the strict all-or-nothing bar at once (see the note above SCHOOL_TENDENCY).
// These are deterministic weeks where a specific, named group of schools
// clears the bar together, giving the district trend real height and an
// explainable shape instead of just noise: a Fall Engagement Challenge in
// early November (broad participation, then tapering to a core group), and
// a smaller Spring Challenge in March. Schools not listed for a given week
// fall back to their normal probabilistic behavior. Keyed by weekIdx.
const CHALLENGE_WEEKS = {
  9:  [1, 2, 4, 5, 6, 8, 10, 13, 16, 18, 19, 20], // Nov 3 — Fall Engagement Challenge kicks off
  10: [1, 2, 4, 5, 6, 8, 10, 13, 16, 18, 19, 20], // Nov 10 — broad participation continues
  11: [4, 6, 8, 16, 18, 20],                       // Nov 17 — tapering to the core group
  26: [2, 5, 6, 8, 16, 19, 20],                    // Mar 2 — a smaller Spring Challenge
  27: [2, 5, 6, 8, 16, 19, 20],                    // Mar 9 — spring challenge continues
}

// Winter break (2026-09-24) — engagement genuinely drops for every school
// while school is out, not just the usual low performers. Forces every
// teacher's week to a non-passing day count for these two weeks, overriding
// the normal probabilistic model and any of the overrides above.
const WINTER_BREAK_WEEKS = [16, 17] // Dec 22, Dec 29

function formatDate(d) {
  const y   = d.getFullYear()
  const m   = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function generateSchoolWeeks() {
  const weeks = []
  const d = new Date(2025, 8, 1)
  const end = new Date(2026, 4, 11)
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

  const isWinterBreak  = WINTER_BREAK_WEEKS.includes(weekIdx)
  const isChallengeWeek = CHALLENGE_WEEKS[weekIdx]?.includes(schoolId) ?? false
  const peakWeek = isPeakWeek(schoolId, weekIdx)
  const teacherData = teachers.map((name, ti) => {
    const h1 = det(schoolId, ti, weekIdx)
    const metGoal = isWinterBreak
      ? false
      : peakWeek || isChallengeWeek || h1 < Math.round(getBaseline(schoolId, ti, weekIdx) * 97)
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
