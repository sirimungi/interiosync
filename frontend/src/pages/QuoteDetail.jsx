import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowLeft, Plus, Trash2, Send, CheckCircle, XCircle, Pencil, X } from 'lucide-react'
import {
  fetchQuote,
  addQuoteItem,
  updateQuoteItem,
  deleteQuoteItem,
  sendQuote,
  respondToQuote,
  updateQuote,
} from '../api'
import { formatINR, formatDateIST, statusBadgeClass, statusLabel } from '../utils'

const CATEGORIES = ['material', 'labour', 'furniture', 'electricals', 'plumbing', 'other']

const itemSchema = z.object({
  description: z.string().min(1, 'Required'),
  category: z.string().min(1),
  quantity: z.coerce.number().min(0.01, 'Must be > 0'),
  unit: z.string().min(1),
  unit_price: z.coerce.number().min(0, 'Must be ≥ 0'),
  dimensions: z.string().optional(),
})

const respondSchema = z.object({
  client_response: z.string().optional(),
})

function AddItemForm({ quoteId, onDone }) {
  const qc = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(itemSchema), defaultValues: { category: 'material', quantity: 1, unit: 'pcs', unit_price: 0 } })

  const mutation = useMutation({
    mutationFn: (data) => addQuoteItem(quoteId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quote', String(quoteId)] })
      reset()
      onDone?.()
    },
  })

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="card p-4 space-y-3">
      <h3 className="text-sm font-semibold text-brand-800">Add line item</h3>

      <div className="grid sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="field-label">Description</label>
          <input className="field-input" placeholder="e.g. Italian marble flooring" {...register('description')} />
          {errors.description && <p className="field-error">{errors.description.message}</p>}
        </div>
        <div>
          <label className="field-label">Category</label>
          <select className="field-input" {...register('category')}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="field-label">Dimensions <span className="text-brand-400">(opt.)</span></label>
          <input className="field-input" placeholder="e.g. 10ft × 12ft" {...register('dimensions')} />
        </div>
        <div>
          <label className="field-label">Quantity</label>
          <input type="number" step="0.01" className="field-input" {...register('quantity')} />
          {errors.quantity && <p className="field-error">{errors.quantity.message}</p>}
        </div>
        <div>
          <label className="field-label">Unit</label>
          <input className="field-input" placeholder="pcs / sqft / hrs" {...register('unit')} />
        </div>
        <div className="sm:col-span-2">
          <label className="field-label">Unit price (₹)</label>
          <input type="number" step="0.01" className="field-input" placeholder="0.00" {...register('unit_price')} />
          {errors.unit_price && <p className="field-error">{errors.unit_price.message}</p>}
        </div>
      </div>

      {mutation.error && (
        <p className="text-red-600 text-sm">{mutation.error.response?.data?.detail || 'Failed to add item'}</p>
      )}

      <div className="flex gap-2">
        <button type="submit" disabled={isSubmitting || mutation.isPending} className="btn-gold btn-sm">
          <Plus size={13} /> {isSubmitting || mutation.isPending ? 'Adding…' : 'Add item'}
        </button>
        <button type="button" onClick={onDone} className="btn-outline btn-sm">Cancel</button>
      </div>
    </form>
  )
}

