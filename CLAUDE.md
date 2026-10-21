# DESSA × MTW — Prototype Context

## What this is
High-fidelity browser prototype exploring how **DESSA** (educational assessment) and **MTW / Move This World** (SEL curriculum) can be unified into a single educator experience. Built for internal design review at Riverside Insights. Target reviewer: engineering manager.

Fidelity bar: **confident design exploration** — not a wireframe, not production. Think: polished enough to demonstrate UX decisions clearly.

---

## UX/UI quality bar
Treat every screen — including throwaway comparison concepts — as if a senior product/UX designer at an enterprise SaaS company built it: real rigor on contrast, spacing, layout, friction points, affordances, and error prevention/recovery, not just "does it look okay." Ground decisions in established practice:
- Nielsen Norman Group's 10 usability heuristics
- Apple HIG and Material Design for interaction/motion/density patterns
- WCAG 2.1 AA — this app serves educators across a wide age range, so accessibility is a requirement, not a nice-to-have
- Laws of UX (Fitts's Law, Hick's Law, etc.)
- Invoke the `ui-ux-pro-max` skill when building or reviewing UI

**Aesthetic direction:** tightening toward Notion/Linear — tighter density, thin borders over shadows, restrained color (brand color for actions/data points, not decoration) — with room for delight through motion and occasional warmer touches, not through flashier core interactions.

**Standing rules:**
- Don't patch a confusing interaction with adjacent explainer/caption text — if a control needs a sentence next to it to be understood, redesign the control instead.
- Don't invent a one-off hex or arbitrary Tailwind value for something the design system below already covers.

---

## Design system
A small, reusable set of styles — not exhaustive component coverage, just enough to stop text sizes/colors drifting into one-offs and to move quickly by drawing from these instead of inventing new values per screen.

