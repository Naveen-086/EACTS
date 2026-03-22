import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'

const COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444']

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="tooltip-dark" style={{ padding: '10px 14px' }}>
      <div className="font-semibold text-slate-200 mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span style={{ background: p.fill || p.color, width: 8, height: 8, borderRadius: '50%', display: 'inline-block' }} />
          <span className="text-slate-300">{p.name}:</span>
          <span className="font-semibold" style={{ color: p.fill || p.color }}>
            {typeof p.value === 'number' ? p.value.toFixed(4) : p.value}
          </span>
        </div>
      ))}
    </div>
  )
}

const ImpactCard = ({ label, value, color, icon, big }) => (
  <div className="text-center">
    <div className="text-3xl mb-1">{icon}</div>
    <div className={`font-bold font-['Space_Grotesk']`} style={{ fontSize: big ? 36 : 26, color }}>
      {value}
    </div>
    <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
  </div>
)

export default function Results() {
  const nav = useNavigate()
  const [data, setData] = useState(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('eacts_results')
    if (!raw) { nav('/tasks'); return }
    setData(JSON.parse(raw))
  }, [nav])

  if (!data) return null

  const { tasks, eacts_result, fcfs_result, impact } = data

  // VM Load chart data
  const vmLoadData = Object.keys(eacts_result.vm_loads).map(vm => ({
    vm,
    'FCFS Load':    +(fcfs_result.vm_loads[vm] || 0).toFixed(4),
    'E-ACTS Load':  +(eacts_result.vm_loads[vm] || 0).toFixed(4),
  }))

  // Task distribution for E-ACTS (pie)
  const eactsDistrib = {}
  eacts_result.assignments.forEach(t => {
    eactsDistrib[t.assigned_vm] = (eactsDistrib[t.assigned_vm] || 0) + 1
  })
  const distPieData = Object.entries(eactsDistrib).map(([vm, count]) => ({ name: vm, value: count }))

  // FCFS distribution (pie)
  const fcfsDistrib = {}
  fcfs_result.assignments.forEach(t => {
    fcfsDistrib[t.assigned_vm] = (fcfsDistrib[t.assigned_vm] || 0) + 1
  })
  const fcfsPieData = Object.entries(fcfsDistrib).map(([vm, count]) => ({ name: vm, value: count }))

  const impColor = impact.improvement_pct >= 0 ? '#10b981' : '#ef4444'

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-1 page-enter" style={{ marginLeft: 260, padding: '24px 32px' }}>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold gradient-text font-['Space_Grotesk']">Scheduling Results</h1>
            <p className="text-slate-500 text-sm mt-1">{tasks.length} tasks · {Object.keys(eacts_result.vm_loads).length} VMs · E-ACTS vs FCFS comparison</p>
          </div>
          <button onClick={() => nav('/tasks')} className="btn-glow px-5 py-2 text-sm">
            + New Schedule
          </button>
        </div>

        {/* Impact Card */}
        <div className="glass-card p-7 mb-6" style={{ borderColor: `${impColor}40` }}>
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-5 text-center">
            ⚡ Impact Analysis — FCFS vs E-ACTS Optimised
          </h3>
          <div className="flex items-center justify-around">
            <ImpactCard label="FCFS Peak Load" value={fcfs_result.peak_load.toFixed(4)} color="#ef4444" icon="📊" />
            <div className="text-4xl text-slate-600">→</div>
            <ImpactCard label="E-ACTS Peak Load" value={eacts_result.peak_load.toFixed(4)} color="#3b82f6" icon="⚡" />
            <div className="text-4xl text-slate-600">→</div>
            <ImpactCard label="Improvement" value={`${Math.abs(impact.improvement_pct).toFixed(1)}%`} color={impColor} icon={impact.improvement_pct >= 0 ? '📉' : '📈'} big />
          </div>
          <div className="mt-5 text-center">
            <span className="text-lg font-semibold" style={{ color: impColor }}>{impact.summary}</span>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* VM Load Bar Chart */}
          <div className="glass-card p-6 col-span-2">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-5">VM Load Comparison</h3>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={vmLoadData} barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="vm" tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} />
                <Bar dataKey="FCFS Load" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="E-ACTS Load" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* E-ACTS Task Distribution Pie */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">E-ACTS Distribution</h3>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={distPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={85}
                     dataKey="value" paddingAngle={4} label={({ name, value }) => `${name}: ${value}`}
                     labelLine={false}>
                  {distPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
                <Legend formatter={v => <span style={{ color: '#94a3b8', fontSize: '12px' }}>{v}</span>} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tables Row */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {/* E-ACTS Assignments */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">E-ACTS Assignments</h3>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>VM</th>
                    <th>Energy (Pred)</th>
                    <th>CPU</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {eacts_result.assignments.map((t, i) => (
                    <tr key={i}>
                      <td className="text-slate-500 text-xs">{i + 1}</td>
                      <td><span className="badge badge-blue">{t.assigned_vm}</span></td>
                      <td>
                        <span className={t.predicted_energy > 0.7 ? 'text-red-400' : t.predicted_energy > 0.4 ? 'text-yellow-400' : 'text-green-400'}>
                          {(t.predicted_energy || 0).toFixed(4)}
                        </span>
                      </td>
                      <td>{((t.cpu_usage || 0) * 100).toFixed(0)}%</td>
                      <td>
                        <span className={`badge ${t.priority >= 0.8 ? 'badge-red' : t.priority >= 0.4 ? 'badge-orange' : 'badge-green'}`}>
                          {t.priority >= 0.8 ? 'High' : t.priority >= 0.4 ? 'Med' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FCFS Assignments */}
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">FCFS Assignments</h3>
            <div style={{ maxHeight: 280, overflowY: 'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>VM</th>
                    <th>Energy (Pred)</th>
                    <th>CPU</th>
                    <th>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {fcfs_result.assignments.map((t, i) => (
                    <tr key={i}>
                      <td className="text-slate-500 text-xs">{i + 1}</td>
                      <td><span className="badge badge-purple">{t.assigned_vm}</span></td>
                      <td>
                        <span className={t.predicted_energy > 0.7 ? 'text-red-400' : t.predicted_energy > 0.4 ? 'text-yellow-400' : 'text-green-400'}>
                          {(t.predicted_energy || 0).toFixed(4)}
                        </span>
                      </td>
                      <td>{((t.cpu_usage || 0) * 100).toFixed(0)}%</td>
                      <td>
                        <span className={`badge ${t.priority >= 0.8 ? 'badge-red' : t.priority >= 0.4 ? 'badge-orange' : 'badge-green'}`}>
                          {t.priority >= 0.8 ? 'High' : t.priority >= 0.4 ? 'Med' : 'Low'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* VM Load Summary */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-4">VM Load Summary</h3>
          <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${Math.min(Object.keys(eacts_result.vm_loads).length, 6)}, 1fr)` }}>
            {Object.entries(eacts_result.vm_loads).map(([vm, load], i) => {
              const fcfsLoad = fcfs_result.vm_loads[vm] || 0
              const pct = Math.min(load * 100, 100)
              return (
                <div key={vm} className="text-center p-4 rounded-xl" style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="text-lg font-bold mb-1" style={{ color: COLORS[i % COLORS.length] }}>{vm}</div>
                  <div className="text-xs text-slate-500 mb-2">E-ACTS</div>
                  <div className="text-2xl font-bold text-white font-['Space_Grotesk']">{load.toFixed(3)}</div>
                  <div className="w-full rounded-full mt-2 overflow-hidden" style={{ height: 4, background: 'rgba(255,255,255,0.08)' }}>
                    <div style={{ width: `${pct}%`, height: '100%', background: COLORS[i % COLORS.length], borderRadius: 2 }} />
                  </div>
                  <div className="text-xs text-slate-600 mt-2">FCFS: {fcfsLoad.toFixed(3)}</div>
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
