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
  default: 'bg-[var(--surface-2)] text-[var(--text)] border border-[#3d3128]',
  accent: 'bg-[var(--accent)] text-[#1a1410] font-semibold',
  ghost: 'bg-transparent text-[var(--muted)] border border-transparent',
  danger: 'bg-[#4a2424] text-[#ffb4b4] border border-[#6b3333]',
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
        'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm transition active:scale-[0.98] disabled:opacity-40',
        variants[variant],
        className,
      )}
    >
      {children}
    </button>
  )
}
