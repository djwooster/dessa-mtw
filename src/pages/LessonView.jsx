import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, Circle, ChevronLeft, ChevronDown, Play, Clock, Bookmark } from 'lucide-react'

const CURRENT_LESSON = 'Welcome Video!'
const CURRENT_UNIT = 'Unit 1 — Meet the Emogers'

const units = [
  { id:  1, title: 'Unit 1 — Meet the Emogers',             active: true,  sub: ['Welcome Video!', 'Emotional Building Blocks', '10 Emogers', 'Power of Pause'] },
  { id:  2, title: 'Unit 2 — Naming What We Feel',           active: false, sub: ['Welcome Video!', 'Feelings Check-In', 'Emotion Charades', 'The Feelings Map'] },
  { id:  3, title: 'Unit 3 — The Anger Emogre',              active: false, sub: ['Welcome Video!', 'Meet the Anger Emogre', 'Body Signals', 'Cooling Down Strategies', 'Power of Pause'] },
  { id:  4, title: 'Unit 4 — Finding Your Calm',             active: false, sub: ['Welcome Video!', 'Calm Toolkit', 'Breathing Buddies', 'The Pause Button'] },
  { id:  5, title: 'Unit 5 — Breathing Together',            active: false, sub: ['Welcome Video!', 'Breath Awareness', '4-7-8 Breathing', 'Mindful Minute', 'Partner Share'] },
  { id:  6, title: 'Unit 6 — Sharing Our Stories',           active: false, sub: ['Welcome Video!', 'Story Circle', 'Haikuul 2', 'The Hero Sandwich', 'Power of Pause'] },
  { id:  7, title: 'Unit 7 — When Things Feel Big',          active: false, sub: ['Welcome Video!', 'The Overwhelm Emogre', 'Grounding Techniques', 'Safe Space'] },
  { id:  8, title: 'Unit 8 — The Joy Emogre',                active: false, sub: ['Welcome Video!', 'Meet the Joy Emogre', 'Gratitude Garden', 'Strength Spotlight', 'Reflection'] },
  { id:  9, title: 'Unit 9 — Connecting with Others',        active: false, sub: ['Welcome Video!', 'The Empathy Engine', 'Mirror Mirror', 'Connection Cards'] },
  { id: 10, title: 'Unit 10 — Gratitude Practice',           active: false, sub: ['Welcome Video!', 'Gratitude Journal', 'Appreciation Circle', 'The Thank-You Game'] },
  { id: 11, title: 'Unit 11 — The Worry Emogre',             active: false, sub: ['Welcome Video!', 'Meet the Worry Emogre', 'The Worry Jar', 'Thought Bubbles', 'Power of Pause'] },
  { id: 12, title: 'Unit 12 — Mindful Moments',              active: false, sub: ['Welcome Video!', 'Body Scan', 'Mindful Minute', 'The Stillness Game'] },
  { id: 13, title: 'Unit 13 — Our Feelings Change',          active: false, sub: ['Welcome Video!', 'Feelings Weather Report', 'Emotion Timeline', 'Class Circle'] },
  { id: 14, title: 'Unit 14 — Asking for Help',              active: false, sub: ['Welcome Video!', 'Who Can Help Me?', 'The Ask', 'Welcomly', 'Reflection'] },
  { id: 15, title: 'Unit 15 — Strengthening Empathy',        active: false, sub: ['Welcome Video!', 'Haikuul', 'The Hero Sandwich', 'Welcomly', 'Power of Pause'] },
  { id: 16, title: 'Unit 16 — The Sadness Emogre',           active: false, sub: ['Welcome Video!', 'Meet the Sadness Emogre', 'Holding Space', 'Comfort Toolkit'] },
  { id: 17, title: 'Unit 17 — Making Space for Feelings',    active: false, sub: ['Welcome Video!', 'Emotional Building Blocks', 'The Feelings Thermometer', 'Inner Voice'] },
  { id: 18, title: 'Unit 18 — Body Signals',                 active: false, sub: ['Welcome Video!', 'Body Check-In', 'Signal Mapping', 'Partner Share', 'Power of Pause'] },
  { id: 19, title: 'Unit 19 — The Calm Corner',              active: false, sub: ['Welcome Video!', 'Building Your Calm Corner', 'Tools for Calm', 'Practice Round'] },
  { id: 20, title: 'Unit 20 — Celebrating Growth',           active: false, sub: ['Welcome Video!', 'Growth Gallery', 'Strength Spotlight', 'Class Circle', 'Reflection'] },
  { id: 21, title: 'Unit 21 — When We Disagree',             active: false, sub: ['Welcome Video!', 'The Conflict Emogre', 'Listening First', 'The Reframe Game'] },
  { id: 22, title: 'Unit 22 — The Courage Emogre',           active: false, sub: ['Welcome Video!', 'Meet the Courage Emogre', 'Small Brave Steps', 'Courage Circle'] },
  { id: 23, title: 'Unit 23 — Trying Again',                 active: false, sub: ['Welcome Video!', 'The Setback Emogre', 'Bounce-Back Toolkit', 'Try Again Story', 'Power of Pause'] },
  { id: 24, title: 'Unit 24 — Self-Talk Strategies',         active: false, sub: ['Welcome Video!', 'Inner Voice', 'Flip the Script', 'Haikuul 2'] },
  { id: 25, title: 'Unit 25 — Setting Intentions',           active: false, sub: ['Welcome Video!', 'What Do I Want?', 'The Intention Setter', 'Partner Share', 'Reflection'] },
  { id: 26, title: 'Unit 26 — The Pride Emogre',             active: false, sub: ['Welcome Video!', 'Meet the Pride Emogre', 'Strength Spotlight', 'Celebration Ritual'] },
  { id: 27, title: 'Unit 27 — Managing Big Reactions',       active: false, sub: ['Welcome Video!', 'Reaction vs. Response', 'The Pause Button', 'Cool-Off Toolkit', 'Power of Pause'] },
  { id: 28, title: 'Unit 28 — Our Strengths',                active: false, sub: ['Welcome Video!', 'Strength Mapping', 'The Hero Sandwich', 'Strength Circle'] },
  { id: 29, title: 'Unit 29 — The Fear Emogre',              active: false, sub: ['Welcome Video!', 'Meet the Fear Emogre', 'Fear vs. Danger', 'Brave Breathing', 'Reflection'] },
  { id: 30, title: 'Unit 30 — Safe vs. Unsafe Feelings',     active: false, sub: ['Welcome Video!', 'Feelings Safety Check', 'Trusted Adults', 'Class Circle'] },
  { id: 31, title: 'Unit 31 — Building Resilience',          active: false, sub: ['Welcome Video!', 'Resilience Roots', 'Bounce-Back Stories', 'Welcomly', 'Power of Pause'] },
  { id: 32, title: 'Unit 32 — Checking In With Yourself',    active: false, sub: ['Welcome Video!', 'Daily Check-In', 'Body Scan', 'Mindful Minute'] },
  { id: 33, title: 'Unit 33 — The Surprise Emogre',          active: false, sub: ['Welcome Video!', 'Meet the Surprise Emogre', 'Expect the Unexpected', 'Adaptability Toolkit'] },
  { id: 34, title: 'Unit 34 — Emotional First Aid',          active: false, sub: ['Welcome Video!', 'First Aid for Feelings', 'Support Toolkit', 'Partner Share', 'Reflection'] },
  { id: 35, title: 'Unit 35 — Looking Back, Moving Forward', active: false, sub: ['Welcome Video!', 'Growth Timeline', 'What I Know Now', 'Class Circle'] },
  { id: 36, title: 'Unit 36 — Celebration of Growth',        active: false, sub: ['Welcome Video!', 'My Growth Story', 'Strength Spotlight', 'Gratitude Garden', 'Celebration Ritual'] },
]

