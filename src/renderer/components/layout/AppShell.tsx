import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { useSettingsStore } from '../../stores/settingsStore'

export function AppShell(): JSX.Element {
  const { sidebarCollapsed } = useSettingsStore()

  return (
    <div className="h-screen flex">
      <Sidebar />
      <main 
        className={`flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950 transition-all duration-300 ${
          sidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="p-6 flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
