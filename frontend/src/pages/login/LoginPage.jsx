import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, PenLine } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useApi } from '../../hooks/useApi.js'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Toast } from '../../components/ui/Toast.jsx'
import { radius } from '../../utils/styles.js'
import config from '../../config/index.js'

export default function LoginPage() {
  const { login } = useAuth()
  const { loading, error, call, clearError } = useApi()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    await call(login, form.email, form.password)
    navigate('/dashboard')
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

      {/* Login card */}
      <div
        style={{ borderRadius: radius.wobbly }}
        className="w-full max-w-md bg-white border-2 border-ink shadow-hard p-8"
      >
        {/* Dashed top accent */}
        <div
          className="w-12 h-1 bg-accent mb-6"
          style={{ borderRadius: '1px 3px 2px 1px / 2px 1px 3px 2px' }}
        />
        <h2 className="font-marker text-3xl font-bold text-ink mb-1">Welcome back!</h2>
        <p className="font-hand text-ink/50 mb-8">sign in to continue thinking</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-hand text-sm text-ink/70 block mb-1.5">Email</label>
            <Input
              type="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={set('email')}
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-hand text-sm text-ink/70">Password</label>
              <Link
                to="/forgot-password"
                className="font-hand text-xs text-pen-blue hover:text-accent transition-colors"
              >
                forgot password?
              </Link>
            </div>
            <Input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              required
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'signing in...' : 'sign in →'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t-2 border-dashed border-muted text-center">
          <p className="font-hand text-ink/50">
            no account yet?{' '}
            <Link
              to="/register"
              className="text-pen-blue underline decoration-wavy underline-offset-2 hover:text-accent transition-colors"
            >
              register here
            </Link>
          </p>
        </div>
      </div>

      <Toast message={error} type="error" onClose={clearError} />
    </div>
  )
}
