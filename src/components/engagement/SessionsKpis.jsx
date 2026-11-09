import { useMemo } from 'react'
import { format, parseISO } from 'date-fns'
import { schools, schoolWeeks, getWeekData, matchesSite, getOtherUsers, getOtherDays, DISTRICT_OFFICE, USER_ROLES } from '../../lib/report2Data'

// Sessions by role (2026-10-26): the legacy Users tab's "MTW User Sessions" (every session, any length, by role),
// as one KPI box per role between the Filters panel and the Engagement tabs. Each box shows the sessions in the
// selected dates and a small weekly sparkline. Follows Site, User role and dates. Mock: a user has one session on
// each day they were active, and now and then a second one.

function hash(a, b, c) {
  let h = 2166136261
  const s = `${a}|${b}|${c}`
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619) >>> 0
  return h % 100
}
const sessionsFor = (seed, who, weekIdx, days) => {
  let n = 0
  for (let d = 0; d < days; d++) n += hash(seed, who, `${weekIdx}-${d}`) < 20 ? 2 : 1
  return n
}

// { role: [sessions per week] } for the sites in scope. District admins count only when no site is picked.
function weeklySessions(siteIds, weeks) {
  const picked = schools.filter(s => matchesSite(siteIds, s.id))
  const withOffice = siteIds.length ? picked : [...picked, DISTRICT_OFFICE]
  const out = Object.fromEntries(USER_ROLES.map(r => [r, weeks.map(() => 0)]))
  const users = Object.fromEntries(USER_ROLES.map(r => [r, 0]))
  picked.forEach(sc => getWeekData(sc.id, schoolWeeks[0]).teachers.forEach(t => { users[t.role] += 1 }))
  withOffice.forEach(sc => getOtherUsers(sc.id).forEach(u => { users[u.role] += 1 }))
  weeks.forEach((w, wi) => {
    const weekIdx = schoolWeeks.indexOf(w)
    picked.forEach(sc => getWeekData(sc.id, w).teachers.forEach((t, ti) => { out[t.role][wi] += sessionsFor(sc.id, ti, weekIdx, t.daysActive) }))
    withOffice.forEach(sc => getOtherUsers(sc.id).forEach(u => { out[u.role][wi] += sessionsFor(sc.id + 1000, u.idx, weekIdx, getOtherDays(sc.id, u.idx, weekIdx)) }))
  })
  return { out, users }
}

function Sparkline({ values }) {
  const w = 120
  const h = 28
  const max = Math.max(1, ...values)
  const pts = values.map((v, i) => `${values.length === 1 ? w / 2 : (i / (values.length - 1)) * w},${h - 2 - (v / max) * (h - 4)}`).join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="block w-full h-7 mt-3" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#2A7F8F" strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}

const LABELS = { 'School Support': 'School support', 'Family User': 'Family user', 'Program Admin': 'Program admin' }

// `siteIds` follows the Site filter (or a Site Leader's own site); `role` keeps only that role's box.
export default function SessionsKpis({ weeks, siteIds = [], role = 'all' }) {
  const { out, users } = useMemo(() => weeklySessions(siteIds, weeks), [siteIds.join(), weeks])
  const roles = USER_ROLES.filter(r => (role === 'all' || r === role) && users[r] > 0)
  if (!roles.length) return null
  return (
    <section aria-label="Sessions by role" className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
      {roles.map(r => {
        const total = out[r].reduce((a, b) => a + b, 0)
        return (
          <div key={r} className="min-w-0 rounded-lg border border-brand-border bg-white p-4">
            <p className="text-sm text-brand-subtext truncate">{LABELS[r] ?? r}</p>
            <p className="text-2xl font-semibold text-brand-text tabular-nums mt-1">{total.toLocaleString()}</p>
            <p className="text-xs text-brand-subtext">sessions</p>
            <Sparkline values={out[r]} />
            <span className="sr-only">Weekly sessions: {weeks.map((w, i) => `week of ${format(parseISO(w), 'MMM d')}, ${out[r][i]}`).join('; ')}</span>
          </div>
        )
      })}
    </section>
  )
}
