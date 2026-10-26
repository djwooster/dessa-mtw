import { createContext, useContext, useState } from 'react'

// Which Settings layout renders (2026-10-23), same convention as dashboardConceptContext.jsx: the switcher lives in
// Nav, SettingsLayout reads from context. 'a' = a full page with tabs across the top (the left sidebar is gone),
// 'b' = settings managed in a large modal over the page, 'c' = tabs in a subnav strip directly beneath the Nav,
// 'd' = B's modal with a left nav inside it instead of tabs.
const SettingsConceptContext = createContext(null)

export function SettingsConceptProvider({ children }) {
  const [settingsConcept, setSettingsConcept] = useState('a')
  return (
    <SettingsConceptContext.Provider value={{ settingsConcept, setSettingsConcept }}>
      {children}
    </SettingsConceptContext.Provider>
  )
}

export function useSettingsConcept() {
  return useContext(SettingsConceptContext)
}
