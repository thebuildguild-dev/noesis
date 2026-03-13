import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { useApi } from '../../hooks/useApi.js'
import { apiFetch } from '../../api/client.js'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Toast } from '../../components/ui/Toast.jsx'
import { radius } from '../../utils/styles.js'
import config from '../../config/index.js'

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const navigate = useNavigate()

  const { loading, error, call, clearError } = useApi()
  const [form, setForm] = useState({ password: '', confirm: '' })
  const [validationError, setValidationError] = useState(null)
  const [done, setDone] = useState(false)

  const set = (field) => (e) => {
    setValidationError(null)
    setForm((f) => ({ ...f, [field]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.password.length < 8) {
      setValidationError('Password must be at least 8 characters')
      return
    }
    if (form.password !== form.confirm) {
      setValidationError('Passwords do not match')
      return
    }

    try {
      await call(() =>
        apiFetch('/api/auth/reset-password', {
          method: 'POST',
          body: JSON.stringify({ token, password: form.password })
        })
      )
      setDone(true)
    } catch {
      // error state handled by useApi
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PenLine size={32} strokeWidth={2} className="text-accent" />
            <h1 className="font-marker text-5xl font-bold text-ink">{config.app.name}</h1>
          </div>
          <p className="font-hand text-lg text-ink/50">your thinking space</p>
        </div>

        <div
          style={{ borderRadius: radius.wobbly }}
          className="w-full max-w-md bg-white border-2 border-ink shadow-hard p-8 text-center"
        >
          <div
            className="w-12 h-1 bg-accent mb-6 mx-auto"
            style={{ borderRadius: '1px 3px 2px 1px / 2px 1px 3px 2px' }}
          />
          <h2 className="font-marker text-3xl font-bold text-ink mb-3">Invalid link</h2>
          <p className="font-hand text-ink/60 mb-6">
            This password reset link is missing or invalid. Please request a new one.
          </p>
          <Link
            to="/login"
            className="font-hand text-pen-blue underline decoration-wavy underline-offset-2 hover:text-accent transition-colors"
          >
            back to sign in
          </Link>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <PenLine size={32} strokeWidth={2} className="text-accent" />
            <h1 className="font-marker text-5xl font-bold text-ink">{config.app.name}</h1>
          </div>
          <p className="font-hand text-lg text-ink/50">your thinking space</p>
        </div>

        <div
          style={{ borderRadius: radius.wobbly }}
          className="w-full max-w-md bg-white border-2 border-ink shadow-hard p-8 text-center"
        >
          <div
            className="w-12 h-1 bg-accent mb-6 mx-auto"
            style={{ borderRadius: '1px 3px 2px 1px / 2px 1px 3px 2px' }}
          />
          <h2 className="font-marker text-3xl font-bold text-ink mb-3">Password updated!</h2>
          <p className="font-hand text-ink/60 mb-6">
            Your password has been changed. You can now sign in with your new password.
          </p>
          <Button onClick={() => navigate('/login')} className="w-full">
            sign in →
          </Button>
        </div>
      </div>
    )
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

      {/* Reset card */}
      <div
        style={{ borderRadius: radius.wobbly }}
        className="w-full max-w-md bg-white border-2 border-ink shadow-hard p-8"
      >
        <div
          className="w-12 h-1 bg-accent mb-6"
          style={{ borderRadius: '1px 3px 2px 1px / 2px 1px 3px 2px' }}
        />
        <h2 className="font-marker text-3xl font-bold text-ink mb-1">New password</h2>
        <p className="font-hand text-ink/50 mb-8">choose a strong password for your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-hand text-sm text-ink/70 block mb-1.5">New password</label>
            <Input
              type="password"
              placeholder="at least 8 characters"
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>
          <div>
            <label className="font-hand text-sm text-ink/70 block mb-1.5">Confirm password</label>
            <Input
              type="password"
              placeholder="same password again"
              value={form.confirm}
              onChange={set('confirm')}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'updating...' : 'update password →'}
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
      </div>

      <Toast
        message={validationError ?? error}
        type="error"
        onClose={() => {
          setValidationError(null)
          clearError()
        }}
      />
    </div>
  )
}
