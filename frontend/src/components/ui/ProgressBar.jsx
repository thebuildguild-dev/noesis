import { radius } from '../../utils/styles.js'

/**
 * Animated horizontal progress bar.
 * @param {{ value: number, max?: number, color?: string, className?: string }} props
 * value/max expressed as numbers; percentage = (value/max)*100.
 */
export function ProgressBar({ value = 0, max = 100, color = '#4caf50', className = '' }) {
  const pct = max === 0 ? 0 : Math.min(100, Math.round((value / max) * 100))

  return (
    <div
      className={`w-full bg-muted h-2.5 overflow-hidden ${className}`}
      style={{ borderRadius: radius.btn }}
    >
      <div
        className="h-full transition-all duration-700 ease-out"
        style={{ width: `${pct}%`, backgroundColor: color, borderRadius: radius.btn }}
      />
    </div>
  )
}
