import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { apiFetch } from '../../api/client.js'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Toast } from '../../components/ui/Toast.jsx'
import { radius } from '../../utils/styles.js'
import config from '../../config/index.js'

export default function ForgotPasswordPage() {
  const { loading, error, call, clearError } = useApi()
  const [email, setEmail] = useState('')
  const [done, setDone] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await call(() =>
        apiFetch('/api/auth/forgot-password', {
          method: 'POST',
          body: JSON.stringify({ email })
        })
      )
      setDone(true)
    } catch {
      // error handled by useApi
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      {/* App name header */}
      <div className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <PenLine size={32} strokeWidth={2} className="text-accent" />
          <h1 className="font-marker text-5xl font-bold text-ink">{config.app.name}</h1>
        </div>
        <p className="font-hand text-lg text-ink/50">your thinking space</p>
      </div>

      {/* Card */}
      <div
        style={{ borderRadius: radius.wobbly }}
        className="w-full max-w-md bg-white border-2 border-ink shadow-hard p-8"
      >
        <div
          className="w-12 h-1 bg-accent mb-6"
          style={{ borderRadius: '1px 3px 2px 1px / 2px 1px 3px 2px' }}
        />

        {done ? (
          <div className="text-center">
            <h2 className="font-marker text-3xl font-bold text-ink mb-3">Check your inbox</h2>
            <p className="font-hand text-ink/60 mb-6">
              If an account exists for <span className="text-ink font-medium">{email}</span>,
              you&apos;ll receive a password reset link shortly.
            </p>
            <Link
              to="/login"
              className="font-hand text-pen-blue underline decoration-wavy underline-offset-2 hover:text-accent transition-colors"
            >
              back to sign in
            </Link>
          </div>
        ) : (
          <>
            <h2 className="font-marker text-3xl font-bold text-ink mb-1">Reset password</h2>
            <p className="font-hand text-ink/50 mb-8">
              enter your email and we&apos;ll send you a reset link
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="font-hand text-sm text-ink/70 block mb-1.5">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full mt-2">
                {loading ? 'sending...' : 'send reset link →'}
              </Button>
            </form>

            <div className="mt-6 pt-6 border-t-2 border-dashed border-muted text-center">
              <p className="font-hand text-ink/50">
                remembered it?{' '}
                <Link
                  to="/login"
                  className="text-pen-blue underline decoration-wavy underline-offset-2 hover:text-accent transition-colors"
                >
                  sign in
                </Link>
              </p>
            </div>
          </>
        )}
      </div>

      <Toast message={error} type="error" onClose={clearError} />
    </div>
  )
}
