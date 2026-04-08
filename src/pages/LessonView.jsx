import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CheckCircle2, Circle, ChevronLeft, ChevronDown, Play, Clock } from 'lucide-react'

const units = [
  { id:  1, title: 'Unit 1 — Meet the Emogers',             done: true,  active: false, sub: ['Welcome Video!', 'Emotional Building Blocks', '10 Emogers', 'Power of Pause'] },
  { id:  2, title: 'Unit 2 — Naming What We Feel',           done: true,  active: false, sub: ['Welcome Video!', 'Feelings Check-In', 'Emotion Charades', 'The Feelings Map'] },
  { id:  3, title: 'Unit 3 — The Anger Emogre',              done: true,  active: false, sub: ['Welcome Video!', 'Meet the Anger Emogre', 'Body Signals', 'Cooling Down Strategies', 'Power of Pause'] },
  { id:  4, title: 'Unit 4 — Finding Your Calm',             done: true,  active: false, sub: ['Welcome Video!', 'Calm Toolkit', 'Breathing Buddies', 'The Pause Button'] },
  { id:  5, title: 'Unit 5 — Breathing Together',            done: true,  active: false, sub: ['Welcome Video!', 'Breath Awareness', '4-7-8 Breathing', 'Mindful Minute', 'Partner Share'] },
  { id:  6, title: 'Unit 6 — Sharing Our Stories',           done: false, active: true,  sub: ['Welcome Video!', 'Story Circle', 'Haikuul 2', 'The Hero Sandwich', 'Power of Pause'] },
  { id:  7, title: 'Unit 7 — When Things Feel Big',          done: false, active: false, sub: ['Welcome Video!', 'The Overwhelm Emogre', 'Grounding Techniques', 'Safe Space'] },
  { id:  8, title: 'Unit 8 — The Joy Emogre',                done: false, active: false, sub: ['Welcome Video!', 'Meet the Joy Emogre', 'Gratitude Garden', 'Strength Spotlight', 'Reflection'] },
  { id:  9, title: 'Unit 9 — Connecting with Others',        done: false, active: false, sub: ['Welcome Video!', 'The Empathy Engine', 'Mirror Mirror', 'Connection Cards'] },
  { id: 10, title: 'Unit 10 — Gratitude Practice',           done: false, active: false, sub: ['Welcome Video!', 'Gratitude Journal', 'Appreciation Circle', 'The Thank-You Game'] },
  { id: 11, title: 'Unit 11 — The Worry Emogre',             done: false, active: false, sub: ['Welcome Video!', 'Meet the Worry Emogre', 'The Worry Jar', 'Thought Bubbles', 'Power of Pause'] },
  { id: 12, title: 'Unit 12 — Mindful Moments',              done: false, active: false, sub: ['Welcome Video!', 'Body Scan', 'Mindful Minute', 'The Stillness Game'] },
  { id: 13, title: 'Unit 13 — Our Feelings Change',          done: false, active: false, sub: ['Welcome Video!', 'Feelings Weather Report', 'Emotion Timeline', 'Class Circle'] },
  { id: 14, title: 'Unit 14 — Asking for Help',              done: false, active: false, sub: ['Welcome Video!', 'Who Can Help Me?', 'The Ask', 'Welcomly', 'Reflection'] },
  { id: 15, title: 'Unit 15 — Strengthening Empathy',        done: false, active: false, sub: ['Welcome Video!', 'Haikuul', 'The Hero Sandwich', 'Welcomly', 'Power of Pause'] },
  { id: 16, title: 'Unit 16 — The Sadness Emogre',           done: false, active: false, sub: ['Welcome Video!', 'Meet the Sadness Emogre', 'Holding Space', 'Comfort Toolkit'] },
  { id: 17, title: 'Unit 17 — Making Space for Feelings',    done: false, active: false, sub: ['Welcome Video!', 'Emotional Building Blocks', 'The Feelings Thermometer', 'Inner Voice'] },
  { id: 18, title: 'Unit 18 — Body Signals',                 done: false, active: false, sub: ['Welcome Video!', 'Body Check-In', 'Signal Mapping', 'Partner Share', 'Power of Pause'] },
  { id: 19, title: 'Unit 19 — The Calm Corner',              done: false, active: false, sub: ['Welcome Video!', 'Building Your Calm Corner', 'Tools for Calm', 'Practice Round'] },
  { id: 20, title: 'Unit 20 — Celebrating Growth',           done: false, active: false, sub: ['Welcome Video!', 'Growth Gallery', 'Strength Spotlight', 'Class Circle', 'Reflection'] },
  { id: 21, title: 'Unit 21 — When We Disagree',             done: false, active: false, sub: ['Welcome Video!', 'The Conflict Emogre', 'Listening First', 'The Reframe Game'] },
  { id: 22, title: 'Unit 22 — The Courage Emogre',           done: false, active: false, sub: ['Welcome Video!', 'Meet the Courage Emogre', 'Small Brave Steps', 'Courage Circle'] },
  { id: 23, title: 'Unit 23 — Trying Again',                 done: false, active: false, sub: ['Welcome Video!', 'The Setback Emogre', 'Bounce-Back Toolkit', 'Try Again Story', 'Power of Pause'] },
  { id: 24, title: 'Unit 24 — Self-Talk Strategies',         done: false, active: false, sub: ['Welcome Video!', 'Inner Voice', 'Flip the Script', 'Haikuul 2'] },
  { id: 25, title: 'Unit 25 — Setting Intentions',           done: false, active: false, sub: ['Welcome Video!', 'What Do I Want?', 'The Intention Setter', 'Partner Share', 'Reflection'] },
  { id: 26, title: 'Unit 26 — The Pride Emogre',             done: false, active: false, sub: ['Welcome Video!', 'Meet the Pride Emogre', 'Strength Spotlight', 'Celebration Ritual'] },
  { id: 27, title: 'Unit 27 — Managing Big Reactions',       done: false, active: false, sub: ['Welcome Video!', 'Reaction vs. Response', 'The Pause Button', 'Cool-Off Toolkit', 'Power of Pause'] },
  { id: 28, title: 'Unit 28 — Our Strengths',                done: false, active: false, sub: ['Welcome Video!', 'Strength Mapping', 'The Hero Sandwich', 'Strength Circle'] },
  { id: 29, title: 'Unit 29 — The Fear Emogre',              done: false, active: false, sub: ['Welcome Video!', 'Meet the Fear Emogre', 'Fear vs. Danger', 'Brave Breathing', 'Reflection'] },
  { id: 30, title: 'Unit 30 — Safe vs. Unsafe Feelings',     done: false, active: false, sub: ['Welcome Video!', 'Feelings Safety Check', 'Trusted Adults', 'Class Circle'] },
  { id: 31, title: 'Unit 31 — Building Resilience',          done: false, active: false, sub: ['Welcome Video!', 'Resilience Roots', 'Bounce-Back Stories', 'Welcomly', 'Power of Pause'] },
  { id: 32, title: 'Unit 32 — Checking In With Yourself',    done: false, active: false, sub: ['Welcome Video!', 'Daily Check-In', 'Body Scan', 'Mindful Minute'] },
  { id: 33, title: 'Unit 33 — The Surprise Emogre',          done: false, active: false, sub: ['Welcome Video!', 'Meet the Surprise Emogre', 'Expect the Unexpected', 'Adaptability Toolkit'] },
  { id: 34, title: 'Unit 34 — Emotional First Aid',          done: false, active: false, sub: ['Welcome Video!', 'First Aid for Feelings', 'Support Toolkit', 'Partner Share', 'Reflection'] },
  { id: 35, title: 'Unit 35 — Looking Back, Moving Forward', done: false, active: false, sub: ['Welcome Video!', 'Growth Timeline', 'What I Know Now', 'Class Circle'] },
  { id: 36, title: 'Unit 36 — Celebration of Growth',        done: false, active: false, sub: ['Welcome Video!', 'My Growth Story', 'Strength Spotlight', 'Gratitude Garden', 'Celebration Ritual'] },
]

