import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import { Info, Plus, Pencil, Trash2, Check, X, ChevronDown, Search, RotateCcw } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
// import FamilyAccessUrl from './FamilyAccessUrl'
import FamilyAccessCodes from './FamilyAccessCodes'
import { SidePanel } from '../../components/ui/side-panel'
import { DatePicker } from '../../components/ui/date-picker'
import { Tabs, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui/table'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '../../components/ui/pagination'
import { schools, SITE_LEADER_SCHOOL } from '../../lib/familyAccessData'

const TABS = [
  { key: 'engagement', label: 'Engagement' },
  { key: 'school-year', label: 'School year' },
  { key: 'blackout', label: 'Blackout periods' },
]

const GOAL_OPTIONS = [1, 2, 3, 4, 5]
const OVERRIDES_PAGE_SIZE = 8
const MODAL_PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 'all']

// Windowed page list (first, last, current ±1) with gaps marked by '…' —
// same helper as Resources.jsx's pageWindow, duplicated here rather than
// shared since it's a few lines and this page doesn't otherwise import
// from Resources.jsx.
function pageWindow(current, total) {
  const shown = new Set([1, total, current - 1, current, current + 1])
  const pages = [...shown].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b)
  const withGaps = []
  pages.forEach((p, i) => {
    if (i > 0 && p - pages[i - 1] > 1) withGaps.push('ellipsis')
    withGaps.push(p)
  })
  return withGaps
}

// Shared 1-5 day-picker control — used by the Program Admin's own default,
// the Site Leader's override, and all four admin-summary concepts below,
// so a value always reads/edits the same way regardless of which concept
// or which "side" of the setting it's rendered for.
function GoalPicker({ value, onChange, size = 'md' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className="flex gap-1.5">
      {GOAL_OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`${dim} rounded-md border font-medium transition-colors ${
            value === n
              ? 'bg-dessa-teal text-white border-dessa-teal'
              : 'bg-white text-brand-text border-brand-border hover:bg-brand-bg'
          }`}
        >
          {n}
        </button>
      ))}
    </div>
  )
}

// Sleek radio-pill alternative to GoalPicker (2026-08-31, replacing the
// dropdown-chip attempt above) — used only for the per-site override rows
// in Concepts B/D's drawer/modal list. Native radio inputs (visually
// hidden) drive a styled pill per option so every choice stays visible and
// one click away, unlike the dropdown-chip version this replaces — closer
// in spirit to the segmented GoalPicker buttons, just softer/pill-shaped
// with an explicit radio dot. `name` must be unique per row (e.g. keyed by
// school id) so each site's group of native radios doesn't clash with the
// others rendered on the same page. The main page's own Weekly Goal control
// (and Concept C's table) keep GoalPicker — this is scoped to the drawer's
// repeated rows only.
function GoalRadioGroup({ value, onChange, name }) {
  return (
    <div role="radiogroup" className="flex flex-wrap gap-2">
      {GOAL_OPTIONS.map((n) => {
        const selected = value === n
        return (
          <label
            key={n}
            className={`flex items-center gap-2 pl-2.5 pr-3.5 py-2 rounded-full border cursor-pointer transition-colors ${
              selected
                ? 'border-dessa-teal bg-dessa-tealLight'
                : 'border-brand-border bg-white hover:border-dessa-teal/40'
            }`}
          >
            <input
              type="radio"
              name={name}
              checked={selected}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <span
              className={`flex items-center justify-center w-4 h-4 rounded-full border-2 shrink-0 transition-colors ${
                selected ? 'border-dessa-teal' : 'border-brand-border'
              }`}
            >
              {selected && <span className="w-1.5 h-1.5 rounded-full bg-dessa-teal" />}
            </span>
            <span className={`text-[13px] font-medium ${selected ? 'text-dessa-teal' : 'text-brand-text'}`}>
              {n} day{n === 1 ? '' : 's'}
            </span>
          </label>
        )
      })}
    </div>
  )
}

// Value pill for Concept D's dense table (2026-08-31, simplified same day —
// the per-value Notion-style colors read as "off" rather than helpful, so
// every pill is plain light-gray with a subtle border for now regardless of
// value or Default/Custom status; real color-coding, if any, is a later
// pass. No longer takes a `muted` prop — callers that still pass one (e.g.
// GoalColorDropdown below) have it silently ignored here, since there's
// nothing left to vary; `muted` still matters one level up, though, where
// it suppresses the checkmark for a Default row's placeholder value.
// `interactive` adds a small caret so a plain gray pill (no color left to
// hint "click me") still reads as clickable where it actually is — only
// GoalColorDropdown's trigger passes this; the inert pending-reset pill and
// the bulk bar's "Set to:" quick-pick pills don't. The "N Day(s)" label
// lives inside the pill itself now (was a separate <span> next to it in
// GoalColorDropdown's list) so there's one thing to read per row, not two.
function GoalPill({ n, size = 'md', interactive = false }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-2.5 py-1.5 text-sm'
  return (
    <span className={`inline-flex items-center justify-center gap-1 rounded-md font-medium shrink-0 whitespace-nowrap border border-brand-border bg-brand-bg text-brand-text ${sizeClasses}`}>
      {n} {n === 1 ? 'Day' : 'Days'}
      {interactive && <ChevronDown size={size === 'sm' ? 10 : 12} className="text-brand-subtext" />}
    </span>
  )
}

