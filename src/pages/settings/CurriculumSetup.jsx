import { useState, useEffect } from 'react'
import { useSearchParams, useOutletContext } from 'react-router-dom'
import * as Popover from '@radix-ui/react-popover'
import { Info, Plus, Pencil, Trash2, Check, X, ChevronDown, Search, RotateCcw, ArrowUp, ArrowDown, ArrowUpDown, MoreHorizontal } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import { toast } from 'sonner'
// import FamilyAccessUrl from './FamilyAccessUrl'
import FamilyAccessCodes from './FamilyAccessCodes'
import { SidePanel } from '../../components/ui/side-panel'
import { DatePicker } from '../../components/ui/date-picker'
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
// Concept C's old fixed page size, back when it had its own status-filtered
// table separate from Concept D's. Retired 2026-09-02 when C switched to
// D's table (see the block comment above GoalPicker) and started sharing
// MODAL_PAGE_SIZE_OPTIONS/modalPageSize below instead. Kept commented
// rather than deleted, same treatment as the rest of this file's retired
// concept code.
// const OVERRIDES_PAGE_SIZE = 8
const MODAL_PAGE_SIZE_OPTIONS = [5, 10, 25, 50]

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
function GoalPicker({ value, onChange, size = 'md', markValue }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'
  return (
    <div className="flex gap-1.5">
      {GOAL_OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className={`relative ${dim} rounded-md border font-medium transition-colors ${
            value === n
              ? 'bg-dessa-teal text-white border-dessa-teal'
              : 'bg-white text-brand-text border-brand-border hover:bg-brand-bg'
          }`}
        >
          {n}
          {markValue === n && (
            <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center justify-center rounded-full whitespace-nowrap tracking-[0.07em] uppercase font-medium text-[9px] leading-none px-[5.5px] py-[3px] border border-dessa-teal/25 shadow bg-white text-dessa-teal pointer-events-none">
              Default
            </span>
          )}
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

// Click-to-sort column header for Concepts C/D's shared table (2026-09-02)
// — same ArrowUp/ArrowDown/ArrowUpDown convention as Family Access Codes'
// SiteSortHeader, generalized to take a label since this table has two
// sortable columns (Site, Weekly goal) instead of just one.
function SortableHeader({ label, active, dir, onClick, align = 'left' }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center gap-1 text-xs font-semibold transition-colors group ${
        align === 'right' ? 'flex-row-reverse' : ''
      } ${active ? 'text-brand-text' : 'text-brand-subtext hover:text-brand-text'}`}
    >
      {label}
      {active ? (
        dir === 'asc' ? (
          <ArrowUp size={13} className="text-dessa-teal" />
        ) : (
          <ArrowDown size={13} className="text-dessa-teal" />
        )
      ) : (
        <ArrowUpDown size={13} className="opacity-40 group-hover:opacity-70" />
      )}
    </button>
  )
}

// Value pill for Concept D's dense table (2026-08-31, simplified same day —
// the per-value Notion-style colors read as "off" rather than helpful, so
// every pill is plain light-gray with a subtle border for now regardless of
// value or Default/Custom status; real color-coding, if any, is a later
// pass. Doesn't take a `muted` prop — GoalColorDropdown used to have one
// (suppressing its list's checkmark on Default rows) but that's retired as
// of 2026-09-03, see the comment above GoalColorDropdown.
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

// Click-to-edit cell shared by Concepts C and D's tables — closed state is
// the GoalPill trigger (Notion's reference showed a removable chip +
// "create one" search, but our range is a fixed, always-populated 1-5, so
// that's simplified to a plain list of the other 4 values, with no way to
// clear it entirely — clearing an override back to the program default is a
// bulk-only action, see bulkStageReset). The open list itself is plain text
// rows (2026-09-02 — GoalPill read as odd floating chips once stacked in a
// menu; a standard select-style list reads more familiar), not pills. z-[60]
// on the content since it needs to render above the modal's own z-50
// overlay (Concept D only — harmless no-op for Concept C, which has no
// overlay to sit above). Styled to match StatusFilterDropdown's popover
// (2026-09-03 — w-40/text-xs, was w-44/text-sm). The checkmark/highlight
// always tracks `value`, including on Default rows — an earlier `muted`
// flag used to suppress it there, but with the program default itself
// sitting at 3 days, that made most rows in the table look like nothing was
// selected, which read as a bug rather than an "inherited vs. chosen"
// distinction.
function GoalColorDropdown({ value, onChange }) {
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
          className="z-[60] w-40 bg-white border border-brand-border rounded-lg shadow-lg outline-none overflow-hidden py-1"
        >
          {GOAL_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => { onChange(n); setOpen(false) }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-xs text-left font-medium text-brand-text transition-colors ${
                value === n ? 'bg-brand-bg' : 'hover:bg-brand-bg'
              }`}
            >
              {n} {n === 1 ? 'Day' : 'Days'}
              {value === n && <Check size={13} className="text-dessa-teal shrink-0" />}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// Selection command bar (2026-09-01, replacing the dropdown-based Actions
// button and, before that, the layout-shifting "N selected" bar) — rebuilt
// this same day to actually match Notion's structure (see reference
// screenshot) rather than just borrow its color: Notion's segments are
// flush full-height buttons stacked edge-to-edge with hairline dividers
// between every one of them, not chips floating inside a padded box. So
// here the outer container carries zero padding — each segment (including
// the clear-selection button) owns its own h-full + px-3 and hover state.
// Dividers are a `border-r` on every segment but the last, not a separate
// element — that's automatically full-height (it's part of the button's
// own box) and is how a segmented toolbar like this is normally built,
// rather than interleaving standalone divider spans between children.
// `overflow-hidden` on the container clips the first/last segment's
// corners to the shared rounded-md shape. Renders nothing at all with zero
// rows selected (no persistent "Actions" affordance to keep around) and
// appears in that slot, left of search, once ≥1 row is checked.
// 2026-09-02 — per-value quick-set buttons (1 Day...5 Days) commented out;
// Reset to default is now the only bulk action, so it gets an icon + label
// instead of icon-only. onSetGoal is kept as a prop (unused internally for
// now) so the day buttons can come back without re-wiring callers.
function SelectionCommandBar({ count, onSetGoal, onReset, onClear }) {
  return (
    <div className="flex items-center h-8 rounded-md bg-brand-bg/80 overflow-hidden shrink-0">
      <button
        type="button"
        onClick={onClear}
        className="h-full px-3 flex items-center border-r border-brand-border text-xs font-semibold text-dessa-teal hover:bg-dessa-teal/10 transition-colors whitespace-nowrap"
      >
        Deselect all
      </button>
      {/* {GOAL_OPTIONS.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onSetGoal(n)}
          className="h-full px-3 flex items-center border-r border-brand-border text-xs font-medium text-brand-text hover:bg-dessa-teal/10 transition-colors whitespace-nowrap"
          aria-label={`Set selected sites to ${n} days`}
        >
          {n} {n === 1 ? 'Day' : 'Days'}
        </button>
      ))} */}
      <button
        type="button"
        onClick={onReset}
        className="h-full px-3 flex items-center gap-1.5 text-xs font-medium text-brand-text hover:bg-dessa-teal/10 transition-colors whitespace-nowrap"
      >
        <RotateCcw size={15} />
        Reset to default
      </button>
    </div>
  )
}

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'All Sites' },
  { value: 'custom', label: 'Custom' },
  { value: 'default', label: 'Default' },
]

// Status filter chip (2026-09-02, replacing the All Sites/Custom Tabs) —
// modeled after the "Role ▾"/"Country ▾" filter chips in the reference
// screenshot rather than a segmented pill control: this is a single-select
// *filter* on the table, not a view switcher, so a bordered dropdown chip
// (same trigger/list treatment as GoalColorDropdown — plain text rows,
// checkmark on the active one) reads more appropriately than Tabs did.
// Re-adds the "Default only" option dropped when the old status <select>
// was retired, since a 3-item dropdown doesn't need a submenu the way a
// kebab-menu drilldown would have.
function StatusFilterDropdown({ value, onChange }) {
  const [open, setOpen] = useState(false)
  const activeLabel = STATUS_FILTER_OPTIONS.find((o) => o.value === value)?.label ?? 'All Sites'
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="h-8 px-2.5 inline-flex items-center gap-1.5 rounded-md border border-brand-border bg-white text-xs font-medium text-brand-text hover:bg-brand-bg transition-colors"
        >
          {activeLabel}
          <ChevronDown size={13} className="text-brand-subtext" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="z-[60] w-40 bg-white border border-brand-border rounded-lg shadow-lg outline-none overflow-hidden py-1"
        >
          {STATUS_FILTER_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => { onChange(o.value); setOpen(false) }}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 text-xs text-left font-medium text-brand-text transition-colors ${
                value === o.value ? 'bg-brand-bg' : 'hover:bg-brand-bg'
              }`}
            >
              {o.label}
              {value === o.value && <Check size={13} className="text-dessa-teal shrink-0" />}
            </button>
          ))}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// "•••" overflow menu (2026-09-02) — houses the one bulk action that isn't
// tied to a row selection (Reset all to default), keeping it out of the
// primary toolbar row entirely rather than pairing it with the status
// filter, since a district-wide reset is a much higher blast-radius action
// than a view filter and shouldn't sit at the same visual weight.
function OverridesMoreMenu({ onResetAll }) {
  const [open, setOpen] = useState(false)
  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label="More actions"
          className="h-8 w-8 flex items-center justify-center rounded-md border border-brand-border bg-white text-brand-subtext hover:bg-brand-bg hover:text-brand-text transition-colors shrink-0"
        >
          <MoreHorizontal size={16} />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={6}
          className="z-[60] w-52 bg-white border border-brand-border rounded-lg shadow-lg outline-none overflow-hidden py-1"
        >
          <button
            type="button"
            onClick={() => { onResetAll(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left font-medium text-brand-text hover:bg-brand-bg transition-colors"
          >
            <RotateCcw size={14} className="text-brand-subtext" />
            Reset all to default
          </button>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// Admin-summary concept switcher (2026-08-28) — four different ways to show
// Program Admins which sites have customized their weekly goal, driven by
// the Nav dropdown's `?adminConcept=` param (same pattern as the retired
// Resources decor switcher). A (lightweight accordion table) and B (side
// drawer with compact inline controls) were frozen 2026-09-02 — their
// render blocks are commented out below, kept only as evidence of process.
// The live comparison is now just C vs. D: C is a full report-style table
// over every site, always inline in the page; D is the same table in a
// centered modal + overlay instead. As of 2026-09-02 they share the exact
// same table (checkbox multi-select + bulk command bar, inline "Custom"
// badge instead of a Status column, click-to-edit GoalColorDropdown cell,
// numbered Pagination + page-size select) — the only remaining difference
// is presentation (inline vs. modal), not the table itself.

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
  const adminConcept = searchParams.get('adminConcept') || 'c'

  const [tab, setTab] = useState('engagement')
  const [goal, setGoal] = useState(3)
  const [familyAccessTab, setFamilyAccessTab] = useState('codes')
  // Role toggle moved to the bottom of the Settings sidebar (SettingsLayout)
  // 2026-09-03 — was a Tabs control in the page flow here. Read-only from
  // this side; only SettingsLayout's toggle can change it, passed down via
  // <Outlet context={...}> since it's shared page chrome, not per-page
  // state, even though nothing outside Curriculum Setup honors it yet.
  const { isSiteLeaderView } = useOutletContext()
  const [helpOpen, setHelpOpen] = useState(false)
  const [weeklyGoalHelpOpen, setWeeklyGoalHelpOpen] = useState(false)

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
  // Shared by Concepts C and D as of 2026-09-02 — all/custom/default value
  // driving StatusFilterDropdown, a second attempt at replacing the old
  // status <select> retired earlier this session. The first attempt (a
  // segmented Tabs control, all/custom only) is retired in turn — a
  // single-select filter chip reads more appropriately than a view-switcher
  // style control, and this version restores the "Default only" option.
  const [overridesView, setOverridesView] = useState('all')
  // Shared by Concepts C and D as of 2026-09-02 — adjustable page size
  // (matching the Resources page's own results-list pagination), unlike
  // C's old fixed OVERRIDES_PAGE_SIZE. Defaults to 10 per the design-system
  // reference (2026-09-02).
  const [modalPageSize, setModalPageSize] = useState(10)
  // Shared by Concepts C and D as of 2026-09-02 — click-to-sort on the Site
  // and Weekly goal column headers (see SortableHeader/toggleOverridesSort).
  // Two-state per column (asc/desc), not three — picking a new column
  // always starts it at asc, same as Family Access Codes' single-column
  // SiteSortHeader, just generalized to track which column is active.
  const [overridesSortKey, setOverridesSortKey] = useState('name')
  const [overridesSortDir, setOverridesSortDir] = useState('asc')
  // Concept C's status filter was a <select> (all/custom/default),
  // narrowing which rows show at all. Retired 2026-09-02 when C switched to
  // Concept D's table — D always shows every site with an inline "Custom"
  // badge instead of a Status column/filter, and C now matches it (see the
  // block comment above GoalPicker). Commented out, along with
  // filteredSchools/pagedSchools/overridesTotalPages further down, since
  // nothing reads it anymore.
  // const [overridesStatusFilter, setOverridesStatusFilter] = useState('all')
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

  // Clicking the active column's header flips its direction; clicking the
  // other column switches to it starting at asc.
  function toggleOverridesSort(key) {
    if (overridesSortKey === key) {
      setOverridesSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setOverridesSortKey(key)
      setOverridesSortDir('asc')
    }
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

  // Concept D's bulk Reset only *stages* the removal (dimmed row + a
  // per-row Undo) and commits when the modal closes, via closeOverridesPanel
  // below. Concept C has no modal/close event to commit on, so the same
  // staging there would silently never remove the override — fixed
  // 2026-09-03 by having Concept C commit immediately instead of staging.
  function bulkStageReset() {
    if (adminConcept === 'c') {
      setOverrides((os) => os.filter((o) => !selectedSchoolIds.has(o.school.id)))
      setSelectedSchoolIds(new Set())
      return
    }
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

  // Concepts C/D's "•••" menu — clears every customization district-wide,
  // not just the selected rows (see OverridesMoreMenu). Immediate, not
  // staged like the per-row/bulk-selection resets, since it isn't scoped to
  // a modal's close-to-commit flow.
  function resetAllOverrides() {
    setOverrides([])
    setSelectedSchoolIds(new Set())
    toast.success('All sites reset to the program default')
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

  // Picking a day directly customizes this site for that day, no separate
  // "customize" step first. Picking the day that matches the program
  // default just reverts to following the default instead of leaving a
  // redundant override sitting at the same value.
  function setSiteLeaderGoal(day) {
    if (day === goal) {
      useSiteLeaderDefault()
    } else if (isSiteLeaderCustom) {
      setOverrides((os) => os.map((o) => (o.school.id === SITE_LEADER_SCHOOL.id ? { ...o, weeklyGoal: day } : o)))
    } else {
      setOverrides((os) => [...os, { school: SITE_LEADER_SCHOOL, weeklyGoal: day }])
    }
  }

  // `schools` (familyAccessData.js) is generated in place/suffix/type
  // cycling order, not alphabetically, so both concepts' lists below sort
  // explicitly.
  const overridesSearchQuery = overridesSearch.trim().toLowerCase()
  // Concept C's own status-filtered roster — retired 2026-09-02 alongside
  // overridesStatusFilter above; C now reuses modalSchools/pagedModalSchools
  // below (Concept D's derived lists) instead, since both concepts show the
  // same search-only, no-status-filter roster now.
  // const filteredSchools = schools
  //   .filter((s) => {
  //     const isCustom = overrides.some((o) => o.school.id === s.id)
  //     const matchesSearch = !overridesSearchQuery || s.name.toLowerCase().includes(overridesSearchQuery)
  //     const matchesStatus =
  //       overridesStatusFilter === 'all' || (overridesStatusFilter === 'custom' ? isCustom : !isCustom)
  //     return matchesSearch && matchesStatus
  //   })
  //   .sort((a, b) => a.name.localeCompare(b.name))

  // Shared by Concepts C and D as of 2026-09-02 — filtered by the
  // StatusFilterDropdown's all/custom/default value, search-only otherwise,
  // click-to-sort on Site or Weekly goal (see overridesSortKey/
  // toggleOverridesSort). A site with no override sorts by the program
  // default goal, same value the row itself displays.
  const modalSchools = schools
    .filter((s) => !overridesSearchQuery || s.name.toLowerCase().includes(overridesSearchQuery))
    .filter((s) => {
      if (overridesView === 'all') return true
      const isCustom = overrides.some((o) => o.school.id === s.id)
      return overridesView === 'custom' ? isCustom : !isCustom
    })
    .sort((a, b) => {
      if (overridesSortKey === 'goal') {
        const aGoal = overrides.find((o) => o.school.id === a.id)?.weeklyGoal ?? goal
        const bGoal = overrides.find((o) => o.school.id === b.id)?.weeklyGoal ?? goal
        return overridesSortDir === 'asc' ? aGoal - bGoal : bGoal - aGoal
      }
      return overridesSortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name)
    })

  // Reset to page 1 when the search/filter/sort changes — adjusted during
  // render (same pattern as the Resources page's results list) rather than
  // in an effect, so it takes effect in the same commit as the paged lists
  // below.
  const overridesFilterKey = JSON.stringify([overridesSearch, overridesView, modalPageSize, overridesSortKey, overridesSortDir])
  const [prevOverridesFilterKey, setPrevOverridesFilterKey] = useState(overridesFilterKey)
  if (overridesFilterKey !== prevOverridesFilterKey) {
    setPrevOverridesFilterKey(overridesFilterKey)
    setOverridesPage(1)
  }

  // Concept C's own pagination over filteredSchools — retired 2026-09-02
  // alongside filteredSchools/OVERRIDES_PAGE_SIZE above; C now uses
  // modalTotalPages/pagedModalSchools below instead.
  // const overridesTotalPages = Math.max(1, Math.ceil(filteredSchools.length / OVERRIDES_PAGE_SIZE))
  // const pagedSchools = filteredSchools.slice(
  //   (overridesPage - 1) * OVERRIDES_PAGE_SIZE,
  //   overridesPage * OVERRIDES_PAGE_SIZE
  // )

  const modalTotalPages = Math.max(1, Math.ceil(modalSchools.length / modalPageSize))
  const pagedModalSchools = modalSchools.slice(
    (overridesPage - 1) * modalPageSize,
    overridesPage * modalPageSize
  )

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
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-semibold text-brand-text">Weekly goal</p>
              <button
                onClick={() => setWeeklyGoalHelpOpen(true)}
                aria-label="About Weekly Goal"
                className="text-brand-subtext hover:text-brand-text transition-colors"
              >
                <Info size={14} />
              </button>
            </div>
            <p className="text-sm text-brand-subtext mt-0.5 mb-3">
              Days per week a user must access a lesson to be on track.
            </p>
            <GoalPicker value={goal} onChange={setGoal} />
          </div>

          {/* Concept A — lightweight table embedded directly in the page,
              always visible (no trigger/overlay needed), with an accordion-
              expand-to-edit interaction. Frozen 2026-09-02 (see the block
              comment above GoalPicker) — commented out rather than deleted,
              kept only as evidence of process.
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
          */}

          {/* Concept C — full-roster report: every site, not just the
              overridden ones, so it scales to browsing/auditing the whole
              district, not just spotting exceptions. As of 2026-09-02 this
              is Concept D's table (see the block comment above GoalPicker)
              rendered inline in the page instead of inside a modal — same
              checkbox multi-select + bulk command bar, inline "Custom"
              badge, click-to-edit GoalColorDropdown cell, and numbered
              Pagination + page-size select. The status-filter dropdown,
              GoalPicker cell, and Previous/Next pagination this replaced
              are commented out above/below (search this file for
              "retired 2026-09-02") rather than deleted. */}
          {adminConcept === 'c' && (
            <div className="px-6 pb-6">
              <div className="border-t border-brand-border pt-5">
                {/* Heading/description commented out for the moment while the
                    copy/placement is reconsidered — the toolbar below now
                    sits left-aligned where that text used to be, instead of
                    being pinned right against an empty counterpart div.
                <p className="text-sm font-semibold text-brand-text mb-1">Site overrides</p>
                <p className="text-sm text-brand-subtext">
                  Customize the weekly goal for individual sites, or leave them on the program default.
                </p>
                */}
                <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
                  <div>
                    {selectedSchoolIds.size > 0 ? (
                      <SelectionCommandBar
                        count={selectedSchoolIds.size}
                        onSetGoal={bulkSetGoal}
                        onReset={bulkStageReset}
                        onClear={() => setSelectedSchoolIds(new Set())}
                      />
                    ) : (
                      <p className="text-sm font-semibold text-brand-text">Your Sites</p>
                    )}
                  </div>
                  <div className="flex items-center flex-wrap gap-3">
                    <StatusFilterDropdown value={overridesView} onChange={setOverridesView} />
                    <div className="relative flex-1 min-w-[140px] max-w-xs">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
                      <input
                        type="text"
                        value={overridesSearch}
                        onChange={(e) => setOverridesSearch(e.target.value)}
                        placeholder={`Search ${schools.length} sites`}
                        className="w-full pl-8 pr-2 h-8 text-xs border border-brand-border rounded-md bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                      />
                    </div>
                    <OverridesMoreMenu onResetAll={resetAllOverrides} />
                  </div>
                </div>

                <div className="rounded-lg border border-brand-border overflow-hidden">
                  <Table>
                    <TableHeader className="bg-brand-bg/60">
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
                        <TableHead className="normal-case pl-0">
                          <SortableHeader
                            label="Site"
                            active={overridesSortKey === 'name'}
                            dir={overridesSortDir}
                            onClick={() => toggleOverridesSort('name')}
                          />
                        </TableHead>
                        <TableHead className="normal-case text-right">
                          <SortableHeader
                            label="Weekly goal"
                            align="right"
                            active={overridesSortKey === 'goal'}
                            dir={overridesSortDir}
                            onClick={() => toggleOverridesSort('goal')}
                          />
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pagedModalSchools.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-brand-subtext py-6">
                            {overridesView === 'custom'
                              ? 'No sites have customized their goal yet.'
                              : 'No sites match your search.'}
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
                              className={`cursor-pointer duration-300 ${isSelected ? 'bg-dessa-teal/[8%] hover:bg-dessa-teal/10' : ''}`}
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
                                  {isCustom && !isPendingReset && (
                                    <span className="text-xs font-medium text-dessa-teal bg-dessa-tealLight border border-dessa-teal/[7%] rounded px-1 py-0.5 shrink-0">
                                      Custom
                                    </span>
                                  )}
                                </span>
                              </TableCell>
                              {/* When this row is part of the current selection,
                                  picking a value applies to every selected
                                  site (via bulkSetGoal) instead of just this
                                  one — same as using the bulk command bar,
                                  just triggered from any selected row's own
                                  dropdown. Unselected rows keep the existing
                                  single-row behavior below. */}
                              <TableCell className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                                {isPendingReset ? (
                                  <GoalColorDropdown
                                    value={goal}
                                    onChange={(n) => {
                                      if (isSelected) {
                                        bulkSetGoal(n)
                                        return
                                      }
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
                                      isSelected
                                        ? bulkSetGoal(n)
                                        : setOverrides((os) =>
                                            os.map((o) => (o.school.id === school.id ? { ...o, weeklyGoal: n } : o))
                                          )
                                    }
                                  />
                                ) : (
                                  <GoalColorDropdown
                                    value={goal}
                                    onChange={(n) =>
                                      isSelected
                                        ? bulkSetGoal(n)
                                        : setOverrides((os) => [...os, { school, weeklyGoal: n }])
                                    }
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

                <div className="flex items-center justify-between gap-4 mt-3">
                  <div className="flex items-center gap-4">
                    {modalTotalPages > 1 && (
                      <Pagination>
                        <PaginationContent>
                          <PaginationItem>
                            <PaginationPrevious
                              onClick={() => setOverridesPage((p) => Math.max(1, p - 1))}
                              disabled={overridesPage === 1}
                            />
                          </PaginationItem>
                          {pageWindow(overridesPage, modalTotalPages).map((p, i) =>
                            p === 'ellipsis' ? (
                              <PaginationItem key={`ellipsis-${i}`}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            ) : (
                              <PaginationItem key={p}>
                                <PaginationLink isActive={p === overridesPage} onClick={() => setOverridesPage(p)}>
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            )
                          )}
                          <PaginationItem>
                            <PaginationNext
                              onClick={() => setOverridesPage((p) => Math.min(modalTotalPages, p + 1))}
                              disabled={overridesPage === modalTotalPages}
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    )}
                  </div>
                  <div className="relative shrink-0">
                    <select
                      value={modalPageSize}
                      onChange={(e) => setModalPageSize(Number(e.target.value))}
                      className="appearance-none pl-3 pr-8 h-9 text-sm border border-brand-border rounded-md bg-white text-brand-text focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                    >
                      {MODAL_PAGE_SIZE_OPTIONS.map((n) => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Concept C's inline table already sits directly above this bar
              with its own bulk actions, and its "Learn more" half (below)
              never rendered for Concept C anyway (b/d only) — so for C this
              would just be an empty bordered strip. Skipped entirely rather
              than only hiding the Cancel/Save buttons and leaving that dead
              space. */}
          {adminConcept !== 'c' && (
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
          )}
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
        instead). No toggle: the picker itself is always live, so picking a
        day customizes this site immediately, and picking the program
        default's own day reverts to following it (see setSiteLeaderGoal).
        A quiet dot marks the default's day even once a different one is
        picked, so the baseline stays visible without a separate readout.
        Single-site only (SITE_LEADER_SCHOOL) — multi-site switching is
        still an open question. */}
    {isSiteLeaderView && (
    <div className="bg-white rounded-xl border border-brand-border overflow-hidden">
      <div className="p-6">
        <h1 className="text-2xl font-semibold text-brand-text mb-1">Curriculum Setup</h1>
        <p className="text-sm text-brand-subtext mb-5">{SITE_LEADER_SCHOOL.name}</p>

        <p className="text-sm font-semibold text-brand-text">Weekly goal</p>
        <p className="text-sm text-brand-subtext mt-0.5 mb-3">
          Days per week a user must access a lesson to be on track.
        </p>

        <div className="mt-2.5 mb-4">
          <GoalPicker
            value={isSiteLeaderCustom ? siteLeaderOverride.weeklyGoal : goal}
            onChange={setSiteLeaderGoal}
            markValue={goal}
          />
        </div>

        <p className="flex items-center gap-1.5 text-xs text-brand-subtext">
          <Info size={13} className="shrink-0" />
          Your program admin sets the default and can see if you customize it for your site.
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

    <SidePanel open={weeklyGoalHelpOpen} onClose={() => setWeeklyGoalHelpOpen(false)} title="About Weekly Goal">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">What this sets</h3>
          <p className="text-sm text-brand-subtext leading-relaxed">
            This is your program's default weekly goal, the number of days per week a user needs
            to access a lesson to stay on track. It applies across every site in your district
            unless a site customizes its own.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">Site-level overrides</h3>
          <p className="text-sm text-brand-subtext leading-relaxed">
            Any site can set its own weekly goal instead of following the program default. This can
            be done here, using Site overrides below, or by the Site Leader themselves from their
            own Curriculum Setup page.
          </p>
        </div>
      </div>
    </SidePanel>

    <SidePanel open={helpOpen} onClose={() => setHelpOpen(false)} title="About Family Access">
      <div className="flex flex-col gap-6">
        <div>
          <h3 className="text-sm font-semibold text-brand-text mb-1.5">What is Family Access?</h3>
          <p className="text-sm text-brand-subtext leading-relaxed">
            Family Access gives families a way to create their own account and connect it to your
            site, so they can complete supportive SEL activities at home with their student,
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
            Family access follows your district's account. If it doesn't renew, Family logins
            provisioned under it lose access automatically.
          </p>
        </div>
      </div>
    </SidePanel>

    {/* Concept B — right-side drawer, compact inline controls (no expand
        step). Frozen 2026-09-02 (see the block comment above GoalPicker) —
        commented out rather than deleted, kept only as evidence of process.
    <SidePanel
      open={overridesOpen && adminConcept === 'b'}
      onClose={closeOverridesPanel}
      title="Site overrides"
    >
      {renderOverridesCompactList()}
    </SidePanel>
    */}

    {/* Concept D (2026-08-31 redesign, refined again same day; status badge
        added 2026-09-01) — dense, Notion/Linear-inspired table. Always
        shows every site (no status filter); a small teal "Custom" badge
        sits next to the site name instead of a dedicated Status column
        (see the Site cell below) — kept off the Action column idea
        entirely, since a Default row is customized simply by opening its
        Weekly Goal pill and picking a value, and reverting a Custom row
        back to the default is bulk-only now (select its checkbox, use
        "Reset to default" in the bulk bar below), even for a single site.
        Uses modalSchools/pagedModalSchools/modalTotalPages — shared with
        Concept C as of 2026-09-02, since C now renders this same table
        inline instead of in a modal (see the block comment above
        GoalPicker). Sized to 50vw/80vh (fixed, not max-*) per explicit
        request, rather than shrinking to fit its content like the old
        compact modal did. */}
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
                Weekly goal by site. Program default is {goal} day{goal === 1 ? '' : 's'} per week.
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

          <div className="flex items-center justify-between flex-wrap gap-3 px-4 py-3 border-b border-brand-border shrink-0">
            <div>
              {selectedSchoolIds.size > 0 && (
                <SelectionCommandBar
                  count={selectedSchoolIds.size}
                  onSetGoal={bulkSetGoal}
                  onReset={bulkStageReset}
                  onClear={() => setSelectedSchoolIds(new Set())}
                />
              )}
            </div>
            <div className="flex items-center flex-wrap gap-3">
              <StatusFilterDropdown value={overridesView} onChange={setOverridesView} />
              {/* flex-1 + a lower min-width (was a fixed w-64 shrink-0) so
                  this can compress once the selection command bar's own
                  fixed-width segments are also competing for space — without
                  it, nothing in this row could shrink and the bar would
                  overflow past the modal's edge instead of the two sharing
                  the available width. flex-wrap above is the fallback for
                  widths too narrow even for that. */}
              <div className="relative flex-1 min-w-[140px] max-w-64">
                <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
                <input
                  type="text"
                  value={overridesSearch}
                  onChange={(e) => setOverridesSearch(e.target.value)}
                  placeholder={`Search ${schools.length} sites`}
                  className="w-full pl-8 pr-2 h-8 text-xs border border-brand-border rounded-md bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
                />
              </div>
              <OverridesMoreMenu onResetAll={resetAllOverrides} />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-brand-bg/60 z-10">
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
                      {overridesView === 'custom'
                        ? 'No sites have customized their goal yet.'
                        : 'No sites match your search.'}
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
                        className={`cursor-pointer duration-300 ${isSelected ? 'bg-dessa-teal/[8%] hover:bg-dessa-teal/10' : ''}`}
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
                        {/* When this row is part of the current selection,
                            picking a value applies to every selected site
                            (via bulkSetGoal) instead of just this one —
                            same as using the bulk command bar, just
                            triggered from any selected row's own dropdown.
                            Unselected rows keep the existing single-row
                            behavior below. */}
                        <TableCell className="py-2 text-right" onClick={(e) => e.stopPropagation()}>
                          {isPendingReset ? (
                            // Previewing the reverted (default) value, but
                            // still a live dropdown, not a frozen tag —
                            // picking a value here cancels the pending
                            // reset and customizes the site to that value
                            // instead, same as picking one on a Default row.
                            <GoalColorDropdown
                              value={goal}
                              onChange={(n) => {
                                if (isSelected) {
                                  bulkSetGoal(n)
                                  return
                                }
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
                                isSelected
                                  ? bulkSetGoal(n)
                                  : setOverrides((os) =>
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
                              onChange={(n) =>
                                isSelected
                                  ? bulkSetGoal(n)
                                  : setOverrides((os) => [...os, { school, weeklyGoal: n }])
                              }
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
                      />
                    </PaginationItem>
                    {pageWindow(overridesPage, modalTotalPages).map((p, i) =>
                      p === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${i}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={p}>
                          <PaginationLink isActive={p === overridesPage} onClick={() => setOverridesPage(p)}>
                            {p}
                          </PaginationLink>
                        </PaginationItem>
                      )
                    )}
                    <PaginationItem>
                      <PaginationNext
                        onClick={() => setOverridesPage((p) => Math.min(modalTotalPages, p + 1))}
                        disabled={overridesPage === modalTotalPages}
                      />
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
