import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { Plus, X, CalendarDays, Clock, MapPin } from 'lucide-react'
import { fetchAppointments, createAppointment, updateAppointment, fetchProjects, getUsersByRole } from '../api'
import { formatIST, statusBadgeClass, statusLabel, aptTypeLabel } from '../utils'

const TYPES = ['quotation_meeting', 'site_visit', 'follow_up', 'other']

const schema = z.object({
  type: z.string().min(1),
  scheduled_at: z.string().min(1, 'Date & time required'),
  duration_minutes: z.coerce.number().min(15, 'At least 15 min').max(480),
  project_id: z.string().optional(),
  assigned_to: z.string().min(1, 'Select assignee'),
  notes: z.string().optional(),
})

function CreateAppointmentModal({ user, onClose }) {
  const qc = useQueryClient()
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const { data: projects = [] } = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  const { data: users = [] } = useQuery({
    queryKey: ['users', 'all'],
    queryFn: async () => {
      const [clients, employees] = await Promise.all([
        getUsersByRole('client'),
        getUsersByRole('employee'),
      ])
      return [...clients, ...employees]
    },
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { type: 'quotation_meeting', duration_minutes: 60 },
  })

  const mutation = useMutation({
    mutationFn: (data) =>
      createAppointment({
        type: data.type,
        scheduled_at: new Date(data.scheduled_at).toISOString(),
        duration_minutes: data.duration_minutes,
        project_id: data.project_id ? parseInt(data.project_id, 10) : undefined,
        assigned_to: parseInt(data.assigned_to, 10),
        notes: data.notes || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['appointments'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg text-brand-900">Schedule Appointment</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-1">
            <X size={16} />
          </button>
        </div>

        {mutation.error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            {mutation.error.response?.data?.detail || 'Failed to schedule appointment'}
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="field-label">Type</label>
            <select className="field-input" {...register('type')}>
              {TYPES.map((t) => (
                <option key={t} value={t}>{aptTypeLabel(t)}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="field-label">Date & Time (IST)</label>
              <input type="datetime-local" className="field-input" {...register('scheduled_at')} />
              {errors.scheduled_at && <p className="field-error">{errors.scheduled_at.message}</p>}
            </div>
            <div>
              <label className="field-label">Duration (mins)</label>
              <input type="number" className="field-input" {...register('duration_minutes')} />
              {errors.duration_minutes && <p className="field-error">{errors.duration_minutes.message}</p>}
            </div>
          </div>

          <div>
            <label className="field-label">Assign to</label>
            <select className="field-input" {...register('assigned_to')}>
              <option value="">Select person</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
              ))}
            </select>
            {errors.assigned_to && <p className="field-error">{errors.assigned_to.message}</p>}
          </div>

          <div>
            <label className="field-label">Project <span className="text-brand-400">(optional)</span></label>
            <select className="field-input" {...register('project_id')}>
              <option value="">No project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="field-label">Notes <span className="text-brand-400">(optional)</span></label>
            <textarea className="field-input resize-none" rows={2} placeholder="Location, preparation notes…" {...register('notes')} />
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-gold flex-1">
              {isSubmitting || mutation.isPending ? 'Scheduling…' : 'Schedule'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function AppointmentCard({ appt, user, onStatusChange }) {
  const isPast = new Date(appt.scheduled_at) < new Date()
  const isDesigner = user?.role === 'designer'
  const canUpdate = isDesigner && appt.created_by === user.id && appt.status === 'scheduled'

  return (
    <div className={`card p-5 ${isPast && appt.status === 'scheduled' ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0 mt-0.5">
            <CalendarDays size={18} className="text-blue-600" strokeWidth={1.8} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-brand-900 text-sm">{aptTypeLabel(appt.type)}</p>
              <span className={statusBadgeClass(appt.status)}>{statusLabel(appt.status)}</span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-brand-500">
              <span className="flex items-center gap-1">
                <Clock size={12} /> {formatIST(appt.scheduled_at)} · {appt.duration_minutes} min
              </span>
              {appt.project && (
                <Link to={`/projects/${appt.project.id}`} className="flex items-center gap-1 hover:text-gold-700 transition-colors">
                  <MapPin size={12} /> {appt.project.name}
                </Link>
              )}
            </div>
            <div className="mt-1.5 text-xs text-brand-400">
              With: <span className="text-brand-700 font-medium">{appt.assignee?.name}</span>
              {appt.notes && <span className="ml-2 italic">· {appt.notes}</span>}
            </div>
          </div>
        </div>

        {canUpdate && (
          <div className="flex gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onStatusChange(appt.id, 'completed')}
              className="btn-outline btn-sm text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            >
              Done
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(appt.id, 'cancelled')}
              className="btn-outline btn-sm text-red-500 border-red-200 hover:bg-red-50"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function Appointments({ user }) {
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter] = useState('upcoming')
  const qc = useQueryClient()

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments'],
    queryFn: () => fetchAppointments({}),
  })

  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => updateAppointment(id, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['appointments'] }),
  })

  const now = new Date()
  const upcoming = appointments.filter((a) => a.status === 'scheduled' && new Date(a.scheduled_at) >= now)
  const past = appointments.filter((a) => a.status !== 'scheduled' || new Date(a.scheduled_at) < now)

  const displayed = filter === 'upcoming' ? upcoming : filter === 'past' ? past : appointments

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">Appointments</h1>
          <p className="page-subtitle">{upcoming.length} upcoming</p>
        </div>
        {user?.role === 'designer' && (
          <button type="button" onClick={() => setShowCreate(true)} className="btn-gold">
            <Plus size={16} /> Schedule
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="flex gap-1">
        {[
          { key: 'upcoming', label: `Upcoming (${upcoming.length})` },
          { key: 'past', label: 'Past' },
          { key: 'all', label: 'All' },
        ].map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              filter === key ? 'bg-brand-900 text-white' : 'bg-surface-card text-brand-500 hover:bg-surface-border'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-brand-400 text-sm">Loading appointments…</div>
      ) : displayed.length === 0 ? (
        <div className="card-padded text-center py-12">
          <CalendarDays size={32} className="text-brand-200 mx-auto mb-3" strokeWidth={1} />
          <p className="text-brand-400 text-sm">
            {filter === 'upcoming' ? 'No upcoming appointments.' : 'No appointments found.'}
          </p>
          {user?.role === 'designer' && (
            <button type="button" onClick={() => setShowCreate(true)} className="btn-gold mt-4">
              <Plus size={16} /> Schedule one
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayed.map((a) => (
            <AppointmentCard
              key={a.id}
              appt={a}
              user={user}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            />
          ))}
        </div>
      )}

      {showCreate && <CreateAppointmentModal user={user} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