// Click-to-edit cell for Concept D's table — closed state is just the
// colored pill (Notion's reference showed a removable chip + "create one"
// search, but our range is a fixed, always-populated 1-5, so that's
// simplified to a plain list of the other 4 values, with no way to clear
// it entirely — clearing an override back to the program default is a
// bulk-only action, see bulkStageReset). z-[60] on the content since it
// needs to render above the modal's own z-50 overlay. `muted` just passes
// through to the trigger pill — a Default row opening this still lists the
// normal colored options, since picking one is what customizes it.
function GoalColorDropdown({ value, onChange, muted = false }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button type="button" className="inline-flex rounded-md focus:outline-none focus:ring-2 focus:ring-dessa-teal/25">
          <GoalPill n={value} interactive size="sm" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[60] w-44 bg-white border border-brand-border rounded-lg shadow-lg outline-none overflow-hidden py-1"
        >
          {GOAL_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { onChange(n); setOpen(false) }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
                value === n && !muted ? 'bg-brand-bg' : 'hover:bg-brand-bg'
              }`}
            >
              <GoalPill n={n} size="sm" />
              {value === n && !muted && <Check size={13} className="text-dessa-teal shrink-0" />}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// Selection command bar (2026-09-01, replacing the dropdown-based Actions
// button and, before that, the layout-shifting "N selected" bar) — modeled
// directly on Notion's own bulk-edit toolbar: renders nothing at all with
// zero rows selected (no persistent "Actions" affordance to keep around),
// and appears in that same slot, left of search, the moment ≥1 row is
// checked. Thin `bg-dessa-teal/20` hairlines between segments mirror
// Notion's own subtle dividers rather than visible borders per segment.
// Actions are intentionally just the two we actually have — set weekly
// goal (inline pills, not hidden behind a dropdown like the button
// version) and reset — no "..." overflow, since hiding one of two actions
// behind a menu only adds a click.
function SelectionCommandBar({ count, onSetGoal, onReset }) {
  return (
    <div className="flex items-center gap-2.5 h-9 px-3 rounded-md bg-dessa-tealLight shrink-0">
      <span className="text-sm font-semibold text-dessa-teal whitespace-nowrap">
        {count} selected
      </span>
      <span className="w-px h-5 bg-dessa-teal/20 shrink-0" />
      <div className="flex items-center gap-1.5 shrink-0">
        {GOAL_OPTIONS.map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onSetGoal(n)}
            className="rounded-md hover:opacity-70 transition-opacity"
            aria-label={`Set selected sites to ${n} days`}
          >
            <GoalPill n={n} size="sm" />
          </button>
        ))}
      </div>
      <span className="w-px h-5 bg-dessa-teal/20 shrink-0" />
      <button
        type="button"
        onClick={onReset}
        title="Reset to default"
        aria-label="Reset selected sites to program default"
        className="p-1.5 rounded-md text-dessa-teal hover:bg-white/50 transition-colors shrink-0"
      >
        <RotateCcw size={15} />
      </button>
    </div>
  )
}

// Admin-summary concept switcher (2026-08-28) — four different ways to show
// Program Admins which sites have customized their weekly goal, driven by
// the Nav dropdown's `?adminConcept=` param (same pattern as the retired
// Resources decor switcher): A embeds a lightweight table directly in the
// page (accordion-expand to edit, like the ticket's original build); B
// keeps a trigger pill that opens a right-side drawer with compact inline
// controls per row; C is a full report-style table over every site
// (search + status filter + pagination, reusing this app's Table/
// Pagination primitives) so the "summary" scales to browsing the whole
// roster, not just the exceptions; D is the same compact content as B but
// in a centered modal + overlay instead of a side drawer.

// Deterministic pseudo-random fraction in [0, 1) from an integer seed —
// used below so which ~25% of the mock roster starts customized (and at
// what value) stays fixed across reloads instead of reshuffling every time
// the page loads, unlike Math.random().
function seededFraction(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

// Mock per-site Weekly goal overrides (JIRA AP-4933) — reuses the same
// `schools` list Family Access Codes already renders further down this
// page, so "Site" means the same thing in both places. ~25% of the full
// 150-site roster starts customized (each at a pseudo-random 1-5 value) so
// Concept C/D's tables show the "Custom" badge scattered across many rows,
// not just a hand-picked handful.
const DEFAULT_SITE_OVERRIDES = schools
  .filter((s) => seededFraction(s.id) < 0.25)
  .map((s) => ({ school: s, weeklyGoal: Math.floor(seededFraction(s.id + 0.5) * 5) + 1 }))

const DEFAULT_BLACKOUT_PERIODS = [
  { id: 1, name: 'Fall Break',   from: '2025-10-13', to: '2025-10-17' },
  { id: 2, name: 'Thanksgiving', from: '2025-11-24', to: '2025-11-28' },
  { id: 3, name: 'Winter Break', from: '2025-12-22', to: '2026-01-02' },
  { id: 4, name: 'MLK Day',      from: '2026-01-19', to: '2026-01-19' },
  { id: 5, name: 'Spring Break', from: '2026-03-16', to: '2026-03-20' },
  { id: 6, name: 'Memorial Day', from: '2026-05-25', to: '2026-05-25' },
]

function formatRange(from, to) {
  const start = parseISO(from)
  const end = parseISO(to)
  if (from === to) return format(start, 'MMM d, yyyy')
  const sameYear = format(start, 'yyyy') === format(end, 'yyyy')
  const sameMonth = sameYear && format(start, 'MMM') === format(end, 'MMM')
  if (sameMonth) return `${format(start, 'MMM d')} – ${format(end, 'd')}, ${format(end, 'yyyy')}`
  if (sameYear) return `${format(start, 'MMM d')} – ${format(end, 'MMM d')}, ${format(end, 'yyyy')}`
  return `${format(start, 'MMM d, yyyy')} – ${format(end, 'MMM d, yyyy')}`
}

const FAMILY_ACCESS_TABS = [
  // { key: 'url', label: 'Registration Link' },
  { key: 'codes', label: 'Access Codes' },
]

export default function CurriculumSetup() {
  const [searchParams] = useSearchParams()
  // Which of the 4 admin-summary concepts is showing (see the block comment
  // above ADMIN_OVERRIDE_CONCEPTS) — driven by Nav's dropdown, not local
  // state, same reasoning as the retired Resources decor switcher: a
  // reviewer flips it from the nav without this page needing its own
  // control for something that's purely a design-comparison toggle.
  const adminConcept = searchParams.get('adminConcept') || 'a'

  const [tab, setTab] = useState('engagement')
  const [goal, setGoal] = useState(3)
  const [familyAccessTab, setFamilyAccessTab] = useState('codes')
  const [isSiteLeaderView, setIsSiteLeaderView] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)

  // Program Admin's Weekly-goal overrides (AP-4933) — kept as real state
  // (not a plain constant) so a Save/Reset in the expanded row actually
  // updates the list, rather than being a static mockup. Shared by all 4
  // admin concepts AND the Site Leader view below — a site is "customized"
  // exactly when it appears here, regardless of which side changed it.
  const [overrides, setOverrides] = useState(DEFAULT_SITE_OVERRIDES)
  const [overridesOpen, setOverridesOpen] = useState(false)
  // Concepts B/D only — sites marked "Reset" in the drawer/modal, staged
  // here instead of filtered out of `overrides` immediately. Removing a row
  // from the list the instant Reset is clicked read as jarring while
  // you're still scanning it; staging it (row stays put, dimmed, with an
  // Undo) and only committing the removal when the panel closes fixes
  // that. Both SidePanel (B) and the custom modal (D) only expose a single
  // close action (X / backdrop / footer button all call
  // closeOverridesPanel), so "closed" is the one point where a commit can
  // happen — there's no separate Cancel that should discard these.
  const [pendingResets, setPendingResets] = useState(new Set())
  // Accordion, not a drill-in screen — id of the one row expanded at a
  // time (null = none), so managing a site's setting happens in place
  // instead of navigating away from the list. Concept A only (B/C/D edit
  // inline without an expand step — see their render functions below).
  const [expandedSchoolId, setExpandedSchoolId] = useState(null)
  const [editOverrideGoal, setEditOverrideGoal] = useState(null)

  // Shared by Concepts C and D — both browse the full ~150-school roster
  // (not just the handful with overrides), so both need their own search/
  // page state rather than reusing A/B's plain overrides list.
  const [overridesSearch, setOverridesSearch] = useState('')
  const [overridesPage, setOverridesPage] = useState(1)
  // Concept D only — adjustable page size (matching the Resources page's
  // own results-list pagination), unlike C's fixed OVERRIDES_PAGE_SIZE.
  const [modalPageSize, setModalPageSize] = useState('all')
  // Concept C only — its status filter is a <select> (all/custom/default),
  // narrowing which rows show at all. Concept D dropped this in favor of
  // always showing every site (2026-08-31 simplification) plus the
  // sortable Status column below, so D never reads or writes this.
  const [overridesStatusFilter, setOverridesStatusFilter] = useState('all')
  // Concept D — click-to-sort on the Status column header; retired
  // 2026-08-31 along with that column (see the block comment above
  // GoalPill). Commented out rather than left as dead-but-declared state,
  // since nothing can set it anymore.
  // const [overridesStatusSort, setOverridesStatusSort] = useState(null)
  // Concept D only — checkbox multi-select for the bulk action bar
  // (set N selected sites to a goal, or reset N selected to default).
  // Cleared on tab switch (selection referring to now-hidden rows would be
  // confusing) and when the modal closes.
  const [selectedSchoolIds, setSelectedSchoolIds] = useState(new Set())

  // Concept D's modal is a fixed-position overlay, so the settings page
  // behind it keeps scrolling on its own unless we lock it explicitly.
  useEffect(() => {
    if (adminConcept === 'd' && overridesOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [adminConcept, overridesOpen])

  const [periods, setPeriods] = useState(DEFAULT_BLACKOUT_PERIODS)
  const [isAdding, setIsAdding] = useState(false)
  const [newName, setNewName] = useState('')
  const [newFrom, setNewFrom] = useState('')
  const [newTo, setNewTo] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState('')
  const [editFrom, setEditFrom] = useState('')
  const [editTo, setEditTo] = useState('')

  const canAdd = newName.trim() && newFrom && newTo && newFrom <= newTo

  function startAdd() {
    setIsAdding(true)
  }

  function cancelAdd() {
    setIsAdding(false)
    setNewName(''); setNewFrom(''); setNewTo('')
  }

  function saveNewPeriod() {
    if (!canAdd) return
    setPeriods((ps) => [...ps, { id: Date.now(), name: newName.trim(), from: newFrom, to: newTo }]
      .sort((a, b) => a.from.localeCompare(b.from)))
    setNewName(''); setNewFrom(''); setNewTo('')
    setIsAdding(false)
    toast.success('Blackout period added')
  }

  function startEdit(p) {
    setEditingId(p.id); setEditName(p.name); setEditFrom(p.from); setEditTo(p.to)
  }

  function cancelEdit() {
    setEditingId(null)
  }

  function saveEdit() {
    if (!editName.trim() || !editFrom || !editTo || editFrom > editTo) return
    setPeriods((ps) => ps.map((p) => p.id === editingId
      ? { ...p, name: editName.trim(), from: editFrom, to: editTo }
      : p
    ).sort((a, b) => a.from.localeCompare(b.from)))
    setEditingId(null)
    toast.success('Blackout period updated')
  }

  function deletePeriod(id) {
    setPeriods((ps) => ps.filter((p) => p.id !== id))
    toast.success('Blackout period removed')
  }

  function toggleExpanded(o) {
    if (expandedSchoolId === o.school.id) {
      setExpandedSchoolId(null)
    } else {
      setExpandedSchoolId(o.school.id)
      setEditOverrideGoal(o.weeklyGoal)
    }
  }

  function closeOverridesPanel() {
    setOverridesOpen(false)
    setExpandedSchoolId(null)
    setSelectedSchoolIds(new Set())
    if (pendingResets.size > 0) {
      setOverrides((os) => os.filter((o) => !pendingResets.has(o.school.id)))
      setPendingResets(new Set())
    }
  }

  // Concept D — was wired to the (now-removed) Status column header,
  // cycling the 3-state sort (see overridesStatusSort above) instead of
  // narrowing rows via a filter. No trigger left to call this now that the
  // column's gone; overridesStatusSort itself is left alone since
  // modalSchools' sort still reads it (harmlessly always null).
  // function toggleStatusSort() {
  //   setOverridesStatusSort((prev) => (prev === null ? 'asc' : prev === 'asc' ? 'desc' : null))
  // }

  // Header checkbox toggles selection of the current PAGE only
  // (pagedModalSchools, defined below) — not every row, matching the usual
  // Notion/Linear "select all on this page" convention rather than
  // implicitly selecting hundreds of off-screen rows across other pages.
  function toggleSelectAllPaged() {
    setSelectedSchoolIds((prev) => {
      const next = new Set(prev)
      const allSelected = pagedModalSchools.length > 0 && pagedModalSchools.every((s) => next.has(s.id))
      pagedModalSchools.forEach((s) => (allSelected ? next.delete(s.id) : next.add(s.id)))
      return next
    })
  }

  function toggleSchoolSelected(schoolId) {
    setSelectedSchoolIds((prev) => {
      const next = new Set(prev)
      if (next.has(schoolId)) next.delete(schoolId)
      else next.add(schoolId)
      return next
    })
  }

  // Concept D bulk actions — apply to every currently-selected school
  // (looked up from the full roster, not just `overrides`, since a
  // selected "Default" row has no existing override entry yet). Setting a
  // goal also clears any pending-reset flag on that school (contradictory
  // otherwise: staged to revert, but just given an explicit value).
  function bulkSetGoal(n) {
    setOverrides((os) => {
      const bySchoolId = new Map(os.map((o) => [o.school.id, o]))
      selectedSchoolIds.forEach((id) => {
        const school = schools.find((s) => s.id === id)
        if (school) bySchoolId.set(id, { school, weeklyGoal: n })
      })
      return Array.from(bySchoolId.values())
    })
    setPendingResets((prev) => {
      const next = new Set(prev)
      selectedSchoolIds.forEach((id) => next.delete(id))
      return next
    })
    setSelectedSchoolIds(new Set())
  }

  function bulkStageReset() {
    setPendingResets((prev) => {
      const next = new Set(prev)
      selectedSchoolIds.forEach((id) => next.add(id))
      return next
    })
    setSelectedSchoolIds(new Set())
  }

  function togglePendingReset(schoolId) {
    setPendingResets((prev) => {
      const next = new Set(prev)
      if (next.has(schoolId)) next.delete(schoolId)
      else next.add(schoolId)
      return next
    })
  }

  function saveOverrideGoal() {
    const school = overrides.find((o) => o.school.id === expandedSchoolId)?.school
    setOverrides((os) => os.map((o) =>
      o.school.id === expandedSchoolId ? { ...o, weeklyGoal: editOverrideGoal } : o
    ))
    if (school) toast.success(`Updated ${school.name}'s weekly goal`)
  }

  // Removing the override entirely is what "back to program default" means
  // — there's no separate "inherit" flag to flip, since being in this list
  // at all is what makes a site custom in the first place.
  function resetOverrideToDefault() {
    const school = overrides.find((o) => o.school.id === expandedSchoolId)?.school
    setOverrides((os) => os.filter((o) => o.school.id !== expandedSchoolId))
    if (school) toast.success(`${school.name} now uses the program default`)
    setExpandedSchoolId(null)
  }

  // Site Leader side — single-site for now (multi-site switching is still
  // an open question per the ticket). "Customized" is derived, not tracked
  // separately: this site is custom exactly when it's present in the same
  // `overrides` array the admin concepts read/write, so a change from
  // either side shows up immediately on the other.
  const siteLeaderOverride = overrides.find((o) => o.school.id === SITE_LEADER_SCHOOL.id)
  const isSiteLeaderCustom = !!siteLeaderOverride

  function useSiteLeaderDefault() {
    setOverrides((os) => os.filter((o) => o.school.id !== SITE_LEADER_SCHOOL.id))
  }

  function customizeSiteLeaderGoal() {
    setOverrides((os) => [...os, { school: SITE_LEADER_SCHOOL, weeklyGoal: goal }])
  }

  function setSiteLeaderGoal(day) {
    setOverrides((os) => os.map((o) => (o.school.id === SITE_LEADER_SCHOOL.id ? { ...o, weeklyGoal: day } : o)))
  }

  // Concept C only — full-roster report, filtered by its own status
  // <select> and paged. `schools` (familyAccessData.js) is generated in
  // place/suffix/type cycling order, not alphabetically, so this sorts
  // explicitly.
  const overridesSearchQuery = overridesSearch.trim().toLowerCase()
  const filteredSchools = schools
    .filter((s) => {
      const isCustom = overrides.some((o) => o.school.id === s.id)
      const matchesSearch = !overridesSearchQuery || s.name.toLowerCase().includes(overridesSearchQuery)
      const matchesStatus =
        overridesStatusFilter === 'all' || (overridesStatusFilter === 'custom' ? isCustom : !isCustom)
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => a.name.localeCompare(b.name))

  // Concept D only — always every site (no status filter, per the
  // 2026-08-31 simplification), same search, sorted alphabetically. Used to
  // also sort by Status when overridesStatusSort was set via that column's
  // header; that state and this branch are retired along with the column
  // (see the block comment above GoalPill).
  const modalSchools = schools
    .filter((s) => !overridesSearchQuery || s.name.toLowerCase().includes(overridesSearchQuery))
    .sort((a, b) => a.name.localeCompare(b.name))

  // Reset to page 1 when the search/filter changes — adjusted during
  // render (same pattern as the Resources page's results list) rather than
  // in an effect, so it takes effect in the same commit as the paged lists
  // below.
  const overridesFilterKey = JSON.stringify([overridesSearch, overridesStatusFilter, modalPageSize])
  const [prevOverridesFilterKey, setPrevOverridesFilterKey] = useState(overridesFilterKey)
  if (overridesFilterKey !== prevOverridesFilterKey) {
    setPrevOverridesFilterKey(overridesFilterKey)
    setOverridesPage(1)
  }

  const overridesTotalPages = Math.max(1, Math.ceil(filteredSchools.length / OVERRIDES_PAGE_SIZE))
  const pagedSchools = filteredSchools.slice(
    (overridesPage - 1) * OVERRIDES_PAGE_SIZE,
    overridesPage * OVERRIDES_PAGE_SIZE
  )

  // 'all' page size means "no pagination" — one page holding every filtered
  // school, rather than treating it as a numeric size to slice by.
  const modalTotalPages = modalPageSize === 'all' ? 1 : Math.max(1, Math.ceil(modalSchools.length / modalPageSize))
  const pagedModalSchools = modalPageSize === 'all'
    ? modalSchools
    : modalSchools.slice((overridesPage - 1) * modalPageSize, overridesPage * modalPageSize)

  // Shared by Concepts B and D — same compact, no-expand-step content
  // (a value control + reset right on each row), just presented in a
  // right-side drawer (B) vs. a centered modal (D) below.
  function renderOverridesCompactList() {
    return (
      <div className="flex flex-col gap-1">
        <p className="text-sm text-brand-subtext mb-2">
          These sites use their own weekly goal instead of the program default ({goal} day{goal === 1 ? '' : 's'}/week).
        </p>
        {overrides.length === 0 ? (
          <p className="text-sm text-brand-subtext py-6 text-center">No sites have customized their goal yet.</p>
        ) : (
          overrides.map((o) => {
            const isPendingReset = pendingResets.has(o.school.id)
            return (
              <div key={o.school.id} className="flex flex-col gap-2.5 py-3 border-b border-brand-border last:border-b-0">
                {/* Reset moved up next to the name — the radio-pill group
                    below needs the row's full width to itself (5 pills with
                    "N days" labels don't fit alongside a Reset link at this
                    drawer's 380px width) and wraps freely when it still
                    doesn't fit on one line. */}
                <div className="flex items-center justify-between gap-2">
                  <span className={`text-sm font-medium truncate ${isPendingReset ? 'text-brand-subtext' : 'text-brand-text'}`}>
                    {o.school.name}
                  </span>
                  {/* Toggles a staged flag rather than removing the row —
                      see pendingResets above. "Undo" flips it back before
                      the panel closes and commits it. */}
                  <button
                    type="button"
                    onClick={() => togglePendingReset(o.school.id)}
                    className="text-xs font-medium text-[#3662da] hover:opacity-80 transition-opacity shrink-0"
                  >
                    {isPendingReset ? 'Undo' : 'Reset'}
                  </button>
                </div>
                {isPendingReset ? (
                  <p className="text-xs text-brand-subtext italic">
                    Will revert to the program default ({goal} day{goal === 1 ? '' : 's'}/week) when you close this panel.
                  </p>
                ) : (
                  <GoalRadioGroup
                    name={`goal-${o.school.id}`}
                    value={o.weeklyGoal}
                    onChange={(n) =>
                      setOverrides((os) => os.map((x) => (x.school.id === o.school.id ? { ...x, weeklyGoal: n } : x)))
                    }
                  />
                )}
              </div>
            )
          })
        )}
      </div>
    )
  }

  return (
    <>
    <div className="flex flex-col gap-8">
    {/* Internal-only role switcher — not a real end-user control, just lets
        the team flip between the Program Admin and Site Leader views of
        this page while reviewing the design. Drives the same
        isSiteLeaderView state the old single toggle button did. */}
    <div className="flex items-center justify-end">
      <Tabs
        value={isSiteLeaderView ? 'site_leader' : 'program_admin'}
        onValueChange={(v) => setIsSiteLeaderView(v === 'site_leader')}
      >
        <TabsList>
          <TabsTrigger value="program_admin">Program Admin</TabsTrigger>
          <TabsTrigger value="site_leader">Site Leader</TabsTrigger>
        </TabsList>
      </Tabs>
    </div>

    {!isSiteLeaderView && (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="p-6 pb-0">
        <h1 className="text-2xl font-semibold text-brand-text mb-4">Curriculum Setup</h1>
        <div className="flex items-center gap-5 border-b border-brand-border">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key
                  ? 'text-brand-text border-dessa-teal'
                  : 'text-brand-subtext border-transparent hover:text-brand-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'engagement' && (
        <>
          <div className="bg-brand-bg px-6 py-4">
            <p className="text-sm font-semibold text-brand-text">Engagement settings</p>
            <p className="text-sm text-brand-subtext mt-0.5">
              Configure how user engagement is measured and reported across your district.
            </p>
          </div>

          <div className="px-6 py-5">
            <p className="text-sm font-semibold text-brand-text">Weekly goal</p>
            <p className="text-sm text-brand-subtext mt-0.5 mb-3">
              Days per week a user must access a lesson to be on track.
            </p>
            <GoalPicker value={goal} onChange={setGoal} />
          </div>

          {/* Concept A — lightweight table embedded directly in the page,
              always visible (no trigger/overlay needed). Same accordion-
              expand-to-edit interaction as the original build, just no
              longer hidden behind a pill + side panel. */}
          {adminConcept === 'a' && (
            <div className="px-6 pb-6">
              <div className="border-t border-brand-border pt-5">
                <p className="text-sm font-semibold text-brand-text mb-1">Site overrides</p>
                <p className="text-sm text-brand-subtext mb-3">
                  Sites using their own weekly goal instead of the program default.
                </p>
                {overrides.length === 0 ? (
                  <p className="text-sm text-brand-subtext py-3">No sites have customized their goal yet.</p>
                ) : (
                  <div className="rounded-lg border border-brand-border overflow-hidden">
                    {overrides.map((o) => {
                      const isExpanded = expandedSchoolId === o.school.id
                      return (
                        <div key={o.school.id} className="border-b border-brand-border last:border-b-0">
                          <button
                            type="button"
                            onClick={() => toggleExpanded(o)}
                            aria-expanded={isExpanded}
                            className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-brand-bg transition-colors"
                          >
                            <span className="text-sm font-medium text-brand-text truncate">{o.school.name}</span>
                            <span className="flex items-center gap-2 shrink-0">
                              <span className="text-xs font-semibold text-dessa-teal bg-dessa-tealLight px-2 py-0.5 rounded-full">
                                {o.weeklyGoal} day{o.weeklyGoal === 1 ? '' : 's'}
                              </span>
                              <ChevronDown
                                size={14}
                                className={`text-brand-subtext shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                              />
                            </span>
                          </button>
                          {isExpanded && (
                            <div className="px-4 pb-4 flex flex-col gap-3 bg-brand-bg/40">
                              <GoalPicker value={editOverrideGoal} onChange={setEditOverrideGoal} size="sm" />
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={saveOverrideGoal}
                                  className="h-8 px-3 rounded-md text-xs font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={resetOverrideToDefault}
                                  className="h-8 px-3 rounded-md text-xs font-medium text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors"
                                >
                                  Reset to default
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Concept C — full-roster report: every site, not just the
              overridden ones, with search + status filter + pagination
              (mirrors the Report1 admin-table pattern elsewhere in this
              app) so it scales to browsing/auditing the whole district,
              not just spotting exceptions. Editing is inline in the table
              itself — no drawer/modal. */}
          {adminConcept === 'c' && (
            <div className="px-6 pb-6">
              <div className="border-t border-brand-border pt-5">
                <p className="text-sm font-semibold text-brand-text mb-1">Site overrides</p>
                <p className="text-sm text-brand-subtext mb-3">
                  Every site's weekly goal setting — default or customized.
                </p>
                <div className="flex items-center gap-2 mb-3">
                  <div className="relative flex-1 max-w-xs">
                    <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
                    <input
                      type="text"
                      value={overridesSearch}
                      onChange={(e) => setOverridesSearch(e.target.value)}
                      placeholder="Search sites"
                      className="w-full pl-8 pr-2 h-9 text-sm border border-brand-border rounded-md bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                    />
                  </div>
                  <select
                    value={overridesStatusFilter}
                    onChange={(e) => setOverridesStatusFilter(e.target.value)}
                    className="h-9 px-2.5 text-sm border border-brand-border rounded-md bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                  >
                    <option value="all">All sites</option>
                    <option value="custom">Customized</option>
                    <option value="default">Program default</option>
                  </select>
                </div>
                <div className="rounded-lg border border-brand-border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Site</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Weekly goal</TableHead>
                        <TableHead className="text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedSchools.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center text-brand-subtext py-6">
                            No sites match your search.
                          </TableCell>
                        </TableRow>
                      ) : (
                        pagedSchools.map((school) => {
                          const override = overrides.find((o) => o.school.id === school.id)
                          const isCustom = !!override
                          return (
                            <TableRow key={school.id}>
                              <TableCell className="font-medium">{school.name}</TableCell>
                              <TableCell>
                                <span
                                  className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                                    isCustom ? 'text-dessa-teal bg-dessa-tealLight' : 'text-brand-subtext bg-brand-bg'
                                  }`}
                                >
                                  {isCustom ? 'Custom' : 'Default'}
                                </span>
                              </TableCell>
                              <TableCell>
                                {isCustom ? (
                                  <GoalPicker
                                    value={override.weeklyGoal}
                                    onChange={(n) =>
                                      setOverrides((os) =>
                                        os.map((o) => (o.school.id === school.id ? { ...o, weeklyGoal: n } : o))
                                      )
                                    }
                                    size="sm"
                                  />
                                ) : (
                                  <span className="text-brand-subtext">
                                    {goal} day{goal === 1 ? '' : 's'} (default)
                                  </span>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {isCustom ? (
                                  <button
                                    type="button"
                                    onClick={() => setOverrides((os) => os.filter((o) => o.school.id !== school.id))}
                                    className="text-xs font-medium text-brand-subtext hover:text-brand-text transition-colors"
                                  >
                                    Reset
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => setOverrides((os) => [...os, { school, weeklyGoal: goal }])}
                                    className="text-xs font-medium text-dessa-teal hover:underline"
                                  >
                                    Customize
                                  </button>
                                )}
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
                {filteredSchools.length > 0 && (
                  <div className="flex items-center justify-between mt-3">
                    <p className="text-xs text-brand-subtext">
                      {filteredSchools.length} site{filteredSchools.length === 1 ? '' : 's'}
                    </p>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setOverridesPage((p) => Math.max(1, p - 1))}
                        disabled={overridesPage === 1}
                        className="h-8 px-3 rounded-md text-xs font-medium border border-brand-border text-brand-text hover:bg-brand-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Previous
                      </button>
                      <p className="text-xs text-brand-subtext">
                        Page {overridesPage} of {overridesTotalPages}
                      </p>
                      <button
                        type="button"
                        onClick={() => setOverridesPage((p) => Math.min(overridesTotalPages, p + 1))}
                        disabled={overridesPage === overridesTotalPages}
                        className="h-8 px-3 rounded-md text-xs font-medium border border-brand-border text-brand-text hover:bg-brand-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 px-6 py-4 border-t border-brand-border">
            {/* AP-4933 — Concepts B/D's drawer/modal trigger, relocated here
                from a header pill (found unclear as an "open this" control
                at rest). Plain secondary button, not a pill, and kept out
                of the Cancel/Save cluster on the right so it reads as its
                own action tied to the Weekly Goal section above rather than
                a third form action. Stays out of the way entirely when
                nothing's been customized. The empty div when there's
                nothing to render keeps Cancel/Save pinned right via
                justify-between (a single remaining flex child would
                otherwise get pushed left, not right). */}
            <div>
              {/* Concepts B and D now share the same plain link trigger —
                  D's modal used to be opened via a bordered button, but
                  once its content became a full dense table (see below)
                  it's no longer a lightweight "here's what's going on"
                  aside vs. a real management surface distinction; both read
                  fine as a link into more detail. */}
              {(adminConcept === 'b' || adminConcept === 'd') && overrides.length > 0 && (
                <button
                  type="button"
                  onClick={() => setOverridesOpen(true)}
                  className="text-sm font-normal text-[#3662da] hover:underline transition-colors"
                >
                  Some sites have chosen a custom goal. Learn more →
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 rounded-md text-sm font-medium text-brand-text border border-dashed border-brand-border hover:bg-brand-bg transition-colors">
                Cancel
              </button>
              <button className="px-4 py-2 rounded-md text-sm font-medium text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors">
                Save
              </button>
            </div>
          </div>
        </>
      )}

      {tab === 'school-year' && (
        <div className="px-6 py-12 text-center">
          <p className="text-sm text-brand-subtext">Coming soon in a future prototype iteration.</p>
        </div>
      )}

      {tab === 'blackout' && (
        <>
          <div className="bg-brand-bg px-6 py-4">
            <p className="text-sm font-semibold text-brand-text">Blackout periods</p>
            <p className="text-sm text-brand-subtext mt-0.5">
              Mark non-instructional days so they're excluded from engagement calculations.
            </p>
          </div>

          <div className="px-6">
            {periods.length === 0 ? (
              <p className="text-sm text-brand-subtext py-8 text-center">No blackout periods yet.</p>
            ) : (
              periods.map((p) => (
                <div key={p.id} className="flex items-center gap-3 py-3 border-b border-brand-border last:border-b-0">
                  {editingId === p.id ? (
                    <>
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="flex-1 h-9 text-sm border border-brand-border rounded-lg px-3 text-brand-text focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                      />
                      <div className="w-36">
                        <DatePicker value={editFrom} onChange={setEditFrom} placeholder="From" max={editTo || undefined} />
                      </div>
                      <div className="w-36">
                        <DatePicker value={editTo} onChange={setEditTo} placeholder="To" min={editFrom || undefined} />
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={saveEdit}
                          className="p-2 rounded-md text-dessa-teal hover:bg-brand-bg transition-colors"
                        >
                          <Check size={15} />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-2 rounded-md text-brand-subtext hover:bg-brand-bg transition-colors"
                        >
                          <X size={15} />
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="flex-1 text-sm font-medium text-brand-text">{p.name}</p>
                      <p className="text-sm text-brand-subtext w-52 text-right">{formatRange(p.from, p.to)}</p>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => startEdit(p)}
                          className="p-2 rounded-md text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => deletePeriod(p.id)}
                          className="p-2 rounded-md text-brand-subtext hover:text-red-600 hover:bg-brand-bg transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="flex items-center gap-3 px-6 py-4 border-t border-brand-border">
            {isAdding && (
              <>
                <input
                  type="text"
                  placeholder="Period name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  autoFocus
                  className="flex-1 h-9 text-sm border border-brand-border rounded-lg px-3 text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                />
                <div className="w-36">
                  <DatePicker value={newFrom} onChange={setNewFrom} placeholder="From" max={newTo || undefined} />
                </div>
                <div className="w-36">
                  <DatePicker value={newTo} onChange={setNewTo} placeholder="To" min={newFrom || undefined} />
                </div>
              </>
            )}
            <div className={`flex items-center gap-1 shrink-0 ${isAdding ? '' : 'ml-auto'}`}>
              {isAdding && (
                <button
                  onClick={cancelAdd}
                  className="h-9 px-4 rounded-md text-sm font-medium text-brand-text border border-dashed border-brand-border hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={isAdding ? saveNewPeriod : startAdd}
                disabled={isAdding && !canAdd}
                className="flex items-center gap-1.5 h-9 px-4 rounded-md text-sm font-medium text-white bg-dessa-teal hover:bg-dessa-teal/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {isAdding ? (
                  <>Save</>
                ) : (
                  <><Plus size={14} /> Add period</>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
    )}

    {/* Site Leader's own Weekly Goal control (the other half of AP-4933,
        previously not built at all — this whole card was just hidden
        instead). "Use program default" / "Customize for this site" mirrors
        the ticket's two states exactly; the day-picker only appears once
        Custom is selected. Single-site only (SITE_LEADER_SCHOOL) — multi-
        site switching is still an open question. */}
    {isSiteLeaderView && (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-brand-text mb-1">Curriculum Setup</h1>
        <p className="text-sm text-brand-subtext mb-5">{SITE_LEADER_SCHOOL.name}</p>

        <p className="text-sm font-semibold text-brand-text">Weekly goal</p>
        <p className="text-sm text-brand-subtext mt-0.5 mb-3">
          Days per week a user must access a lesson to be on track.
        </p>

        <div className="inline-flex rounded-md border border-brand-border overflow-hidden text-sm font-medium mb-4">
          <button
            type="button"
            onClick={useSiteLeaderDefault}
            className={`px-3 py-1.5 transition-colors ${
              !isSiteLeaderCustom ? 'bg-dessa-teal text-white' : 'text-brand-subtext hover:bg-brand-bg'
            }`}
          >
            Use program default
          </button>
          <button
            type="button"
            onClick={customizeSiteLeaderGoal}
            className={`px-3 py-1.5 border-l border-brand-border transition-colors ${
              isSiteLeaderCustom ? 'bg-dessa-teal text-white' : 'text-brand-subtext hover:bg-brand-bg'
            }`}
          >
            Customize for this site
          </button>
        </div>

        {isSiteLeaderCustom ? (
          <div className="mb-4">
            <GoalPicker value={siteLeaderOverride.weeklyGoal} onChange={setSiteLeaderGoal} />
          </div>
        ) : (
          <div className="rounded-lg border border-brand-border bg-brand-bg px-4 py-3 mb-4 inline-block">
            <p className="text-sm font-semibold text-brand-text">{goal} day{goal === 1 ? '' : 's'} per week</p>
            <p className="text-xs text-brand-subtext mt-0.5">Set by your program admin</p>
          </div>
        )}

        <p className="flex items-center gap-1.5 text-xs text-brand-subtext">
          <Info size={13} className="shrink-0" />
          Your program admin can see this choice.
        </p>
      </div>
    </div>
    )}

    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="p-6 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <h1 className="text-2xl font-semibold text-brand-text">Family Access</h1>
          <button
            onClick={() => setHelpOpen(true)}
            aria-label="About Family Access"
            className="text-brand-subtext hover:text-brand-text transition-colors"
          >
            <Info size={17} />
          </button>
        </div>
        <div className="flex items-center gap-5 border-b border-brand-border">
          {FAMILY_ACCESS_TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setFamilyAccessTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                familyAccessTab === t.key
                  ? 'text-brand-text border-dessa-teal'
                  : 'text-brand-subtext border-transparent hover:text-brand-text'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* familyAccessTab === 'url' && <FamilyAccessUrl /> */}
      {familyAccessTab === 'codes' && (
        <FamilyAccessCodes role={isSiteLeaderView ? 'site_leader' : 'program_admin'} />
      )}
    </div>
    </div>

    <SidePanel open={helpOpen} onClose={() => setHelpOpen(false)} title="About Family Access">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">What is Family Access?</h3>
          <p className="text-sm text-brand-subtext leading-relaxed">
            Family Access gives families a way to create their own account and connect it to your
            site, so they can complete supportive SEL activities at home with their student —
            without sharing a single login across your whole district.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">How families get access</h3>
          <ol className="flex flex-col gap-3">
            <li className="flex gap-2.5 text-sm text-brand-subtext leading-relaxed">
              <span className="font-semibold text-brand-text">1.</span>
              Share the registration link with a family.
            </li>
            <li className="flex gap-2.5 text-sm text-brand-subtext leading-relaxed">
              <span className="font-semibold text-brand-text">2.</span>
              They enter the code for their site to connect their account.
            </li>
            <li className="flex gap-2.5 text-sm text-brand-subtext leading-relaxed">
              <span className="font-semibold text-brand-text">3.</span>
              Once registered, they can access Family curriculum activities anytime.
            </li>
          </ol>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">Program Admin vs. Site Leader</h3>
          <p className="text-sm text-brand-subtext leading-relaxed">
            Program Admins see registration links for every site in the district. Site Leaders
            only see the link for their own site.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">Access expiration</h3>
          <p className="text-sm text-brand-subtext leading-relaxed">
            Family access follows your district's account — if it doesn't renew, Family logins
            provisioned under it lose access automatically.
          </p>
        </div>
      </div>
    </SidePanel>

    {/* Concept B — right-side drawer, compact inline controls (no expand
        step). Concept D reuses the exact same content in a centered modal
        instead — see below. */}
    <SidePanel
      open={overridesOpen && adminConcept === 'b'}
      onClose={closeOverridesPanel}
      title="Site overrides"
    >
      {renderOverridesCompactList()}
    </SidePanel>

    {/* Concept D (2026-08-31 redesign, refined again same day; status badge
        added 2026-09-01) — dense, Notion/Linear-inspired table. Always
        shows every site (no status filter); a small teal "Custom" badge
        sits next to the site name instead of a dedicated Status column
        (see the Site cell below) — kept off the Action column idea
        entirely, since a Default row is customized simply by opening its
        Weekly Goal pill and picking a value, and reverting a Custom row
        back to the default is bulk-only now (select its checkbox, use
        "Reset to default" in the bulk bar below), even for a single site.
        Uses modalSchools/pagedModalSchools/modalTotalPages (this concept's
        own derived list) rather than Concept C's filteredSchools/
        pagedSchools, though both still share the same overridesSearch/
        overridesPage state. Sized to 50vw/80vh (fixed, not max-*) per
        explicit request, rather than shrinking to fit its content like the
        old compact modal did. */}
    {adminConcept === 'd' && overridesOpen && (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-6"
        onClick={closeOverridesPanel}
      >
        <div
          className="bg-white rounded-2xl shadow-xl w-[50vw] h-[80vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-border shrink-0">
            <p className="text-base font-semibold text-brand-text">Weekly Goal by Site</p>
            <div className="flex items-center gap-4">
              <p className="text-xs text-brand-subtext">
                Weekly goal by site — program default is {goal} day{goal === 1 ? '' : 's'}/week.
              </p>
              <button
                type="button"
                onClick={closeOverridesPanel}
                aria-label="Close"
                className="text-brand-subtext hover:text-brand-text transition-colors shrink-0"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 px-6 py-3 border-b border-brand-border shrink-0">
            {selectedSchoolIds.size > 0 && (
              <SelectionCommandBar
                count={selectedSchoolIds.size}
                onSetGoal={bulkSetGoal}
                onReset={bulkStageReset}
              />
            )}
            <div className="relative w-64 shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
              <input
                type="text"
                value={overridesSearch}
                onChange={(e) => setOverridesSearch(e.target.value)}
                placeholder={`Search ${schools.length} sites`}
                className="w-full pl-8 pr-2 h-9 text-sm border border-brand-border rounded-md bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-brand-bg/80 z-10">
                <TableRow>
                  <TableHead className="w-10">
                    <div className="flex items-center justify-center h-full">
                      <input
                        type="checkbox"
                        checked={pagedModalSchools.length > 0 && pagedModalSchools.every((s) => selectedSchoolIds.has(s.id))}
                        onChange={toggleSelectAllPaged}
                        aria-label="Select all sites on this page"
                        className="accent-dessa-teal w-3.5 h-3.5 opacity-80"
                      />
                    </div>
                  </TableHead>
                  <TableHead className="normal-case pl-0">Site</TableHead>
                  <TableHead className="normal-case text-right">Weekly goal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedModalSchools.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-brand-subtext py-6">
                      No sites match your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  pagedModalSchools.map((school) => {
                    const override = overrides.find((o) => o.school.id === school.id)
                    const isCustom = !!override
                    const isPendingReset = pendingResets.has(school.id)
                    const isSelected = selectedSchoolIds.has(school.id)
                    return (
                      <TableRow
                        key={school.id}
                        onClick={() => toggleSchoolSelected(school.id)}
                        // A selected row needs its own hover:bg here — the
                        // shared TableRow's default hover:bg-brand-bg/60 has
                        // higher specificity (class + :hover beats a plain
                        // class), so without this override it visually masks
                        // the selected tint entirely while the mouse still
                        // sits on the row you just clicked.
                        className={`cursor-pointer ${isSelected ? 'bg-dessa-teal/[10%] hover:bg-dessa-teal/[16%]' : ''}`}
                      >
                        <TableCell className="py-2" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-center h-full">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSchoolSelected(school.id)}
                              aria-label={`Select ${school.name}`}
                              className="accent-dessa-teal w-3.5 h-3.5 opacity-80"
                            />
                          </div>
                        </TableCell>
                        <TableCell className="py-2 pl-0 text-[13px] font-medium">
                          <span className="inline-flex items-center gap-2">
                            {school.name}
                            {/* Status lives here instead of its own column
                                (see the block comment above) — only rendered
                                for Custom rows so the common Default case
                                stays quiet, and suppressed during a pending
                                reset since the muted goal pill already
                                communicates "reverting." */}
                            {isCustom && !isPendingReset && (
                              <span className="text-xs font-medium text-dessa-teal bg-dessa-tealLight border border-dessa-teal/[7%] rounded px-1 py-0.5 shrink-0">
                                Custom
                              </span>
                            )}
                          </span>
                        </TableCell>
                        <TableCell className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                          {isPendingReset ? (
                            // Previewing the reverted (default) value, but
                            // still a live dropdown, not a frozen tag —
                            // picking a value here cancels the pending
                            // reset and customizes the site to that value
                            // instead, same as picking one on a Default row.
                            <GoalColorDropdown
                              value={goal}
                              muted
                              onChange={(n) => {
                                togglePendingReset(school.id)
                                setOverrides((os) =>
                                  os.map((o) => (o.school.id === school.id ? { ...o, weeklyGoal: n } : o))
                                )
                              }}
                            />
                          ) : isCustom ? (
                            <GoalColorDropdown
                              value={override.weeklyGoal}
                              onChange={(n) =>
                                setOverrides((os) =>
                                  os.map((o) => (o.school.id === school.id ? { ...o, weeklyGoal: n } : o))
                                )
                              }
                            />
                          ) : (
                            // Default row — no override exists yet, so
                            // picking any value here is what customizes it
                            // (see the Action-column note above).
                            <GoalColorDropdown
                              value={goal}
                              muted
                              onChange={(n) => setOverrides((os) => [...os, { school, weeklyGoal: n }])}
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })
                )}
              </TableBody>
            </Table>
          </div>

          <div className="flex items-center justify-between gap-4 px-6 py-3 border-t border-brand-border shrink-0">
            <div className="flex items-center gap-4">
              {/* Same Pagination primitives + pageWindow helper as the
                  Resources page's results list (numbered pages, ellipsis
                  for gaps, teal active page) instead of a plain Previous/
                  Next + "Page X of Y" pair. */}
              {modalTotalPages > 1 && (
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => setOverridesPage((p) => Math.max(1, p - 1))}
                        disabled={overridesPage === 1}
                        className="w-8 h-8 p-0 justify-center rounded-lg text-dessa-teal"
                      >
                        {''}
                      </PaginationPrevious>
                    </PaginationItem>
                    {pageWindow(overridesPage, modalTotalPages).map((p, i) =>
                      p === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink isActive={p === overridesPage} onClick={() => setOverridesPage(p)} className="w-8 h-8 rounded-lg">
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setOverridesPage((p) => Math.min(modalTotalPages, p + 1))}
                        disabled={overridesPage === modalTotalPages}
                        className="w-8 h-8 p-0 justify-center rounded-lg text-dessa-teal"
                      >
                        {''}
                      </PaginationNext>
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <select
                  value={modalPageSize}
                  onChange={(e) => setModalPageSize(e.target.value === 'all' ? 'all' : Number(e.target.value))}
                  className="appearance-none pl-3 pr-8 h-9 text-sm border border-brand-border rounded-md bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                >
                  {MODAL_PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n === 'all' ? 'All' : n}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
              </div>
              <button
                type="button"
                onClick={closeOverridesPanel}
                className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  )
}
