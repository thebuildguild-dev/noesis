import { useState, useRef } from 'react'
import { Camera, CheckCircle2, XCircle, Upload, X } from 'lucide-react'
import { submitHabitProof } from '../../api/habits.api.js'
import { radius } from '../../utils/styles.js'

function VerificationReport({ result }) {
  const approved = result.approved

  return (
    <div
      className={`border-2 p-4 mt-4 ${approved ? 'border-[#4caf50] bg-[#f0fff4]' : 'border-accent bg-[#fff5f5]'}`}
      style={{ borderRadius: radius.wobblyCard }}
    >
      <div className="mb-3">
        <p className="font-marker text-xs font-bold text-ink uppercase tracking-wide mb-1">
          Image Analysis
        </p>
        <p className="font-hand text-sm text-ink italic">"{result.visionDescription}"</p>
      </div>

      <div className="mb-3">
        <p className="font-marker text-xs font-bold text-ink uppercase tracking-wide mb-1">
          Reasoning
        </p>
        <p className="font-hand text-sm text-ink">"{result.reason}"</p>
      </div>

      {result.confidence != null && (
        <div className="mb-3">
          <p className="font-marker text-xs font-bold text-ink uppercase tracking-wide mb-1">
            Confidence
          </p>
          <p className="font-hand text-sm text-ink">{Math.round(result.confidence * 100)}%</p>
        </div>
      )}

      <div
        className={`flex items-center gap-2 pt-3 border-t border-dashed ${approved ? 'border-[#4caf50]/40' : 'border-accent/40'}`}
      >
        {approved ? (
          <>
            <CheckCircle2 size={18} strokeWidth={2.5} className="text-[#4caf50] flex-shrink-0" />
            <span className="font-marker text-base font-bold text-[#4caf50]">Proof Verified</span>
          </>
        ) : (
          <>
            <XCircle size={18} strokeWidth={2.5} className="text-accent flex-shrink-0" />
            <span className="font-marker text-base font-bold text-accent">Verification Failed</span>
          </>
        )}
      </div>
    </div>
  )
}

export default function ProofUploadModal({ habitId, habitTitle, onClose, onApproved }) {
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (!f) return
    setFile(f)
    setResult(null)
    setError(null)
    setPreview(URL.createObjectURL(f))
  }

  const handleVerify = async () => {
    if (!file) return
    setVerifying(true)
    setError(null)
    try {
      const res = await submitHabitProof(habitId, file)
      setResult(res.data)
      if (res.data?.approved) {
        onApproved()
      }
    } catch (err) {
      setError(err.message ?? 'Verification failed. Please try again.')
    } finally {
      setVerifying(false)
    }
  }

  const handleRetry = () => {
    setFile(null)
    setPreview(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/30 backdrop-blur-sm">
      <div
        className="bg-paper border-2 border-ink w-full max-w-md shadow-hard overflow-y-auto max-h-[90vh]"
        style={{ borderRadius: radius.wobblyCard }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dashed border-ink">
          <div>
            <h2 className="font-marker text-lg font-bold text-ink">Proof Verification</h2>
            <p className="font-hand text-xs text-ink mt-0.5 truncate max-w-[260px]">
              {habitTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-ink hover:text-accent transition-colors rounded"
          >
            <X size={18} strokeWidth={2.5} />
          </button>
        </div>

        <div className="p-4">
          {/* Verification result */}
          {result ? (
            <>
              {preview && (
                <img
                  src={preview}
                  alt="Proof"
                  className="w-full h-40 object-cover border border-ink/10 mb-2"
                  style={{ borderRadius: radius.wobblyCard }}
                />
              )}
              <VerificationReport result={result} />
              <div className="mt-4 flex gap-2">
                {!result.approved && (
                  <button
                    onClick={handleRetry}
                    className="flex-1 px-3 py-2 font-hand text-sm text-ink border-2 border-ink hover:bg-ink hover:text-paper transition-colors"
                    style={{ borderRadius: radius.btn }}
                  >
                    Try again
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="flex-1 px-3 py-2 font-hand text-sm text-white bg-ink border-2 border-ink"
                  style={{ borderRadius: radius.btn }}
                >
                  {result.approved ? 'Done' : 'Close'}
                </button>
              </div>
            </>
          ) : verifying ? (
            /* Verifying state */
            <div className="flex flex-col items-center py-8 gap-3">
              {preview && (
                <img
                  src={preview}
                  alt="Proof"
                  className="w-full h-40 object-cover border border-ink/10 mb-2 opacity-60"
                  style={{ borderRadius: radius.wobblyCard }}
                />
              )}
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-ink/30 border-t-ink rounded-full animate-spin" />
                <span className="font-hand text-sm text-ink">AI analyzing proof…</span>
              </div>
              <p className="font-hand text-xs text-ink text-center">
                Running vision analysis and habit reasoning
              </p>
            </div>
          ) : (
            /* Upload state */
            <>
              {preview ? (
                <div className="mb-4">
                  <img
                    src={preview}
                    alt="Selected"
                    className="w-full h-48 object-cover border-2 border-ink"
                    style={{ borderRadius: radius.wobblyCard }}
                  />
                  <p className="font-hand text-xs text-ink mt-1.5 truncate">{file?.name}</p>
                </div>
              ) : (
                <button
                  onClick={() => inputRef.current?.click()}
                  className="w-full h-40 flex flex-col items-center justify-center gap-3 border-2 border-dashed border-ink hover:bg-ink/[0.02] transition-colors mb-4"
                  style={{ borderRadius: radius.wobblyCard }}
                >
                  <Camera size={32} strokeWidth={1.5} className="text-ink" />
                  <p className="font-hand text-sm text-ink">Click to upload proof image</p>
                  <p className="font-hand text-xs text-ink">JPG, PNG, WebP — max 10 MB</p>
                </button>
              )}

              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />

              {error && <p className="font-hand text-sm text-accent mb-3">{error}</p>}

              <div className="flex gap-2">
                {preview && (
                  <button
                    onClick={handleRetry}
                    className="px-3 py-2 font-hand text-sm text-ink border border-ink hover:bg-ink hover:text-paper transition-colors"
                    style={{ borderRadius: radius.btn }}
                  >
                    Change
                  </button>
                )}
                <button
                  onClick={file ? handleVerify : () => inputRef.current?.click()}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 font-hand text-sm text-white bg-ink border-2 border-ink disabled:opacity-40"
                  style={{
                    borderRadius: radius.btn,
                    boxShadow: '2px 2px 0px 0px #2d2d2d'
                  }}
                >
                  <Upload size={15} strokeWidth={2.5} />
                  {file ? 'Verify Proof' : 'Choose Image'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
