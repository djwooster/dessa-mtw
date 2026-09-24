// Concept D — Two-column (2026-09-24) — same data/definitions as Concept C
// (a site "meets goal" for a week only if every one of its educators hit
// the weekly goal that week), restructured per the user's Figma mockup:
// the table moves into a left column, and a "Consistency over time" trend
// card sits to its right.
//
// The trend card was originally an independent, hardcoded trailing
// 12-week window — but that meant its x-axis could never honestly answer
// "12 weeks of what," since it didn't track whatever range was actually
// selected above. Reworked (still 2026-09-24) so the card is driven by the
// exact same `weeks` array as the table — one source of truth for the
// selected time range, table and card always agree. To keep the default
// view trend-worthy (not just 4 bars), the default preset itself was
// widened from "Last 4 weeks" to "Last 12 weeks."
import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format, addDays, parseISO } from 'date-fns'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { schools, schoolWeeks, getWeekData, MOST_RECENT_WEEK } from '../lib/report2Data'
import { DateRangePicker } from '../components/ui/date-range-picker'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

const GOAL = 3 // weekly login/completion goal, ×/week — matches report2Data.js's district default
const DEFAULT_WEEKS = 12

function selectedWeeks(rangeMode, dateFrom, dateTo) {
  if (rangeMode === 'custom' && dateFrom && dateTo) {
    return schoolWeeks.filter(w => w >= dateFrom && w <= dateTo)
  }
  return schoolWeeks.slice(-DEFAULT_WEEKS)
}

function weekLabel(weekStart) {
  const start = parseISO(weekStart)
  const end   = addDays(start, 4)
  return format(start, 'MMM') === format(end, 'MMM')
    ? `${format(start, 'MMM d')} – ${format(end, 'd')}`
    : `${format(start, 'MMM d')} – ${format(end, 'MMM d')}`
}

// One label slot per week, but only populated on the first week of a new
// calendar month — so the x-axis stays accurate and legible whether the
// selected range is 4 weeks (maybe 1-2 month labels) or the full school
// year (roughly one label per month), instead of assuming a fixed length.
function monthTransitionLabels(weeksList) {
  let lastMonth = null
  return weeksList.map(w => {
    const m = format(parseISO(w), 'MMM')
    const show = m !== lastMonth
    lastMonth = m
    return show ? m : ''
  })
}

const Y_TICKS = [100, 75, 50, 25, 0]

function ConsistencyTrendCard({ weeks }) {
  const [hoverIdx, setHoverIdx] = useState(null)

  // District-wide, every week in the same selected range as the table: how
  // many (and what %) of sites had every educator meet goal that week —
  // the same strict per-site pass/fail as the table, aggregated.
  const trend = useMemo(() => weeks.map(w => {
    const count = schools.filter(s => {
      const data = getWeekData(s.id, w, GOAL)
      return data.meetingGoal === data.totalTeachers
    }).length
    return { weekStart: w, count, pct: Math.round((count / schools.length) * 100) }
  }), [weeks])

  const monthLabels = useMemo(() => monthTransitionLabels(weeks), [weeks])
  const current = trend[trend.length - 1]
  const currentLabel = current.weekStart === MOST_RECENT_WEEK ? 'This week' : `Week of ${weekLabel(current.weekStart)}`

  return (
    <div className="bg-white rounded-xl border border-brand-border p-5 w-80 shrink-0">
      <p className="text-lg font-semibold text-brand-text">Consistency over time</p>
      <p className="text-xs text-brand-subtext mt-0.5 mb-5">% of sites meeting goal, by week</p>

      <div className="grid gap-1.5" style={{ gridTemplateColumns: '22px 1fr' }}>
        <div className="relative h-32 text-[10px] text-brand-subtext">
          {Y_TICKS.map(v => (
            <span key={v} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${v}%` }}>{v}</span>
          ))}
        </div>

        <div className="relative h-32">
          {Y_TICKS.filter(v => v > 0).map(v => (
            <div key={v} className="absolute left-0 right-0 border-t border-brand-border/70" style={{ bottom: `${v}%` }} />
          ))}
          <div className="absolute inset-0 flex items-end gap-[3px]">
            {trend.map((t, i) => {
              const isCurrent = i === trend.length - 1
              const isHovered = hoverIdx === i
              return (
                <div
                  key={t.weekStart}
                  className="relative flex-1 h-full flex items-end"
                  onMouseEnter={() => setHoverIdx(i)}
                  onMouseLeave={() => setHoverIdx(null)}
                >
                  {isHovered && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded-md bg-brand-text text-white text-xs whitespace-nowrap z-10 pointer-events-none">
                      {t.count} of {schools.length} · {weekLabel(t.weekStart)}
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t transition-colors ${
                      isCurrent ? 'bg-dessa-teal' : isHovered ? 'bg-dessa-teal/50' : 'bg-dessa-teal/25'
                    }`}
                    style={{ height: `${Math.max(t.pct, 3)}%` }}
                  />
                </div>
              )
            })}
          </div>
        </div>

        <div />
        <div className="flex gap-[3px]">
          {monthLabels.map((label, i) => (
            <div key={trend[i].weekStart} className="flex-1 text-[10px] text-brand-subtext text-center truncate">{label}</div>
          ))}
        </div>
      </div>

      <div className="pt-4 mt-4 border-t border-brand-border">
        <p className="text-xs text-brand-subtext">{currentLabel}</p>
        <p className="text-lg font-bold text-brand-text">{current.count} of {schools.length} sites <span className="text-brand-subtext font-normal text-sm">({current.pct}%)</span></p>
      </div>
    </div>
  )
}

