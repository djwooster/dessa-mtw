import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { parseISO, addDays, format } from 'date-fns'
import { Check, Download, MoreHorizontal, Printer } from 'lucide-react'
import { schools, PAST_WEEKS } from '../lib/report2Data'
import { MOODS, MIN_STUDENTS, studentsData } from '../lib/studentsReportData'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { PaginationBar } from '../components/ui/pagination'
import FiltersPanel from '../components/engagement/FiltersPanel'
import PrintReport from '../components/engagement/PrintReport'
import { useRole } from '../lib/roleContext'
import { FIRST_DATE, LAST_DATE, rangeLabel, weeksForDates, SearchField } from './Report2ConceptE'

// Students report (2026-10-26, first pass): "How are our students feeling?" Replaces the legacy MTW Students tab
// (Content Flagging Score, Student Mood Breakdown pie, Mood History lines) with the Content report's shell: Filters,
// a few headline numbers, Mood | Needs a check-in tabs. Moods and journals are the most sensitive data we hold, so
// privacy is built in: a site's week only counts toward moods once 10 or more of its students checked in, students
// are names only, and journal text is never shown. Framing stays positive and the palette calm (no red).

const toKey = d => format(d, 'yyyy-MM-dd')
const FILTER_MIN = toKey(FIRST_DATE)
const FILTER_MAX = toKey(LAST_DATE)
// No User role filter here (students have no staff role), so `role` only keeps FiltersPanel's draft shape.
const DEFAULT_FILTERS = { site: [], role: 'all', start: PAST_WEEKS[Math.max(0, PAST_WEEKS.length - 4)], end: FILTER_MAX }
const pct = (n, d) => (d ? Math.round((n / d) * 100) : 0)
const TABS = [['mood', 'Mood'], ['flags', 'Needs a check-in']]

