import { useNavigate } from 'react-router-dom'

export default function Navbar() {
  const navigate = useNavigate()
  const user = (() => { try { return JSON.parse(localStorage.getItem('eacts_user') || '{}') } catch { return {} } })()

  return (
    <header className="navbar">
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-blue-500 font-bold text-lg sm:text-xl italic drop-shadow-sm whitespace-nowrap">E-ACTS Portal -</span>
        <span className="text-slate-600 font-medium ml-1 hidden md:inline truncate">Energy-Aware Cloud Scheduler</span>
      </div>

      <div className="flex items-center gap-3 sm:gap-6">
        <div className="text-xs sm:text-sm font-medium text-slate-700 whitespace-nowrap">
          Welcome, <span className="font-bold text-slate-900">{user.username || 'Admin'}</span>
        </div>
        
        <div className="flex items-center gap-3 sm:gap-4 text-slate-500 text-xl cursor-pointer">
          <span onClick={() => navigate('/alerts')} className="hover:text-blue-500 transition-colors" title="View Alerts">🔔</span>
          <div onClick={() => {
            if (window.confirm('Log out of E-ACTS Portal?')) {
              localStorage.removeItem('eacts_user')
              navigate('/login')
            }
          }} className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-sm font-bold text-slate-600 hover:bg-slate-300 transition-colors" title="Log Out">
            {(user.username || 'A')[0].toUpperCase()}
          </div>
        </div>
      </div>
    </header>
  )
}
