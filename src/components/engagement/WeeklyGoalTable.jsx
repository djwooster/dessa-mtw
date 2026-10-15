import { useEffect, useMemo, useState } from 'react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../ui/table'
import { PaginationBar } from '../ui/pagination'
import { weekBands } from './StackedGoalChart'
import { weekRangeLabel } from './MonthBarChart'

// Table view of the weekly goal chart (2026-10-14), inspired by a concept from
// the manager: the exact numbers behind the line. One row per week in the
// applied range, newest first: roster size that week, users who met the goal,
// and the percent. The last row weights the whole range (total who met the
// goal divided by total users across the weekly rosters), so a week with a
// bigger roster counts for more than a simple average of the percents would.
// `schoolId` null means every site.
export function weeklyGoalRows(schoolId, weeks, role = 'all') {
  return [...weeks].reverse().map(w => {
    const b = weekBands(schoolId, w, role)
    return { week: w, label: weekRangeLabel(w), total: b.total, met: b.met, pct: b.pct }
  })
}

export default function WeeklyGoalTable({ schoolId, weeks, role = 'all', rangeText }) {
  const rows = useMemo(() => weeklyGoalRows(schoolId, weeks, role), [schoolId, weeks, role])
  const overall = useMemo(() => {
    const met = rows.reduce((n, r) => n + r.met, 0)
    const total = rows.reduce((n, r) => n + r.total, 0)
    return total ? Math.round((met / total) * 100) : 0
  }, [rows])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  useEffect(() => { setPage(1) }, [schoolId, weeks, role])
  const shown = rows.slice((page - 1) * pageSize, page * pageSize)

  return (
    <div className="rounded-lg border border-brand-border overflow-hidden [&_td]:text-[13px]">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="text-[13px] font-medium">Week</TableHead>
            <TableHead className="text-[13px] font-medium text-right" title="Roster size that week">Users</TableHead>
            <TableHead className="text-[13px] font-medium text-right">Met goal</TableHead>
            <TableHead className="text-[13px] font-medium text-right">% met</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shown.map(r => (
            <TableRow key={r.week} className="hover:bg-transparent">
              <TableCell className="font-medium">{r.label}</TableCell>
              <TableCell className="text-right tabular-nums text-brand-subtext">{r.total}</TableCell>
              <TableCell className="text-right tabular-nums text-brand-subtext">{r.met}</TableCell>
              <TableCell className="text-right tabular-nums">{r.pct}%</TableCell>
            </TableRow>
          ))}
          <TableRow className="hover:bg-transparent bg-brand-bg/50">
            <TableCell className="font-semibold">{rangeText}</TableCell>
            <TableCell />
            <TableCell />
            <TableCell className="text-right tabular-nums font-semibold">{overall}%</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar page={page} pageSize={pageSize} total={rows.length} onPage={setPage} onPageSize={n => { setPageSize(n); setPage(1) }} className="px-4 py-3 border-t border-brand-border" />
    </div>
  )
}
