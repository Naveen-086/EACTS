import { useEffect, useState } from 'react'
import { scheduleOptimised, exportLogsCsv, getDashboardStats } from '../api'

const PRIORITY_MAP = { High: 1.0, Medium: 0.5, Low: 0.0 }
const MEM_MAP = { '2GB': 2000, '4GB': 4000, '8GB': 8000 }

export default function TaskHub() {
  const [form, setForm] = useState({ cpu: 75, mem: '4GB', net: '500', pri: 'Medium' })
  const [nVms, setNVms] = useState(4)
  const [queue, setQueue] = useState([])
  const [model, setModel] = useState(localStorage.getItem('eacts_default_model') || 'Linear Regression (Recommended)')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [dashboardStats, setDashboardStats] = useState(null)

  useEffect(() => {
    getDashboardStats()
      .then((res) => setDashboardStats(res.data?.dataset_stats || null))
      .catch(console.error)
  }, [])

  const startNewBatch = () => {
    setQueue([])
    setResult(null)
  }

  const handleExport = () => {
    exportLogsCsv().then(res => {
      const url = window.URL.createObjectURL(new Blob([res.data], { type: 'text/csv' }))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'eacts_system_logs.csv')
      document.body.appendChild(link)
      link.click()
    })
  }

  const addTask = () => {
    setQueue([...queue, {
      id: `T${queue.length + 1}`,
      cpu: form.cpu,
      mem: form.mem,
      net: Number(form.net),
      pri: form.pri,
      status: 'Pending'
    }])
  }

  const submitBatch = async () => {
    setLoading(true)
    const payload = queue.map(t => ({
      task_id: t.id,
      cpu_usage: t.cpu / 100,
      ram_usage: MEM_MAP[t.mem] / 16000, // Normalized
      network_io: t.net / 1000, // Normalized
      disk_io: 0.5,
      priority: PRIORITY_MAP[t.pri],
      execution_time: 0.5,
      _ui: t
    }))
    
    try {
      const res = await scheduleOptimised(payload, nVms)
      setResult(res.data)
      setQueue(q => q.map(t => ({...t, status: 'Scheduled'})))
    } catch (err) {
      console.error(err)
      alert("Failed to schedule tasks. Is backend running?")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[1400px] mx-auto pb-10">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-6 font-['Segoe_UI',System-ui]">
        Task Submission Hub
      </h1>

      <div className="flex flex-col xl:flex-row items-stretch xl:items-start gap-6">
        
        {/* LEFT COLUMN */}
        <div className="w-full xl:w-[380px] flex flex-col gap-6">
          <div className="white-card">
            <h2 className="font-bold text-slate-800 mb-4">Create New Task (Batch Input)</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-slate-600 mb-1">CPU Usage (%)</label>
                <div className="flex items-center gap-3">
                  <input type="range" min="0" max="100" value={form.cpu} onChange={e => setForm({...form, cpu: +e.target.value})} className="w-full h-1 bg-blue-200 rounded-lg appearance-none cursor-pointer" />
                  <span className="text-sm font-medium w-8">{form.cpu}%</span>
                </div>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Memory Usage (MB)</label>
                <select className="input-field" value={form.mem} onChange={e => setForm({...form, mem: e.target.value})}>
                  <option>2GB</option><option>4GB</option><option>8GB</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Network Traffic (Mbps)</label>
                <input type="number" className="input-field" value={form.net} onChange={e => setForm({...form, net: e.target.value})} />
              </div>

              <div>
                <label className="block text-sm text-slate-600 mb-1">Task Priority</label>
                <select className="input-field" value={form.pri} onChange={e => setForm({...form, pri: e.target.value})}>
                  <option>High</option><option>Medium</option><option>Low</option>
                </select>
              </div>

              <button onClick={addTask} className="w-full bg-[#16a34a] hover:bg-[#15803d] text-white font-semibold py-2.5 rounded shadow mt-2 transition-colors">
                + Add Task to Batch
              </button>
            </div>
          </div>

          <div className="white-card p-0 overflow-hidden">
            <div className="p-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800">Current Batch Queue ({queue.length} Tasks)</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[520px]">
                <thead className="bg-[#f8fafc] text-slate-500 text-left border-b border-slate-200">
                  <tr><th className="p-3 font-medium">Task ID</th><th className="p-3 font-medium">CPU%</th><th className="p-3 font-medium">Mem (GB)</th><th className="p-3 font-medium">Net</th><th className="p-3 font-medium">Priority</th></tr>
                </thead>
                <tbody>
                  {queue.map(t => (
                    <tr key={t.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                      <td className="p-3 text-slate-700 font-medium">{t.id}</td>
                      <td className="p-3 text-slate-600">{t.cpu}%</td>
                      <td className="p-3 text-slate-600">{t.mem.replace('GB','')}</td>
                      <td className="p-3 text-slate-600">{t.net}</td>
                      <td className="p-3"><span className={`text-xs px-2 py-0.5 rounded font-bold ${
                        t.pri === 'High' ? 'bg-orange-100 text-orange-700' :
                        t.pri === 'Low' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                      }`}>{t.pri.substring(0,3)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="flex-1 flex flex-col gap-6">
          
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 white-card">
              <h2 className="font-bold text-slate-800 mb-4">Scheduling Configuration & Model Selection</h2>
              <div className="mb-4">
                <label className="block text-sm text-slate-600 mb-2">Number of VMs</label>
                <input
                  type="number"
                  min="2"
                  max="10"
                  className="input-field w-full sm:w-40"
                  value={nVms}
                  onChange={(e) => setNVms(Math.min(10, Math.max(2, Number(e.target.value) || 2)))}
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm text-slate-600 mb-2">Select Prediction Model</label>
                <div className="border border-slate-200 rounded divide-y divide-slate-100">
                  {['Linear Regression (Recommended)', 'Random Forest', 'Neural Network'].map(m => (
                    <div key={m} onClick={() => setModel(m)} className={`p-3 cursor-pointer text-sm font-medium ${model === m ? 'bg-[#f0f9ff] text-[#0284c7]' : 'text-slate-600 hover:bg-slate-50'}`}>
                      {m}
                    </div>
                  ))}
                </div>
              </div>
              <button disabled={loading || queue.length === 0} onClick={submitBatch} className="w-full bg-[#16a34a] hover:bg-[#15803d] disabled:bg-slate-300 text-white font-bold py-3 text-lg rounded shadow transition-colors flex items-center justify-center gap-2">
                {loading ? 'Running Optimizer...' : 'Submit Batch & Schedule →'}
              </button>
            </div>
            
            <div className="w-full lg:w-[220px] bg-[#f8fafc] rounded-lg border border-slate-200 p-5 flex flex-col justify-center gap-4">
              <div>
                <div className="text-xs text-slate-500">Total Tasks:</div>
                <div className="text-lg font-bold">{dashboardStats?.total_rows?.toLocaleString() || '0'}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Avg CPU:</div>
                <div className="text-lg font-bold">
                  {dashboardStats?.avg_cpu !== undefined ? `${(dashboardStats.avg_cpu * 100).toFixed(1)}%` : '0%'}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Avg Memory:</div>
                <div className="text-lg font-bold">
                  {dashboardStats?.avg_ram !== undefined ? `${(dashboardStats.avg_ram * 16).toFixed(1)}GB` : '0GB'}
                </div>
              </div>
            </div>
          </div>

          {/* RESULTS PANEL */}
          {result && (
            <div className="bg-[#f0f9ff] rounded-lg border-2 border-[#bae6fd] overflow-hidden fade-in">
              <div className="bg-[#bae6fd] px-4 py-2 flex justify-between">
                <span className="text-[#0369a1] font-bold text-sm">Module 2: Smart Scheduler Summary</span>
                <span className="text-[#0284c7] text-xs font-semibold">Datacenter A</span>
              </div>
              
              <div className="p-4 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-6">Scheduled Plan Summary</h2>
                
                <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
                  {/* Part 1 */}
                  <div className="xl:col-span-2">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">1. Prediction Results & Energy Index</h3>
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[320px] text-sm bg-white rounded border border-slate-200">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="p-2 text-left text-slate-500 font-medium">Task</th>
                            <th className="p-2 text-left text-slate-500 font-medium">Target Index</th>
                          </tr>
                        </thead>
                        <tbody>
                          {result.eacts_result.assignments.map((t, i) => (
                            <tr key={i} className="border-b border-slate-100 last:border-0">
                              <td className="p-2 font-medium">{t.task_id || `T${i+1}`}</td>
                              <td className="p-2 text-blue-600 font-semibold">{t.predicted_energy?.toFixed(3)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Part 2 */}
                  <div className="xl:col-span-3">
                    <h3 className="text-sm font-bold text-slate-700 mb-3">2. Dynamic Resource Allocation (Balanced Load Map)</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                      {Object.keys(result.eacts_result.vm_loads).map(vm => {
                        const load = result.eacts_result.vm_loads[vm] || 0
                        const assigned = result.eacts_result.assignments.filter(a => a.assigned_vm === vm)
                        return (
                          <div key={vm} className="bg-white rounded border border-slate-200 p-3 shadow-sm">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-blue-500">🖥️</span>
                              <span className="font-bold text-slate-700">{vm.replace('VM','VM ')}</span>
                            </div>
                            <div className="text-[10px] text-slate-500 mb-2">Total Load: {(load*1000).toFixed(0)}</div>
                            <div className="space-y-1">
                              {assigned.map((t,i) => (
                                <div key={i} className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded font-medium flex justify-between">
                                  <span>{t.task_id || `T`}</span>
                                  <span>{t.predicted_energy?.toFixed(2)}</span>
                                </div>
                              ))}
                              {assigned.length === 0 && <span className="text-[10px] text-slate-400">Idle</span>}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    <h3 className="text-sm font-bold text-slate-700 mb-3">3. Impact Analysis</h3>
                    <div className="flex flex-col md:flex-row items-stretch md:items-end gap-4 md:gap-6 bg-white p-4 rounded border border-slate-200 shadow-sm">
                      <div className="bg-slate-400 text-white p-3 rounded flex-1">
                        <div className="text-xs mb-1">Baseline (FCFS) Energy Load:</div>
                        <div className="text-lg font-bold">{(result.fcfs_result.peak_load * 1000).toFixed(0)} units</div>
                      </div>
                      <div className="bg-green-600 text-white p-3 rounded flex-1">
                        <div className="text-xs mb-1">E-ACTS Optimized Energy Load:</div>
                        <div className="text-lg font-bold">{(result.eacts_result.peak_load * 1000).toFixed(0)} units</div>
                      </div>
                      <div className="text-center flex-1">
                        <div className="text-sm font-bold text-slate-800">PROJECTED ENERGY SAVINGS:</div>
                        <div className="text-3xl font-black text-green-600">{result.impact.improvement_pct.toFixed(1)}%</div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 flex flex-col sm:flex-row sm:justify-end gap-3">
                  <button onClick={startNewBatch} className="w-full sm:w-auto px-4 py-2 bg-blue-500 text-white text-sm font-bold rounded hover:bg-blue-600">Start New Batch</button>
                  <button onClick={handleExport} className="w-full sm:w-auto px-4 py-2 bg-white border border-slate-300 text-slate-700 text-sm font-bold rounded hover:bg-slate-50">Export Logs (CSV)</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
