import { radius } from '../../utils/styles.js'

/**
 * Animated skeleton placeholder card — render instead of real content while loading.
 * @param {{ lines?: number, className?: string }} props
 */
export function SkeletonCard({ lines = 2, className = '' }) {
  return (
    <div
      className={`border-2 border-ink bg-paper p-4 ${className}`}
      style={{ borderRadius: radius.wobblyCard, boxShadow: '3px 3px 0px 0px rgba(45,45,45,0.12)' }}
    >
      <div className="animate-pulse space-y-3">
        <div className="h-4 bg-muted rounded w-3/4" />
        {Array.from({ length: lines - 1 }).map((_, i) => (
          <div key={i} className="h-3 bg-muted rounded" style={{ width: `${85 - i * 15}%` }} />
        ))}
      </div>
    </div>
  )
}

/**
 * A skinny inline skeleton line — use inside larger loading states.
 */
export function SkeletonLine({ width = 'w-24', height = 'h-4' }) {
  return <div className={`animate-pulse bg-muted rounded ${width} ${height}`} />
}
