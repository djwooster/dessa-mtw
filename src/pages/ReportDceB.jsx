import { useState } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/table'
import { DcePage, DceHeader, StatusCell, SinceCell, SortHead, Pager, EmptyRoster } from '../components/dce/DceParts'
import { DEFAULT_SITE, byPriority, useDceRoster } from '../lib/dceData'

// Concept B, Today's roster: no history, only today's status and how long
// it has been since each teacher's last completed lesson. The default sort
// puts the teachers to check in with at the top.
const PAGE_SIZE = 25
const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'notyet', label: 'Not yet today' },
  { key: 'done', label: 'Completed today' },
]

export default function ReportDceB() {
  const [site, setSite] = useState(DEFAULT_SITE)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [sort, setSort] = useState({ key: 'status', dir: 'asc' })
  const [page, setPage] = useState(1)
  const roster = useDceRoster(site, search)

  const counts = {
    all: roster.length,
    notyet: roster.filter((r) => !r.doneToday).length,
    done: roster.filter((r) => r.doneToday).length,
  }
  const rows = roster
    .filter((r) => filter === 'all' || (filter === 'done') === r.doneToday)
    .sort((a, b) => {
      const dir = sort.dir === 'asc' ? 1 : -1
      if (sort.key === 'name') return dir * a.name.localeCompare(b.name)
      if (sort.key === 'since') return dir * (a.sinceSort - b.sinceSort) || a.name.localeCompare(b.name)
      return dir * byPriority(a, b)
    })
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSort(key) {
    setPage(1)
    setSort((s) => (s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: key === 'since' ? 'desc' : 'asc' }))
  }

  return (
    <DcePage>
      <DceHeader
        site={site}
        onSite={(s) => { setSite(s); setPage(1) }}
        search={search}
        onSearch={(s) => { setSearch(s); setPage(1) }}
        summary={`${counts.done} of ${counts.all} teachers have completed a lesson today`}
      />
      <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
        <div className="flex items-center gap-1 px-4 pt-3 border-b border-brand-border" role="tablist" aria-label="Filter teachers">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              onClick={() => { setFilter(f.key); setPage(1) }}
              className={`px-3 pb-2.5 -mb-px text-sm border-b-2 transition-colors ${
                filter === f.key ? 'border-dessa-teal text-brand-text font-semibold' : 'border-transparent text-brand-subtext hover:text-brand-text'
              }`}
            >
              {f.label} <span className="text-brand-subtext font-normal">{counts[f.key]}</span>
            </button>
          ))}
        </div>
        {rows.length === 0 ? (
          <EmptyRoster />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-1/3"><SortHead label="Teacher" col="name" sort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortHead label="Today" col="status" sort={sort} onSort={handleSort} /></TableHead>
                <TableHead><SortHead label="Last lesson completed" col="since" sort={sort} onSort={handleSort} /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((r) => (
                <TableRow key={r.teacher.id}>
                  <TableCell className="py-2.5 font-medium">{r.name}</TableCell>
                  <TableCell className="py-2.5"><StatusCell done={r.doneToday} /></TableCell>
                  <TableCell className="py-2.5"><SinceCell since={r.since} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        <Pager page={page} pageSize={PAGE_SIZE} total={rows.length} onPage={setPage} />
      </div>
    </DcePage>
  )
}
