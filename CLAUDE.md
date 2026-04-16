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
| `/mtw3` | MTW Curriculum — design proposal C (`CurriculumV3.jsx` + `LessonViewV3.jsx`) |
| `/mtw3/lesson` | MTW Lesson View C |
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
    Curriculum.jsx      — MTW course library, proposal A (accessed via /mtw)
    LessonView.jsx      — MTW lesson view, proposal A (accessed via /mtw/lesson)
    CurriculumV2.jsx    — MTW course library, proposal B (accessed via /mtw2)
    CourseOverviewV2.jsx — MTW course overview, proposal B (accessed via /mtw2/course)
    LessonViewV2.jsx    — MTW lesson view, proposal B (accessed via /mtw2/lesson)
    CurriculumV3.jsx    — MTW course library, proposal C (accessed via /mtw3)
    LessonViewV3.jsx    — MTW lesson view, proposal C (accessed via /mtw3/lesson)
    Ratings.jsx         — DESSA ratings, timeline, grade bar chart
    BrandGuide.jsx      — design system reference (accessed via /brand)
  lib/
    utils.js            — cn() helper (clsx + tailwind-merge)
    mtwData.js          — shared units/lessons data (used by proposals A and B)
```

---

## Screens still needed (future iterations)
- `/insights` — Data & Insights (currently placeholder)
- `/strategies` — Strategy Library browse view
- Login / onboarding flow
- Student detail / individual rating view
