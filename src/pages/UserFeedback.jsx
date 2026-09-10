import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Quote, Compass, GitCompare, Search, LayoutList, Tag, ClipboardList, Layers, FileText,
  PieChart, MessageCircle, MousePointerClick, ArrowRight,
} from 'lucide-react'

// ─── User Feedback / Research Protocol ─────────────────────────────────────
// Editorial one-off page (2026-09-10) — deliberately breaks from the app's
// DESSA/MTW visual system, since this is meant to read as a research
// document the designer shares with their manager, not another product
// surface. Placeholder content scoped to the Resources page grade-gate
// research (see RESEARCH_GOALS etc. below) — swap in real content once the
// study is finalized.
//
// 2026-09-10, third refinement pass, toward a quieter Notion-like feel:
// dropped the thick black rules/borders for thin gray-200 ones (rounded
// cards instead of hard boxes), no more horizontal dividers between
// sections (spacing alone via the outer space-y-20 wrapper), headings
// dialed back from extrabold/big to semibold/moderate, section eyebrows
// replaced with a short descriptive phrase per section (was "Section 0N"),
// and Interview Questions' group labels are sentence case + darker (was
// uppercase gray-400) with smaller question text. Section 05's overall
// layout is still a placeholder pending a reference the designer is adding
// to ui-inspo — only the two explicitly-requested tweaks were made there.

