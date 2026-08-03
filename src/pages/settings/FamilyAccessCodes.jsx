import { useEffect, useMemo, useState } from 'react'
import { ArrowUp, ArrowDown, ArrowUpDown, Search, X } from 'lucide-react'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext,
} from '../../components/ui/pagination'
import { CopyField } from '../../components/ui/copy-field'
import { schools, SITE_LEADER_SCHOOL, getSiteJoinUrl } from '../../lib/familyAccessData'

function SiteSortHeader({ sortDir, onSort }) {
  return (
    <button
      onClick={onSort}
      className="flex items-center gap-1 text-sm font-semibold text-brand-text hover:text-dessa-teal transition-colors group"
    >
      Site
      {sortDir === 'asc' ? (
        <ArrowUp size={13} className="text-dessa-teal" />
      ) : sortDir === 'desc' ? (
        <ArrowDown size={13} className="text-dessa-teal" />
      ) : (
        <ArrowUpDown size={13} className="opacity-40 group-hover:opacity-70" />
      )}
    </button>
  )
}

export default function FamilyAccessCodes({ role }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? schools.filter((s) => s.name.toLowerCase().includes(q)) : schools
  }, [search])

  const sorted = useMemo(
    () => [...filtered].sort((a, b) =>
      sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    ),
    [filtered, sortDir]
  )

  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize))
  const pagedSchools = sorted.slice((page - 1) * pageSize, page * pageSize)
  const rangeStart = sorted.length === 0 ? 0 : (page - 1) * pageSize + 1
  const rangeEnd = Math.min(page * pageSize, sorted.length)

  useEffect(() => { setPage(1) }, [pageSize, sortDir, search])

  if (role === 'site_leader') {
    return (
      <>
        <div className="bg-brand-bg px-6 py-4">
          <p className="text-sm font-semibold text-brand-text">Access code</p>
          <p className="text-sm text-brand-subtext mt-0.5">
            Give this link to families — it connects their account to {SITE_LEADER_SCHOOL.name}.
          </p>
        </div>
        <div className="px-6 py-5">
          <p className="text-sm font-medium text-brand-text mb-2">{SITE_LEADER_SCHOOL.name}</p>
          <CopyField value={getSiteJoinUrl(SITE_LEADER_SCHOOL)} />
        </div>
      </>
    )
  }

  return (
    <>
      <div className="bg-brand-bg px-6 py-4 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-brand-text">Registration links</p>
          <p className="text-sm text-brand-subtext mt-0.5">
            Every site in your district has its own link — families use it during registration to connect to the right site.
            Site Leaders only see the link for their own site.
          </p>
        </div>
        <div className="relative flex-shrink-0">
          <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
          <input
            type="text"
            placeholder="Search schools…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 pr-6 h-8 text-xs border border-brand-border rounded-md bg-white w-52 text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-subtext hover:text-brand-text"
            >
              <X size={12} />
            </button>
          )}
        </div>
      </div>
      <div className="px-6 py-3">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="h-8 px-3 normal-case tracking-normal">
                <SiteSortHeader sortDir={sortDir} onSort={() => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))} />
              </TableHead>
              <TableHead className="h-8 px-3 text-sm text-brand-text normal-case tracking-normal text-right">Registration link</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pagedSchools.length === 0 ? (
              <TableRow>
                <TableCell colSpan={2} className="px-3 py-6 text-sm text-brand-subtext text-center">
                  No sites match "{search}"
                </TableCell>
              </TableRow>
            ) : (
              pagedSchools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell className="px-3 py-2 text-sm whitespace-nowrap">{school.name}</TableCell>
                  <TableCell className="px-3 py-2">
                    <div className="flex justify-end">
                      <CopyField value={getSiteJoinUrl(school)} variant="bare" />
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <div className="flex items-center justify-between pt-3">
          <div className="flex items-center gap-3">
            <span className="text-xs text-brand-subtext">
              {sorted.length === 0 ? '0 sites' : `${rangeStart}–${rangeEnd} of ${sorted.length} sites`}
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="text-xs border border-brand-border rounded-md bg-white px-2 py-1 text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
            >
              {[10, 25, 50, 100].map((n) => (
                <option key={n} value={n}>{n} per page</option>
              ))}
            </select>
          </div>
          {totalPages > 1 && (
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} />
                </PaginationItem>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <PaginationItem key={p}>
                    <PaginationLink isActive={p === page} onClick={() => setPage(p)}>{p}</PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </div>
      </div>
    </>
  )
}
