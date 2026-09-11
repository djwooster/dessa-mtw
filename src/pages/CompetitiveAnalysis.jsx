import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Quote, Compass, MousePointerClick, LayoutGrid, GitCompare, ArrowRight, Lightbulb,
} from 'lucide-react'

// ─── Competitive Analysis ──────────────────────────────────────────────────
// Editorial one-off page (2026-09-10), sibling to /user-feedback — same
// black/white/research-accent palette and section-rail layout, since this
// is also a document the designer shares with their manager rather than a
// product surface. Screenshots referenced below (TPT, Education.com,
// LearningMole) are placeholders: <img> + onError fallback showing the
// expected filename, so dropping the real PNG into
// public/competitive-analysis/ requires zero code changes.

const SECTIONS = [
  { id: 'context', num: '01', label: 'Why we’re looking outside' },
  { id: 'tpt', num: '02', label: 'Teachers Pay Teachers' },
  { id: 'educationcom', num: '03', label: 'Education.com' },
  { id: 'learningmole', num: '04', label: 'LearningMole' },
  { id: 'synthesis', num: '05', label: 'Patterns worth testing' },
  { id: 'more', num: '06', label: 'Other examples to consider' },
]
const SECTION_IDS = SECTIONS.map((s) => s.id)

function useScrollSpy() {
  const [activeId, setActiveId] = useState(SECTION_IDS[0])
  useEffect(() => {
    const elements = SECTION_IDS.map((id) => document.getElementById(id)).filter(Boolean)
    if (elements.length === 0) return
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveId(entry.target.id)
        })
      },
      { rootMargin: '-15% 0px -70% 0px', threshold: 0 }
    )
    elements.forEach((el) => observer.observe(el))
    return () => observer.disconnect()
  }, [])
  return activeId
}

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

const reveal = (i = 0) => ({
  initial: { opacity: 0, y: 8 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: '-60px' },
  transition: { duration: 0.4, delay: i * 0.05 },
})

