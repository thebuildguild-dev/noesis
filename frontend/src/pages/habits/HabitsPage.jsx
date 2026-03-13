import { useEffect, useState } from 'react'
import {
  Plus,
  Trash2,
  Flame,
  CheckCircle2,
  Circle,
  History,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useHabitsStore } from '../../store/habits.store.js'
import { useAlertStore } from '../../store/alert.store.js'
import { useApi } from '../../hooks/useApi.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Button } from '../../components/ui/Button.jsx'
import { Input } from '../../components/ui/Input.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SkeletonCard, SkeletonLine } from '../../components/ui/SkeletonCard.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import * as habitsApi from '../../api/habits.api.js'
import { radius } from '../../utils/styles.js'

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec'
]

function formatCreated(ts) {
  const d = new Date(ts)
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`
}

/**
 * Returns the last 7 days (oldest → newest) with done flags from recentDates.
 */
function getWeekDots(recentDates = []) {
  const dateSet = new Set(recentDates)
  const today = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today)
    d.setDate(today.getDate() - (6 - i))
    const key = d.toISOString().slice(0, 10)
    return {
      key,
      label: d.toLocaleDateString('en-US', { weekday: 'short' })[0],
      done: dateSet.has(key),
      isToday: i === 6
    }
  })
}

/**
 * Groups completion dates into months and shows a compact grid for each.
 */
function MonthGroupedHistory({ dates }) {
  if (!dates || dates.length === 0) {
    return (
      <p className="font-hand text-sm text-ink/30 italic text-center py-4">
        No completions in the last 90 days
      </p>
    )
  }

  const dateSet = new Set(dates)

  // Group last 90 days by month-year
  const months = []
  const today = new Date()
  let seenMonths = new Set()

  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const monthKey = `${d.getFullYear()}-${d.getMonth()}`
    if (!seenMonths.has(monthKey)) {
      seenMonths.add(monthKey)
      months.push({ year: d.getFullYear(), month: d.getMonth() })
    }
  }

  return (
    <div className="flex flex-col gap-4 max-h-72 overflow-y-auto pr-1">
      {months.map(({ year, month }) => {
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const monthStart = new Date(year, month, 1)
        const monthEnd = new Date(year, month, daysInMonth)
        const windowStart = new Date(today)
        windowStart.setDate(today.getDate() - 89)

        // Only show days within the 90-day window
        const startDay = monthStart < windowStart ? windowStart.getDate() : 1
        const endDay = monthEnd > today ? today.getDate() : daysInMonth
        if (
          year > today.getFullYear() ||
          (year === today.getFullYear() && month > today.getMonth())
        )
          return null

        const days = Array.from({ length: endDay - startDay + 1 }, (_, i) => startDay + i)

        return (
          <div key={`${year}-${month}`}>
            <p className="font-marker text-sm font-bold text-ink/50 mb-2">
              {MONTH_NAMES[month]} {year}
            </p>
            <div className="flex flex-wrap gap-1">
              {days.map((day) => {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const done = dateSet.has(dateStr)
                return (
                  <div
                    key={dateStr}
                    title={`${MONTH_NAMES[month]} ${day}: ${done ? 'completed' : 'not completed'}`}
                    className={`w-6 h-6 flex items-center justify-center text-xs border transition-colors ${
                      done
                        ? 'bg-[#4caf50] border-[#4caf50] text-white'
                        : 'border-ink/15 text-ink/20'
                    }`}
                    style={{ borderRadius: '50%' }}
                  >
                    <span className="text-[9px]">{done ? '✓' : day}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function HabitCard({ habit, onComplete, onDelete }) {
  const [confirming, setConfirming] = useState(false)
  const [justCompleted, setJustCompleted] = useState(false)
  const [showTimeline, setShowTimeline] = useState(false)
  const [timelineLogs, setTimelineLogs] = useState(null)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const { loading: completing, call: callComplete } = useApi()
  const { loading: deleting, call: callDelete } = useApi()
  const { showSuccess, showError } = useAlertStore()
  const streakData = useHabitsStore((s) => s.getStreakFor(habit.id))
  const getStreakFor = useHabitsStore((s) => s.getStreakFor)

  const currentStreak = streakData?.currentStreak ?? 0
  const longestStreak = streakData?.longestStreak ?? 0
  const weekDots = getWeekDots(streakData?.recentDates)
  const doneThisWeek = weekDots.filter((d) => d.done).length

  const handleComplete = async () => {
    if (habit.completed_today) return
    try {
      await callComplete(onComplete, habit.id)
      setJustCompleted(true)
      setTimeout(() => setJustCompleted(false), 2500)
      // Show streak-aware toast after optimistic update
      const updated = getStreakFor(habit.id)
      const newStreak = updated?.currentStreak ?? 0
      if (newStreak > 0) {
        showSuccess(
          `✓ ${habit.title.slice(0, 30)} · 🔥 Streak: ${newStreak} day${newStreak !== 1 ? 's' : ''}`
        )
      } else {
        showSuccess(`✓ ${habit.title.slice(0, 40)} completed!`)
      }
    } catch (err) {
      showError(err.message ?? 'Failed to complete habit')
    }
  }

  const handleDelete = async () => {
    try {
      await callDelete(onDelete, habit.id)
      showSuccess(`"${habit.title}" deleted`)
    } catch (err) {
      showError(err.message ?? 'Failed to delete habit')
      setConfirming(false)
    }
  }

  const handleToggleTimeline = async () => {
    if (!showTimeline && timelineLogs === null) {
      setLoadingLogs(true)
      try {
        const { data } = await habitsApi.getHabitLogs(habit.id)
        setTimelineLogs(data.dates)
      } catch {
        setTimelineLogs([])
      } finally {
        setLoadingLogs(false)
      }
    }
    setShowTimeline((v) => !v)
  }

  return (
    <Card
      className={`transition-all duration-300 ${justCompleted ? 'ring-2 ring-[#4caf50]/50' : ''}`}
    >
      {/* Header row: title + streak badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <p
          className={`font-hand text-base font-medium leading-snug flex-1 transition-all duration-300 ${habit.completed_today ? 'line-through text-ink/40' : 'text-ink'}`}
        >
          {habit.title}
        </p>
        {currentStreak > 0 && (
          <div
            className="flex items-center gap-1 flex-shrink-0 px-2 py-0.5 border border-ink/20 bg-[#fff9c4]"
            style={{ borderRadius: radius.btn }}
          >
            <Flame size={12} strokeWidth={2.5} className="text-accent" />
            <span className="font-marker text-sm font-bold text-ink">{currentStreak}</span>
          </div>
        )}
      </div>

      {/* 7-day dots row — shown after streak data loads */}
      {streakData && (
        <div className="mb-3">
          <p className="font-hand text-xs text-ink/40 mb-1.5">Last 7 days</p>
          <div className="flex gap-1.5">
            {weekDots.map(({ key, label, done, isToday }) => (
              <div key={key} className="flex flex-col items-center gap-1">
                <div
                  className={`w-6 h-6 flex items-center justify-center text-xs border transition-all duration-300 ${
                    done
                      ? 'bg-[#4caf50] border-[#4caf50] text-white'
                      : isToday
                        ? 'border-ink/40 text-ink/30 border-dashed'
                        : 'border-ink/20 text-ink/20'
                  }`}
                  style={{ borderRadius: '50%' }}
                  title={key}
                >
                  {done ? '✓' : ''}
                </div>
                <span
                  className={`font-hand text-[9px] ${isToday ? 'text-ink/60 font-bold' : 'text-ink/30'}`}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Progress bar */}
      {streakData && (
        <div className="mb-4">
          <div className="flex justify-between items-center mb-1">
            <span className="font-hand text-xs text-ink/40">Weekly progress</span>
            <span className="font-hand text-xs text-ink/50">{doneThisWeek}/7 days</span>
          </div>
          <ProgressBar value={doneThisWeek} max={7} color="#4caf50" />
        </div>
      )}

      {/* Action row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          {confirming ? (
            <div className="flex items-center gap-2">
              <span className="font-hand text-sm text-ink/50">
                Delete "{habit.title.slice(0, 16)}
                {habit.title.length > 16 ? '…' : ''}"?
              </span>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="px-2.5 py-1 font-hand text-xs text-white bg-accent border border-accent disabled:opacity-50"
                style={{ borderRadius: radius.btn }}
              >
                {deleting ? '…' : 'yes'}
              </button>
              <button
                onClick={() => setConfirming(false)}
                className="px-2.5 py-1 font-hand text-xs text-ink/50 hover:text-ink border border-muted"
                style={{ borderRadius: radius.btn }}
              >
                no
              </button>
            </div>
          ) : (
            <>
              <button
                onClick={() => setConfirming(true)}
                className="p-1.5 text-ink/20 hover:text-accent hover:bg-[#fff0f0] rounded transition-colors"
                title="Delete habit"
              >
                <Trash2 size={15} strokeWidth={2.5} />
              </button>
              <button
                onClick={handleToggleTimeline}
                className="flex items-center gap-1 px-2 py-1 font-hand text-xs text-ink/40 hover:text-pen-blue transition-colors rounded"
                title="View completion history"
              >
                <History size={13} strokeWidth={2.5} />
                {showTimeline ? (
                  <ChevronUp size={11} strokeWidth={3} />
                ) : (
                  <ChevronDown size={11} strokeWidth={3} />
                )}
              </button>
            </>
          )}
        </div>

        <button
          onClick={handleComplete}
          disabled={habit.completed_today || completing}
          className={`flex items-center gap-2 px-3 py-1.5 font-hand text-sm border-2 transition-all duration-300 disabled:cursor-default ${
            habit.completed_today
              ? 'bg-[#f0fff4] border-[#4caf50] text-[#4caf50]'
              : 'border-ink hover:bg-[#4caf50] hover:border-[#4caf50] hover:text-white text-ink'
          }`}
          style={{
            borderRadius: radius.btn,
            boxShadow: habit.completed_today ? 'none' : '2px 2px 0px 0px #2d2d2d'
          }}
        >
          {completing ? (
            <span>…</span>
          ) : habit.completed_today ? (
            <>
              <CheckCircle2
                size={15}
                strokeWidth={2.5}
                className={`transition-transform duration-300 ${justCompleted ? 'scale-125' : ''}`}
              />
              {justCompleted ? 'streak +1! 🔥' : 'Done today'}
            </>
          ) : (
            <>
              <Circle size={15} strokeWidth={2.5} />
              Mark complete
            </>
          )}
        </button>
      </div>

      {/* Timeline panel */}
      {showTimeline && (
        <div className="mt-4 pt-3 border-t border-dashed border-muted">
          <p className="font-marker text-sm font-bold text-ink/40 mb-3">
            Completion history (last 90 days)
          </p>
          {loadingLogs ? (
            <div className="flex justify-center py-4">
              <Spinner size="sm" />
            </div>
          ) : (
            <MonthGroupedHistory dates={timelineLogs ?? []} />
          )}
        </div>
      )}

      {/* Metadata footer */}
      <div className="flex items-center gap-2 mt-3 pt-2 border-t border-dashed border-muted/60 text-ink/30">
        <span className="font-hand text-xs">Created {formatCreated(habit.created_at)}</span>
        {longestStreak > 0 && (
          <>
            <span className="text-ink/20">·</span>
            <span className="font-hand text-xs">
              Longest streak: {longestStreak} day{longestStreak !== 1 ? 's' : ''}
            </span>
          </>
        )}
        {!streakData && <SkeletonLine width="w-32" height="h-3" />}
      </div>
    </Card>
  )
}

export default function HabitsPage() {
  const { habits, loading, fetchHabits, fetchAllStreaks, createHabit, completeHabit, deleteHabit } =
    useHabitsStore()
  const { loading: creating, error, call, clearError } = useApi()
  const { showSuccess } = useAlertStore()
  const [title, setTitle] = useState('')

  useEffect(() => {
    fetchHabits()
    fetchAllStreaks()
  }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    clearError()
    try {
      await call(createHabit, title.trim())
      setTitle('')
      showSuccess('Habit added!')
    } catch {
      // error shown via useApi
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

      {/* Overall daily progress bar */}
      {!loading && habits.length > 0 && (
        <div className="mb-6">
          <div className="flex justify-between mb-1.5">
            <span className="font-hand text-sm text-ink/60">Today's progress</span>
            <span className="font-hand text-sm text-ink/60">
              {completedCount}/{habits.length} completed
            </span>
          </div>
          <ProgressBar value={completedCount} max={habits.length} />
        </div>
      )}

      {loading ? (
        <div className="flex flex-col gap-3">
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
          <SkeletonCard lines={3} />
        </div>
      ) : habits.length === 0 ? (
        <div className="text-center py-16">
          <p className="font-marker text-5xl text-ink/10 mb-4">✦</p>
          <p className="font-marker text-2xl text-ink/30 mb-2">no habits yet</p>
          <p className="font-hand text-ink/40">
            Start building your routine — add your first habit above ↑
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {habits.map((h) => (
            <HabitCard key={h.id} habit={h} onComplete={completeHabit} onDelete={deleteHabit} />
          ))}
        </div>
      )}
    </AppLayout>
  )
}