export default function Report2ConceptD() {
  const [rangeMode, setRangeMode]             = useState('last4')
  const [dateFrom, setDateFrom]               = useState('')
  const [dateTo, setDateTo]                   = useState('')
  const [pendingDateFrom, setPendingDateFrom] = useState('')
  const [pendingDateTo, setPendingDateTo]     = useState('')
  const [rangeMenuOpen, setRangeMenuOpen]     = useState(false)
  const rangeMenuRef = useRef(null)

  useEffect(() => {
    if (!rangeMenuOpen) return
    const handler = e => { if (rangeMenuRef.current && !rangeMenuRef.current.contains(e.target)) setRangeMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [rangeMenuOpen])

  const weeks = useMemo(() => selectedWeeks(rangeMode, dateFrom, dateTo), [rangeMode, dateFrom, dateTo])

  const siteStats = useMemo(() => schools.map(school => {
    const metByWeek = weeks.map(w => {
      const data = getWeekData(school.id, w, GOAL)
      return { weekStart: w, met: data.meetingGoal === data.totalTeachers }
    })
    return {
      school,
      metByWeek,
      weeksMet: metByWeek.filter(w => w.met).length,
    }
  }).sort((a, b) => a.school.name.localeCompare(b.school.name)), [weeks])

  function openRangeMenu() {
    setPendingDateFrom(dateFrom)
    setPendingDateTo(dateTo)
    setRangeMenuOpen(o => !o)
  }

  function applyCustomRange() {
    setDateFrom(pendingDateFrom)
    setDateTo(pendingDateTo)
    setRangeMode('custom')
    setRangeMenuOpen(false)
  }

  function resetToDefault() {
    setRangeMode('last4')
    setDateFrom(''); setDateTo('')
    setPendingDateFrom(''); setPendingDateTo('')
    setRangeMenuOpen(false)
  }

  const rangeLabel = rangeMode === 'custom' && dateFrom && dateTo
    ? `${new Date(dateFrom + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(dateTo + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : `Last ${DEFAULT_WEEKS} weeks`

  return (
    <div className="px-6 pt-8 pb-8">

      {/* Header — same plain title/description + rolling-window control as
          Concept C. */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-brand-text">Site Engagement</h2>
          <p className="text-sm text-brand-subtext mt-1">This report shows Move This World lesson completion rates by site across your district.</p>
        </div>
        <div className="relative shrink-0" ref={rangeMenuRef}>
          <button
            onClick={openRangeMenu}
            className="flex items-center gap-2 px-3 h-9 rounded-lg border border-brand-border bg-white text-sm font-medium text-brand-text hover:bg-brand-bg transition-colors"
          >
            <Calendar size={14} className="text-brand-subtext" />
            {rangeLabel}
            <ChevronDown size={13} className={`text-brand-subtext transition-transform ${rangeMenuOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {rangeMenuOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
                className="absolute right-0 top-[calc(100%+6px)] w-80 bg-white rounded-xl border border-brand-border shadow-lg z-30 p-4"
              >
                <button
                  onClick={resetToDefault}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors mb-3 ${
                    rangeMode === 'last4' ? 'bg-dessa-tealLight text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                  }`}
                >
                  Last {DEFAULT_WEEKS} weeks
                  {rangeMode === 'last4' && <Check size={14} className="text-dessa-teal" />}
                </button>
                <div className="pt-3 border-t border-brand-border">
                  <p className="text-xs font-semibold text-brand-text mb-2">Custom range</p>
                  <DateRangePicker
                    from={pendingDateFrom}
                    to={pendingDateTo}
                    onFromChange={setPendingDateFrom}
                    onToChange={setPendingDateTo}
                    align="start"
                    buttonClassName="w-full justify-between"
                  />
                  <button
                    onClick={applyCustomRange}
                    disabled={!pendingDateFrom || !pendingDateTo}
                    className="w-full mt-3 h-8 rounded-md text-sm font-medium text-white bg-dessa-teal hover:opacity-90 disabled:opacity-40 transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Two-column body, per the user's mockup — table on the left
          (flexible width), consistency-over-time card fixed to the right. */}
      <div className="flex items-start gap-4">
        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
          className="flex-1 min-w-0 bg-white rounded-xl border border-brand-border overflow-hidden"
        >
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Weeks met goal</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {siteStats.map(({ school, metByWeek, weeksMet }) => (
                <TableRow key={school.id}>
                  <TableCell className="font-medium">{school.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        {metByWeek.map(({ weekStart, met }) => (
                          <span
                            key={weekStart}
                            title={`${weekLabel(weekStart)} — ${met ? 'met goal' : 'did not meet goal'}`}
                            className={`w-2.5 h-2.5 rounded-sm ${met ? 'bg-dessa-teal' : 'bg-white border border-brand-border'}`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-brand-subtext whitespace-nowrap">{weeksMet} of {metByWeek.length}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.14 }}
        >
          <ConsistencyTrendCard weeks={weeks} />
        </motion.div>
      </div>
    </div>
  )
}
