import { createContext, useContext, useState } from 'react'

// Internal-only role switcher state (2026-10-06), shared by the Settings and
// Reports sidebars so both flip the same Program Admin / Site Leader view
// and the choice persists while moving between them. Not a real end-user
// control, just lets the team review both views. Pages that don't honor it
// simply ignore it.
const RoleContext = createContext(null)

export function RoleProvider({ children }) {
  const [role, setRole] = useState('program_admin')
  return (
    <RoleContext.Provider value={{ role, setRole, isSiteLeaderView: role === 'site_leader' }}>
      {children}
    </RoleContext.Provider>
  )
}

export function useRole() {
  return useContext(RoleContext)
}
