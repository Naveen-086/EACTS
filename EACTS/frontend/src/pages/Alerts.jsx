import { useEffect, useState } from 'react'
import { getAlerts } from '../api'

export default function Alerts() {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    getAlerts().then(r => setAlerts(r.data.alerts)).catch(console.error)
  }, [])

  const ICONS = { critical: '⚠️', warning: '⚡', success: '✅', info: 'ℹ️' }
  const COLORS = { 
    critical: 'bg-red-50 border-red-200 text-red-800', 
    warning: 'bg-orange-50 border-orange-200 text-orange-800', 
    success: 'bg-green-50 border-green-200 text-green-800', 
    info: 'bg-blue-50 border-blue-200 text-blue-800' 
  }

  return (
    <div className="max-w-[900px] mx-auto fade-in">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-800 font-['Segoe_UI',System-ui]">
          System Alerts
        </h1>
        <button onClick={() => setAlerts([])} className="w-full sm:w-auto text-sm font-semibold text-slate-500 hover:text-blue-600 bg-white border border-slate-200 px-4 py-2 rounded shadow-sm">
          Dismiss All
        </button>
      </div>

      <div className="space-y-4">
        {alerts.map(a => (
          <div key={a.id} className={`flex flex-col sm:flex-row gap-4 p-4 sm:p-5 rounded-lg border shadow-sm ${COLORS[a.type]}`}>
            <div className="text-2xl">{ICONS[a.type]}</div>
            <div className="flex-1">
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-bold text-base">{a.title}</h3>
                <span className="text-xs font-semibold opacity-70">{a.time}</span>
              </div>
              <p className="text-sm opacity-90">{a.msg}</p>
            </div>
            <div className="flex items-center">
              <button onClick={() => setAlerts(alerts.filter(x => x.id !== a.id))} className="opacity-50 hover:opacity-100 font-bold">✕</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
