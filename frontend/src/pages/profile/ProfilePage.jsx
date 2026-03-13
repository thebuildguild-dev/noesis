import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { User, Mail, LogOut, RotateCcw } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useApi } from '../../hooks/useApi.js'
import * as authApi from '../../api/auth.api.js'
import { useAlertStore } from '../../store/alert.store.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export default function ProfilePage() {
  const { user, logout, setUser } = useAuth()
  const navigate = useNavigate()
  const { loading, error, call, clearError } = useApi()
  const { loading: resetLoading, call: resetCall } = useApi()
  const { showSuccess } = useAlertStore()
  const [name, setName] = useState(user?.name ?? '')
  const [confirming, setConfirming] = useState(false)

  const handleUpdate = async (e) => {
    e.preventDefault()
    const { data } = await call(authApi.updateProfile, { name: name.trim() })
    setUser(data.user)
    showSuccess('Profile updated!')
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const handleReset = async () => {
    try {
      await resetCall(authApi.resetAccount)
      setConfirming(false)
      showSuccess('Data reset successfully!')
    } catch {
      setConfirming(false)
    }
  }

  const isDemo = user?.role === 'demo'

  return (
    <AppLayout>
      <PageHeader title="Profile" subtitle="your account details" />

      {/* User info */}
      <Card decoration="tack" className="mb-6">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 bg-pen-blue flex items-center justify-center flex-shrink-0"
              style={{ borderRadius: '50%' }}
            >
              <User size={22} strokeWidth={2.5} className="text-white" />
            </div>
            <div>
              <p className="font-marker text-xl font-bold text-ink">
                {user?.name || user?.email?.split('@')[0]}
              </p>
              <p className="font-hand text-sm text-ink">
                member since {formatDate(user?.created_at)}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-2 mt-2 pt-3 border-t border-dashed border-muted">
            <div className="flex items-center gap-2 font-hand text-sm text-ink">
              <Mail size={14} strokeWidth={2.5} />
              {user?.email}
            </div>
          </div>
        </div>
      </Card>

      {/* Update name */}
      <Card className="mb-6">
        <h2 className="font-marker text-xl font-bold text-ink mb-4">Update name</h2>
        <form onSubmit={handleUpdate} className="flex flex-col gap-4">
          <div>
            <label className="font-hand text-sm text-ink block mb-1.5">Display name</label>
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          {error && <p className="font-hand text-sm text-accent">{error}</p>}
          <Button type="submit" disabled={loading || !name.trim()}>
            {loading ? 'saving...' : 'save changes →'}
          </Button>
        </form>
      </Card>

      {/* Reset data */}
      <Card className="mb-6">
        <h2 className="font-marker text-xl font-bold text-ink mb-2">
          {isDemo ? 'Reset demo data' : 'Reset all data'}
        </h2>
        <p className="font-hand text-ink mb-4">
          {isDemo
            ? 'Restore sample habits and journal entries to defaults.'
            : 'Permanently delete all your habits and journal entries. This cannot be undone.'}
        </p>

        {confirming ? (
          <div className="flex flex-col gap-3">
            <p className="font-hand text-sm text-ink">Are you sure? This cannot be undone.</p>
            <div className="flex gap-3">
              <Button variant="danger" onClick={handleReset} disabled={resetLoading}>
                <RotateCcw size={14} strokeWidth={2.5} />
                {resetLoading ? 'resetting...' : 'yes, reset →'}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)} disabled={resetLoading}>
                cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button variant="danger" onClick={() => setConfirming(true)}>
            <RotateCcw size={16} strokeWidth={2.5} />
            {isDemo ? 'reset demo data →' : 'reset all data →'}
          </Button>
        )}
      </Card>

      {/* Logout */}
      <Card>
        <h2 className="font-marker text-xl font-bold text-ink mb-2">Sign out</h2>
        <p className="font-hand text-ink mb-4">you can always come back.</p>
        <Button variant="danger" onClick={handleLogout}>
          <LogOut size={16} strokeWidth={2.5} /> sign out
        </Button>
      </Card>
    </AppLayout>
  )
}
