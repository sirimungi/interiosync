import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { submitInquiry } from '../api'
import { CheckCircle, ArrowRight, Sparkles } from 'lucide-react'

const schema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().optional(),
  style_pref: z.string().optional(),
  budget_range: z.string().optional(),
  message: z.string().optional(),
})

const STYLE_OPTIONS = [
  { value: '', label: 'Select a style' },
  { value: 'Modern', label: 'Modern' },
  { value: 'Traditional', label: 'Traditional' },
  { value: 'Contemporary', label: 'Contemporary' },
  { value: 'Minimalist', label: 'Minimalist' },
  { value: 'Eclectic', label: 'Eclectic' },
  { value: 'Other', label: 'Other / Not sure yet' },
]

const BUDGET_OPTIONS = [
  { value: '', label: 'Select a range' },
  { value: 'Under ₹5L', label: 'Under ₹5 Lakh' },
  { value: '₹5L–₹10L', label: '₹5L – ₹10L' },
  { value: '₹10L–₹25L', label: '₹10L – ₹25L' },
  { value: 'Above ₹25L', label: 'Above ₹25L' },
]

export default function Inquiry() {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data) => {
    setServerError('')
    try {
      await submitInquiry(data)
      setSubmitted(true)
    } catch {
      setServerError('Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex lg:w-5/12 bg-brand-900 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-16 -left-16 w-72 h-72 rounded-full bg-brand-800 opacity-50" />
        <div className="absolute bottom-24 -right-20 w-96 h-96 rounded-full bg-brand-800 opacity-30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 rounded-full border border-gold/20" />

        <div className="relative z-10">
          <span className="font-display text-3xl tracking-wide text-white">
            Interio<span className="text-gold">Sync</span>
          </span>
          <p className="text-brand-400 text-sm mt-1">Interior Design Platform</p>
        </div>

        <div className="relative z-10 space-y-6">
          <h1 className="font-display text-4xl text-white leading-tight">
            Turn your dream space<br />
            <span className="text-gold">into reality.</span>
          </h1>
          <p className="text-brand-300 text-base leading-relaxed max-w-sm">
            Share a few details about your vision. Our designer will review your inquiry
            and reach out to schedule a consultation — no commitment needed.
          </p>
          <div className="space-y-3 pt-2">
            {[
              'Free initial consultation',
              'Detailed quotation before any work begins',
              'Full project management from concept to completion',
            ].map((item) => (
              <div key={item} className="flex items-start gap-3">
                <Sparkles size={15} className="text-gold shrink-0 mt-0.5" />
                <span className="text-brand-200 text-sm">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <p className="text-brand-500 text-xs">© 2026 INTERIOSYNC</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 sm:px-10 lg:px-16 bg-surface overflow-y-auto">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8">
          <span className="font-display text-2xl text-brand-900">
            Interio<span className="text-gold">Sync</span>
          </span>
        </div>

        <div className="max-w-md w-full mx-auto">
          {submitted ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
                <CheckCircle size={32} className="text-green-600" />
              </div>
              <h2 className="font-display text-2xl text-brand-900">We'll be in touch soon!</h2>
              <p className="text-brand-500 text-sm leading-relaxed">
                Thank you for your inquiry. Our designer will review your details and contact
                you within 1–2 business days.
              </p>
              <div className="pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-sm text-gold hover:text-gold-700 font-medium transition-colors"
                >
                  Already have an account? Log in
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="font-display text-2xl text-brand-900">Start your project</h2>
                <p className="text-brand-400 text-sm mt-1">Tell us about your dream space.</p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Name & Email */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-600 mb-1.5">
                      Full Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register('name')}
                      placeholder="Priya Sharma"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-surface-border bg-white text-brand-900
                                 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all
                                 placeholder:text-brand-300"
                    />
                    {errors.name && (
                      <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-600 mb-1.5">
                      Email <span className="text-red-400">*</span>
                    </label>
                    <input
                      {...register('email')}
                      type="email"
                      placeholder="priya@example.com"
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-surface-border bg-white text-brand-900
                                 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all
                                 placeholder:text-brand-300"
                    />
                    {errors.email && (
                      <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                    )}
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-xs font-medium text-brand-600 mb-1.5">
                    Phone Number
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-surface-border bg-white text-brand-900
                               focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all
                               placeholder:text-brand-300"
                  />
                </div>

                {/* Style & Budget */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-brand-600 mb-1.5">
                      Design Style
                    </label>
                    <select
                      {...register('style_pref')}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-surface-border bg-white text-brand-900
                                 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                    >
                      {STYLE_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-brand-600 mb-1.5">
                      Estimated Budget
                    </label>
                    <select
                      {...register('budget_range')}
                      className="w-full px-3 py-2.5 text-sm rounded-xl border border-surface-border bg-white text-brand-900
                                 focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
                    >
                      {BUDGET_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-xs font-medium text-brand-600 mb-1.5">
                    Tell us about your space
                  </label>
                  <textarea
                    {...register('message')}
                    rows={4}
                    placeholder="Describe the space you want to transform — rooms, size, what you'd love to change…"
                    className="w-full px-3 py-2.5 text-sm rounded-xl border border-surface-border bg-white text-brand-900
                               focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all
                               placeholder:text-brand-300 resize-none"
                  />
                </div>

                {serverError && (
                  <p className="text-red-500 text-sm bg-red-50 rounded-xl px-3 py-2">{serverError}</p>
                )}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 bg-brand-900 hover:bg-brand-800
                             text-white font-medium text-sm py-3 rounded-xl transition-colors
                             disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Submitting…' : 'Send Inquiry'}
                  {!isSubmitting && <ArrowRight size={16} />}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-brand-400">
                Already have an account?{' '}
                <Link to="/login" className="text-gold hover:text-gold-700 font-medium transition-colors">
                  Log in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
