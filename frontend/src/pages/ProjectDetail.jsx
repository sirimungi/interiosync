import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, FileText } from 'lucide-react'
import { fetchProject, fetchQuotes } from '../api'
import { statusBadgeClass, statusLabel, formatIST } from '../utils'
import TaskList from '../components/TaskList'
import FileUploader from '../components/FileUploader'
import ChatBox from '../components/ChatBox'

const TABS = ['Tasks', 'Files', 'Messages', 'Quotes']

export default function ProjectDetail({ user }) {
  const { id } = useParams()
  const [tab, setTab] = useState('Tasks')
  const canEdit = user?.role === 'designer' || user?.role === 'employee'

  const { data: project, isLoading, isError } = useQuery({
    queryKey: ['project', id],
    queryFn: () => fetchProject(id),
  })

  const { data: quotes = [] } = useQuery({
    queryKey: ['quotes', { project_id: id }],
    queryFn: () => fetchQuotes({ project_id: id }),
    enabled: !!id && user?.role !== 'employee',
  })

  const tabs = user?.role === 'employee' ? ['Tasks', 'Files', 'Messages'] : TABS

  if (isLoading) return <div className="text-brand-400 text-sm p-4">Loading project…</div>
  if (isError || !project) return <div className="text-red-600 text-sm p-4">Project not found.</div>

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Breadcrumb */}
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-700 transition-colors">
        <ArrowLeft size={14} />
        Back to Projects
      </Link>

      {/* Project header */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-brand-900">{project.name}</h1>
            <p className="text-brand-400 text-sm mt-1">{project.description || 'No description'}</p>
            <div className="flex items-center gap-3 mt-3 text-xs text-brand-400">
              <span>Designer: <span className="text-brand-700 font-medium">{project.designer?.name}</span></span>
              <span>·</span>
              <span>Client: <span className="text-brand-700 font-medium">{project.client?.name}</span></span>
              <span>·</span>
              <span>Started {formatIST(project.created_at, 'DD/MM/YYYY')}</span>
            </div>
          </div>
          <span className={statusBadgeClass(project.status)}>{statusLabel(project.status)}</span>
        </div>
      </div>

      {/* Tabs */}
      <div>
        <div className="flex gap-1 border-b border-surface-border">
          {tabs.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-gold text-gold-700'
                  : 'border-transparent text-brand-400 hover:text-brand-700'
              }`}
            >
              {t}
              {t === 'Quotes' && quotes.length > 0 && (
                <span className="ml-1.5 text-xs bg-gold-100 text-gold-700 px-1.5 py-0.5 rounded-full">
                  {quotes.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="pt-5">
          {tab === 'Tasks' && <TaskList projectId={project.id} canEdit={canEdit} />}
          {tab === 'Files' && <FileUploader projectId={project.id} canEdit={canEdit} />}
          {tab === 'Messages' && <ChatBox projectId={project.id} />}
          {tab === 'Quotes' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm text-brand-500">{quotes.length} quote{quotes.length !== 1 ? 's' : ''} for this project</p>
                {user?.role === 'designer' && (
                  <Link
                    to={`/quotes?project_id=${project.id}&new=1`}
                    className="btn-gold btn-sm"
                  >
                    <FileText size={13} /> New Quote
                  </Link>
                )}
              </div>
              {quotes.length === 0 ? (
                <div className="card-padded text-center text-brand-400 text-sm py-8">
                  No quotes yet.{user?.role === 'designer' && (
                    <Link to={`/quotes?project_id=${project.id}&new=1`} className="text-gold-700 ml-1 hover:underline">
                      Create one →
                    </Link>
                  )}
                </div>
              ) : (
                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-border">
                        <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase">Title</th>
                        <th className="text-right px-4 py-3 text-xs font-medium text-brand-400 uppercase">Total</th>
                        <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {quotes.map((q) => (
                        <tr key={q.id} className="border-b border-surface-border last:border-0 hover:bg-surface-card">
                          <td className="px-4 py-3">
                            <Link to={`/quotes/${q.id}`} className="font-medium text-brand-900 hover:text-gold-700">
                              {q.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3 text-right amount-gold">
                            {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(q.total_amount)}
                          </td>
                          <td className="px-4 py-3">
                            <span className={statusBadgeClass(q.status)}>{statusLabel(q.status)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
