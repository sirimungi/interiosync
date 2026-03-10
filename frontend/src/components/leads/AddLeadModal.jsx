import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { X } from 'lucide-react'
import { addLeadSchema, Field, LeadInput, LeadSelect, STYLE_OPTIONS, BUDGET_OPTIONS } from './leadConstants'

export default function AddLeadModal({ onClose, onSuccess }) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } =
    useForm({ resolver: zodResolver(addLeadSchema) })

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const onSubmit = async (data) => { await onSuccess(data); onClose() }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-surface-border">
          <h3 className="font-display text-lg text-brand-900">Add New Lead</h3>
          <button type="button" onClick={onClose} className="text-brand-400 hover:text-brand-700 p-1 rounded-lg">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Full Name *" error={errors.name?.message}>
              <LeadInput {...register('name')} placeholder="Amit Joshi" />
            </Field>
            <Field label="Email *" error={errors.email?.message}>
              <LeadInput {...register('email')} type="email" placeholder="amit@example.com" />
            </Field>
          </div>

          <Field label="Phone">
            <LeadInput {...register('phone')} type="tel" placeholder="+91 98765 43210" />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Design Style">
              <LeadSelect {...register('style_pref')}>
                {STYLE_OPTIONS.map((o) => <option key={o} value={o}>{o || 'Select style'}</option>)}
              </LeadSelect>
            </Field>
            <Field label="Budget Range">
              <LeadSelect {...register('budget_range')}>
                {BUDGET_OPTIONS.map((o) => <option key={o} value={o}>{o || 'Select budget'}</option>)}
              </LeadSelect>
            </Field>
          </div>

          <Field label="Message / Notes">
            <textarea
              {...register('message')}
              rows={3}
              placeholder="Brief about the project…"
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-surface-border bg-white text-brand-900
                focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all
                placeholder:text-brand-300 resize-none"
            />
          </Field>

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="px-4 py-2 text-sm text-brand-600 hover:text-brand-900 rounded-xl border border-surface-border hover:bg-surface-card transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}
              className="px-5 py-2 text-sm font-medium bg-brand-900 hover:bg-brand-800 text-white rounded-xl transition-colors disabled:opacity-60">
              {isSubmitting ? 'Adding…' : 'Add Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
