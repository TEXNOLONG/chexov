import type { ReactNode } from 'react'
import { cn } from '../utils'

export function Card({
  children,
  className,
  onClick,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm',
        onClick && 'cursor-pointer transition-all hover:border-[var(--accent)] hover:shadow-md active:scale-[0.99]',
        className,
      )}
    >
      {children}
    </div>
  )
}
