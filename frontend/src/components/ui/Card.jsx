import { radius } from '../../utils/styles.js'

// Tape decoration at top of card
function Tape() {
  return (
    <div
      className="absolute -top-3 left-1/2 -translate-x-1/2 w-16 h-6 bg-ink/10 border border-ink/20 rotate-[-1deg] z-10"
      style={{ borderRadius: '2px 4px 3px 2px / 3px 2px 4px 3px' }}
    />
  )
}

// Thumbtack pin at top of card
function Tack({ color = '#ff4d4d' }) {
  return (
    <div
      className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 border-2 border-ink z-10 shadow-hard-sm"
      style={{ backgroundColor: color, borderRadius: '50%' }}
    />
  )
}

export function Card({
  children,
  className = '',
  decoration = 'none',
  yellow = false,
  rotate = 0,
  ...props
}) {
  return (
    <div
      style={{
        borderRadius: radius.wobblyCard,
        transform: rotate !== 0 ? `rotate(${rotate}deg)` : undefined
      }}
      className={[
        'relative border-2 border-ink p-6',
        yellow ? 'bg-[#fff9c4]' : 'bg-white',
        'shadow-hard-muted',
        className
      ].join(' ')}
      {...props}
    >
      {decoration === 'tape' && <Tape />}
      {decoration === 'tack' && <Tack />}
      {children}
    </div>
  )
}
