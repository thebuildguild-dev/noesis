import { radius } from '../../utils/styles.js'

const baseClass = [
  'w-full border-2 border-ink bg-white px-4 py-3',
  'font-hand text-ink placeholder:text-ink/40',
  'focus:outline-none focus:border-pen-blue focus:ring-2 focus:ring-pen-blue/20',
  'transition-colors duration-100'
].join(' ')

export function Input({ className = '', ...props }) {
  return (
    <input
      style={{ borderRadius: radius.input }}
      className={`${baseClass} ${className}`}
      {...props}
    />
  )
}

export function Textarea({ className = '', rows = 4, ...props }) {
  return (
    <textarea
      rows={rows}
      style={{ borderRadius: radius.input }}
      className={`${baseClass} resize-none ${className}`}
      {...props}
    />
  )
}
