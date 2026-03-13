import { useEffect, useState } from 'react'
import { Trash2, Pencil, Check, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { useJournalStore } from '../../store/journal.store.js'
import { useApi } from '../../hooks/useApi.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Textarea } from '../../components/ui/Input.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { Toast } from '../../components/ui/Toast.jsx'

function formatDate(d) {
  return new Date(d).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function EntryCard({ entry, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(entry.content)
  const { loading, call } = useApi()

  const save = async () => {
    if (!draft.trim() || draft === entry.content) {
      setEditing(false)
      return
    }
    await call(onUpdate, entry.id, draft.trim())
    setEditing(false)
  }

  const cancel = () => {
    setDraft(entry.content)
    setEditing(false)
  }

  const handleDelete = () => {
    if (confirm('Delete this entry?')) call(onDelete, entry.id)
  }

  return (
    <Card className="group">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="font-hand text-xs text-ink/40">{formatDate(entry.created_at)}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {!editing && (
            <>
              <button
                onClick={() => setEditing(true)}
                className="p-1 text-ink/40 hover:text-pen-blue transition-colors"
              >
                <Pencil size={14} strokeWidth={2.5} />
              </button>
              <button
                onClick={handleDelete}
                className="p-1 text-ink/40 hover:text-accent transition-colors"
              >
                <Trash2 size={14} strokeWidth={2.5} />
              </button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <div className="flex flex-col gap-2">
          <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} rows={4} autoFocus />
          <div className="flex gap-2">
            <Button size="sm" onClick={save} disabled={loading}>
              <Check size={14} strokeWidth={3} /> save
            </Button>
            <Button size="sm" variant="ghost" onClick={cancel}>
              <X size={14} strokeWidth={3} /> cancel
            </Button>
          </div>
        </div>
      ) : (
        <p className="font-hand text-base text-ink whitespace-pre-wrap leading-relaxed">
          {entry.content}
        </p>
      )}
    </Card>
  )
}

export default function JournalPage() {
  const { entries, pagination, loading, fetchEntries, createEntry, updateEntry, deleteEntry } =
    useJournalStore()
  const { loading: posting, error, call, clearError } = useApi()
  const [content, setContent] = useState('')
  const [page, setPage] = useState(1)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchEntries(page)
  }, [page])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!content.trim()) return
    try {
      await call(createEntry, content.trim())
      setContent('')
      setToast({ message: 'Entry saved!', type: 'success' })
    } catch {
      // error handled via useApi
    }
  }

  return (
    <AppLayout>
      <PageHeader title="Journal" subtitle="capture your thoughts" />

      {/* New entry */}
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
          <div className="flex justify-end">
            <Button type="submit" disabled={posting || !content.trim()}>
              {posting ? 'saving...' : 'save note →'}
            </Button>
          </div>
        </form>
      </Card>

      {/* Entries list */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-marker text-xl font-bold text-ink">Past entries</h2>
        {pagination && (
          <span className="font-hand text-sm text-ink/40">{pagination.total} total</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-marker text-2xl text-ink/30 mb-2">nothing written yet</p>
          <p className="font-hand text-ink/40">start with a thought above ↑</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <EntryCard key={e.id} entry={e} onUpdate={updateEntry} onDelete={deleteEntry} />
          ))}
        </div>
      )}

      {/* Pagination */}
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

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AppLayout>
  )
}
