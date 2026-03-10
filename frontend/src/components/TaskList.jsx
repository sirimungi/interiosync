import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import { fetchTasks, createTask, updateTask, deleteTask } from '../api'
import { statusBadgeClass, statusLabel } from '../utils'

const taskSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
})

const STATUS_OPTIONS = [
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
]

export default function TaskList({ projectId, canEdit }) {
  const qc = useQueryClient()
  const [showAdd, setShowAdd] = useState(false)

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ['tasks', projectId],
    queryFn: () => fetchTasks(projectId),
  })

  const addMutation = useMutation({
    mutationFn: (data) => createTask({ ...data, project_id: projectId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks', projectId] })
      setShowAdd(false)
      reset()
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateTask(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteTask(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tasks', projectId] }),
  })

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(taskSchema),
  })

  if (isLoading) return <div className="text-brand-400 text-sm">Loading tasks…</div>

  return (
    <div className="space-y-3">
      {/* Task rows */}
      {tasks.length === 0 && !showAdd ? (
        <div className="card-padded text-center py-8 text-brand-400 text-sm">
          No tasks yet.{canEdit && (
            <button type="button" onClick={() => setShowAdd(true)} className="text-gold-700 ml-1 hover:underline">
              Add one →
            </button>
          )}
        </div>
      ) : (
        <ul className="space-y-2">
          {tasks.map((t) => (
            <li key={t.id} className="card p-3.5 flex items-center gap-3">
              {/* Status dot */}
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                t.status === 'done' ? 'bg-emerald-500' :
                t.status === 'in_progress' ? 'bg-amber-500' :
                'bg-brand-300'
              }`} />

              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${t.status === 'done' ? 'line-through text-brand-400' : 'text-brand-900'}`}>
                  {t.title}
                </p>
                {t.description && <p className="text-xs text-brand-400 truncate">{t.description}</p>}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {canEdit ? (
                  <select
                    value={t.status}
                    onChange={(e) => updateMutation.mutate({ id: t.id, data: { status: e.target.value } })}
                    className="text-xs rounded-lg border border-surface-border bg-white px-2 py-1 text-brand-700 focus:outline-none focus:ring-1 focus:ring-gold"
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : (
                  <span className={statusBadgeClass(t.status)}>{statusLabel(t.status)}</span>
                )}
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => deleteMutation.mutate(t.id)}
                    className="text-brand-300 hover:text-red-500 transition-colors p-1"
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add task form */}
      {canEdit && showAdd && (
        <form
          onSubmit={handleSubmit((d) => addMutation.mutate(d))}
          className="card p-4 space-y-3"
        >
          <div>
            <label className="field-label">Task title</label>
            <input className="field-input" placeholder="e.g. Install ceiling lights" {...register('title')} />
            {errors.title && <p className="field-error">{errors.title.message}</p>}
          </div>
          <div>
            <label className="field-label">Description <span className="text-brand-400">(optional)</span></label>
            <input className="field-input" placeholder="Brief details…" {...register('description')} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={isSubmitting || addMutation.isPending} className="btn-gold btn-sm">
              {isSubmitting || addMutation.isPending ? 'Adding…' : 'Add task'}
            </button>
            <button type="button" onClick={() => { setShowAdd(false); reset() }} className="btn-outline btn-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Add button */}
      {canEdit && !showAdd && tasks.length > 0 && (
        <button type="button" onClick={() => setShowAdd(true)} className="btn-outline btn-sm">
          <Plus size={13} /> Add task
        </button>
      )}
    </div>
  )
}
