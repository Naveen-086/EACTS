import { NavLink, useNavigate } from 'react-router-dom'

const NAV = [
  { to: '/dashboard', icon: '🏠', label: 'Dashboard' },
  { to: '/database',  icon: '🗄️', label: 'Logs & Database' },
  { to: '/alerts',    icon: '🔔', label: 'Alerts' },
  { to: '/tasks',     icon: '📁', label: 'Task Hub' },
  { to: '/settings',  icon: '⚙️', label: 'Settings' },
]

export default function Sidebar() {
  const nav = useNavigate()

  return (
    <aside className="sidebar">
      {/* Brand Icon */}
      <div className="sidebar-logo mt-2 mb-8 cursor-pointer" onClick={() => nav('/dashboard')}>
        ⚡
      </div>

      {/* Nav Icons */}
      <nav className="flex flex-col items-center flex-1 w-full mt-4 gap-2">
        {NAV.map(({ to, icon }, i) => (
          <NavLink key={i} to={to}
            className={({ isActive }) => `sidebar-icon ${isActive ? 'active' : ''}`}
            title={to}>
            <span className="text-xl">{icon}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
