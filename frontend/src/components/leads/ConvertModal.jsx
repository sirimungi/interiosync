import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { X, CheckCircle, Copy, ArrowRight, AlertCircle, UserPlus } from 'lucide-react'
import { convertLead } from '../../api'
import { convertSchema } from './leadConstants'
import { Field, LeadInput } from './leadConstantsUI'

export default function ConvertModal({ lead, onClose, onConverted }) {
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  const { register, handleSubmit, formState: { isSubmitting } } = useForm({
    resolver: zodResolver(convertSchema),
    defaultValues: { project_name: `${lead.name}'s Project` },
  })

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const onSubmit = async (data) => {
    try {
      const res = await convertLead(lead.id, data)
      setResult(res)
      onConverted()
    } catch (err) {
      alert(err?.response?.data?.detail || 'Conversion failed')
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(result.temp_password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h3 className="font-display text-lg text-brand-900">
            {result ? 'Conversion complete!' : 'Convert Lead to Client'}
          </h3>
          <button type="button" onClick={onClose} className="text-brand-400 hover:text-brand-700 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {result ? (
          <div className="p-6 space-y-5">
            <div className="flex items-start gap-3 bg-green-50 border border-green-100 rounded-xl p-4">
              <CheckCircle size={20} className="text-green-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-800">Account created successfully</p>
                <p className="text-xs text-green-600 mt-1">
                  {result.email_sent
                    ? 'Login credentials have been emailed to the client.'
                    : 'Email not configured — share the temporary password below.'}
                </p>
              </div>
            </div>

            {!result.email_sent && result.temp_password && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-brand-500 uppercase tracking-wide">Temporary password</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-surface-card border border-surface-border rounded-xl px-4 py-2.5 text-sm font-mono text-brand-900 select-all">
                    {result.temp_password}
                  </code>
                  <button type="button" onClick={handleCopy} title="Copy password"
                    className="p-2.5 rounded-xl border border-surface-border hover:bg-surface-card transition-colors text-brand-600">
                    {copied ? <CheckCircle size={16} className="text-green-600" /> : <Copy size={16} />}
                  </button>
                </div>
                <p className="text-xs text-brand-400">Share via WhatsApp or SMS. Ask client to change it on first login.</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => navigate(`/projects/${result.project_id}`)}
                className="flex-1 flex items-center justify-center gap-2 bg-brand-900 hover:bg-brand-800
                  text-white text-sm font-medium py-2.5 rounded-xl transition-colors">
                Go to Project <ArrowRight size={14} />
              </button>
              <button type="button" onClick={onClose}
                className="px-4 py-2.5 text-sm text-brand-600 hover:text-brand-900 rounded-xl
                  border border-surface-border hover:bg-surface-card transition-colors">
                Close
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-5">
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">
                Creates a <strong>client account</strong> for <strong>{lead.name}</strong> ({lead.email}) and a new project.
                Credentials are emailed if SMTP is configured, otherwise shown here.
              </p>
            </div>

            <Field label="Project Name">
              <LeadInput {...register('project_name')} placeholder={`${lead.name}'s Project`} />
            </Field>

            <div className="flex justify-end gap-3">
              <button type="button" onClick={onClose}
                className="px-4 py-2 text-sm text-brand-600 hover:text-brand-900 rounded-xl border border-surface-border hover:bg-surface-card transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={isSubmitting}
                className="px-5 py-2 text-sm font-semibold bg-gold hover:bg-gold-700 text-brand-900 rounded-xl transition-colors disabled:opacity-60 flex items-center gap-2">
                {isSubmitting ? 'Converting…' : <><UserPlus size={15} /> Convert</>}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
