const colors = {
  default: 'bg-muted text-ink border-ink',
  accent: 'bg-accent text-white border-accent',
  blue: 'bg-pen-blue text-white border-pen-blue',
  green: 'bg-[#4caf50] text-white border-[#4caf50]',
  yellow: 'bg-[#fff9c4] text-ink border-ink'
}

export function Badge({ children, color = 'default', className = '' }) {
  return (
    <span
      style={{ borderRadius: '4px 8px 6px 4px / 6px 4px 8px 6px' }}
      className={[
        'inline-flex items-center gap-1 px-2.5 py-0.5 text-sm font-hand font-medium border',
        colors[color],
        className
      ].join(' ')}
    >
      {children}
    </span>
  )
}
