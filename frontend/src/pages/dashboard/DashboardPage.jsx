import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  Circle,
  Flame,
  BookOpen,
  ArrowRight,
  Lightbulb,
  Activity,
  Camera,
  ShieldCheck
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'
import { useHabitsStore } from '../../store/habits.store.js'
import { useJournalStore } from '../../store/journal.store.js'
import { useAlertStore } from '../../store/alert.store.js'
import { useApi } from '../../hooks/useApi.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Badge } from '../../components/ui/Badge.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { SkeletonCard } from '../../components/ui/SkeletonCard.jsx'
import { HeatmapGrid } from '../../components/ui/HeatmapGrid.jsx'
import ProofUploadModal from '../../components/ui/ProofUploadModal.jsx'
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

function getDailyInsight({ completedToday, totalHabits, allStreaks, entriesCount }) {
  if (totalHabits === 0) {
    return 'Start by adding your first habit and build your daily routine.'
  }
  const maxStreak = allStreaks.reduce((max, s) => Math.max(max, s.currentStreak), 0)
  if (completedToday === totalHabits) {
    return `All ${totalHabits} habit${totalHabits !== 1 ? 's' : ''} done today! You're on fire. 🏆`
  }
  if (completedToday === 0) {
    return 'Start your day by completing one habit. The first one is the hardest.'
  }
  if (maxStreak >= 7) {
    return `You're on a ${maxStreak}-day streak — momentum is everything. Keep it going! 🔥`
  }
  if (completedToday >= 2) {
    return `${completedToday} habits done, ${totalHabits - completedToday} to go. Great progress!`
  }
  if (entriesCount === 0) {
    return 'Habits are going well. Writing even one line in the journal compounds over time.'
  }
  return 'Every day you show up, you build a better version of yourself.'
}

