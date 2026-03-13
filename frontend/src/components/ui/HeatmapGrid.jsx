/**
 * GitHub-style 28-day activity heatmap grid (4 weeks × 7 days).
 *
 * @param {{ activity: Array<{ date: string, count: number }>, totalHabits?: number }} props
 */
export function HeatmapGrid({ activity = [], totalHabits = 1 }) {
  // Build a lookup: date-string → count
  const lookup = {}
  for (const { date, count } of activity) lookup[date] = count

  // Generate last 56 days ending today (8 weeks)
  const days = []
  const today = new Date()
  for (let i = 55; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(today.getDate() - i)
    const key = d.toISOString().slice(0, 10)
    days.push({ key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) })
  }

  // Intensity bucket based on count / totalHabits
  function intensity(count) {
    if (!count || count === 0) return 0
    if (totalHabits <= 1) return count >= 1 ? 3 : 0
    const ratio = count / totalHabits
    if (ratio < 0.34) return 1
    if (ratio < 0.67) return 2
    return 3
  }

  const colors = ['bg-muted/40', 'bg-pen-blue/25', 'bg-pen-blue/55', 'bg-pen-blue']
  const dayLabels = ['M', 'T', 'W', 'T', 'F', 'S', 'S']

  // Arrange into columns of 7 (each column = one week)
  const weeks = []
  for (let w = 0; w < 8; w++) weeks.push(days.slice(w * 7, w * 7 + 7))

  return (
    <div className="overflow-x-auto pb-2">
      <div className="flex gap-2">
        {/* Day-of-week labels */}
        <div className="flex flex-col gap-2 mr-2">
          {dayLabels.map((l, i) => (
            <span
              key={i}
              className="font-hand text-[11px] text-ink w-5 text-center leading-none h-5 flex items-center justify-center"
            >
              {l}
            </span>
          ))}
        </div>
        {/* Week columns */}
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-2">
            {week.map(({ key, label }) => {
              const count = lookup[key] ?? 0
              const level = intensity(count)
              return (
                <div
                  key={key}
                  title={
                    count > 0
                      ? `${label}: ${count} habit${count !== 1 ? 's' : ''} completed`
                      : label
                  }
                  className={`w-5 h-5 rounded-md border border-ink/10 transition-colors ${colors[level]} hover:opacity-80 cursor-default`}
                />
              )
            })}
          </div>
        ))}
      </div>
      <div className="flex items-center gap-1.5 mt-4">
        <span className="font-hand text-[11px] text-ink">less</span>
        {colors.map((c, i) => (
          <div key={i} className={`w-3.5 h-3.5 rounded border border-ink/10 ${c}`} />
        ))}
        <span className="font-hand text-[11px] text-ink">more</span>
      </div>
    </div>
  )
}
