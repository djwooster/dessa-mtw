// ── School days: 4 weeks (Mar 24 – Apr 18, 2026), weekends excluded ───────────

export const SCHOOL_DAYS = [
  { date: '2026-03-24', week: 1, dayLabel: 'M', weekLabel: 'Week 1  ·  Mar 24–28' },
  { date: '2026-03-25', week: 1, dayLabel: 'T', weekLabel: 'Week 1  ·  Mar 24–28' },
  { date: '2026-03-26', week: 1, dayLabel: 'W', weekLabel: 'Week 1  ·  Mar 24–28' },
  { date: '2026-03-27', week: 1, dayLabel: 'T', weekLabel: 'Week 1  ·  Mar 24–28' },
  { date: '2026-03-28', week: 1, dayLabel: 'F', weekLabel: 'Week 1  ·  Mar 24–28' },

  { date: '2026-03-31', week: 2, dayLabel: 'M', weekLabel: 'Week 2  ·  Mar 31–Apr 4' },
  { date: '2026-04-01', week: 2, dayLabel: 'T', weekLabel: 'Week 2  ·  Mar 31–Apr 4' },
  { date: '2026-04-02', week: 2, dayLabel: 'W', weekLabel: 'Week 2  ·  Mar 31–Apr 4' },
  { date: '2026-04-03', week: 2, dayLabel: 'T', weekLabel: 'Week 2  ·  Mar 31–Apr 4' },
  { date: '2026-04-04', week: 2, dayLabel: 'F', weekLabel: 'Week 2  ·  Mar 31–Apr 4' },

  { date: '2026-04-07', week: 3, dayLabel: 'M', weekLabel: 'Week 3  ·  Apr 7–11' },
  { date: '2026-04-08', week: 3, dayLabel: 'T', weekLabel: 'Week 3  ·  Apr 7–11' },
  { date: '2026-04-09', week: 3, dayLabel: 'W', weekLabel: 'Week 3  ·  Apr 7–11' },
  { date: '2026-04-10', week: 3, dayLabel: 'T', weekLabel: 'Week 3  ·  Apr 7–11' },
  { date: '2026-04-11', week: 3, dayLabel: 'F', weekLabel: 'Week 3  ·  Apr 7–11' },

  { date: '2026-04-14', week: 4, dayLabel: 'M', weekLabel: 'Week 4  ·  Apr 14–18' },
  { date: '2026-04-15', week: 4, dayLabel: 'T', weekLabel: 'Week 4  ·  Apr 14–18' },
  { date: '2026-04-16', week: 4, dayLabel: 'W', weekLabel: 'Week 4  ·  Apr 14–18' },
  { date: '2026-04-17', week: 4, dayLabel: 'T', weekLabel: 'Week 4  ·  Apr 14–18' },
  { date: '2026-04-18', week: 4, dayLabel: 'F', weekLabel: 'Week 4  ·  Apr 14–18' },
]

export const SCHOOLS = ['Riverside Elementary', 'Oakwood Middle', 'Summit Academy']

// "Today" from the report's perspective (last school day)
export const REPORT_TODAY = '2026-04-18'

// School days from Sep 2025 start through Apr 18, 2026 (accounts for holidays + PD days)
export const YTD_DAYS = 140

// ── Deterministic duration generator ─────────────────────────────────────────
// Returns seconds in range based on engagement level, seeded by position.
function dur(level, i) {
  const f = Math.abs(Math.sin(i * 127.1 + 311.7) * 43758.5453) % 1
  switch (level) {
    case 'd': return Math.floor(300 + f * 600)   // 5–15 min
    case 'a': return Math.floor(60  + f * 240)   // 1–5 min
    case 'b': return Math.floor(5   + f * 55)    // 5–59 sec
    default:  return 0
  }
}

function makeDays(pattern) {
  return SCHOOL_DAYS.map((day, i) => ({
    ...day,
    level: pattern[i],            // 'd' | 'a' | 'b' | 'n'
    durationSecs: dur(pattern[i], i),
  }))
}

// ── Teachers ──────────────────────────────────────────────────────────────────
// Pattern strings: 20 chars (one per school day, oldest→newest)
// d=deep(5+min)  a=active(1-5min)  b=brief(<1min)  n=none

