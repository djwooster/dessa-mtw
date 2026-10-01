import { Fragment, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { DcePage, DceHeader, SinceCell, SortHead, Pager, EmptyRoster } from '../components/dce/DceParts'
import { SCHOOL_DAYS, REPORT_TODAY } from '../lib/reportData'
import { DEFAULT_SITE, WINDOW_DAYS, byPriority, completed, formatDay, useDceRoster } from '../lib/dceData'

// Concept D, Today plus this week: a row of day dots shows this week at a
// glance, so one missed day reads differently from a pattern. Opening a
// teacher shows the last four weeks and their school year engagement.
const PAGE_SIZE = 25
const CURRENT_WEEK = SCHOOL_DAYS.find((d) => d.date === REPORT_TODAY).week
const WEEK_DAYS = SCHOOL_DAYS.filter((d) => d.week === CURRENT_WEEK)
const WEEKS = [...new Set(SCHOOL_DAYS.map((d) => d.week))]

function Dot({ day, done }) {
  return (
    <span
      role="img"
      aria-label={`${formatDay(day.date)}: ${done ? 'completed a lesson' : 'no lesson completed'}`}
      className={`block w-3.5 h-3.5 rounded-full ${done ? 'bg-dessa-teal' : 'border-2 border-brand-border'}`}
    />
  )
}

function Calendar({ row }) {
  return (
    <div className="flex flex-wrap gap-x-12 gap-y-4 px-4 py-4 pl-12 bg-brand-bg/50">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-subtext mb-2">Last 4 weeks</p>
        <div className="flex flex-col gap-1.5">
          {WEEKS.map((w) => (
            <div key={w} className="flex items-center gap-3">
              <span className="w-20 text-xs text-brand-subtext">Week {w}</span>
              {row.teacher.days.filter((d) => d.week === w).map((d) => (
                <Dot key={d.date} day={d} done={completed(d)} />
              ))}
            </div>
          ))}
        </div>
      </div>
      <dl className="grid grid-cols-[auto_auto] gap-x-6 gap-y-1.5 text-sm content-start">
        <dt className="text-brand-subtext">Days with a lesson, last {WINDOW_DAYS} school days</dt>
        <dd className="text-brand-text font-medium">{row.windowCount} of {WINDOW_DAYS}</dd>
        <dt className="text-brand-subtext">School year so far (140 school days)</dt>
        <dd className="text-brand-text font-medium">{row.teacher.ytdPct}%</dd>
        <dt className="text-brand-subtext">Last lesson completed</dt>
        <dd className="text-brand-text font-medium">{row.lastDate ? formatDay(row.lastDate) : 'None in this window'}</dd>
      </dl>
    </div>
  )
}

export default function ReportDceD() {
  const [site, setSite] = useState(DEFAULT_SITE)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState({ key: 'priority', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [openId, setOpenId] = useState(null)
  const roster = useDceRoster(site, search)

  const doneToday = roster.filter((r) => r.doneToday).length
  const rows = [...roster].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.key === 'name') return dir * a.name.localeCompare(b.name)
    if (sort.key === 'week') return dir * (a.weekCount - b.weekCount) || a.name.localeCompare(b.name)
    if (sort.key === 'since') return dir * (a.sinceSort - b.sinceSort) || a.name.localeCompare(b.name)
    return dir * byPriority(a, b)
  })
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSort(key) {
    setPage(1)
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'name' || key === 'priority' ? 'asc' : 'desc' }))
  }

  return (
    <DcePage>
      <DceHeader
        site={site}
        onSite={(s) => { setSite(s); setPage(1); setOpenId(null) }}
        search={search}
        onSearch={(s) => { setSearch(s); setPage(1) }}
        summary={`${doneToday} of ${roster.length} teachers have completed a lesson today`}
      />
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        {rows.length === 0 ? (
          <EmptyRoster />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10" />
                <TableHead><SortHead label="Teacher" col="name" sort={sort} onSort={handleSort} /></TableHead>
                <TableHead>
                  <span className="sr-only">This week</span>
                  <span className="flex items-center gap-3" aria-hidden="true">
                    {WEEK_DAYS.map((d) => (
                      <span
                        key={d.date}
                        className={`w-7 text-center text-xs font-semibold rounded ${d.date === REPORT_TODAY ? 'bg-dessa-tealLight text-dessa-teal py-0.5' : 'text-brand-subtext'}`}
                      >
                        {d.dayLabel}
                      </span>
                    ))}
                  </span>
                </TableHead>
                <TableHead><SortHead label="Days this week" col="week" sort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortHead label="Last lesson completed" col="since" sort={sort} onSort={handleSort} /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r) => {
                const open = openId === r.teacher.id
                return (
                  <Fragment key={r.teacher.id}>
                    <TableRow>
                      <TableCell className="py-2.5 pr-0">
                        <button
                          type="button"
                          onClick={() => setOpenId(open ? null : r.teacher.id)}
                          aria-expanded={open}
                          aria-label={`${open ? 'Hide' : 'Show'} history for ${r.name}`}
                          className="p-1 rounded text-brand-subtext hover:bg-brand-bg hover:text-brand-text"
                        >
                          <ChevronRight size={15} className={`transition-transform ${open ? 'rotate-90' : ''}`} />
                        </button>
                      </TableCell>
                      <TableCell className="py-2.5 font-medium">{r.name}</TableCell>
                      <TableCell className="py-2.5">
                        <span className="flex items-center gap-3">
                          {r.weekDays.map((d) => (
                            <span key={d.date} className="w-7 flex justify-center"><Dot day={d} done={completed(d)} /></span>
                          ))}
                        </span>
                      </TableCell>
                      <TableCell className="py-2.5 tabular-nums">{r.weekCount} of {WEEK_DAYS.length}</TableCell>
                      <TableCell className="py-2.5"><SinceCell since={r.since} /></TableCell>
                    </TableRow>
                    {open && (
                      <TableRow className="hover:bg-transparent">
                        <TableCell colSpan={5} className="p-0"><Calendar row={r} /></TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        )}
        <Pager page={page} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
      </div>
    </DcePage>
  )
}