const skills = ['Emotional Vocabulary', 'Self-Reflection', 'Community Building', 'Active Listening']

const tips = [
  'Introduce yourself and set a warm, welcoming tone before pressing play',
  'Pause after the Emoger reveal to let students react — that energy is data',
  'Write the Emoger names on the board as they appear for future reference',
  'No right or wrong feelings — remind students early and often',
]

const integrationIdeas = [
  {
    subject: 'ELA',
    idea: 'After the video, have students write one sentence describing an Emogre in their own words.',
  },
  {
    subject: 'Morning Meeting',
    idea: 'Use Emoger names as a daily check-in format — "Which Emogre visited you this morning?"',
  },
  {
    subject: 'Art',
    idea: 'Students sketch their own version of their favorite Emogre to post in the classroom.',
  },
]

const discussionPrompts = [
  {
    context: 'At Home',
    question: 'Tell someone at home about one Emogre you learned about today. Which one felt most familiar to you?',
  },
  {
    context: 'Back in Class',
    question: 'Which Emogre do you think visits your class the most? Why?',
  },
  {
    context: 'Going Deeper',
    question: 'Do you think every person feels the same Emogres, or are some people\u2019s more different? What makes you think that?',
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

export default function LessonView({ onBookmark }) {
  const navigate = useNavigate()
  const location = useLocation()
  const course = location.state?.course

  const [expandedUnit, setExpandedUnit] = useState(1)
  const [bookmarked, setBookmarked] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const grade = course?.grade ?? 'Grade 3'
  const competency = course?.competency ?? 'Self-Awareness'

  const handleBookmark = () => {
    if (bookmarked) return
    setBookmarked(true)
    setShowToast(true)
    onBookmark?.({ lesson: CURRENT_LESSON, unit: CURRENT_UNIT, grade, competency, course })
    setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden">

      {/* ── Toast ── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
            className="fixed top-[68px] right-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium text-white pointer-events-none"
            style={{ background: '#1B2B4B' }}
          >
            <Bookmark size={14} fill="currentColor" />
            Lesson bookmarked
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Left sidebar ── */}
      <aside className="flex-shrink-0 bg-white border-r border-brand-border flex flex-col overflow-hidden" style={{ width: '20rem' }}>
        <div className="px-4 py-4 border-b border-brand-border">
          <p className="text-lg font-semibold tracking-tight text-brand-text">
            {grade}
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
                  className="w-full flex items-center gap-2.5 px-4 py-2.5 text-left transition-colors hover:bg-brand-bg"
                >
                  <Circle
                    size={14}
                    className={`flex-shrink-0 mt-0.5 ${unit.active ? 'text-mtw-amber' : 'text-brand-border'}`}
                  />
                  <span
                    className={`flex-1 text-sm leading-snug ${unit.active ? 'font-bold text-brand-text' : ''}`}
                    style={unit.active ? undefined : { color: '#4b5465' }}
                  >
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
                          const isSelectedLesson = unit.active && i === 0
                          return (
                            <div key={item}>
                              <div
                                className={`flex items-center justify-between py-2.5 ${isSelectedLesson ? 'bg-mtw-amberLight rounded-lg' : ''}`}
                                style={{ paddingLeft: '56px', paddingRight: '8px' }}
                              >
                                <span className={`text-sm ${isSelectedLesson ? 'font-semibold text-brand-text' : 'text-brand-text'}`}>
                                  {item}
                                </span>
                                <Circle
                                  size={18}
                                  className={`flex-shrink-0 ${isSelectedLesson ? 'text-mtw-amber' : 'text-brand-border'}`}
                                />
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
            <div className="flex items-end justify-between">
              {/* Left: back link + title */}
              <div>
                <button
                  onClick={() => navigate('/mtw')}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-subtext hover:text-brand-text transition-colors mb-3"
                >
                  <ChevronLeft size={14} />
                  Back to Courses
                </button>
                <h1 className="text-2xl font-semibold text-brand-text">
                  {CURRENT_LESSON}
                </h1>
              </div>

              {/* Right: badge + action buttons */}
              <div className="flex flex-col items-end gap-2.5 flex-shrink-0 ml-6">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: '#FEF3DC', color: '#F5A623' }}
                >
                  {competency}
                </span>
                <div className="flex items-center gap-2">
                  {/* Bookmark */}
                  <button
                    onClick={handleBookmark}
                    className="flex items-center justify-center w-9 h-9 rounded-md border border-brand-border bg-white transition-colors hover:border-mtw-amber hover:text-mtw-amber text-brand-subtext"
                    style={bookmarked ? { color: '#F5A623', borderColor: '#F5A623' } : undefined}
                    aria-label="Bookmark lesson"
                  >
                    <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
                  </button>
                  {/* Mark as complete */}
                  <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border border-brand-border text-brand-subtext hover:border-dessa-teal hover:text-dessa-teal transition-colors bg-white">
                    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                      <rect x="0.5" y="0.5" width="14" height="14" rx="3.5" stroke="currentColor"/>
                    </svg>
                    Mark as complete
                  </button>
                </div>
              </div>
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
                <p className="text-white/70 text-sm">Unit 1 — Welcome Video</p>
              </div>
              <div
                className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                style={{ background: 'rgba(0,0,0,0.45)' }}
              >
                <Clock size={11} />
                6:48
              </div>
            </div>
            <p className="text-sm text-brand-subtext mt-2 px-1">
              Watch all the way through before pausing — the Emoger reveal at 5:10 lands best without interruption.
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
                  Students are introduced to the Emoger characters and begin building a shared
                  emotional vocabulary that will be used throughout the course.
                </p>
              </div>
            </div>

            <Divider />

            {/* ── Main Activity ── */}
            <div className="mb-7">
              <SectionLabel>Main Activity</SectionLabel>
              <SectionHeading>Emoger Introduction Circle</SectionHeading>
              <div className="pl-4 border-l-4 border-mtw-amber">
                <p className="text-sm text-brand-text leading-relaxed mb-3">
                  After the video, go around the circle and ask each student to name one
                  Emogre they recognized in themselves this week — without explaining why.
                  The class listens without comment. This builds emotional awareness and
                  psychological safety from lesson one.
                </p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-brand-subtext">
                  <Clock size={12} />
                  10 minutes
                </div>
              </div>
            </div>

            <Divider />

            {/* ── Facilitation Tips ── */}
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
                Students can't regulate emotions they can't name. The Emoger framework gives
                children a shared, non-stigmatizing language for the full range of human
                feeling. Starting here — before any SEL skill-building — means every future
                lesson lands on prepared ground.
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
            <div className="pb-10">
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

          </motion.div>
        </div>
      </main>
    </div>
  )
}
