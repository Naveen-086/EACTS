import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const api = axios.create({
  baseURL: API_BASE,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// ─── Auth ────────────────────────────────────────────────────────────────────
export const login = (username, password) =>
  api.post('/login', { username, password })

// ─── Dashboard & Logs ────────────────────────────────────────────────────────
export const getDashboardStats = () => api.get('/dashboard-stats')
export const getLogs = () => api.get('/logs')
export const getAlerts = () => api.get('/alerts')
export const exportLogsCsv = () => api.get('/export-logs', { responseType: 'blob' })
// ─── ML Predict ──────────────────────────────────────────────────────────────
export const predictTasks = (tasks, n_vms = 3) =>
  api.post('/predict', { tasks, n_vms })

// ─── Schedule ────────────────────────────────────────────────────────────────
export const scheduleOptimised = (tasks, n_vms = 3) =>
  api.post('/schedule', { tasks, n_vms })

export const scheduleFCFS = (tasks, n_vms = 3) =>
  api.post('/schedule-fcfs', { tasks, n_vms })

// ─── Health ───────────────────────────────────────────────────────────────────
export const healthCheck = () => api.get('/health')

export default api
