import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Flame, BookOpen, User, LogOut } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import config from '../../config/index.js'
import { radius } from '../../utils/styles.js'

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/habits', label: 'Habits', icon: Flame },
  { to: '/journal', label: 'Journal', icon: BookOpen },
  { to: '/profile', label: 'Profile', icon: User }
]

export function Sidebar() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  return (
    <aside className="hidden md:flex flex-col w-[240px] flex-shrink-0 border-r-2 border-ink bg-paper min-h-screen">
      {/* Logo */}
      <div className="px-6 py-6 border-b-2 border-ink">
        <span className="font-marker text-2xl font-bold text-ink">{config.app.name}</span>
        <p className="font-hand text-sm text-ink/50 mt-0.5">your thinking space</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            style={({ isActive }) => ({
              borderRadius: radius.btn,
              boxShadow: isActive ? '3px 3px 0px 0px #2d2d2d' : 'none',
              backgroundColor: isActive ? '#2d2d2d' : 'transparent',
              color: isActive ? '#fdfbf7' : '#2d2d2d'
            })}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 px-4 py-2.5 font-hand text-base font-medium',
                'border-2 transition-all duration-100',
                isActive ? 'border-ink' : 'border-transparent hover:border-ink hover:bg-muted'
              ].join(' ')
            }
          >
            <Icon size={18} strokeWidth={2.5} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-4 py-6 border-t-2 border-ink">
        <button
          onClick={handleLogout}
          style={{ borderRadius: radius.btn }}
          className="w-full flex items-center gap-3 px-4 py-2.5 font-hand text-base text-ink/60 border-2 border-transparent hover:border-accent hover:text-accent hover:bg-[#fff0f0] transition-all duration-100"
        >
          <LogOut size={18} strokeWidth={2.5} />
          Logout
        </button>
      </div>
    </aside>
  )
}
