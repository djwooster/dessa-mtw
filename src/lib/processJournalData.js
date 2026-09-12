// Process Journal entries — a running, human-readable record of what got
// built, iterated on, shipped, or shelved on this prototype, so the designer
// can point to it live in a review instead of describing the process from
// memory. Written up from the actual session/conversation history (not raw
// git log — commit messages aren't meant for an outside audience), newest
// first. This is meant to grow over time as more work happens, not be a
// one-time historical dump — see MEMORY.md project notes for the full trail
// this was distilled from.
//
// Each entry can reference 1+ screenshots at
// `/public/process-journal/<id>/<n>.jpg` — none exist yet (this page was
// just built), so every entry currently renders the "not added yet"
// fallback. Drop real screenshots into that folder per id and they'll
// appear automatically, no code changes.

export const STATUSES = {
  shipped: { label: 'Shipped', color: 'text-state-success', bg: 'bg-state-successLight' },
  exploring: { label: 'Exploring', color: 'text-research-accent', bg: 'bg-research-accentTint' },
  shelved: { label: 'Shelved', color: 'text-gray-500', bg: 'bg-gray-100' },
}

export const PROCESS_JOURNAL_ENTRIES = [
  {
    id: 'resources-concept-switcher-unified',
    date: '2026-09-12',
    status: 'exploring',
    title: 'One switcher for every Resources concept',
    summary: 'Access to the Resources page concepts was split across a hover-only nav interaction and a separate sandbox link buried in the settings menu — no single place to compare them.',
    body: [
      'The Resources concept comparison had grown three different ways in: the live shipped page, a standalone /resources-concepts sandbox, and a nav-hover interaction that only worked for one specific concept. Comparing them meant knowing which door to use for which one.',
      'Folded everything into one A–D switcher living where the nav search icon used to be, visible from anywhere in the app. The sandbox route was retired entirely — its concepts now render inline on the real /resources page, keyed off the switcher state.',
      'Also added a 5th concept (E): a single paired "[Grade ▾] + search" field, testing whether grade selection needs to be a separate mandatory step at all, or can just be baked into the act of searching itself.',
    ],
    screenshots: [{ n: 1, alt: 'Nav switcher showing Concept E, paired grade + search field' }],
  },
  {
    id: 'resources-competitive-analysis',
    date: '2026-09-10',
    status: 'exploring',
    title: 'Sizing up the competition before rethinking Resources again',
    summary: 'Manager flagged Teachers Pay Teachers, Education.com, and LearningMole as handling grade/topic browsing well — worth a real look before designing another round from scratch.',
    body: [
      'Broke down each site\'s underlying pattern rather than just its visuals: TPT groups individual grades under school-level column headers in a hover mega-menu; Education.com nests grade under content type instead of leading with it; LearningMole skips a nav dropdown entirely in favor of a photographic age-card grid on the page itself.',
      'That research fed directly into a new resources-concepts sandbox comparing five ways to handle grade selection, from a search-hero landing to a nav-hover-only entry point with no page of its own.',
    ],
    screenshots: [{ n: 1, alt: 'Competitive analysis writeup, TPT grouped hover menu' }],
  },
  {
    id: 'resources-grade-gate-finalized',
    date: '2026-08-24',
    dateEnd: '2026-08-28',
    status: 'shipped',
    title: 'The Resources grade gate: three rounds to land on one',
    summary: 'Grade started as a filter you could ignore; ended as a mandatory, single-select gate — the pivot came from a specific stakeholder concern about implying content wasn\'t grade-specific.',
    body: [
      'Early version let you search across grades at once and grouped duplicate-looking results together. Feedback was that showing a resource as shared across grades reads as disillusioning to an educator at one specific grade level. Rebuilt so grade is a gate, not a filter: nothing renders until a grade is picked.',
      'Compared three presentations of that same mandatory gate (full-page takeover, anchored panel, banner preview) — manager liked the full-page version\'s directness. Then compared four background treatments for that gate screen; a left-aligned layout with a static scrolling row of sample resources won.',
      'Finished with a full redesign of the Filters bar (chip-style fields, staged Apply/Reset, search-within-dropdown) and the result row layout (competency promoted to its own badge, file type moved to an eyebrow above the title).',
    ],
    screenshots: [{ n: 1, alt: 'Finalized Resources grade gate, left-aligned with scrolling rows' }],
  },
  {
    id: 'curriculum-setup-bulk-edit-confirm',
    date: '2026-09-08',
    dateEnd: '2026-09-09',
    status: 'shipped',
    title: 'Bulk edits without a district-wide accident',
    summary: 'A Program Admin selecting every site and changing the weekly goal in one action had no confirmation step — a single misclick could silently overwrite every site\'s setting at once.',
    body: [
      'Added a confirmation modal that gates any bulk edit touching more than one site, showing exactly which sites are affected before committing. Also added a collapsible "Weekly Goal by Site" summary row so the full override table stays out of the way until someone actually needs it.',
      'The Site Leader\'s own Weekly Goal card got its own 3-concept comparison in the same pass, with the switcher living in the card\'s own header rather than the global nav — a first for this codebase.',
    ],
    screenshots: [{ n: 1, alt: 'Bulk-edit confirmation modal listing affected sites' }],
  },
  {
    id: 'adult-wellness-practice-badge',
    date: '2026-09-09',
    status: 'shipped',
    title: 'Giving Adult Wellness lessons a badge, not a box',
    summary: 'Feedback was that the Group/Independent practice-type indicator "felt lost" sitting in a box below the video — needed to move up without adding visual clutter to every lesson page.',
    body: [
      'Compared three placements: moving the existing box above the video, swapping it for a compact pill on the title row, and baking a small badge directly into the video/audio hero itself. The hero badge won — it reads as part of the media, not an extra element competing for attention.',
      'The lesson sidebar now also auto-groups any unit containing Community/Independent-labeled lessons into "Group Exercises" and "Independent Practice" folders automatically, with no manual per-unit flag required.',
    ],
    screenshots: [{ n: 1, alt: 'Adult Wellness lesson hero with practice-type badge' }],
  },
  {
    id: 'nav-reorg-reports-hub',
    date: '2026-08-16',
    status: 'shipped',
    title: 'A nav that finally matches the real app',
    summary: 'The prototype\'s top nav had drifted from the real production DESSA×MTW app\'s structure, making it a weaker stand-in for how the actual product is organized.',
    body: [
      'Reorganized the top nav to mirror production: Reports became its own hub page with a grouped sidebar (only two links are real — everything else is decorative, for visual fidelity), Settings and Brand Guide moved out of the main nav into an avatar dropdown, and the wordmark switched from the DESSA-only logo to the combined DESSA × MTW lockup.',
    ],
    screenshots: [{ n: 1, alt: 'Reorganized top nav with avatar dropdown menu' }],
  },
]
