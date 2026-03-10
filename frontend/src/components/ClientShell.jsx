/**
 * ClientShell — light, consumer-friendly layout for the "client" role.
 * Visually distinct from the designer's dark AppShell:
 *   - White sidebar with teal accent colour
 *   - Consumer-oriented nav labels
 *   - Larger, friendlier typography
 */
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  Home,
  FolderOpen,
  FileText,
  CalendarCheck,
  LogOut,
  Menu,
  RefreshCw,
  X,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getInitials } from '../utils'

const CLIENT_NAV = [
  { to: '/',            icon: Home,          label: 'My Home',        end: true  },
  { to: '/projects',    icon: FolderOpen,    label: 'My Projects',    end: false },
  { to: '/quotes',      icon: FileText,      label: 'My Quotes',      end: false },
  { to: '/appointments',icon: CalendarCheck, label: 'Appointments',   end: false },
]

export default function ClientShell({ user, onLogout }) {
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

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

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
      <div className="px-6 py-6 border-b border-slate-100">
        <span className="font-display text-xl tracking-wide text-slate-800">
          Interio<span className="text-teal-600">Sync</span>
        </span>
        <p className="text-slate-400 text-xs mt-0.5 font-sans">Your Project Portal</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
        {CLIENT_NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-teal-50 text-teal-700 border border-teal-100'
                  : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.8} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Quick help callout */}
      <div className="mx-3 mb-3 rounded-2xl bg-teal-50 border border-teal-100 px-4 py-3">
        <p className="text-teal-700 text-xs font-medium">Need help?</p>
        <p className="text-teal-500 text-xs mt-0.5 leading-relaxed">
          Message your designer directly from any project page.
        </p>
      </div>

      {/* User footer */}
      <div className="px-4 py-4 border-t border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-teal-100 flex items-center justify-center shrink-0">
            <span className="text-teal-700 text-xs font-bold">{getInitials(user?.name)}</span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-slate-800 text-sm font-medium truncate">{user?.name}</p>
            <p className="text-slate-400 text-xs">Client</p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="text-slate-400 hover:text-slate-700 transition-colors p-1 rounded-lg"
            title="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </div>
  )

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-100 shrink-0">
        <SidebarContent />
      </aside>

      {/* Mobile sidebar overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-50 flex flex-col w-64 bg-white">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-100">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="text-slate-600 p-1"
          >
            <Menu size={20} />
          </button>
          <span className="font-display text-lg text-slate-800">
            Interio<span className="text-teal-600">Sync</span>
          </span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className={`text-slate-400 p-1 ${mobileOpen ? 'visible' : 'invisible'}`}
          >
            <X size={20} />
          </button>
        </header>

        {/* Desktop topbar */}
        <header className="hidden md:flex items-center justify-between px-6 py-3 bg-white border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              {CLIENT_NAV.find((n) => n.end
                ? location.pathname === n.to
                : location.pathname.startsWith(n.to))?.label ?? 'Portal'}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            title="Refresh data"
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-teal-600 transition-colors
                       px-2 py-1 rounded-lg hover:bg-teal-50"
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
