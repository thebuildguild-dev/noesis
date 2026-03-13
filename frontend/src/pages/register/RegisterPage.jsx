import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useApi } from '../../hooks/useApi.js'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Toast } from '../../components/ui/Toast.jsx'
import { radius } from '../../utils/styles.js'
import config from '../../config/index.js'

export default function RegisterPage() {
  const { register } = useAuth()
  const { loading, error, call, clearError } = useApi()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    await call(register, form.email, form.password, form.name)
    navigate('/dashboard')
  }

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
        style={{ borderRadius: radius.wobblyAlt }}
        className="w-full max-w-md bg-white border-2 border-ink shadow-hard p-8"
      >
        <div
          className="w-12 h-1 bg-pen-blue mb-6"
          style={{ borderRadius: '1px 3px 2px 1px / 2px 1px 3px 2px' }}
        />
        <h2 className="font-marker text-3xl font-bold text-ink mb-1">Get started!</h2>
        <p className="font-hand text-ink/50 mb-8">create your account</p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="font-hand text-sm text-ink/70 block mb-1.5">Name</label>
            <Input type="text" placeholder="Your name" value={form.name} onChange={set('name')} />
          </div>
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
            <label className="font-hand text-sm text-ink/70 block mb-1.5">Password</label>
            <Input
              type="password"
              placeholder="at least 8 characters"
              value={form.password}
              onChange={set('password')}
              required
              minLength={8}
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full mt-2">
            {loading ? 'creating account...' : 'create account →'}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t-2 border-dashed border-muted text-center">
          <p className="font-hand text-ink/50">
            already have one?{' '}
            <Link
              to="/login"
              className="text-pen-blue underline decoration-wavy underline-offset-2 hover:text-accent transition-colors"
            >
              sign in
            </Link>
          </p>
        </div>
      </div>

      <Toast message={error} type="error" onClose={clearError} />
    </div>
  )
}
