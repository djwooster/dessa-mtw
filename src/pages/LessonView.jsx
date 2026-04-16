import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, Circle, ChevronLeft, ChevronRight, ChevronDown, Play, Clock, Bookmark, Maximize2, Minimize2 } from 'lucide-react'


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

const lesson2Videos = [
  { title: 'Introduction to Emotional Building Blocks', duration: '4:22' },
  { title: 'The Five Core Emotions', duration: '6:15' },
  { title: 'Labeling vs. Feeling', duration: '5:08' },
]

const lesson3Videos = [
  { title: 'Meet All 10 Emogers', duration: '3:45' },
  { title: 'The Joy Emogre', duration: '2:30' },
  { title: 'The Anger Emogre', duration: '2:45' },
  { title: 'The Sadness Emogre', duration: '2:20' },
  { title: 'The Fear Emogre', duration: '2:55' },
  { title: 'The Surprise Emogre', duration: '2:10' },
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

// ── Slide deck data — Feelings Check-In (Unit 2, Lesson 1) ───────────────
const feelingsCheckInSlides = [
  {
    type: 'title',
    title: 'Feelings Check-In',
    subtitle: 'Unit 2 — Naming What We Feel',
  },
  {
    type: 'questions',
    label: 'Continuing the Conversation',
    questions: [
      'What\'s one feeling you noticed in your body this week? Where did you feel it?',
      'Did anything happen today that changed how you were feeling? What was it?',
    ],
  },
  {
    type: 'questions',
    label: 'Continuing the Conversation',
    questions: [
      'When you feel something big, who or what helps you feel better?',
      'If your feeling had a color right now, what color would it be — and why?',
    ],
  },
  {
    type: 'close',
    title: 'Keep Checking In',
    body: 'Noticing how we feel is the first step to understanding ourselves and each other.',
  },
]

// ── Slide viewer sub-components ───────────────────────────────────────────
function SlideBlob({ style }) {
  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: 260,
        height: 260,
        borderRadius: '40% 60% 70% 30% / 40% 50% 60% 50%',
        background: 'rgba(0,0,0,0.09)',
        ...style,
      }}
    />
  )
}

function MtwWordmark() {
  return (
    <div className="flex flex-col items-center leading-none select-none">
      <div className="flex items-baseline gap-[1px] font-extrabold text-lg tracking-tight">
        <span style={{ color: '#E8653A' }}>m</span>
        <span style={{ color: '#F5A623' }}>O</span>
        <span style={{ color: '#5B9E4D' }}>V</span>
        <span style={{ color: '#2A7F8F' }}>e</span>
      </div>
      <p className="text-[9px] font-bold uppercase" style={{ letterSpacing: '0.18em', color: '#E8653A' }}>
        This World
      </p>
    </div>
  )
}

