import { STATUS_META } from './leadConstants'

export function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.new
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${m.cls}`}>
      {m.label}
    </span>
  )
}

export function Field({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-brand-600 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  )
}

export function LeadInput({ className = '', ...props }) {
  return (
    <input
      className={`w-full px-3 py-2.5 text-sm rounded-xl border border-surface-border bg-white text-brand-900
        focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all
        placeholder:text-brand-300 ${className}`}
      {...props}
    />
  )
}

export function LeadSelect({ children, ...props }) {
  return (
    <select
      className="w-full px-3 py-2.5 text-sm rounded-xl border border-surface-border bg-white text-brand-900
        focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all"
      {...props}
    >
      {children}
    </select>
  )
}
