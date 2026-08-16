// Class-level DESSA competency breakdown for Tara's class (30 students),
// mirroring the numbers on the Dashboard's Competency Breakdown table so the
// "insight" (need counts here) and the "impact" (recommended MTW content on
// the Ratings > Recommended Content view) tell one consistent story.
//
// `matchKey` is the exact competency string used in courseData.js — Personal
// Responsibility and Optimistic Thinking are DESSA-only competencies with no
// matching MTW course yet, so their matchKey is null and they're skipped by
// the recommendation engine rather than linking to unrelated content.
export const CLASS_COMPETENCY_DATA = [
  { abbr: 'SA', label: 'Self-Awareness', matchKey: 'Self-Awareness', strength: 6, typical: 20, need: 4 },
  { abbr: 'SM', label: 'Self-Management', matchKey: 'Self-Management', strength: 5, typical: 19, need: 6 },
  { abbr: 'SOC', label: 'Social Awareness', matchKey: 'Social Awareness', strength: 7, typical: 18, need: 5 },
  { abbr: 'RS', label: 'Relationship Skills', matchKey: 'Relationship Skills', strength: 5, typical: 22, need: 3 },
  { abbr: 'PR', label: 'Personal Responsibility', matchKey: null, strength: 8, typical: 17, need: 5 },
  { abbr: 'RD', label: 'Decision-Making', matchKey: 'Responsible Decision-Making', strength: 4, typical: 20, need: 6 },
  { abbr: 'OT', label: 'Optimistic Thinking', matchKey: null, strength: 6, typical: 18, need: 6 },
  { abbr: 'GD', label: 'Goal-Directed Behavior', matchKey: 'Goal-Directed Behavior', strength: 5, typical: 21, need: 4 },
]
