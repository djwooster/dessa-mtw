# Resources Concepts — User Testing Script

Moderator script for live/remote sessions comparing Resources concepts A–E
(`/resources`). One participant runs through all five concepts; you read the
tasks aloud and note reactions. Not a self-guided flow — you're moderating
and asking questions as they go.

## Before the session

- Reload the app fresh (`resourcesConcept` and the results-view/filter-
  mechanic toggles are in-memory state, not persisted — a reload resets
  everyone to Concept A, List view, Bar filters).
- Decide the concept order for this participant and rotate it across
  participants (A first each time is fine as a baseline anchor, but don't
  always run B→C→D→E in the same order after that — later concepts benefit
  from the participant already knowing the content, which unfairly favors
  whichever concept goes last).
- Have this doc open on your own screen, not the participant's.

## What to say up front

> "You teach [grade — pick one relevant to the task below]. I'm going to show
> you a few different versions of a resource library your school might use.
> For each one, I'll give you something to find. Talk through what you're
> looking at and what you'd click — there's no wrong answer, we're testing
> the design, not you."

## How to switch concepts

The A/B/C/D/E buttons live in the top nav, top-right, next to the help icon
(tooltip on hover shows the full concept name). Clicking a letter doesn't
navigate anywhere **except D**, which also jumps to the Dashboard — that's
intentional, since D's whole premise is that hovering "Resources" in the nav
from anywhere is the only way in. For A/B/C/E, click the letter, then
navigate to `/resources` yourself (or ask the participant to click
"Resources" in the nav).

## Per-concept task flow

Run both tasks below for every concept in scope (A, B, C, D, E). Task 1 is
the happy path; Task 2 is a deliberate dead end — the grade/competency
combo you'll give them genuinely has zero matching resources in every
concept. That's not a bug to work around; it's there on purpose so you can
watch how each concept handles "nothing found."

**Entry, per concept:**
- **A** — go to `/resources` directly.
- **B** — go to `/resources`; everything (sidebar filters + results) is
  visible immediately, no gate.
- **C** — go to `/resources`; a grade-card grid is the landing screen, click
  a grade card to enter.
- **D** — after clicking "D" in the switcher (which jumps you to the
  Dashboard), hover "Resources" in the nav and pick a grade from the flyout.
- **E** — go to `/resources`; grade lives inside the search field itself (a
  chip on the right edge) — type, or pick the chip, then submit.

**Task 1 — Happy path**
> "Find a [type] resource for [grade] on [topic]."

Use the table below for a combo that's verified to actually return results
in that concept's data (A pulls from the real curriculum; B/C/D/E share one
mocked catalog — the content is genuinely different between the two, so
don't expect the same title to show up in both halves).

| Concept | Say this | What they should land on |
|---|---|---|
| A | "Find a video lesson for Grade 3." | Any Grade 3 (Self-Awareness) video lesson — every grade has video content. |
| B/C/D/E | "You teach 3rd grade. Find a worksheet on relationship skills, like active listening." | "Active Listening Worksheet" |

Probe after: How did you get there? Did the path make sense? Anything you
expected to see that wasn't there?

**Task 2 — Deliberate dead end**
> "Now find a [competency] resource for [grade]."

| Concept | Say this | Expected result |
|---|---|---|
| A | "Now find a Relationship Skills resource for Grade 3." | Zero results — Grade 3 only ever maps to Self-Awareness in the real curriculum. |
| B/C/D/E | "Now find a Relationship Skills resource for 12th grade." | Zero results — no 12th-grade row in the mock catalog is tagged Relationship Skills. |

Probe after: What did you expect to happen? Is it clear why nothing showed
up? Do they know what to do next (clear filters, try a different grade)?
Does the empty state feel like an answer, or like something broke?

## After all five concepts

- Which version got you to a specific resource fastest?
- Which felt most trustworthy / production-ready?
- Was there a concept where you got stuck, or weren't sure what to do next?
- If you could combine parts of two concepts, which parts?

## Known limitations — don't let these surprise you mid-session

- **Rows and cards in B/C/D/E's results (List and Cards views) don't open
  anything when clicked.** They're styled as clickable (hover state,
  pointer cursor) but there's no destination wired up yet. If a participant
  tries to click into a result to "open" it, that's expected to do nothing
  right now — worth noting as a reaction, not something to troubleshoot live.
- Search behavior differs by concept: B, C, and E's search fields filter by
  title text; D has no search field at all (browse-only, by design).
- Content is real curriculum data in A, but a small hand-authored 22-item
  mock catalog in B/C/D/E — don't expect the same resource to exist by the
  same name in both places.
