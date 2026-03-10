import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { fetchMessages, sendMessage } from '../api'
import { formatIST, getInitials } from '../utils'

export default function ChatBox({ projectId }) {
  const qc = useQueryClient()
  const [content, setContent] = useState('')
  const bottomRef = useRef(null)

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['messages', projectId],
    queryFn: () => fetchMessages(projectId),
    refetchInterval: 10000,
  })

  const sorted = [...messages].reverse()

  const mutation = useMutation({
    mutationFn: (text) => sendMessage(projectId, text),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['messages', projectId] })
      setContent('')
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [sorted.length])

  const handleSend = (e) => {
    e.preventDefault()
    const text = content.trim()
    if (!text) return
    mutation.mutate(text)
  }

  return (
    <div className="card flex flex-col" style={{ height: 360 }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
        {isLoading && <p className="text-brand-400 text-sm text-center pt-4">Loading messages…</p>}
        {!isLoading && sorted.length === 0 && (
          <p className="text-brand-400 text-sm text-center pt-4">No messages yet. Start the conversation.</p>
        )}
        {sorted.map((m) => (
          <div key={m.id} className="flex items-start gap-2.5">
            <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-semibold text-brand-600">{getInitials(m.sender?.name)}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-baseline gap-2">
                <span className="text-xs font-semibold text-brand-800">{m.sender?.name || 'User'}</span>
                <span className="text-xs text-brand-300">{formatIST(m.created_at, 'h:mm A')}</span>
              </div>
              <p className="text-sm text-brand-700 mt-0.5 break-words">{m.content}</p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSend}
        className="flex gap-2 p-3 border-t border-surface-border"
      >
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Type a message…"
          className="field-input flex-1"
        />
        <button
          type="submit"
          disabled={!content.trim() || mutation.isPending}
          className="btn-primary shrink-0 px-3"
        >
          <Send size={15} />
        </button>
      </form>
    </div>
  )
}
