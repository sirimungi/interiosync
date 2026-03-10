import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, UserPlus } from 'lucide-react'
import { fetchLeads, addManualLead, updateLead } from '../api'
import { STATUS_META, FILTER_TABS } from '../components/leads/leadConstants'
import { StatusBadge } from '../components/leads/leadConstantsUI'
import AddLeadModal from '../components/leads/AddLeadModal'
import LeadDetailPanel from '../components/leads/LeadDetailPanel'
import ConvertModal from '../components/leads/ConvertModal'

export default function Leads({ user }) {
  const qc = useQueryClient()
  const [activeFilter, setActiveFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedLead, setSelectedLead] = useState(null)
  const [convertingLead, setConvertingLead] = useState(null)

  if (user?.role !== 'designer') {
    return (
      <div className="flex flex-col items-center justify-center h-full py-24 text-center">
        <div className="w-14 h-14 rounded-full bg-surface-card flex items-center justify-center mb-4">
          <UserPlus size={24} className="text-brand-400" />
        </div>
        <h2 className="font-display text-xl text-brand-900 mb-2">Access restricted</h2>
        <p className="text-brand-400 text-sm">Only designers can view the Leads pipeline.</p>
      </div>
    )
  }

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['leads', activeFilter],
    queryFn: () => fetchLeads(activeFilter ? { status: activeFilter } : {}),
  })

  const { data: allLeads = [] } = useQuery({
    queryKey: ['leads'],
    queryFn: () => fetchLeads({}),
  })

  const counts = Object.fromEntries(
    ['new', 'contacted', 'converted', 'closed'].map((s) => [s, allLeads.filter((l) => l.status === s).length])
  )

  const addMutation = useMutation({
    mutationFn: addManualLead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['leads'] }),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updateLead(id, data),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['leads'] })
      if (selectedLead?.id === updated.id) setSelectedLead(updated)
    },
  })

  const filtered = leads.filter((l) => {
    if (!search) return true
    const q = search.toLowerCase()
    return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q) || (l.phone || '').includes(q)
  })

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl text-brand-900">Leads</h1>
          <p className="text-brand-400 text-sm mt-0.5">
            Manage inquiries and convert prospects into projects.{' '}
            <a href="/inquiry" target="_blank" rel="noreferrer"
              className="text-gold hover:text-gold-700 underline underline-offset-2 transition-colors">
              Public inquiry form ↗
            </a>
          </p>
        </div>
        <button type="button" onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 bg-brand-900 hover:bg-brand-800 text-white text-sm font-medium px-4 py-2.5 rounded-xl transition-colors">
          <Plus size={16} /> Add Lead
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(counts).map(([status, count]) => (
          <button key={status} type="button"
            onClick={() => setActiveFilter(activeFilter === status ? '' : status)}
            className={`text-left bg-white rounded-2xl border p-4 transition-all hover:shadow-card-hover ${
              activeFilter === status ? 'border-gold shadow-gold-glow' : 'border-surface-border shadow-card'
            }`}>
            <p className="text-2xl font-bold text-brand-900">{count}</p>
            <p className="text-xs text-brand-400 mt-0.5 capitalize">{STATUS_META[status]?.label}</p>
          </button>
        ))}
      </div>

      {/* Filter + Search */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-1 bg-surface-card rounded-xl p-1">
          {FILTER_TABS.map((tab) => (
            <button key={tab.key} type="button" onClick={() => setActiveFilter(tab.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                activeFilter === tab.key ? 'bg-white text-brand-900 shadow-card' : 'text-brand-400 hover:text-brand-700'
              }`}>
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative max-w-xs flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, phone…"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-surface-border bg-white
              focus:outline-none focus:ring-2 focus:ring-gold/40 focus:border-gold transition-all" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-surface-border shadow-card overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-brand-400 text-sm">Loading leads…</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center">
            <UserPlus size={28} className="text-brand-300 mx-auto mb-3" />
            <p className="text-brand-500 text-sm font-medium">No leads found</p>
            <p className="text-brand-300 text-xs mt-1">
              Add a lead manually or share the{' '}
              <a href="/inquiry" target="_blank" rel="noreferrer" className="text-gold underline underline-offset-2">
                public inquiry form
              </a>.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-surface-card border-b border-surface-border">
                <tr>
                  {['Name', 'Contact', 'Style / Budget', 'Source', 'Added', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-brand-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-border">
                {filtered.map((lead) => (
                  <tr key={lead.id} onClick={() => setSelectedLead(lead)}
                    className="hover:bg-surface-card/50 cursor-pointer transition-colors group">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center shrink-0 text-xs font-bold text-brand-600">
                          {lead.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-medium text-brand-900">{lead.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-brand-700">{lead.email}</p>
                      {lead.phone && <p className="text-brand-400 text-xs mt-0.5">{lead.phone}</p>}
                    </td>
                    <td className="px-4 py-3">
                      {lead.style_pref   && <p className="text-brand-700">{lead.style_pref}</p>}
                      {lead.budget_range && <p className="text-brand-400 text-xs mt-0.5">{lead.budget_range}</p>}
                      {!lead.style_pref && !lead.budget_range && <span className="text-brand-300 text-xs italic">Not specified</span>}
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-500 capitalize">
                      {(lead.source || '').replace('_', ' ')}
                    </td>
                    <td className="px-4 py-3 text-xs text-brand-400 whitespace-nowrap">
                      {lead.created_at
                        ? new Date(lead.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={lead.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {(lead.status === 'new' || lead.status === 'contacted') && (
                          <button type="button"
                            onClick={(e) => { e.stopPropagation(); setConvertingLead(lead) }}
                            className="flex items-center gap-1 text-xs font-medium text-gold hover:text-gold-700 transition-colors">
                            <UserPlus size={13} /> Convert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showAddModal && (
        <AddLeadModal onClose={() => setShowAddModal(false)} onSuccess={addMutation.mutateAsync} />
      )}
      {selectedLead && !convertingLead && (
        <LeadDetailPanel
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateStatus={(id, data) => updateMutation.mutate({ id, data })}
          onConvert={(lead) => { setConvertingLead(lead); setSelectedLead(null) }}
        />
      )}
      {convertingLead && (
        <ConvertModal
          lead={convertingLead}
          onClose={() => setConvertingLead(null)}
          onConverted={() => {
            qc.invalidateQueries({ queryKey: ['leads'] })
            qc.invalidateQueries({ queryKey: ['projects'] })
          }}
        />
      )}
    </div>
  )
}
