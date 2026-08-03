import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowUp, ArrowDown, ArrowUpDown, Search, X, MoreHorizontal, Download, ChevronDown } from 'lucide-react'
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

function exportSitesCsv(siteList) {
  const rows = [['Site', 'Registration Link'], ...siteList.map((s) => [s.name, getSiteJoinUrl(s)])]
  const url = URL.createObjectURL(new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' }))
  Object.assign(document.createElement('a'), { href: url, download: 'family-access-registration-links.csv' }).click()
  URL.revokeObjectURL(url)
}

const resizeTransition = { duration: 0.4, ease: 'easeInOut' }

export default function FamilyAccessCodes({ role }) {
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [sortDir, setSortDir] = useState('asc')
  const [search, setSearch] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(null)

  useEffect(() => {
    if (!menuOpen) return
    const handler = (e) => { if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [menuOpen])

  // Measure the actual rendered content height and animate to it directly —
  // avoids the scale-transform artifacts of Framer's `layout` prop when the
  // content structure changes completely (table rows vs. a single card).
  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setContentHeight(entry.contentRect.height))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

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

  useEffect(() => { setPage(1) }, [pageSize, sortDir, search])

  return (
    <motion.div
      animate={contentHeight !== null ? { height: contentHeight } : false}
      transition={resizeTransition}
      style={{ overflow: 'hidden' }}
    >
    <div ref={contentRef}>
      {role === 'site_leader' ? (
        <div>
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
        </div>
      ) : (
        <div>
          <div className="bg-brand-bg px-6 py-4">
            <p className="text-sm font-semibold text-brand-text">Registration links</p>
            <p className="text-sm text-brand-subtext mt-0.5">
              Every site in your district has its own link — families use it during registration to connect to the right site.
              Site Leaders only see the link for their own site.
            </p>
          </div>

          {/* Toolbar — search on the left, room for more actions/filters to the right of it */}
          <div className="px-6 py-3 border-b border-brand-border flex items-center justify-between gap-4">
            <div className="relative">
              <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
              <input
                type="text"
                placeholder="Search sites…"
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

            <div className="relative flex-shrink-0" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center justify-center w-8 h-8 rounded-md text-brand-text hover:bg-brand-bg transition-colors"
              >
                <MoreHorizontal size={14} />
              </button>
              {menuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-brand-border rounded-lg z-20 overflow-hidden py-1 shadow-sm">
                  <button
                    onClick={() => { exportSitesCsv(sorted); setMenuOpen(false) }}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-sm text-brand-text hover:bg-brand-bg transition-colors"
                  >
                    <Download size={13} className="text-brand-subtext" />
                    Export as CSV
                  </button>
                </div>
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

            <div className="flex items-center justify-between pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-8 h-8 p-0 justify-center rounded-lg"
                    >
                      {''}
                    </PaginationPrevious>
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="w-9 h-9 rounded-lg">
                        {p}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-8 h-8 p-0 justify-center rounded-lg"
                    >
                      {''}
                    </PaginationNext>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>

              <div className="relative">
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(Number(e.target.value))}
                  className="appearance-none pl-3 pr-8 h-9 text-sm border border-brand-border rounded-md bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                >
                  {[10, 25, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </motion.div>
  )
}
