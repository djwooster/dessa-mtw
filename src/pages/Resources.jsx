import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as Popover from '@radix-ui/react-popover'
import {
  Search, X, Video, FileText, Mic, ChevronDown,
  ClipboardList, Star, Check, ImagePlus, Filter, ExternalLink, Plus,
} from 'lucide-react'
import {
  resources, CATEGORIES, TYPES, ALL_GRADES, ALL_COMPETENCIES, courseFor,
} from '../lib/resourcesData'
import {
  Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis,
} from '../components/ui/pagination'

// "Adult Wellness" is excluded from every picker on this page now, per
// explicit request — both the grade pickers (sidebar Grade facet, all three
// gate concepts' pill grids) and the Course Type facet below. Adult
// Wellness resources still exist in the data (r.grade/r.category ===
// 'Adult Wellness'), they're just entirely unreachable through this page's
// browse flow now.
// "All Grades" is a synthetic pseudo-grade, not a real value in the resource
// data (unlike the actual grades ALL_GRADES is derived from) — it represents
// content like an Anti-bullying resource that applies to any grade. Appears
// everywhere SELECTABLE_GRADES is used: the starting gate's pill grid, the
// sidebar Grade facet, and 3B/3C's Filter panels. No resource is tagged with
// it yet, so selecting only this pill currently shows "No resources found"
// — ask if a demo resource (e.g. the Anti-bullying example) should be added
// to make it demonstrable.
// "Pre-K" is prepended ahead of 'Kindergarten' — like "All Grades" above,
// it isn't a real value in the resource data (no course/resource is tagged
// with it), so selecting only this pill currently shows "No resources
// found." Unlike "All Grades" it's a real, specific grade rather than a
// pseudo-grade, so it's excluded from PSEUDO_GRADES and behaves like any
// other single numbered grade (no forced divider row when picked alone).
// The grade-band values ('Early Elementary', 'Late Elementary', 'Middle
// School', 'High School') are excluded from the grade gate/picker entirely
// per manager feedback (2026-08-26) — same treatment as 'Adult Wellness'
// above: resources tagged with these grades (Tier 2 / Family courses) still
// exist in the data, they're just unreachable through this page's grade-
// based browse flow now.
const GRADE_BANDS = ['Early Elementary', 'Late Elementary', 'Middle School', 'High School']
const gradesWithoutAdultWellness = ALL_GRADES.filter((g) => g !== 'Adult Wellness' && !GRADE_BANDS.includes(g))
// The "All Grades" pseudo-grade — used below to force the results list's
// grade divider rows on even when it's selected alone, since (unlike
// picking a single numbered grade) it isn't obvious to the user that
// everything in the list shares one grade tag. See showGradeColumn.
const PSEUDO_GRADES = ['All Grades']
const SELECTABLE_GRADES = ['Pre-K', ...gradesWithoutAdultWellness, ...PSEUDO_GRADES]
const SELECTABLE_CATEGORIES = CATEGORIES.filter((c) => c !== 'Adult Wellness')

// 3A/3B only ("remember my choice") — a plain localStorage read/write, not
// wired through any backend/session concept, since this prototype has none.
const REMEMBERED_GRADES_KEY = 'resources.rememberedGrades'

function loadRememberedGrades() {
  try {
    const parsed = JSON.parse(localStorage.getItem(REMEMBERED_GRADES_KEY))
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null
  } catch {
    return null
  }
}

// Simple placeholder: lucide icon over a low-opacity colored rectangle.
const TYPE_META = {
  video: { icon: Video, label: 'Video', color: 'text-dessa-magenta', bg: 'bg-dessa-magenta' },
  pdf: { icon: FileText, label: 'PDF', color: 'text-mtw-purple', bg: 'bg-mtw-purple' },
  worksheets: { icon: ClipboardList, label: 'Worksheet', color: 'text-mtw-coral', bg: 'bg-mtw-coral' },
  audio: { icon: Mic, label: 'Audio', color: 'text-mtw-blue', bg: 'bg-mtw-blue' },
}

// Small round icon badge — stands in for the "author avatar" slot in the
// card-list reference this row/card layout is based on, using our real
// type data instead of an invented person.
function TypeIconBadge({ type, size = 28 }) {
  const { icon: Icon, color, bg } = TYPE_META[type]
  return (
    <span
      className={`flex items-center justify-center rounded-full ${bg} bg-opacity-15 shrink-0`}
      style={{ width: size, height: size }}
    >
      <Icon size={Math.round(size * 0.45)} className={color} />
    </span>
  )
}

// Tinted, borderless pill with a small icon + label — the file-type equivalent
// of the "status badge" pattern (e.g. a colored "Bookmarked" or "Flagged"
// chip), so type reads as a labeled category rather than an abstract icon.
function TypeBadge({ type }) {
  const { icon: Icon, color, bg, label } = TYPE_META[type]
  return (
    <span className={`inline-flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-[5px] ${bg} bg-opacity-10 ${color} shrink-0`}>
      <Icon size={14} />
      <span className="text-xs font-medium">{label}</span>
    </span>
  )
}

// Adult Wellness lesson titles are authored with an "Independent: " prefix
// (they're self-guided, as opposed to facilitated) — useful in the source
// data but redundant noise in a resource list, so strip it for display only.
function displayTitle(title) {
  return title.replace(/^Independent:\s*/, '')
}

// 3C — one read-only chip per applied filter value, replacing the old
// "N grades selected" summary text in the results card header. Spans every
// facet (grade, course type, competency, type), not just grade, so any
// filter picked via the Filters card above is visible at a glance here;
// removing one is done via that card, not from these chips.
function FilterChip({ label }) {
  return (
    <span className="inline-flex items-center pl-3 pr-3 py-1.5 rounded-full bg-dessa-tealLight text-dessa-teal text-sm font-medium">
      {label}
    </span>
  )
}

const PAGE_SIZE = 20

