import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  CalendarDays,
  LogOut,
  Menu,
  RefreshCw,
  Users,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getInitials } from '../utils'

const getNav = (role) => [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
  ...(role === 'designer' ? [{ to: '/leads', icon: Users, label: 'Leads' }] : []),
  { to: '/projects', icon: FolderKanban, label: 'Projects' },
  ...(role !== 'employee' ? [{ to: '/quotes', icon: FileText, label: 'Quotes' }] : []),
  { to: '/appointments', icon: CalendarDays, label: 'Appointments' },
]

export default function AppShell({ user, onLogout }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const navigate = useNavigate()
  const location = useLocation()
  const qc = useQueryClient()

  const handleRefresh = async () => {
    setRefreshing(true)
    await qc.invalidateQueries()
    setTimeout(() => setRefreshing(false), 600)
  }

  // Close mobile sidebar on every route change
  useEffect(() => {
    setMobileOpen(false)
  }, [location.pathname])

  // ESC closes mobile sidebar
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setMobileOpen(false) }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const handleLogout = () => {
    onLogout()
    navigate('/login', { replace: true })
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-brand-800">
        <span className="font-display text-xl tracking-wide text-white">
          Interio<span className="text-gold">Sync</span>
        </span>
        <p className="text-brand-400 text-xs mt-0.5 font-sans">Interior Design Platform</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
        {getNav(user?.role).map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-brand-800 text-gold gold-border-l pl-[9px]'
                  : 'text-brand-300 hover:bg-brand-800 hover:text-white'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-brand-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gold flex items-center justify-center shrink-0">
            <span className="text-brand-900 text-xs font-bold">{getInitials(user?.name)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-white text-sm font-medium truncate">{user?.name}</p>
            <p className="text-brand-400 text-xs capitalize">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-brand-400 hover:text-white transition-colors p-1 rounded"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 bg-brand-900 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-60 bg-brand-900">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-surface-border">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-brand-700 p-1"
          >
            <Menu size={20} />
          </button>
          <span className="font-display text-lg text-brand-900">
            Interio<span className="text-gold">Sync</span>
          </span>
          <div className="w-7" />
        </header>

        {/* Desktop topbar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-surface-border">
          <p className="text-xs text-brand-400 capitalize">{location.pathname.replace('/', '') || 'dashboard'}</p>
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh data"
            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-700 transition-colors px-2 py-1 rounded-lg hover:bg-surface-card"
          >
            <RefreshCw size={13} className={refreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