**Typography** — built on the existing `brand-text`/`brand-subtext` tokens, no new colors needed for type:
| Role | Size / weight | Color | Use |
|---|---|---|---|
| H1 | 36px (`text-4xl`) semibold | `brand-text` | Page hero headline only |
| H2 | 24px (`text-2xl`) semibold | `brand-text` | Section headers |
| H3 | 18px (`text-lg`) semibold | `brand-text` | Card titles |
| Label | 12px (`text-xs`) medium or semibold, sentence case | `brand-subtext` | Facet titles, small labels, chips. Default for any small label |
| Eyebrow (rare) | 12px (`text-xs`) semibold, uppercase, tracking-wide | `brand-subtext` | Use sparingly, at most one per screen, only when a label truly needs to stand apart. Never for chips, tags or repeated labels |
| Table Header | 14px (`text-sm`) semibold, sentence case | `brand-text` on `brand-bg` | Table/list column headers (see `ui/table.jsx`'s `TableHeader`/`TableHead`) |
| Body | 14px (`text-sm`) regular | `brand-text` | Default UI copy, table cells |
| Body-large | 16px (`text-base`) regular | `brand-subtext` | Intro/subcopy sitting under a headline |
| Caption | 12px (`text-xs`) medium | `brand-subtext` | Timestamps, meta text, badge labels |

All caps with wide tracking reads busy when it repeats (2026-10-20, user feedback): default to sentence case for labels, chips and tags, and save the uppercase eyebrow for rare one-off moments.

Two text colors, full stop: `brand-text` (primary) and `brand-subtext` (secondary/muted). Don't reach for a third gray or a manually-darkened hex — for a disabled/placeholder feel, reduce opacity on `brand-subtext` instead of introducing a new shade.

**Color roles beyond brand/DESSA/MTW:**
- **State colors** (`state.error` / `state.warning` / `state.success` / `state.info`, each with a `*Light` tint) — added specifically for UI states like form validation and alerts, deliberately separate from the `dessa-green`/`dessa-blue`/`dessa-salmon` data-viz palette (which means strength/typical/need on charts, not error/warning/success — don't conflate the two).
- Brand color (`dessa-teal`, `mtw-amber`, etc.) is for actions and key data points, per the Notion/Linear direction above — not for decorating unrelated surfaces.

**Spacing & density** (Notion/Linear direction):
- Standard page container: `px-6` side padding, no max-width cap — same gutter Dashboard, Nav, and every other page uses, no exceptions (including hero/landing-style screens).
- Prefer `p-4`/`p-5` for card bodies over `p-6`+.
- Prefer a thin `border border-brand-border` over `shadow-md`/`shadow-lg` for resting-state surfaces; save real shadows for things that float above content (popovers, modals, dropdowns).
- Reuse Tailwind's default spacing scale (4px increments) rather than arbitrary pixel values.
- Row/card layouts that might render at more than one container width should use flexible, truncating widths (`flex-1 min-w-0` + `truncate`), not fixed pixel widths with `shrink-0` — fixed non-shrinking widths overflow instead of compressing.

**Buttons:**
- DESSA-context buttons: `rounded-md`. MTW-context buttons: `rounded-full`. This split is intentional (see brand personalities below) — don't unify the shape language across contexts.
- Default primary button (settled 2026-10-20 on Dashboard concept C): `h-9 px-4 gap-1 rounded-md text-sm font-semibold`, a 14px trailing chevron when it moves the user forward. Go larger only for a hero action (`h-10 px-5`).
- Default link button (2026-10-20): `inline-flex items-center gap-1.5 text-sm font-semibold text-dessa-teal`, a 14px trailing `ArrowRight`; on hover it turns `dessa-navy`, underlines (`underline-offset-4`) and the arrow nudges right (`translate-x-0.5`). Use it for a card's call to action, and keep the card itself static (no hover lift) so the link is the only interactive part.

**Motion & delight:**
- Page reveals `{opacity:0, y:8} → {opacity:1, y:0}`, card hover `{y:-2}` (existing Framer Motion conventions — keep using these as the baseline, don't invent new easing/timing per screen).
- Delight lives in *restrained* extra touches on top of that baseline — a friendlier empty state, a small celebratory moment on completion — not in flashier core interactions. If a motion choice makes a control feel less predictable or slower to use, it's not delight, it's friction.

---

## Design tokens — `tailwind.config.js`
Two brand personalities sharing one card shell (type scale and state colors are covered above, under Design system):

**DESSA** — cool, clinical, trustworthy
- Primary action: `dessa-teal` (#2A7F8F) — buttons use `rounded-md`
- Text/nav: `dessa-navy` (#1B2B4B)
- Data colors: `dessa-green` (strength), `dessa-blue` (typical), `dessa-salmon` (need)

**MTW** — warm, playful, energetic
- Primary brand: `mtw-amber` (#F5A623) — buttons use `rounded-full`
- Accent: `mtw-teal` (#2D7D78), `mtw-coral` (#E8653A)

**Shared**
- Page bg: `brand-bg` (#F0F2F5)
- Body text: `brand-text` (#1B2B4B)
- Muted text: `brand-subtext` (#6B7A8D)
- Card border: `brand-border` (#E2E6EA)
- State colors: `state-error`/`state-warning`/`state-success`/`state-info` (+ `*Light` tints) — form validation, alerts, toasts. See Design system above for why these are kept separate from the data-viz palette.

---

## Persona
**Tara** — educator who uses MTW 3×/week and DESSA 3×/year. Uses the prototype as her daily home base.

---

## Key product decisions (captured)
- **MTW lives under its own "MTW" nav item** — not mixed into the main DESSA navigation. The nav item uses standard styling (same as all other nav items — no amber tinting on the label itself). Amber (`#F5A623` / `mtw-amber`) appears only as accent inside the MTW pages: enrolled badge, bookmark count badge, sidebar active-unit indicator, main activity left border.
- **Dashboard = DESSA home** with a compact top strip for "Continue Today's Lesson" (MTW CTA), then DESSA ratings widget, classroom strategies, and competency breakdown
- **Dashboard content mirrors the real DESSA dashboard**: My Student's DESSA Ratings (pie chart), Try These Classroom Strategies (two sample cards), Student Competency Breakdown (stacked bar per competency)
- Ratings page = district-level (9,895 students). Dashboard pie = single class (30 students, Tara's).
- Optimistic Thinking is shown as the 6th (new) DESSA competency — appears in curriculum with a "NEW" badge and in the competency breakdown
- Lesson view navigates back to `/mtw`, not `/curriculum`

---

## Screens still needed (future iterations)
- `/insights` — Data & Insights (currently placeholder)
- `/strategies` — Strategy Library browse view
- Login / onboarding flow
- Student detail / individual rating view