function SlideContent({ slide }) {
  if (slide.type === 'title') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: '#E8653A' }}>
        <SlideBlob style={{ top: -80, left: -80, transform: 'rotate(-20deg)' }} />
        <SlideBlob style={{ bottom: -80, right: -80, transform: 'rotate(15deg)' }} />
        <div className="relative z-10 bg-[#FDF8F0] rounded-3xl px-10 py-8 text-center mx-10 shadow-lg">
          <h2 className="text-[2rem] font-black text-brand-text leading-tight tracking-tight mb-2">
            {slide.title}
          </h2>
          <p className="text-sm font-medium text-brand-subtext">{slide.subtitle}</p>
        </div>
        <div className="absolute bottom-5 right-6 z-10">
          <MtwWordmark />
        </div>
      </div>
    )
  }

  if (slide.type === 'questions') {
    return (
      <div className="absolute inset-0 flex overflow-hidden" style={{ background: '#FDF8F0' }}>
        <div className="flex-1 flex flex-col justify-center gap-4 px-8 py-8">
          {slide.questions.map((q, i) => (
            <div
              key={i}
              className="rounded-2xl px-5 py-4 text-sm font-medium leading-relaxed text-white"
              style={{ background: '#E8653A' }}
            >
              {q}
            </div>
          ))}
        </div>
        <div className="w-48 flex flex-col items-center justify-center gap-3 px-5" style={{ borderLeft: '1px solid rgba(232,101,58,0.2)' }}>
          <div
            className="relative w-28 h-20 rounded-2xl flex items-center justify-center overflow-hidden"
            style={{ background: '#FDF8F0', border: '3px solid #E8653A' }}
          >
            <SlideBlob style={{ top: -30, right: -30, width: 80, height: 80, transform: 'rotate(20deg)' }} />
            <MtwWordmark />
          </div>
          <p className="text-xs font-bold text-center leading-snug" style={{ color: '#E8653A' }}>
            {slide.label}
          </p>
        </div>
      </div>
    )
  }

  if (slide.type === 'close') {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center overflow-hidden" style={{ background: '#E8653A' }}>
        <SlideBlob style={{ top: -60, right: -60, transform: 'rotate(25deg)' }} />
        <SlideBlob style={{ bottom: -80, left: -60, transform: 'rotate(-15deg)' }} />
        <div className="relative z-10 bg-[#FDF8F0] rounded-3xl px-10 py-8 text-center mx-12 shadow-lg">
          <h2 className="text-2xl font-black text-brand-text mb-3 tracking-tight">{slide.title}</h2>
          <p className="text-sm text-brand-subtext leading-relaxed">{slide.body}</p>
        </div>
        <div className="absolute bottom-5 right-6 z-10">
          <MtwWordmark />
        </div>
      </div>
    )
  }

  return null
}

