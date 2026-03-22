import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TaskHub from './pages/TaskHub'
import Database from './pages/Database'
import Alerts from './pages/Alerts'
import Settings from './pages/Settings'
import Layout from './components/Layout'
import './index.css'

function RequireAuth({ children }) {
  const user = localStorage.getItem('eacts_user')
  return user ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes inside Layout */}
        <Route element={<RequireAuth><Layout /></RequireAuth>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/tasks"     element={<TaskHub />} />
          <Route path="/database"  element={<Database />} />
          <Route path="/alerts"    element={<Alerts />} />
          <Route path="/settings"  element={<Settings />} />
          <Route path="*"          element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
