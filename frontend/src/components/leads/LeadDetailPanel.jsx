import { useState, useEffect } from 'react'
import { X, Mail, Phone, Palette, Wallet, MessageSquare, UserPlus, CheckCircle } from 'lucide-react'
import { StatusBadge, STATUS_META, STATUS_OPTIONS } from './leadConstants.jsx'

export default function LeadDetailPanel({ lead, onClose, onUpdateStatus, onConvert }) {
  const [editingNotes, setEditingNotes] = useState(false)
  const [notes, setNotes] = useState(lead.notes || '')

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  const handleSaveNotes = () => { onUpdateStatus(lead.id, { notes }); setEditingNotes(false) }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={onClose}>
      <div className="w-full max-w-md bg-white h-full shadow-2xl overflow-y-auto flex flex-col"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-surface-border">
          <div><h3 className="font-display text-xl text-brand-900">{lead.name}</h3>
            <StatusBadge status={lead.status} /></div>
          <button type="button" onClick={onClose}
            className="text-brand-400 hover:text-brand-700 p-1 rounded-lg mt-0.5"><X size={18} /></button>
        </div>

        {/* Contact */}
        <div className="p-6 space-y-3 border-b border-surface-border">
          <Row icon={<Mail size={15} />}>
            <a href={`mailto:${lead.email}`} className="hover:text-gold transition-colors">{lead.email}</a>
          </Row>
          {lead.phone      && <Row icon={<Phone size={15} />}>{lead.phone}</Row>}
          {lead.style_pref && <Row icon={<Palette size={15} />}>{lead.style_pref}</Row>}
          {lead.budget_range && <Row icon={<Wallet size={15} />}>{lead.budget_range}</Row>}
          {lead.source && (
            <div className="flex items-center gap-3 text-xs">
              <span className="text-brand-400 uppercase tracking-wide">Source</span>
              <span className="text-brand-600 capitalize">{lead.source.replace('_', ' ')}</span>
            </div>
          )}
        </div>

        {/* Message */}
        {lead.message && (
          <div className="p-6 border-b border-surface-border">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare size={14} className="text-brand-400" />
              <span className="text-xs font-medium text-brand-500 uppercase tracking-wide">Their message</span>
            </div>
            <p className="text-sm text-brand-700 leading-relaxed bg-surface-card rounded-xl p-3">{lead.message}</p>
          </div>
        )}

        {/* Status */}
        <div className="p-6 border-b border-surface-border space-y-3">
          <p className="text-xs font-medium text-brand-500 uppercase tracking-wide">Update Status</p>
          <div className="flex flex-wrap gap-2">
            {STATUS_OPTIONS.filter((s) => s !== 'converted').map((s) => (
              <button key={s} type="button" onClick={() => onUpdateStatus(lead.id, { status: s })}
                className={`px-3 py-1.5 text-xs font-medium rounded-full border transition-colors ${
                  lead.status === s ? STATUS_META[s].cls : 'border-surface-border text-brand-500 hover:bg-surface-card'
                }`}>
                {STATUS_META[s]?.label}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="p-6 border-b border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-brand-500 uppercase tracking-wide">Designer Notes</p>
            {!editingNotes && (
              <button type="button" onClick={() => setEditingNotes(true)}
                className="text-xs text-gold hover:text-gold-700 transition-colors">Edit</button>
            )}
          </div>
          {editingNotes ? (
            <>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3}
                className="w-full px-3 py-2 text-sm rounded-xl border border-surface-border bg-white text-brand-900
                  focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all resize-none" />
              <div className="flex gap-2">
                <button type="button" onClick={handleSaveNotes}
                  className="px-3 py-1.5 text-xs font-medium bg-brand-900 text-white rounded-lg hover:bg-brand-800 transition-colors">Save</button>
                <button type="button" onClick={() => { setEditingNotes(false); setNotes(lead.notes || '') }}
                  className="px-3 py-1.5 text-xs text-brand-500 hover:text-brand-900 rounded-lg border border-surface-border transition-colors">Cancel</button>
              </div>
            </>
          ) : (
            <p className="text-sm text-brand-600 bg-surface-card rounded-xl p-3 min-h-[48px]">
              {notes || <span className="text-brand-300 italic">No notes yet</span>}
            </p>
          )}
        </div>

        {/* CTA */}
        {(lead.status === 'new' || lead.status === 'contacted') && (
          <div className="p-6">
            <button type="button" onClick={() => onConvert(lead)}
              className="w-full flex items-center justify-center gap-2 bg-gold hover:bg-gold-700 text-brand-900
                font-semibold text-sm py-3 rounded-xl transition-colors">
              <UserPlus size={16} /> Convert to Client + Project
            </button>
            <p className="text-xs text-brand-400 text-center mt-2">
              Creates a client account and a project. Login credentials will be sent by email.
            </p>
          </div>
        )}
        {lead.status === 'converted' && lead.converted_project_id && (
          <div className="p-6">
            <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-800">Already converted</p>
                <p className="text-xs text-green-600 mt-0.5">Client account and project created.</p>
              </div>
              <CheckCircle size={20} className="text-green-600 shrink-0" />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Row({ icon, children }) {
  return (
    <div className="flex items-center gap-3 text-sm text-brand-700">
      <span className="text-brand-400 shrink-0">{icon}</span>
      {children}
    </div>
  )
}
