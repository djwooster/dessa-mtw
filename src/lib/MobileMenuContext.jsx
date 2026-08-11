import { createContext, useContext, useState } from 'react'

// Lets a page register a mobile-only "Menu" action (label + onClick) that
// renders inside the persistent top Nav — used by pages with their own
// off-canvas sidebar (e.g. the Family lesson view) since Nav has no
// knowledge of a page's internal drawer state.
const MobileMenuContext = createContext(null)

export function MobileMenuProvider({ children }) {
  const [action, setAction] = useState(null)
  return (
    <MobileMenuContext.Provider value={{ action, setAction }}>
      {children}
    </MobileMenuContext.Provider>
  )
}

export function useMobileMenu() {
  return useContext(MobileMenuContext)
}
