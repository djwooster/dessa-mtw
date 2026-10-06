import { Tabs, TabsList, TabsTrigger } from './ui/tabs'
import { useRole } from '../lib/roleContext'

// The Program Admin / Site Leader switcher pinned to the bottom of a
// sidebar. Extracted from SettingsLayout (2026-10-06) so Settings and
// Reports use the exact same control.
export default function RoleSwitcher() {
  const { role, setRole } = useRole()
  return (
    <div className="px-6 py-3 border-t border-brand-border">
      <Tabs value={role} onValueChange={setRole}>
        <TabsList className="w-full p-0.5">
          <TabsTrigger value="program_admin" className="flex-1 text-xs px-2 py-1">
            Prog Admin
          </TabsTrigger>
          <TabsTrigger value="site_leader" className="flex-1 text-xs px-2 py-1">
            Site Leader
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  )
}
