import { useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { DatePicker } from '../ui/date-picker'

// Filters panel for the Engagement report (2026-10-09), matching the production
// Daily Curriculum Engagement paradigm: a collapsible panel above the report with
// Site, User Role, Start Date and End Date, and the report only updates on Apply.
// Built from our own tokens and the shared DatePicker, not production's styling.
// A Site Leader has one site, so `showSite` is off for them.
const LABEL = 'text-xs font-semibold uppercase tracking-wide text-brand-subtext'

function Select({ label, value, onChange, children, className = '' }) {
  return (
    <label className={`flex flex-col gap-1.5 ${className}`}>
      <span className={LABEL}>{label}</span>
      <span className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="appearance-none w-full h-8 pl-2.5 pr-8 text-[13px] rounded-md border border-brand-border bg-white text-brand-text hover:border-dessa-teal/50 focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
        >
          {children}
        </select>
        <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" aria-hidden="true" />
      </span>
    </label>
  )
}

export default function FiltersPanel({ draft, onChange, onApply, onReset, sites, roles, showSite = true, minDate, maxDate }) {
  const [open, setOpen] = useState(true)
  const set = patch => onChange({ ...draft, ...patch })
  const valid = !!draft.start && !!draft.end && draft.start <= draft.end

  return (
    <section aria-label="Filters" className="rounded-xl border border-brand-border bg-white p-4 mb-6">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        className="flex items-center gap-1.5 text-lg font-semibold text-brand-text"
      >
        Filters
        <ChevronDown size={16} className={`text-brand-subtext transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <form
          className="flex flex-wrap items-end gap-3 mt-3"
          onSubmit={e => { e.preventDefault(); if (valid) onApply() }}
        >
          {showSite && (
            <Select label="Site" value={draft.site} onChange={v => set({ site: v })} className="flex-1 min-w-36">
              <option value="all">All</option>
              {sites.map(s => <option key={s.id} value={String(s.id)}>{s.name}</option>)}
            </Select>
          )}
          <Select label="User role" value={draft.role} onChange={v => set({ role: v })} className="flex-1 min-w-36">
            <option value="all">All</option>
            {roles.map(r => <option key={r} value={r}>{r}</option>)}
          </Select>
          <div className="flex flex-col gap-1.5 flex-1 min-w-36">
            <span className={LABEL}>Start date</span>
            <DatePicker value={draft.start} onChange={v => set({ start: v })} placeholder="Start date" min={minDate} max={draft.end || maxDate} className="h-8 py-0 text-[13px] rounded-md" />
          </div>
          <div className="flex flex-col gap-1.5 flex-1 min-w-36">
            <span className={LABEL}>End date</span>
            <DatePicker value={draft.end} onChange={v => set({ end: v })} placeholder="End date" min={draft.start || minDate} max={maxDate} className="h-8 py-0 text-[13px] rounded-md" />
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-auto">
            <button
              type="submit"
              disabled={!valid}
              className="h-8 px-4 rounded-md bg-dessa-teal text-[13px] font-medium text-white hover:bg-dessa-teal/90 transition-colors disabled:opacity-40 disabled:hover:bg-dessa-teal"
            >
              Apply
            </button>
            <button type="button" onClick={onReset} className="h-8 px-2 text-[13px] font-medium text-brand-subtext hover:text-brand-text transition-colors">
              Reset filters
            </button>
          </div>
          {!valid && <p className="basis-full text-xs text-state-error" role="alert">Pick a start date and an end date to apply the filters.</p>}
        </form>
      )}
    </section>
  )
}