// fill=false → standalone with aspect ratio + dots below
// fill=true  → fills parent container, dots overlaid inside
function SlideViewer({ slides, fill = false }) {
  const [current, setCurrent] = useState(0)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'ArrowLeft') setCurrent((c) => Math.max(0, c - 1))
      if (e.key === 'ArrowRight') setCurrent((c) => Math.min(slides.length - 1, c + 1))
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [slides.length])

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', handler)
    return () => document.removeEventListener('fullscreenchange', handler)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const inner = (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden ${fill ? 'h-full' : 'rounded-2xl shadow-md'}`}
      style={fill ? undefined : { aspectRatio: '16/9' }}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="absolute inset-0"
        >
          <SlideContent slide={slides[current]} />
        </motion.div>
      </AnimatePresence>

      {current > 0 && (
        <button
          onClick={() => setCurrent((c) => c - 1)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <ChevronLeft size={16} className="text-brand-text" />
        </button>
      )}

      {current < slides.length - 1 && (
        <button
          onClick={() => setCurrent((c) => c + 1)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full bg-white/85 flex items-center justify-center shadow-md hover:bg-white transition-colors"
        >
          <ChevronRight size={16} className="text-brand-text" />
        </button>
      )}

      {/* Fullscreen toggle */}
      <button
        onClick={toggleFullscreen}
        className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-white/85 flex items-center justify-center shadow-md hover:bg-white transition-colors"
        aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
      >
        {isFullscreen
          ? <Minimize2 size={13} className="text-brand-text" />
          : <Maximize2 size={13} className="text-brand-text" />
        }
      </button>

      {/* Dots — overlaid inside when fill mode, so they work at any height */}
      {fill && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.28)' }}>
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className="rounded-full transition-all duration-200"
              style={{ width: i === current ? 18 : 6, height: 6, background: i === current ? 'white' : 'rgba(255,255,255,0.45)' }}
            />
          ))}
        </div>
      )}
    </div>
  )

  if (fill) return inner

  return (
    <div>
      {inner}
      {/* Standalone: dots + caption below the slide */}
      <div className="flex items-center justify-center gap-1.5 mt-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="rounded-full transition-all duration-200"
            style={{ width: i === current ? 18 : 6, height: 6, background: i === current ? '#E8653A' : '#E2E6EA' }}
          />
        ))}
      </div>
      <p className="text-sm text-brand-subtext text-center mt-1.5">
        Use arrows or ← → keys to advance — display on your classroom screen after the video.
      </p>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

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
  const [selectedLesson, setSelectedLesson] = useState({ unitId: 1, lessonIndex: 0 })
  const [activeVideo, setActiveVideo] = useState(0)
  const [activeContent, setActiveContent] = useState('video')
  const [bookmarked, setBookmarked] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const grade = course?.grade ?? 'Grade 3'
  const competency = course?.competency ?? 'Self-Awareness'

  const activeUnit = units.find((u) => u.id === selectedLesson.unitId)
  const currentLessonTitle = activeUnit?.sub[selectedLesson.lessonIndex] ?? 'Welcome Video!'
  const currentUnitTitle = activeUnit?.title ?? 'Unit 1 — Meet the Emogers'

  const isLesson2 = selectedLesson.unitId === 1 && selectedLesson.lessonIndex === 1
  const isLesson3 = selectedLesson.unitId === 1 && selectedLesson.lessonIndex === 2
  const isLesson4 = selectedLesson.unitId === 1 && selectedLesson.lessonIndex === 3
  const isFeelingsChekin = selectedLesson.unitId === 2 && selectedLesson.lessonIndex === 1

  const handleSelectLesson = (unitId, lessonIndex) => {
    setSelectedLesson({ unitId, lessonIndex })
    setActiveVideo(0)
    setActiveContent('video')
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
                          const isSelectedLesson = selectedLesson.unitId === unit.id && selectedLesson.lessonIndex === i
                          return (
                            <div key={item}>
                              <button
                                onClick={() => handleSelectLesson(unit.id, i)}
                                className={`w-full flex items-center justify-between py-2.5 text-left transition-colors ${isSelectedLesson ? 'bg-mtw-amberLight rounded-lg' : 'hover:bg-brand-bg'}`}
                                style={{ paddingLeft: '56px', paddingRight: '8px' }}
                              >
                                <span className={`text-sm ${isSelectedLesson ? 'font-semibold text-brand-text' : 'text-brand-text'}`}>
                                  {item}
                                </span>
                                <Circle
                                  size={18}
                                  className={`flex-shrink-0 ${isSelectedLesson ? 'text-mtw-amber' : 'text-brand-border'}`}
                                />
                              </button>
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
        <div className="max-w-[62rem] mx-auto px-8 py-7">

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
                  {currentLessonTitle}
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
            key={`video-${selectedLesson.unitId}-${selectedLesson.lessonIndex}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
            className="mb-7"
          >

            {/* Lesson 1 — single video */}
            {!isLesson2 && !isLesson3 && !isLesson4 && !isFeelingsChekin && (
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
                </div>
                <p className="text-sm text-brand-subtext mt-2 px-1">
                  Watch all the way through before pausing — the Emoger reveal at 5:10 lands best without interruption.
                </p>
              </>
            )}

            {/* Lesson 2 — active player + horizontal thumbnail strip */}
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
                </div>

                {/* Thumbnail strip */}
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

            {/* Lesson 3 — 2-column video grid (equal-weight cards) */}
            {isLesson3 && (
              <div className="grid grid-cols-2 gap-4">
                {lesson3Videos.map((video, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveVideo(i)}
                    className="rounded-2xl overflow-hidden text-left transition-all"
                    style={{ outline: i === activeVideo ? '2px solid #2A7F8F' : '2px solid transparent', outlineOffset: '2px' }}
                  >
                    <div className="relative" style={{ aspectRatio: '16/9', background: '#1B2B4B' }}>
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(45,125,120,0.25) 0%, rgba(27,43,75,0.85) 100%)' }} />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-colors"
                          style={{ background: i === activeVideo ? '#2A7F8F' : 'rgba(255,255,255,0.2)' }}
                        >
                          <Play size={14} fill="white" className="text-white ml-0.5" />
                        </div>
                      </div>
                      <div className="absolute top-3 left-3 w-6 h-6 rounded-full bg-white/90 flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-brand-text">{i + 1}</span>
                      </div>
                      <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-xs" style={{ background: 'rgba(0,0,0,0.45)' }}>
                        <Clock size={10} />{video.duration}
                      </div>
                    </div>
                    <div className="px-3 py-2.5 bg-white border-x border-b border-brand-border rounded-b-2xl">
                      <p className="text-sm font-semibold leading-snug" style={{ color: i === activeVideo ? '#2A7F8F' : '#1B2B4B' }}>
                        {video.title}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Feelings Check-In — video + slide deck with content-type selector */}
            {isFeelingsChekin && (
              <div className="flex rounded-2xl overflow-hidden border border-brand-border" style={{ height: 360 }}>
                {/* Left: active content */}
                <div className="flex-1 relative overflow-hidden">
                  {activeContent === 'video' && (
                    <>
                      <div className="absolute inset-0" style={{ background: '#1B2B4B' }} />
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(45,125,120,0.3) 0%, rgba(27,43,75,0.8) 100%)' }} />
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <button className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg" style={{ background: '#2A7F8F' }}>
                          <Play size={20} fill="white" className="text-white ml-0.5" />
                        </button>
                        <p className="text-white/70 text-sm">Feelings Check-In — Introduction</p>
                      </div>
                      <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white" style={{ background: 'rgba(0,0,0,0.45)' }}>
                        <Clock size={11} />5:14
                      </div>
                    </>
                  )}
                  {activeContent === 'slides' && (
                    <SlideViewer slides={feelingsCheckInSlides} fill />
                  )}
                </div>

                {/* Right: content-type selector */}
                <div className="w-56 bg-white flex-shrink-0 border-l border-brand-border flex flex-col">
                  <div className="px-4 py-2.5 border-b border-brand-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">In This Lesson</p>
                  </div>

                  {/* Video option */}
                  <button
                    onClick={() => setActiveContent('video')}
                    className={`w-full text-left px-4 py-3.5 border-b border-brand-border border-l-2 transition-colors ${
                      activeContent === 'video'
                        ? 'bg-dessa-tealLight border-l-dessa-teal'
                        : 'border-l-transparent hover:bg-brand-bg'
                    }`}
                  >
                    <p className="text-xs text-brand-subtext mb-0.5">Video</p>
                    <p className={`text-sm font-semibold leading-snug mb-1.5 ${activeContent === 'video' ? 'text-dessa-teal' : 'text-brand-text'}`}>
                      Feelings Check-In — Introduction
                    </p>
                    <div className="flex items-center gap-1 text-xs text-brand-subtext">
                      <Clock size={10} />5:14
                    </div>
                  </button>

                  {/* Slide deck option */}
                  <button
                    onClick={() => setActiveContent('slides')}
                    className={`w-full text-left px-4 py-3.5 border-l-2 transition-colors ${
                      activeContent === 'slides'
                        ? 'bg-dessa-tealLight border-l-dessa-teal'
                        : 'border-l-transparent hover:bg-brand-bg'
                    }`}
                  >
                    <p className="text-xs text-brand-subtext mb-0.5">Slide Deck</p>
                    <p className={`text-sm font-semibold leading-snug mb-1.5 ${activeContent === 'slides' ? 'text-dessa-teal' : 'text-brand-text'}`}>
                      Continuing the Conversation
                    </p>
                    <div className="flex items-center gap-1 text-xs text-brand-subtext">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="3" width="20" height="14" rx="2" />
                        <path d="M8 21h8M12 17v4" />
                      </svg>
                      4 slides
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Lesson 4 — split panel: player left, episode list right */}
            {isLesson4 && (
              <div className="flex rounded-2xl overflow-hidden border border-brand-border" style={{ height: '300px' }}>

                {/* Player */}
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
                </div>

                {/* Episode list */}
                <div className="w-64 bg-white flex-shrink-0 border-l border-brand-border overflow-y-auto">
                  <div className="px-4 py-2.5 border-b border-brand-border">
                    <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext">In this lesson</p>
                  </div>
                  {lesson4Videos.map((video, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveVideo(i)}
                      className={`w-full text-left px-4 py-3 border-b border-brand-border last:border-0 border-l-2 transition-colors ${
                        i === activeVideo
                          ? 'bg-dessa-tealLight border-l-dessa-teal'
                          : 'border-l-transparent hover:bg-brand-bg'
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
