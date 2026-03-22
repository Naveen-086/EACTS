import { useState } from 'react'
import Sidebar from '../components/Sidebar'
import { scheduleOptimised } from '../api'
import { useNavigate } from 'react-router-dom'

const DEFAULT_TASK = {
  cpu_usage:      0.5,
  ram_usage:      0.5,
  disk_io:        0.5,
  network_io:     0.5,
  priority:       0.5,
  execution_time: 0.5,
  vm_id:          0.5,
}

const PRIORITY_MAP = { High: 1.0, Medium: 0.5, Low: 0.0 }

export default function TaskSubmission() {
  const nav = useNavigate()
  const [form, setForm] = useState({
    cpu_usage:   50,
    ram_usage:   50,
    disk_io:     50,
    network_io:  50,
    priority:    'Medium',
    execution_time: 50,
  })
  const [queue, setQueue] = useState([])
  const [nVms, setNVms] = useState(3)
  const [scheduling, setScheduling] = useState(false)
  const [error, setError] = useState('')

  const addTask = () => {
    const task = {
      task_id:        `T-${Date.now()}`,
      cpu_usage:      form.cpu_usage / 100,
      ram_usage:      form.ram_usage / 100,
      disk_io:        form.disk_io / 100,
      network_io:     form.network_io / 100,
      priority:       PRIORITY_MAP[form.priority],
      execution_time: form.execution_time / 100,
      vm_id:          0.5,
      // display values
      _cpu_pct:       form.cpu_usage,
      _ram_mb:        form.ram_usage,
      _priority_label: form.priority,
    }
    setQueue(prev => [...prev, task])
    setError('')
  }

  const removeTask = (idx) => setQueue(prev => prev.filter((_, i) => i !== idx))

  const run = async () => {
    if (queue.length === 0) { setError('Add at least one task to the queue.'); return }
    setScheduling(true)
    setError('')
    try {
      const res = await scheduleOptimised(queue, nVms)
      sessionStorage.setItem('eacts_results', JSON.stringify(res.data))
      nav('/results')
    } catch (err) {
      setError(err.response?.data?.detail || 'Scheduling failed. Is the backend running?')
    } finally {
      setScheduling(false)
    }
  }

  const priorityColor = p => ({ High: '#ef4444', Medium: '#f59e0b', Low: '#10b981' }[p])

  return (
    <div className="flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="flex-1 page-enter" style={{ marginLeft: 260, padding: '24px 32px' }}>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold gradient-text font-['Space_Grotesk']">Task Submission Hub</h1>
          <p className="text-slate-500 text-sm mt-1">Configure and queue cloud tasks for energy-aware scheduling</p>
        </div>

        <div className="grid grid-cols-2 gap-6">

          {/* ── Task Form */}
          <div className="glass-card p-6">
            <h2 className="text-base font-semibold text-slate-200 mb-5 flex items-center gap-2">
              <span className="text-xl">⚙️</span> Configure Task
            </h2>

            <div className="space-y-4">
              {/* CPU */}
              <div>
                <label className="flex justify-between text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  <span>CPU Usage</span><span className="text-blue-400">{form.cpu_usage}%</span>
                </label>
                <input type="range" min="0" max="100" value={form.cpu_usage}
                  onChange={e => setForm({ ...form, cpu_usage: +e.target.value })}
                  className="w-full accent-blue-500" />
              </div>

              {/* RAM */}
              <div>
                <label className="flex justify-between text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  <span>RAM Usage</span><span className="text-purple-400">{form.ram_usage}%</span>
                </label>
                <input type="range" min="0" max="100" value={form.ram_usage}
                  onChange={e => setForm({ ...form, ram_usage: +e.target.value })}
                  className="w-full accent-purple-500" />
              </div>

              {/* Disk IO */}
              <div>
                <label className="flex justify-between text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  <span>Disk IO</span><span className="text-cyan-400">{form.disk_io}%</span>
                </label>
                <input type="range" min="0" max="100" value={form.disk_io}
                  onChange={e => setForm({ ...form, disk_io: +e.target.value })}
                  className="w-full accent-cyan-500" />
              </div>

              {/* Network IO */}
              <div>
                <label className="flex justify-between text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  <span>Network IO</span><span className="text-green-400">{form.network_io}%</span>
                </label>
                <input type="range" min="0" max="100" value={form.network_io}
                  onChange={e => setForm({ ...form, network_io: +e.target.value })}
                  className="w-full accent-green-500" />
              </div>

              {/* Execution Time */}
              <div>
                <label className="flex justify-between text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider">
                  <span>Execution Time</span><span className="text-orange-400">{form.execution_time}%</span>
                </label>
                <input type="range" min="0" max="100" value={form.execution_time}
                  onChange={e => setForm({ ...form, execution_time: +e.target.value })}
                  className="w-full accent-orange-500" />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Priority</label>
                <div className="flex gap-2">
                  {['High', 'Medium', 'Low'].map(p => (
                    <button key={p} onClick={() => setForm({ ...form, priority: p })}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold transition-all border"
                      style={{
                        background: form.priority === p ? `${priorityColor(p)}20` : 'transparent',
                        borderColor: form.priority === p ? priorityColor(p) : 'rgba(255,255,255,0.08)',
                        color: form.priority === p ? priorityColor(p) : '#64748b',
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={addTask} className="btn-glow w-full py-3 text-sm mt-2">
                + Add Task to Queue
              </button>
            </div>
          </div>

          {/* ── Queue */}
          <div className="flex flex-col gap-4">
            {/* VM count + schedule btn */}
            <div className="glass-card p-5 flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-2 uppercase tracking-wider">Number of VMs</label>
                <input type="number" min="2" max="10" value={nVms}
                  onChange={e => setNVms(+e.target.value)}
                  className="input-field" style={{ maxWidth: 120 }} />
              </div>
              <div className="flex-1 text-right">
                <div className="text-3xl font-bold text-white font-['Space_Grotesk']">{queue.length}</div>
                <div className="text-xs text-slate-500">tasks in queue</div>
              </div>
            </div>

            {/* Task list */}
            <div className="glass-card p-5 flex-1" style={{ maxHeight: 340, overflowY: 'auto' }}>
              <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
                <span>📋</span> Task Queue
              </h3>
              {queue.length === 0 ? (
                <div className="text-center py-10 text-slate-600">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-sm">No tasks added yet</p>
                </div>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>CPU</th>
                      <th>RAM</th>
                      <th>Disk</th>
                      <th>Net</th>
                      <th>Priority</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {queue.map((t, i) => (
                      <tr key={t.task_id}>
                        <td className="text-slate-500 text-xs">{i + 1}</td>
                        <td>{t._cpu_pct}%</td>
                        <td>{t._ram_mb}%</td>
                        <td>{(t.disk_io * 100).toFixed(0)}%</td>
                        <td>{(t.network_io * 100).toFixed(0)}%</td>
                        <td>
                          <span className={`badge ${
                            t._priority_label === 'High' ? 'badge-red'
                            : t._priority_label === 'Medium' ? 'badge-orange'
                            : 'badge-green'
                          }`}>{t._priority_label}</span>
                        </td>
                        <td>
                          <button onClick={() => removeTask(i)}
                            className="text-slate-600 hover:text-red-400 text-lg transition-colors">×</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {error && (
              <div className="text-sm text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-4 py-3 flex items-center gap-2">
                ⚠️ {error}
              </div>
            )}

            <button onClick={run} disabled={scheduling || queue.length === 0}
              className="btn-glow py-4 text-base font-bold">
              {scheduling ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.4 0 0 5.4 0 12h4z"/>
                  </svg>
                  Running E-ACTS Scheduler…
                </span>
              ) : '⚡ Predict & Schedule'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
