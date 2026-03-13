import { useEffect, useState } from 'react'
import { Trash2, Pencil, Check, X, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { useJournalStore } from '../../store/journal.store.js'
import { useAlertStore } from '../../store/alert.store.js'
import { useApi } from '../../hooks/useApi.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Textarea } from '../../components/ui/Input.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { SkeletonCard } from '../../components/ui/SkeletonCard.jsx'

function wordCount(text) {
  return text
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
}

function formatDateLong(d) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatTime(d) {
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function EntryCard({ entry, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [draft, setDraft] = useState(entry.content)
  const { loading, call } = useApi()
  const { showSuccess } = useAlertStore()

  const save = async () => {
    if (!draft.trim() || draft === entry.content) {
      setEditing(false)
      return
    }
    await call(onUpdate, entry.id, draft.trim())
    setEditing(false)
    showSuccess('Entry updated!')
  }

  const cancel = () => {
    setDraft(entry.content)
    setEditing(false)
  }

  const handleDelete = () => {
    call(onDelete, entry.id)
    showSuccess('Entry deleted')
    setConfirming(false)
  }

  const wc = wordCount(entry.content)
  const preview = entry.content.slice(0, 80)

  return (
    <Card className="group">
      {/* Date header */}
      <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-dashed border-muted">
        <div className="flex items-center gap-2">
          <BookOpen size={13} strokeWidth={2.5} className="text-pen-blue flex-shrink-0" />
          <div>
            <span className="font-marker text-sm font-bold text-ink">
              {formatDateLong(entry.created_at)}
            </span>
            <span className="font-hand text-xs text-ink/40 ml-1.5">{formatTime(entry.created_at)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {!editing && !confirming && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(true)}
                className="p-1 text-ink/40 hover:text-pen-blue transition-colors rounded"
                title="Edit entry"
              >
                <Pencil size={13} strokeWidth={2.5} />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="p-1 text-ink/40 hover:text-accent transition-colors rounded"
                title="Delete entry"
              >
                <Trash2 size={13} strokeWidth={2.5} />
              </button>
            </div>
          )}
          {confirming && (
            <div className="flex items-center gap-1">
              <button
                onClick={handleDelete}
                className="px-2 py-0.5 font-hand text-xs text-white bg-accent rounded border border-accent"
              >
                delete
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2 py-0.5 font-hand text-xs text-ink/50 hover:text-ink rounded border border-muted"
              >
                no
              </button>
            </div>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} autoFocus />
          <div className="flex items-center justify-between">
            <span className="font-hand text-xs text-ink/30">{wordCount(draft)} words</span>
            <div className="flex gap-2">
              <Button size="sm" onClick={save} disabled={loading}>
                <Check size={14} strokeWidth={3} /> save
              </Button>
              <Button size="sm" variant="ghost" onClick={cancel}>
                <X size={14} strokeWidth={3} /> cancel
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="font-hand text-base text-ink whitespace-pre-wrap leading-relaxed">
            {entry.content}
          </p>
          <div className="flex items-center gap-2 mt-3 pt-2 border-t border-dashed border-muted/60">
            <span className="font-hand text-xs text-ink/30">{wc} word{wc !== 1 ? 's' : ''}</span>
            {entry.updated_at && entry.updated_at !== entry.created_at && (
              <span className="font-hand text-xs text-ink/25 italic">· edited</span>
            )}
          </div>
        </>
      )}
    </Card>
  )
}

export default function JournalPage() {
  const { entries, pagination, loading, fetchEntries, createEntry, updateEntry, deleteEntry } =
    useJournalStore()
  const { loading: posting, error, call, clearError } = useApi()
  const { showSuccess } = useAlertStore()
  const [content, setContent] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchEntries(page)
  }, [page])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    clearError()
    try {
      await call(createEntry, content.trim())
      setContent('')
      showSuccess('Entry saved!')
    } catch {
      // error handled via useApi
    }
  }

  const wc = wordCount(content)

  return (
    <AppLayout>
      <PageHeader title="Journal" subtitle="capture your thoughts" />

      <Card className="mb-6" decoration="tape">
        <h2 className="font-marker text-lg font-bold text-ink mb-3">New entry</h2>
        <form onSubmit={handleCreate} className="flex flex-col gap-3">
          <Textarea
            placeholder="What's on your mind today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
          />
          {error && <p className="font-hand text-sm text-accent">{error}</p>}
          <div className="flex items-center justify-between">
            <span className="font-hand text-xs text-ink/30">
              {content.trim() ? `${wc} word${wc !== 1 ? 's' : ''}` : 'start writing…'}
            </span>
            <Button type="submit" disabled={posting || !content.trim()}>
              {posting ? 'saving...' : 'save note →'}
            </Button>
          </div>
        </form>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-marker text-xl font-bold text-ink">Past entries</h2>
        {pagination && (
          <span className="font-hand text-sm text-ink/40">{pagination.total} total</span>
        )}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-marker text-5xl text-ink/10 mb-4">✦</p>
          <p className="font-marker text-2xl text-ink/30 mb-2">nothing written yet</p>
          <p className="font-hand text-ink/40">
            Reflection builds consistency — write your first entry above ↑
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <EntryCard key={e.id} entry={e} onUpdate={updateEntry} onDelete={deleteEntry} />
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <Button
            variant="secondary"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft size={16} strokeWidth={3} /> prev
          </Button>
          <span className="font-hand text-ink/60">
            {page} / {pagination.totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page === pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            next <ChevronRight size={16} strokeWidth={3} />
          </Button>
        </div>
      )}
    </AppLayout>
  )
}
