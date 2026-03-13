import { useEffect } from 'react'
import { X } from 'lucide-react'

const typeStyles = {
  error: 'bg-accent text-white border-accent',
  success: 'bg-white text-ink border-ink',
  info: 'bg-pen-blue text-white border-pen-blue'
}

export function Toast({ message, type = 'error', onClose, duration = 4000 }) {
  useEffect(() => {
    if (!message) return
    const t = setTimeout(onClose, duration)
    return () => clearTimeout(t)
  }, [message, duration, onClose])

  if (!message) return null

  return (
    <div
      style={{ borderRadius: '8px 4px 10px 4px / 4px 10px 4px 8px' }}
      className={[
        'fixed bottom-6 right-6 z-50 flex items-center gap-3',
        'px-5 py-3 border-2 shadow-hard font-hand text-base max-w-sm',
        typeStyles[type]
      ].join(' ')}
    >
      <span className="flex-1">{message}</span>
      <button onClick={onClose} className="flex-shrink-0 opacity-70 hover:opacity-100">
        <X size={16} strokeWidth={3} />
      </button>
    </div>
  )
}
