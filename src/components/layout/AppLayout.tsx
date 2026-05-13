import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'

interface Props {
  onLogout: () => void
}

export function AppLayout({ onLogout }: Props) {
  return (
    <div className="flex h-screen bg-background text-text-primary overflow-hidden">
      <Sidebar onLogout={onLogout} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
