import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

export function AppShell(): JSX.Element {
  return (
    <div className="h-screen flex">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col overflow-hidden bg-zinc-50 dark:bg-zinc-950">
        <div className="p-6 flex-1 min-h-0 overflow-y-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
