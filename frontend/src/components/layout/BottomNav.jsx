import { NavLink } from 'react-router-dom'
import { LayoutDashboard, Flame, BookOpen, User, CalendarDays } from 'lucide-react'

const navItems = [
  { to: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { to: '/habits', label: 'Habits', icon: Flame },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/calendar', label: 'History', icon: CalendarDays },
  { to: '/profile', label: 'Profile', icon: User }
]

// Mobile bottom tab bar
export function BottomNav() {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-paper border-t-2 border-ink flex z-40">
      {navItems.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            [
              'flex-1 flex flex-col items-center gap-0.5 py-3 font-hand text-xs transition-colors',
              isActive ? 'text-ink font-semibold' : 'text-ink/50'
            ].join(' ')
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 3 : 2} />
              {label}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
