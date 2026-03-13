export function PageHeader({ title, subtitle }) {
  return (
    <div className="mb-8">
      <h1 className="font-marker text-4xl md:text-5xl font-bold text-ink">{title}</h1>
      {subtitle && <p className="font-hand text-lg text-ink mt-1">{subtitle}</p>}
      <div
        className="mt-3 h-[3px] w-24 bg-accent"
        style={{ borderRadius: '2px 4px 3px 1px / 3px 1px 4px 2px' }}
      />
    </div>
  )
}
