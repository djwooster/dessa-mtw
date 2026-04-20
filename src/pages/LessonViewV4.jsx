import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, Play, Clock, Bookmark, Globe } from 'lucide-react'


const LESSON_ROW_BG = 'rgba(245,246,248,0.5)'

const units = [
  { id: 1,  title: 'Unit 1 — Meet the Emogers',             sub: ['Welcome Video!', 'Emotional Building Blocks', '10 Emogers', 'Power of Pause'] },
  { id: 2,  title: 'Unit 2 — Naming What We Feel',           sub: ['Welcome Video!', 'Feelings Check-In', 'Emotion Charades', 'The Feelings Map'] },
  { id: 3,  title: 'Unit 3 — The Anger Emogre',              sub: ['Welcome Video!', 'Meet the Anger Emogre', 'Body Signals', 'Cooling Down Strategies', 'Power of Pause'] },
  { id: 4,  title: 'Unit 4 — Finding Your Calm',             sub: ['Welcome Video!', 'Calm Toolkit', 'Breathing Buddies', 'The Pause Button'] },
  { id: 5,  title: 'Unit 5 — Breathing Together',            sub: ['Welcome Video!', 'Breath Awareness', '4-7-8 Breathing', 'Mindful Minute', 'Partner Share'] },
  { id: 6,  title: 'Unit 6 — Sharing Our Stories',           sub: ['Welcome Video!', 'Story Circle', 'Haikuul 2', 'The Hero Sandwich', 'Power of Pause'] },
  { id: 7,  title: 'Unit 7 — When Things Feel Big',          sub: ['Welcome Video!', 'The Overwhelm Emogre', 'Grounding Techniques', 'Safe Space'] },
  { id: 8,  title: 'Unit 8 — The Joy Emogre',                sub: ['Welcome Video!', 'Meet the Joy Emogre', 'Gratitude Garden', 'Strength Spotlight', 'Reflection'] },
  { id: 9,  title: 'Unit 9 — Connecting with Others',        sub: ['Welcome Video!', 'The Empathy Engine', 'Mirror Mirror', 'Connection Cards'] },
  { id: 10, title: 'Unit 10 — Gratitude Practice',           sub: ['Welcome Video!', 'Gratitude Journal', 'Appreciation Circle', 'The Thank-You Game'] },
  { id: 11, title: 'Unit 11 — The Worry Emogre',             sub: ['Welcome Video!', 'Meet the Worry Emogre', 'The Worry Jar', 'Thought Bubbles', 'Power of Pause'] },
  { id: 12, title: 'Unit 12 — Mindful Moments',              sub: ['Welcome Video!', 'Body Scan', 'Mindful Minute', 'The Stillness Game'] },
  { id: 13, title: 'Unit 13 — Our Feelings Change',          sub: ['Welcome Video!', 'Feelings Weather Report', 'Emotion Timeline', 'Class Circle'] },
  { id: 14, title: 'Unit 14 — Asking for Help',              sub: ['Welcome Video!', 'Who Can Help Me?', 'The Ask', 'Welcomly', 'Reflection'] },
  { id: 15, title: 'Unit 15 — Strengthening Empathy',        sub: ['Welcome Video!', 'Haikuul', 'The Hero Sandwich', 'Welcomly', 'Power of Pause'] },
  { id: 16, title: 'Unit 16 — The Sadness Emogre',           sub: ['Welcome Video!', 'Meet the Sadness Emogre', 'Holding Space', 'Comfort Toolkit'] },
  { id: 17, title: 'Unit 17 — Making Space for Feelings',    sub: ['Welcome Video!', 'Emotional Building Blocks', 'The Feelings Thermometer', 'Inner Voice'] },
  { id: 18, title: 'Unit 18 — Body Signals',                 sub: ['Welcome Video!', 'Body Check-In', 'Signal Mapping', 'Partner Share', 'Power of Pause'] },
  { id: 19, title: 'Unit 19 — The Calm Corner',              sub: ['Welcome Video!', 'Building Your Calm Corner', 'Tools for Calm', 'Practice Round'] },
  { id: 20, title: 'Unit 20 — Celebrating Growth',           sub: ['Welcome Video!', 'Growth Gallery', 'Strength Spotlight', 'Class Circle', 'Reflection'] },
  { id: 21, title: 'Unit 21 — When We Disagree',             sub: ['Welcome Video!', 'The Conflict Emogre', 'Listening First', 'The Reframe Game'] },
  { id: 22, title: 'Unit 22 — The Courage Emogre',           sub: ['Welcome Video!', 'Meet the Courage Emogre', 'Small Brave Steps', 'Courage Circle'] },
  { id: 23, title: 'Unit 23 — Trying Again',                 sub: ['Welcome Video!', 'The Setback Emogre', 'Bounce-Back Toolkit', 'Try Again Story', 'Power of Pause'] },
  { id: 24, title: 'Unit 24 — Self-Talk Strategies',         sub: ['Welcome Video!', 'Inner Voice', 'Flip the Script', 'Haikuul 2'] },
  { id: 25, title: 'Unit 25 — Setting Intentions',           sub: ['Welcome Video!', 'What Do I Want?', 'The Intention Setter', 'Partner Share', 'Reflection'] },
  { id: 26, title: 'Unit 26 — The Pride Emogre',             sub: ['Welcome Video!', 'Meet the Pride Emogre', 'Strength Spotlight', 'Celebration Ritual'] },
  { id: 27, title: 'Unit 27 — Managing Big Reactions',       sub: ['Welcome Video!', 'Reaction vs. Response', 'The Pause Button', 'Cool-Off Toolkit', 'Power of Pause'] },
  { id: 28, title: 'Unit 28 — Our Strengths',                sub: ['Welcome Video!', 'Strength Mapping', 'The Hero Sandwich', 'Strength Circle'] },
  { id: 29, title: 'Unit 29 — The Fear Emogre',              sub: ['Welcome Video!', 'Meet the Fear Emogre', 'Fear vs. Danger', 'Brave Breathing', 'Reflection'] },
  { id: 30, title: 'Unit 30 — Safe vs. Unsafe Feelings',     sub: ['Welcome Video!', 'Feelings Safety Check', 'Trusted Adults', 'Class Circle'] },
  { id: 31, title: 'Unit 31 — Building Resilience',          sub: ['Welcome Video!', 'Resilience Roots', 'Bounce-Back Stories', 'Welcomly', 'Power of Pause'] },
  { id: 32, title: 'Unit 32 — Checking In With Yourself',    sub: ['Welcome Video!', 'Daily Check-In', 'Body Scan', 'Mindful Minute'] },
  { id: 33, title: 'Unit 33 — The Surprise Emogre',          sub: ['Welcome Video!', 'Meet the Surprise Emogre', 'Expect the Unexpected', 'Adaptability Toolkit'] },
  { id: 34, title: 'Unit 34 — Emotional First Aid',          sub: ['Welcome Video!', 'First Aid for Feelings', 'Support Toolkit', 'Partner Share', 'Reflection'] },
  { id: 35, title: 'Unit 35 — Looking Back, Moving Forward', sub: ['Welcome Video!', 'Growth Timeline', 'What I Know Now', 'Class Circle'] },
  { id: 36, title: 'Unit 36 — Celebration of Growth',        sub: ['Welcome Video!', 'My Growth Story', 'Strength Spotlight', 'Gratitude Garden', 'Celebration Ritual'] },
]

