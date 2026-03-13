import { useEffect } from 'react'
import { AlertTriangle, X } from 'lucide-react'
import { useAgentStore } from '../../store/agent.store.js'
import { useAuthStore } from '../../store/auth.store.js'

export function AgentNotificationContainer() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
  const { messages, startPolling, stopPolling, dismiss } = useAgentStore()

  useEffect(() => {
    if (isAuthenticated) {
      startPolling()
    } else {
      stopPolling()
    }
    return () => stopPolling()
  }, [isAuthenticated])

  const message = messages[0]
  if (!message) return null

  return (
    <div
      style={{ borderRadius: '8px 4px 10px 4px / 4px 10px 4px 8px' }}
      className="fixed bottom-20 right-4 z-50 w-80 border-2 border-ink bg-white shadow-hard font-hand md:bottom-6 md:right-6"
    >
      <div className="flex items-center gap-2 border-b-2 border-ink bg-yellow-100 px-4 py-2">
        <AlertTriangle size={16} strokeWidth={3} className="shrink-0 text-ink" />
        <span className="flex-1 text-sm font-bold text-ink">Accountability Coach</span>
        <button
          onClick={() => dismiss(message.id)}
          className="opacity-60 hover:opacity-100"
          aria-label="Dismiss"
        >
          <X size={14} strokeWidth={3} />
        </button>
      </div>
      <div className="px-4 py-3">
        <p className="text-sm leading-relaxed text-ink">{message.message}</p>
        <p className="mt-2 text-xs text-ink/50">Agent detected broken streak</p>
      </div>
    </div>
  )
}
