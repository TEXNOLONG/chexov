import type { ReactNode } from 'react'
import { cn } from '../utils'

interface Props {
  children: ReactNode
  className?: string
  onClick?: () => void
  variant?: 'default' | 'accent' | 'ghost' | 'danger'
  disabled?: boolean
  type?: 'button' | 'submit'
}

const variants = {
  default: 'bg-[var(--surface-2)] text-[var(--text)] border border-[var(--border)] hover:border-[var(--muted)]',
  accent: 'bg-[var(--accent)] text-[#0f0c09] font-semibold hover:opacity-90',
  ghost: 'bg-transparent text-[var(--muted)] border border-transparent hover:text-[var(--text)]',
  danger: 'bg-[#3a1e1e] text-[#ffb4b4] border border-[#5a2828] hover:bg-[#4a2424]',
}

export function Button({
  children,
  className,
  onClick,
  variant = 'default',
  disabled,
  type = 'button',
}: Props) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm transition-all active:scale-[0.97] disabled:opacity-40',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}
