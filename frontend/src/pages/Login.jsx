import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { login } from '../api'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

export default function Login({ onLogin }) {
  const [serverError, setServerError] = useState('')
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async ({ email, password }) => {
    setServerError('')
    try {
      const data = await login(email, password)
      onLogin(data)
    } catch (err) {
      setServerError(err.response?.data?.detail || 'Login failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex bg-surface">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-brand-900 p-12">
        <div>
          <span className="font-display text-3xl text-white">
            Interio<span className="text-gold">Sync</span>
          </span>
        </div>
        <div>
          <blockquote className="font-display text-2xl text-white/80 leading-relaxed">
            "Elegant spaces, seamlessly managed."
          </blockquote>
          <p className="text-brand-400 text-sm mt-4">Interior design project management for India</p>
        </div>
        <div className="flex gap-2">
          <div className="w-8 h-1 rounded bg-gold" />
          <div className="w-2 h-1 rounded bg-brand-700" />
          <div className="w-2 h-1 rounded bg-brand-700" />
        </div>
      </div>

      {/* Right login form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <span className="font-display text-2xl text-brand-900">
              Interio<span className="text-gold">Sync</span>
            </span>
          </div>

          <h1 className="font-display text-2xl text-brand-900 mb-1">Welcome back</h1>
          <p className="text-brand-400 text-sm mb-8">Sign in to your workspace</p>

          {serverError && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-red-700 text-sm">
              {serverError}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="field-label">Email address</label>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className="field-input"
                {...register('email')}
              />
              {errors.email && <p className="field-error">{errors.email.message}</p>}
            </div>

            <div>
              <label className="field-label">Password</label>
              <input
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className="field-input"
                {...register('password')}
              />
              {errors.password && <p className="field-error">{errors.password.message}</p>}
            </div>

            <button type="submit" disabled={isSubmitting} className="btn-primary w-full btn-lg mt-2">
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <div className="mt-8 p-4 rounded-xl bg-surface-card border border-surface-border">
            <p className="text-xs text-brand-500 font-medium mb-2">Demo credentials</p>
            <div className="space-y-1 text-xs text-brand-600">
              <p><span className="font-medium text-brand-800">Designer:</span> designer@example.com / designer123</p>
              <p><span className="font-medium text-brand-800">Client:</span> client@example.com / client123</p>
              <p><span className="font-medium text-brand-800">Employee:</span> employee@example.com / employee123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