const skills = ['Storytelling', 'Active Listening', 'Emotional Vocabulary', 'Empathy']

const tips = [
  'Model the activity yourself first',
  'Set a gentle timer on a visible device',
  'Remind students: no right or wrong Emogre',
  'If stuck, offer the "3-word hint" scaffold',
]

const integrationIdeas = [
  {
    subject: 'ELA',
    idea: 'Use as a prewriting warm-up before personal narrative essays.',
  },
  {
    subject: 'Science',
    idea: 'Connect to the idea of "observable evidence" when identifying emotions in others.',
  },
  {
    subject: 'Morning Meeting',
    idea: 'Run a 5-minute version as your daily community builder.',
  },
]

const discussionPrompts = [
  {
    context: 'At Home',
    question: 'Ask your family: "Can you share a story about a time you felt really ___?" Use an Emogre name!',
  },
  {
    context: 'Back in Class',
    question: 'How did it feel to share your story? Did anything surprise you about how someone else guessed your Emogre?',
  },
  {
    context: 'Going Deeper',
    question: 'Are there some emotions that are easier to show in stories than others? Why might that be?',
  },
]

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-1.5">
      {children}
    </p>
  )
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-base font-semibold text-brand-text mb-4">{children}</h2>
  )
}

function Divider() {
  return <div className="border-t border-brand-border my-7" />
}

