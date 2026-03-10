import { useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UploadCloud, FileIcon, Trash2 } from 'lucide-react'
import { fetchFiles, uploadFile, deleteFile } from '../api'
import { formatIST } from '../utils'
import { API_URL } from '../api'

export default function FileUploader({ projectId, canEdit }) {
  const qc = useQueryClient()
  const inputRef = useRef(null)

  const { data: files = [], isLoading } = useQuery({
    queryKey: ['files', projectId],
    queryFn: () => fetchFiles(projectId),
  })

  const uploadMutation = useMutation({
    mutationFn: (file) => uploadFile(projectId, file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', projectId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => deleteFile(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['files', projectId] }),
  })

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    uploadMutation.mutate(file)
    e.target.value = ''
  }

  if (isLoading) return <div className="text-brand-400 text-sm">Loading files…</div>

  return (
    <div className="space-y-4">
      {canEdit && (
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploadMutation.isPending}
            className="btn-outline"
          >
            <UploadCloud size={15} />
            {uploadMutation.isPending ? 'Uploading…' : 'Upload file'}
          </button>
          <input ref={inputRef} type="file" className="hidden" onChange={handleFile} />
          {uploadMutation.error && (
            <p className="text-red-600 text-sm mt-2">
              {uploadMutation.error.response?.data?.detail || 'Upload failed'}
            </p>
          )}
        </div>
      )}

      {files.length === 0 ? (
        <div className="card-padded text-center py-8 text-brand-400 text-sm">
          No files uploaded yet.
        </div>
      ) : (
        <ul className="space-y-2">
          {files.map((f) => (
            <li key={f.id} className="card p-3.5 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-card flex items-center justify-center shrink-0">
                <FileIcon size={15} className="text-brand-400" />
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={f.url.startsWith('http') ? f.url : `${API_URL}${f.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium text-brand-900 hover:text-gold-700 transition-colors truncate block"
                >
                  {f.filename}
                </a>
                <p className="text-xs text-brand-400">{formatIST(f.uploaded_at, 'DD/MM/YYYY')}</p>
              </div>
              {canEdit && (
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(f.id)}
                  disabled={deleteMutation.isPending}
                  className="text-brand-300 hover:text-red-500 transition-colors p-1 shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
