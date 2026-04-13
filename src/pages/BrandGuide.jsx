import { motion } from 'framer-motion'
import { ChevronRight, Play } from 'lucide-react'

const stagger = (i) => ({
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, delay: i * 0.06 },
})

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-1.5">
      {children}
    </p>
  )
}

function SectionHeading({ children }) {
  return (
    <h2 className="text-xl font-semibold text-brand-text mb-1">{children}</h2>
  )
}

function Divider() {
  return <div className="border-t border-brand-border my-10" />
}

function Card({ children, className = '' }) {
  return (
    <div className={`bg-white rounded-2xl border border-brand-border p-6 ${className}`}>
      {children}
    </div>
  )
}

// ─── Color swatch ─────────────────────────────────────────────────────────────

function Swatch({ name, token, hex, usage, light = false }) {
  return (
    <div className="flex flex-col gap-2">
      <div
        className="h-16 rounded-xl border border-black/5"
        style={{ background: hex }}
      />
      <div>
        <p className="text-sm font-semibold text-brand-text">{name}</p>
        <p className="text-xs text-brand-subtext font-mono">{hex}</p>
        <p className="text-xs text-brand-subtext mt-0.5">{token}</p>
        {usage && <p className="text-xs text-brand-subtext/70 mt-0.5 italic">{usage}</p>}
      </div>
    </div>
  )
}

// ─── Type specimen ────────────────────────────────────────────────────────────

function TypeRow({ label, size, weight, sample }) {
  return (
    <div className="flex items-baseline gap-6 py-3 border-b border-brand-border last:border-0">
      <div className="w-36 flex-shrink-0">
        <p className="text-xs font-semibold text-brand-subtext">{label}</p>
        <p className="text-xs text-brand-subtext/70 font-mono">{size} · {weight}</p>
      </div>
      <p className="text-brand-text" style={{ fontSize: size, fontWeight: weight }}>
        {sample}
      </p>
    </div>
  )
}

// ─── Token row ────────────────────────────────────────────────────────────────

