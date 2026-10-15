import { useEffect, useMemo, useRef } from 'react'
import { usePersistedState } from '../../lib/usePersistedState'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { PaginationBar } from '../ui/pagination'
import { SortButton, nextSort } from '../../pages/Report2ConceptE'
import { schools, matchesSite } from '../../lib/report2Data'
import { weekBands } from './StackedGoalChart'

// Table view of the weekly goal chart for the Program Admin (2026-10-15, Concept A): the sites are the
// first column. Users, Met goal and % met are for the applied date range: Users and Met goal are
// averages per week, and % met is total who met the goal divided by total users across the weeks (so
// for a single week they are the plain numbers). No summary row (removed 2026-10-15): the list is just
// the sites picked in Filters (none picked means every site). `siteIds` is a list of ids.
function scopeRow(id, weeks, role) {
  let met = 0, total = 0
  weeks.forEach(w => { const b = weekBands(id, w, role); met += b.met; total += b.total })
  return {
    users: Math.round(total / weeks.length),
    met: Math.round(met / weeks.length),
    pct: total ? Math.round((met / total) * 100) : 0,
  }
}

export function siteGoalRows(siteIds, weeks, role = 'all') {
  const sites = schools
    .filter(sc => matchesSite(siteIds, sc.id))
    .map(sc => ({ id: sc.id, name: sc.name, ...scopeRow(sc.id, weeks, role) }))
    .filter(r => r.users > 0)
  return { sites }
}

export default function SitesGoalTable({ siteIds = [], weeks, role = 'all', onOpenSite = null }) {
  // Persisted, so coming back from a site page shows the same sort and page.
  const [sort, setSort] = usePersistedState('sitesGoal.sort', { key: 'pct', dir: 'asc' })
  const [page, setPage] = usePersistedState('sitesGoal.page', 1)
  const [pageSize, setPageSize] = usePersistedState('sitesGoal.pageSize', 10)
  const { sites } = useMemo(() => siteGoalRows(siteIds, weeks, role), [siteIds, weeks, role])
  const rows = useMemo(() => [...sites].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.key === 'name') return dir * a.name.localeCompare(b.name)
    if (sort.key === 'users') return dir * (a.users - b.users) || a.name.localeCompare(b.name)
    if (sort.key === 'met') return dir * (a.met - b.met) || a.name.localeCompare(b.name)
    return dir * (a.pct - b.pct) || a.name.localeCompare(b.name)
  }), [sites, sort])
  const first = useRef(true)
  useEffect(() => {
    if (first.current) { first.current = false; return }
    setPage(1)
  }, [siteIds, weeks, role])
  const shown = rows.slice((page - 1) * pageSize, page * pageSize)
  const resort = (k, first) => { setSort(s => nextSort(s, k, first)); setPage(1) }
  const num = 'text-right tabular-nums'

  return (
    <div className="rounded-lg border border-brand-border overflow-hidden [&_td]:text-[13px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[13px] font-medium"><SortButton label="Site" col="name" sort={sort} onSort={k => resort(k)} /></TableHead>
            <TableHead className="text-[13px] font-medium text-right w-28" title="Average per week in the range"><SortButton label="Users" col="users" sort={sort} onSort={k => resort(k, 'desc')} align="right" /></TableHead>
            <TableHead className="text-[13px] font-medium text-right w-28" title="Average per week in the range"><SortButton label="Met goal" col="met" sort={sort} onSort={k => resort(k, 'desc')} align="right" /></TableHead>
            <TableHead className="text-[13px] font-medium text-right w-28"><SortButton label="% met" col="pct" sort={sort} onSort={k => resort(k)} align="right" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map(r => (
            <TableRow key={r.id} onClick={onOpenSite ? () => onOpenSite(r.id) : undefined} className={onOpenSite ? 'cursor-pointer' : 'hover:bg-transparent'}>
              <TableCell className="font-medium">
                {onOpenSite ? (
                  <button type="button" onClick={e => { e.stopPropagation(); onOpenSite(r.id) }} className="text-left text-[13px] text-[#134fb2] hover:underline">{r.name}</button>
                ) : r.name}
              </TableCell>
              <TableCell className={`${num} text-brand-subtext`}>{r.users}</TableCell>
              <TableCell className={`${num} text-brand-subtext`}>{r.met}</TableCell>
              <TableCell className={num}>{r.pct}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <PaginationBar page={page} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={n => { setPageSize(n); setPage(1) }} className="px-4 py-3 border-t border-brand-border" />
    </div>
  )
}
