import { useEffect, useState } from 'react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { Brain } from 'lucide-react'
import { useInsightsStore } from '../../store/insights.store.js'
import { AppLayout } from '../../components/layout/AppLayout.jsx'
import { PageHeader } from '../../components/layout/PageHeader.jsx'
import { Card } from '../../components/ui/Card.jsx'
import { SkeletonCard } from '../../components/ui/SkeletonCard.jsx'

const POSITIVE_SENTIMENTS = new Set([
  'positive',
  'happy',
  'excited',
  'motivated',
  'calm',
  'content',
  'joyful',
  'grateful',
  'optimistic',
  'peaceful',
  'confident',
  'energetic',
  'hopeful'
])
const NEGATIVE_SENTIMENTS = new Set([
  'negative',
  'sad',
  'anxious',
  'stressed',
  'angry',
  'tired',
  'overwhelmed',
  'frustrated',
  'depressed',
  'worried',
  'fearful',
  'exhausted',
  'upset'
])

function getSentimentColor(sentiment) {
  if (!sentiment) return '#d1d5db'
  const lower = sentiment.toLowerCase()
  if (POSITIVE_SENTIMENTS.has(lower)) return '#4ade80'
  if (NEGATIVE_SENTIMENTS.has(lower)) return '#f87171'
  return '#fbbf24'
}

function getSentimentScore(sentiment) {
  if (!sentiment) return 3
  const lower = sentiment.toLowerCase()
  if (POSITIVE_SENTIMENTS.has(lower)) return 5
  if (NEGATIVE_SENTIMENTS.has(lower)) return 1
  return 3
}

function getLast14Days() {
  const days = []
  for (let i = 13; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push(d.toISOString().slice(0, 10))
  }
  return days
}

function formatShortDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function buildWeeklySummary(entries, themeCounts) {
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - 7)
  const cutoffStr = cutoff.toISOString().slice(0, 10)

  const weekEntries = entries.filter((e) => e.date >= cutoffStr)
  if (weekEntries.length === 0) return null

  const counts = { positive: 0, negative: 0, neutral: 0 }
  const sentimentLabels = []

  for (const e of weekEntries) {
    if (!e.sentiment) continue
    const lower = e.sentiment.toLowerCase()
    sentimentLabels.push(e.sentiment)
    if (POSITIVE_SENTIMENTS.has(lower)) counts.positive++
    else if (NEGATIVE_SENTIMENTS.has(lower)) counts.negative++
    else counts.neutral++
  }

  const total = weekEntries.length
  const dominant =
    counts.positive >= counts.negative && counts.positive >= counts.neutral
      ? 'positive'
      : counts.negative >= counts.neutral
        ? 'challenging'
        : 'balanced'

  const uniqueSentiments = [...new Set(sentimentLabels)].slice(0, 3)
  const topThemes = Object.entries(themeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([t]) => t)

  const moodPhrase =
    dominant === 'positive'
      ? 'leaning positive'
      : dominant === 'challenging'
        ? 'carrying some weight'
        : 'fairly balanced'

  let summary = `Over the past 7 days you made ${total} journal ${total === 1 ? 'entry' : 'entries'}, with your mood ${moodPhrase}.`

  if (uniqueSentiments.length > 0) {
    summary += ` Your emotional range included ${uniqueSentiments.join(', ').toLowerCase()}.`
  }

  if (topThemes.length > 0) {
    const themeList =
      topThemes.length === 1
        ? topThemes[0]
        : topThemes.slice(0, -1).join(', ') + ' and ' + topThemes[topThemes.length - 1]
    summary += ` The themes that came up most were ${themeList}.`
  }

  if (dominant === 'positive') {
    summary += ' Keep the momentum going.'
  } else if (dominant === 'challenging') {
    summary += ' Be kind to yourself this week.'
  } else {
    summary += ' A steady week overall.'
  }

  return summary
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const entry = payload[0]?.payload
  const mood = entry?.sentiment
  return (
    <div className="bg-white border-2 border-ink p-3 shadow-hard-muted font-hand text-sm">
      <p className="font-bold text-ink">{formatShortDate(label)}</p>
      <p className="text-ink/70">
        Mood:{' '}
        <span className="font-semibold capitalize" style={{ color: mood ? '#ff4d4d' : '#1F2933' }}>
          {mood ?? 'No data'}
        </span>
      </p>
    </div>
  )
}