const lesson2Videos = [
  { title: 'Introduction to Emotional Building Blocks', duration: '4:22' },
  { title: 'The Five Core Emotions', duration: '6:15' },
  { title: 'Labeling vs. Feeling', duration: '5:08' },
]


const lesson4Videos = [
  { title: 'What Is the Power of Pause?', duration: '3:12', description: 'An introduction to the pause technique and why it works in the classroom.' },
  { title: 'Recognizing Your Triggers', duration: '4:45', description: 'How to spot the moments when pausing is most needed — before reacting.' },
  { title: 'The 3-Second Pause', duration: '2:58', description: 'A simple, repeatable technique students can use independently.' },
  { title: 'Practice Round', duration: '5:20', description: 'Guided whole-class practice with real-time facilitation cues.' },
]

const skills = ['Emotional Vocabulary', 'Self-Reflection', 'Community Building', 'Active Listening']

const tips = [
  'Introduce yourself and set a warm, welcoming tone before pressing play',
  'Pause after the Emoger reveal to let students react — that energy is data',
  'Write the Emoger names on the board as they appear for future reference',
  'No right or wrong feelings — remind students early and often',
]

const integrationIdeas = [
  { subject: 'ELA', idea: 'After the video, have students write one sentence describing an Emogre in their own words.' },
  { subject: 'Morning Meeting', idea: 'Use Emoger names as a daily check-in format — "Which Emogre visited you this morning?"' },
  { subject: 'Art', idea: 'Students sketch their own version of their favorite Emogre to post in the classroom.' },
]

