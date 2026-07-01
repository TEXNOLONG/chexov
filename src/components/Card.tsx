import type { ReactNode } from 'react'
import { cn } from '../utils'

export function Card({
  children,
  className,
  onClick,
  padding = true,
}: {
  children: ReactNode
  className?: string
  onClick?: () => void
  padding?: boolean
}) {
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'block w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] transition-all duration-200',
        padding && 'p-4',
        onClick && 'cursor-pointer active:scale-[0.98] text-left',
        className,
      )}
    >
      {children}
    </Tag>
  )
}