export default function InsightsPage() {
  const { entries, themeCounts, loading, error, fetchInsights } = useInsightsStore()
  const [selectedDate, setSelectedDate] = useState(null)

  useEffect(() => {
    fetchInsights()
  }, [])

  const days = getLast14Days()

  const entryByDate = {}
  for (const e of entries) {
    entryByDate[e.date] = e
  }

  const chartData = days.map((date) => {
    const entry = entryByDate[date]
    return {
      date,
      score: entry ? getSentimentScore(entry.sentiment) : null,
      sentiment: entry?.sentiment ?? null
    }
  })

  const sortedThemes = Object.entries(themeCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8)

  const weeklySummary = buildWeeklySummary(entries, themeCounts)
  const selectedEntry = selectedDate ? entryByDate[selectedDate] : null

  return (
    <AppLayout>
      <PageHeader title="Mood Insights" subtitle="your emotional landscape" />

      {loading ? (
        <div className="flex flex-col gap-4">
          <SkeletonCard lines={4} />
          <SkeletonCard lines={3} />
        </div>
      ) : error ? (
        <Card>
          <p className="font-hand text-accent text-center py-8">{error}</p>
        </Card>
      ) : entries.length === 0 ? (
        <Card>
          <div className="text-center py-16">
            <p className="font-marker text-5xl text-ink/40 mb-4">✦</p>
            <p className="font-marker text-2xl text-ink mb-2">no mood data yet</p>
            <p className="font-hand text-ink">
              Write journal entries and AI will analyze your emotional trends.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-6">
          {/* Weekly Summary */}
          {weeklySummary && (
            <Card decoration="tape" yellow>
              <p className="font-hand text-xs text-ink uppercase tracking-wide mb-2">
                Weekly Summary
              </p>
              <p className="font-hand text-base text-ink leading-relaxed">{weeklySummary}</p>
            </Card>
          )}

          {/* Mood Trend Chart */}
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Brain size={16} strokeWidth={2.5} className="text-pen-blue" />
              <h2 className="font-marker text-lg font-bold text-ink">Mood Trend</h2>
              <span className="font-hand text-xs text-ink ml-1">last 14 days</span>
            </div>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 8, bottom: 4, left: -20 }}>
                  <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(v) => {
                      const d = new Date(v + 'T00:00:00')
                      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    }}
                    tick={{ fontFamily: 'inherit', fontSize: 11, fill: '#1F2933' }}
                    interval={3}
                  />
                  <YAxis
                    domain={[0, 6]}
                    ticks={[1, 3, 5]}
                    tickFormatter={(v) => (v === 1 ? 'Low' : v === 3 ? 'Mid' : 'High')}
                    tick={{ fontFamily: 'inherit', fontSize: 11, fill: '#1F2933' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#ff4d4d"
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeOpacity={0.9}
                    dot={{ r: 5, fill: '#ff4d4d', stroke: '#fff', strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: '#ff4d4d', stroke: '#fff', strokeWidth: 2 }}
                    connectNulls={false}
                    isAnimationActive={true}
                    animationDuration={900}
                    animationEasing="ease-in-out"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Mood Calendar */}
          <Card>
            <h2 className="font-marker text-lg font-bold text-ink mb-4">Mood Calendar</h2>
            <div className="grid grid-cols-7 gap-2">
              {days.map((date) => {
                const entry = entryByDate[date]
                const color = getSentimentColor(entry?.sentiment)
                const isSelected = selectedDate === date
                const dayNum = new Date(date + 'T00:00:00').getDate()
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(isSelected ? null : date)}
                    title={entry ? `${date}: ${entry.sentiment}` : date}
                    className={[
                      'relative flex flex-col items-center justify-center aspect-square rounded border-2 transition-all',
                      isSelected
                        ? 'border-ink shadow-hard-sm'
                        : 'border-transparent hover:border-ink/30'
                    ].join(' ')}
                    style={{ backgroundColor: entry ? color : '#f3f4f6' }}
                  >
                    <span className="font-hand text-xs font-bold text-ink">{dayNum}</span>
                  </button>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-dashed border-muted">
              {[
                { color: '#4ade80', label: 'Positive' },
                { color: '#fbbf24', label: 'Neutral' },
                { color: '#f87171', label: 'Negative' },
                { color: '#f3f4f6', label: 'No entry' }
              ].map(({ color, label }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <div
                    className="w-3 h-3 rounded-sm border border-ink/20"
                    style={{ backgroundColor: color }}
                  />
                  <span className="font-hand text-xs text-ink">{label}</span>
                </div>
              ))}
            </div>

            {/* Selected date detail */}
            {selectedDate && (
              <div className="mt-4 p-3 border-2 border-dashed border-muted rounded-lg">
                <p className="font-marker text-sm font-bold text-ink mb-1">
                  {formatShortDate(selectedDate)}
                </p>
                {selectedEntry ? (
                  <>
                    <p className="font-hand text-sm text-ink mb-2">
                      Mood:{' '}
                      <span
                        className="font-bold"
                        style={{ color: getSentimentColor(selectedEntry.sentiment) }}
                      >
                        {selectedEntry.sentiment}
                      </span>
                    </p>
                    {selectedEntry.themes?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {selectedEntry.themes.map((t) => (
                          <span
                            key={t}
                            className="font-hand text-xs px-2 py-0.5 border border-ink rounded-full text-ink"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <p className="font-hand text-sm text-ink">No journal entry on this day.</p>
                )}
              </div>
            )}
          </Card>

          {/* Top Themes */}
          {sortedThemes.length > 0 && (
            <Card>
              <h2 className="font-marker text-lg font-bold text-ink mb-4">Top Themes</h2>
              <div className="flex flex-col gap-2">
                {sortedThemes.map(([theme, count]) => {
                  const maxCount = sortedThemes[0][1]
                  const pct = Math.round((count / maxCount) * 100)
                  return (
                    <div key={theme} className="flex items-center gap-3">
                      <span className="font-hand text-sm text-ink w-28 shrink-0 truncate">
                        {theme}
                      </span>
                      <div className="flex-1 h-3 bg-ink/5 rounded-full border border-ink/10 overflow-hidden">
                        <div
                          className="h-full bg-pen-blue rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="font-hand text-xs text-ink w-6 text-right">{count}</span>
                    </div>
                  )
                })}
              </div>
            </Card>
          )}
        </div>
      )}
    </AppLayout>
  )
}
