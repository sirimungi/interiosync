import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { setAuthToken, fetchMe } from './api'
import AppShell from './components/AppShell'
import ClientShell from './components/ClientShell'
import Login from './pages/Login'
import Inquiry from './pages/Inquiry'
import Dashboard from './pages/Dashboard'
import Projects from './pages/Projects'
import ProjectDetail from './pages/ProjectDetail'
import Quotes from './pages/Quotes'
import QuoteDetail from './pages/QuoteDetail'
import Appointments from './pages/Appointments'
import Leads from './pages/Leads'

function App() {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      setLoading(false)
      return
    }
    // Always sync user from DB on startup so name/role changes reflect immediately
    setAuthToken(storedToken)
    fetchMe()
      .then((freshUser) => {
        setUser(freshUser)
        localStorage.setItem('user', JSON.stringify(freshUser))
      })
      .catch(() => {
        // Token expired or invalid — clear session
        localStorage.removeItem('user')
        localStorage.removeItem('token')
        setToken(null)
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (token) {
      setAuthToken(token)
      localStorage.setItem('token', token)
    } else {
      setAuthToken(null)
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      setUser(null)
    }
  }, [token])

  const handleLogin = (data) => {
    setToken(data.access_token)
    setUser(data.user)
    localStorage.setItem('user', JSON.stringify(data.user))
  }

  const handleLogout = () => {
    setToken(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="text-center">
          <span className="font-display text-2xl text-brand-900">
            Interio<span className="text-gold">Sync</span>
          </span>
          <p className="text-brand-400 text-sm mt-2">Loading…</p>
        </div>
      </div>
    )
  }

  // Pick the right shell based on role
  const Shell = user?.role === 'client' ? ClientShell : AppShell

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes — no auth required */}
        <Route
          path="/login"
          element={token ? <Navigate to="/" replace /> : <Login onLogin={handleLogin} />}
        />
        <Route path="/inquiry" element={<Inquiry />} />

        {/* Protected app shell with nested pages */}
        <Route
          element={
            !token ? (
              <Navigate to="/login" replace />
            ) : (
              <Shell user={user} onLogout={handleLogout} />
            )
          }
        >
          <Route index element={<Dashboard user={user} />} />
          <Route path="projects" element={<Projects user={user} />} />
          <Route path="projects/:id" element={<ProjectDetail user={user} />} />
          {/* legacy route redirect */}
          <Route path="project/:id" element={<ProjectDetail user={user} />} />
          <Route path="quotes" element={<Quotes user={user} />} />
          <Route path="quotes/:id" element={<QuoteDetail user={user} />} />
          <Route path="appointments" element={<Appointments user={user} />} />
          <Route path="leads" element={<Leads user={user} />} />
        </Route>

        <Route path="*" element={<Navigate to={token ? '/' : '/login'} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