export const TEACHERS = [
  // ── Riverside Elementary ──────────────────────────────────────────────────
  { id: 1,  firstName: 'Maya',   lastName: 'Anderson', school: 'Riverside Elementary',
    ytdPct: 85,   // daily habit — deep every day, rarely misses
    days: makeDays('ddddaddddadddddadddd') },  // 18/20 — misses only 2 days
  { id: 2,  firstName: 'Carlos', lastName: 'Bennett',  school: 'Riverside Elementary',
    ytdPct: 44,   // front-loads the week, skips Th/F consistently
    days: makeDays('ddnnnddnnndaannnddnn') },  // 9/20 — Mon–Wed only pattern
  { id: 3,  firstName: 'Jordan', lastName: 'Davis',    school: 'Riverside Elementary',
    ytdPct: 18,   // went cold after week 2, one brief check-in since
    days: makeDays('daadddnnnnnnnnbnnnnn') },  // 7/20 — dropped off wk 3
  { id: 4,  firstName: 'Raj',    lastName: 'Iyer',     school: 'Riverside Elementary',
    ytdPct: 93,   // perfect streak, deep engagement every day
    days: makeDays('dddddddddddddddddddd') },  // 20/20 — perfect

  // ── Oakwood Middle ────────────────────────────────────────────────────────
  { id: 5,  firstName: 'Priya',  lastName: 'Evans',    school: 'Oakwood Middle',
    ytdPct: 68,   // end-of-week pattern — Thu/Fri deep, Mon light or skip
    days: makeDays('nnaddbnaaddnnaaddnadd') },  // 13/20 — Th/F heavy
  { id: 6,  firstName: 'Luis',   lastName: 'Garcia',   school: 'Oakwood Middle',
    ytdPct: 74,   // strong start, completely stopped wk 4 — needs follow-up
    days: makeDays('ddddddddddddddaannnn') },  // 16/20 — stalled last 5 days
  { id: 7,  firstName: 'Alex',   lastName: 'Johnson',  school: 'Oakwood Middle',
    ytdPct: 11,   // sporadic brief visits, no real engagement
    days: makeDays('nbnnnnnbnnnnnnnbnnbn') },  // 4/20 — brief only
  { id: 8,  firstName: 'Sarah',  lastName: 'Kim',      school: 'Oakwood Middle',
    ytdPct: 79,   // improving trajectory — started slow, now consistent deep
    days: makeDays('nnaannaadadddddddadd') },  // 14/20 — ramping up

  // ── Summit Academy ────────────────────────────────────────────────────────
  { id: 9,  firstName: 'Wei',    lastName: 'Chen',     school: 'Summit Academy',
    ytdPct: 91,   // top performer, deep every day without fail
    days: makeDays('dddddddddddddddddadd') },  // 19/20 — near perfect
  { id: 10, firstName: 'Sam',    lastName: 'Foster',   school: 'Summit Academy',
    ytdPct: 52,   // mid-week drop — misses Wed every week
    days: makeDays('adnadnadnadnadnadnad') },  // 12/20 — consistent Wed gaps
  { id: 11, firstName: 'Tina',   lastName: 'Harris',   school: 'Summit Academy',
    ytdPct: 33,   // late bloomer — inactive early, re-engaged wks 3–4
    days: makeDays('nnnnnnnnnnnaadaddddd') },  // 8/20 — strong finish
  { id: 12, firstName: 'Maria',  lastName: 'Lopez',    school: 'Summit Academy',
    ytdPct: 61,   // reliable but brief — shows up daily, never deep
    days: makeDays('ababaababaababaababaa') },  // 16/20 — brief/active only
]

// ── Generated teachers (ids 13–175) ──────────────────────────────────────────
const FIRST_NAMES = ['James','Olivia','Liam','Emma','Noah','Ava','Ethan','Sophia','Mason','Isabella','Logan','Mia','Lucas','Charlotte','Aiden','Amelia','Jackson','Harper','Sebastian','Evelyn','Mateo','Abigail','Jack','Emily','Owen','Elizabeth','Theodore','Sofia','Elijah','Avery','Henry','Ella','Gabriel','Scarlett','Carter','Grace','Julian','Chloe','Levi','Victoria','Isaiah','Riley','Jayden','Aria','Lincoln','Lily','Daniel','Aubrey','Michael','Zoey']
const LAST_NAMES  = ['Smith','Johnson','Williams','Brown','Jones','Garcia','Miller','Davis','Wilson','Taylor','Moore','Jackson','Martin','Lee','Thompson','White','Harris','Clark','Lewis','Robinson','Walker','Hall','Allen','Young','Hernandez','King','Wright','Scott','Green','Baker','Adams','Nelson','Carter','Mitchell','Perez','Roberts','Turner','Phillips','Campbell','Parker','Evans','Edwards','Collins','Stewart','Sanchez','Morris','Rogers','Reed','Cook','Morgan']
const GEN_SCHOOLS = ['Riverside Elementary','Oakwood Middle','Summit Academy','Lincoln High','Cedar Park Elementary','Westview Middle']

function rng(seed) { return (Math.abs(Math.sin(seed * 9301 + 49297) * 233280) % 1) }

const generated = Array.from({ length: 163 }, (_, i) => {
  const id    = i + 13
  const r     = s => rng(id * 7 + s)
  const pattern = Array.from({ length: 20 }, (__, j) => {
    const v = rng(id * 31 + j * 17)
    return v < 0.15 ? 'n' : v < 0.30 ? 'b' : v < 0.55 ? 'a' : 'd'
  }).join('')
  return {
    id,
    firstName: FIRST_NAMES[Math.floor(r(1) * FIRST_NAMES.length)],
    lastName:  LAST_NAMES[Math.floor(r(2)  * LAST_NAMES.length)],
    school:    GEN_SCHOOLS[Math.floor(r(3)  * GEN_SCHOOLS.length)],
    ytdPct:    Math.floor(r(4) * 91) + 5,
    days:      makeDays(pattern),
  }
})

export const ALL_TEACHERS = [...TEACHERS, ...generated]
