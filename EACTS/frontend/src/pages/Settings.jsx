import { useState, useEffect } from 'react'

export default function Settings() {
  const [theme, setTheme] = useState(localStorage.getItem('eacts_theme') || 'light')
  const [model, setModel] = useState(localStorage.getItem('eacts_default_model') || 'Linear Regression (Recommended)')
  const [notifs, setNotifs] = useState(localStorage.getItem('eacts_notifs') !== 'false')
  const [autoSched, setAutoSched] = useState(localStorage.getItem('eacts_auto_schedule') === 'true')

  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark')
    else document.documentElement.classList.remove('dark')
  }, [theme])

  const handleSave = () => {
    localStorage.setItem('eacts_theme', theme)
    localStorage.setItem('eacts_default_model', model)
    localStorage.setItem('eacts_notifs', notifs)
    localStorage.setItem('eacts_auto_schedule', autoSched)
    alert('Settings saved successfully!')
  }

  return (
    <div className="max-w-[800px] mx-auto fade-in">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 font-['Segoe_UI',System-ui]">
        Configuration & Settings
      </h1>

      <div className="white-card space-y-8">
        
        {/* Section 1 */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Appearance</h2>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800">Interface Theme</div>
              <div className="text-sm text-slate-500">Select your preferred color scheme.</div>
            </div>
            <select className="input-field w-full sm:w-40" value={theme} onChange={e => setTheme(e.target.value)}>
              <option value="light">Light Mode</option>
              <option value="dark">Dark Mode</option>
              <option value="system">System Default</option>
            </select>
          </div>
        </div>

        {/* Section 2 */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Scheduling Preferences</h2>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <div className="font-semibold text-slate-800">Default Prediction Model</div>
              <div className="text-sm text-slate-500">The ML model used by default for new batches.</div>
            </div>
            <select className="input-field w-full sm:w-56" value={model} onChange={e => setModel(e.target.value)}>
              <option value="linear">Linear Regression (Recommended)</option>
              <option value="rf">Random Forest</option>
              <option value="nn">Neural Network</option>
            </select>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800">Auto-Scheduling Engine</div>
              <div className="text-sm text-slate-500">Automatically optimize queue every 5 minutes.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={autoSched} onChange={e => setAutoSched(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        {/* Section 3 */}
        <div>
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Notifications</h2>
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold text-slate-800">System Alerts & Warnings</div>
              <div className="text-sm text-slate-500">Receive desktop alerts for overload scenarios.</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" checked={notifs} onChange={e => setNotifs(e.target.checked)} />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-end">
          <button onClick={handleSave} className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-6 rounded shadow transition-colors">
            Save Changes
          </button>
        </div>

      </div>
    </div>
  )
}
