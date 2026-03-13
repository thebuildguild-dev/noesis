import { useEffect, useState } from 'react'
import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { ArrowLeft, Pencil, BookOpen, Trash2 } from 'lucide-react'
import { useJournalStore } from '../../store/journal.store.js'
import { useAlertStore } from '../../store/alert.store.js'
import { useApi } from '../../hooks/useApi.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { SkeletonCard } from '../../components/ui/SkeletonCard.jsx'

function formatDateLong(d) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
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

function isHtml(content) {
  return /<[a-z][\s\S]*>/i.test(content)
}

export default function JournalViewPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { state } = useLocation()
  const { entries, loading, fetchEntries, deleteEntry } = useJournalStore()
  const { showSuccess, showError } = useAlertStore()
  const { loading: deleting, call: callDelete } = useApi()
  const [entry, setEntry] = useState(state?.entry ?? null)
  const [confirming, setConfirming] = useState(false)

  useEffect(() => {
    if (entry) return
    const found = entries.find((e) => e.id === id)
    if (found) {
      setEntry(found)
    } else if (!loading) {
      fetchEntries(1, 100).then(() => {
        const e = useJournalStore.getState().entries.find((e) => e.id === id)
        if (e) setEntry(e)
        else navigate('/journal', { replace: true })
      })
    }
  }, [id, entries])

  const handleEdit = () => {
    navigate(`/journal/editor?edit=${entry.id}`, { state: { entry } })
  }

  const handleDelete = async () => {
    try {
      await callDelete(deleteEntry, entry.id)
      showSuccess('Entry deleted')
      navigate('/journal', { replace: true })
    } catch (err) {
      showError(err.message ?? 'Failed to delete entry')
      setConfirming(false)
    }
  }

  if (!entry && loading) {
    return (
      <AppLayout>
        <div className="flex flex-col gap-3">
          <SkeletonCard lines={5} />
        </div>
      </AppLayout>
    )
  }

  if (!entry) return null

  const html = isHtml(entry.content)
  const isEdited = entry.updated_at && entry.updated_at !== entry.created_at

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigate('/journal')}
          className="flex items-center gap-1.5 font-hand text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> all entries
        </button>

        <div className="flex items-center gap-2">
          {confirming ? (
            <>
              <span className="font-hand text-sm text-ink/50">Delete this entry?</span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-3 py-1 font-hand text-sm text-white bg-accent border border-accent disabled:opacity-50"
                style={{ borderRadius: '6px' }}
              >
                {deleting ? '…' : 'yes, delete'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-3 py-1 font-hand text-sm text-ink/50 hover:text-ink border border-muted"
                style={{ borderRadius: '6px' }}
              >
                cancel
              </button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" onClick={handleEdit}>
                <Pencil size={14} strokeWidth={2.5} /> edit
              </Button>
              <button
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 font-hand text-sm text-ink/40 hover:text-accent hover:bg-[#fff0f0] border border-transparent hover:border-accent/30 rounded transition-colors"
              >
                <Trash2 size={14} strokeWidth={2.5} /> delete
              </button>
            </>
          )}
        </div>
      </div>

      <Card decoration="tape">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-3 border-b-2 border-dashed border-muted">
          <BookOpen size={16} strokeWidth={2.5} className="text-pen-blue flex-shrink-0" />
          <div>
            <p className="font-marker text-lg font-bold text-ink">
              {formatDateLong(entry.created_at)}
            </p>
            <p className="font-hand text-xs text-ink/40">
              {formatTime(entry.created_at)}
              {isEdited && <span className="italic ml-1.5">· edited</span>}
            </p>
          </div>
        </div>

        {/* Content */}
        {html ? (
          <div
            className="rich-content font-hand text-base text-ink"
            dangerouslySetInnerHTML={{ __html: entry.content }}
          />
        ) : (
          <p className="font-hand text-base text-ink whitespace-pre-wrap leading-relaxed">
            {entry.content}
          </p>
        )}
      </Card>
    </AppLayout>
  )
}
