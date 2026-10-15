import { useEffect, useState } from 'react'

// useState that remembers its value in a module-level map under `key` (2026-10-15), so a component
// that unmounts and comes back (the Engagement table when you open a site page and return) shows the
// same sort, page and search. A null key makes it a plain useState.
const store = new Map()

export function usePersistedState(key, initial) {
  const [value, setValue] = useState(() => (key != null && store.has(key) ? store.get(key) : initial))
  useEffect(() => { if (key != null) store.set(key, value) }, [key, value])
  return [value, setValue]
}
