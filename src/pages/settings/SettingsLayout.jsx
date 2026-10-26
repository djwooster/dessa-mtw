import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import * as Popover from '@radix-ui/react-popover'
import { ChevronDown, X } from 'lucide-react'
import { useRole } from '../../lib/roleContext'
import { useSettingsConcept } from '../../lib/settingsConceptContext'
import Dashboard from '../Dashboard'

// Sentence case labels (2026-10-23), no slashes.
const SETTINGS_NAV = [
  { label: 'Imports', to: 'imports' },
  { label: 'Sites', to: 'sites' },
  { label: 'Students', to: 'students' },
  { label: 'Staff', to: 'staff' },
  { label: 'Curriculum setup', to: 'curriculum-setup' },
  { label: 'Yearly rating setup', to: 'yearly-rating-setup' },
  { label: 'Assignment review', to: 'assignment-review' },
  { label: 'Student self report', to: 'student-self-report' },
  { label: 'Email reminders', to: 'email-reminders' },
  { label: 'Parent and guardian rating', to: 'parent-guardian-rating' },
]

const MORE_WIDTH = 88 // room kept for the More button when tabs overflow

// The subnav matches the primary Nav's 13px items (2026-10-23) in a ~40px strip; the on-page tabs stay 14px.
const tabClass = (active, subnav = false) =>
  `${subnav ? 'pt-2.5 pb-2 text-[13px]' : 'pb-2.5 text-sm'} -mb-px font-medium whitespace-nowrap border-b-2 transition-colors ${
    active ? 'border-dessa-teal text-brand-text' : 'border-transparent text-brand-subtext hover:text-brand-text'
  }`

