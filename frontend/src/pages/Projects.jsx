import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, X, Search } from 'lucide-react'
import { fetchProjects, createProject, getUsersByRole } from '../api'
import ProjectCard from '../components/ProjectCard'

const schema = z.object({
  name: z.string().min(1, 'Project name is required'),
  description: z.string().optional(),
  client_id: z.string().min(1, 'Select a client'),
})

function CreateProjectModal({ user, onClose }) {
  const qc = useQueryClient()
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])
  const { data: clients = [] } = useQuery({
    queryKey: ['users', 'client'],
    queryFn: () => getUsersByRole('client'),
  })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const mutation = useMutation({
    mutationFn: (data) =>
      createProject({
        name: data.name,
        description: data.description || undefined,
        designer_id: user.id,
        client_id: parseInt(data.client_id, 10),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['projects'] })
      onClose()
    },
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-display text-lg text-brand-900">New Project</h2>
          <button type="button" onClick={onClose} className="btn-ghost btn-sm p-1">
            <X size={16} />
          </button>
        </div>

        {mutation.error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-700 text-sm">
            {mutation.error.response?.data?.detail || 'Failed to create project'}
          </div>
        )}

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="field-label">Project name</label>
            <input className="field-input" placeholder="e.g. Living Room Redesign" {...register('name')} />
            {errors.name && <p className="field-error">{errors.name.message}</p>}
          </div>

          <div>
            <label className="field-label">Description <span className="text-brand-400">(optional)</span></label>
            <textarea
              className="field-input resize-none"
              rows={2}
              placeholder="Brief about the project…"
              {...register('description')}
            />
          </div>

          <div>
            <label className="field-label">Client</label>
            <select className="field-input" {...register('client_id')}>
              <option value="">Select client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} — {c.email}
                </option>
              ))}
            </select>
            {errors.client_id && <p className="field-error">{errors.client_id.message}</p>}
          </div>

          <div className="flex gap-2 pt-1">
            <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-gold flex-1">
              {isSubmitting || mutation.isPending ? 'Creating…' : 'Create project'}
            </button>
            <button type="button" onClick={onClose} className="btn-outline">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function Projects({ user }) {
  const [showCreate, setShowCreate] = useState(false)
  const [search, setSearch] = useState('')

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: fetchProjects,
  })

  const filtered = projects.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="page-title">{user?.role === 'client' ? 'My Projects' : 'Projects'}</h1>
          <p className="page-subtitle">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        {user?.role === 'designer' && (
          <button type="button" onClick={() => setShowCreate(true)} className="btn-gold">
            <Plus size={16} /> New Project
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-xs">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
        <input
          className="field-input pl-9"
          placeholder="Search projects…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="text-brand-400 text-sm">Loading projects…</div>
      ) : filtered.length === 0 ? (
        <div className="card-padded text-center py-12">
          <p className="text-brand-400 text-sm">
            {search ? 'No projects match your search.' : 'No projects yet.'}
          </p>
          {user?.role === 'designer' && !search && (
            <button
              type="button"
              onClick={() => setShowCreate(true)}
              className="btn-gold mt-4"
            >
              <Plus size={16} /> Create first project
            </button>
          )}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}

      {showCreate && <CreateProjectModal user={user} onClose={() => setShowCreate(false)} />}
    </div>
  )
}
