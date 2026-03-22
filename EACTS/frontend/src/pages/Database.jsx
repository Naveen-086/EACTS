import { useEffect, useState } from 'react'
import { getLogs, exportLogsCsv } from '../api'

export default function Database() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLogs().then(r => setLogs(r.data.logs)).catch(console.error).finally(() => setLoading(false))
  }, [])

  const handleExport = (e) => {
    e.preventDefault()
    exportLogsCsv().then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'eacts_system_logs.csv')
      document.body.appendChild(link)
      link.click()
    })
  }

  return (
    <div className="max-w-[1200px] mx-auto fade-in">
      <h1 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6 font-['Segoe_UI',System-ui]">
        Database & Historical Logs
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mb-6">
        <div className="white-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 text-2xl">⚡</div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase">Connection Status</div>
            <div className="text-lg font-bold text-slate-800">Connected (SQLite)</div>
          </div>
        </div>
        <div className="white-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-2xl">🗄️</div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase">Database Size</div>
            <div className="text-lg font-bold text-slate-800">14.2 MB</div>
          </div>
        </div>
        <div className="white-card flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 text-2xl">⏱️</div>
          <div>
            <div className="text-xs text-slate-500 font-bold uppercase">Last Sync</div>
            <div className="text-lg font-bold text-slate-800">2 mins ago</div>
          </div>
        </div>
      </div>

      <div className="white-card p-0 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h2 className="font-bold text-slate-700">Recent System Activity Logs</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead className="bg-slate-100 text-slate-500 text-left border-b border-slate-200">
              <tr>
                <th className="p-3 font-medium">Log ID</th>
                <th className="p-3 font-medium">Timestamp</th>
                <th className="p-3 font-medium">Action type</th>
                <th className="p-3 font-medium">Details</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan="5" className="p-4 text-center text-slate-500">Loading system logs...</td></tr>}
              {!loading && logs.length === 0 && <tr><td colSpan="5" className="p-4 text-center text-slate-500">No logs found.</td></tr>}
              {logs.map(l => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                  <td className="p-3 text-slate-500">#{l.id}</td>
                  <td className="p-3 text-slate-600">{l.time}</td>
                  <td className="p-3 font-medium text-slate-700">{l.action}</td>
                  <td className="p-3 text-slate-600">{l.details}</td>
                  <td className="p-3">
                    <span className={`text-[10px] px-2 py-1 rounded font-bold ${
                      l.status === 'SUCCESS' ? 'bg-green-100 text-green-700' :
                      l.status === 'WARNING' ? 'bg-orange-100 text-orange-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>{l.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-3 border-t border-slate-200 bg-slate-50 text-center text-sm">
          <a href="#" onClick={handleExport} className="font-bold text-blue-600 hover:underline">Download Historical Logs (CSV)</a>
        </div>
      </div>
    </div>
  )
}
