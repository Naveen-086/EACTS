import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts'
import { getDashboardStats } from '../api'

const INSIGHT_COLORS = ['#0ea5e9', '#22c55e', '#f97316', '#a855f7', '#ef4444']

export default function Dashboard() {
  const nav = useNavigate()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getDashboardStats()
      .then(r => setStats(r.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-8 text-center text-slate-500">Loading Context Dashboard...</div>

  const ds = stats?.dataset_stats || {}
  const mr = stats?.model_results || {}

  const weeklyData = stats?.weekly_trend || []
  const pieData = stats?.pie_data || []
  const barData = stats?.bar_data || []
  const sessionTrend = stats?.session_trend || []
  const sessionKpis = stats?.session_kpis || {}
  const vmMix = stats?.vm_mix || []

  const peakTaskConcurrency = weeklyData.reduce((max, d) => Math.max(max, Number(d?.val || 0)), 0)
  const maxBarTime = Math.max(1, ...barData.map((b) => Number(b.time || 0)))

  const models = [
    { name: 'Linear Regression', isPrimary: true, ...mr['Linear Regression'] },
    { name: 'Random Forest', isPrimary: false, ...mr['Random Forest'] },
    { name: 'Neural Network', isPrimary: false, ...mr['Neural Network'] },
  ].filter(m => m.r2 !== undefined)

  return (
    <div className="max-w-[1400px] mx-auto">
      <h1 className="text-lg sm:text-[22px] font-bold text-slate-800 mb-6 font-['Segoe_UI',System-ui] uppercase tracking-wide">
        CONTEXT DASHBOARD - Historical Logs Analysis
      </h1>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        
        {/* Panel 1: System Context & Performance */}
        <div className="white-card flex flex-col">
          <h2 className="card-title">SYSTEM CONTEXT & PERFORMANCE (PAST 30 DAYS)</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="bg-[#f0f9ff] p-4 rounded border border-[#bae6fd]">
              <div className="text-xs text-slate-600 mb-1">Total Tasks Analyzed (30 Days):</div>
              <div className="text-3xl font-bold text-slate-800">{ds.total_rows?.toLocaleString() || '15,231'}</div>
            </div>
            <div className="bg-[#f0fdf4] p-4 rounded border border-[#bbf7d0]">
              <div className="text-xs text-slate-600 mb-1">Avg. Task Execution Time</div>
              <div className="text-3xl font-bold text-slate-800">{ds.avg_exec_time ? (ds.avg_exec_time*100).toFixed(1) : '28.5'}s</div>
            </div>
            <div className="bg-[#f8fafc] p-4 rounded border border-slate-200">
              <div className="text-xs text-slate-600 mb-1">Avg. CPU Load (Historical)</div>
              <div className="text-3xl font-bold text-slate-800">{ds.avg_cpu ? (ds.avg_cpu*100).toFixed(1) : '58.2'}%</div>
            </div>
            <div className="bg-[#f8fafc] p-4 rounded border border-slate-200">
              <div className="text-xs text-slate-600 mb-1">Avg. Memory Usage</div>
              <div className="text-3xl font-bold text-slate-800">{ds.avg_ram ? (ds.avg_ram*16).toFixed(1) : '6.1'} GB</div>
            </div>
          </div>

          <div className="flex-1 mt-4 relative" style={{ minHeight: '160px' }}>
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1">
              <span className="text-sm font-semibold text-slate-700">Weekly Task Load Trend</span>
              <span className="text-xs text-slate-500">Peak Task Concurrency: {peakTaskConcurrency} Tasks</span>
            </div>
            <div style={{ width: '100%', height: '160px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" tick={{fontSize: 10, fill:'#64748b'}} axisLine={false} tickLine={false} />
                  <YAxis tick={{fontSize: 10, fill:'#64748b'}} axisLine={false} tickLine={false} domain={[0, 'auto']} />
                  <Tooltip contentStyle={{fontSize: 12}} />
                  <Line type="linear" dataKey="val" stroke="#0284c7" strokeWidth={2} dot={{r:4, fill:'#0284c7', strokeWidth:0}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Panel 2: Historical Data Distribution */}
        <div className="white-card flex flex-col">
          <h2 className="card-title">HISTORICAL DATA DISTRIBUTION & PRIORITY INSIGHTS</h2>
          
          <div className="flex flex-col lg:flex-row flex-1 mt-4 gap-4 lg:gap-0">
            <div className="flex-1 flex flex-col items-center justify-center">
              <span className="text-sm text-slate-700 mb-2 font-medium">Task Priority Distribution</span>
              <div className="w-[180px] h-[180px] relative">
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={0} outerRadius={80} dataKey="value" stroke="white" strokeWidth={2}>
                      {pieData.map((e,i) => <Cell key={i} fill={e.fill} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                {/* Labels overlay conceptually */}
                <div className="absolute top-[20%] left-[20%] text-white text-xs font-bold text-center">High<br/>{pieData[0]?.value}%</div>
                <div className="absolute top-[40%] right-[10%] text-white text-xs font-bold text-center">Medium<br/>{pieData[1]?.value}%</div>
                <div className="absolute bottom-[20%] left-[30%] text-white text-xs font-bold text-center">Low<br/>{pieData[2]?.value}%</div>
              </div>
            </div>

            <div className="flex-1 flex flex-col lg:pl-4 lg:border-l border-slate-100">
              <span className="text-sm text-slate-700 mb-4 font-medium leading-tight">Average Execution Time<br/>*per Priority</span>
              
              <div className="space-y-4 flex-1 justify-center flex flex-col pr-4">
                {barData.map(b => (
                  <div key={b.name} className="flex items-center gap-3">
                    <div className="w-16 text-right text-xs font-bold" style={{color: b.fill}}>{b.name}</div>
                    <div className="flex-1 bg-slate-100 h-8 relative">
                      <div className="h-full flex items-center px-3 text-white text-xs font-bold" style={{width: `${Math.max((b.time / maxBarTime) * 100, b.time > 0 ? 12 : 0)}%`, backgroundColor: b.fill}}>
                        {b.time}s
                      </div>
                    </div>
                  </div>
                ))}
                <div className="flex justify-between text-[10px] text-slate-400 pl-[76px] pr-2 sm:pr-8 mt-1 border-t border-slate-200 pt-1">
                  <span>0</span><span>15s</span><span>30s</span><span>45s</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Panel 3: ML Model Performance */}
        <div className="white-card">
          <h2 className="card-title">ML MODEL PERFORMANCE COMPARISON (ON HISTORICAL DATA)</h2>
          <div className="overflow-x-auto">
            <table className="data-table mt-4 w-full min-w-[620px]">
              <thead>
                <tr>
                  <th className="bg-transparent border-b-2">Model</th>
                  <th className="bg-transparent border-b-2">R-squared<br/><span className="text-[10px] font-normal">(Accuracy)</span></th>
                  <th className="bg-transparent border-b-2">Mean Squared<br/><span className="text-[10px] font-normal">Error</span></th>
                  <th className="bg-transparent border-b-2">Prediction<br/><span className="text-[10px] font-normal">Speed</span></th>
                </tr>
              </thead>
              <tbody>
                {models.map(m => (
                  <tr key={m.name} className={m.isPrimary ? 'bg-[#e0f2fe]' : ''}>
                    <td className="font-medium text-slate-800 py-4 flex items-center gap-2">
                      {m.name}
                      {m.isPrimary && <span className="text-[10px] bg-[#0284c7] text-white px-1.5 py-0.5 rounded">Primary Model</span>}
                    </td>
                    <td className="py-4">{typeof m.r2 === 'number' ? m.r2.toFixed(2) : '0.93'}</td>
                    <td className="py-4">{typeof m.mse === 'number' ? m.mse.toFixed(1) : '391.2'}s</td>
                    <td className="py-4">{typeof m.pred_speed_ms === 'number' ? m.pred_speed_ms.toFixed(1) : '58.2'}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel 4: Live Insights */}
        <div className="white-card flex flex-col overflow-hidden">
          <h2 className="card-title">LIVE SCHEDULING INSIGHTS (RECENT SESSIONS)</h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
            <div className="p-3 rounded border border-slate-200 bg-slate-50">
              <div className="text-[11px] text-slate-500 uppercase">Total Sessions</div>
              <div className="text-2xl font-bold text-slate-800">{sessionKpis.total_sessions ?? 0}</div>
            </div>
            <div className="p-3 rounded border border-slate-200 bg-slate-50">
              <div className="text-[11px] text-slate-500 uppercase">Avg Improvement</div>
              <div className="text-2xl font-bold text-emerald-600">{(sessionKpis.avg_improvement ?? 0).toFixed(1)}%</div>
            </div>
            <div className="p-3 rounded border border-slate-200 bg-slate-50">
              <div className="text-[11px] text-slate-500 uppercase">Best Improvement</div>
              <div className="text-2xl font-bold text-sky-600">{(sessionKpis.best_improvement ?? 0).toFixed(1)}%</div>
            </div>
            <div className="p-3 rounded border border-slate-200 bg-slate-50">
              <div className="text-[11px] text-slate-500 uppercase">Latest Improvement</div>
              <div className="text-2xl font-bold text-indigo-600">{(sessionKpis.latest_improvement ?? 0).toFixed(1)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="border border-slate-100 rounded p-3">
              <div className="text-sm font-semibold text-slate-700 mb-2">FCFS vs E-ACTS Peak Load</div>
              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sessionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="fcfs_peak" name="FCFS Peak" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="eacts_peak" name="E-ACTS Peak" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="border border-slate-100 rounded p-3">
              <div className="text-sm font-semibold text-slate-700 mb-2">Improvement Trend (%)</div>
              <div style={{ width: '100%', height: 210 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessionTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Line type="monotone" dataKey="improvement" stroke="#16a34a" strokeWidth={2.5} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="mt-5 border border-slate-100 rounded p-3">
            <div className="text-sm font-semibold text-slate-700 mb-2">VM Configuration Usage</div>
            <div style={{ width: '100%', height: 210 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={vmMix} cx="50%" cy="50%" outerRadius={80} dataKey="value" label>
                    {vmMix.map((_, idx) => <Cell key={idx} fill={INSIGHT_COLORS[idx % INSIGHT_COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <button onClick={() => nav('/tasks')} className="mt-4 self-end bg-[#16a34a] hover:bg-[#15803d] text-white px-5 py-2.5 rounded font-bold text-sm shadow flex items-center gap-2 transition-colors">
            Schedule New Tasks <span>→</span>
          </button>
        </div>

      </div>
    </div>
  )
}
