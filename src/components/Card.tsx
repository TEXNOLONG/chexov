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
        'rounded-2xl border border-[#342920] bg-[var(--surface)] p-4 shadow-sm',
        onClick && 'cursor-pointer transition hover:border-[var(--accent)] active:scale-[0.99]',
        className,
      )}
    >
      {children}
    </div>
  )
}
