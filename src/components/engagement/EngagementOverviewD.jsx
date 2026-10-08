import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { schools, getWeekData } from '../../lib/report2Data'
import { GOAL, SearchField } from '../../pages/Report2ConceptE'
import { weekBands } from './StackedGoalChart'
import WeeklyBarChart from './WeeklyBarChart'

// Engagement Concept D (2026-10-06), modeled on two pages the user liked: an
// Insights page (a row of stat cards with change pills) and an Apollo home
// page (one container holding two nested panels). Under the cards, the left
// panel lists the district's sites and the right panel charts how engaged
// the selected site, or the whole district, is week by week. "Engaged"
// means completed at least one lesson that week (the same rule as Active
// users elsewhere in this report).
function periodStats(weeksList) {
  let users = 0, lessons = 0, goalWeeks = 0
  const weeksEngaged = []
  schools.forEach(s => {
    const per = {}
    weeksList.forEach(w => {
      getWeekData(s.id, w, GOAL).teachers.forEach((t, ti) => {
        per[ti] = per[ti] || 0
        lessons += t.daysActive
        if (t.daysActive > 0) per[ti] += 1
        if (t.metGoal) goalWeeks += 1
      })
    })
    Object.values(per).forEach(n => { users += 1; weeksEngaged.push(n) })
  })
  const n = weeksList.length
  return {
    users,
    weeksEngaged,
    lessons,
    active: weeksEngaged.filter(x => x >= 1).length,
    goalAvg: goalWeeks / n,
  }
}

const pctOf = (a, b) => Math.round((a / b) * 100)

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-brand-border bg-white p-4">
      <p className="text-sm text-brand-subtext">{label}</p>
      <p className="text-2xl font-semibold text-brand-text leading-tight mt-1">{value}</p>
    </div>
  )
}

export default function EngagementOverviewD({ weeks, selectedId, onSelect, showCards = true }) {
  const now = useMemo(() => periodStats(weeks), [weeks])

  const [query, setQuery] = useState('')
  const latestWeek = weeks[weeks.length - 1]
  const siteRows = useMemo(() => schools.map(sc => {
    const b = weekBands(sc.id, latestWeek)
    return { school: sc, label: `${b.met} of ${b.total}` }
  }), [latestWeek])
  const allSitesLabel = useMemo(() => { const b = weekBands(null, latestWeek); return `${b.met} of ${b.total}` }, [latestWeek])
  const visibleSites = siteRows.filter(r => r.school.name.toLowerCase().includes(query.trim().toLowerCase()))
  const selectedSchool = schools.find(sc => sc.id === selectedId) ?? null
  const scope = useMemo(() => {
    const points = weeks.map(w => {
      const b = weekBands(selectedId, w)
      return { week: w, value: pctOf(b.met, b.total), detail: `${b.met} of ${b.total} users` }
    })
    const last = weekBands(selectedId, latestWeek)
    return { points, met: last.met, total: last.total }
  }, [selectedId, weeks, latestWeek])

  const total = now.users
  const goalPct = pctOf(Math.round(now.goalAvg), total)

  return (
    <>
      {/* Active users and Lessons completed cards removed 2026-10-08 (not meaningful enough yet). */}
      {showCards && <div className="grid gap-4 mb-6 grid-cols-2">
        <StatCard
          label="Met the goal, weekly average" value={`${goalPct}%`}
        />
        {/* Follows the site selected below (All sites by default). */}
        <StatCard
          label="Users met goal in last 7 days" value={`${pctOf(scope.met, scope.total)}%`}
        />
      </div>}

      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
        className="rounded-xl border border-brand-border bg-white p-5 mb-6"
      >
        <h3 className="text-lg font-semibold text-brand-text mb-4">Engagement by site</h3>
        <div className="grid gap-4 grid-cols-[minmax(240px,300px)_1fr]">
          <div className="relative min-h-80 rounded-lg border border-brand-border">
            <div className="absolute inset-0 flex flex-col">
              <div className="p-3 border-b border-brand-border">
                <SearchField value={query} onChange={setQuery} placeholder="Search sites" bg="bg-brand-bg/60" />
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-2">
                {[{ id: null, name: 'All sites', label: allSitesLabel }, ...visibleSites.map(r => ({ id: r.school.id, name: r.school.name, label: r.label }))].map(r => (
                  <button
                    key={r.id ?? 'all'}
                    type="button"
                    aria-pressed={selectedId === r.id}
                    onClick={() => onSelect(r.id)}
                    className={`w-full flex items-center justify-between gap-3 px-3 py-2 rounded-md text-sm text-left transition-colors ${
                      r.id === null ? 'mb-4 relative after:absolute after:left-0 after:right-0 after:-bottom-3 after:h-px after:bg-brand-border' : ''
                    } ${
                      selectedId === r.id ? 'bg-dessa-tealLight text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                    }`}
                  >
                    <span className="min-w-0 truncate">{r.name}</span>
                    {/* Counts commented out 2026-10-08 (they did not read clearly): <span className="tabular-nums">{r.label}</span> */}
                  </button>
                ))}
                {visibleSites.length === 0 && <p className="px-3 py-4 text-sm text-brand-subtext">No sites match your search.</p>}
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-lg border border-brand-border p-5">
            <p className="text-lg font-semibold text-brand-text">{selectedSchool ? selectedSchool.name : 'All sites'}</p>
            <p className="text-sm text-brand-subtext mt-1 mb-6">
              {scope.met} of {scope.total} users met the weekly goal in the latest week.
            </p>
            <WeeklyBarChart label="Users who met the goal each week" kind="line" percent points={scope.points} />
          </div>
        </div>
      </motion.div>
    </>
  )
}
