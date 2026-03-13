import { Link } from 'react-router-dom'
import { PenLine, CheckCircle, BookOpen, Flame, ArrowRight } from 'lucide-react'
import { Button } from '../../components/ui/Button.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { radius } from '../../utils/styles.js'
import config from '../../config/index.js'

const features = [
  {
    icon: CheckCircle,
    title: 'habits',
    description:
      'build daily habits with a simple, distraction-free tracker that keeps you honest.',
    rotate: -1,
    decoration: 'tack'
  },
  {
    icon: BookOpen,
    title: 'journal',
    description:
      'capture thoughts in a private, paginated journal you own — no noise, just writing.',
    rotate: 0,
    decoration: 'tack'
  },
  {
    icon: Flame,
    title: 'streaks',
    description:
      'watch your current and longest streaks grow day after day. momentum is everything.',
    rotate: 1,
    decoration: 'tack'
  }
]

const steps = [
  { number: '01', label: 'create an account' },
  { number: '02', label: 'add your habits' },
  { number: '03', label: 'check in daily' }
]

export default function LandingPage() {
  const appName = config.app.name ?? 'Noesis'

  return (
    <div className="min-h-screen bg-paper text-ink flex flex-col">
      {/* Nav */}
      <header className="sticky top-0 z-50 bg-paper border-b-2 border-ink">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PenLine size={24} strokeWidth={2} className="text-accent" />
            <span className="font-marker text-2xl font-bold text-ink">{appName}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="font-hand text-ink/60 hover:text-ink transition-colors px-3 py-1.5"
            >
              sign in
            </Link>
            <Link to="/register">
              <Button size="sm">get started →</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="max-w-2xl mx-auto">
          {/* Eyebrow */}
          <div
            className="inline-flex items-center gap-2 bg-muted border-2 border-ink px-4 py-1.5 mb-8"
            style={{ borderRadius: radius.btn }}
          >
            <span className="font-hand text-sm text-ink/70">your thinking space</span>
          </div>

          {/* Headline */}
          <h1 className="font-marker text-5xl md:text-7xl font-bold text-ink leading-tight mb-2">
            think clearly.
          </h1>
          <h1 className="font-marker text-5xl md:text-7xl font-bold leading-tight mb-6">
            <span className="relative inline-block">
              <span className="text-ink">grow</span>
              {/* hand-drawn underline */}
              <svg
                className="absolute -bottom-2 left-0 w-full"
                viewBox="0 0 120 10"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  d="M2 7 C20 3, 50 9, 80 5 C100 2, 115 8, 118 6"
                  stroke="#ff4d4d"
                  strokeWidth="3"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            </span>
            <span className="text-ink"> daily.</span>
          </h1>

          <p className="font-hand text-xl text-ink/60 mb-10 max-w-lg mx-auto leading-relaxed">
            track habits, journal your thoughts, and watch your streaks compound — one day at a
            time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/register">
              <Button size="lg" className="w-full sm:w-auto">
                get started — it's free <ArrowRight size={18} className="inline ml-1" />
              </Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                sign in
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-marker text-3xl font-bold text-center text-ink mb-12">
            everything you need, nothing you don't.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map(({ icon: Icon, title, description, rotate, decoration }) => (
              <Card key={title} decoration={decoration} rotate={rotate} className="pt-8">
                <div className="flex flex-col gap-3">
                  <div
                    className="w-12 h-12 bg-accent/10 border-2 border-ink flex items-center justify-center"
                    style={{ borderRadius: radius.wobblyCard }}
                  >
                    <Icon size={22} className="text-accent" strokeWidth={2} />
                  </div>
                  <h3 className="font-marker text-2xl font-bold text-ink">{title}</h3>
                  <p className="font-hand text-ink/60 leading-relaxed">{description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-muted border-y-2 border-ink px-6 py-14">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-marker text-3xl font-bold text-center text-ink mb-10">
            how it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map(({ number, label }, i) => (
              <div key={number} className="flex items-start gap-4">
                <span className="font-marker text-4xl font-bold text-accent leading-none">
                  {number}
                </span>
                <div className="flex-1">
                  <p className="font-hand text-lg text-ink">{label}</p>
                  {i < steps.length - 1 && (
                    <div className="hidden md:block mt-1 w-8 h-px bg-ink/20" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-6 py-20">
        <div className="max-w-lg mx-auto">
          <Card yellow className="text-center shadow-hard-lg">
            <h2 className="font-marker text-3xl font-bold text-ink mb-3">ready to start?</h2>
            <p className="font-hand text-ink/60 mb-8">
              takes 30 seconds. no credit card. no noise.
            </p>
            <Link to="/register">
              <Button size="lg" className="w-full">
                create your account →
              </Button>
            </Link>
            <p className="font-hand text-sm text-ink/40 mt-5">
              already have an account?{' '}
              <Link
                to="/login"
                className="text-pen-blue underline decoration-wavy underline-offset-2 hover:text-accent transition-colors"
              >
                sign in here
              </Link>
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t-2 border-ink px-6 py-8 text-center">
        <div className="flex items-center justify-center gap-2 mb-1">
          <PenLine size={16} strokeWidth={2} className="text-accent" />
          <span className="font-marker text-lg text-ink">{appName}</span>
        </div>
        <p className="font-hand text-sm text-ink/40">your thinking space</p>
      </footer>
    </div>
  )
}
