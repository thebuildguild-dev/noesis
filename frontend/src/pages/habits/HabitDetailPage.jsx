import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Flame,
  Target,
  TrendingUp,
  Calendar,
  Trash2,
  Camera,
  ShieldCheck,
  XCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { useHabitsStore } from '../../store/habits.store.js'
import { useAlertStore } from '../../store/alert.store.js'
import { useApi } from '../../hooks/useApi.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { ProgressBar } from '../../components/ui/ProgressBar.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import * as habitsApi from '../../api/habits.api.js'
import * as streakApi from '../../api/streak.api.js'
import config from '../../config/index.js'
import { radius } from '../../utils/styles.js'
import InterrogatorModal from '../../components/ui/InterrogatorModal.jsx'

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

function daysBetween(start, end) {
  return Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)))
}

/** Parse a YYYY-MM-DD string as a local midnight date to avoid UTC offset issues. */
function parseLocalDate(str) {
  const [y, m, d] = str.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function MonthGroupedHistory({ dates }) {
  if (!dates || dates.length === 0) {
    return (
      <p className="font-hand text-sm text-ink/30 italic text-center py-4">
        No completions in the last 90 days
      </p>
    )
  }

  const dateSet = new Set(dates)
  const today = new Date()
  const windowStart = new Date(today)
  windowStart.setDate(today.getDate() - 89)

  const seenMonths = new Set()
  const rawMonths = []
  for (let i = 0; i < 90; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    if (!seenMonths.has(key)) {
      seenMonths.add(key)
      rawMonths.push({ year: d.getFullYear(), month: d.getMonth() })
    }
  }

  const months = rawMonths
    .map(({ year, month }) => {
      const daysInMonth = new Date(year, month + 1, 0).getDate()
      const monthStart = new Date(year, month, 1)
      const monthEnd = new Date(year, month, daysInMonth)
      const startDay = monthStart < windowStart ? windowStart.getDate() : 1
      const endDay = monthEnd > today ? today.getDate() : daysInMonth

      const days = []
      for (let day = startDay; day <= endDay; day++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
        days.push({ day, dateStr, done: dateSet.has(dateStr) })
      }
      return { year, month, days }
    })
    .filter(({ days }) => days.length > 0)

  return (
    <div className="flex flex-col gap-4 max-h-72 overflow-y-auto pr-1 scrollbar-subtle">
      {months.map(({ year, month, days }) => (
        <div key={`${year}-${month}`}>
          <p className="font-marker text-sm font-bold text-ink/50 mb-2">
            {MONTH_NAMES[month]} {year}
          </p>
          <div className="flex flex-wrap gap-1">
            {days.map(({ day, dateStr, done }) => (
              <div
                key={dateStr}
                title={`${MONTH_NAMES[month]} ${day}: ${done ? 'completed' : 'not completed'}`}
                className={`w-6 h-6 flex items-center justify-center text-xs border transition-colors ${
                  done ? 'bg-[#4caf50] border-[#4caf50] text-white' : 'border-ink/20 text-ink/30'
                }`}
                style={{ borderRadius: '50%' }}
              >
                <span className="text-[9px]">{done ? '✓' : day}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

function WeeklyBars({ dates }) {
  const today = new Date()
  const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000

  // Only go back as far as the oldest log date (max 8 weeks)
  const oldestDate = dates.length > 0 ? parseLocalDate(dates[dates.length - 1]) : null
  const weeksBack = oldestDate
    ? Math.min(8, Math.max(2, Math.ceil((today - oldestDate) / MS_PER_WEEK) + 1))
    : 4

  const weeks = Array.from({ length: weeksBack }, (_, i) => {
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() - i * 7)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekEnd.getDate() - 6)
    let count = 0
    for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      if (dates.includes(key)) count++
    }
    const label = `${MONTH_NAMES[weekStart.getMonth()]} ${weekStart.getDate()}`
    return { label, count }
  }).reverse()

  const maxCount = Math.max(1, ...weeks.map((w) => w.count))

  return (
    <div className="flex items-end gap-1.5 h-16">
      {weeks.map((w, i) => (
        <div key={i} className="flex flex-col items-center flex-1 gap-1">
          <div className="w-full flex items-end" style={{ height: 48 }}>
            {w.count > 0 ? (
              <div
                className="w-full bg-[#4caf50] transition-all duration-500"
                style={{
                  height: `${Math.max(6, (w.count / maxCount) * 48)}px`,
                  borderRadius: '3px 3px 0 0'
                }}
              />
            ) : (
              <div
                className="w-full border border-dashed border-ink/15"
                style={{ height: '100%', borderRadius: '3px 3px 0 0' }}
              />
            )}
          </div>
          <span className="font-hand text-[8px] text-ink/30 truncate w-full text-center">
            {w.label}
          </span>
        </div>
      ))}
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color = 'text-ink' }) {
  return (
    <Card className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={14} strokeWidth={2.5} className="text-ink/40" />
        <span className="font-hand text-xs text-ink/40 uppercase tracking-wide">{label}</span>
      </div>
      <span className={`font-marker text-2xl font-bold ${color}`}>{value}</span>
    </Card>
  )
}

function ProofHistorySection({ proofs }) {
  const [expandedId, setExpandedId] = useState(null)

  if (!proofs || proofs.length === 0) {
    return (
      <p className="font-hand text-sm text-ink/30 italic text-center py-4">
        No proof submissions yet
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
      {proofs.map((p) => {
        const approved = p.verification_status === 'approved'
        const isExpanded = expandedId === p.id
        const dateLabel = (() => {
          const d = new Date(p.completed_date + 'T00:00:00')
          return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`
        })()

        return (
          <div
            key={p.id}
            className={`border rounded overflow-hidden transition-all ${
              approved ? 'border-[#4caf50]/30' : 'border-accent/30'
            }`}
          >
            <button
              onClick={() => setExpandedId(isExpanded ? null : p.id)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-ink/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                {approved ? (
                  <ShieldCheck
                    size={14}
                    strokeWidth={2.5}
                    className="text-[#4caf50] flex-shrink-0"
                  />
                ) : (
                  <XCircle size={14} strokeWidth={2.5} className="text-accent flex-shrink-0" />
                )}
                <span className="font-hand text-sm text-ink">{dateLabel}</span>
                <span
                  className={`font-hand text-xs px-1.5 py-0.5 rounded ${
                    approved ? 'bg-[#f0fff4] text-[#4caf50]' : 'bg-[#fff5f5] text-accent'
                  }`}
                >
                  {approved ? 'verified' : 'rejected'}
                </span>
              </div>
              {isExpanded ? (
                <ChevronUp size={14} strokeWidth={2.5} className="text-ink/30" />
              ) : (
                <ChevronDown size={14} strokeWidth={2.5} className="text-ink/30" />
              )}
            </button>

            {isExpanded && (
              <div className="px-3 pb-3 border-t border-dashed border-ink/10 pt-2">
                {p.proof_image_url && (
                  <img
                    src={`${config.app.backendUrl}${p.proof_image_url}`}
                    alt="Proof"
                    className="w-full h-36 object-cover border border-ink/10 mb-2"
                    style={{ borderRadius: radius.wobblyCard }}
                  />
                )}
                {p.vision_description && (
                  <div className="mb-2">
                    <p className="font-marker text-xs font-bold text-ink/40 uppercase tracking-wide mb-0.5">
                      Image Analysis
                    </p>
                    <p className="font-hand text-xs text-ink italic">"{p.vision_description}"</p>
                  </div>
                )}
                {p.verification_comment && (
                  <div className="mb-2">
                    <p className="font-marker text-xs font-bold text-ink/40 uppercase tracking-wide mb-0.5">
                      Reasoning
                    </p>
                    <p className="font-hand text-xs text-ink">"{p.verification_comment}"</p>
                  </div>
                )}
                {p.verification_confidence != null && (
                  <p className="font-hand text-xs text-ink/40">
                    Confidence: {Math.round(p.verification_confidence * 100)}%
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function HabitDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { habits, fetchHabits, deleteHabit } = useHabitsStore()
  const { showSuccess, showError } = useAlertStore()
  const { call: callDelete } = useApi()

  const [habit, setHabit] = useState(null)
  const [streak, setStreak] = useState(null)
  const [logs, setLogs] = useState(null)
  const [proofs, setProofs] = useState(null)
  const [loading, setLoading] = useState(true)
  const [interrogating, setInterrogating] = useState(false)

  useEffect(() => {
    const found = habits.find((h) => h.id === id)
    if (found) {
      setHabit(found)
    } else {
      fetchHabits().then(() => {
        const h = useHabitsStore.getState().habits.find((h) => h.id === id)
        if (h) setHabit(h)
        else navigate('/habits', { replace: true })
      })
    }
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    Promise.all([
      streakApi.getHabitStreak(id),
      habitsApi.getHabitLogs(id),
      habitsApi.getProofHistory(id)
    ])
      .then(([streakRes, logsRes, proofsRes]) => {
        setStreak(streakRes.data.streak)
        setLogs(logsRes.data)
        setProofs(proofsRes.data.proofs ?? [])
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [id])

  if (loading && !habit) {
    return (
      <AppLayout>
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      </AppLayout>
    )
  }

  if (!habit) return null

  const handleDelete = async () => {
    try {
      await callDelete(deleteHabit, id)
      showSuccess(`"${habit.title}" deleted`)
      navigate('/habits', { replace: true })
    } catch (err) {
      showError(err.message ?? 'Failed to delete habit')
    }
  }

  const totalCompletions = streak?.totalCompletions ?? logs?.dates?.length ?? 0

  // Use the earliest of created_at and oldest log date so seeded/imported
  // data with backfilled logs doesn't collapse the timeline to 1 day.
  const logDates = logs?.dates ?? []
  const oldestLogDate = logDates.length > 0 ? parseLocalDate(logDates[logDates.length - 1]) : null
  const effectiveStart = oldestLogDate
    ? new Date(Math.min(new Date(habit.created_at).getTime(), oldestLogDate.getTime()))
    : new Date(habit.created_at)

  const daysSinceCreation = daysBetween(effectiveStart, new Date())
  const completionRate = Math.min(100, Math.round((totalCompletions / daysSinceCreation) * 100))
  const currentStreak = streak?.currentStreak ?? 0
  const longestStreak = streak?.longestStreak ?? 0

  return (
    <AppLayout>
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate('/habits')}
            className="flex items-center gap-1.5 font-hand text-sm text-ink/50 hover:text-ink transition-colors"
          >
            <ArrowLeft size={16} strokeWidth={2.5} /> all habits
          </button>

          <button
            onClick={() => setInterrogating(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 font-hand text-sm text-ink/40 hover:text-accent hover:bg-[#fff0f0] border border-transparent hover:border-accent/30 rounded transition-colors"
          >
            <Trash2 size={14} strokeWidth={2.5} /> delete habit
          </button>
        </div>

        <h1 className="font-marker text-3xl font-bold text-ink mb-1">{habit.title}</h1>
        <p className="font-hand text-sm text-ink/40">
          Tracking since {formatCreated(effectiveStart)} · {daysSinceCreation} day
          {daysSinceCreation !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard
          icon={Flame}
          label="Current Streak"
          value={`${currentStreak}d`}
          color={currentStreak > 0 ? 'text-accent' : 'text-ink'}
        />
        <StatCard icon={TrendingUp} label="Longest Streak" value={`${longestStreak}d`} />
        <StatCard icon={Target} label="Total" value={totalCompletions} />
        <StatCard icon={Calendar} label="Completion Rate" value={`${completionRate}%`} />
      </div>

      {/* Completion rate bar */}
      <Card className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <p className="font-marker text-base font-bold text-ink">Overall completion rate</p>
          <span className="font-hand text-sm text-ink/50">
            {totalCompletions} / {daysSinceCreation} days
          </span>
        </div>
        <ProgressBar value={completionRate} max={100} color="#4caf50" />
        <p className="font-hand text-xs text-ink/30 mt-2">
          {completionRate >= 80
            ? 'Outstanding consistency!'
            : completionRate >= 50
              ? 'Good progress, keep going.'
              : 'Every day counts — keep building.'}
        </p>
      </Card>

      {/* Completion history calendar */}
      <Card className="mb-6">
        <p className="font-marker text-base font-bold text-ink mb-4">
          Completion history
          <span className="font-hand text-xs font-normal text-ink/40 ml-2">(last 90 days)</span>
        </p>
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : (
          <MonthGroupedHistory dates={logs?.dates ?? []} />
        )}
      </Card>

      {/* Proof history */}
      {habit.requires_proof && (
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Camera size={16} strokeWidth={2.5} className="text-[#1976d2]" />
            <p className="font-marker text-base font-bold text-ink">Proof History</p>
          </div>
          {loading ? (
            <div className="flex justify-center py-8">
              <Spinner size="sm" />
            </div>
          ) : (
            <ProofHistorySection proofs={proofs} />
          )}
        </Card>
      )}

      {interrogating && (
        <InterrogatorModal
          entityType="habit"
          entityName={habit.title}
          onConfirm={() => {
            setInterrogating(false)
            handleDelete()
          }}
          onCancel={() => setInterrogating(false)}
        />
      )}
    </AppLayout>
  )
}