const SECTIONS = [
  { id: 'question', num: '01', label: 'The question' },
  { id: 'goals', num: '02', label: 'Research goals' },
  { id: 'participants', num: '03', label: "Who we're talking to" },
  { id: 'format', num: '04', label: 'Session format' },
  { id: 'questions', num: '05', label: 'Interview questions' },
  { id: 'tasks', num: '06', label: 'Usability tasks' },
  { id: 'toolkit', num: '07', label: 'Research toolkit' },
  { id: 'timeline', num: '08', label: 'Timeline' },
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

// Always-visible scroll-spy rail — a solid black column running the full
// page height, section labels dim/brighten as you scroll past them.
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
                      layoutId="railActiveDot"
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

// Giant low-opacity numeral watermarked behind the heading, plus a short
// descriptive eyebrow above the title (was "Section 0N", now e.g. "The
// point") — the number does most of the visual work, the eyebrow adds
// scannable meaning rather than repeating the number.
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

// 3-column card grid for Research Goals — a 6-col grid so the first 3 items
// take 2 columns each (three per row) and the trailing 2 items take 3
// columns each (filling that row evenly instead of leaving a gap). Tailored
// to RESEARCH_GOALS' fixed 5-item length below, not a generic N-item rule.
function GoalsGrid({ items }) {
  return (
    <div className="grid grid-cols-6 gap-4">
      {items.map((item, i) => (
        <div
          key={i}
          className={`border border-gray-200 rounded-lg p-5 ${i < 3 ? 'col-span-6 sm:col-span-2' : 'col-span-6 sm:col-span-3'}`}
        >
          <item.icon size={20} className="text-research-accent mb-3" />
          <p className="font-sans text-base font-semibold text-black">{item.title}</p>
          <p className="font-sans text-sm text-gray-500 mt-1">{item.desc}</p>
        </div>
      ))}
    </div>
  )
}

function AskThisNotThat({ rows }) {
  return (
    <div className="my-8 border border-gray-200 rounded-lg overflow-hidden">
      <div className="bg-gray-50 text-gray-700 px-5 py-2.5 font-sans text-sm font-semibold border-b border-gray-200">
        Ask this, not that <span className="text-gray-400 font-normal">(NN/g, Open-Ended vs. Closed Questions)</span>
      </div>
      {rows.map((row, i) => (
        <div key={i} className={`grid grid-cols-2 ${i > 0 ? 'border-t border-gray-200' : ''}`}>
          <div className="px-5 py-3 border-r border-gray-200 font-sans text-sm text-gray-400 line-through decoration-research-accent/60">
            {row.not}
          </div>
          <div className="px-5 py-3 font-sans text-sm text-black font-medium">
            {row.ask}
          </div>
        </div>
      ))}
    </div>
  )
}

// Group label is sentence case (not uppercase) and a darker gray, per
// feedback that the all-caps gray-400 labels were hard to distinguish from
// body text at a glance.
function QuestionGroup({ label, questions }) {
  return (
    <div className="mb-7">
      <p className="font-sans text-sm font-semibold text-gray-700 mb-2">{label}</p>
      <ul className="space-y-2">
        {questions.map((q, i) => (
          <li key={i} className="font-sans text-base text-gray-800 leading-relaxed">
            "{q}"
          </li>
        ))}
      </ul>
    </div>
  )
}

function ToolkitCard({ icon: Icon, title, children }) {
  return (
    <div className="border border-gray-200 rounded-lg p-5 bg-white">
      <Icon size={20} className="text-research-accent mb-3" />
      <h3 className="font-sans text-base font-semibold text-black mb-2">{title}</h3>
      <p className="font-sans text-sm text-gray-500 leading-relaxed">{children}</p>
    </div>
  )
}

const TODAY_VS_TESTING = [
  { label: 'Today', statement: 'Pick a grade, then search.' },
  { label: "What we're testing", statement: 'Search first, refine only if needed.' },
]

const RESEARCH_GOALS = [
  {
    icon: Compass,
    title: 'Mental model fit',
    desc: 'Does picking a grade first match how people actually think about finding resources?',
  },
  {
    icon: GitCompare,
    title: 'Concept comparison',
    desc: "How a search-first start screen compares to today's grade-first gate, and to anything else we build.",
  },
  {
    icon: Search,
    title: 'Search-within-course intent',
    desc: "What people expect it to do, and what they'd actually type.",
  },
  {
    icon: LayoutList,
    title: 'Result layouts',
    desc: 'Which way of displaying results helps people scan and decide fastest.',
  },
  {
    icon: Tag,
    title: 'Language & labels',
    desc: 'Where our facet wording is confusing, missing, or unused.',
  },
]

const WARMUP_QUESTIONS = [
  'Walk me through the last time you looked for a resource to use in your classroom.',
  "Tell me about a time you couldn't find something you needed here.",
]

const MENTAL_MODEL_QUESTIONS = [
  'When you land on the Resources page, what are you expecting to see first?',
  'How do you think about grade level when you’re searching for something? Does it come before the topic in your head, or after?',
]

const CONCEPT_REACTION_QUESTIONS = [
  'Tell me what you notice first.',
  'What would you expect to happen if you typed something right now?',
  'How did you find that?',
]

const SEARCH_WITHIN_COURSE_QUESTIONS = [
  'If you were partway through a course and wanted to find one specific lesson again, what would you try first?',
  'What would you actually type to find it?',
]

const WRAP_UP_QUESTIONS = [
  'Of everything you saw today, what would you keep? What would you throw out?',
]

const USABILITY_TASKS = [
  {
    title: 'Task 1: Cold start',
    detail: 'Find a worksheet about emotion regulation for a 3rd grade classroom. (Repeated across each concept, order rotated per participant.)',
  },
  {
    title: 'Task 2: Search within a course',
    detail: "You're already inside a course. Find the lesson about active listening.",
  },
  {
    title: 'Task 3: Open browse',
    detail: "Show me how you'd browse if you weren't looking for anything specific.",
  },
]

const TIMELINE = [
  { label: 'Recruit', detail: '10 participants, both roles' },
  { label: 'Round 1', detail: '5 sessions' },
  { label: 'Adjust concepts', detail: 'Based on round 1 findings' },
  { label: 'Round 2', detail: '5 sessions' },
  { label: 'Synthesis', detail: 'Findings + recommendation' },
  { label: 'Share', detail: 'Readout to team' },
]

export default function UserFeedback() {
  const activeId = useScrollSpy()

  return (
    <div className="flex bg-white min-h-[calc(100vh-3.5rem)]">
      <SectionRail sections={SECTIONS} activeId={activeId} onNavigate={scrollToSection} />
      <div className="flex-1 max-w-5xl mx-auto px-6 md:px-10 py-16">
        <div className="space-y-20">
          {/* ── Masthead ── */}
          <motion.div {...reveal(0)}>
            <Kicker>Research Protocol · Draft</Kicker>
            <h1 className="font-sans text-[34px] font-semibold text-black leading-[1.2] max-w-3xl">
              Do you need a grade to start searching?
            </h1>
            <p className="font-sans text-lg text-gray-500 mt-5 max-w-2xl">
              A study on how educators discover resources: what happens when we remove the grade
              gate, try a search-first start, and rethink what a result should look like.
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

          {/* ── 01 — The question we're testing ── */}
          <motion.div id="question" className="scroll-mt-24" {...reveal(1)}>
            <Section>
              <SectionNumber n="01" eyebrow="The point" title="The question we're testing" />
              <p className="font-sans text-base text-black leading-relaxed max-w-2xl">
                Today, one path works for everyone: pick a grade, then search. We're testing
                whether search-first fits better, and what that means for search within a course
                and how results get shown.
              </p>
              <div className="my-8 space-y-5">
                {TODAY_VS_TESTING.map((row, i) => (
                  <div key={i}>
                    <p className="font-sans text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">{row.label}</p>
                    <p className="font-sans text-lg font-semibold text-black">{row.statement}</p>
                  </div>
                ))}
              </div>
              <PullQuote>Is the grade gate solving a real problem, or just the first one we thought of?</PullQuote>
            </Section>
          </motion.div>

          {/* ── 02 — Research goals ── */}
          <motion.div id="goals" className="scroll-mt-24" {...reveal(1)}>
            <Section className="max-w-none">
              <SectionNumber n="02" eyebrow="What we want to learn" title="Research goals" />
              <GoalsGrid items={RESEARCH_GOALS} />
            </Section>
          </motion.div>

          {/* ── 03 — Who we're talking to ── */}
          <motion.div id="participants" className="scroll-mt-24" {...reveal(1)}>
            <Section>
              <SectionNumber n="03" eyebrow="Who's in" title="Who we're talking to" />
              <div className="grid sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <p className="font-sans text-base font-semibold text-black mb-1">Classroom educators</p>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed">
                    Daily-ish MTW users who reach for Resources between lessons, mid-week, often
                    under time pressure. Their mental model of "grade" is probably the most
                    literal test of the gate.
                  </p>
                </div>
                <div>
                  <p className="font-sans text-base font-semibold text-black mb-1">Site Leaders &amp; Program Admins</p>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed">
                    Browse more broadly across grade bands than a single classroom teacher would,
                    often looking for something to hand off rather than use themselves.
                  </p>
                </div>
              </div>
              <p className="font-sans text-sm text-gray-500 leading-relaxed max-w-2xl">
                Per Nielsen Norman Group's usability research guidance, five participants per round
                is enough to surface most usability problems in a single user group. We'll run two
                small rounds of five instead of one large round of ten, so the concepts can be
                adjusted based on what Round 1 tells us before Round 2 begins.
              </p>
              <div className="mt-6 border border-gray-200 rounded-lg p-5">
                <p className="font-sans text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Screener criteria</p>
                <ul className="font-sans text-sm text-black space-y-1.5 list-disc list-inside">
                  <li>Uses Resources at least monthly</li>
                  <li>Mix of grade bands represented (Pre-K through High School)</li>
                  <li>Mix of tenure (less than 1 year, 1 to 3 years, 3+ years)</li>
                  <li>At least 2 participants per round from the Site Leader / Admin group</li>
                </ul>
              </div>
            </Section>
          </motion.div>

          {/* ── 04 — Session format ── */}
          <motion.div id="format" className="scroll-mt-24" {...reveal(1)}>
            <Section>
              <SectionNumber n="04" eyebrow="How it runs" title="Session format" />
              <p className="font-sans text-base text-black leading-relaxed mb-6">
                45 to 60 minutes, moderated, remote over video call, recorded with consent. Each
                session has two halves.
              </p>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="border border-gray-200 rounded-lg p-5">
                  <MessageCircle size={22} className="text-research-accent mb-3" />
                  <p className="font-sans text-base font-semibold text-black mb-1">Part 1: Interview</p>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed">
                    Open-ended questions about current behavior and mental model, before they see
                    anything we've built, so we don't anchor their answers to our own designs.
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-5">
                  <MousePointerClick size={22} className="text-research-accent mb-3" />
                  <p className="font-sans text-base font-semibold text-black mb-1">Part 2: Usability tasks</p>
                  <p className="font-sans text-sm text-gray-500 leading-relaxed">
                    Think-aloud tasks across each concept. Participants narrate their actions and
                    thoughts as they work, concept order rotated per participant to avoid ordering
                    bias.
                  </p>
                </div>
              </div>
            </Section>
          </motion.div>

          {/* ── 05 — Interview questions ── */}
          <motion.div id="questions" className="scroll-mt-24" {...reveal(1)}>
            <Section className="max-w-3xl">
              <SectionNumber n="05" eyebrow="What we'll ask" title="Interview questions" />
              <QuestionGroup label="Warm-up" questions={WARMUP_QUESTIONS} />
              <QuestionGroup label="Current behavior & mental model" questions={MENTAL_MODEL_QUESTIONS} />
              <QuestionGroup label="Reacting to each concept" questions={CONCEPT_REACTION_QUESTIONS} />
              <AskThisNotThat
                rows={[
                  { not: 'Was that experience helpful?', ask: 'How did you find that experience?' },
                  { not: 'Did you find that task difficult?', ask: 'How did you find that task?' },
                ]}
              />
              <QuestionGroup label="Search within a course" questions={SEARCH_WITHIN_COURSE_QUESTIONS} />
              <QuestionGroup label="Wrap-up" questions={WRAP_UP_QUESTIONS} />
            </Section>
          </motion.div>

          {/* ── 06 — Usability tasks ── */}
          <motion.div id="tasks" className="scroll-mt-24" {...reveal(1)}>
            <Section>
              <SectionNumber n="06" eyebrow="What they'll do" title="Usability tasks" />
              <div className="space-y-6">
                {USABILITY_TASKS.map((task, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <ArrowRight size={18} className="text-research-accent shrink-0 mt-1" />
                    <div>
                      <p className="font-sans text-base font-semibold text-black">{task.title}</p>
                      <p className="font-sans text-sm text-gray-500">{task.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* ── 07 — Research toolkit ── */}
          <motion.div id="toolkit" className="scroll-mt-24" {...reveal(1)}>
            <Section className="max-w-none">
              <SectionNumber n="07" eyebrow="What we'll bring" title="Research toolkit" />
              <div className="grid sm:grid-cols-2 gap-5">
                <ToolkitCard icon={ClipboardList} title="Participant screener">
                  Recruiting form + screener questions, distributed through the district partner
                  contacts we've used for past studies.
                </ToolkitCard>
                <ToolkitCard icon={Layers} title="Concept prototypes">
                  Control (today's grade-gate), a search-first start screen, and one to two
                  additional concepts, TBD, all built in this prototype for side-by-side testing.
                </ToolkitCard>
                <ToolkitCard icon={FileText} title="Session script">
                  Moderator guide, consent language, and recording setup, one shared doc so every
                  session runs the same way.
                </ToolkitCard>
                <ToolkitCard icon={PieChart} title="Synthesis template">
                  Groups findings into friction points, notable quotes, and a concept-preference
                  tally per participant, so patterns are visible across sessions, not just within
                  one.
                </ToolkitCard>
              </div>
            </Section>
          </motion.div>

          {/* ── 08 — Timeline ── */}
          <motion.div id="timeline" className="scroll-mt-24" {...reveal(1)}>
            <Section className="max-w-none">
              <SectionNumber n="08" eyebrow="When it happens" title="Timeline" />
              <div className="flex flex-wrap gap-0 border border-gray-200 rounded-lg overflow-hidden">
                {TIMELINE.map((step, i) => (
                  <div
                    key={i}
                    className={`flex-1 min-w-[140px] p-4 ${i > 0 ? 'border-l border-gray-200' : ''}`}
                  >
                    <p className="font-sans text-base font-semibold text-black">{step.label}</p>
                    <p className="font-sans text-xs text-gray-500 mt-1">{step.detail}</p>
                  </div>
                ))}
              </div>
            </Section>
          </motion.div>

          {/* ── Footer ── */}
          <motion.div {...reveal(1)} className="flex items-start gap-3">
            <Quote size={16} className="text-research-accent shrink-0 mt-1" />
            <p className="font-sans text-xs text-gray-500 leading-relaxed max-w-2xl">
              Research methodology informed by Nielsen Norman Group's usability research guidance
              (nngroup.com/articles), including "Usability Testing 101" and "Open-Ended vs. Closed
              Questions in User Research."
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
