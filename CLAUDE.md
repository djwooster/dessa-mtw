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
| `/mtw` | MTW Curriculum (course library) |
| `/mtw/lesson` | Individual Lesson View |
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
- **MTW lives under its own "MTW" nav item** (last in nav, amber-tinted label) — not mixed into the main DESSA navigation
- **Dashboard = DESSA home** with a compact top strip for "Continue Today's Lesson" (MTW CTA), then DESSA ratings widget, classroom strategies, and competency breakdown
- **Dashboard content mirrors the real DESSA dashboard**: My Student's DESSA Ratings (pie chart), Try These Classroom Strategies (two sample cards), Student Competency Breakdown (stacked bar per competency)
- Ratings page = district-level (9,895 students). Dashboard pie = single class (30 students, Tara's).
- Optimistic Thinking is shown as the 6th (new) DESSA competency — appears in curriculum with a "NEW" badge and in the competency breakdown
- Lesson view navigates back to `/mtw`, not `/curriculum`

---

## File structure
```
src/
  components/
    Nav.jsx           — persistent top nav, sticky
  pages/
    Dashboard.jsx     — educator home (DESSA-forward + MTW CTA strip)
    Curriculum.jsx    — MTW course library (accessed via /mtw)
    LessonView.jsx    — individual lesson with sidebar + tabs
    Ratings.jsx       — DESSA ratings, timeline, grade bar chart
  lib/
    utils.js          — cn() helper (clsx + tailwind-merge)
```

---

## Screens still needed (future iterations)
- `/insights` — Data & Insights (currently placeholder)
- `/strategies` — Strategy Library browse view
- Login / onboarding flow
- Student detail / individual rating view
