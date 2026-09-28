// Todo checklist data (2026-09-25) — the open-items counterpart to
// processJournalData.js. Decisions, tradeoffs, and the "why" behind
// finished work live in the Journal tab; this stays a plain checklist of
// what's still open, so it doesn't drift back into a narrative log.
//
// Each item has a stable `id` — ProcessJournalTodo.jsx persists checked
// state to localStorage keyed by id, so items must keep the same id across
// edits or they'll silently "forget" whether they were checked.

export const TODO_SECTIONS = [
  {
    title: 'Engagement Reports',
    note: 'Standing priority since Sept 23: make Site Engagement and Daily Curriculum Engagement (DCE) both intuitive. Site Engagement (Concepts A–E) has been through a full rework grounded in real user feedback; DCE work is just getting started. A "combine both into one report" idea is on the table but deliberately on hold until DCE’s own metrics are solid.',
    items: [
      { id: 'site-eng-daterange-dropdown', text: 'Nail down what\'s actually wrong with the Site Engagement date-range dropdown', note: 'Flagged twice, no specifics given either time.' },
      { id: 'site-eng-overlay-refine', text: 'Refine the Site Engagement per-site detail overlay (Concept E)', note: 'Layout and data both need another pass after live review.' },
      { id: 'site-eng-trend-shape', text: 'Confirm the district trend chart\'s new shape reads well', note: 'The Fall Challenge peak and winter dip haven\'t been explicitly signed off on yet.' },
      { id: 'dce-review-feedback', text: 'Review DCE user feedback, then settle its core metrics', note: 'What "engagement" should mean, whether Engagement (YTD) should be a real computed number instead of hardcoded, the headline KPI cards, column wording, and dropping the old red/amber/green styling.' },
      { id: 'idea-shrink-e-chart', text: 'Idea, not scoped: shrink Concept E\'s chart to sit beside its table', note: 'Google Finance-style compact layout — logged for later, not committed to.' },
    ],
  },
  {
    title: 'Other open threads',
    items: [
      { id: 'curriculum-setup-winner', text: 'Curriculum Setup (AP-4933): pick a winner between Concepts A/B/C', note: 'For both the admin table and the Site Leader card.' },
      { id: 'lesson-search-4th-concept', text: 'Lesson screen search: scope the 4th concept', note: 'Planned but not yet described.' },
      { id: 'resources-demo-resource', text: 'Resources: decide on a demo resource tagged "All Grades"/"Pre-K"', note: 'So those filter pills aren\'t dead ends on the live page. Asked repeatedly, never answered.' },
      { id: 'resources-clear-filters', text: 'Resources: scope a "Clear all filters" mechanism', note: 'Logged as an idea, not yet designed.' },
      { id: 'repo-cleanup', text: 'Repo cleanup: commented-out code and possibly-unnecessary files', note: 'Explicitly deferred — next session, not this one.' },
    ],
  },
]
