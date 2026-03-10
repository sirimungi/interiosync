import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { FolderKanban, FileText, CalendarDays, CheckSquare, ArrowRight, Clock, AlertCircle } from 'lucide-react'
import { fetchProjects, fetchQuotes, fetchAppointments } from '../api'
import { formatINR, formatIST, statusBadgeClass, statusLabel } from '../utils'

function StatCard({ icon: Icon, label, value, color = 'gold', to, alert }) {
  const content = (
    <div className={`card-padded flex items-center gap-4 hover:shadow-card-hover transition-shadow ${alert ? 'border-amber-200 bg-amber-50' : ''}`}>
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
        alert ? 'bg-amber-100' :
        color === 'gold' ? 'bg-gold-100' : 'bg-brand-100'
      }`}>
        <Icon size={20} className={alert ? 'text-amber-600' : color === 'gold' ? 'text-gold-700' : 'text-brand-600'} strokeWidth={1.8} />
      </div>
      <div>
        <p className="text-brand-400 text-xs font-medium">{label}</p>
        <p className={`text-2xl font-semibold tabular-nums ${alert ? 'text-amber-700' : 'text-brand-900'}`}>{value}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : <div>{content}</div>
}

// ── Designer Dashboard ─────────────────────────────────────────────────────
function DesignerDashboard({ projects, quotes, appointments }) {
  const activeProjects = projects.filter((p) => p.status === 'active').length
  const draftQuotes = quotes.filter((q) => q.status === 'draft').length
  const sentQuotes = quotes.filter((q) => q.status === 'sent').length
  const upcomingAppts = appointments.filter((a) => a.status === 'scheduled').length
  const recentProjects = projects.slice(0, 4)
  const recentQuotes = quotes.slice(0, 4)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="Active Projects" value={activeProjects} to="/projects" />
        <StatCard icon={FileText} label="Quotes — Draft" value={draftQuotes} color="brand" to="/quotes" />
        <StatCard icon={AlertCircle} label="Awaiting Client" value={sentQuotes} to="/quotes" alert={sentQuotes > 0} />
        <StatCard icon={CalendarDays} label="Upcoming Appts" value={upcomingAppts} color="brand" to="/appointments" />
      </div>

      {/* Recent projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-brand-900">Recent Projects</h2>
          <Link to="/projects" className="text-gold-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentProjects.length === 0 ? (
          <div className="card-padded text-center text-brand-400 text-sm py-8">
            No projects yet. <Link to="/projects" className="text-gold-700 hover:underline">Create one →</Link>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {recentProjects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card p-4 hover:shadow-card-hover transition-shadow flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-brand-900 truncate">{p.name}</p>
                  <p className="text-xs text-brand-400 mt-0.5 truncate">{p.description || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={statusBadgeClass(p.status)}>{statusLabel(p.status)}</span>
                    <span className="text-xs text-brand-400">Client: {p.client?.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Recent quotes */}
      {recentQuotes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-brand-900">Recent Quotes</h2>
            <Link to="/quotes" className="text-gold-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-card">
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase">Quote</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase hidden sm:table-cell">Project</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-400 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentQuotes.map((q) => (
                  <tr key={q.id} className="border-b border-surface-border last:border-0 hover:bg-surface-card transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/quotes/${q.id}`} className="font-medium text-brand-900 hover:text-gold-700">{q.title}</Link>
                    </td>
                    <td className="px-4 py-3 text-brand-500 hidden sm:table-cell">{q.project?.name}</td>
                    <td className="px-4 py-3 text-right amount-gold">{formatINR(q.total_amount)}</td>
                    <td className="px-4 py-3"><span className={statusBadgeClass(q.status)}>{statusLabel(q.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

// ── Client Dashboard ───────────────────────────────────────────────────────
function ClientDashboard({ projects, quotes, appointments }) {
  const activeProjects = projects.filter((p) => p.status === 'active').length
  const pendingResponse = quotes.filter((q) => q.status === 'sent').length
  const acceptedQuotes = quotes.filter((q) => q.status === 'accepted').length
  const upcomingAppts = appointments.filter((a) => a.status === 'scheduled').length
  const recentProjects = projects.slice(0, 4)

  return (
    <div className="space-y-8">
      {/* Action required banner */}
      {pendingResponse > 0 && (
        <Link to="/quotes" className="block">
          <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-center gap-3">
            <AlertCircle size={20} className="text-amber-600 shrink-0" />
            <div className="flex-1">
              <p className="font-semibold text-amber-800 text-sm">Action required</p>
              <p className="text-amber-700 text-xs mt-0.5">
                You have {pendingResponse} quote{pendingResponse > 1 ? 's' : ''} waiting for your approval.
              </p>
            </div>
            <ArrowRight size={16} className="text-amber-600 shrink-0" />
          </div>
        </Link>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FolderKanban} label="My Projects" value={activeProjects} to="/projects" />
        <StatCard icon={AlertCircle} label="Quotes to Review" value={pendingResponse} to="/quotes" alert={pendingResponse > 0} />
        <StatCard icon={CheckSquare} label="Quotes Accepted" value={acceptedQuotes} color="brand" to="/quotes" />
        <StatCard icon={CalendarDays} label="Upcoming Visits" value={upcomingAppts} color="brand" to="/appointments" />
      </div>

      {/* My projects */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-brand-900">My Projects</h2>
          <Link to="/projects" className="text-gold-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {recentProjects.length === 0 ? (
          <div className="card-padded text-center text-brand-400 text-sm py-8">
            No projects assigned to you yet.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {recentProjects.map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card p-4 hover:shadow-card-hover transition-shadow flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-brand-900 truncate">{p.name}</p>
                  <p className="text-xs text-brand-400 mt-0.5 truncate">{p.description || 'No description'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={statusBadgeClass(p.status)}>{statusLabel(p.status)}</span>
                    <span className="text-xs text-brand-400">Designer: {p.designer?.name}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Quotes pending response */}
      {quotes.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-brand-900">My Quotes</h2>
            <Link to="/quotes" className="text-gold-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-border bg-surface-card">
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase">Quote</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase hidden sm:table-cell">Project</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-400 uppercase">Amount</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase">Status</th>
                </tr>
              </thead>
              <tbody>
                {quotes.slice(0, 4).map((q) => (
                  <tr key={q.id} className={`border-b border-surface-border last:border-0 hover:bg-surface-card transition-colors ${q.status === 'sent' ? 'bg-amber-50/50' : ''}`}>
                    <td className="px-4 py-3">
                      <Link to={`/quotes/${q.id}`} className="font-medium text-brand-900 hover:text-gold-700">{q.title}</Link>
                      {q.status === 'sent' && <span className="ml-2 text-xs text-amber-600 font-medium">· Needs your response</span>}
                    </td>
                    <td className="px-4 py-3 text-brand-500 hidden sm:table-cell">{q.project?.name}</td>
                    <td className="px-4 py-3 text-right amount-gold">{formatINR(q.total_amount)}</td>
                    <td className="px-4 py-3"><span className={statusBadgeClass(q.status)}>{statusLabel(q.status)}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Upcoming appointments */}
      {appointments.filter((a) => a.status === 'scheduled').slice(0, 3).length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-brand-900">Upcoming Visits</h2>
            <Link to="/appointments" className="text-gold-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          <div className="space-y-2">
            {appointments.filter((a) => a.status === 'scheduled').slice(0, 3).map((a) => (
              <div key={a.id} className="card p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <CalendarDays size={18} className="text-blue-600" strokeWidth={1.8} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-brand-900 text-sm">{statusLabel(a.type)}</p>
                  <p className="text-xs text-brand-400">{formatIST(a.scheduled_at)} · {a.project?.name || 'General'}</p>
                  <p className="text-xs text-brand-400">With: {a.creator?.name}</p>
                </div>
                <span className={statusBadgeClass(a.status)}>{statusLabel(a.status)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

// ── Employee Dashboard ─────────────────────────────────────────────────────
function EmployeeDashboard({ projects, appointments }) {
  const activeProjects = projects.filter((p) => p.status === 'active').length
  const upcomingAppts = appointments.filter((a) => a.status === 'scheduled').length

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <StatCard icon={FolderKanban} label="Assigned Projects" value={activeProjects} to="/projects" />
        <StatCard icon={CalendarDays} label="Upcoming Appointments" value={upcomingAppts} color="brand" to="/appointments" />
      </div>

      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-brand-900">My Projects</h2>
          <Link to="/projects" className="text-gold-700 text-sm font-medium flex items-center gap-1 hover:gap-2 transition-all">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {projects.length === 0 ? (
          <div className="card-padded text-center text-brand-400 text-sm py-8">No projects assigned yet.</div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-3">
            {projects.slice(0, 4).map((p) => (
              <Link key={p.id} to={`/projects/${p.id}`} className="card p-4 hover:shadow-card-hover transition-shadow flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-gold mt-2 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-brand-900 truncate">{p.name}</p>
                  <p className="text-xs text-brand-400 mt-0.5 truncate">{p.description || 'No description'}</p>
                  <span className={`${statusBadgeClass(p.status)} mt-2 inline-flex`}>{statusLabel(p.status)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────
export default function Dashboard({ user }) {
  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => fetchQuotes({}),
    enabled: user?.role !== 'employee',
  })
  const { data: appointments = [] } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => fetchAppointments({}),
  })

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  }

  const roleLabel = { designer: 'Designer', client: 'Client', employee: 'Employee' }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="page-title">{greeting()}, {user?.name?.split(' ')[0]}</h1>
        <p className="page-subtitle">{roleLabel[user?.role]} dashboard · InterioSync</p>
      </div>

      {user?.role === 'designer' && (
        <DesignerDashboard projects={projects} quotes={quotes} appointments={appointments} />
      )}
      {user?.role === 'client' && (
        <ClientDashboard projects={projects} quotes={quotes} appointments={appointments} />
      )}
      {user?.role === 'employee' && (
        <EmployeeDashboard projects={projects} appointments={appointments} />
      )}
    </div>
  )
}
