import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { CheckCircle2, Circle, ChevronLeft, Play, Clock, Bookmark } from 'lucide-react'
import { units, getFlatIndex } from '../lib/mtwData'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'

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

const skills = ['Self-motivation', 'Resilience', 'Setting Goals', 'Critical Thinking']

const tips = [
  'Students will need a sheet of paper and something to write with for this exercise.',
]

const integrationIdeas = [
  'Consider returning to the prompt used in this exercise, "Today I will ____, so tomorrow I can _____" frequently throughout the school year. Help students get into the practice of seeing how small steps can help them work towards larger outcomes.',
  'What is a collective classroom or school-related goal your class has? Complete this exercise with a focus on the shared/group goal, and what each individual can do to contribute to make progress towards the goal.',
]

const discussionPrompts = [
  { context: 'Question 1', question: 'How can you help each other if you get stuck?' },
  { context: 'Question 2', question: 'Write down your goals somewhere so you remember them and Celebrate Yourself whenever you practice.' },
]

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-1.5">
      {children}
    </p>
  )
}

function SectionHeading({ children }) {
  return <h2 className="text-xl font-semibold text-brand-text mb-4">{children}</h2>
}

function Divider() {
  return <div className="border-t border-brand-border my-7" />
}

export default function LessonViewV2({ onBookmark, enrolledCourse }) {
  const navigate = useNavigate()
  const location = useLocation()
  const course = location.state?.course
  const initialUnitId = location.state?.unitId ?? 1
  const initialLessonIndex = location.state?.lessonIndex ?? 0

  const [selectedLesson, setSelectedLesson] = useState({
    unitId: initialUnitId,
    lessonIndex: initialLessonIndex,
  })
  const [activeVideo, setActiveVideo] = useState(0)
  const [bookmarked, setBookmarked] = useState(false)
  const [showToast, setShowToast] = useState(false)

  const grade = course?.grade ?? 'Grade 3'
  const completedCount = enrolledCourse?.id === course?.id ? enrolledCourse.completed : 0
  const isLessonCompleted = (unitId, lessonIndex) =>
    getFlatIndex(unitId, lessonIndex) < completedCount

  const currentUnit = units.find((u) => u.id === selectedLesson.unitId)
  const currentLessonTitle = currentUnit?.sub[selectedLesson.lessonIndex] ?? 'Welcome Video!'

  const isLesson2 = selectedLesson.unitId === 1 && selectedLesson.lessonIndex === 1
  const isLesson4 = selectedLesson.unitId === 1 && selectedLesson.lessonIndex === 3

  const handleSelectLesson = (lessonIndex) => {
    setSelectedLesson((prev) => ({ ...prev, lessonIndex }))
    setActiveVideo(0)
    setBookmarked(false)
  }

  const handleBookmark = () => {
    if (bookmarked) return
    setBookmarked(true)
    setShowToast(true)
    onBookmark?.({
      lesson: currentLessonTitle,
      unit: currentUnit?.title,
      grade,
      competency: course?.competency,
      course,
    })
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

      {/* ── Sidebar: current unit only ── */}
      <aside
        className="flex-shrink-0 bg-white border-r border-brand-border flex flex-col overflow-hidden"
        style={{ width: '20rem' }}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-brand-border">
          <p className="text-lg font-semibold tracking-tight text-brand-text">{grade}</p>
        </div>

        {/* Current unit label */}
        <div className="px-4 py-2.5 bg-brand-bg border-b border-brand-border">
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext leading-snug">
            {currentUnit?.title}
          </p>
        </div>

        {/* Lesson list for current unit */}
        <div className="flex-1 overflow-y-auto py-1">
          {currentUnit?.sub.map((lessonName, i) => {
            const isSelected = i === selectedLesson.lessonIndex
            const done = isLessonCompleted(selectedLesson.unitId, i)
            return (
              <div key={i}>
                <button
                  onClick={() => handleSelectLesson(i)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors border-l-2 ${
                    isSelected
                      ? 'bg-brand-bg border-l-dessa-teal'
                      : 'border-l-transparent hover:bg-brand-bg'
                  }`}
                >
                  {done ? (
                    <CheckCircle2 size={15} className="flex-shrink-0" style={{ color: '#5B9E4D' }} />
                  ) : (
                    <Circle
                      size={15}
                      className={`flex-shrink-0 ${isSelected ? 'text-dessa-teal' : 'text-brand-border'}`}
                    />
                  )}
                  <span className={`text-sm ${isSelected ? 'font-semibold text-brand-text' : 'text-brand-text'}`}>
                    {lessonName}
                  </span>
                </button>
                {i < (currentUnit?.sub.length ?? 0) - 1 && (
                  <div className="border-t border-brand-border" />
                )}
              </div>
            )
          })}
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
              <div>
                <button
                  onClick={() => navigate('/mtw2/course', { state: { course } })}
                  className="flex items-center gap-1.5 text-sm font-medium text-brand-subtext hover:text-brand-text transition-colors mb-3"
                >
                  <ChevronLeft size={14} />
                  Back to Course
                </button>
                <h1 className="text-2xl font-semibold text-brand-text">{currentLessonTitle}</h1>
              </div>

              <div className="flex flex-col items-end gap-2.5 flex-shrink-0 ml-6">
                <span
                  className="text-xs font-semibold px-3 py-1.5 rounded-full"
                  style={{ background: '#FEF3DC', color: '#F5A623' }}
                >
                  {course?.competency}
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

          {/* ── Video area ── */}
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
                    <button
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
                      style={{ background: '#2A7F8F' }}
                    >
                      <Play size={20} fill="white" className="text-white ml-0.5" />
                    </button>
                    <p className="text-white/70 text-sm">Unit 1 — Welcome Video</p>
                  </div>
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                  >
                    <Clock size={11} />6:48
                  </div>
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
                    <button
                      className="w-14 h-14 rounded-full flex items-center justify-center mb-3 transition-transform hover:scale-105 shadow-lg"
                      style={{ background: '#2A7F8F' }}
                    >
                      <Play size={20} fill="white" className="text-white ml-0.5" />
                    </button>
                    <p className="text-white font-semibold text-base leading-snug">{lesson2Videos[activeVideo].title}</p>
                  </div>
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                  >
                    <Clock size={11} />{lesson2Videos[activeVideo].duration}
                  </div>
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-semibold text-white"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                  >
                    {activeVideo + 1} / {lesson2Videos.length}
                  </div>
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
                        <div
                          className="absolute bottom-1.5 right-1.5 flex items-center gap-1 px-1.5 py-0.5 rounded text-white"
                          style={{ background: 'rgba(0,0,0,0.5)', fontSize: '10px' }}
                        >
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
                  <div
                    className="absolute top-3 right-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium text-white"
                    style={{ background: 'rgba(0,0,0,0.45)' }}
                  >
                    <Clock size={11} />{lesson4Videos[activeVideo].duration}
                  </div>
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
            <h2 className="text-3xl font-bold text-brand-text mb-6">Facilitation Guide</h2>

            <Tabs defaultValue="intro">
              <TabsList className="bg-transparent p-0 w-full border-b border-brand-border rounded-none h-auto gap-0 justify-start mb-0">
                {['Intro', 'Discussion'].map((tab) => (
                  <TabsTrigger
                    key={tab}
                    value={tab.toLowerCase()}
                    className="rounded-none border-b-2 border-transparent -mb-px px-4 pb-3 pt-1 text-sm font-medium text-brand-subtext bg-transparent shadow-none hover:text-brand-text data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-dessa-teal data-[state=active]:text-brand-text"
                  >
                    {tab}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Intro */}
              <TabsContent value="intro" tabIndex={-1} className="mt-7 space-y-7">
                <div className="grid grid-cols-2 gap-6">
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
                      Explain how practice helps us reach our goals and improve.
                    </p>
                  </div>
                </div>

                <Divider />

                <div>
                  <SectionLabel>Main Activity</SectionLabel>
                  <div className="pl-4 border-l-4 border-mtw-amber">
                    <p className="text-body text-brand-text leading-relaxed">
                      Write goals on the right side of a paper and actions/steps we can take today
                      to work towards that goal. Then complete the sentence starter, "Today I will__
                      so that tomorrow I can ___."
                    </p>
                  </div>
                </div>

                <Divider />

                <div>
                  <SectionLabel>Quick Tips</SectionLabel>
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

                <div>
                  <SectionLabel>Background</SectionLabel>
                  <SectionHeading>Why Do We Do This?</SectionHeading>
                  <p className="text-body text-brand-text leading-relaxed">
                    In Goalie, we take time to reflect on our long-term goals and identify small,
                    meaningful steps we can take today — no matter how big those goals might be.
                    This approach helps us recognize the value of practice and persistence. When we
                    break our goals into smaller actions, we build confidence as we make progress.
                    And the more confident we feel, the more likely we are to keep going, even when
                    things get tough.
                  </p>
                </div>

                <Divider />

                <div>
                  <SectionLabel>Cross-Curricular</SectionLabel>
                  <SectionHeading>Ideas for Integration</SectionHeading>
                  <ul className="space-y-2.5">
                    {integrationIdeas.map((idea) => (
                      <li key={idea} className="flex items-start gap-3 text-body text-brand-text">
                        <span
                          className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                          style={{ background: '#2D7D78' }}
                        />
                        {idea}
                      </li>
                    ))}
                  </ul>
                </div>

                <Divider />

                <div>
                  <SectionLabel>Remote Learning</SectionLabel>
                  <SectionHeading>Virtual Facilitation</SectionHeading>
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-semibold text-brand-text mb-1">Synchronous</p>
                      <p className="text-body text-brand-text leading-relaxed">
                        In a video conference setting, follow the video's instructions as is.
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-brand-text mb-1">Asynchronous</p>
                      <p className="text-body text-brand-text leading-relaxed">
                        Invite students to share a picture of their drawing/their responses to the
                        prompts, through a discussion board, email chain, or shared document.
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Discussion */}
              <TabsContent value="discussion" tabIndex={-1} className="mt-7 pb-[600px]">
                <div className="space-y-7">
                  {discussionPrompts.map((p, i) => (
                    <>
                      <div key={p.context}>
                        <SectionHeading>{p.context}</SectionHeading>
                        <p className="text-body text-brand-text leading-relaxed">{p.question}</p>
                      </div>
                      {i < discussionPrompts.length - 1 && <Divider />}
                    </>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
