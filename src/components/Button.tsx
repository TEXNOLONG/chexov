import type { ReactNode } from 'react'
import { cn } from '../utils'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
  variant?: 'default' | 'accent' | 'ghost' | 'danger' | 'success'
  disabled?: boolean
  type?: 'button' | 'submit'
  size?: 'sm' | 'md'
}

const variants = {
  default: 'btn-ghost',
  accent:  'btn-accent',
  ghost:   'bg-transparent text-[var(--muted)] border border-transparent hover:text-[var(--text)]',
  danger:  'btn-danger',
  success: 'btn-success',
}

export function Button({ children, className, onClick, variant = 'default', disabled, type = 'button', size = 'md' }: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'btn',
        size === 'sm' && 'btn-sm',
        variants[variant],
        'disabled:opacity-40 disabled:pointer-events-none',
        className,
      )}
    >
      {children}
    </button>
  )
}