function FacetGroup({ title, options, selected, onToggle, scrollable, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-brand-border last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-4 py-3 text-left hover:bg-brand-bg transition-colors"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-brand-text">
          <span className="relative inline-block">
            {title}
            {selected.length > 0 && (
              <span className="absolute top-[0.05rem] right-[-0.6rem] w-2 h-2 rounded-full bg-dessa-teal" />
            )}
          </span>
        </span>
        <ChevronDown size={14} className={`text-brand-subtext shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className={`flex flex-col pb-3 ${scrollable ? 'max-h-48 overflow-y-auto' : ''}`}>
          {options.map((opt) => (
            <label
              key={opt}
              className="flex items-center gap-2.5 px-4 py-1.5 text-sm text-brand-text cursor-pointer hover:bg-brand-bg transition-colors"
            >
              <input
                type="checkbox"
                checked={selected.includes(opt)}
                onChange={() => onToggle(opt)}
                className="accent-dessa-teal w-3.5 h-3.5"
              />
              {opt}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

// Windowed page list (first, last, current ±1) with gaps marked by '…' —
// results can span 100+ pages, so listing every page number isn't viable.
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

// Concept 3's grade gate, in three presentations (3A/3B/3C — see Nav's
// switcher). All three share the same staged-selection pattern: picks are
// held in local `pending` state (not written to selectedGrades until the
// confirm button is pressed), and each gate component unmounts on confirm
// and remounts fresh if grades are later cleared back to zero (e.g. via the
// sidebar facet), which is what resets `pending` — no extra effect needed.
// An earlier pass (now retired) put this behind a fixed-position, dark-
// backdrop modal — manager feedback was that it "slammed down" too abruptly,
// so none of these three use a full-screen overlay.
function usePendingGrades() {
  const [pending, setPending] = useState([])
  function toggle(grade) {
    setPending((prev) => (prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]))
  }
  return [pending, toggle]
}

function GradePillGrid({ pending, onToggle, wrapClassName }) {
  return (
    <div className={wrapClassName}>
      {SELECTABLE_GRADES.map((grade) => {
        const active = pending.includes(grade)
        return (
          <button
            key={grade}
            type="button"
            onClick={() => onToggle(grade)}
            className={`px-3 py-1 rounded-md text-[13px] font-medium transition-colors ${
              active
                ? 'border-2 border-dessa-teal bg-dessa-tealLight text-dessa-teal'
                : 'border-2 border-dashed border-[#C9CDD3] text-brand-subtext hover:border-dessa-teal/50 hover:text-brand-text'
            }`}
          >
            {grade}
          </button>
        )
      })}
    </div>
  )
}

// Decorative grid + floating type-icon tiles behind the gate card — a
// delight-add per explicit feedback (2026-08-26), meant to read as
// background texture rather than competing content: a faint dessa-teal
// grid, masked so it's invisible right behind the card and gradually
// reveals itself toward the edges. This is the inverse of a typical
// "vignette" radial gradient (which fades OUT toward the edges) — here the
// center is what's hidden. The floating tiles reuse this page's real
// TYPE_META icons (video/pdf/worksheets/audio) rather than generic file-
// type art, and live inside the same masked layer so they fade in with the
// grid instead of being hard-placed with a visible cutoff.
const GATE_DECOR_MASK = 'radial-gradient(ellipse 60% 55% at center, transparent 0%, transparent 45%, black 85%)'
const GATE_DECOR_TILES = [
  { type: 'video', top: '10%', left: '8%', rotate: -8 },
  { type: 'pdf', top: '14%', left: '88%', rotate: 7 },
  { type: 'worksheets', top: '84%', left: '10%', rotate: 6 },
  { type: 'audio', top: '80%', left: '86%', rotate: -6 },
]
// Browsing-term pills (2026-08-26 follow-up) — not real catalog entries
// (no lookup/click-through, just illustrative of the kind of content that
// exists), styled and thematically grounded to match this app's actual
// content (posters/toolkits/worksheets/guides, echoing real unit titles
// like "Calm Toolkit" and "Active Listening") so they read as authentic
// hints rather than generic placeholder text.
const GATE_DECOR_PILLS = [
  { label: 'Anti-Bullying Poster', top: '5%', left: '38%', rotate: -4 },
  { label: 'High-Five Poster', top: '38%', left: '3%', rotate: 5 },
  { label: 'Calm-Down Toolkit', top: '40%', left: '95%', rotate: -6 },
  { label: 'Growth Mindset Worksheet', top: '92%', left: '60%', rotate: 4 },
  { label: 'Active Listening Guide', top: '66%', left: '22%', rotate: -3 },
]

// Shared floating behavior for both tiles and pills — a slow, subtle
// vertical bob (not a spin/scale, which would read as busier than
// intended for background texture). Duration/delay vary by index so the
// items drift out of sync with each other rather than bobbing in unison.
function floatTransition(i) {
  return { duration: 3.6 + (i % 3) * 0.7, repeat: Infinity, ease: 'easeInOut', delay: i * 0.35 }
}

function GateBackdrop() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ WebkitMaskImage: GATE_DECOR_MASK, maskImage: GATE_DECOR_MASK }}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(42,127,143,0.14) 0px, rgba(42,127,143,0.14) 1px, transparent 1px, transparent 48px), ' +
            'repeating-linear-gradient(90deg, rgba(42,127,143,0.14) 0px, rgba(42,127,143,0.14) 1px, transparent 1px, transparent 48px)',
        }}
      />
      {GATE_DECOR_TILES.map(({ type, top, left, rotate }, i) => {
        const { icon: Icon, color } = TYPE_META[type]
        return (
          // Outer div handles absolute placement + centering (translate
          // -50%/-50%) as a static transform; the inner motion.div owns
          // rotate + the animated float so the two transforms don't fight
          // (framer-motion overwrites the whole `transform` property based
          // on its own x/y/rotate values each frame).
          <div key={type} className="absolute" style={{ top, left, transform: 'translate(-50%, -50%)' }}>
            <motion.div
              className="w-14 h-14 rounded-2xl bg-white border border-brand-border shadow-md flex items-center justify-center"
              style={{ rotate }}
              animate={{ y: [0, -6, 0] }}
              transition={floatTransition(i)}
            >
              <Icon size={22} className={color} />
            </motion.div>
          </div>
        )
      })}
      {GATE_DECOR_PILLS.map(({ label, top, left, rotate }, i) => (
        <div key={label} className="absolute" style={{ top, left, transform: 'translate(-50%, -50%)' }}>
          <motion.div
            className="whitespace-nowrap px-3 py-1.5 rounded-full bg-white border border-brand-border shadow-sm text-xs font-medium text-brand-text"
            style={{ rotate }}
            animate={{ y: [0, -6, 0] }}
            transition={floatTransition(i + GATE_DECOR_TILES.length)}
          >
            {label}
          </motion.div>
        </div>
      ))}
    </div>
  )
}

// Shared gate copy/controls — factored out so Concept C's left-aligned,
// card-less layout can reuse the exact same heading/subcopy/pill grid/
// checkbox/button as A/B's centered card instead of forking the text
// (per explicit instruction: "same content, just left-aligned & bg
// removed"). `align` only toggles text/pill alignment, nothing else.
function GateFields({ pending, togglePending, remember, setRemember, onConfirm, align = 'center' }) {
  const isLeft = align === 'left'
  return (
    <>
      {/* Describes the library's content, not the selection mechanic —
          per explicit feedback (2026-08-26), "Select a grade level" /
          "choose it below" told the user what to do with the gate
          instead of what they'd find once through it. */}
      <h1 className={`text-4xl font-semibold text-brand-text mb-3 ${isLeft ? '' : 'text-center'}`}>
        Curriculum Resource Library
      </h1>
      <p className={`text-base text-brand-subtext max-w-md mb-8 ${isLeft ? '' : 'text-center'}`}>
        Browse lesson videos, activity guides, and printable worksheets organized by grade and SEL competency.
      </p>
      <h6 className="text-xs font-semibold text-[#5B6878] uppercase tracking-wide mb-4">
        Select one or more grade levels
      </h6>
      <GradePillGrid
        pending={pending}
        onToggle={togglePending}
        wrapClassName={`flex flex-wrap gap-2 max-w-lg mb-6 ${isLeft ? '' : 'justify-center'}`}
      />
      <label className="flex items-center gap-2 text-sm text-brand-subtext mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={remember}
          onChange={(e) => setRemember(e.target.checked)}
          className="accent-dessa-teal w-3.5 h-3.5"
        />
        Remember my choice
      </label>
      <button
        type="button"
        disabled={pending.length === 0}
        onClick={() => onConfirm(pending, remember)}
        className="h-12 px-10 rounded-full text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors disabled:bg-brand-border disabled:text-brand-subtext"
      >
        View Resources
      </button>
    </>
  )
}

// Concept C's right-side row stack (2026-08-26) — originally an endlessly
// scrolling marquee with a glow that traveled row-to-row; per explicit
// feedback it's now static ("just looks like an image"), showing only as
// many rows as fit the container, with one fixed row treated as the
// "selected" one: a permanent dessa-teal glow plus a slightly larger
// scale, instead of a glow that used to travel and fade as rows scrolled
// past center. The container still fades content out at the very top/
// bottom edges via a linear mask (same masked-edge technique as
// GateBackdrop, just linear instead of radial) — purely a vignette now,
// unrelated to any motion.
// Ordered so the first GATE_SCROLL_VISIBLE_COUNT (8, the only ones actually
// rendered) mix all 5 icon types below rather than skewing pdf/worksheets
// — per explicit feedback, the visible set previously had zero video/audio
// rows at all.
const GATE_SCROLL_ROWS = [
  { label: 'Anti-Bullying Poster', type: 'pdf', tag: 'Social Awareness' },
  { label: 'Bounce-Back Stories Guide', type: 'video', tag: 'Social Awareness' },
  { label: 'Calm-Down Toolkit', type: 'worksheets', tag: 'Self-Management' },
  { label: 'Mindful Moments Podcast', type: 'audio', tag: 'Self-Management' },
  { label: 'Growth Mindset Worksheet', type: 'worksheets', tag: 'Self-Awareness' },
  { label: 'MTW Parent Newsletter', type: 'external', tag: 'Relationship Skills' },
  { label: 'Active Listening Guide', type: 'pdf', tag: 'Relationship Skills' },
  { label: 'Feelings Check-In Cards', type: 'worksheets', tag: 'Self-Awareness' },
  { label: 'High-Five Poster', type: 'pdf', tag: 'Relationship Skills' },
  { label: 'Breathing Buddies Guide', type: 'pdf', tag: 'Self-Management' },
  { label: 'The Pause Button Worksheet', type: 'worksheets', tag: 'Self-Management' },
  { label: 'Gratitude Practice Journal', type: 'worksheets', tag: 'Self-Awareness' },
]
// 'external' isn't a real resourcesData.js/TYPE_META type (TYPES is just
// video/pdf/worksheets/audio) — added locally, only for this purely
// decorative row list, to cover a "links out" example (e.g. a newsletter)
// without inventing a new type in the real data model.
const GATE_SCROLL_TYPE_META = {
  ...TYPE_META,
  external: { icon: ExternalLink, color: 'text-mtw-blue' },
}
// Sized down ~10% from the original 56/12/520 — done by shrinking the real
// dimensions rather than a CSS `transform: scale()` on the stack, since a
// post-layout transform (esp. with a top-anchored origin) shrinks the
// rendered content away from the container's edges, breaking the top/bottom
// mask fade (the last row no longer reaches the bottom fade zone at all).
const GATE_SCROLL_ITEM_HEIGHT = 50
const GATE_SCROLL_GAP = 11
const GATE_SCROLL_ROW_WIDTH = 468
const GATE_SCROLL_SLOT = GATE_SCROLL_ITEM_HEIGHT + GATE_SCROLL_GAP
// Must match the height applied to GateScrollRows' wrapping div in
// GateFullPage below.
const GATE_SCROLL_CONTAINER_HEIGHT = 480
// 8 rows fit the container (see the math this used to be derived from,
// now just hardcoded to keep this simple): N*ITEM_HEIGHT + (N-1)*GAP <=
// CONTAINER_HEIGHT, i.e. 8*50 + 7*11 = 477 <= 480.
const GATE_SCROLL_VISIBLE_COUNT = 8
// The one row treated as "selected" — the 5th of 8, roughly the middle.
const GATE_SCROLL_SELECTED_INDEX = 4
const GATE_SCROLL_MASK = 'linear-gradient(to bottom, transparent 0%, black 18%, black 82%, transparent 100%)'
const GATE_GLOW_PEAK = '0 0 0 2px rgba(42, 127, 143, 0.9), 0 0 20px 4px rgba(42, 127, 143, 0.45)'
// Hardcoded per-row scale (2026-08-26, replacing a distance-formula
// version that left the last row unscaled) — one literal value per row,
// index-matched 1:1 to GATE_SCROLL_VISIBLE_COUNT. Falls away from the
// selected row (index 4 → 1.05 + glow) in 0.02 steps per row of distance,
// symmetric in both directions: .97/.95/.93 one/two/three rows away.
const GATE_SCROLL_SCALES = [0.91, 0.93, 0.95, 0.97, 1.05, 0.97, 0.95, 0.93]

function GateScrollRow({ row, selected, scale }) {
  const { icon: Icon, color } = GATE_SCROLL_TYPE_META[row.type]
  return (
    <div
      className={`rounded-xl bg-white border border-brand-border flex items-center gap-3 px-4 shrink-0 transition-transform ${
        selected ? 'z-10' : ''
      }`}
      style={{
        height: GATE_SCROLL_ITEM_HEIGHT,
        width: GATE_SCROLL_ROW_WIDTH,
        boxShadow: selected ? GATE_GLOW_PEAK : 'none',
        transform: `scale(${scale})`,
      }}
    >
      <Icon size={16} className={`${color} shrink-0`} />
      <span className="flex-1 text-sm font-medium text-brand-text truncate">{row.label}</span>
      <span className="shrink-0 text-[11px] font-medium px-2 py-1 rounded-full bg-dessa-tealLight text-dessa-teal">
        {row.tag}
      </span>
    </div>
  )
}

function GateScrollRows() {
  const rows = GATE_SCROLL_ROWS.slice(0, GATE_SCROLL_VISIBLE_COUNT)
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ WebkitMaskImage: GATE_SCROLL_MASK, maskImage: GATE_SCROLL_MASK }}
    >
      <div
        className="absolute inset-x-0 top-0 flex flex-col items-center"
        style={{ gap: GATE_SCROLL_GAP }}
      >
        {rows.map((row, i) => (
          <GateScrollRow
            key={row.label}
            row={row}
            selected={i === GATE_SCROLL_SELECTED_INDEX}
            scale={GATE_SCROLL_SCALES[i]}
          />
        ))}
      </div>
    </div>
  )
}

// 3A — full-page takeover: nothing else (search bar, sidebar, results card)
// mounts until a grade is confirmed, so there's no background page for an
// overlay to interrupt — this state simply *is* the page.
function GateFullPage({ onConfirm, defaultRemember, decorConcept }) {
  const [pending, togglePending] = usePendingGrades()
  const [imgErrored, setImgErrored] = useState(false)
  const [remember, setRemember] = useState(defaultRemember)

  // Concept C — left-aligned content with no card/background, a right-
  // side scrolling animation (GateScrollRows) filling the space the
  // centered card used to occupy. Confirmed explicitly (2026-08-26): same
  // gate content as A/B, just left-aligned; icon graphic dropped since
  // the reference this was modeled on doesn't have one; the two columns
  // are otherwise unrelated to Concept B's grid/tiles backdrop.
  if (decorConcept === 'c') {
    return (
      <div className="relative w-screen mx-[calc(50%-50vw)] grid grid-cols-1 md:grid-cols-2 gap-16 items-center pt-28 pb-16 px-6 md:px-[172px] overflow-hidden">
        {/* Grid, not flex — grid-cols-2 forces a true 50/50 split
            regardless of content width. flex-1 alone doesn't guarantee
            that: flex items default to a content-based min-width, so the
            scrolling rows' unwrapped text could still push that column
            wider than its sibling even with flex-1 on both. */}
        <div className="flex flex-col items-start text-left">
          <GateFields
            pending={pending}
            togglePending={togglePending}
            remember={remember}
            setRemember={setRemember}
            onConfirm={onConfirm}
            align="left"
          />
        </div>
        {/* transform: scale here (on the whole already-masked block), not
            on GateScrollRows' internal content — scaling the mask+rows
            together as one composited unit avoids the earlier bug where
            scaling just the content caused it to stop filling the mask's
            coordinate space and broke the bottom fade. */}
        <div
          className="relative hidden md:block min-w-0"
          style={{ height: GATE_SCROLL_CONTAINER_HEIGHT, transform: 'scale(0.9)' }}
        >
          <GateScrollRows />
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-screen mx-[calc(50%-50vw)] flex justify-center py-16 px-6 overflow-hidden">
      {decorConcept === 'b' && <GateBackdrop />}
      <div className="relative z-10 w-full max-w-3xl rounded-2xl border border-brand-border bg-white p-10 flex flex-col items-center text-center">
        {!imgErrored ? (
          <img
            src="/Yearly%20Setup/search-modal.svg"
            alt=""
            onError={() => setImgErrored(true)}
            className="h-24 w-auto max-w-[180px] object-contain mb-6"
          />
        ) : (
          <div className="h-24 w-24 mb-6 rounded-2xl bg-brand-bg border border-brand-border flex flex-col items-center justify-center gap-1 shrink-0">
            <ImagePlus size={20} className="text-brand-subtext" />
          </div>
        )}
        <GateFields
          pending={pending}
          togglePending={togglePending}
          remember={remember}
          setRemember={setRemember}
          onConfirm={onConfirm}
          align="center"
        />
      </div>
    </div>
  )
}

// 3B — one filter section within FilterPanel below, styled after the
// reference screenshot's "Date range / Activity type / Status" fields: a
// title + "Reset" link, then its own control.
// optionsClassName defaults to a single column; Grade passes a 2-column
// grid instead (see FilterPanel) since it has far more options than the
// other sections — splitting it avoids a scrollbar without making that
// cell wildly taller than its Course Type neighbor in the same grid row.
function FilterSection({ title, options, selected, onToggle, onReset, optionsClassName = 'flex flex-col gap-1.5' }) {
  return (
    <div className="px-4 py-3 h-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-semibold text-brand-text">{title}</p>
        <button type="button" onClick={onReset} className="text-xs font-medium text-dessa-teal hover:underline">
          Reset
        </button>
      </div>
      <div className={optionsClassName}>
        {options.map((opt) => (
          <label key={opt} className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
            <input
              type="checkbox"
              checked={selected.includes(opt)}
              onChange={() => onToggle(opt)}
              className="accent-dessa-teal w-3.5 h-3.5 shrink-0"
            />
            <span className="truncate">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

// 3B — replaces the always-visible sidebar facets with a "Filter" button +
// popover, staged like the reference screenshot: picks are held in local
// pending state and only committed to the real selectedX state (and thus
// to the results) when "Apply now" is pressed — unlike the sidebar facets
// elsewhere, which filter live. Grade is included here (not just Course
// Type/Competency/Type) since 3B has no sidebar at all to house it
// otherwise; clearing it to zero and applying reopens the full-page gate,
// same as clearing the sidebar facet does for 3A.
function FilterPanel({
  selectedGrades, setSelectedGrades,
  selectedCategories, setSelectedCategories,
  selectedCompetencies, setSelectedCompetencies,
  selectedTypes, setSelectedTypes,
}) {
  const [open, setOpen] = useState(false)
  const [pendingGrades, setPendingGrades] = useState(selectedGrades)
  const [pendingCategories, setPendingCategories] = useState(selectedCategories)
  const [pendingCompetencies, setPendingCompetencies] = useState(selectedCompetencies)
  const [pendingTypes, setPendingTypes] = useState(selectedTypes)

  function handleOpenChange(next) {
    if (next) {
      // Re-stage from the committed values every time the panel opens, so a
      // prior "Reset all" that was never applied doesn't leak into the next
      // time it's opened.
      setPendingGrades(selectedGrades)
      setPendingCategories(selectedCategories)
      setPendingCompetencies(selectedCompetencies)
      setPendingTypes(selectedTypes)
    }
    setOpen(next)
  }

  function togglePending(setFn, value) {
    setFn((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  function applyNow() {
    setSelectedGrades(pendingGrades)
    setSelectedCategories(pendingCategories)
    setSelectedCompetencies(pendingCompetencies)
    setSelectedTypes(pendingTypes)
    setOpen(false)
  }

  function resetAll() {
    setPendingGrades([])
    setPendingCategories([])
    setPendingCompetencies([])
    setPendingTypes([])
  }

  return (
    <Popover.Root open={open} onOpenChange={handleOpenChange}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className="relative shrink-0 flex items-center gap-1.5 pl-3 pr-3 h-9 text-[13px] font-medium border border-brand-border rounded-md bg-white text-brand-text hover:bg-brand-bg transition-colors"
        >
          <Filter size={13} className="text-brand-subtext" />
          Filter
          {/* Grade counts too, per explicit request — this button only ever
              renders once the mandatory gate is passed, so selectedGrades
              is never empty here, and the dot is effectively always on. */}
          {(selectedGrades.length > 0 || selectedCategories.length > 0 || selectedCompetencies.length > 0 || selectedTypes.length > 0) && (
            <span className="absolute top-[0.4rem] right-[0.1rem] w-2.5 h-2.5 rounded-full bg-dessa-teal border-2 border-white" />
          )}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-30 w-[720px] max-h-[80vh] overflow-y-auto bg-white border border-brand-border rounded-xl shadow-lg outline-none"
        >
          <div className="px-4 py-3 border-b border-brand-border bg-brand-bg rounded-t-xl">
            <p className="text-sm font-semibold text-brand-text">Filter</p>
          </div>
          {/* 2x2 grid instead of one long vertical stack — wider and
              shorter, and groups scan as two clear rows rather than one
              undifferentiated list. Borders applied on these wrapper divs
              (not FilterSection itself) so the grid lines land between
              cells rather than under every section regardless of column. */}
          <div className="grid grid-cols-2">
            <div className="border-r border-b border-brand-border">
              <FilterSection
                title="Grade"
                options={SELECTABLE_GRADES}
                selected={pendingGrades}
                onToggle={(v) => togglePending(setPendingGrades, v)}
                onReset={() => setPendingGrades([])}
                optionsClassName="grid grid-cols-2 gap-x-3 gap-y-1.5"
              />
            </div>
            <div className="border-b border-brand-border">
              <FilterSection
                title="Course Type"
                options={SELECTABLE_CATEGORIES}
                selected={pendingCategories}
                onToggle={(v) => togglePending(setPendingCategories, v)}
                onReset={() => setPendingCategories([])}
              />
            </div>
            <div className="border-r border-brand-border">
              <FilterSection
                title="Competency"
                options={ALL_COMPETENCIES}
                selected={pendingCompetencies}
                onToggle={(v) => togglePending(setPendingCompetencies, v)}
                onReset={() => setPendingCompetencies([])}
              />
            </div>
            <div>
              <FilterSection
                title="Type"
                options={TYPES.map((t) => TYPE_META[t].label)}
                selected={pendingTypes.map((t) => TYPE_META[t].label)}
                onToggle={(label) => togglePending(setPendingTypes, TYPES.find((t) => TYPE_META[t].label === label))}
                onReset={() => setPendingTypes([])}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-t border-brand-border">
            <button
              type="button"
              onClick={resetAll}
              className="px-3 py-2 rounded-md text-sm font-semibold border border-brand-border text-brand-text hover:bg-brand-bg transition-colors"
            >
              Reset all
            </button>
            <button
              type="button"
              onClick={applyNow}
              className="px-4 py-2 rounded-md text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors"
            >
              Apply now
            </button>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

// 3C — full-width expandable "Filters" card, modeled on a real-app reference
// screenshot (a report page's "Filters ⌄" row that pushes the page down
// when expanded, rather than a popover). Sits above the grade heading/
// results entirely, in its own card — see the "Filters" render block below
// the sticky search bar. Replaces the earlier popover-triggered
// FilterPanelC; unlike
// that version, each facet is its own labeled dropdown-style field
// (FilterFieldDropdown) instead of a static checklist column, closer to the
// reference's "Site"/"User Role" fields — the selection underneath is still
// multi-select, just presented as "N selected" once a dropdown is closed.
// Staging pattern is unchanged from 3B: picks live in local `pending` state
// until "Apply" commits them to the real selectedX state; "Reset Filters"
// only clears the staged picks, matching the reference's Apply/Reset pair.
// Each dropdown's popover is itself a search box over its own option list
// (own local `search` state, cleared on close) — useful once a facet like
// Grade has more options than fit without scrolling/hunting.
function FilterFieldDropdown({ label, options, selected, onToggle, onReset, optionsClassName = 'flex flex-col gap-1.5' }) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const q = search.trim().toLowerCase()
  const filteredOptions = q ? options.filter((opt) => opt.toLowerCase().includes(q)) : options

  function handleOpenChange(next) {
    // Clear any leftover search text so reopening a dropdown never starts
    // pre-filtered from a previous session.
    if (!next) setSearch('')
    setOpen(next)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <p className="text-sm font-semibold text-brand-text">{label}</p>
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        {/* Chip-field trigger (matches the "Site" field in the reference
            report screenshot) once something's selected: the field shows
            the first selected value as a removable chip plus a "+N" badge
            for the rest, and only the teal "+" button opens the popover to
            add more — the chip's own × removes just that value without
            opening anything. At rest (nothing selected yet), the field is a
            plain "All" dropdown — the whole field is the trigger, with a
            chevron instead of the "+", matching the original facet-field
            affordance before anything's been picked. */}
        {selected.length === 0 ? (
          <Popover.Trigger asChild>
            <button
              type="button"
              className="w-full flex items-center justify-between gap-2 h-10 px-3 text-sm border border-brand-border rounded-md bg-white text-brand-subtext hover:border-dessa-teal/50 transition-colors"
            >
              <span className="truncate text-left">All</span>
              <ChevronDown size={14} className={`text-brand-subtext shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
          </Popover.Trigger>
        ) : (
          <div className="w-full flex items-center gap-2 h-10 pl-1 pr-1 border border-brand-border rounded-md bg-white">
            <span className="inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-md bg-dessa-tealLight text-dessa-teal text-sm font-medium max-w-[60%]">
              <span className="truncate">{selected[0]}</span>
              <button
                type="button"
                onClick={() => onToggle(selected[0])}
                aria-label={`Remove ${selected[0]}`}
                className="shrink-0 hover:opacity-70 transition-opacity"
              >
                <X size={12} />
              </button>
            </span>
            {selected.length > 1 && (
              <span className="shrink-0 px-2 py-1 rounded-md bg-brand-bg text-brand-text text-xs font-semibold">
                +{selected.length - 1}
              </span>
            )}
            <span className="flex-1" />
            <Popover.Trigger asChild>
              <button
                type="button"
                aria-label={`Add ${label} filter`}
                className="shrink-0 w-7 h-7 rounded-md bg-dessa-teal text-white flex items-center justify-center hover:bg-dessa-teal/90 transition-colors"
              >
                <Plus size={14} />
              </button>
            </Popover.Trigger>
          </div>
        )}
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={6}
            className="z-30 w-64 bg-white border border-brand-border rounded-xl shadow-lg outline-none p-3 flex flex-col"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-brand-subtext uppercase tracking-wide">{label}</p>
              <button type="button" onClick={onReset} className="text-xs font-medium text-dessa-teal hover:underline">
                Reset
              </button>
            </div>
            <div className="relative mb-2 shrink-0">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
              <input
                type="text"
                autoFocus
                placeholder={`Search ${label.toLowerCase()}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-8 pr-2 h-8 text-sm border border-brand-border rounded-md bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
              />
            </div>
            <div className="max-h-56 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <p className="text-sm text-brand-subtext px-1 py-2">No matches</p>
              ) : (
                <div className={optionsClassName}>
                  {filteredOptions.map((opt) => (
                    <label key={opt} className="flex items-center gap-2 text-sm text-brand-text cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selected.includes(opt)}
                        onChange={() => onToggle(opt)}
                        className="accent-dessa-teal w-3.5 h-3.5 shrink-0"
                      />
                      <span className="truncate">{opt}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </div>
  )
}

function FilterBarC({
  selectedGrades, setSelectedGrades,
  selectedCategories, setSelectedCategories,
  selectedCompetencies, setSelectedCompetencies,
  selectedTypes, setSelectedTypes,
}) {
  const [expanded, setExpanded] = useState(false)
  const [pendingGrades, setPendingGrades] = useState(selectedGrades)
  const [pendingCategories, setPendingCategories] = useState(selectedCategories)
  const [pendingCompetencies, setPendingCompetencies] = useState(selectedCompetencies)
  const [pendingTypes, setPendingTypes] = useState(selectedTypes)

  function toggleExpanded() {
    if (!expanded) {
      // Re-stage from the committed values every time it opens, same reason
      // as 3B's FilterPanel: a prior "Reset Filters" that was never applied
      // shouldn't leak into the next time this is opened.
      setPendingGrades(selectedGrades)
      setPendingCategories(selectedCategories)
      setPendingCompetencies(selectedCompetencies)
      setPendingTypes(selectedTypes)
    }
    setExpanded((prev) => !prev)
  }

  function togglePending(setFn, value) {
    setFn((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]))
  }

  function apply() {
    setSelectedGrades(pendingGrades)
    setSelectedCategories(pendingCategories)
    setSelectedCompetencies(pendingCompetencies)
    setSelectedTypes(pendingTypes)
  }

  function resetFilters() {
    setPendingGrades([])
    setPendingCategories([])
    setPendingCompetencies([])
    setPendingTypes([])
  }

  return (
    <div className="mb-6 rounded-2xl border border-brand-border bg-white">
      <button
        type="button"
        onClick={toggleExpanded}
        aria-expanded={expanded}
        className="w-full flex items-center gap-1.5 px-5 py-4 text-base font-semibold text-brand-text"
      >
        Filters
        <ChevronDown size={16} className={`text-brand-text transition-transform ${expanded ? 'rotate-180' : ''}`} />
      </button>
      {expanded && (
        <div className="px-5 pt-5 pb-5 border-t border-brand-border">
          <div className="grid grid-cols-4 gap-4">
            <FilterFieldDropdown
              label="Grade"
              options={SELECTABLE_GRADES}
              selected={pendingGrades}
              onToggle={(v) => togglePending(setPendingGrades, v)}
              onReset={() => setPendingGrades([])}
              optionsClassName="grid grid-cols-2 gap-x-3 gap-y-1.5"
            />
            <FilterFieldDropdown
              label="Course Type"
              options={SELECTABLE_CATEGORIES}
              selected={pendingCategories}
              onToggle={(v) => togglePending(setPendingCategories, v)}
              onReset={() => setPendingCategories([])}
            />
            <FilterFieldDropdown
              label="Competency"
              options={ALL_COMPETENCIES}
              selected={pendingCompetencies}
              onToggle={(v) => togglePending(setPendingCompetencies, v)}
              onReset={() => setPendingCompetencies([])}
            />
            <FilterFieldDropdown
              label="Type"
              options={TYPES.map((t) => TYPE_META[t].label)}
              selected={pendingTypes.map((t) => TYPE_META[t].label)}
              onToggle={(label) => togglePending(setPendingTypes, TYPES.find((t) => TYPE_META[t].label === label))}
              onReset={() => setPendingTypes([])}
            />
          </div>
          <div className="flex items-center gap-4 mt-5">
            <button
              type="button"
              onClick={apply}
              className="px-5 py-2 rounded-md text-sm font-semibold text-white bg-dessa-teal hover:bg-dessa-teal/90 transition-colors"
            >
              Apply
            </button>
            <button
              type="button"
              onClick={resetFilters}
              className="text-sm font-medium text-brand-subtext hover:text-brand-text transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function Resources() {
  const navigate = useNavigate()
  // 2026-08-26: manager picked 3C as the final direction for the mandatory
  // grade gate. The Nav switcher that let reviewers flip between 3A/3B/3C
  // via a `?concept=` param has been removed (see Nav.jsx), so `concept`
  // is now a hardcoded constant rather than read from the URL. 3A's and
  // 3B's JSX (below) are commented out rather than deleted — kept for our
  // own records in case either direction needs to be revisited — so this
  // stays 'c' rather than being removed outright.
  const concept = 'c'
  // New, separate design-review toggle (2026-08-26) — compares gate-screen
  // *background decoration* concepts via the Nav switcher's `?decor=`
  // param: A is the plain status quo (no visual assets), B is the masked
  // grid + floating type-icon tiles (GateBackdrop). C and D are reserved
  // for concepts not designed yet, so anything other than 'b' renders like
  // 'a' for now — see the `decorConcept === 'b'` check in GateFullPage.
  const [searchParams] = useSearchParams()
  const decorConcept = searchParams.get('decor') || 'a'
  const [search, setSearch] = useState('')
  const [query, setQuery] = useState('')
  const [selectedCategories, setSelectedCategories] = useState([])
  // A set of grades, driven by multiple controls that all read/write it: the
  // active gate concept's picker (GateFullPage — all confirm straight into
  // this), the sidebar's Grade facet for 3A (ordinary multi-select), and
  // 3B's Filter panel or 3C's Filters bar (both staged — see FilterPanel/
  // FilterBarC). Any
  // combination — e.g. just Grade 2 + Grade 4 — stays reachable after the
  // initial gate. Empty = nothing picked yet, which blocks all results
  // regardless of search (see `filtered` below).
  // If "Remember my choice" was checked on a previous visit, skip the gate
  // entirely and start already on the remembered grade(s) — applies to all
  // three concepts now that 3C shares 3A/3B's GateFullPage.
  const [selectedGrades, setSelectedGrades] = useState(() => {
    const remembered = loadRememberedGrades()
    return remembered ? remembered : []
  })
  // Tracks whether the current selectedGrades should be persisted — set from
  // the gate's "Remember my choice" checkbox on confirm, or true at mount if
  // a remembered value was just loaded above. Kept in sync with
  // selectedGrades by the effect below, so changing grades via the sidebar
  // (or clearing them via "Change grade") updates/clears storage too, not
  // just the gate's own confirm action.
  const [rememberGrades, setRememberGrades] = useState(() => loadRememberedGrades() !== null)
  const [selectedCompetencies, setSelectedCompetencies] = useState([])
  const [selectedTypes, setSelectedTypes] = useState([])
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(PAGE_SIZE)
  // Sort — drives the header "Sort" dropdown that sorts the card-list results.
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')
  const [sortMenuOpen, setSortMenuOpen] = useState(false)
  // Saved/starred resources — Map value is the representative resource, so
  // the sidebar panel can render + navigate without re-deriving it from
  // current filters. (Currently unreachable: the star button that adds to
  // this is commented out below, see "star button disabled for now".)
  const [savedKeys, setSavedKeys] = useState(() => new Map())

  function toggleSaved(e, key, representative) {
    e.stopPropagation()
    setSavedKeys((prev) => {
      const next = new Map(prev)
      if (next.has(key)) next.delete(key)
      else next.set(key, representative)
      return next
    })
  }

  // Keeps localStorage in sync with the current grades whenever
  // rememberGrades is on — not just at the moment the gate is confirmed —
  // so a later change via the sidebar facet updates what's remembered, and
  // clearing back to zero (e.g. via "Change grade") forgets it.
  useEffect(() => {
    if (!rememberGrades) return
    if (selectedGrades.length === 0) localStorage.removeItem(REMEMBERED_GRADES_KEY)
    else localStorage.setItem(REMEMBERED_GRADES_KEY, JSON.stringify(selectedGrades))
  }, [selectedGrades, rememberGrades])

  function confirmGrades(grades, remember) {
    setRememberGrades(remember)
    setSelectedGrades(grades)
  }

  // Scoped to selectedGrades first — with no grade picked yet there's
  // nothing to show, by design (a resource shared across grades never
  // surfaces that fact side by side in the same view), and search can't
  // bypass this: the manager's specific praise for Concept 3 was that grade
  // selection is mandatory *before* search, so an unpicked grade blocks
  // results regardless of query. An empty set otherwise means "no grade
  // constraint" — i.e. the explicit "All Grades" pick (every box checked).
  const q = query.trim().toLowerCase()
  const filtered = useMemo(() => {
    if (selectedGrades.length === 0) return []
    return resources.filter((r) =>
      selectedGrades.includes(r.grade) &&
      (!q || r.title.toLowerCase().includes(q)) &&
      (selectedCategories.length === 0 || selectedCategories.includes(r.category)) &&
      (selectedCompetencies.length === 0 || selectedCompetencies.includes(r.competency)) &&
      (selectedTypes.length === 0 || selectedTypes.includes(r.type))
    )
  }, [selectedGrades, q, selectedCategories, selectedCompetencies, selectedTypes])

  // The result set discloses grade (via divider rows, see showGradeDivider
  // below) whenever it can legitimately span more than one grade (0
  // selected, or 2+ selected via either control), OR whenever the selection
  // includes any pseudo value (PSEUDO_GRADES) even alone — those read as a
  // segment rather than an obviously-homogeneous single grade, so the
  // header row stays on to label them explicitly.
  const showGradeColumn = selectedGrades.length !== 1 || selectedGrades.some((g) => PSEUDO_GRADES.includes(g))

  // Reset to page 1 whenever the filter set or page size changes — adjusted
  // during render (not in an effect) so it takes effect in the same commit.
  const filterKey = JSON.stringify([selectedGrades, query, selectedCategories, selectedCompetencies, selectedTypes, pageSize])
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey)
  if (filterKey !== prevFilterKey) {
    setPrevFilterKey(filterKey)
    setPage(1)
  }

  const sortedFiltered = useMemo(() => {
    let result = filtered
    if (sortKey) {
      result = [...result].sort((a, b) => {
        let cmp = 0
        if (sortKey === 'title') cmp = displayTitle(a.title).localeCompare(displayTitle(b.title))
        else if (sortKey === 'type') cmp = TYPE_META[a.type].label.localeCompare(TYPE_META[b.type].label)
        else if (sortKey === 'competency') cmp = a.competency.localeCompare(b.competency)
        else if (sortKey === 'grade') cmp = ALL_GRADES.indexOf(a.grade) - ALL_GRADES.indexOf(b.grade)
        return sortDir === 'asc' ? cmp : -cmp
      })
    }
    // Multi-grade result sets cluster into "Grade X" divider rows (see
    // showGradeDivider below), which relies on same-grade rows being
    // contiguous — so grade always wins as the primary sort here. A stable
    // sort (guaranteed by spec) preserves whatever order the chosen sort
    // above already produced within each grade.
    if (showGradeColumn) {
      result = [...result].sort((a, b) => ALL_GRADES.indexOf(a.grade) - ALL_GRADES.indexOf(b.grade))
    }
    return result
  }, [filtered, sortKey, sortDir, showGradeColumn])

  const totalPages = Math.max(1, Math.ceil(sortedFiltered.length / pageSize))
  const pagedResults = sortedFiltered.slice((page - 1) * pageSize, page * pageSize)

  // Grade sort is only meaningful once rows can span more than one grade —
  // with a single grade selected every row already shares it.
  const sortOptions = [
    { key: null, dir: 'asc', label: 'Relevance' },
    { key: 'title', dir: 'asc', label: 'Title (A–Z)' },
    { key: 'title', dir: 'desc', label: 'Title (Z–A)' },
    { key: 'competency', dir: 'asc', label: 'Competency (A–Z)' },
    { key: 'type', dir: 'asc', label: 'Type (A–Z)' },
    ...(showGradeColumn ? [{ key: 'grade', dir: 'asc', label: 'Grade' }] : []),
  ]
  const activeSortLabel = sortOptions.find((o) => o.key === sortKey && (o.key === null || o.dir === sortDir))?.label
    ?? 'Sort'

  function renderSortMenu() {
    return (
      <Popover.Root open={sortMenuOpen} onOpenChange={setSortMenuOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="shrink-0 flex items-center gap-1.5 pl-2 pr-2 h-9 text-[13px] font-medium border border-brand-border rounded-md bg-white text-brand-text hover:bg-brand-bg transition-colors"
          >
            Sort: {activeSortLabel}
            <ChevronDown size={13} className="text-brand-subtext" />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="end"
            sideOffset={8}
            className="z-30 w-52 bg-white border border-brand-border rounded-xl shadow-lg outline-none overflow-hidden py-1"
          >
            {sortOptions.map((opt) => {
              const active = opt.key === sortKey && (opt.key === null || opt.dir === sortDir)
              return (
                <button
                  key={opt.label}
                  onClick={() => {
                    setSortKey(opt.key)
                    setSortDir(opt.dir)
                    setSortMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-sm text-left transition-colors ${
                    active ? 'text-dessa-teal font-semibold bg-dessa-tealLight' : 'text-brand-text hover:bg-brand-bg'
                  }`}
                >
                  {opt.label}
                  {active && <Check size={14} />}
                </button>
              )
            })}
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    )
  }

  // Drives the results card header's chip row — one read-only chip per
  // applied value across every facet (grade, course type, competency,
  // type). Removing a filter is done via the Filters card dropdowns above,
  // not from these chips. Order mirrors the Filters card's field order.
  const filterChips = [
    ...selectedGrades.map((g) => ({ key: `grade:${g}`, label: g })),
    ...selectedCategories.map((c) => ({ key: `cat:${c}`, label: c })),
    ...selectedCompetencies.map((c) => ({ key: `comp:${c}`, label: c })),
    ...selectedTypes.map((t) => ({ key: `type:${t}`, label: TYPE_META[t].label })),
  ]

  function clearAll() {
    setSearch('')
    setQuery('')
    setSelectedCategories([])
    setSelectedCompetencies([])
    setSelectedTypes([])
  }

  function submitSearch() {
    setQuery(search)
  }

  function openResource(r) {
    const course = courseFor(r)
    if (course) navigate('/mtw/lesson', { state: { course } })
  }

  const gateOpen = selectedGrades.length === 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-screen-xl mx-auto px-6 pb-16"
    >
      {/* 3A/3B/3C — all three use the same full-page gate; nothing else on
          the page mounts until a grade is confirmed, so there's no backdrop
          needed and no background content for one to interrupt. They
          diverge only in what renders after: 3A keeps the sidebar facets,
          3B moves filtering into a top-right Filter panel (full-width
          results), and 3C moves it into a full-width "Filters" expandable
          bar above the results entirely (see FilterPanel vs FilterBarC
          below). */}
      {gateOpen ? (
        <GateFullPage onConfirm={confirmGrades} defaultRemember={rememberGrades} decorConcept={decorConcept} />
      ) : (
      <>

      {/* Top bar — eBay-style: a compact search container, a category row
          directly beneath it, then the results content below that. Light
          gray instead of a bold hero color so it reads as a utility bar,
          not a banner. Search and categories are separate full-bleed bands
          so each gets its own edge-to-edge divider rather than one border
          shared (and visually mis-attributed) across both. */}
      {/* Sticky right under the nav (top-14 = nav's h-14) so the query stays
          visible while scrolling through a long results list. */}
      <div className="w-screen mx-[calc(50%-50vw)] bg-brand-bg border-b border-brand-border sticky top-14 z-40">
      <div className="max-w-screen-xl mx-auto px-6 pt-[1.35rem] pb-4">

        {/* Search — results list only updates on submit (Enter or the
            search button), not while typing. */}
        <div className="flex items-stretch gap-4">
        <div className="relative w-[500px] shrink-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
          <input
            type="text"
            placeholder="Search by competency, file type, or grade level"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                submitSearch()
              } else if (e.key === 'Escape') {
                e.currentTarget.blur()
              }
            }}
            className="w-full pl-10 pr-9 h-11 text-sm border border-brand-border rounded-full bg-white text-brand-text placeholder:text-brand-subtext focus:outline-none focus:ring-2 focus:ring-dessa-teal/25 focus:border-dessa-teal"
          />
          {search && (
            <button
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                setSearch('')
                setQuery('')
              }}
              aria-label="Clear search"
              className="absolute top-1/2 -translate-y-1/2 text-brand-subtext hover:text-brand-text transition-colors"
              style={{ right: 8 }}
            >
              <X size={15} />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={submitSearch}
          className="shrink-0 px-6 h-11 rounded-full text-sm font-semibold bg-dessa-teal text-white hover:bg-dessa-teal/90 transition-colors"
        >
          Search
        </button>
        </div>
      </div>
      </div>

      {/* 3C only — full-width "Filters" row sits above the grade heading and
          results entirely (see FilterBarC above), matching the reference
          screenshot's placement; 3B keeps its Filter button inline in the
          results card header instead (see below). */}
      {concept === 'c' && selectedGrades.length > 0 && (
        <div className="mt-6">
          <FilterBarC
            selectedGrades={selectedGrades}
            setSelectedGrades={setSelectedGrades}
            selectedCategories={selectedCategories}
            setSelectedCategories={setSelectedCategories}
            selectedCompetencies={selectedCompetencies}
            setSelectedCompetencies={setSelectedCompetencies}
            selectedTypes={selectedTypes}
            setSelectedTypes={setSelectedTypes}
          />
        </div>
      )}

      <div className={`flex gap-6 items-start ${concept === 'c' ? '' : 'mt-6'}`}>
        {/* 3B/3C have no sidebar at all — filtering moved into the top-right
            Filter panel (3B) or the full-width Filters bar above (3C) so
            results can go full width instead. */}
        {/* 3A — retired 2026-08-26 (manager chose 3C); kept for reference,
            not rendered now that `concept` is hardcoded to 'c'. The nested
            "Saved" comment this block already had is flattened to plain
            text below (its comment delimiters removed) so it doesn't
            prematurely close this outer comment.
        {concept === 'a' && (
        <div className="w-64 flex-shrink-0 flex flex-col gap-4 sticky top-[160px] max-h-[calc(100vh-178px)]">
          top-[160px] clears the now-sticky search bar band above it
          (56px nav + ~82px band) so the two don't overlap while scrolling.
          Facet rail — each section collapses so all four are always
          reachable without scrolling the results; capped height + internal
          scroll is a backstop in case everything is expanded at once.
          <div className="bg-white rounded-xl border border-brand-border overflow-y-auto">
            Ordinary multi-select facet — the active gate concept's picker
            is the entry point, but this lets any combination (e.g. just
            Grade 2 + Grade 4) get checked directly afterward. Both
            controls read/write selectedGrades.
            <FacetGroup
              title="Grade"
              options={SELECTABLE_GRADES}
              selected={selectedGrades}
              onToggle={(v) => toggle(setSelectedGrades, v)}
              scrollable
            />
            <FacetGroup
              title="Course Type"
              options={SELECTABLE_CATEGORIES}
              selected={selectedCategories}
              onToggle={(v) => toggle(setSelectedCategories, v)}
            />
            <FacetGroup
              title="Competency"
              options={ALL_COMPETENCIES}
              selected={selectedCompetencies}
              onToggle={(v) => toggle(setSelectedCompetencies, v)}
              defaultOpen={false}
            />
            <FacetGroup
              title="Type"
              options={TYPES.map((t) => TYPE_META[t].label)}
              selected={selectedTypes.map((t) => TYPE_META[t].label)}
              onToggle={(label) => toggle(setSelectedTypes, TYPES.find((t) => TYPE_META[t].label === label))}
            />
          </div>

          Saved/starred resources — commented out for now (disabled along
          with the star buttons that populate it; see "star button
          disabled for now" below).
          <div className="bg-white rounded-xl border border-brand-border p-4 overflow-y-auto">
            <p className="text-sm font-semibold text-brand-text mb-3">Saved</p>
            {savedKeys.size === 0 ? (
              <p className="text-xs text-brand-subtext leading-relaxed">
                Tap the star on any resource to save it here for quick access later.
              </p>
            ) : (
              <div className="flex flex-col gap-0.5">
                {[...savedKeys.entries()].map(([key, r]) => (
                  <div
                    key={key}
                    role="button"
                    tabIndex={0}
                    onClick={() => openResource(r)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') openResource(r)
                    }}
                    className="group w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left cursor-pointer hover:bg-brand-bg transition-colors"
                  >
                    <TypeIconBadge type={r.type} size={22} />
                    <span className="flex-1 min-w-0 text-xs font-medium text-brand-text truncate">{displayTitle(r.title)}</span>
                    <button
                      onClick={(e) => toggleSaved(e, key, r)}
                      aria-label="Remove from saved"
                      className="shrink-0 text-dessa-teal opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Star size={13} fill="currentColor" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        )}
        */}

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* No overflow-hidden here — an ancestor with overflow other than
              visible (even "hidden") constrains where a position:sticky
              descendant sticks, which is exactly what broke the grade
              divider's sticky-under-search behavior. The couple of spots
              that used to rely on this clipping (hover fill squaring off
              the card's rounded bottom corners) are rounded individually
              instead — see the last-row/last-header `isLastRow` handling
              below. */}
          <div className="rounded-2xl border border-brand-border bg-white">
            <div className="px-6 pt-6 pb-4 flex items-start justify-between gap-4">
              {/* Nothing to label before a grade is picked — the empty state
                  below already explains what to do, so this stays blank
                  rather than showing a generic "All resources" heading.
                  Replaces the old "N grades selected" summary text with one
                  read-only chip per applied filter (see filterChips above). */}
              {selectedGrades.length > 0 && (
              <div className="flex flex-wrap gap-2 flex-1">
                {filterChips.map((chip) => (
                  <FilterChip key={chip.key} label={chip.label} />
                ))}
              </div>
              )}
              {selectedGrades.length > 0 && (
                <div className="flex items-center gap-2 shrink-0">
                  {renderSortMenu()}
                  {/* 3B — retired 2026-08-26 (manager chose 3C); kept for
                      reference, not rendered now that `concept` is
                      hardcoded to 'c'.
                  {concept === 'b' && (
                    <FilterPanel
                      selectedGrades={selectedGrades}
                      setSelectedGrades={setSelectedGrades}
                      selectedCategories={selectedCategories}
                      setSelectedCategories={setSelectedCategories}
                      selectedCompetencies={selectedCompetencies}
                      setSelectedCompetencies={setSelectedCompetencies}
                      selectedTypes={selectedTypes}
                      setSelectedTypes={setSelectedTypes}
                    />
                  )}
                  */}
                </div>
              )}
            </div>

            {pagedResults.length === 0 ? (
              <div className="px-6 py-8 text-center">
                <img src="/Search/no-found.png" alt="" className="mx-auto h-64 w-auto mb-6" />
                <p className="text-lg font-semibold text-brand-text mb-1.5">No resources found</p>
                <p className="text-sm text-brand-subtext max-w-sm mx-auto mb-5">
                  We couldn't find any resources matching your search. Try adjusting your
                  keywords or clearing the filters.
                </p>
                <button
                  onClick={clearAll}
                  className="px-4 py-2 rounded-md text-sm font-semibold border border-brand-border text-brand-text hover:bg-brand-bg transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="border-t border-brand-border">
                {pagedResults.map((r, i) => {
                  // Grade divider row — a multi-grade result set clusters into
                  // "Grade X" divider rows instead of a per-row grade tag.
                  // Re-shown on every page (not just once per true group) so
                  // a page never opens mid-group with no grade context above
                  // it. Relies on sortedFiltered keeping same-grade rows
                  // contiguous (see showGradeColumn above).
                  const showGradeDivider = showGradeColumn && (i === 0 || pagedResults[i - 1].grade !== r.grade)
                  // Static, not sticky — an earlier sticky-under-search
                  // treatment (top-[160px]) kept overlapping content
                  // incorrectly, so this row just sits in normal flow like
                  // any other divider. Plain label, no collapse/chevron.
                  const isLastRow = i === pagedResults.length - 1
                  return (
                    <div key={r.id}>
                      {showGradeDivider && (
                        <div className="px-6 py-2 bg-brand-bg border-b border-brand-border text-xs font-semibold text-brand-text uppercase tracking-wide">
                          {r.grade}
                        </div>
                      )}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => openResource(r)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') openResource(r)
                        }}
                        className={`w-full flex flex-col gap-2 px-6 py-4 text-left hover:bg-brand-bg transition-colors cursor-pointer ${
                          isLastRow ? 'rounded-b-2xl' : 'border-b border-brand-border'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-[15px] font-semibold text-brand-text truncate">
                              {displayTitle(r.title)}
                            </p>
                            {/* Single meta line — unit and competency read
                                left-to-right in one scan instead of splitting
                                attention between a left-aligned title block
                                and a right-floating badge cluster. Grade never
                                appears inline here — any multi-grade result
                                set gets a divider row instead. */}
                            <p className="text-xs text-brand-subtext truncate mt-0.5">
                              {r.unitTitle}
                              {r.competency && <> · {r.competency}</>}
                            </p>
                          </div>
                          <TypeBadge type={r.type} />
                        </div>
                        {/* Flush left, spanning the icon's column too — not
                            indented to align under the title — so the row reads
                            as a compact header cluster with a full-width body
                            beneath it, rather than one uniformly dense block. */}
                        <p className="text-sm text-brand-subtext leading-relaxed line-clamp-2 max-w-[640px]">
                          {r.description}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="w-8 h-8 p-0 justify-center rounded-lg text-dessa-teal"
                    >
                      {''}
                    </PaginationPrevious>
                  </PaginationItem>
                  {pageWindow(page, totalPages).map((p, i) =>
                    p === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${i}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={p}>
                        <PaginationLink isActive={p === page} onClick={() => setPage(p)} className="w-9 h-9 rounded-lg">
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="w-8 h-8 p-0 justify-center rounded-lg text-dessa-teal"
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
                  {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-brand-subtext pointer-events-none" />
              </div>
            </div>
          )}
        </div>
      </div>
      </>
      )}
    </motion.div>
  )
}
