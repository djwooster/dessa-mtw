# DESSA × MTW — Prototype Context

## What this is
High-fidelity browser prototype exploring how **DESSA** (educational assessment) and **MTW / Move This World** (SEL curriculum) can be unified into a single educator experience. Built for internal design review at Riverside Insights. Target reviewer: engineering manager.

Fidelity bar: **confident design exploration** — not a wireframe, not production. Think: polished enough to demonstrate UX decisions clearly.

---

## Tech stack
- **React + Vite** — `npm run dev` to start, `npm run build` for Vercel deploy
- **Tailwind CSS v3** — custom palette only, no default Tailwind colors used
- **Framer Motion** — page reveals `{opacity:0, y:8}→{opacity:1, y:0}`, card hover `{y:-2}`
- **React Router v6** — all data is hardcoded/mocked, no backend
- **react-day-picker v9** + **date-fns** — calendar/date picker components
- **@radix-ui/react-slider** — range slider component
- **@radix-ui/react-popover** — installed, available for use

## shadcn-style UI components
No `components.json` — components are added manually to `src/components/ui/` and styled with project tokens (not shadcn defaults). Existing components:
- `card.jsx` — Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter
- `table.jsx`, `tabs.jsx` — base layout primitives
- `calendar.jsx` — DayPicker v9 wrapper, uses `captionLayout="dropdown"`, styled with `dessa-teal`
- `date-picker.jsx` — button + Calendar popover, value/onChange use `YYYY-MM-DD` strings
- `pagination.jsx` — Previous/Next/Link/Ellipsis buttons, styled with `dessa-teal` for active page
- `slider.jsx` — Radix dual-handle range slider, track in `dessa-teal`

---

## Routes
| Path | Screen |
|---|---|
| `/` | Dashboard (Educator Home) |
| `/ratings` | DESSA Ratings |
| `/mtw` | MTW Curriculum — design proposal A (`Curriculum.jsx` + `LessonView.jsx`) |
| `/mtw/lesson` | MTW Lesson View A |
| `/mtw2` | MTW Curriculum — design proposal B (`CurriculumV2.jsx` + `CourseOverviewV2.jsx` + `LessonViewV2.jsx`) |
| `/mtw2/course` | MTW Course Overview B (intermediate screen between library and lesson) |
| `/mtw2/lesson` | MTW Lesson View B |
| `/mtw4` | MTW Curriculum — design proposal D (`CurriculumV4.jsx` + `LessonViewV4.jsx`) |
| `/mtw4/lesson` | MTW Lesson View D |
| `/report1` | Admin: Teacher Engagement Dashboard (Concept A active; B and C commented out) |
| `/insights` | Data & Insights (placeholder) |
| `/strategies` | Strategies (placeholder) |

---

## Design tokens — `tailwind.config.js`
Two brand personalities sharing one card shell:

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

## MTW design proposals — what each one explores

All three proposals share the same course library card design (6 courses, grade-level tabs, Enroll/Continue/Unenroll flow). The primary difference being evaluated is **lesson view navigation architecture**:

**Proposal A (`/mtw`)** — Flat: course library → lesson view directly. Sidebar shows current unit's lessons only. Active lesson uses `dessa-teal` left border. Back goes to `/mtw`.

**Proposal B (`/mtw2`)** — Hierarchical: course library → **course overview page** → lesson view. The course overview (`CourseOverviewV2`) is a standalone screen: course header card, overall progress %, and a full unit accordion (all units collapsible, shows lesson completion). Sidebar in lesson view shows current unit's lessons only. Back goes to `/mtw2/course`.

**Proposal C (`/mtw3`)** — Full sidebar: course library → lesson view directly, but the sidebar shows **all 36 units** in a collapsible accordion. Active unit has an amber left border and bold label; selected lesson highlighted with `bg-mtw-amberLight rounded-lg`. A **drawer overlay** ("Show all lessons / Hide lessons") slides over the lower units to keep focus on the active unit while still allowing full curriculum access. Back goes to `/mtw3`.

---

## File structure
```
src/
  components/
    Nav.jsx             — persistent top nav, sticky
  pages/
    Dashboard.jsx       — educator home (DESSA-forward + MTW CTA strip)
    Curriculum.jsx      — MTW course library, proposal A (/mtw)
    LessonView.jsx      — MTW lesson view, proposal A (/mtw/lesson)
    CurriculumV2.jsx    — MTW course library, proposal B (/mtw2)
    CourseOverviewV2.jsx — MTW course overview, proposal B (/mtw2/course)
    LessonViewV2.jsx    — MTW lesson view, proposal B (/mtw2/lesson)
    CurriculumV4.jsx    — MTW course library, proposal D (/mtw4)
    LessonViewV4.jsx    — MTW lesson view, proposal D (/mtw4/lesson)
    Report1.jsx         — Admin engagement dashboard (/report1)
    Ratings.jsx         — DESSA ratings, timeline, grade bar chart
    BrandGuide.jsx      — design system reference (/brand)
  components/
    Nav.jsx             — persistent top nav, sticky
    ui/                 — shadcn-style components (manual, no components.json)
      calendar.jsx, date-picker.jsx, pagination.jsx, slider.jsx
      card.jsx, table.jsx, tabs.jsx
  lib/
    utils.js            — cn() helper (clsx + tailwind-merge)
    mtwData.js          — shared units/lessons data (proposals A and B)
    reportData.js       — 12 teachers, 3 schools, 20 school days (Mar 24–Apr 18 2026) + ytdPct per teacher (140 school days YTD)
```

---

## Admin report — `/report1`
Polished admin dashboard for Site Leaders / Program Admins. Based on a Jira ticket: "Daily Curriculum Engagement Report." Concepts B and C are commented out in the JSX — only Concept A is rendered.

**Layout (top to bottom):**
1. Page header — title, date range, Options menu (export CSV / print)
2. Stat cards (3) — Active this week · 4-week engagement rate · Lesson days per week
3. Table card — toolbar (legend · search · school filter · Filters panel) → sortable rows → footer (range label + pagination)

**Table columns:** # · Teacher · Last 4 Wks (% + bar) · Engagement YTD (% + bar, 140 school days) · Last Active (Today / Nd plain text)

**Expandable row:** 3-month calendar (prev/next nav, Sep 2025–Apr 2026) + summary stats (4-wk rate, days with access, weeks with access, last active)

**Filters panel** (right of school dropdown):
- Date range — two `DatePicker` fields (From / To), filters on active days within range
- 4-Week Engagement — dual-handle `Slider` (0–100%, step 5%)
- Active filter count badge on button; "Clear all filters" when active

**Engagement levels:** `d` deep (5+ min) · `a` active (1–5 min) · `b` brief (<1 min) · `n` none. Fill patterns (solid/stripes/dots/outline) used in heatmap (Concept B, commented out).

**Data:** `reportData.js` — 12 teachers, 3 schools (Riverside Elementary, Oakwood Middle, Summit Academy), 20 school days Mar 24–Apr 18 2026. Each teacher has `ytdPct` (school-year engagement %, 140-day denominator) — values tell a story (e.g. Garcia high YTD but dropping off recently; Harris low YTD but improving).

## Screens still needed (future iterations)
- `/insights` — Data & Insights (currently placeholder)
- `/strategies` — Strategy Library browse view
- Login / onboarding flow
- Student detail / individual rating view
