import { radius } from '../../utils/styles.js'

const variants = {
  primary: {
    base: 'bg-white text-ink border-ink',
    hover:
      'hover:bg-accent hover:text-white hover:border-accent hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px]',
    active: 'active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
    shadow: 'shadow-hard'
  },
  secondary: {
    base: 'bg-muted text-ink border-ink',
    hover:
      'hover:bg-pen-blue hover:text-white hover:border-pen-blue hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px]',
    active: 'active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
    shadow: 'shadow-hard'
  },
  ghost: {
    base: 'bg-transparent text-ink border-transparent',
    hover: 'hover:bg-muted hover:border-ink',
    active: 'active:bg-muted',
    shadow: ''
  },
  danger: {
    base: 'bg-white text-accent border-accent',
    hover:
      'hover:bg-accent hover:text-white hover:shadow-hard-sm hover:translate-x-[2px] hover:translate-y-[2px]',
    active: 'active:shadow-none active:translate-x-[4px] active:translate-y-[4px]',
    shadow: 'shadow-[4px_4px_0px_0px_#ff4d4d]'
  }
}

const sizes = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg'
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled,
  ...props
}) {
  const v = variants[variant]
  return (
    <button
      style={{ borderRadius: radius.btn }}
      disabled={disabled}
      className={[
        'font-hand font-medium border-2 transition-all duration-100 cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        v.base,
        v.hover,
        v.active,
        v.shadow,
        sizes[size],
        className
      ].join(' ')}
      {...props}
    >
      {children}
    </button>
  )
}
