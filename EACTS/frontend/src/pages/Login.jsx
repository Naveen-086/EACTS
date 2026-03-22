import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const nav = useNavigate()
  const [form, setForm] = useState({ username: '', password: '', remember: false })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await login(form.username, form.password)
      localStorage.setItem('eacts_user', JSON.stringify(res.data))
      if (form.remember) localStorage.setItem('eacts_remember', '1')
      nav('/dashboard')
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed. Check credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar Mockup on Login (from screenshot) */}
      <div className="w-[56px] sm:w-[64px] bg-[#0f172a] flex flex-col items-center pt-4 shadow-xl z-20">
        <div className="text-[#38bdf8] text-2xl font-black italic mb-8">⚡</div>
        <div className="flex flex-col gap-3 sm:gap-4 text-slate-500 text-xl">
          <div className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg cursor-pointer">🏠</div>
          <div className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg cursor-pointer">🗄️</div>
          <div className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg cursor-pointer">🔔</div>
          <div className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg cursor-pointer">📁</div>
          <div className="w-10 h-10 flex items-center justify-center hover:bg-white/10 rounded-lg cursor-pointer">⚙️</div>
        </div>
      </div>

      {/* Main Content Area containing Login Card */}
      <div className="flex-1 flex flex-col">
        <header className="h-[60px] bg-white border-b border-slate-200 flex items-center px-3 sm:px-6 sticky top-0">
          <span className="text-blue-600 font-bold text-base sm:text-lg italic">E-ACTS Portal -</span>
          <span className="text-slate-600 font-medium ml-1 text-[15px] hidden md:inline">Energy-Aware Cloud Scheduler</span>
        </header>

        <div className="flex-1 flex items-center justify-center p-3 sm:p-6 fade-in" style={{ backgroundColor: '#f4f7fe' }}>
          <div className="w-full max-w-md bg-white rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-5 sm:p-8">
            <h1 className="text-xl sm:text-2xl font-black text-slate-800 text-center uppercase tracking-wide mb-8">Login Portal</h1>

            <div className="flex justify-center mb-6 relative">
              <div className="w-24 h-24 relative">
                <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-blue-100" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-3xl font-black italic text-green-500 drop-shadow-sm">⚡</span>
                </div>
              </div>
            </div>
            
            <h2 className="text-center font-bold text-slate-800 text-lg mb-8">E-ACTS Portal</h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  className="input-field"
                  value={form.username}
                  onChange={e => setForm({ ...form, username: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
                <input
                  type="password"
                  className="input-field shadow-sm"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
              </div>

              <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    checked={form.remember}
                    onChange={e => setForm({ ...form, remember: e.target.checked })}
                  />
                  <label htmlFor="remember" className="text-sm text-slate-600 cursor-pointer">Remember Me</label>
                </div>
                <a href="#" className="text-sm font-medium text-blue-600 hover:underline">Forgot Password?</a>
              </div>

              {error && (
                <div className="text-sm text-red-500 bg-red-50 border border-red-200 rounded-md px-3 py-2 text-center">
                  {error}
                </div>
              )}

              <button type="submit" className="w-full bg-[#009688] hover:bg-teal-700 text-white font-semibold py-2.5 rounded-md transition-colors mt-6 shadow-md" disabled={loading}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-8 text-center text-sm text-slate-500">
              New to the system? <a href="#" className="font-medium text-slate-700 hover:text-blue-600">Request access<br/>from the administrator.</a>
              <div className="mt-4 text-xs text-slate-400">Demo: admin / eacts@2024</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
