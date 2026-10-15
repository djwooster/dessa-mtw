import { useEffect, useMemo, useState } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { PaginationBar } from '../ui/pagination'
import { SortButton, nextSort } from '../../pages/Report2ConceptE'
import { schools } from '../../lib/report2Data'
import { weekBands } from './StackedGoalChart'

// Table view of the weekly goal chart for the Program Admin (2026-10-15, Concept A): the sites are the
// first column. Users, Met goal and % met are for the applied date range: Users and Met goal are
// averages per week, and % met is total who met the goal divided by total users across the weeks (so
// for a single week they are the plain numbers). A bold row for all sites, or the one site picked in
// Filters, sits on top. `siteId` null means every site.
function scopeRow(id, weeks, role) {
  let met = 0, total = 0
  weeks.forEach(w => { const b = weekBands(id, w, role); met += b.met; total += b.total })
  return {
    users: Math.round(total / weeks.length),
    met: Math.round(met / weeks.length),
    pct: total ? Math.round((met / total) * 100) : 0,
  }
}

export function siteGoalRows(siteId, weeks, role = 'all') {
  const all = { name: siteId == null ? 'All sites' : schools.find(sc => sc.id === siteId)?.name, ...scopeRow(siteId, weeks, role) }
  const sites = siteId != null ? [] : schools.map(sc => ({ id: sc.id, name: sc.name, ...scopeRow(sc.id, weeks, role) })).filter(r => r.users > 0)
  return { all, sites }
}

export default function SitesGoalTable({ siteId, weeks, role = 'all' }) {
  const [sort, setSort] = useState({ key: 'pct', dir: 'asc' })
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(20)
  const { all, sites } = useMemo(() => siteGoalRows(siteId, weeks, role), [siteId, weeks, role])
  const rows = useMemo(() => [...sites].sort((a, b) => {
    const dir = sort.dir === 'asc' ? 1 : -1
    if (sort.key === 'name') return dir * a.name.localeCompare(b.name)
    if (sort.key === 'users') return dir * (a.users - b.users) || a.name.localeCompare(b.name)
    return dir * (a.pct - b.pct) || a.name.localeCompare(b.name)
  }), [sites, sort])
  useEffect(() => { setPage(1) }, [siteId, weeks, role])
  const shown = rows.slice((page - 1) * pageSize, page * pageSize)
  const resort = (k, first) => { setSort(s => nextSort(s, k, first)); setPage(1) }
  const num = 'text-right tabular-nums'

  return (
    <div className="rounded-lg border border-brand-border overflow-hidden [&_td]:text-[13px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[13px] font-medium"><SortButton label="Site" col="name" sort={sort} onSort={k => resort(k)} /></TableHead>
            <TableHead className="text-[13px] font-medium text-right" title="Average per week in the range"><SortButton label="Users" col="users" sort={sort} onSort={k => resort(k, 'desc')} align="right" /></TableHead>
            <TableHead className="text-[13px] font-medium text-right" title="Average per week in the range">Met goal</TableHead>
            <TableHead className="text-[13px] font-medium text-right"><SortButton label="% met" col="pct" sort={sort} onSort={k => resort(k)} align="right" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="hover:bg-transparent bg-brand-bg/50">
            <TableCell className="font-semibold">{all.name}</TableCell>
            <TableCell className={`${num} font-semibold`}>{all.users}</TableCell>
            <TableCell className={`${num} font-semibold`}>{all.met}</TableCell>
            <TableCell className={`${num} font-semibold`}>{all.pct}%</TableCell>
          </TableRow>
          {shown.map(r => (
            <TableRow key={r.id} className="hover:bg-transparent">
              <TableCell className="font-medium">{r.name}</TableCell>
              <TableCell className={`${num} text-brand-subtext`}>{r.users}</TableCell>
              <TableCell className={`${num} text-brand-subtext`}>{r.met}</TableCell>
              <TableCell className={num}>{r.pct}%</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      {siteId == null && <PaginationBar page={page} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={n => { setPageSize(n); setPage(1) }} className="px-4 py-3 border-t border-brand-border" />}
    </div>
  )
}