function RespondForm({ quoteId, action, onDone }) {
  const qc = useQueryClient()
  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') onDone() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onDone])
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm({ resolver: zodResolver(respondSchema) })

  const mutation = useMutation({
    mutationFn: (data) => respondToQuote(quoteId, { action, client_response: data.client_response }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quote', String(quoteId)] })
      qc.invalidateQueries({ queryKey: ['quotes'] })
      onDone()
    },
  })

  const isAccept = action === 'accept'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
      <div className="card w-full max-w-sm p-6">
        <h2 className={`font-display text-lg mb-1 ${isAccept ? 'text-emerald-700' : 'text-red-700'}`}>
          {isAccept ? 'Accept Quote' : 'Reject Quote'}
        </h2>
        <p className="text-brand-400 text-sm mb-4">
          {isAccept ? 'The designer will be notified.' : 'You can add a note for the designer.'}
        </p>
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
          <div>
            <label className="field-label">Comment <span className="text-brand-400">(optional)</span></label>
            <textarea className="field-input resize-none" rows={3} placeholder="Add a note…" {...register('client_response')} />
          </div>
          {mutation.error && (
            <p className="text-red-600 text-sm">{mutation.error.response?.data?.detail || 'Error'}</p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || mutation.isPending}
              className={`flex-1 btn ${isAccept ? 'btn-gold' : 'btn-danger'}`}
            >
              {isSubmitting || mutation.isPending ? '…' : isAccept ? 'Accept' : 'Reject'}
            </button>
            <button type="button" onClick={onDone} className="btn-outline">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function QuoteDetail({ user }) {
  const { id } = useParams()
  const qc = useQueryClient()
  const [showAddItem, setShowAddItem] = useState(false)
  const [respondAction, setRespondAction] = useState(null)

  const { data: quote, isLoading, isError } = useQuery({
    queryKey: ['quote', id],
    queryFn: () => fetchQuote(id),
  })

  const sendMutation = useMutation({
    mutationFn: () => sendQuote(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['quote', id] })
      qc.invalidateQueries({ queryKey: ['quotes'] })
    },
  })

  const deleteItemMutation = useMutation({
    mutationFn: (itemId) => deleteQuoteItem(id, itemId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['quote', id] }),
  })

  if (isLoading) return <div className="text-brand-400 text-sm p-4">Loading quote…</div>
  if (isError || !quote) return <div className="text-red-600 text-sm p-4">Quote not found.</div>

  const isDesigner = user?.role === 'designer'
  const isClient = user?.role === 'client'
  const canEdit = isDesigner && !['accepted', 'rejected'].includes(quote.status)
  const canSend = isDesigner && quote.status === 'draft'
  const canRespond = isClient && quote.status === 'sent'

  const subtotal = Number(quote.subtotal)
  const gstAmount = Number(quote.gst_amount)
  const total = Number(quote.total_amount)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <Link to="/quotes" className="inline-flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-700 transition-colors">
        <ArrowLeft size={14} /> Back to Quotes
      </Link>

      {/* Header card */}
      <div className="card p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl text-brand-900">{quote.title}</h1>
            <div className="flex items-center flex-wrap gap-3 mt-2 text-sm text-brand-400">
              <Link to={`/projects/${quote.project?.id}`} className="hover:text-gold-700 transition-colors">
                {quote.project?.name}
              </Link>
              {quote.valid_until && (
                <>
                  <span>·</span>
                  <span>Valid until {formatDateIST(quote.valid_until)}</span>
                </>
              )}
              {quote.notes && (
                <>
                  <span>·</span>
                  <span className="italic">{quote.notes}</span>
                </>
              )}
            </div>
          </div>
          <span className={`${statusBadgeClass(quote.status)} shrink-0`}>{statusLabel(quote.status)}</span>
        </div>

        {/* Client response */}
        {quote.client_response && (
          <div className={`mt-4 p-3 rounded-xl text-sm ${
            quote.status === 'accepted' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-red-50 text-red-800 border border-red-100'
          }`}>
            <span className="font-medium">Client note:</span> {quote.client_response}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 mt-5 flex-wrap">
          {canSend && (
            <button
              type="button"
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending || (quote.items?.length === 0)}
              className="btn-gold"
              title={quote.items?.length === 0 ? 'Add items before sending' : ''}
            >
              <Send size={15} /> {sendMutation.isPending ? 'Sending…' : 'Send to Client'}
            </button>
          )}
          {canRespond && (
            <>
              <button type="button" onClick={() => setRespondAction('accept')} className="btn bg-emerald-600 text-white hover:bg-emerald-700">
                <CheckCircle size={15} /> Accept
              </button>
              <button type="button" onClick={() => setRespondAction('reject')} className="btn-danger">
                <XCircle size={15} /> Reject
              </button>
            </>
          )}
        </div>
      </div>

      {/* Line items */}
      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-surface-border">
          <h2 className="font-semibold text-brand-900 text-sm">Line Items</h2>
          {canEdit && !showAddItem && (
            <button type="button" onClick={() => setShowAddItem(true)} className="btn-outline btn-sm">
              <Plus size={13} /> Add item
            </button>
          )}
        </div>

        {showAddItem && (
          <div className="p-4 border-b border-surface-border">
            <AddItemForm quoteId={id} onDone={() => setShowAddItem(false)} />
          </div>
        )}

        {quote.items?.length === 0 ? (
          <div className="px-5 py-8 text-center text-brand-400 text-sm">
            No items yet.{canEdit && (
              <button type="button" onClick={() => setShowAddItem(true)} className="text-gold-700 ml-1 hover:underline">
                Add one →
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-surface-card border-b border-surface-border">
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase">Description</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase hidden sm:table-cell">Category</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-400 uppercase">Qty</th>
                  <th className="text-left px-4 py-3 text-xs font-medium text-brand-400 uppercase hidden md:table-cell">Unit</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-400 uppercase">Unit Price</th>
                  <th className="text-right px-4 py-3 text-xs font-medium text-brand-400 uppercase">Total</th>
                  {canEdit && <th className="w-10" />}
                </tr>
              </thead>
              <tbody>
                {quote.items.map((item) => (
                  <tr key={item.id} className="border-b border-surface-border last:border-0 hover:bg-surface-card">
                    <td className="px-4 py-3">
                      <p className="font-medium text-brand-900">{item.description}</p>
                      {item.dimensions && <p className="text-xs text-brand-400 mt-0.5">{item.dimensions}</p>}
                    </td>
                    <td className="px-4 py-3 text-brand-500 capitalize hidden sm:table-cell">{item.category}</td>
                    <td className="px-4 py-3 text-right text-brand-700 tabular-nums">{Number(item.quantity)}</td>
                    <td className="px-4 py-3 text-brand-500 hidden md:table-cell">{item.unit}</td>
                    <td className="px-4 py-3 text-right text-brand-700 tabular-nums">{formatINR(item.unit_price)}</td>
                    <td className="px-4 py-3 text-right amount-gold">{formatINR(item.line_total)}</td>
                    {canEdit && (
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() => deleteItemMutation.mutate(item.id)}
                          className="text-brand-300 hover:text-red-500 transition-colors p-1"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals */}
        <div className="border-t border-surface-border px-5 py-4">
          <div className="ml-auto max-w-xs space-y-2 text-sm">
            <div className="flex justify-between text-brand-600">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatINR(subtotal)}</span>
            </div>
            <div className="flex justify-between text-brand-600">
              <span>GST ({Number(quote.gst_rate)}%)</span>
              <span className="tabular-nums">{formatINR(gstAmount)}</span>
            </div>
            <div className="divider !my-2" />
            <div className="flex justify-between font-semibold text-brand-900">
              <span>Total (INR)</span>
              <span className="amount-lg">{formatINR(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {respondAction && (
        <RespondForm
          quoteId={id}
          action={respondAction}
          onDone={() => setRespondAction(null)}
        />
      )}
    </div>
  )
}
