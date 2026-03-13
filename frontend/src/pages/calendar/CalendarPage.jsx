import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
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

function cellBg(count, totalHabits, hasJournal) {
  if (!count && !hasJournal) return ''
  if (!count && hasJournal) return 'bg-pen-blue/30'
  const max = Math.max(1, totalHabits)
  const ratio = count / max
  if (ratio < 0.34) return 'bg-[#4caf50]/25'
  if (ratio < 0.67) return 'bg-[#4caf50]/55'
  return 'bg-[#4caf50]/85'
}

function formatDayHeader(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
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

function stripHtml(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function previewText(content, max = 120) {
  const text = /<[a-z][\s\S]*>/i.test(content) ? stripHtml(content) : content
  return text.length > max ? text.slice(0, max) + '...' : text
}

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const { habits } = useHabitsStore()
  const totalHabits = habits.length

  const today = new Date()
  const todayStr = localDateStr(today)
  const [viewYear, setViewYear] = useState(today.getFullYear())
  const [viewMonth, setViewMonth] = useState(today.getMonth())

  const [activityMap, setActivityMap] = useState({})
  const [allJournalDates, setAllJournalDates] = useState(new Set())
  const [loadingActivity, setLoadingActivity] = useState(false)

  const isInitialMount = useRef(true)
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [dayHabits, setDayHabits] = useState([])
  const [dayJournal, setDayJournal] = useState([])
  const [loadingDay, setLoadingDay] = useState(false)

  // Fetch journal entry dates once on mount — use local dates for coloring
  useEffect(() => {
    journalApi
      .getJournalEntries({ page: 1, limit: 100 })
      .then(({ data }) => {
        const dates = new Set(data.entries.map((e) => localDateStr(new Date(e.created_at))))
        setAllJournalDates(dates)
      })
      .catch(() => {})
  }, [])

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

  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay()
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()

  const cells = [
    ...Array(firstDayOfWeek).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1)
  ]

  return (
    <AppLayout>
      <PageHeader title="History" subtitle="Browse your daily activity" />

      <div className="grid lg:grid-cols-[1fr_320px] gap-6">
        {/* Calendar */}
        <Card>
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

          <div className="grid grid-cols-7 mb-2">
            {DAY_LABELS.map((d) => (
              <div key={d} className="text-center font-hand text-xs text-ink/40 py-1">
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, i) => {
              if (!day) return <div key={`pad-${i}`} />
              const dateStr = toDateStr(viewYear, viewMonth, day)
              const count = activityMap[dateStr] ?? 0
              const hasJournal = allJournalDates.has(dateStr)
              const isToday = dateStr === todayStr
              const isSelected = dateStr === selectedDate
              const isFuture = dateStr > todayStr
              const bg = isFuture ? '' : cellBg(count, totalHabits, hasJournal)
              const hasActivity = count > 0 || hasJournal

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
                          : hasActivity
                            ? 'text-ink'
                            : 'text-ink/40'
                    ].join(' ')}
                  >
                    {day}
                  </span>
                  {!isFuture && (count > 0 || hasJournal) && (
                    <span className="flex items-center gap-0.5 leading-none mt-0.5">
                      {count > 0 && (
                        <span className="font-hand text-[9px] text-[#4caf50]">{count}✓</span>
                      )}
                      {hasJournal && <span className="font-hand text-[9px] text-pen-blue">✎</span>}
                    </span>
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

          <div className="flex items-center gap-3 mt-4 pt-3 border-t border-dashed border-muted">
            <div className="flex items-center gap-1.5">
              <div className="w-4 h-4 rounded-sm border border-ink/10 bg-muted/40" />
              <div className="w-4 h-4 rounded-sm border border-ink/10 bg-pen-blue/30" />
              <div className="w-4 h-4 rounded-sm border border-ink/10 bg-[#4caf50]/25" />
              <div className="w-4 h-4 rounded-sm border border-ink/10 bg-[#4caf50]/85" />
            </div>
            <span className="font-hand text-xs text-ink/30">none · journal · partial · full</span>
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
                          <button
                            key={e.id}
                            onClick={() => navigate(`/journal/${e.id}`, { state: { entry: e } })}
                            className="w-full text-left border-l-2 border-pen-blue pl-3 hover:bg-muted/30 rounded-r transition-colors"
                          >
                            <p className="font-hand text-sm text-ink leading-relaxed">
                              {previewText(e.content)}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className="font-hand text-xs text-ink/30">
                                {formatEntryTime(e.created_at)}
                              </span>
                              <span className="font-hand text-xs text-pen-blue">View Entry →</span>
                            </div>
                          </button>
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
