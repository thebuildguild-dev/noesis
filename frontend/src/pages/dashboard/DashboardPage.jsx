import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Circle, Flame, BookOpen, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useHabitsStore } from '../../store/habits.store.js'
import { useJournalStore } from '../../store/journal.store.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { radius } from '../../utils/styles.js'

function greeting(name) {
  const h = new Date().getHours()
  const salut = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
  return `${salut}${name ? `, ${name}` : ''}!`
}

function formatDate(d) {
  return new Date(d).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function HabitRow({ habit }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      {habit.completed_today ? (
        <CheckCircle2 size={20} strokeWidth={2.5} className="text-[#4caf50] flex-shrink-0" />
      ) : (
        <Circle size={20} strokeWidth={2.5} className="text-ink/30 flex-shrink-0" />
      )}
      <span
        className={`font-hand text-base flex-1 ${habit.completed_today ? 'line-through text-ink/40' : 'text-ink'}`}
      >
        {habit.title}
      </span>
      {habit.completed_today && (
        <Badge color="green" className="text-xs">
          done
        </Badge>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { habits, loading: hLoading, fetchHabits } = useHabitsStore()
  const { entries, loading: jLoading, fetchEntries } = useJournalStore()

  useEffect(() => {
    fetchHabits()
    fetchEntries(1, 5)
  }, [])

  const completedToday = habits.filter((h) => h.completed_today).length
  const totalHabits = habits.length

  return (
    <AppLayout>
      <PageHeader
        title={greeting(user?.name ?? user?.email?.split('@')[0])}
        subtitle={new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric'
        })}
      />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        <Card yellow className="text-center" rotate={-1}>
          <div className="font-marker text-4xl font-bold text-ink">
            {hLoading ? '–' : `${completedToday}/${totalHabits}`}
          </div>
          <p className="font-hand text-sm text-ink/60 mt-1">habits today</p>
        </Card>

        <Card className="text-center" rotate={1}>
          <div className="font-marker text-4xl font-bold text-accent">
            {hLoading ? '–' : totalHabits}
          </div>
          <p className="font-hand text-sm text-ink/60 mt-1">total habits</p>
        </Card>

        <Card className="text-center col-span-2 md:col-span-1" rotate={-1}>
          <div className="font-marker text-4xl font-bold text-pen-blue">
            {jLoading ? '–' : entries.length}
          </div>
          <p className="font-hand text-sm text-ink/60 mt-1">journal entries</p>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's habits */}
        <Card decoration="tack">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-marker text-xl font-bold text-ink flex items-center gap-2">
              <Flame size={18} strokeWidth={2.5} className="text-accent" />
              Today's Habits
            </h2>
            <Link
              to="/habits"
              className="font-hand text-sm text-pen-blue hover:text-accent flex items-center gap-1"
            >
              all <ArrowRight size={14} />
            </Link>
          </div>
          {hLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : habits.length === 0 ? (
            <p className="font-hand text-ink/40 text-center py-4">no habits yet — add one!</p>
          ) : (
            <div className="divide-y divide-dashed divide-muted">
              {habits.slice(0, 6).map((h) => (
                <HabitRow key={h.id} habit={h} />
              ))}
            </div>
          )}
          {totalHabits > 0 && (
            <div className="mt-4 bg-muted h-2.5" style={{ borderRadius: radius.btn }}>
              <div
                className="h-full bg-[#4caf50] transition-all"
                style={{
                  width: `${totalHabits === 0 ? 0 : (completedToday / totalHabits) * 100}%`,
                  borderRadius: radius.btn
                }}
              />
            </div>
          )}
        </Card>

        {/* Recent journal */}
        <Card decoration="tape">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-marker text-xl font-bold text-ink flex items-center gap-2">
              <BookOpen size={18} strokeWidth={2.5} className="text-pen-blue" />
              Recent Notes
            </h2>
            <Link
              to="/journal"
              className="font-hand text-sm text-pen-blue hover:text-accent flex items-center gap-1"
            >
              all <ArrowRight size={14} />
            </Link>
          </div>
          {jLoading ? (
            <div className="flex justify-center py-6">
              <Spinner />
            </div>
          ) : entries.length === 0 ? (
            <p className="font-hand text-ink/40 text-center py-4">
              no entries yet — start writing!
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.slice(0, 4).map((e) => (
                <div key={e.id} className="border-l-2 border-pen-blue pl-3 py-1">
                  <p className="font-hand text-sm text-ink line-clamp-2">{e.content}</p>
                  <p className="font-hand text-xs text-ink/40 mt-0.5">{formatDate(e.created_at)}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
