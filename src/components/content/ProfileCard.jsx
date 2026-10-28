import { Calendar } from 'lucide-react'
import { COMPETENCIES } from '../../lib/contentReportData'

// Profile card shared by the Content report's user and course pages (2026-10-27, from profile references the user
// shared): a teal banner with navy flowers, an avatar overlapping it, the name, a meta line with icons, three
// numbers and the date range, then sections split by dotted lines.

export const initials = name => name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase()
export const courseMark = c => (c.type === 'tier2' ? 'T2' : c.type === 'adult' ? 'AW' : c.type === 'family' ? 'F' : c.grade === 'Kindergarten' ? 'K' : c.grade.replace('Grade ', ''))
// Course colors run from deep teal to pale yellow, so a tile's letters go dark on the light ones (WCAG contrast).
export const isLight = hex => {
  const [r, g, b] = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.3
}

// A course's colored tile with its grade mark (K, 4, T2, AW, F). `size` 'lg' is the avatar on a course page.
export function CourseTile({ course, size = 'sm' }) {
  const box = size === 'lg' ? 'w-20 h-20 rounded-lg text-2xl ring-4 ring-white' : 'w-10 h-10 rounded-md text-sm'
  return (
    <span className={`${box} shrink-0 flex items-center justify-center font-semibold ${isLight(course.color) ? 'text-brand-text' : 'text-white'}`} style={{ background: course.color }} aria-hidden="true">
      {courseMark(course)}
    </span>
  )
}

// The curriculum banner's flower.
const FLOWER = 'M182.834 49.376C211.935 55.9109 211.348 101.207 209.903 124.848C265.813 53.584 325.514 90.3847 246.203 160.327C251.085 160.075 255.995 159.906 260.89 159.82C338.633 158.829 344.387 215.521 245.753 211.573C251.303 215.994 256.526 220.821 261.367 226.013C314.918 282.87 267.354 315.518 209.848 247.045C211.975 272.405 211.348 306.785 187.948 322.258C186.966 322.264 185.97 322.229 184.989 322.154C158.424 319.966 157.415 266.91 159.106 247.108C154.811 252.44 150.16 257.476 145.197 262.176C89.6001 315.653 54.0496 271.73 123.01 211.644C117.624 211.884 112.237 212.035 106.85 212.098C30.2535 212.547 25.4671 156.918 122.737 160.205C47.9266 98.3672 96.2821 48.5131 158.711 124.571C157.183 99.9471 157.661 61.861 182.834 49.376Z'
function Flower({ className }) {
  return (
    <svg viewBox="0 0 370 370" className={className} aria-hidden="true">
      <path d={FLOWER} fill="currentColor" />
    </svg>
  )
}

export function ProfileSection({ title, children }) {
  return (
    <section className="px-5 py-4 border-t border-dashed border-brand-border">
      <h2 className="text-sm font-semibold text-brand-text mb-3">{title}</h2>
      {children}
    </section>
  )
}

// A group's top three competencies as chips, most lessons first (no counts, 2026-10-27). `comps` is { key: lessons }.
export function TopCompetencies({ comps }) {
  const top = COMPETENCIES.map(c => ({ ...c, n: comps[c.key] })).filter(c => c.n > 0).sort((a, b) => b.n - a.n).slice(0, 3)
  if (!top.length) return <p className="text-sm text-brand-subtext">No lessons in these dates yet.</p>
  return (
    <ul className="flex flex-wrap gap-1.5">
      {top.map(t => (
        <li key={t.key} className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-brand-border text-xs font-medium text-brand-text">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ background: t.color }} aria-hidden="true" />
          {t.label}
        </li>
      ))}
    </ul>
  )
}

// `avatar` sits over the banner's edge; `meta` is [[Icon, text]], split by thin dividers; `stats` is [[label, value]].
export default function ProfileCard({ avatar, title, meta, stats, range, children }) {
  return (
    <div className="bg-white rounded-lg border border-brand-border overflow-hidden">
      <div className="relative h-24 bg-dessa-teal overflow-hidden">
        <Flower className="absolute left-5 top-5 w-36 h-36 text-dessa-navy rotate-12" />
        <Flower className="absolute right-24 top-10 w-16 h-16 text-dessa-navy -rotate-12" />
      </div>
      <div className="px-5 pb-4">
        <div className="-mt-10 mb-3 w-fit relative">{avatar}</div>
        <h1 className="text-lg font-semibold leading-tight text-brand-text">{title}</h1>
        <p className="flex items-center gap-2 text-sm text-brand-subtext mt-1 min-w-0">
          {meta.map(([Icon, text], i) => (
            <span key={i} className={`inline-flex items-center gap-2 ${i === meta.length - 1 ? 'min-w-0' : 'shrink-0'}`}>
              {i > 0 && <span className="w-px h-3.5 bg-brand-border shrink-0" aria-hidden="true" />}
              <span className="inline-flex items-center gap-1.5 min-w-0"><Icon size={14} className="shrink-0" aria-hidden="true" /><span className="truncate">{text}</span></span>
            </span>
          ))}
        </p>
        <dl className="grid grid-cols-3 mt-4">
          {stats.map(([label, value], i) => (
            <div key={i} className={i === 0 ? 'pr-3' : 'px-3'}>
              <dt className="text-xs text-brand-subtext truncate">{label}</dt>
              <dd className="text-lg font-semibold text-brand-text tabular-nums mt-0.5 truncate">{value}</dd>
            </div>
          ))}
        </dl>
        <p className="flex items-center gap-1.5 text-xs text-brand-subtext mt-3">
          <Calendar size={12} aria-hidden="true" /> {range}
        </p>
      </div>
      {children}
    </div>
  )
}
