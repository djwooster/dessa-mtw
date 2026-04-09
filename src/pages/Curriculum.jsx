import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Play, ChevronRight, Sparkles, CheckCircle2 } from 'lucide-react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '../components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs'

const stagger = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.06 },
})

const filters = [
  { value: 'all',              label: 'All' },
  { value: 'Early Elementary', label: 'Early Elementary' },
  { value: 'Late Elementary',  label: 'Late Elementary' },
  { value: 'Middle School',    label: 'Middle School' },
  { value: 'High School',      label: 'High School' },
]

const courses = [
  {
    id: 1,
    grade: 'Grade 3',
    level: 'Early Elementary',
    title: 'Understanding Our Emotions',
    competency: 'Self-Awareness',
    emoji: '🌱',
    color: '#2D7D78',
    lessons: 36,
    completed: 36,
    status: 'complete',
  },
  {
    id: 2,
    grade: 'Grade 4',
    level: 'Late Elementary',
    title: 'Self-Management in Action',
    competency: 'Self-Management',
    emoji: '🦋',
    color: '#F5A623',
    lessons: 36,
    completed: 5,
    status: 'active',
  },
  {
    id: 3,
    grade: 'Grade 5',
    level: 'Late Elementary',
    title: 'Building Responsible Decisions',
    competency: 'Responsible Decision-Making',
    emoji: '🌟',
    color: '#E8653A',
    lessons: 36,
    completed: 0,
    status: 'upcoming',
    isNew: true,
  },
  {
    id: 4,
    grade: 'Grade 6',
    level: 'Middle School',
    title: 'Social Awareness & Empathy',
    competency: 'Social Awareness',
    emoji: '🤝',
    color: '#7B5EA7',
    lessons: 36,
    completed: 0,
    status: 'upcoming',
  },
  {
    id: 5,
    grade: 'Grade 7',
    level: 'Middle School',
    title: 'Relationship Skills',
    competency: 'Relationship Skills',
    emoji: '💬',
    color: '#5B9E4D',
    lessons: 36,
    completed: 0,
    status: 'upcoming',
  },
  {
    id: 6,
    grade: 'Grade 8',
    level: 'Middle School',
    title: 'Goal-Directed Behavior',
    competency: 'Goal-Directed Behavior',
    emoji: '🎯',
    color: '#2A7F8F',
    lessons: 36,
    completed: 0,
    status: 'upcoming',
  },
]

function CourseCard({ course, index, onClick }) {
  const pct = course.lessons > 0 ? Math.round((course.completed / course.lessons) * 100) : 0

  return (
    <motion.div {...stagger(index)} whileHover={{ y: -2 }} className="h-full">
      <Card
        className={`h-full flex flex-col transition-shadow cursor-pointer ${
          course.status !== 'upcoming' ? 'hover:shadow-md' : 'opacity-70'
        }`}
        onClick={onClick}
      >
        <CardHeader>
          {/* Top row: badges */}
          <div className="flex items-center justify-end mb-4">
            <div className="flex items-center gap-1.5">
              {course.isNew && (
                <span
                  className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full"
                  style={{ background: '#FEF3DC', color: '#F5A623' }}
                >
                  <Sparkles size={10} />
                  NEW
                </span>
              )}
              {course.status === 'complete' && (
                <CheckCircle2 size={15} className="text-mtw-green" />
              )}
            </div>
          </div>

          {/* Emoji container */}
          <div
            className="w-11 h-11 rounded-xl flex items-center justify-center text-xl mb-3 flex-shrink-0"
            style={{ background: `${course.color}14` }}
          >
            {course.emoji}
          </div>

          <CardTitle>{course.grade}</CardTitle>

          {/* Competency badge */}
          <div className="mt-2">
            <span
              className="inline-block text-xs font-medium px-2.5 py-0.5 rounded-full"
              style={{ background: `${course.color}12`, color: course.color }}
            >
              {course.competency}
            </span>
          </div>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col justify-end pt-4">
          {/* Progress */}
          <div className="space-y-1.5 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-brand-subtext">
                {course.status === 'upcoming' ? 'Not started' : `${course.completed} of ${course.lessons} units`}
              </span>
              {course.status !== 'upcoming' && (
                <span className="text-sm font-semibold text-brand-text">{pct}%</span>
              )}
            </div>
            <div className="h-1.5 bg-brand-border rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${pct}%`,
                  background: course.status === 'complete' ? '#5B9E4D' : course.color,
                }}
              />
            </div>
          </div>
        </CardContent>

        <CardFooter className="border-t border-brand-border pt-4 justify-between">
          <span className="text-sm text-brand-subtext">{course.lessons} units</span>
          <button
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full transition-all hover:brightness-95 text-white"
            style={{
              background: course.status === 'upcoming'
                ? '#CBD5E0'
                : course.status === 'complete'
                ? '#5B9E4D'
                : course.color,
            }}
          >
            {course.status === 'complete' ? (
              <>Review <ChevronRight size={12} /></>
            ) : course.status === 'active' ? (
              <><Play size={11} fill="currentColor" /> Continue</>
            ) : (
              <>Start <ChevronRight size={12} /></>
            )}
          </button>
        </CardFooter>
      </Card>
    </motion.div>
  )
}

export default function Curriculum() {
  const navigate = useNavigate()

  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">
      {/* Page header */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mb-6"
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-1">
          Move This World
        </p>
        <h1 className="text-2xl font-semibold text-brand-text">Curriculum</h1>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.05 }}
      >
        <Tabs defaultValue="all">
          <TabsList>
            {filters.map((f) => (
              <TabsTrigger key={f.value} value={f.value}>{f.label}</TabsTrigger>
            ))}
          </TabsList>

          {filters.map((f) => {
            const filtered = f.value === 'all'
              ? courses
              : courses.filter((c) => c.level === f.value)
            return (
              <TabsContent key={f.value} value={f.value}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filtered.map((course, i) => (
                    <CourseCard
                      key={course.id}
                      course={course}
                      index={i}
                      onClick={() => course.status !== 'upcoming' && navigate('/mtw/lesson')}
                    />
                  ))}
                </div>
              </TabsContent>
            )
          })}
        </Tabs>
      </motion.div>
    </div>
  )
}
