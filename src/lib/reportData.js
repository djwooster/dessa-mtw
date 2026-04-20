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
    days: makeDays('ddadddadddddadddddad') },  // heavy — 17/20 active
  { id: 2,  firstName: 'Carlos', lastName: 'Bennett',  school: 'Riverside Elementary',
    days: makeDays('anadnanandaandnaanda') },  // moderate — 12/20 active
  { id: 3,  firstName: 'Jordan', lastName: 'Davis',    school: 'Riverside Elementary',
    days: makeDays('nnbnnannnbnnannbnnan') },  // light — 5/20 active
  { id: 4,  firstName: 'Raj',    lastName: 'Iyer',     school: 'Riverside Elementary',
    days: makeDays('ddddadddddaddddddadd') },  // heavy — 19/20 active

  // ── Oakwood Middle ────────────────────────────────────────────────────────
  { id: 5,  firstName: 'Priya',  lastName: 'Evans',    school: 'Oakwood Middle',
    days: makeDays('adnandaandnandaanand') },  // moderate — 13/20 active
  { id: 6,  firstName: 'Luis',   lastName: 'Garcia',   school: 'Oakwood Middle',
    days: makeDays('dddddddddnaannnnnnnn') },  // dropping off — 11/20 active
  { id: 7,  firstName: 'Alex',   lastName: 'Johnson',  school: 'Oakwood Middle',
    days: makeDays('nnnnnnnnnnnnnbnnnnnn') },  // nearly inactive — 1/20 active
  { id: 8,  firstName: 'Sarah',  lastName: 'Kim',      school: 'Oakwood Middle',
    days: makeDays('addaddaadadddaddadda') },  // mod-high — 16/20 active

  // ── Summit Academy ────────────────────────────────────────────────────────
  { id: 9,  firstName: 'Wei',    lastName: 'Chen',     school: 'Summit Academy',
    days: makeDays('dddddaddddddaddddadd') },  // heavy — 19/20 active
  { id: 10, firstName: 'Sam',    lastName: 'Foster',   school: 'Summit Academy',
    days: makeDays('adadadadadadadadadad') },  // consistent — 10/20 active
  { id: 11, firstName: 'Tina',   lastName: 'Harris',   school: 'Summit Academy',
    days: makeDays('nnnnnannbbaadadadddd') },  // improving — 11/20 active
  { id: 12, firstName: 'Maria',  lastName: 'Lopez',    school: 'Summit Academy',
    days: makeDays('andaandaanndandaanda') },  // moderate — 13/20 active
]
