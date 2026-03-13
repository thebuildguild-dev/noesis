import { useState, useEffect, useCallback, useRef } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Circle,
  BookOpen,
  CalendarDays
} from 'lucide-react'
import { useHabitsStore } from '../../store/habits.store.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { Spinner } from '../../components/ui/Spinner.jsx'
import * as habitsApi from '../../api/habits.api.js'
import * as journalApi from '../../api/journal.api.js'
import { radius } from '../../utils/styles.js'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December'
]

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

function toDateStr(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function intensityClass(count, totalHabits) {
  if (!count || count === 0) return ''
  const max = Math.max(1, totalHabits)
  const ratio = count / max
  if (ratio < 0.34) return 'bg-pen-blue/20'
  if (ratio < 0.67) return 'bg-pen-blue/45'
  return 'bg-pen-blue/75'
}

function formatDayHeader(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  })
}

function formatEntryTime(ts) {
  return new Date(ts).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  })
}

function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length
}

export default function CalendarPage() {
  const { habits } = useHabitsStore()
  const totalHabits = habits.length

  const today = new Date()
  const todayStr = today.toISOString().slice(0, 10)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth()) // 0-indexed

  const [activityMap, setActivityMap] = useState({}) // date → count
  const [loadingActivity, setLoadingActivity] = useState(false)

  const isInitialMount = useRef(true)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [dayHabits, setDayHabits] = useState([]) // { id, title, completed_on_date }
  const [dayJournal, setDayJournal] = useState([]) // journal entries
  const [loadingDay, setLoadingDay] = useState(false)

  // Fetch activity for current month view
  const fetchMonthActivity = useCallback(async (year, month) => {
    setLoadingActivity(true)
    try {
      const from = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const lastDay = new Date(year, month + 1, 0).getDate()
      const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
      const { data } = await habitsApi.getActivity({ from, to })
      const map = {}
      for (const { date, count } of data.activity) map[date] = count
      setActivityMap(map)
    } catch {
      setActivityMap({})
    } finally {
      setLoadingActivity(false)
    }
  }, [])

  useEffect(() => {
    fetchMonthActivity(viewYear, viewMonth)
    if (isInitialMount.current) {
      isInitialMount.current = false
    } else {
      setSelectedDate(null)
    }
  }, [viewYear, viewMonth, fetchMonthActivity])

  const handleDayClick = useCallback(async (dateStr) => {
    // Future dates with no activity: don't bother fetching
    setSelectedDate(dateStr)
    setDayHabits([])
    setDayJournal([])
    setLoadingDay(true)
    try {
      const [habitsRes, journalRes] = await Promise.all([
        habitsApi.getHabitsForDate(dateStr),
        journalApi.getJournalForDate(dateStr)
      ])
      setDayHabits(habitsRes.data.habits)
      setDayJournal(journalRes.data.entries)
    } catch {
      // silently ignore — show empty state
    } finally {
      setLoadingDay(false)
    }
  }, [])

  // Auto-load today's details on initial mount
  useEffect(() => {
    handleDayClick(todayStr)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear((y) => y - 1)
      setViewMonth(11)
    } else setViewMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear((y) => y + 1)
      setViewMonth(0)
    } else setViewMonth((m) => m + 1)
  }

  // Build calendar grid
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay() // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]

  return (
    <AppLayout>
      <PageHeader title="History" subtitle="browse your daily activity" />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar */}
        <Card>
          {/* Month navigation */}
          <div className="flex items-center justify-between mb-5">
            <button
              onClick={prevMonth}
              className="p-1.5 rounded hover:bg-muted transition-colors text-ink/60 hover:text-ink"
            >
              <ChevronLeft size={20} strokeWidth={2.5} />
            </button>

            <div className="text-center">
              <h2 className="font-marker text-2xl font-bold text-ink">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h2>
              {loadingActivity && (
                <div className="flex justify-center mt-1">
                  <Spinner size="sm" />
                </div>
              )}
            </div>

            <button
              onClick={nextMonth}
              className="p-1.5 rounded hover:bg-muted transition-colors text-ink/60 hover:text-ink"
              disabled={viewYear === today.getFullYear() && viewMonth === today.getMonth()}
            >
              <ChevronRight
                size={20}
                strokeWidth={2.5}
                className={
                  viewYear === today.getFullYear() && viewMonth === today.getMonth()
                    ? 'text-ink/20'
                    : ''
                }
              />
            </button>
          </div>

          {/* Day-of-week header */}
          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center font-hand text-xs text-ink/40 py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />
              const dateStr = toDateStr(viewYear, viewMonth, day)
              const count = activityMap[dateStr] ?? 0
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const isFuture = dateStr > todayStr
              const bg = isFuture ? '' : intensityClass(count, totalHabits)

              return (
                <button
                  key={day}
                  onClick={() => !isFuture && handleDayClick(dateStr)}
                  disabled={isFuture}
                  className={[
                    'relative flex flex-col items-center justify-center py-2 min-h-[44px]',
                    'border-2 transition-all duration-150',
                    isFuture ? 'opacity-25 cursor-default border-transparent' : 'cursor-pointer',
                    isSelected
                      ? 'border-accent'
                      : isToday
                        ? 'border-ink'
                        : 'border-transparent hover:border-muted',
                    bg
                  ].join(' ')}
                  style={{ borderRadius: radius.btn }}
                >
                  <span
                    className={[
                      'font-hand text-sm font-medium',
                      isSelected
                        ? 'text-accent'
                        : isToday
                          ? 'text-ink font-bold'
                          : count > 0
                            ? 'text-ink'
                            : 'text-ink/40'
                    ].join(' ')}
                  >
                    {day}
                  </span>
                  {count > 0 && !isFuture && (
                    <span className="font-hand text-[9px] text-ink/50 leading-none">{count}✓</span>
                  )}
                  {isToday && (
                    <span className="absolute top-0.5 right-1 font-hand text-[8px] text-ink/50">
                      today
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-2 mt-4 pt-3 border-t border-dashed border-muted">
            <div className="flex items-center gap-1.5">
              {['bg-muted/40', 'bg-pen-blue/20', 'bg-pen-blue/45', 'bg-pen-blue/75'].map((c, i) => (
                <div key={i} className={`w-4 h-4 rounded-sm border border-ink/10 ${c}`} />
              ))}
            </div>
            <span className="font-hand text-xs text-ink/30">fewer → more habits completed</span>
          </div>
        </Card>

        {/* Day detail panel */}
        <div>
          {!selectedDate ? (
            <Card className="h-full flex flex-col items-center justify-center py-16 text-center">
              <CalendarDays size={40} strokeWidth={1.5} className="text-ink/20 mb-3" />
              <p className="font-marker text-xl text-ink/30 mb-1">Select a day</p>
              <p className="font-hand text-sm text-ink/30">Click any date to see your activity</p>
            </Card>
          ) : (
            <Card>
              <h3 className="font-marker text-lg font-bold text-ink mb-1">
                {formatDayHeader(selectedDate)}
              </h3>
              <div className="w-8 h-0.5 bg-accent mb-4" style={{ borderRadius: radius.btn }} />

              {loadingDay ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : (
                <>
                  {/* Habits section */}
                  <div className="mb-5">
                    <p className="font-marker text-sm font-bold text-ink/50 uppercase tracking-wide mb-2.5">
                      Habits
                    </p>
                    {dayHabits.length === 0 ? (
                      <p className="font-hand text-sm text-ink/30 italic">No habits tracked yet</p>
                    ) : (
                      <div className="flex flex-col gap-1.5">
                        {dayHabits.map((h) => (
                          <div key={h.id} className="flex items-center gap-2.5">
                            {h.completed_on_date ? (
                              <CheckCircle2
                                size={16}
                                strokeWidth={2.5}
                                className="text-[#4caf50] flex-shrink-0"
                              />
                            ) : (
                              <Circle
                                size={16}
                                strokeWidth={2}
                                className="text-ink/20 flex-shrink-0"
                              />
                            )}
                            <span
                              className={`font-hand text-sm ${h.completed_on_date ? 'text-ink' : 'text-ink/40 line-through'}`}
                            >
                              {h.title}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    {dayHabits.length > 0 && (
                      <p className="font-hand text-xs text-ink/30 mt-2">
                        {dayHabits.filter((h) => h.completed_on_date).length} / {dayHabits.length}{' '}
                        completed
                      </p>
                    )}
                  </div>

                  {/* Journal section */}
                  <div>
                    <p className="font-marker text-sm font-bold text-ink/50 uppercase tracking-wide mb-2.5 flex items-center gap-1.5">
                      <BookOpen size={13} strokeWidth={2.5} /> Journal
                    </p>
                    {dayJournal.length === 0 ? (
                      <p className="font-hand text-sm text-ink/30 italic">No entry written</p>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {dayJournal.map((e) => (
                          <div key={e.id} className="border-l-2 border-pen-blue pl-3">
                            <p className="font-hand text-sm text-ink leading-relaxed line-clamp-4">
                              {e.content}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="font-hand text-xs text-ink/30">
                                {formatEntryTime(e.created_at)}
                              </span>
                              <span className="font-hand text-xs text-ink/25">
                                · {wordCount(e.content)}w
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
