// Concept C — Simplified (2026-09-23) — a from-scratch rebuild driven by
// real user feedback ("what does engagement % mean?", "just want to see
// consistency over a period of time", "% of sites meeting the chosen
// goal") plus real product metric definitions from DESSA renewals — see
// project_report_metric_definitions in memory. Drops "Engagement %" and
// the district-target setting entirely (both were confusing/unused) in
// favor of two numbers derived from one honest, strict rule: a site "meets
// goal" for a given week only if every one of its educators individually
// hit the weekly login/completion goal that week. A and B are frozen —
// no further changes land there; all new simplification work happens here.
import { useState, useRef, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar, ChevronDown, Check } from 'lucide-react'
import { schools, schoolWeeks, getWeekData } from '../lib/report2Data'
import { DateRangePicker } from '../components/ui/date-range-picker'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'

const GOAL = 3 // weekly login/completion goal, ×/week — matches report2Data.js's district default

function selectedWeeks(rangeMode, dateFrom, dateTo) {
  if (rangeMode === 'custom' && dateFrom && dateTo) {
    return schoolWeeks.filter(w => w >= dateFrom && w <= dateTo)
  }
  return schoolWeeks.slice(-4)
}

export default function Report2ConceptC() {
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

  // Per site: whether every educator met the weekly goal, for each week in
  // the selected range — the single boolean both headline numbers below
  // are derived from.
  const siteStats = useMemo(() => schools.map(school => {
    const metByWeek = weeks.map(w => {
      const data = getWeekData(school.id, w, GOAL)
      return data.meetingGoal === data.totalTeachers
    })
    const weeksMet = metByWeek.filter(Boolean).length
    return {
      school,
      weeksMet,
      totalWeeks: metByWeek.length,
      metThisWeek: metByWeek[metByWeek.length - 1] ?? false,
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

  function resetToLast4() {
    setRangeMode('last4')
    setDateFrom(''); setDateTo('')
    setPendingDateFrom(''); setPendingDateTo('')
    setRangeMenuOpen(false)
  }

  const rangeLabel = rangeMode === 'custom' && dateFrom && dateTo
    ? `${new Date(dateFrom + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${new Date(dateTo + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
    : 'Last 4 weeks'

  return (
    <div className="px-6 pt-8 pb-8">

      {/* Header — same plain title/description + rolling-window control as
          Concept B, minus the overflow menu (no settings/export needed for
          a two-number simplification pass). */}
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
                  onClick={resetToLast4}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm text-left transition-colors mb-3 ${
                    rangeMode === 'last4' ? 'bg-dessa-tealLight text-dessa-teal font-medium' : 'text-brand-text hover:bg-brand-bg'
                  }`}
                >
                  Last 4 weeks
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

      {/* Site list — a plain table, sorted alphabetically, no filters or
          sorting controls yet (nothing to overengineer until this base
          view is confirmed). The aggregate stat cards were dropped
          (2026-09-23) as redundant with what this table already shows
          per-site. */}
      <motion.div
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, delay: 0.08 }}
        className="bg-white rounded-xl border border-brand-border overflow-hidden"
      >
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Site</TableHead>
              <TableHead>Meeting goal this week</TableHead>
              <TableHead>Consistency</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {siteStats.map(({ school, weeksMet, totalWeeks, metThisWeek }) => (
              <TableRow key={school.id}>
                <TableCell className="font-medium">{school.name}</TableCell>
                <TableCell>
                  {metThisWeek ? (
                    <span className="inline-flex items-center gap-1.5 text-state-success font-medium">
                      <Check size={14} /> Yes
                    </span>
                  ) : (
                    <span className="text-brand-subtext">No</span>
                  )}
                </TableCell>
                <TableCell className="text-brand-subtext">{weeksMet} of {totalWeeks} weeks</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </motion.div>
    </div>
  )
}
