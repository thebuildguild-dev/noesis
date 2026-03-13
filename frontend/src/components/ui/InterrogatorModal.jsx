import { useState, useEffect } from 'react'
import { X, AlertTriangle, Trash2 } from 'lucide-react'
import {
  fetchInterrogationQuestion,
  evaluateInterrogationJustification
} from '../../api/interrogator.api.js'
import { radius } from '../../utils/styles.js'

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function InterrogatorModal({ entityType, entityName, onConfirm, onCancel }) {
  const [question, setQuestion] = useState('')
  const [loadingQuestion, setLoadingQuestion] = useState(true)
  const [fetchError, setFetchError] = useState(null)
  const [justification, setJustification] = useState('')
  const [evaluating, setEvaluating] = useState(false)
  const [feedback, setFeedback] = useState(null)

  const wordCount = countWords(justification)
  const canSubmit = wordCount >= 10

  useEffect(() => {
    let cancelled = false
    setLoadingQuestion(true)
    fetchInterrogationQuestion(entityType, entityName)
      .then((q) => {
        if (!cancelled) setQuestion(q)
      })
      .catch(() => {
        if (!cancelled) setFetchError('Could not generate question. You may proceed.')
      })
      .finally(() => {
        if (!cancelled) setLoadingQuestion(false)
      })
    return () => {
      cancelled = true
    }
  }, [entityType, entityName])

  const handleDelete = async () => {
    if (!canSubmit || evaluating) return
    setFeedback(null)
    setEvaluating(true)
    try {
      const { approved, feedback: msg } = await evaluateInterrogationJustification(
        entityType,
        entityName,
        justification
      )
      if (approved) {
        onConfirm()
      } else {
        setFeedback(msg || 'That explanation is too vague. Explain in more detail.')
      }
    } catch {
      // If AI eval fails, allow deletion to proceed
      onConfirm()
    } finally {
      setEvaluating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm">
      <div
        className="bg-paper border-2 border-ink w-full max-w-md shadow-hard"
        style={{ borderRadius: radius.wobblyCard }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b-2 border-dashed border-ink/20">
          <div className="flex items-center gap-2">
            <AlertTriangle size={16} strokeWidth={2.5} className="text-accent flex-shrink-0" />
            <div>
              <p className="font-marker text-xs font-bold text-accent uppercase tracking-widest">
                Interrogation
              </p>
              <p className="font-hand text-xs text-ink/40 truncate max-w-[240px]">
                {entityType}: &ldquo;{entityName}&rdquo;
              </p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="p-1.5 text-ink/30 hover:text-ink transition-colors rounded"
          >
            <X size={16} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-5">
          {/* AI Question */}
          <div className="mb-5 min-h-[52px]">
            {loadingQuestion ? (
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 border-2 border-ink/20 border-t-ink rounded-full animate-spin flex-shrink-0" />
                <span className="font-hand text-sm text-ink/50">Generating question…</span>
              </div>
            ) : fetchError ? (
              <p className="font-hand text-sm text-ink/50 italic">{fetchError}</p>
            ) : (
              <p className="font-hand text-base text-ink leading-relaxed">
                &ldquo;{question}&rdquo;
              </p>
            )}
          </div>

          {/* Justification textarea */}
          <div className="mb-4">
            <textarea
              value={justification}
              onChange={(e) => {
                setJustification(e.target.value)
                setFeedback(null)
              }}
              placeholder="Justify yourself…"
              rows={4}
              className="w-full px-3 py-2.5 font-hand text-sm text-ink bg-paper border-2 border-ink/20 focus:border-ink/50 outline-none resize-none transition-colors"
              style={{ borderRadius: radius.input }}
            />

            {/* Word counter */}
            <div className="flex items-center justify-between mt-1.5">
              <span
                className={`font-hand text-xs transition-colors ${
                  wordCount === 0
                    ? 'text-ink/30'
                    : canSubmit
                      ? 'text-[#4caf50] font-bold'
                      : 'text-accent'
                }`}
              >
                {wordCount} / 10 words {canSubmit ? '✓' : 'required'}
              </span>
              {!canSubmit && wordCount > 0 && (
                <span className="font-hand text-xs text-ink/30">{10 - wordCount} more to go</span>
              )}
            </div>
          </div>

          {/* AI Feedback */}
          {feedback && (
            <div
              className="mb-4 px-3 py-2.5 bg-[#fff9c4] border-2 border-ink/20"
              style={{ borderRadius: radius.wobblyCard }}
            >
              <p className="font-hand text-sm text-ink">{feedback}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-3 py-2 font-hand text-sm text-ink/60 border-2 border-muted hover:text-ink hover:border-ink/40 transition-colors"
              style={{ borderRadius: radius.btn }}
            >
              cancel
            </button>
            <button
              onClick={handleDelete}
              disabled={!canSubmit || evaluating}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 font-hand text-sm text-white bg-accent border-2 border-accent disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
              style={{
                borderRadius: radius.btn,
                boxShadow: canSubmit && !evaluating ? '2px 2px 0px 0px #c62828' : 'none'
              }}
            >
              {evaluating ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  checking…
                </>
              ) : (
                <>
                  <Trash2 size={14} strokeWidth={2.5} />
                  delete
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