const discussionPrompts = [
  { context: 'At Home', questions: [
    'As a class, think about a time someone used an Emoger to manage a difficult situation.',
    'What was that person feeling?',
    'What Emoger did he/she use to overcome this?',
  ]},
  { context: 'Back in Class', questions: [
    'Which Emoger is the most difficult for you to use?',
    'Why do you think that?',
  ]},
  { context: 'Going Deeper', questions: [
    'What is your favorite Emoger?',
    'Why?',
    'When do you use this Emoger the most?',
  ]},
]

function LanguagePicker({ language, langOpen, setLanguage, setLangOpen }) {
  return (
    <div className="absolute bottom-3 right-3 z-10">
      <button
        onClick={() => setLangOpen((o) => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
        style={{ background: 'rgba(0,0,0,0.45)' }}
      >
        <Globe size={11} />
        {language}
      </button>
      {langOpen && (
        <div className="absolute bottom-full right-0 mb-1.5 bg-white rounded-lg shadow-lg border border-brand-border overflow-hidden" style={{ minWidth: '100px' }}>
          {['English', 'Spanish'].map((lang) => (
            <button
              key={lang}
              onClick={() => { setLanguage(lang); setLangOpen(false) }}
              className={`w-full text-left px-3 py-2 text-xs transition-colors ${
                language === lang ? 'font-semibold text-brand-text bg-brand-bg' : 'text-brand-text hover:bg-brand-bg'
              }`}
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-1.5">
      {children}
    </p>
  )
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-2xl font-semibold text-brand-text mb-4">{children}</h2>
  )
}

function Divider() {
  return <div className="border-t border-brand-border my-7" />
}

export default function LessonViewV4({ onBookmark }) {
  const navigate = useNavigate()
  const location = useLocation()
  const course = location.state?.course

  const [selectedLesson, setSelectedLesson] = useState({ unitId: 3, lessonIndex: 0 })
  const [activeVideo, setActiveVideo] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const [language, setLanguage] = useState('English')
  const [langOpen, setLangOpen] = useState(false)

  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [completedOpen, setCompletedOpen] = useState(false)
  const [expandedCompleted, setExpandedCompleted] = useState(null)
  const [currentOpen, setCurrentOpen] = useState(true)
  const [upcomingOpen, setUpcomingOpen] = useState(false)
  const [expandedUpcoming, setExpandedUpcoming] = useState(null)

  const grade = course?.grade ?? 'Grade 3'
  const competency = course?.competency ?? 'Self-Awareness'

  const activeUnit = units.find((u) => u.id === selectedLesson.unitId)
  const currentLessonTitle = activeUnit?.sub[selectedLesson.lessonIndex] ?? 'Welcome Video!'
  const currentUnitTitle = activeUnit?.title ?? 'Unit 1 — Meet the Emogers'

  const isLesson2 = selectedLesson.unitId === 1 && selectedLesson.lessonIndex === 1
  const isLesson4 = selectedLesson.unitId === 1 && selectedLesson.lessonIndex === 3

  const completedUnits = units.filter((u) => u.id < selectedLesson.unitId)
  const upcomingUnits = units.filter((u) => u.id > selectedLesson.unitId)

  const handleSelectLesson = (unitId, lessonIndex) => {
    setSelectedLesson({ unitId, lessonIndex })
    setActiveVideo(0)
    setBookmarked(false)
  }

  const handleBookmark = () => {
    if (bookmarked) return
    setBookmarked(true)
    setShowToast(true)
    onBookmark?.({ lesson: currentLessonTitle, unit: currentUnitTitle, grade, competency, course })
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
      <motion.aside
        className="flex-shrink-0 bg-white border-r border-brand-border flex flex-col overflow-hidden"
        animate={{ width: sidebarOpen ? '20rem' : '2.75rem' }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        {/* Header */}
        <div className="px-3 py-4 border-b border-brand-border flex-shrink-0 flex items-center gap-2.5">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="flex-shrink-0 flex items-center justify-center w-7 h-7 rounded-md hover:bg-brand-bg transition-colors text-brand-subtext"
          >
            {sidebarOpen ? <ChevronLeft size={15} /> : <ChevronRight size={15} />}
          </button>
          <p className="text-lg font-semibold tracking-tight text-brand-text whitespace-nowrap overflow-hidden">
            {grade}
          </p>
        </div>

        {/* Three-zone scrollable list */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Zone 1: Completed ── */}
          {completedUnits.length > 0 && (
            <div className="border-b border-brand-border">
              <button
                onClick={() => setCompletedOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-brand-bg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={14} className="flex-shrink-0" style={{ color: 'rgba(74,158,74,0.55)' }} />
                  <span className="text-xs font-semibold text-brand-subtext uppercase tracking-wider">
                    Completed
                  </span>
                  <span className="text-xs font-semibold text-brand-subtext/60">
                    {completedUnits.length}
                  </span>
                </div>
                <ChevronRight
                  size={13}
                  className={`text-brand-subtext transition-transform duration-200 ${completedOpen ? 'rotate-90' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {completedOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {completedUnits.map((unit) => {
                      const isExpanded = expandedCompleted === unit.id
                      const toggle = () => setExpandedCompleted(isExpanded ? null : unit.id)
                      return (
                        <div key={unit.id} className="border-b border-brand-border last:border-b-0">
                          <button
                            onClick={toggle}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-brand-bg transition-colors"
                          >
                            <CheckCircle2 size={13} className="flex-shrink-0" style={{ color: 'rgba(74,158,74,0.5)' }} />
                            <span className="flex-1 text-sm leading-snug font-semibold text-brand-text">
                              {unit.title}
                            </span>
                            <ChevronRight
                              size={12}
                              className={`flex-shrink-0 text-brand-subtext/50 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div>
                                  {unit.sub.map((item, i) => (
                                    <div key={item}>
                                      <button
                                        onClick={() => handleSelectLesson(unit.id, i)}
                                        className="w-full flex items-center justify-between py-2 text-left transition-colors hover:brightness-95"
                                        style={{ paddingLeft: '52px', paddingRight: '8px', background: LESSON_ROW_BG }}
                                      >
                                        <span className="text-sm text-brand-subtext">{item}</span>
                                        <CheckCircle2 size={15} className="flex-shrink-0" style={{ color: 'rgba(74,158,74,0.5)' }} />
                                      </button>
                                      {i < unit.sub.length - 1 && (
                                        <div className="border-t border-brand-border" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* ── Zone 2: Current unit ── */}
          <div className="border-b border-brand-border relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 z-10 rounded-sm" style={{ background: '#F5A623' }} />
            <button
              onClick={() => setCurrentOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-brand-bg transition-colors"
            >
              <div className="flex items-center gap-2">
                <Circle size={14} className="text-mtw-amber flex-shrink-0" />
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#F5A623' }}>
                  Current
                </span>
              </div>
              <ChevronRight
                size={13}
                className={`transition-transform duration-200 ${currentOpen ? 'rotate-90' : ''}`}
                style={{ color: '#F5A623' }}
              />
            </button>
            <AnimatePresence initial={false}>
              {currentOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <div className="border-l-2 border-transparent">
                    <div className="flex items-center gap-2.5 px-4 py-2">
                      <Circle size={13} className="flex-shrink-0 text-mtw-amber" />
                      <span className="flex-1 text-sm leading-snug font-semibold text-brand-text">
                        {activeUnit?.title}
                      </span>
                    </div>
                    <div>
                      {activeUnit?.sub.map((item, i) => {
                        const isSelected = selectedLesson.lessonIndex === i
                        return (
                          <div key={item}>
                            <button
                              onClick={() => handleSelectLesson(selectedLesson.unitId, i)}
                              className={`w-full flex items-center justify-between py-2.5 text-left transition-colors ${
                                isSelected ? 'bg-mtw-amberLight' : 'hover:bg-brand-bg'
                              }`}
                              style={{ paddingLeft: '56px', paddingRight: '8px' }}
                            >
                              <span className="text-sm text-brand-text">
                                {item}
                              </span>
                              <Circle
                                size={18}
                                className={`flex-shrink-0 ${isSelected ? 'text-mtw-amber' : 'text-brand-border'}`}
                              />
                            </button>
                            {i < (activeUnit?.sub.length ?? 0) - 1 && (
                              <div className="border-t border-brand-border" />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Zone 3: Upcoming ── */}
          {upcomingUnits.length > 0 && (
            <div className="border-b border-brand-border">
              <button
                onClick={() => setUpcomingOpen((o) => !o)}
                className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-brand-bg transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Circle size={14} className="text-brand-border flex-shrink-0" />
                  <span className="text-xs font-semibold text-brand-subtext uppercase tracking-wider">
                    Upcoming
                  </span>
                  <span className="text-xs font-semibold text-brand-subtext/60">
                    {upcomingUnits.length}
                  </span>
                </div>
                <ChevronRight
                  size={13}
                  className={`text-brand-subtext transition-transform duration-200 ${upcomingOpen ? 'rotate-90' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {upcomingOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    {upcomingUnits.map((unit) => {
                      const isExpanded = expandedUpcoming === unit.id
                      const toggle = () => setExpandedUpcoming(isExpanded ? null : unit.id)
                      return (
                        <div key={unit.id} className="border-b border-brand-border last:border-b-0">
                          <button
                            onClick={toggle}
                            className="w-full flex items-center gap-2.5 px-4 py-2 text-left hover:bg-brand-bg transition-colors"
                          >
                            <Circle size={13} className="flex-shrink-0 text-brand-border" />
                            <span className="flex-1 text-sm leading-snug font-semibold text-brand-text">
                              {unit.title}
                            </span>
                            <ChevronRight
                              size={12}
                              className={`flex-shrink-0 text-brand-subtext/50 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                            />
                          </button>
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.18, ease: 'easeInOut' }}
                                className="overflow-hidden"
                              >
                                <div>
                                  {unit.sub.map((item, i) => (
                                    <div key={item}>
                                      <button
                                        onClick={() => handleSelectLesson(unit.id, i)}
                                        className="w-full flex items-center justify-between py-2 text-left transition-colors hover:brightness-95"
                                        style={{ paddingLeft: '52px', paddingRight: '8px', background: LESSON_ROW_BG }}
                                      >
                                        <span className="text-sm" style={{ color: '#4b5465' }}>{item}</span>
                                        <Circle size={15} className="flex-shrink-0 text-brand-border" />
                                      </button>
                                      {i < unit.sub.length - 1 && (
                                        <div className="border-t border-brand-border" />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>

      </motion.aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-y-auto bg-brand-bg">
        <div className="max-w-[62rem] mx-auto px-8 py-7">

          {/* Lesson meta */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22 }}
            className="mb-5"
          >
            <div className="flex items-end justify-between">
              <div>
                <button
                  onClick={() => navigate('/mtw4')}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-subtext hover:text-brand-text transition-colors mb-3"
                >
                  <ChevronLeft size={14} />
                  Back to Courses
                </button>
                <h1 className="text-2xl font-semibold text-brand-text">
                  {currentLessonTitle}
                </h1>
              </div>

              <div className="flex flex-col items-end gap-2.5 flex-shrink-0 ml-6">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: '#FEF3DC', color: '#F5A623' }}
                >
                  {competency}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBookmark}
                    className="flex items-center justify-center w-9 h-9 rounded-md border border-brand-border bg-white transition-colors hover:border-mtw-amber hover:text-mtw-amber text-brand-subtext"
                    style={bookmarked ? { color: '#F5A623', borderColor: '#F5A623' } : undefined}
                    aria-label="Bookmark lesson"
                  >
                    <Bookmark size={15} fill={bookmarked ? 'currentColor' : 'none'} />
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-semibold border border-brand-border text-brand-subtext hover:border-dessa-teal hover:text-dessa-teal transition-colors bg-white">
                    <svg width="14" height="14" viewBox="0 0 15 15" fill="none">
                      <rect x="0.5" y="0.5" width="14" height="14" rx="3.5" stroke="currentColor" />
                    </svg>
                    Mark as complete
                  </button>
                </div>
              </div>
            </div>
          </motion.div>

          {/* ── Video ── */}
          <motion.div
            key={`video-${selectedLesson.unitId}-${selectedLesson.lessonIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
            className="mb-7"
          >

            {/* Default — single video */}
            {!isLesson2 && !isLesson4 && (
              <>
                <div
                  className="w-full rounded-2xl overflow-hidden relative"
                  style={{ aspectRatio: '16/9', background: '#1B2B4B' }}
                >
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.8) 100%)' }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <button className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg" style={{ background: '#2A7F8F' }}>
                      <Play size={20} fill="white" className="text-white ml-0.5" />
                    </button>
                    <p className="text-white/70 text-sm">Unit 1 — Welcome Video</p>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <Clock size={11} />6:48
                  </div>
                  <LanguagePicker language={language} langOpen={langOpen} setLanguage={setLanguage} setLangOpen={setLangOpen} />
                </div>
                <p className="text-sm text-brand-subtext mt-2 px-1">
                  Watch all the way through before pausing — the Emoger reveal at 5:10 lands best without interruption.
                </p>
              </>
            )}

            {/* Lesson 2 — player + thumbnail strip */}
            {isLesson2 && (
              <>
                <div
                  className="w-full rounded-2xl overflow-hidden relative mb-3"
                  style={{ aspectRatio: '16/9', background: '#1B2B4B' }}
                >
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.8) 100%)' }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
                    <button className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg" style={{ background: '#2A7F8F' }}>
                      <Play size={20} fill="white" className="text-white ml-0.5" />
                    </button>
                    <p className="text-white font-semibold text-base leading-snug">{lesson2Videos[activeVideo].title}</p>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <Clock size={11} />{lesson2Videos[activeVideo].duration}
                  </div>
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    {activeVideo + 1} / {lesson2Videos.length}
                  </div>
                  <LanguagePicker language={language} langOpen={langOpen} setLanguage={setLanguage} setLangOpen={setLangOpen} />
                </div>
                <div className="flex gap-3">
                  {lesson2Videos.map((video, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveVideo(i)}
                      className="flex-1 rounded-xl overflow-hidden text-left transition-all"
                      style={{ outline: i === activeVideo ? '2px solid #2A7F8F' : '2px solid transparent', outlineOffset: '2px' }}
                    >
                      <div className="relative" style={{ aspectRatio: '16/9', background: '#1B2B4B' }}>
                        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(45,125,120,0.2) 0%, rgba(27,43,75,0.85) 100%)' }} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div
                            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
                            style={{ background: i === activeVideo ? '#2A7F8F' : 'rgba(255,255,255,0.2)' }}
                          >
                            <Play size={10} fill="white" className="text-white ml-0.5" />
                          </div>
                        </div>
                        <div className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-white" style={{ background: 'rgba(0,0,0,0.5)', fontSize: '10px' }}>
                          <Clock size={9} />{video.duration}
                        </div>
                      </div>
                      <div className="px-2 py-1.5 bg-white border-x border-b border-brand-border rounded-b-xl">
                        <p className="text-xs font-semibold leading-snug" style={{ color: i === activeVideo ? '#2A7F8F' : '#1B2B4B' }}>
                          {video.title}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </>
            )}



            {/* Lesson 4 — split panel */}
            {isLesson4 && (
              <div className="flex rounded-2xl overflow-hidden border border-brand-border" style={{ height: '300px' }}>
                <div className="flex-1 relative" style={{ background: '#1B2B4B' }}>
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.85) 100%)' }} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-8">
                    <button
                      className="w-12 h-12 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
                      style={{ background: '#2A7F8F' }}
                    >
                      <Play size={16} fill="white" className="text-white ml-0.5" />
                    </button>
                    <p className="text-white font-semibold text-sm leading-snug mb-1">
                      {lesson4Videos[activeVideo].title}
                    </p>
                    <p className="text-white/50 text-xs leading-relaxed">
                      {lesson4Videos[activeVideo].description}
                    </p>
                  </div>
                  <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ background: 'rgba(0,0,0,0.45)' }}>
                    <Clock size={11} />{lesson4Videos[activeVideo].duration}
                  </div>
                  <LanguagePicker language={language} langOpen={langOpen} setLanguage={setLanguage} setLangOpen={setLangOpen} />
                </div>
                <div className="w-64 bg-white flex-shrink-0 border-l border-brand-border overflow-y-auto">
                  <div className="px-4 py-2.5 border-b border-brand-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">In this lesson</p>
                  </div>
                  {lesson4Videos.map((video, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveVideo(i)}
                      className={`w-full text-left px-4 py-3 border-b border-brand-border last:border-0 border-l-2 transition-colors ${
                        i === activeVideo ? 'bg-dessa-tealLight border-l-dessa-teal' : 'border-l-transparent hover:bg-brand-bg'
                      }`}
                    >
                      <p className="text-xs text-brand-subtext mb-0.5">Episode {i + 1}</p>
                      <p className={`text-sm font-semibold leading-snug mb-1 ${i === activeVideo ? 'text-dessa-teal' : 'text-brand-text'}`}>
                        {video.title}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-brand-subtext">
                        <Clock size={10} />{video.duration}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.1 }}
          >

            {/* Skills & Objective */}
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
                <p className="text-body text-brand-text leading-relaxed mt-2">
                  Students are introduced to the Emoger characters and begin building a shared
                  emotional vocabulary that will be used throughout the course.
                </p>
              </div>
            </div>

            <Divider />

            <h2 className="text-xl font-bold text-brand-text mb-6">Facilitation Guide</h2>

            {/* Main Activity */}
            <div className="mb-7">
              <SectionLabel>Main Activity</SectionLabel>
              <SectionHeading>Emoger Introduction Circle</SectionHeading>
              <div className="pl-4 border-l-4 border-mtw-amber">
                <p className="text-body text-brand-text leading-relaxed mb-3">
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

            {/* Facilitation Tips */}
            <div className="mb-7">
              <SectionLabel>Facilitation Tips</SectionLabel>
              <SectionHeading>Before You Begin</SectionHeading>
              <ul className="space-y-2.5">
                {tips.map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-body text-brand-text">
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

            {/* Why We Do This */}
            <div className="mb-7">
              <SectionLabel>Background</SectionLabel>
              <SectionHeading>Why We Do This</SectionHeading>
              <p className="text-body text-brand-text leading-relaxed">
                Students can't regulate emotions they can't name. The Emoger framework gives
                children a shared, non-stigmatizing language for the full range of human
                feeling. Starting here — before any SEL skill-building — means every future
                lesson lands on prepared ground.
              </p>
            </div>

            <Divider />

            {/* Ideas for Integration */}
            <div className="mb-7">
              <SectionLabel>Cross-Curricular</SectionLabel>
              <SectionHeading>Ideas for Integration</SectionHeading>
              <div className="grid grid-cols-3 gap-4">
                {integrationIdeas.map((item) => (
                  <div
                    key={item.subject}
                    className="bg-white rounded-xl border border-brand-border p-4"
                  >
                    <p className="text-xs font-semibold mb-2" style={{ color: '#F5A623' }}>
                      {item.subject}
                    </p>
                    <p className="text-body text-brand-text leading-relaxed">{item.idea}</p>
                  </div>
                ))}
              </div>
            </div>

            <Divider />

            {/* Continuing the Conversation */}
            <div className="pb-10">
              <SectionLabel>Discussion</SectionLabel>
              <SectionHeading>Continuing the Conversation</SectionHeading>

              <div className="flex flex-col gap-2">
                {discussionPrompts.map((p, i) => (
                  <div
                    key={p.context}
                    className="flex flex-col gap-3 px-7 py-6 rounded-2xl border border-brand-border bg-white"
                  >
                    <p className="text-sm font-semibold text-brand-text leading-none select-none">
                      Question {i + 1}
                    </p>
                    <ul className="space-y-1.5">
                      {p.questions.map((q) => (
                        <li key={q} className="flex items-center gap-3 text-body text-brand-text leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#2D7D78' }} />
                          {q}
                        </li>
                      ))}
                    </ul>
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
