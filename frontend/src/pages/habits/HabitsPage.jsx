import { useEffect, useState } from 'react'
import { Plus, CheckCircle2, Circle, Trash2, Flame, ChevronDown, ChevronUp } from 'lucide-react'
import { useHabitsStore } from '../../store/habits.store.js'
import { useApi } from '../../hooks/useApi.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { Toast } from '../../components/ui/Toast.jsx'
import { radius } from '../../utils/styles.js'

function StreakPanel({ habitId }) {
  const { fetchStreak, getStreak } = useHabitsStore()
  const { loading, call } = useApi()
  const streak = getStreak(habitId)

  useEffect(() => {
    if (!streak) call(fetchStreak, habitId)
  }, [habitId])

  if (loading)
    return (
      <div className="py-2 flex justify-center">
        <Spinner size="sm" />
      </div>
    )
  if (!streak) return null

  return (
    <div className="mt-3 pt-3 border-t border-dashed border-muted grid grid-cols-3 gap-2 text-center">
      {[
        { label: 'current', value: streak.currentStreak, color: 'text-accent' },
        { label: 'longest', value: streak.longestStreak, color: 'text-pen-blue' },
        { label: 'total', value: streak.totalCompletions, color: 'text-ink' }
      ].map(({ label, value, color }) => (
        <div key={label}>
          <div className={`font-marker text-2xl font-bold ${color}`}>{value}</div>
          <div className="font-hand text-xs text-ink/50">{label}</div>
        </div>
      ))}
    </div>
  )
}

function HabitCard({ habit, onComplete, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const { loading: completing, call: callComplete } = useApi()
  const { loading: deleting, call: callDelete } = useApi()

  const handleComplete = async () => {
    await callComplete(onComplete, habit.id)
  }
  const handleDelete = async () => {
    if (confirm(`Delete "${habit.title}"?`)) await callDelete(onDelete, habit.id)
  }

  return (
    <Card className={`transition-all duration-150 ${habit.completed_today ? 'opacity-75' : ''}`}>
      <div className="flex items-start gap-3">
        <button
          onClick={handleComplete}
          disabled={habit.completed_today || completing}
          className="flex-shrink-0 mt-0.5 disabled:cursor-default"
        >
          {habit.completed_today ? (
            <CheckCircle2 size={22} strokeWidth={2.5} className="text-[#4caf50]" />
          ) : (
            <Circle
              size={22}
              strokeWidth={2.5}
              className="text-ink/30 hover:text-ink transition-colors"
            />
          )}
        </button>

        <div className="flex-1 min-w-0">
          <p
            className={`font-hand text-base font-medium ${habit.completed_today ? 'line-through text-ink/40' : 'text-ink'}`}
          >
            {habit.title}
          </p>
          {habit.completed_today && (
            <Badge color="green" className="mt-1 text-xs">
              ✓ done today
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1.5 text-pen-blue hover:bg-muted rounded transition-colors"
            title="Show streak"
          >
            <Flame size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="p-1.5 text-ink/30 hover:text-accent hover:bg-[#fff0f0] rounded transition-colors"
            title="Delete habit"
          >
            <Trash2 size={16} strokeWidth={2.5} />
          </button>
        </div>
      </div>

      {expanded && <StreakPanel habitId={habit.id} />}
    </Card>
  )
}

export default function HabitsPage() {
  const { habits, loading, fetchHabits, createHabit, completeHabit, deleteHabit } = useHabitsStore()
  const { loading: creating, error, call, clearError } = useApi()
  const [title, setTitle] = useState('')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetchHabits()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await call(createHabit, title.trim())
      setTitle('')
      setToast({ message: 'Habit added!', type: 'success' })
    } catch {
      // error state handled by useApi
    }
  }

  const completedCount = habits.filter((h) => h.completed_today).length

  return (
    <AppLayout>
      <PageHeader
        title="Habits"
        subtitle={
          habits.length > 0
            ? `${completedCount} of ${habits.length} done today`
            : 'build your streaks'
        }
      />

      {/* Add habit form */}
      <Card className="mb-6" decoration="tape">
        <h2 className="font-marker text-lg font-bold text-ink mb-3">Add a new habit</h2>
        <form onSubmit={handleCreate} className="flex gap-3">
          <Input
            placeholder="e.g. Read for 20 minutes"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={creating || !title.trim()}>
            <Plus size={18} strokeWidth={3} />
          </Button>
        </form>
        {error && <p className="font-hand text-sm text-accent mt-2">{error}</p>}
      </Card>

      {/* Habits list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Spinner size="lg" />
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-marker text-2xl text-ink/30 mb-2">no habits yet</p>
          <p className="font-hand text-ink/40">add your first habit above ↑</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {habits.map((h) => (
            <HabitCard key={h.id} habit={h} onComplete={completeHabit} onDelete={deleteHabit} />
          ))}
        </div>
      )}

      <Toast message={toast?.message} type={toast?.type} onClose={() => setToast(null)} />
    </AppLayout>
  )
}
