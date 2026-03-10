import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useSearchParams } from 'react-router-dom'
import { Plus, X, FileText } from 'lucide-react'
import { fetchQuotes, createQuote, fetchProjects } from '../api'
import { formatINR, formatDateIST, statusBadgeClass, statusLabel } from '../utils'

const schema = z.object({
  project_id: z.string().min(1, 'Select a project'),
  title: z.string().min(1, 'Title is required'),
  gst_rate: z.coerce.number().min(0).max(100),
  notes: z.string().optional(),
  valid_until: z.string().optional(),
})

function CreateQuoteModal({ user, defaultProjectId, onClose }) {
  const qc = useQueryClient()
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { gst_rate: 18, project_id: defaultProjectId || '' },
  })

  const mutation = useMutation({
    mutationFn: (data) =>
      createQuote({
        project_id: parseInt(data.project_id, 10),
        title: data.title,
        gst_rate: data.gst_rate,
        notes: data.notes || undefined,
        valid_until: data.valid_until ? new Date(data.valid_until).toISOString() : undefined,
      }),
    onSuccess: (quote) => {
      qc.invalidateQueries({ queryKey: ['quotes'] })
      onClose(quote.id)
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg text-brand-900">New Quote</h2>
          <button type="button" onClick={() => onClose()} className="btn-ghost btn-sm p-1">
            <X size={16} />
          </button>
        </div>

        {mutation.error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            {mutation.error.response?.data?.detail || 'Failed to create quote'}
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="field-label">Project</label>
            <select className="field-input" {...register('project_id')}>
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.project_id && <p className="field-error">{errors.project_id.message}</p>}
          </div>

          <div>
            <label className="field-label">Quote title</label>
            <input className="field-input" placeholder="e.g. Living Room Phase 1 Estimate" {...register('title')} />
            {errors.title && <p className="field-error">{errors.title.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">GST rate (%)</label>
              <input type="number" step="0.01" className="field-input" {...register('gst_rate')} />
              {errors.gst_rate && <p className="field-error">{errors.gst_rate.message}</p>}
            </div>
            <div>
              <label className="field-label">Valid until <span className="text-brand-400">(opt.)</span></label>
              <input type="date" className="field-input" {...register('valid_until')} />
            </div>
          </div>

          <div>
            <label className="field-label">Notes <span className="text-brand-400">(optional)</span></label>
            <textarea className="field-input resize-none" rows={2} placeholder="Payment terms, scope notes…" {...register('notes')} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-gold flex-1">
              {isSubmitting || mutation.isPending ? 'Creating…' : 'Create & add items'}
            </button>
            <button type="button" onClick={() => onClose()} className="btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Quotes({ user }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const defaultProjectId = searchParams.get('project_id') || ''
  const [showCreate, setShowCreate] = useState(false)
  const qc = useQueryClient()

  // Open create modal from URL param but only once, then clean the URL
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setShowCreate(true)
      setSearchParams({}, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const { data: quotes = [], isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: () => fetchQuotes({}),
  })

  const [filter, setFilter] = useState('all')

  const filtered = quotes.filter((q) => filter === 'all' || q.status === filter)

  const handleCreateClose = (newId) => {
    setShowCreate(false)
    if (newId) {
      window.location.href = `/quotes/${newId}`
    }
  }

  const STATUS_FILTERS = user?.role === 'client'
    ? ['all', 'sent', 'accepted', 'rejected']
    : ['all', 'draft', 'sent', 'accepted', 'rejected']

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{user?.role === 'client' ? 'My Quotes' : 'Quotes'}</h1>
          <p className="page-subtitle">
            {user?.role === 'client'
              ? `${quotes.length} quote${quotes.length !== 1 ? 's' : ''} from your designer`
              : `${quotes.length} quote${quotes.length !== 1 ? 's' : ''} total`}
          </p>
        </div>
        {user?.role === 'designer' && (
          <button type="button" onClick={() => setShowCreate(true)} className="btn-gold">
            <Plus size={16} /> New Quote
          </button>
        )}
      </div>

      {/* Client: pending response prompt */}
      {user?.role === 'client' && quotes.filter((q) => q.status === 'sent').length > 0 && (
        <div className="rounded-2xl bg-amber-50 border border-amber-200 px-5 py-3 flex items-center gap-2 text-sm text-amber-800">
          <span className="font-semibold">{quotes.filter((q) => q.status === 'sent').length} quote{quotes.filter((q) => q.status === 'sent').length > 1 ? 's' : ''} waiting for your response.</span>
          <span className="text-amber-600">Click a quote below to accept or reject it.</span>
        </div>
      )}

      {/* Status filter tabs */}
      <div className="flex gap-1 flex-wrap">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${
              filter === s
                ? 'bg-brand-900 text-white'
                : 'bg-surface-card text-brand-500 hover:bg-surface-border'
            }`}
          >
            {s === 'all' ? 'All' : statusLabel(s)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-brand-400 text-sm">Loading quotes…</div>
      ) : filtered.length === 0 ? (
        <div className="card-padded text-center py-12">
          <FileText size={32} className="text-brand-200 mx-auto mb-3" strokeWidth={1} />
          <p className="text-brand-400 text-sm">
            {filter !== 'all' ? `No ${statusLabel(filter).toLowerCase()} quotes.` : 'No quotes yet.'}
          </p>
          {user?.role === 'designer' && filter === 'all' && (
            <button type="button" onClick={() => setShowCreate(true)} className="btn-gold mt-4">
              <Plus size={16} /> Create first quote
            </button>
          )}
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-border bg-surface-card">
                <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase tracking-wide">Quote</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase tracking-wide hidden sm:table-cell">Project</th>
                <th className="text-right px-4 py-3 text-xs font-medium text-brand-400 uppercase tracking-wide">Amount</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase tracking-wide">Status</th>
                <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase tracking-wide hidden md:table-cell">Valid Until</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((q) => (
                <tr key={q.id} className="border-b border-surface-border last:border-0 hover:bg-surface-card transition-colors">
                  <td className="px-4 py-3">
                    <Link to={`/quotes/${q.id}`} className="font-medium text-brand-900 hover:text-gold-700 transition-colors">
                      {q.title}
                    </Link>
                    <p className="text-xs text-brand-400 sm:hidden mt-0.5">{q.project?.name}</p>
                  </td>
                  <td className="px-4 py-3 text-brand-500 hidden sm:table-cell">{q.project?.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="amount-gold">{formatINR(q.total_amount)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={statusBadgeClass(q.status)}>{statusLabel(q.status)}</span>
                  </td>
                  <td className="px-4 py-3 text-brand-400 text-xs hidden md:table-cell">
                    {formatDateIST(q.valid_until)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showCreate && (
        <CreateQuoteModal
          user={user}
          defaultProjectId={defaultProjectId}
          onClose={handleCreateClose}
        />
      )}
    </div>
  )
}