function HabitRow({ habit, onComplete, onProof }) {
  const [justCompleted, setJustCompleted] = useState(false)
  const { loading: completing, call: callComplete } = useApi()
  const { showError } = useAlertStore()

  const handleComplete = async () => {
    if (habit.requires_proof) {
      onProof(habit)
      return
    }
    try {
      await callComplete(onComplete, habit.id)
      if (!habit.completed_today) {
        setJustCompleted(true)
        setTimeout(() => setJustCompleted(false), 2500)
      }
    } catch (err) {
      showError(err.message ?? 'Failed to complete habit')
    }
  }

  return (
    <div
      className={`flex items-center gap-3 py-2.5 transition-all duration-300 ${justCompleted ? 'bg-[#f0fff4] -mx-2 px-2 rounded-lg' : ''}`}
    >
      <button
        onClick={habit.completed_today ? undefined : handleComplete}
        disabled={habit.completed_today || completing}
        className="flex-shrink-0 disabled:cursor-default"
      >
        {habit.completed_today ? (
          habit.requires_proof ? (
            <ShieldCheck size={20} strokeWidth={2.5} className="text-pen-blue" />
          ) : (
            <CheckCircle2
              size={20}
              strokeWidth={2.5}
              className={`transition-transform duration-300 ${justCompleted ? 'scale-125 text-[#4caf50]' : 'text-[#4caf50]'}`}
            />
          )
        ) : completing ? (
          <Spinner size="sm" />
        ) : habit.requires_proof ? (
          <Camera
            size={20}
            strokeWidth={2.5}
            className="text-pen-blue/60 hover:text-pen-blue transition-colors"
          />
        ) : (
          <Circle
            size={20}
            strokeWidth={2.5}
            className="text-ink/30 hover:text-ink transition-colors"
          />
        )}
      </button>
      <span
        className={`font-hand text-base flex-1 transition-all duration-300 ${habit.completed_today ? 'line-through text-ink/40' : 'text-ink'}`}
      >
        {habit.title}
      </span>
      {justCompleted && (
        <span className="font-hand text-xs text-[#4caf50] animate-pulse">✓ done!</span>
      )}
      {habit.completed_today && !justCompleted && (
        <Badge color={habit.requires_proof ? 'blue' : 'green'} className="text-xs">
          {habit.requires_proof ? 'verified' : 'done'}
        </Badge>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuth()
  const {
    habits,
    loading: hLoading,
    allStreaks,
    activity,
    fetchHabits,
    fetchAllStreaks,
    fetchActivity,
    completeHabit,
    markProofApproved
  } = useHabitsStore()
  const { entries, pagination, loading: jLoading, fetchEntries } = useJournalStore()
  const { showSuccess } = useAlertStore()
  const [proofHabit, setProofHabit] = useState(null)

  useEffect(() => {
    fetchHabits()
    fetchEntries(1, 5)
    fetchAllStreaks()
    fetchActivity()
  }, [])

  const completedToday = habits.filter((h) => h.completed_today).length
  const totalHabits = habits.length
  const bestStreak = allStreaks.reduce((max, s) => Math.max(max, s.currentStreak), 0)
  const totalEntries = pagination?.total ?? entries.length

  const insight = getDailyInsight({
    completedToday,
    totalHabits,
    allStreaks,
    entriesCount: totalEntries
  })

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

      {/* Daily Insight Banner */}
      {!hLoading && (
        <div
          className="mb-6 flex items-start gap-3 border-2 border-pen-blue bg-pen-blue/5 p-4"
          style={{ borderRadius: radius.wobblyCard }}
        >
          <Lightbulb size={18} strokeWidth={2.5} className="text-pen-blue flex-shrink-0 mt-0.5" />
          <p className="font-hand text-base text-ink">{insight}</p>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {hLoading ? (
          <>
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} />
            <SkeletonCard lines={2} className="col-span-2 md:col-span-1" />
          </>
        ) : (
          <>
            <Card yellow className="text-center" rotate={-1}>
              <div className="font-marker text-4xl font-bold text-ink">
                {completedToday}/{totalHabits}
              </div>
              <p className="font-hand text-sm text-ink mt-1">habits today</p>
              {totalHabits > 0 && (
                <ProgressBar value={completedToday} max={totalHabits} className="mt-3" />
              )}
            </Card>

            <Card className="text-center" rotate={1}>
              <div className="font-marker text-4xl font-bold text-accent flex items-center justify-center gap-1">
                <Flame size={28} strokeWidth={2} className="text-accent" />
                {bestStreak}
              </div>
              <p className="font-hand text-sm text-ink mt-1">best streak</p>
            </Card>

            <Card className="text-center col-span-2 md:col-span-1" rotate={-1}>
              <div className="font-marker text-4xl font-bold text-pen-blue">{totalEntries}</div>
              <p className="font-hand text-sm text-ink mt-1">journal entries</p>
            </Card>
          </>
        )}
      </div>

      {/* Activity Heatmap */}
      {!hLoading && (
        <Card className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} strokeWidth={2.5} className="text-pen-blue" />
            <h2 className="font-marker text-lg font-bold text-ink">Habit Activity</h2>
            <span className="font-hand text-xs text-ink ml-1">last 56 days</span>
          </div>
          <HeatmapGrid activity={activity} totalHabits={totalHabits} />
        </Card>
      )}

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
            <div className="space-y-2">
              <SkeletonCard lines={1} />
              <SkeletonCard lines={1} />
              <SkeletonCard lines={1} />
            </div>
          ) : habits.length === 0 ? (
            <div className="py-6 text-center">
              <p className="font-marker text-xl text-ink/50 mb-1">no habits yet</p>
              <Link to="/habits" className="font-hand text-sm text-pen-blue hover:underline">
                Create your first habit →
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-dashed divide-muted">
              {habits.slice(0, 6).map((h) => (
                <HabitRow key={h.id} habit={h} onComplete={completeHabit} onProof={setProofHabit} />
              ))}
            </div>
          )}
          {totalHabits > 0 && (
            <ProgressBar value={completedToday} max={totalHabits} className="mt-4" />
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
            <div className="space-y-2">
              <SkeletonCard lines={2} />
              <SkeletonCard lines={2} />
            </div>
          ) : entries.length === 0 ? (
            <div className="py-6 text-center">
              <p className="font-marker text-xl text-ink/50 mb-1">nothing written yet</p>
              <Link to="/journal" className="font-hand text-sm text-pen-blue hover:underline">
                Start your first entry →
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {entries.slice(0, 4).map((e) => {
                const plain = e.content
                  .replace(/<[^>]+>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim()
                const wordCount = plain.split(/\s+/).filter(Boolean).length
                return (
                  <div key={e.id} className="border-l-2 border-pen-blue pl-3 py-1">
                    <p className="font-hand text-sm text-ink line-clamp-2">{plain}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="font-hand text-xs text-ink">{formatDate(e.created_at)}</p>
                      <span className="font-hand text-xs text-ink">· {wordCount}w</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>
      {proofHabit && (
        <ProofUploadModal
          habitId={proofHabit.id}
          habitTitle={proofHabit.title}
          onClose={() => setProofHabit(null)}
          onApproved={() => {
            markProofApproved(proofHabit.id)
            showSuccess(`✓ ${proofHabit.title} — proof verified!`)
            setProofHabit(null)
          }}
        />
      )}
    </AppLayout>
  )
}
