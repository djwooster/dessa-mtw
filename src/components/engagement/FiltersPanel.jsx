import { useId, useState } from 'react'
import { ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react'
import * as Popover from '@radix-ui/react-popover'
import { DatePicker } from '../ui/date-picker'
import { Checkbox } from '../ui/checkbox'

// Filters panel for the Engagement report (2026-10-09), matching the production
// Daily Curriculum Engagement paradigm: a collapsible panel above the report with
// Site, User Role, Start Date and End Date, and the report only updates on Apply.
// Built from our own tokens and the shared DatePicker, not production's styling.
// A Site Leader has one site, so `showSite` is off for them.
// Sentence case labels and 36px controls (2026-10-26), per the one design language.
const LABEL = 'text-xs font-medium text-brand-subtext'
const CONTROL = 'h-9 text-sm rounded-md'

export function Select({ label, value, onChange, children, className = '', disabled = false }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className={LABEL}>{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          disabled={disabled}
          className="appearance-none w-full h-9 pl-3 pr-8 text-sm rounded-md border border-brand-border bg-white text-brand-text hover:border-dessa-teal/50 focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-brand-bg disabled:hover:border-brand-border"
        >
          {children}
        </select>
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" aria-hidden="true" />
      </span>
    </label>
  )
}

// Multi-select with a checkbox per option (2026-10-15). An empty list means all; the trigger
// shows "All", the one name, or a count.
function MultiSelect({ label, value, onChange, options, allLabel = 'All', noun = 'selected', className = '', disabled = false }) {
  const summary = value.length === 0 ? allLabel : value.length === 1 ? options.find(o => o.value === value[0])?.label : `${value.length} ${noun}`
  const toggle = v => onChange(value.includes(v) ? value.filter(x => x !== v) : [...value, v])
  const labelId = useId()
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <span id={labelId} className={LABEL}>{label}</span>
      <Popover.Root>
        <Popover.Trigger asChild>
          <button
            type="button"
            disabled={disabled}
            aria-labelledby={labelId}
            aria-describedby={`${labelId}-value`}
            className="relative w-full h-9 pl-3 pr-8 text-left text-sm rounded-md border border-brand-border bg-white text-brand-text hover:border-dessa-teal/50 focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal truncate disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-brand-bg disabled:hover:border-brand-border"
          >
            <span id={`${labelId}-value`}>{summary}</span>
            <ChevronDown size={16} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext" aria-hidden="true" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start" sideOffset={4}
            className="z-50 w-[var(--radix-popover-trigger-width)] min-w-56 max-h-72 overflow-y-auto bg-white border border-brand-border rounded-lg shadow-lg outline-none p-1"
          >
            <label className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-brand-text hover:bg-brand-bg cursor-pointer border-b border-brand-border rounded-b-none mb-1">
              <Checkbox checked={value.length === 0} onChange={() => onChange([])} />
              {allLabel}
            </label>
            {options.map(o => (
              <label key={o.value} className="flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm text-brand-text hover:bg-brand-bg cursor-pointer">
                <Checkbox checked={value.includes(o.value)} onChange={() => toggle(o.value)} />
                <span className="min-w-0 truncate">{o.label}</span>
              </label>
            ))}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

// `showDates` off (2026-10-16, Year to date page) drops the date fields for views with a fixed period.
// `action` (2026-10-16) sits at the right of the Filters title row, for a page's 3-dot menu.
// `disabled` (2026-10-19, End of year preview) shows the values read only; the action stays usable.
export default function FiltersPanel({ draft, onChange, onApply, onReset, sites, roles, showSite = true, showRole = true, extraFields = null, minDate, maxDate, weekMode = null, showDates = true, action = null, disabled = false }) {
  const [open, setOpen] = useState(true)
  const uid = useId()
  const set = patch => onChange({ ...draft, ...patch })
  // weekMode (2026-10-15, Engagement B) swaps Start and End date for a week cycler: { label, canPrev, canNext, onPrev, onNext, isLatest, onLatest }.
  const valid = weekMode || !showDates ? true : !!draft.start && !!draft.end && draft.start <= draft.end

  return (
    <section aria-label="Filters" className="rounded-lg border border-brand-border bg-white p-4 mb-6">
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          aria-expanded={open}
          className="flex items-center gap-1.5 text-base font-semibold text-brand-text"
        >
          Filters
          <ChevronDown size={16} className={`text-brand-subtext transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
        {action}
      </div>

      {open && (
        <form
          className="flex flex-wrap items-end gap-3 mt-3"
          onSubmit={e => { e.preventDefault(); if (valid && !disabled) onApply() }}
        >
          {showSite && (
            <MultiSelect
              label="Site" value={draft.site} onChange={v => set({ site: v })} noun="sites" className="flex-1 min-w-36" disabled={disabled}
              options={sites.map(s => ({ value: String(s.id), label: s.name }))}
            />
          )}
          {showRole && <Select label="User role" value={draft.role} onChange={v => set({ role: v })} className="flex-1 min-w-36" disabled={disabled}>
            <option value="all">All</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>}
          {/* `extraFields` (2026-10-26): report specific fields, such as Content's Course type, after User role. */}
          {extraFields}
          {weekMode && (
            <div className="flex flex-col gap-1.5 flex-[2] min-w-56">
              <span className={LABEL}>Week</span>
              <div className="flex items-center h-9 rounded-md border border-brand-border bg-white text-sm text-brand-text">
                <button type="button" onClick={weekMode.onPrev} disabled={!weekMode.canPrev} aria-label="Previous week" className="h-full px-2.5 rounded-l-md text-brand-subtext hover:bg-brand-bg hover:text-brand-text transition-colors disabled:opacity-30 disabled:hover:bg-transparent"><ChevronLeft size={14} /></button>
                <span className="flex-1 text-center font-medium tabular-nums" aria-live="polite">{weekMode.label}</span>
                {!weekMode.isLatest && <button type="button" onClick={weekMode.onLatest} className="px-2 text-xs font-medium text-dessa-teal hover:underline">Latest</button>}
                <button type="button" onClick={weekMode.onNext} disabled={!weekMode.canNext} aria-label="Next week" className="h-full px-2.5 rounded-r-md text-brand-subtext hover:bg-brand-bg hover:text-brand-text transition-colors disabled:opacity-30 disabled:hover:bg-transparent"><ChevronRight size={14} /></button>
              </div>
            </div>
          )}
          {!weekMode && showDates && <>
          <div className="flex flex-col gap-1.5 flex-1 min-w-36">
            <span id={`${uid}-start`} className={LABEL}>Start date</span>
            <DatePicker value={draft.start} onChange={v => set({ start: v })} placeholder="Start date" min={minDate} max={draft.end || maxDate} disabled={disabled} disableWeekends aria-labelledby={`${uid}-start`} className={`${CONTROL} py-0`} />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-36">
            <span id={`${uid}-end`} className={LABEL}>End date</span>
            <DatePicker value={draft.end} onChange={v => set({ end: v })} placeholder="End date" min={draft.start || minDate} max={maxDate} disabled={disabled} disableWeekends aria-labelledby={`${uid}-end`} className={`${CONTROL} py-0`} />
          </div>
          </>}
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              type="submit"
              disabled={!valid || disabled}
              className="h-9 px-4 rounded-md bg-dessa-teal text-sm font-semibold text-white hover:bg-dessa-teal/90 transition-colors disabled:opacity-40 disabled:hover:bg-dessa-teal"
            >
              Apply
            </button>
            <button type="button" onClick={onReset} disabled={disabled} className="h-9 px-2 text-sm font-medium text-brand-subtext hover:text-brand-text transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-brand-subtext">
              Reset filters
            </button>
          </div>
          {!valid && <p className="basis-full text-xs text-state-error" role="alert">Pick a start date and an end date to apply the filters.</p>}
        </form>
      )}
    </section>
  )
}