function download(name, header, rows) {
  const q = v => `"${String(v).replace(/"/g, '""')}"`
  const url = URL.createObjectURL(new Blob([[header, ...rows].map(r => r.map(q).join(',')).join('\n')], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function Stat({ label, value, note }) {
  return (
    <div className="rounded-lg border border-brand-border bg-white p-4">
      <p className="text-sm text-brand-subtext">{label}</p>
      <p className="text-2xl font-semibold text-brand-text tabular-nums mt-1">{value}</p>
      {note && <p className="text-xs text-brand-subtext mt-0.5">{note}</p>}
    </div>
  )
}

// Shown in place of the mood chart when the scope is too small to share, or the range has no school days.
function NotEnough({ noWeeks }) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-16 px-6">
      <p className="text-base font-semibold text-brand-text">{noWeeks ? 'No school days in this range' : 'Not enough check-ins to show yet'}</p>
      <p className="text-sm text-brand-subtext mt-1 max-w-sm">
        {noWeeks ? 'Pick dates that include a school week to see moods.' : `Moods show once ${MIN_STUDENTS} or more students check in, so no one student stands out.`}
      </p>
    </div>
  )
}

const shareText = (moods, total) => MOODS.map(m => `${m.label} ${pct(moods[m.key], total)}%`).join(', ')

// ─── Mood tab ─────────────────────────────────────────────────────────────────

const weekLabel = w => {
  const s = parseISO(w)
  const e = addDays(s, 4)
  return `${format(s, 'MMM d')} to ${format(e, s.getMonth() === e.getMonth() ? 'd' : 'MMM d')}`
}

// Share of check-ins per mood each week, each bar 100%. The readout above shows the whole range, or the hovered or
// focused week. Every bar is a button, so the weeks can be read from the keyboard too.
function MoodChart({ weekly, totals, total, range }) {
  const [active, setActive] = useState(null)
  const w = active == null ? null : weekly[active]
  const h = w == null
    ? { label: range, total, text: shareText(totals, total) }
    : { label: `Week of ${weekLabel(w.week)}`, total: w.total, text: w.total ? shareText(w.moods, w.total) : 'Not enough check-ins to show this week' }
  return (
    <div>
      <div className="h-10 mb-2 text-sm">
        <p className="font-medium text-brand-text">{h.label} · {h.total.toLocaleString()} check-ins</p>
        <p className="text-brand-subtext truncate">{h.text}</p>
      </div>
      <div className="flex items-end gap-1.5 h-48 border-b border-brand-border" onMouseLeave={() => setActive(null)}>
        {weekly.map((wk, i) => (
          <button
            key={wk.week}
            type="button"
            aria-label={`Week of ${weekLabel(wk.week)}: ${wk.total ? `${wk.total.toLocaleString()} check-ins, ${shareText(wk.moods, wk.total)}` : 'not enough check-ins to show'}`}
            onMouseEnter={() => setActive(i)}
            onFocus={() => setActive(i)}
            onBlur={() => setActive(null)}
            className={`flex-1 min-w-0 h-full flex flex-col gap-px rounded-t-sm overflow-hidden transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-dessa-teal focus-visible:ring-offset-2 ${active != null && active !== i ? 'opacity-50' : ''}`}
          >
            {wk.total
              ? MOODS.map(m => wk.moods[m.key] > 0 && (
                  <span key={m.key} className={`block w-full ${m.fill}`} style={{ height: `${(wk.moods[m.key] / wk.total) * 100}%` }} aria-hidden="true" />
                ))
              : <span className="block w-full h-full bg-brand-bg" aria-hidden="true" />}
          </button>
        ))}
      </div>
      <div className="flex gap-1.5 mt-1.5 text-xs text-brand-subtext" aria-hidden="true">
        {weekly.map((wk, i) => (
          <span key={wk.week} className="flex-1 min-w-0 text-center truncate">{i === 0 || parseISO(wk.week).getDate() <= 7 || weekly.length <= 6 ? format(parseISO(wk.week), 'MMM d') : ''}</span>
        ))}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 mt-4">
        {MOODS.map(m => (
          <li key={m.key} className="inline-flex items-center gap-1.5 text-xs text-brand-text">
            <span className={`w-2.5 h-2.5 rounded-sm ${m.fill}`} aria-hidden="true" />{m.label}
          </li>
        ))}
      </ul>
    </div>
  )
}

// Each mood's share of the range, largest first.
function MoodMix({ totals, total }) {
  const rows = MOODS.map(m => ({ ...m, n: totals[m.key] })).sort((a, b) => b.n - a.n)
  return (
    <ul className="flex flex-col gap-3">
      {rows.map(m => (
        <li key={m.key}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="text-brand-text">{m.label}</span>
            <span className="tabular-nums text-brand-subtext">{pct(m.n, total)}%</span>
          </div>
          <span className="block h-2 mt-1 rounded-full bg-brand-bg overflow-hidden">
            <span className={`block h-full rounded-full ${m.fill}`} style={{ width: `${pct(m.n, total)}%` }} />
          </span>
        </li>
      ))}
    </ul>
  )
}

// ─── Needs a check-in tab ─────────────────────────────────────────────────────

// Flagged journals, newest first. Only who, where and why, never what the student wrote.
function FlagsTable({ rows, total, query, onQuery, followed, onToggle, onExport }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  useEffect(() => { setPage(1) }, [rows, pageSize])
  const shown = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-4 py-3 border-b border-brand-border">
        <div className="flex-1 min-w-0">
          <SearchField value={query} onChange={onQuery} placeholder="Search students, sites or educators" bg="bg-brand-bg/60" />
        </div>
        <button type="button" onClick={onExport} disabled={!rows.length} className="inline-flex items-center gap-1.5 h-8 px-2 shrink-0 whitespace-nowrap rounded-md text-sm font-semibold text-dessa-teal hover:text-dessa-navy hover:underline underline-offset-4 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dessa-teal disabled:opacity-40 disabled:no-underline disabled:hover:text-dessa-teal">
          <Download size={14} aria-hidden="true" /> Export CSV
        </button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Student</TableHead>
            <TableHead>Grade</TableHead>
            <TableHead>Site</TableHead>
            <TableHead>Educator</TableHead>
            <TableHead aria-sort="descending">Date</TableHead>
            <TableHead>Reason</TableHead>
            <TableHead className="text-right"><span className="sr-only">Follow up</span></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map(r => {
            const done = followed.has(r.id)
            return (
              <TableRow key={r.id} className="hover:bg-transparent">
                <TableCell className="font-medium">{r.name}</TableCell>
                <TableCell className="text-brand-subtext whitespace-nowrap">{r.grade}</TableCell>
                <TableCell className="text-brand-subtext">{r.sc.name}</TableCell>
                <TableCell className="text-brand-subtext">{r.educator}</TableCell>
                <TableCell className="text-brand-subtext whitespace-nowrap tabular-nums">{format(parseISO(r.date), 'MMM d')}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center h-6 px-2 rounded-md border border-brand-border bg-brand-bg text-xs font-medium text-brand-text whitespace-nowrap">{r.reason}</span>
                </TableCell>
                <TableCell className="text-right py-2">
                  {done ? (
                    <span className="inline-flex items-center gap-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 text-sm font-medium text-brand-text"><Check size={14} className="text-dessa-teal" aria-hidden="true" /> Followed up</span>
                      <button type="button" onClick={() => onToggle(r.id)} aria-label={`Undo followed up for ${r.name}`} className="rounded-md text-sm font-medium text-brand-subtext hover:text-brand-text hover:underline underline-offset-4 focus:outline-none focus-visible:ring-2 focus-visible:ring-dessa-teal">Undo</button>
                    </span>
                  ) : (
                    <button type="button" onClick={() => onToggle(r.id)} aria-label={`Mark ${r.name} as followed up`} className="inline-flex items-center h-8 px-3 rounded-md border border-brand-border bg-white text-sm font-medium text-brand-text whitespace-nowrap hover:bg-brand-bg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dessa-teal">
                      Mark as followed up
                    </button>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
          {rows.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={7} className="text-center text-brand-subtext py-8">
                {total === 0 ? 'No journals need a check-in right now.' : 'No journals match your search.'}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <PaginationBar page={page} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={setPageSize} className="px-4 py-3 border-t border-brand-border" />
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ReportStudents() {
  const { role, isSiteLeaderView } = useRole()
  // Needs a check-in is for Program admins and Site leaders only (a Site leader sees their own site).
  const canSeeFlags = role === 'program_admin' || role === 'site_leader'
  const [draft, setDraft] = useState(DEFAULT_FILTERS)
  const [applied, setApplied] = useState(DEFAULT_FILTERS)
  const [tab, setTab] = useState('mood')
  const [query, setQuery] = useState('')
  const [followed, setFollowed] = useState(() => new Set())
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const tabRefs = useRef({})
  useEffect(() => {
    if (!menuOpen) return
    const h = e => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    const k = e => { if (e.key === 'Escape') setMenuOpen(false) }
    document.addEventListener('mousedown', h)
    document.addEventListener('keydown', k)
    return () => { document.removeEventListener('mousedown', h); document.removeEventListener('keydown', k) }
  }, [menuOpen])
  const tabs = canSeeFlags ? TABS : TABS.slice(0, 1)
  const current = canSeeFlags ? tab : 'mood'

  const weeks = useMemo(() => weeksForDates(parseISO(applied.start), parseISO(applied.end)), [applied])
  // A Site Leader sees only their own site (the same first site the Engagement report uses).
  const siteIds = isSiteLeaderView ? [schools[0].id] : applied.site.map(Number)
  const data = useMemo(() => studentsData({ siteIds, weeks }), [siteIds.join(), weeks])
  const range = weeks.length ? rangeLabel(weeks) : 'No school weeks in this range'
  const showMoods = weeks.length > 0 && data.moodTotal >= MIN_STUDENTS

  const flagRows = useMemo(() => {
    const q = query.trim().toLowerCase()
    return data.flagged.filter(r => !q || [r.name, r.sc.name, r.educator, r.reason, r.grade].some(v => v.toLowerCase().includes(q)))
  }, [data.flagged, query])
  const followedCount = data.flagged.filter(r => followed.has(r.id)).length
  const toggleFollowed = id => setFollowed(s => {
    const next = new Set(s)
    next.has(id) ? next.delete(id) : next.add(id)
    return next
  })

  function exportFlags() {
    download('students-needs-a-check-in.csv', ['Student', 'Grade', 'Site', 'Educator', 'Date', 'Reason', 'Followed up'],
      flagRows.map(r => [r.name, r.grade, r.sc.name, r.educator, r.date, r.reason, followed.has(r.id) ? 'Yes' : 'No']))
  }
  function exportCsv() {
    if (current === 'flags') return exportFlags()
    // Weeks under the privacy threshold export as zeros, the same as the chart shows them.
    download('students-mood.csv', ['Week of', ...MOODS.map(m => m.label), 'Total'],
      data.weekly.map(w => [w.week, ...MOODS.map(m => w.moods[m.key]), w.total]))
  }
  // Print (as on Engagement): the PDF's file name comes from document.title.
  function printReport() {
    const prevTitle = document.title
    document.title = `Students, ${range}`
    window.addEventListener('afterprint', () => { document.title = prevTitle }, { once: true })
    window.print()
  }

  // Arrow keys move between tabs, as the ARIA tabs pattern expects.
  function onTabKey(e) {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
    const i = tabs.findIndex(([k]) => k === current)
    const [k] = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length]
    setTab(k)
    tabRefs.current[k]?.focus()
  }

  const menuItem = 'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm text-brand-text hover:bg-brand-bg transition-colors'
  const menu = (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        className="flex items-center justify-center w-8 h-8 rounded-md bg-white text-brand-text hover:bg-brand-bg transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-dessa-teal"
        onClick={() => setMenuOpen(o => !o)}
        aria-label="More options"
        aria-expanded={menuOpen}
      >
        <MoreHorizontal size={14} />
      </button>
      {menuOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white border border-brand-border rounded-lg shadow-lg z-20 overflow-hidden py-1">
          <button className={menuItem} onClick={() => { exportCsv(); setMenuOpen(false) }}>
            <Download size={14} className="text-brand-subtext" /> Export {current === 'flags' ? 'check-ins' : 'moods'} CSV
          </button>
          <button className={menuItem} onClick={() => { setMenuOpen(false); printReport() }}>
            <Printer size={14} className="text-brand-subtext" /> Print
          </button>
        </div>
      )}
    </div>
  )

  const card = 'bg-white rounded-lg border border-brand-border p-5'
  return (
    <div className="px-6 pt-8 pb-8">
      <h1 className="text-[28px] font-bold leading-tight text-brand-text mb-6">Students</h1>

      <FiltersPanel
        draft={draft}
        onChange={setDraft}
        onApply={() => setApplied(draft)}
        onReset={() => { setDraft(DEFAULT_FILTERS); setApplied(DEFAULT_FILTERS) }}
        sites={schools}
        roles={[]}
        showRole={false}
        showSite={!isSiteLeaderView}
        minDate={FILTER_MIN}
        maxDate={FILTER_MAX}
        action={menu}
      />

      <div className={`grid grid-cols-1 gap-4 mb-6 ${canSeeFlags ? 'sm:grid-cols-3' : 'sm:grid-cols-2'}`}>
        <Stat label="Mood check-ins" value={data.checkins.toLocaleString()} note={range} />
        <Stat label="Students who checked in" value={`${data.checkedIn.toLocaleString()} of ${data.enrolled.toLocaleString()}`} note={`${pct(data.checkedIn, data.enrolled)}% of enrolled students`} />
        {canSeeFlags && (
          <Stat label="Needs a check-in" value={data.flagged.length.toLocaleString()} note={data.flagged.length ? `${followedCount} followed up` : 'All clear'} />
        )}
      </div>

      <div role="tablist" aria-label="Students views" className="flex gap-4 border-b border-brand-border mb-6" onKeyDown={onTabKey}>
        {tabs.map(([k, label]) => (
          <button
            key={k} type="button" role="tab" id={`students-tab-${k}`} aria-controls={`students-panel-${k}`}
            aria-selected={current === k} tabIndex={current === k ? 0 : -1}
            ref={el => { tabRefs.current[k] = el }}
            onClick={() => setTab(k)}
            className={`pb-2 -mb-px text-sm font-medium border-b-2 rounded-t-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dessa-teal ${current === k ? 'border-dessa-teal text-brand-text' : 'border-transparent text-brand-subtext hover:text-brand-text'}`}
          >{label}</button>
        ))}
      </div>

      <motion.div
        key={current} role="tabpanel" id={`students-panel-${current}`} aria-labelledby={`students-tab-${current}`}
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}
      >
        {current === 'mood' && !showMoods && (
          <section className={card}>
            <h3 className="text-lg font-semibold text-brand-text">Moods each week</h3>
            <NotEnough noWeeks={!weeks.length} />
          </section>
        )}
        {current === 'mood' && showMoods && (
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
            <section className={card}>
              <h3 className="text-lg font-semibold text-brand-text mb-4">Moods each week</h3>
              <MoodChart weekly={data.weekly} totals={data.moodTotals} total={data.moodTotal} range={range} />
            </section>
            <section className={card}>
              <h3 className="text-lg font-semibold text-brand-text mb-4">Mood mix</h3>
              <MoodMix totals={data.moodTotals} total={data.moodTotal} />
            </section>
          </div>
        )}
        {current === 'flags' && (
          <FlagsTable
            rows={flagRows} total={data.flagged.length} query={query} onQuery={setQuery}
            followed={followed} onToggle={toggleFollowed} onExport={exportFlags}
          />
        )}
      </motion.div>

      {/* Print (2026-10-26) uses the shared print layout, since the page itself is hidden when printing. It prints
          moods only: the students who need a check-in never go on paper. */}
      <PrintReport
        title="Students"
        rangeText={range}
        generated={format(new Date(), 'MMM d, yyyy')}
        stats={[
          { label: 'Mood check-ins', value: data.checkins.toLocaleString() },
          { label: 'Students who checked in', value: `${data.checkedIn.toLocaleString()} of ${data.enrolled.toLocaleString()}` },
          { label: 'Sites', value: siteIds.length || schools.length },
        ]}
        chartTitle="Mood mix"
        chart={showMoods ? <MoodMix totals={data.moodTotals} total={data.moodTotal} /> : null}
        columns={['Mood', 'Share of check-ins']}
        rows={showMoods ? MOODS.map(m => ({ name: m.label, value: `${data.moodTotal ? Math.round((data.moodTotals[m.key] / data.moodTotal) * 100) : 0}%` })) : []}
      />
    </div>
  )
}
