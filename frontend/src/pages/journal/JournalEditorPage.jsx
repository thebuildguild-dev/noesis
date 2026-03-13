import { useState, useCallback } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { useJournalStore } from '../../store/journal.store.js'
import { useAlertStore } from '../../store/alert.store.js'
import { useApi } from '../../hooks/useApi.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { RichTextEditor } from '../../components/ui/RichTextEditor.jsx'

function stripHtml(html) {
  return html.replace(/<[^>]*>/g, '').trim()
}

export default function JournalEditorPage() {
  const navigate = useNavigate()
  const { state } = useLocation()
  const [searchParams] = useSearchParams()
  const editId = searchParams.get('edit')
  const existingEntry = state?.entry ?? null

  const [html, setHtml] = useState(existingEntry?.content ?? '')
  const { createEntry, updateEntry } = useJournalStore()
  const { showSuccess, showError } = useAlertStore()
  const { loading, call } = useApi()

  const handleSave = useCallback(async () => {
    const text = stripHtml(html)
    if (!text) {
      showError('Write something before saving.')
      return
    }
    try {
      if (editId && existingEntry) {
        const entry = await call(updateEntry, editId, html)
        showSuccess('Entry updated!')
        navigate(`/journal/${editId}`, { state: { entry }, replace: true })
      } else {
        const entry = await call(createEntry, html)
        showSuccess('Entry saved!')
        navigate(`/journal/${entry.id}`, { state: { entry }, replace: true })
      }
    } catch {
      // error handled via useApi
    }
  }, [html, editId, existingEntry])

  const isEditing = Boolean(editId && existingEntry)

  return (
    <AppLayout>
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 font-hand text-sm text-ink/50 hover:text-ink transition-colors"
        >
          <ArrowLeft size={16} strokeWidth={2.5} /> back
        </button>
        <PageHeader
          title={isEditing ? 'Edit entry' : 'New entry'}
          subtitle={isEditing ? 'update your note' : 'write with formatting'}
        />
      </div>

      <RichTextEditor content={html} onChange={setHtml} placeholder="What's on your mind today?" />

      <div className="flex justify-end mt-4">
        <Button onClick={handleSave} disabled={loading || !stripHtml(html)}>
          <Save size={16} strokeWidth={2.5} />
          {loading ? 'saving...' : isEditing ? 'update entry' : 'save entry'}
        </Button>
      </div>
    </AppLayout>
  )
}