// Tabs across the top (2026-10-23). As many tabs as fit show in the row; the rest move into a More menu at the end.
// A hidden copy of the row measures every tab's width, and the count is recalculated whenever the row resizes.
// `subnav` (concept C): the tabs sit in the white strip under the Nav, which draws the bottom border itself.
function SettingsTabs({ subnav = false, className = '' }) {
  const { pathname } = useLocation()
  const rowRef = useRef(null)
  const measureRef = useRef(null)
  const [count, setCount] = useState(SETTINGS_NAV.length)
  const [moreOpen, setMoreOpen] = useState(false)

  useLayoutEffect(() => {
    const TAB_GAP = subnav ? 20 : 24 // gap-5 or gap-6
    const calc = () => {
      if (!rowRef.current || !measureRef.current) return
      const avail = rowRef.current.offsetWidth
      const widths = [...measureRef.current.children].map(el => el.offsetWidth)
      const total = widths.reduce((sum, w) => sum + w, 0) + TAB_GAP * (widths.length - 1)
      if (total <= avail) return setCount(widths.length)
      let used = MORE_WIDTH
      let n = 0
      for (const w of widths) {
        if (used + w + TAB_GAP > avail) break
        used += w + TAB_GAP
        n++
      }
      setCount(n)
    }
    calc()
    const ro = new ResizeObserver(calc)
    ro.observe(rowRef.current)
    // Widths change once Geist finishes loading.
    document.fonts?.ready.then(calc)
    return () => ro.disconnect()
  }, [subnav])

  const isActive = (to) => pathname.endsWith(`/${to}`)
  const shown = SETTINGS_NAV.slice(0, count)
  const hidden = SETTINGS_NAV.slice(count)
  const activeHidden = hidden.some(item => isActive(item.to))

  return (
    <div className={`relative ${className}`}>
      <div ref={measureRef} aria-hidden="true" className={`absolute invisible pointer-events-none flex ${subnav ? 'gap-5' : 'gap-6'}`}>
        {SETTINGS_NAV.map(item => <span key={item.to} className={tabClass(false, subnav)}>{item.label}</span>)}
      </div>
      <nav ref={rowRef} aria-label="Settings" className={`flex ${subnav ? 'gap-5' : 'gap-6 border-b border-brand-border'}`}>
        {shown.map(item => (
          <NavLink key={item.to} to={item.to} className={({ isActive: a }) => tabClass(a, subnav)}>{item.label}</NavLink>
        ))}
        {hidden.length > 0 && (
          <Popover.Root open={moreOpen} onOpenChange={setMoreOpen}>
            <Popover.Trigger asChild>
              <button type="button" className={`inline-flex items-center gap-1 ${tabClass(activeHidden, subnav)}`}>
                More
                <ChevronDown size={14} className={`transition-transform ${moreOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content align="start" sideOffset={6} className="z-50 min-w-52 bg-white border border-brand-border rounded-lg shadow-lg outline-none py-1">
                {hidden.map(item => (
                  <NavLink
                    key={item.to}
                    to={`/settings/${item.to}`}
                    onClick={() => setMoreOpen(false)}
                    className={({ isActive: a }) => `block px-3 py-2 text-sm transition-colors ${a ? 'font-medium text-dessa-teal' : 'text-brand-text hover:bg-brand-bg'}`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        )}
      </nav>
    </div>
  )
}

// Concept A: a full page, "Settings" title, tabs, then the selected setting.
function SettingsPage({ isSiteLeaderView }) {
  const location = useLocation()
  return (
    <div className="px-6 pt-8 pb-8">
      <h1 className="text-[28px] font-bold leading-tight text-brand-text mb-6">Settings</h1>
      <SettingsTabs />
      <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="pt-6">
        <Outlet context={{ isSiteLeaderView }} />
      </motion.div>
    </div>
  )
}

// Concept B (first pass, 2026-10-23): settings in a modal, 85% of the viewport each way, over the page the user came
// from (the Dashboard stands in for it). Close or Escape returns to the Dashboard.
// Concept D (2026-10-23) is the same modal with a left nav inside it instead of tabs (`sideNav`).
function SettingsModal({ isSiteLeaderView, sideNav = false }) {
  const location = useLocation()
  const navigate = useNavigate()
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') navigate('/') }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [navigate])
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none select-none"><Dashboard /></div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-40 bg-dessa-navy/40" onClick={() => navigate('/')} />
      <motion.div
        role="dialog" aria-modal="true" aria-labelledby="settings-modal-title"
        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        className={`fixed z-50 inset-0 m-auto w-[85vw] h-[85vh] flex ${sideNav ? '' : 'flex-col'} bg-white rounded-lg shadow-xl overflow-hidden`}
      >
        {sideNav ? (
          <>
            <aside className="w-60 shrink-0 flex flex-col border-r border-brand-border">
              <h2 id="settings-modal-title" className="px-5 pt-5 pb-3 text-lg font-semibold text-brand-text">Settings</h2>
              <nav aria-label="Settings" className="flex-1 min-h-0 overflow-y-auto px-3 pb-3 flex flex-col gap-0.5">
                {SETTINGS_NAV.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => `px-2 py-1.5 rounded-md text-sm transition-colors ${isActive ? 'bg-brand-bg font-medium text-brand-text' : 'text-brand-subtext hover:bg-brand-bg hover:text-brand-text'}`}
                  >
                    {item.label}
                  </NavLink>
                ))}
              </nav>
            </aside>
            <div className="relative flex-1 min-w-0 flex flex-col">
              <button type="button" onClick={() => navigate('/')} aria-label="Close settings" className="absolute top-4 right-4 z-10 p-1.5 rounded-md text-brand-subtext hover:text-brand-text hover:bg-white transition-colors">
                <X size={18} />
              </button>
              <div className="flex-1 min-h-0 overflow-y-auto bg-brand-bg p-6 pt-14">
                <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                  <Outlet context={{ isSiteLeaderView }} />
                </motion.div>
              </div>
            </div>
          </>
        ) : (<>
        <div className="px-6 pt-5 shrink-0">
          <div className="flex items-center justify-between mb-4">
            <h2 id="settings-modal-title" className="text-lg font-semibold text-brand-text">Settings</h2>
            <button type="button" onClick={() => navigate('/')} aria-label="Close settings" className="p-1.5 -mr-1.5 rounded-md text-brand-subtext hover:text-brand-text hover:bg-brand-bg transition-colors">
              <X size={18} />
            </button>
          </div>
          <SettingsTabs />
        </div>
        <div className="flex-1 min-h-0 overflow-y-auto bg-brand-bg p-6">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
            <Outlet context={{ isSiteLeaderView }} />
          </motion.div>
        </div>
        </>)}
      </motion.div>
    </>
  )
}

// Concept C (2026-10-23): a subnav strip directly beneath the primary Nav, sticky with it, holding only the tabs.
// "Settings" is the page title below it (moved out of the strip the same day), then the selected setting.
function SettingsSubnav({ isSiteLeaderView }) {
  const location = useLocation()
  return (
    <>
      <div className="sticky top-14 z-30 flex items-end gap-6 px-6 bg-white border-b border-brand-border">
        <SettingsTabs subnav className="flex-1 min-w-0" />
      </div>
      <div className="px-6 py-8">
        <h1 className="text-[28px] font-bold leading-tight text-brand-text mb-6">Settings</h1>
        <motion.div key={location.pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <Outlet context={{ isSiteLeaderView }} />
        </motion.div>
      </div>
    </>
  )
}

export default function SettingsLayout() {
  // Internal-only role switcher (Program admin | Site leader) moved to the Nav on Settings pages (2026-10-23).
  // Passed down to routed children via <Outlet context>. Only Curriculum setup honors it today.
  const { isSiteLeaderView } = useRole()
  const { settingsConcept } = useSettingsConcept()
  // The left sidebar was removed 2026-10-23 in favor of tabs across the top.
  if (settingsConcept === 'b') return <SettingsModal isSiteLeaderView={isSiteLeaderView} />
  if (settingsConcept === 'd') return <SettingsModal isSiteLeaderView={isSiteLeaderView} sideNav />
  if (settingsConcept === 'c') return <SettingsSubnav isSiteLeaderView={isSiteLeaderView} />
  return <SettingsPage isSiteLeaderView={isSiteLeaderView} />
}