function SectionRail({ sections, activeId, onNavigate }) {
  return (
    <nav className="hidden lg:block self-start sticky top-14 h-[calc(100vh-3.5rem)] w-64 shrink-0 bg-black">
      <div className="min-h-full flex flex-col justify-center px-10 py-12">
        <ul className="relative border-l border-white/15 space-y-7">
          {sections.map((s) => {
            const isActive = s.id === activeId
            return (
              <li key={s.id} className="relative pl-6 -ml-px">
                <button
                  type="button"
                  onClick={() => onNavigate(s.id)}
                  className="flex flex-col items-start text-left group w-full"
                >
                  {isActive ? (
                    <motion.span
                      layoutId="caRailActiveDot"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-research-accent"
                    />
                  ) : (
                    <span className="absolute -left-[5px] top-1 w-2.5 h-2.5 rounded-full bg-black border border-white/25 group-hover:border-white/50 transition-colors" />
                  )}
                  <span className="font-sans text-[10px] uppercase tracking-wider text-white/35">{s.num}</span>
                  <span
                    className={`font-sans text-sm transition-colors ${
                      isActive ? 'text-white font-semibold' : 'text-white/40 group-hover:text-white/70'
                    }`}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}

function Kicker({ children }) {
  return (
    <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-research-accent mb-3">
      {children}
    </p>
  )
}

function SectionNumber({ n, eyebrow, title }) {
  return (
    <div className="relative mb-8 pt-4">
      <span
        aria-hidden
        className="absolute -top-2 -left-1 font-sans font-black text-black/[0.05] text-[100px] sm:text-[130px] leading-none select-none pointer-events-none"
      >
        {n}
      </span>
      <div className="relative">
        <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-research-accent mb-2">
          {eyebrow}
        </p>
        <h2 className="font-sans text-2xl font-semibold text-black">{title}</h2>
      </div>
    </div>
  )
}

function Section({ children, className = '' }) {
  return <section className={`max-w-3xl ${className}`}>{children}</section>
}

function PullQuote({ children }) {
  return (
    <div className="my-6 pl-6 border-l-2 border-research-accent">
      <p className="font-sans font-semibold text-xl md:text-2xl text-black leading-snug">
        {children}
      </p>
    </div>
  )
}

// Screenshot placeholder: shows the real image once it exists at
// public/competitive-analysis/<file>; until then, falls back to a bordered
// box naming the expected filename so there's zero code to change later.
function Screenshot({ file, alt }) {
  const [failed, setFailed] = useState(false)
  if (failed) {
    return (
      <div className="border border-dashed border-gray-300 rounded-lg bg-gray-50 aspect-[16/9] flex flex-col items-center justify-center gap-2 px-6 text-center">
        <p className="font-sans text-sm text-gray-400">Screenshot not added yet</p>
        <code className="font-mono text-xs text-gray-500 bg-gray-100 border border-gray-200 rounded px-2 py-1">
          public/competitive-analysis/{file}
        </code>
      </div>
    )
  }
  return (
    <img
      src={`/competitive-analysis/${file}`}
      alt={alt}
      onError={() => setFailed(true)}
      className="w-full rounded-lg border border-gray-200"
    />
  )
}

function PatternBadge({ children }) {
  return (
    <span className="inline-flex items-center gap-1.5 font-sans text-xs font-semibold uppercase tracking-wider text-research-accent bg-research-accentTint rounded-full px-3 py-1">
      <MousePointerClick size={12} />
      {children}
    </span>
  )
}

// One full site walkthrough: screenshot, what the pattern is, what's
// notable about it, and how it might apply back to our own product.
function SiteWalkthrough({ id, num, site, source, pattern, screenshot, notable, application }) {
  return (
    <motion.div id={id} className="scroll-mt-24" {...reveal(1)}>
      <Section className="max-w-none">
        <SectionNumber n={num} eyebrow={source} title={site} />
        <div className="mb-4">
          <PatternBadge>{pattern}</PatternBadge>
        </div>
        <div className="grid md:grid-cols-5 gap-8">
          <div className="md:col-span-3">
            <Screenshot file={screenshot.file} alt={screenshot.alt} />
          </div>
          <div className="md:col-span-2 space-y-5">
            <div>
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">What&rsquo;s notable</p>
              <ul className="space-y-2">
                {notable.map((point, i) => (
                  <li key={i} className="font-sans text-sm text-gray-700 leading-relaxed flex gap-2">
                    <span className="text-research-accent mt-1.5 w-1 h-1 rounded-full bg-research-accent shrink-0" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="border border-gray-200 rounded-lg p-4">
              <p className="font-sans text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">How it could apply to us</p>
              <p className="font-sans text-sm text-black leading-relaxed">{application}</p>
            </div>
          </div>
        </div>
      </Section>
    </motion.div>
  )
}

const SITES = [
  {
    id: 'tpt',
    num: '02',
    site: 'Teachers Pay Teachers',
    source: 'teacherspayteachers.com',
    pattern: 'Hover mega-menu — grouped',
    screenshot: { file: 'tpt-grade-dropdown.png', alt: 'Teachers Pay Teachers grade dropdown, grouped by school level' },
    notable: [
      '"Grade" sits as one of several equal top-level nav items (alongside Resource type, Seasonal, ELA, Math, Science…) — grade isn’t a gate you have to pass, just one facet among many.',
      'The dropdown groups individual grades under three column headers — Elementary, Middle school, High school — so a teacher finds their zone before drilling into an exact grade.',
      '"Adult education" is tucked into the High school column as a fourth, deliberately-separate entry rather than forced into the grade sequence.',
    ],
    application: 'We already have this grouping in our data (Early Elementary / Late Elementary / Middle School / High School bands were removed from the grade gate a few weeks ago as unreachable clutter) — TPT’s structure is a real precedent for bringing that grouping back, just as dropdown column headers instead of selectable pills.',
  },
  {
    id: 'educationcom',
    num: '03',
    site: 'Education.com',
    source: 'education.com',
    pattern: 'Hover mega-menu — flat',
    screenshot: { file: 'education-com-worksheets-dropdown.png', alt: 'Education.com worksheets dropdown, flat grade list' },
    notable: [
      'Grade lives nested one level under a content-type nav item ("Worksheets"), not as its own top-level facet — the reverse of TPT’s hierarchy.',
      'The dropdown is a plain 2-column grid (Pre-K through 8th) with no school-level grouping — every grade gets equal visual weight.',
      'Simpler to scan for someone who already knows their grade, at the cost of losing the "find your zone first" shortcut TPT’s grouping gives.',
    ],
    application: 'Raises a real hierarchy question for us: today’s Resources page leads with grade (a mandatory gate) before you ever see content type. Education.com’s structure — content-type first, grade second — is a well-adopted alternative worth testing, not just a variation on presentation.',
  },
  {
    id: 'learningmole',
    num: '04',
    site: 'LearningMole',
    source: 'learningmole.com',
    pattern: 'Visual card grid',
    screenshot: { file: 'learningmole-age-cards.png', alt: 'LearningMole "Suited for All Ages" card grid' },
    notable: [
      'No nav dropdown at all — age-based browsing happens through a photographic card section ("Suited for All Ages") sitting in the page body.',
      'Four large cards, each an age range (3–5, 5–7, 7–9, 9–11) with a photo and a "View Resource" button — reads warmer and more human than a text dropdown.',
      'Trade-off: it’s bound to wherever that section is placed on the page (here, the homepage), not globally reachable from every screen the way a nav item is.',
    ],
    application: 'A genuine alternative to a hover menu for us — could work as a browse entry point on the Resources landing/empty state (grade cards with imagery) rather than, or alongside, a nav-level dropdown or the grade-pill gate we have today.',
  },
]

const MORE_EXAMPLES = {
  education: [
    { name: 'Khan Academy', note: 'combines subject and grade into one mega-nav rather than treating them as separate facets' },
    { name: 'Newsela', note: 'topic browsing paired with a reading-level (Lexile) filter, relevant to how we handle competency + grade together' },
    { name: 'CommonLit', note: 'skill-based and grade-based filters presented as equal, combinable facets rather than a sequential gate' },
    { name: 'Scholastic Teachables / ReadWriteThink / PBS LearningMedia', note: 'other high-traffic teacher-resource sites worth a pass if the team wants a broader sample' },
  ],
  otherIndustries: [
    { name: 'Nike / REI (e-commerce mega-menus)', note: 'category × size × gender hover nav — closest non-education analog to TPT’s grouped dropdown' },
    { name: 'Netflix (row-based browse)', note: 'genre/mood rows of visual cards — same family as LearningMole’s age cards, just at much larger scale' },
    { name: 'Notion / Figma Community (template galleries)', note: 'browse-by-use-case card grid, closer to how educators might think in terms of "what am I trying to do" rather than "what grade am I"' },
    { name: 'Airbnb / LinkedIn Jobs (filter panels)', note: 'staged, multi-facet filter panel — relevant precedent for the Filters card work already done on /resources' },
  ],
}

export default function CompetitiveAnalysis() {
  const activeId = useScrollSpy()

  return (
    <div className="flex bg-white min-h-[calc(100vh-3.5rem)]">
      <SectionRail sections={SECTIONS} activeId={activeId} onNavigate={scrollToSection} />
      <div className="flex-1 max-w-5xl mx-auto px-6 md:px-10 py-16">
        <div className="space-y-20">
          {/* ── Masthead ── */}
          <motion.div {...reveal(0)}>
            <Kicker>Competitive Analysis · Draft</Kicker>
            <h1 className="font-sans text-[34px] font-semibold text-black leading-[1.2] max-w-3xl">
              How do other resource libraries help teachers browse?
            </h1>
            <p className="font-sans text-lg text-gray-500 mt-5 max-w-2xl">
              A look at three teacher-resource sites my manager flagged as handling grade and topic
              selection well, plus a first read on whether a hover mega-menu could work for us.
            </p>
            <div className="flex items-center gap-3 mt-8 font-sans text-xs uppercase tracking-wider text-gray-400">
              <span>Prepared by DJ Wooster</span>
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              <span>UX Design, Riverside Insights</span>
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              <span>Draft</span>
              <span className="w-1 h-1 rounded-full bg-gray-400" />
              <span>Sep 10, 2026</span>
            </div>
          </motion.div>

          {/* ── 01 — Context ── */}
          <motion.div id="context" className="scroll-mt-24" {...reveal(1)}>
            <Section>
              <SectionNumber n="01" eyebrow="Why we're looking outside" title="What we're trying to learn" />
              <p className="font-sans text-base text-black leading-relaxed max-w-2xl">
                The Resources page has been through several rounds on how a grade gets selected
                (grade gate, filter panel, decor). One question hasn&rsquo;t been tested yet: whether a
                <strong> hover-triggered dropdown menu</strong> &mdash; the pattern several leading
                teacher-resource sites use &mdash; could replace or complement the full-page gate we
                have today.
              </p>
              <PullQuote>
                Is a nav-level dropdown a faster way to get to grade + topic than a page you have to
                pass through first?
              </PullQuote>
              <p className="font-sans text-sm text-gray-500 leading-relaxed max-w-2xl">
                The three sites below were shared directly as reference. Each is broken down by its
                underlying interaction pattern, what&rsquo;s notable about it, and a first-pass read on
                how it could translate to our product &mdash; not final recommendations.
              </p>
            </Section>
          </motion.div>

          {SITES.map((s) => (
            <SiteWalkthrough key={s.id} {...s} />
          ))}

          {/* ── 05 — Synthesis ── */}
          <motion.div id="synthesis" className="scroll-mt-24" {...reveal(1)}>
            <Section className="max-w-none">
              <SectionNumber n="05" eyebrow="Putting it together" title="Patterns worth testing" />
              <div className="grid sm:grid-cols-3 gap-5">
                <div className="border border-gray-200 rounded-lg p-5">
                  <GitCompare size={20} className="text-research-accent mb-3" />
                  <p className="font-sans text-base font-semibold text-black">Grouped-then-drill</p>
                  <p className="font-sans text-sm text-gray-500 mt-1">TPT&rsquo;s school-level columns over individual grades &mdash; scannable, matches our existing grade-band data.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-5">
                  <LayoutGrid size={20} className="text-research-accent mb-3" />
                  <p className="font-sans text-base font-semibold text-black">Flat & uniform</p>
                  <p className="font-sans text-sm text-gray-500 mt-1">Education.com&rsquo;s ungrouped grade grid, nested under content type &mdash; simpler, inverts our current grade-first hierarchy.</p>
                </div>
                <div className="border border-gray-200 rounded-lg p-5">
                  <Compass size={20} className="text-research-accent mb-3" />
                  <p className="font-sans text-base font-semibold text-black">Visual card browse</p>
                  <p className="font-sans text-sm text-gray-500 mt-1">LearningMole&rsquo;s photographic age cards &mdash; warmer, page-bound rather than global nav.</p>
                </div>
              </div>
              <div className="mt-6 flex items-start gap-3 border border-gray-200 rounded-lg p-5">
                <Lightbulb size={20} className="text-research-accent shrink-0 mt-0.5" />
                <p className="font-sans text-sm text-black leading-relaxed">
                  Given the manager&rsquo;s specific interest in the hover mega-menu, the most direct next
                  step is a throwaway prototype of TPT&rsquo;s grouped-dropdown pattern on our own nav &mdash;
                  since our grade-band data (Early Elementary / Late Elementary / Middle School / High
                  School) already exists and matches that structure almost exactly.
                </p>
              </div>
            </Section>
          </motion.div>

          {/* ── 06 — More examples ── */}
          <motion.div id="more" className="scroll-mt-24" {...reveal(1)}>
            <Section className="max-w-none">
              <SectionNumber n="06" eyebrow="Worth a look" title="Other examples to consider" />
              <p className="font-sans text-base text-black leading-relaxed max-w-2xl mb-8">
                A few more worth a pass if we want a broader sample &mdash; some from education, some
                from other industries with mature browse/filter patterns. None of these have
                screenshots pulled yet; flag which ones are worth adding.
              </p>
              <div className="grid sm:grid-cols-2 gap-8">
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Other teacher-resource sites</p>
                  <ul className="space-y-3">
                    {MORE_EXAMPLES.education.map((ex, i) => (
                      <li key={i} className="flex gap-3">
                        <ArrowRight size={16} className="text-research-accent shrink-0 mt-1" />
                        <p className="font-sans text-sm text-gray-700 leading-relaxed">
                          <span className="font-semibold text-black">{ex.name}</span> &mdash; {ex.note}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="font-sans text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Outside education</p>
                  <ul className="space-y-3">
                    {MORE_EXAMPLES.otherIndustries.map((ex, i) => (
                      <li key={i} className="flex gap-3">
                        <ArrowRight size={16} className="text-research-accent shrink-0 mt-1" />
                        <p className="font-sans text-sm text-gray-700 leading-relaxed">
                          <span className="font-semibold text-black">{ex.name}</span> &mdash; {ex.note}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ── Footer ── */}
          <motion.div {...reveal(1)} className="flex items-start gap-3">
            <Quote size={16} className="text-research-accent shrink-0 mt-1" />
            <p className="font-sans text-xs text-gray-500 leading-relaxed max-w-2xl">
              Screenshots referenced above were shared directly by the design manager as reference
              examples of grade/topic selection UX on public teacher-resource sites.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
