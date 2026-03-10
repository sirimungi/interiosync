import { Link } from 'react-router-dom'
import { statusBadgeClass, statusLabel } from '../utils'

export default function ProjectCard({ project }) {
  const designerName = project.designer?.name || 'Designer'
  const clientName = project.client?.name || 'Client'

  return (
    <Link
      to={`/projects/${project.id}`}
      className="card p-5 flex flex-col gap-3 hover:shadow-card-hover transition-shadow group"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-semibold text-brand-900 group-hover:text-gold-700 transition-colors leading-snug">
          {project.name}
        </h2>
        <span className={`${statusBadgeClass(project.status)} shrink-0`}>{statusLabel(project.status)}</span>
      </div>
      <p className="text-sm text-brand-400 line-clamp-2 flex-1">
        {project.description || 'No description provided.'}
      </p>
      <div className="flex items-center justify-between text-xs text-brand-400 pt-1 border-t border-surface-border">
        <span>{designerName}</span>
        <span className="text-brand-300">→</span>
        <span>{clientName}</span>
      </div>
    </Link>
  )
}