function GreenCheck() {
  return (
    <span className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: '#5B9E4D' }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M1.5 5l2.5 2.5 4.5-4.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </span>
  )
}

export default function LessonView() {
  const navigate = useNavigate()
  const [expandedUnit, setExpandedUnit] = useState(6)

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* ── Left sidebar ── */}
      <aside className="flex-shrink-0 bg-white border-r border-brand-border flex flex-col overflow-hidden" style={{ width: '20rem' }}>
        <div className="px-4 py-4 border-b border-brand-border">
          <p className="text-lg font-semibold tracking-tight text-brand-text">
            Grade 4
          </p>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {units.map((unit) => {
            const isExpanded = expandedUnit === unit.id
            const toggle = () => setExpandedUnit(isExpanded ? null : unit.id)

            return (
              <div key={unit.id} className={`border-l-2 ${unit.active ? 'border-mtw-amber' : 'border-transparent'}`}>
                {/* Unit row */}
                <button
                  onClick={toggle}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors ${
                    unit.active ? 'bg-mtw-amberLight' : 'hover:bg-brand-bg'
                  }`}
                >
                  {unit.done ? (
                    <CheckCircle2 size={14} className="text-mtw-green flex-shrink-0 mt-0.5" />
                  ) : (
                    <Circle size={14} className={`flex-shrink-0 mt-0.5 ${unit.active ? 'text-mtw-amber' : 'text-brand-border'}`} />
                  )}
                  <span className={`flex-1 text-sm leading-snug ${unit.active ? 'font-semibold text-brand-text' : unit.done ? 'text-brand-subtext' : 'text-brand-text'}`}>
                    {unit.title}
                  </span>
                  <ChevronDown
                    size={13}
                    className={`flex-shrink-0 text-brand-subtext transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </button>

                {/* Sub-items */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.18, ease: 'easeInOut' }}
                      className="overflow-hidden"
                    >
                      <div className="mr-3 mb-1">
                        {unit.sub.map((item, i) => {
                          const itemDone = unit.done || (unit.active && i < 2)
                          return (
                            <div key={item}>
                              <div className="flex items-center justify-between py-2.5" style={{ paddingLeft: '56px' }}>
                                <span className={`text-sm ${itemDone ? 'text-brand-subtext' : 'text-brand-text'}`}>
                                  {item}
                                </span>
                                {itemDone
                                  ? <GreenCheck />
                                  : <Circle size={18} className="text-brand-border flex-shrink-0" />
                                }
                              </div>
                              {i < unit.sub.length - 1 && (
                                <div className="border-t border-brand-border" />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )
          })}
        </div>

        <div className="p-4 border-t border-brand-border">
          <button className="w-full py-2 rounded-md text-xs font-semibold text-brand-subtext border border-brand-border hover:bg-brand-bg transition-colors">
            End of Unit
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-brand-bg">
        <div className="max-w-3xl mx-auto px-8 py-7">

          {/* Lesson meta */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="mb-5"
          >
            <button
              onClick={() => navigate('/mtw')}
              className="flex items-center gap-1.5 text-sm font-medium text-brand-subtext hover:text-brand-text transition-colors mb-3"
            >
              <ChevronLeft size={14} />
              Back to Courses
            </button>
            <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-brand-text">
                Sharing Our Stories
              </h1>
            </div>
            <span
              className="text-xs font-semibold px-3 py-1.5 rounded-full flex-shrink-0 ml-4"
              style={{ background: '#FEF3DC', color: '#F5A623' }}
            >
              Self-Management
            </span>
            </div>
          </motion.div>

          {/* ── Video ── */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
            className="mb-7"
          >
            <div
              className="w-full rounded-2xl overflow-hidden relative"
              style={{ aspectRatio: '16/9', background: '#1B2B4B' }}
            >
              {/* Subtle gradient overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.8) 100%)',
                }}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <button
                  className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
                  style={{ background: '#F5A623' }}
                >
                  <Play size={20} fill="white" className="text-white ml-0.5" />
                </button>
                <p className="text-white/70 text-sm">Lesson 6 — Video Guide</p>
              </div>
              <div
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              >
                <Clock size={11} />
                4:32
              </div>
            </div>
            <p className="text-sm text-brand-subtext mt-2 px-1">
              Pause at 2:15 for the partner activity — students will need 60 seconds each before you resume.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.1 }}
          >

            {/* ── Skills & Objective ── */}
            <div className="grid grid-cols-2 gap-6 mb-7">
              <div>
                <SectionLabel>Skills</SectionLabel>
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs font-medium px-2.5 py-1 rounded-full border border-brand-border text-brand-text bg-white"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>Objective</SectionLabel>
                <p className="text-sm text-brand-text leading-relaxed mt-2">
                  Students will practice sharing personal stories that connect to emotions,
                  building vocabulary and empathy through peer exchange.
                </p>
              </div>
            </div>

            <Divider />

            {/* ── Main Activity ── */}
            <div className="mb-7">
              <SectionLabel>Main Activity</SectionLabel>
              <SectionHeading>Story Sharing Circle</SectionHeading>
              <div className="pl-4 border-l-4 border-mtw-amber">
                <p className="text-sm text-brand-text leading-relaxed mb-3">
                  Students sit in a circle. Each student takes 60 seconds to share a moment
                  when they felt a strong emotion — without naming the emotion. Partners guess
                  the Emogre and share what clue gave it away.
                </p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-brand-subtext">
                  <Clock size={12} />
                  12 minutes
                </div>
              </div>
            </div>

            <Divider />

            {/* ── Quick Tips ── */}
            <div className="mb-7">
              <SectionLabel>Facilitation Tips</SectionLabel>
              <SectionHeading>Before You Begin</SectionHeading>
              <ul className="space-y-2.5">
                {tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm text-brand-text">
                    <span
                      className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ background: '#2D7D78' }}
                    />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <Divider />

            {/* ── Why We Do This ── */}
            <div className="mb-7">
              <SectionLabel>Background</SectionLabel>
              <SectionHeading>Why We Do This</SectionHeading>
              <p className="text-sm text-brand-text leading-relaxed">
                Narrative sharing deepens emotional literacy. When students hear themselves
                articulate emotional experiences, they begin to own the vocabulary — and to
                recognize it in others. This is the bridge between knowing about emotions
                and living with them.
              </p>
            </div>

            <Divider />

            {/* ── Ideas for Integration ── */}
            <div className="mb-7">
              <SectionLabel>Cross-Curricular</SectionLabel>
              <SectionHeading>Ideas for Integration</SectionHeading>
              <div className="grid grid-cols-3 gap-4">
                {integrationIdeas.map((item) => (
                  <div
                    key={item.subject}
                    className="bg-white rounded-xl border border-brand-border p-4"
                  >
                    <p
                      className="text-xs font-semibold mb-2"
                      style={{ color: '#F5A623' }}
                    >
                      {item.subject}
                    </p>
                    <p className="text-sm text-brand-text leading-relaxed">{item.idea}</p>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* ── Continuing the Conversation ── */}
            <div className="mb-8">
              <SectionLabel>Discussion</SectionLabel>
              <SectionHeading>Continuing the Conversation</SectionHeading>
              <div className="grid grid-cols-3 gap-4">
                {discussionPrompts.map((p) => (
                  <div
                    key={p.context}
                    className="bg-white rounded-xl border border-brand-border p-4"
                  >
                    <p className="text-xs font-semibold text-brand-subtext mb-2">{p.context}</p>
                    <p className="text-sm text-brand-text leading-relaxed">{p.question}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Mark as complete ── */}
            <div className="pt-2 pb-10 flex justify-end">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-semibold border border-brand-border text-brand-subtext hover:border-dessa-teal hover:text-dessa-teal transition-colors bg-white">
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <rect x="0.5" y="0.5" width="14" height="14" rx="3.5" stroke="currentColor"/>
                </svg>
                Mark as complete
              </button>
            </div>

          </motion.div>
        </div>
      </main>
    </div>
  )
}
