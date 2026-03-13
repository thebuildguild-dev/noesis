import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Trash2, Pencil, ChevronLeft, ChevronRight, BookOpen } from 'lucide-react'
import { useJournalStore } from '../../store/journal.store.js'
import { useAlertStore } from '../../store/alert.store.js'
import { useApi } from '../../hooks/useApi.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { RichTextEditor } from '../../components/ui/RichTextEditor.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { SkeletonCard } from '../../components/ui/SkeletonCard.jsx'
import InterrogatorModal from '../../components/ui/InterrogatorModal.jsx'

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function wordCount(text) {
  const plain = /<[a-z][\s\S]*>/i.test(text) ? stripHtml(text) : text.trim()
  return plain.split(/\s+/).filter(Boolean).length
}

function entryPreview(content, max = 150) {
  const text = /<[a-z][\s\S]*>/i.test(content) ? stripHtml(content) : content
  return text.length > max ? text.slice(0, max) + '...' : text
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
  return new Date(d).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function EntryCard({ entry, onDelete }) {
  const navigate = useNavigate()
  const [interrogating, setInterrogating] = useState(false)
  const { call } = useApi()
  const { showSuccess } = useAlertStore()

  const handleDelete = async () => {
    await call(onDelete, entry.id)
    showSuccess('Entry deleted')
  }

  const wc = wordCount(entry.content)
  const isEdited = entry.updated_at && entry.updated_at !== entry.created_at

  return (
    <>
      <Card
        className="group cursor-pointer hover:translate-y-[-1px] transition-all duration-150"
        onClick={() => navigate(`/journal/${entry.id}`, { state: { entry } })}
      >
        {/* Date header */}
        <div className="flex items-center justify-between gap-2 mb-3 pb-2 border-b border-dashed border-muted">
          <div className="flex items-center gap-2">
            <BookOpen size={13} strokeWidth={2.5} className="text-pen-blue flex-shrink-0" />
            <div>
              <span className="font-marker text-sm font-bold text-ink">
                {formatDateLong(entry.created_at)}
              </span>
              <span className="font-hand text-xs text-ink ml-1.5">
                {formatTime(entry.created_at)}
              </span>
            </div>
          </div>

          <div
            className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/journal/editor?edit=${entry.id}`, { state: { entry } })
                }}
                className="p-1 text-ink/60 hover:text-pen-blue transition-colors rounded"
                title="Edit entry"
              >
                <Pencil size={13} strokeWidth={2.5} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setInterrogating(true)
                }}
                className="p-1 text-ink/60 hover:text-accent transition-colors rounded"
                title="Delete entry"
              >
                <Trash2 size={13} strokeWidth={2.5} />
              </button>
            </>
          </div>
        </div>

        <p className="font-hand text-base text-ink leading-relaxed">
          {entryPreview(entry.content)}
        </p>

        <div className="flex items-center justify-between mt-3 pt-2 border-t border-dashed border-muted/60">
          <div className="flex items-center gap-2">
            <span className="font-hand text-xs text-ink">
              {wc} word{wc !== 1 ? 's' : ''}
            </span>
            {isEdited && <span className="font-hand text-xs text-ink/60 italic">· edited</span>}
          </div>
          <span className="font-hand text-xs text-pen-blue">read more →</span>
        </div>
      </Card>
      {interrogating && (
        <InterrogatorModal
          entityType="journal entry"
          entityName={entryPreview(entry.content, 60)}
          onConfirm={() => {
            setInterrogating(false)
            handleDelete()
          }}
          onCancel={() => setInterrogating(false)}
        />
      )}
    </>
  )
}

export default function JournalPage() {
  const { entries, pagination, loading, fetchEntries, createEntry, deleteEntry } = useJournalStore()
  const { loading: posting, error, call, clearError } = useApi()
  const { showSuccess } = useAlertStore()
  const [content, setContent] = useState('')
  const [editorKey, setEditorKey] = useState(0)
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchEntries(page)
  }, [page])

  const handleCreate = async () => {
    const text = content.replace(/<[^>]*>/g, '').trim()
    if (!text) return
    clearError()
    try {
      await call(createEntry, content)
      setContent('')
      setEditorKey((k) => k + 1)
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
        <RichTextEditor
          key={editorKey}
          content=""
          onChange={setContent}
          placeholder="What's on your mind today?"
        />
        {error && <p className="font-hand text-sm text-accent mt-2">{error}</p>}
        <div className="flex items-center justify-between mt-3">
          <span className="font-hand text-xs text-ink">
            {content.replace(/<[^>]*>/g, '').trim()
              ? `${wc} word${wc !== 1 ? 's' : ''}`
              : 'start writing…'}
          </span>
          <Button
            onClick={handleCreate}
            disabled={posting || !content.replace(/<[^>]*>/g, '').trim()}
          >
            {posting ? 'saving...' : 'save note →'}
          </Button>
        </div>
      </Card>

      <div className="flex items-center justify-between mb-4">
        <h2 className="font-marker text-xl font-bold text-ink">Past entries</h2>
        {pagination && <span className="font-hand text-sm text-ink">{pagination.total} total</span>}
      </div>

      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-marker text-5xl text-ink/40 mb-4">✦</p>
          <p className="font-marker text-2xl text-ink mb-2">nothing written yet</p>
          <p className="font-hand text-ink">
            Reflection builds consistency — write your first entry above ↑
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map((e) => (
            <EntryCard key={e.id} entry={e} onDelete={deleteEntry} />
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
          <span className="font-hand text-ink">
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