function TokenRow({ token, hex, usage }) {
  return (
    <tr className="border-b border-brand-border last:border-0">
      <td className="py-2.5 pr-4">
        <span className="text-xs font-mono text-brand-text bg-brand-bg px-2 py-0.5 rounded">
          {token}
        </span>
      </td>
      <td className="py-2.5 pr-4">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-black/10 flex-shrink-0"
            style={{ background: hex }}
          />
          <span className="text-xs font-mono text-brand-subtext">{hex}</span>
        </div>
      </td>
      <td className="py-2.5 text-xs text-brand-subtext">{usage}</td>
    </tr>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BrandGuide() {
  return (
    <div className="max-w-screen-xl mx-auto px-6 py-8">

      {/* ── Hero ── */}
      <motion.div {...stagger(0)} className="mb-10">
        <div
          className="rounded-2xl px-10 py-12 flex items-end justify-between overflow-hidden relative"
          style={{ background: '#1B2B4B', minHeight: '200px' }}
        >
          {/* Background accent */}
          <div
            className="absolute right-0 top-0 w-96 h-96 rounded-full opacity-10"
            style={{ background: '#2A7F8F', transform: 'translate(30%, -30%)' }}
          />
          <div
            className="absolute right-48 bottom-0 w-64 h-64 rounded-full opacity-10"
            style={{ background: '#F5A623', transform: 'translate(0, 40%)' }}
          />

          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-3">
              Riverside Insights · 2026
            </p>
            <h1 className="text-4xl font-semibold text-white mb-2 leading-tight">
              DESSA × MTW
            </h1>
            <p className="text-lg font-medium" style={{ color: '#F5A623' }}>
              Brand Guidelines
            </p>
            <p className="text-sm text-white/60 mt-3 max-w-md leading-relaxed">
              A design exploration unifying two product personalities — DESSA's clinical trustworthiness
              and MTW's warm energy — into a single educator experience.
            </p>
          </div>

          <div className="relative z-10 flex gap-3">
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-2" style={{ background: '#2A7F8F' }}>
                <span className="text-white text-xs font-bold">DESSA</span>
              </div>
              <p className="text-xs text-white/50">Clinical</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 rounded-xl flex items-center justify-center mb-2" style={{ background: '#F5A623' }}>
                <span className="text-white text-xs font-bold">MTW</span>
              </div>
              <p className="text-xs text-white/50">Playful</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ── Brand Personalities ── */}
      <motion.div {...stagger(1)} className="mb-10">
        <SectionLabel>Brand Overview</SectionLabel>
        <SectionHeading>Two Personalities, One Shell</SectionHeading>
        <p className="text-sm text-brand-subtext mb-5 max-w-2xl">
          DESSA and MTW serve the same educator but carry distinct emotional registers.
          The design system expresses each identity clearly while keeping them visually coherent within a shared layout.
        </p>
        <div className="grid grid-cols-2 gap-5">
          <Card>
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center mb-4 text-white text-xs font-bold"
              style={{ background: '#2A7F8F' }}
            >
              D
            </div>
            <p className="text-base font-semibold text-brand-text mb-1">DESSA</p>
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#2A7F8F' }}>
              Cool · Clinical · Trustworthy
            </p>
            <p className="text-sm text-brand-subtext leading-relaxed mb-4">
              Used for ratings, assessments, and data views. The design language is precise and
              measured — rounded rectangles, teal primaries, and data-forward layouts that
              reinforce credibility.
            </p>
            <div className="space-y-1.5 text-sm text-brand-subtext">
              <div className="flex items-center gap-2"><span className="text-brand-border">—</span> Buttons: <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">rounded-md</code></div>
              <div className="flex items-center gap-2"><span className="text-brand-border">—</span> Primary: <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">#2A7F8F</code></div>
              <div className="flex items-center gap-2"><span className="text-brand-border">—</span> Data colors: green / blue / salmon</div>
            </div>
          </Card>
          <Card>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4 text-white text-xs font-bold"
              style={{ background: '#F5A623' }}
            >
              M
            </div>
            <p className="text-base font-semibold text-brand-text mb-1">Move This World</p>
            <p className="text-xs font-medium uppercase tracking-wider mb-3" style={{ color: '#F5A623' }}>
              Warm · Playful · Energetic
            </p>
            <p className="text-sm text-brand-subtext leading-relaxed mb-4">
              Used for curriculum, lessons, and in-class activities. The design language is
              inviting and expressive — pill shapes, amber warmth, and a content-first
              hierarchy that matches the energy of a classroom.
            </p>
            <div className="space-y-1.5 text-sm text-brand-subtext">
              <div className="flex items-center gap-2"><span className="text-brand-border">—</span> Buttons: <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">rounded-md</code></div>
              <div className="flex items-center gap-2"><span className="text-brand-border">—</span> Primary: <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">#F5A623</code></div>
              <div className="flex items-center gap-2"><span className="text-brand-border">—</span> Accents: teal / coral / green</div>
            </div>
          </Card>
        </div>
      </motion.div>

      <Divider />

      {/* ── Color Palette ── */}
      <motion.div {...stagger(2)} className="mb-10">
        <SectionLabel>Color System</SectionLabel>
        <SectionHeading>Color Palette</SectionHeading>
        <p className="text-sm text-brand-subtext mb-6 max-w-2xl">
          No default Tailwind colors are used — every color is a named token from the custom palette.
          Each brand has its own set; shared neutrals provide consistency across the full experience.
        </p>

        {/* DESSA */}
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-3">DESSA</p>
        <div className="grid grid-cols-6 gap-4 mb-7">
          <Swatch name="Navy" token="dessa-navy" hex="#1B2B4B" usage="Body text, nav" />
          <Swatch name="Teal" token="dessa-teal" hex="#2A7F8F" usage="Primary action" />
          <Swatch name="Teal Light" token="dessa-tealLight" hex="#E8F4F6" usage="Teal bg tint" />
          <Swatch name="Green" token="dessa-green" hex="#5DB87A" usage="Strength data" />
          <Swatch name="Blue" token="dessa-blue" hex="#A8C8E8" usage="Typical data" />
          <Swatch name="Salmon" token="dessa-salmon" hex="#F08080" usage="Need data" />
        </div>

        {/* MTW */}
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-3">MTW</p>
        <div className="grid grid-cols-6 gap-4 mb-7">
          <Swatch name="Amber" token="mtw-amber" hex="#F5A623" usage="Primary brand" />
          <Swatch name="Amber Light" token="mtw-amberLight" hex="#FEF3DC" usage="Amber bg tint" />
          <Swatch name="Teal" token="mtw-teal" hex="#2D7D78" usage="Accent / complete" />
          <Swatch name="Teal Light" token="mtw-tealLight" hex="#E0F0EF" usage="Teal bg tint" />
          <Swatch name="Coral" token="mtw-coral" hex="#E8653A" usage="Accent / energy" />
          <Swatch name="Green" token="mtw-green" hex="#5B9E4D" usage="Complete state" />
        </div>

        {/* Shared */}
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-3">Shared Neutrals</p>
        <div className="grid grid-cols-5 gap-4">
          <Swatch name="Text" token="brand-text" hex="#1B2B4B" usage="Primary body copy" />
          <Swatch name="Subtext" token="brand-subtext" hex="#6B7A8D" usage="Labels, captions" />
          <Swatch name="Background" token="brand-bg" hex="#F0F2F5" usage="Page background" />
          <Swatch name="Border" token="brand-border" hex="#E2E6EA" usage="Card / divider borders" />
          <Swatch name="White" token="—" hex="#FFFFFF" usage="Card surface" />
        </div>
      </motion.div>

      <Divider />

      {/* ── Typography ── */}
      <motion.div {...stagger(3)} className="mb-10">
        <SectionLabel>Typography</SectionLabel>
        <SectionHeading>Type Scale</SectionHeading>
        <p className="text-sm text-brand-subtext mb-5 max-w-2xl">
          Inter is used across all surfaces. The scale leans toward restraint — most UI copy sits between
          12–16px, with 24px reserved for page headings and nothing beyond that except the brand guide hero.
        </p>
        <Card>
          <TypeRow label="Page Heading" size="24px" weight="600" sample="Ratings — 25-26 Mid" />
          <TypeRow label="Section Heading" size="16px" weight="600" sample="Story Sharing Circle" />
          <TypeRow label="Body / Default" size="14px" weight="400" sample="Students will practice sharing personal stories that connect to emotions." />
          <TypeRow label="Label / UI" size="13px" weight="500" sample="Grade Level Comparison" />
          <TypeRow label="Caption / Meta" size="12px" weight="400" sample="Window closes June 6, 2026" />
          <TypeRow label="Overline" size="11px" weight="600" sample="DESSA · 25-26 MID ASSESSMENT WINDOW" />
        </Card>

        <div className="grid grid-cols-3 gap-5 mt-5">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-3">Weights Used</p>
            <div className="space-y-2">
              {[['400', 'Regular'], ['500', 'Medium'], ['600', 'Semibold'], ['700', 'Bold']].map(([w, l]) => (
                <div key={w} className="flex items-baseline gap-3">
                  <span className="text-xs font-mono text-brand-subtext w-8">{w}</span>
                  <span className="text-sm text-brand-text" style={{ fontWeight: w }}>{l}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-3">Tracking</p>
            <div className="space-y-2">
              {[
                ['Normal', 'tracking-normal', 'Body copy and headings'],
                ['Tight', 'tracking-tight', 'Grade-level labels'],
                ['Wider', 'tracking-wider', 'Overlines (uppercase labels)'],
              ].map(([name, cls, use]) => (
                <div key={name}>
                  <p className="text-sm text-brand-text font-medium">{name}</p>
                  <p className="text-xs font-mono text-brand-subtext">{cls}</p>
                  <p className="text-xs text-brand-subtext/70 italic">{use}</p>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-3">Leading</p>
            <div className="space-y-2">
              {[
                ['Snug', 'leading-snug', 'Sidebar unit titles'],
                ['Normal', 'leading-normal', 'UI labels'],
                ['Relaxed', 'leading-relaxed', 'Body / long-form copy'],
              ].map(([name, cls, use]) => (
                <div key={name}>
                  <p className="text-sm text-brand-text font-medium">{name}</p>
                  <p className="text-xs font-mono text-brand-subtext">{cls}</p>
                  <p className="text-xs text-brand-subtext/70 italic">{use}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </motion.div>

      <Divider />

      {/* ── Design Tokens Table ── */}
      <motion.div {...stagger(4)} className="mb-10">
        <SectionLabel>Tokens</SectionLabel>
        <SectionHeading>All Design Tokens</SectionHeading>
        <p className="text-sm text-brand-subtext mb-5 max-w-2xl">
          Defined in <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">tailwind.config.js</code> under <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">theme.extend.colors</code>. No default Tailwind color palette is loaded.
        </p>
        <Card className="p-0 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-brand-border">
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-brand-subtext px-6 py-3">Token</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-brand-subtext px-6 py-3">Value</th>
                <th className="text-left text-xs font-semibold uppercase tracking-wider text-brand-subtext px-6 py-3">Usage</th>
              </tr>
            </thead>
            <tbody className="px-6">
              {[
                ['dessa-navy',      '#1B2B4B', 'Body text, nav background (dark mode candidate)'],
                ['dessa-teal',      '#2A7F8F', 'DESSA primary action buttons, focus ring'],
                ['dessa-tealLight', '#E8F4F6', 'Timeline current badge background'],
                ['dessa-green',     '#5DB87A', 'Strength band in grade bar chart'],
                ['dessa-blue',      '#A8C8E8', 'Typical band in grade bar chart'],
                ['dessa-salmon',    '#F08080', 'Need band in grade bar chart'],
                ['mtw-amber',       '#F5A623', 'MTW primary brand, filter tab underline'],
                ['mtw-amberLight',  '#FEF3DC', 'Active unit highlight, NEW badge background'],
                ['mtw-teal',        '#2D7D78', 'Grade 3 course color, MTW accent'],
                ['mtw-tealLight',   '#E0F0EF', 'MTW teal bg tint'],
                ['mtw-coral',       '#E8653A', 'Grade 5 course color, energy accent'],
                ['mtw-green',       '#5B9E4D', 'Complete state checkmarks and progress bars'],
                ['mtw-greenLight',  '#EAF4E7', 'Complete state background tints'],
                ['mtw-purple',      '#7B5EA7', 'Grade 6 course color'],
                ['brand-text',      '#1B2B4B', 'Primary body copy across all surfaces'],
                ['brand-subtext',   '#6B7A8D', 'Secondary text, labels, captions, icons'],
                ['brand-bg',        '#F0F2F5', 'Page background, hover state fills'],
                ['brand-border',    '#E2E6EA', 'Card borders, dividers, separators'],
                ['brand-focus',     '#2A7F8F', 'Focus ring color'],
              ].map(([token, hex, usage]) => (
                <TokenRow key={token} token={token} hex={hex} usage={usage} />
              ))}
            </tbody>
          </table>
        </Card>
      </motion.div>

      <Divider />

      {/* ── Components ── */}
      <motion.div {...stagger(5)} className="mb-10">
        <SectionLabel>Components</SectionLabel>
        <SectionHeading>Button Variants</SectionHeading>
        <p className="text-sm text-brand-subtext mb-5 max-w-2xl">
          All buttons across DESSA and MTW use <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">rounded-md</code> (4px radius) — a consistent, structured shape that works across both brand contexts.
        </p>
        <div className="mb-5">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-4">Unified — rounded-md</p>
            <div className="flex flex-wrap gap-3">
              <button
                className="px-5 py-2.5 rounded-md text-sm font-semibold text-white transition-all hover:brightness-90"
                style={{ background: '#2A7F8F' }}
              >
                Primary Action
              </button>
              <button
                className="px-5 py-2.5 rounded-md text-sm font-semibold border bg-white hover:bg-dessa-tealLight transition-colors"
                style={{ borderColor: '#2A7F8F', color: '#2A7F8F' }}
              >
                Secondary Action
              </button>
              <button
                className="px-5 py-2.5 rounded-md text-sm font-semibold border border-brand-border text-brand-subtext bg-white hover:bg-brand-bg transition-colors"
              >
                Tertiary Action
              </button>
            </div>
          </Card>
        </div>

        <SectionHeading>Badges & Pills</SectionHeading>
        <p className="text-sm text-brand-subtext mb-4 max-w-2xl">
          Competency badges, status indicators, and overline labels use a consistent pill shape with tinted backgrounds derived from each course's accent color.
        </p>
        <Card>
          <div className="flex flex-wrap gap-3">
            <span className="text-xs font-medium px-2.5 py-1 rounded-full border border-brand-border text-brand-text bg-white">Storytelling</span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#2A7F8F12', color: '#2A7F8F' }}>Self-Management</span>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full" style={{ background: '#FEF3DC', color: '#F5A623' }}>Self-Management</span>
            <span className="flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: '#FEF3DC', color: '#F5A623' }}>✦ NEW</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#E8F4F6', color: '#2A7F8F' }}>Current</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: '#EAF4E7', color: '#5B9E4D' }}>Complete</span>
          </div>
        </Card>

        <div className="mt-5">
          <SectionHeading>Card Shell</SectionHeading>
          <p className="text-sm text-brand-subtext mb-4 max-w-2xl">
            All cards share the same surface: white background, <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">rounded-2xl</code>, <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">border border-brand-border</code>, and a subtle <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">shadow-sm</code>. On hover, interactive cards lift with <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded">shadow-md</code>.
          </p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Default', shadow: 'shadow-sm' },
              { label: 'Hover', shadow: 'shadow-md' },
              { label: 'Active / Selected', border: '#2A7F8F', shadow: 'shadow-sm' },
            ].map(({ label, shadow, border }) => (
              <div
                key={label}
                className={`bg-white rounded-2xl border p-5 ${shadow}`}
                style={{ borderColor: border || '#E2E6EA' }}
              >
                <p className="text-xs font-semibold text-brand-subtext mb-1">{label}</p>
                <p className="text-sm text-brand-text">bg-white · rounded-2xl · border-brand-border</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <Divider />

      {/* ── Motion ── */}
      <motion.div {...stagger(6)} className="mb-10">
        <SectionLabel>Motion</SectionLabel>
        <SectionHeading>Animation Patterns</SectionHeading>
        <p className="text-sm text-brand-subtext mb-5 max-w-2xl">
          All motion uses Framer Motion. Animations are intentionally subtle — they add polish without distracting from the content.
        </p>
        <div className="grid grid-cols-3 gap-5">
          <Card>
            <p className="text-sm font-semibold text-brand-text mb-2">Page / Section Reveal</p>
            <p className="text-xs text-brand-subtext mb-3">Used on every page for staggered content entry.</p>
            <pre className="text-xs font-mono bg-brand-bg rounded-lg p-3 leading-relaxed text-brand-subtext overflow-auto">{`initial: { opacity: 0, y: 8 }
animate: { opacity: 1, y: 0 }
duration: 0.25s
delay: i × 0.06s`}</pre>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-brand-text mb-2">Card Hover Lift</p>
            <p className="text-xs text-brand-subtext mb-3">Applied to interactive cards in the curriculum grid.</p>
            <pre className="text-xs font-mono bg-brand-bg rounded-lg p-3 leading-relaxed text-brand-subtext overflow-auto">{`whileHover: { y: -2 }
transition: default spring`}</pre>
          </Card>
          <Card>
            <p className="text-sm font-semibold text-brand-text mb-2">Accordion Expand</p>
            <p className="text-xs text-brand-subtext mb-3">Used in lesson sidebar for unit sub-item reveal.</p>
            <pre className="text-xs font-mono bg-brand-bg rounded-lg p-3 leading-relaxed text-brand-subtext overflow-auto">{`initial: { height: 0, opacity: 0 }
animate: { height: 'auto', opacity: 1 }
duration: 0.18s
ease: easeInOut
wrapper: AnimatePresence`}</pre>
          </Card>
        </div>
      </motion.div>

      <Divider />

      {/* ── Spacing & Layout ── */}
      <motion.div {...stagger(7)} className="mb-10">
        <SectionLabel>Layout</SectionLabel>
        <SectionHeading>Spacing & Structure</SectionHeading>
        <p className="text-sm text-brand-subtext mb-5 max-w-2xl">
          Consistent spacing creates rhythm across pages. Most layout decisions use a base-4 grid (4px unit).
        </p>
        <div className="grid grid-cols-2 gap-5">
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-4">Page Layout</p>
            <div className="space-y-2.5 text-sm">
              {[
                ['Max width', 'max-w-screen-xl', 'All page containers'],
                ['Horizontal padding', 'px-6', 'Page gutters'],
                ['Vertical padding', 'py-8', 'Page top/bottom'],
                ['Nav height', 'h-14 (56px)', 'Sticky top nav'],
                ['Lesson sidebar', 'w-80 (320px)', 'Fixed width'],
                ['Lesson content', 'max-w-3xl', 'Reading column max'],
              ].map(([label, value, use]) => (
                <div key={label} className="flex items-baseline gap-3">
                  <span className="text-brand-subtext w-40 flex-shrink-0">{label}</span>
                  <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded text-brand-text">{value}</code>
                  <span className="text-brand-subtext text-xs">{use}</span>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <p className="text-xs font-semibold uppercase tracking-wider text-brand-subtext mb-4">Component Spacing</p>
            <div className="space-y-2.5 text-sm">
              {[
                ['Section gap', 'mb-7', 'Between page sections'],
                ['Card padding', 'p-5 / p-6', 'Card inner padding'],
                ['Card gap', 'gap-4 / gap-5', 'Grid card spacing'],
                ['Stat card grid', 'grid-cols-3 gap-4', 'Dashboard stats'],
                ['Divider', 'my-7', 'Lesson content sections'],
                ['Icon size (nav)', '14–16px', 'Nav action icons'],
              ].map(([label, value, use]) => (
                <div key={label} className="flex items-baseline gap-3">
                  <span className="text-brand-subtext w-40 flex-shrink-0">{label}</span>
                  <code className="text-xs bg-brand-bg px-1.5 py-0.5 rounded text-brand-text">{value}</code>
                  <span className="text-brand-subtext text-xs">{use}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </motion.div>

      <Divider />

      {/* ── Design Decisions ── */}
      <motion.div {...stagger(8)} className="mb-12">
        <SectionLabel>Rationale</SectionLabel>
        <SectionHeading>Key Design Decisions</SectionHeading>
        <p className="text-sm text-brand-subtext mb-5 max-w-2xl">
          Product and design decisions made during this exploration — documented for handoff and future iteration.
        </p>
        <div className="grid grid-cols-2 gap-4">
          {[
            {
              num: '01',
              title: 'MTW lives in its own nav item',
              body: 'MTW is a distinct product personality. Placing it last in the nav (rather than mixing it into DESSA navigation) preserves the boundary between assessment and curriculum — Tara knows exactly where she is at all times.',
            },
            {
              num: '02',
              title: 'Dashboard = DESSA home + MTW strip',
              body: 'The Dashboard is DESSA-forward (ratings, strategies, competency breakdown) with a compact amber CTA strip for "Continue Today\'s Lesson." MTW gets daily presence without crowding the assessment data.',
            },
            {
              num: '03',
              title: 'Ratings page is district-level; Dashboard pie is class-level',
              body: 'Tara\'s Dashboard shows her class of 30 students. The Ratings page shows the full district (9,895 students). Same data model, different scopes — the nav item routes to the broader view.',
            },
            {
              num: '04',
              title: 'Optimistic Thinking as the 6th DESSA competency',
              body: 'The new competency appears with a "NEW" badge in the curriculum grid and in the competency breakdown on the Dashboard. Introduced here as a design exploration — not yet in production.',
            },
            {
              num: '05',
              title: 'Lesson view navigates back to /mtw, not /curriculum',
              body: 'The lesson back button routes to /mtw (the MTW curriculum page). Users arrive at lessons from the MTW course grid, so back should return them there — not to a generic /curriculum path.',
            },
            {
              num: '06',
              title: 'Units expand in the sidebar via accordion, not a separate page',
              body: 'Sub-items (4–5 per unit) reveal inline beneath each unit row using an animated accordion. This keeps the sidebar as a persistent progress map — educators see their full journey at a glance while drilling into a unit.',
            },
            {
              num: '07',
              title: 'Unified button shape across both brands',
              body: 'Buttons use rounded-md across the full application. Brand context is communicated through color (dessa-teal vs. mtw-amber) rather than shape — this simplifies engineering while keeping the visual distinction clear.',
            },
            {
              num: '08',
              title: 'All data is hardcoded — no backend',
              body: 'This is a design prototype, not a product build. Every number, name, and state is mocked in component data arrays. The goal is to demonstrate UX decisions clearly, not to wire up live data.',
            },
          ].map(({ num, title, body }) => (
            <Card key={num} className="flex gap-4">
              <span
                className="text-2xl font-bold flex-shrink-0 leading-none"
                style={{ color: '#E2E6EA' }}
              >
                {num}
              </span>
              <div>
                <p className="text-sm font-semibold text-brand-text mb-1.5">{title}</p>
                <p className="text-sm text-brand-subtext leading-relaxed">{body}</p>
              </div>
            </Card>
          ))}
        </div>
      </motion.div>

      {/* Footer */}
      <motion.div {...stagger(9)}>
        <div
          className="rounded-2xl px-8 py-6 flex items-center justify-between"
          style={{ background: '#1B2B4B' }}
        >
          <div>
            <p className="text-white font-semibold mb-0.5">DESSA × MTW Prototype</p>
            <p className="text-white/50 text-sm">Built with React · Vite · Tailwind CSS · Framer Motion · Riverside Insights 2026</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ background: '#2A7F8F' }} />
            <div className="w-3 h-3 rounded-full" style={{ background: '#F5A623' }} />
          </div>
        </div>
      </motion.div>

    </div>
  )
}
