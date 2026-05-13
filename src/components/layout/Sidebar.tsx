import { NavLink } from 'react-router-dom'
import { LayoutDashboard, List, Calendar, Settings, Coins, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { api } from '@/lib/api'

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: List, label: 'Transactions' },
  { to: '/calendar', icon: Calendar, label: 'Calendar' },
]

interface Props {
  onLogout: () => void
}

export function Sidebar({ onLogout }: Props) {
  async function handleLogout() {
    await api.auth.logout().catch(() => {})
    onLogout()
  }

  return (
    <aside className="flex flex-col w-[220px] min-h-screen bg-surface border-r border-border shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-border">
        <div className="h-6 w-6 rounded-md bg-accent flex items-center justify-center">
          <Coins className="h-3.5 w-3.5 text-white" />
        </div>
        <span className="text-sm font-semibold text-text-primary tracking-tight">Aerarium</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 space-y-0.5">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors',
                isActive
                  ? 'bg-accent/10 text-accent'
                  : 'text-text-muted hover:bg-surface-overlay hover:text-text-secondary'
              )
            }
          >
            <Icon className="h-4 w-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="p-2 border-t border-border space-y-0.5">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            cn(
              'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm transition-colors',
              isActive
                ? 'bg-accent/10 text-accent'
                : 'text-text-muted hover:bg-surface-overlay hover:text-text-secondary'
            )
          }
        >
          <Settings className="h-4 w-4 shrink-0" />
          Settings
        </NavLink>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-md text-sm text-text-muted hover:bg-surface-overlay hover:text-text-secondary transition-colors"
        >
          <LogOut className="h-4 w-4 shrink-0" />
          Lock
        </button>
      </div>
    </aside>
  )
}
