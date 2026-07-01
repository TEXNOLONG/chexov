import type { ReactNode } from 'react'
import type { Tab } from '../types'
import { cn } from '../utils'

const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
  {
    id: 'tables',
    label: 'Столы',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[22px] h-[22px]">
        <rect x="3" y="11" width="18" height="2" rx="1" strokeLinecap="round"/>
        <path d="M6 13v6M18 13v6M6 7v4M18 7v4" strokeLinecap="round"/>
        <rect x="4" y="5" width="16" height="4" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'menu',
    label: 'Меню',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[22px] h-[22px]">
        <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round"/>
        <rect x="9" y="3" width="6" height="4" rx="1.5"/>
        <path d="M9 12h6M9 16h4" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'ai',
    label: 'AI',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[22px] h-[22px]">
        <path d="M12 2a4 4 0 014 4v1h1a2 2 0 012 2v2a2 2 0 01-2 2h-1v1a4 4 0 01-8 0v-1H7a2 2 0 01-2-2V9a2 2 0 012-2h1V6a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9.5" cy="9.5" r="0.8" fill="currentColor" stroke="none"/>
        <circle cx="14.5" cy="9.5" r="0.8" fill="currentColor" stroke="none"/>
        <path d="M9 13.5s1 1.5 3 1.5 3-1.5 3-1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Смена',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-[22px] h-[22px]">
        <path d="M4 20h16M4 20V10l6-6 4 4 6-4v16" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 glass border-t border-[var(--border)]"
      style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
    >
      <div className="mx-auto grid max-w-3xl grid-cols-4 px-2 pt-1.5 pb-0.5">
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className="relative flex flex-col items-center gap-1.5 py-1.5 px-1 transition-all duration-200"
              style={{ WebkitTapHighlightColor: 'transparent' }}
            >
              {/* Active pill background */}
              {isActive && (
                <span
                  className="absolute inset-x-2 top-0.5 bottom-0.5 rounded-2xl"
                  style={{
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--border-accent)',
                    boxShadow: '0 0 14px var(--accent-glow)',
                  }}
                />
              )}

              <span
                className={cn(
                  'relative z-10 transition-all duration-200',
                  isActive ? 'text-[var(--accent)] scale-105' : 'text-[var(--muted)]',
                )}
              >
                {tab.icon}
              </span>

              <span
                className={cn(
                  'relative z-10 text-[10px] font-bold leading-none tracking-wide transition-all duration-200',
                  isActive ? 'text-[var(--accent)] opacity-100' : 'text-[var(--muted)] opacity-60',
                )}
              >
                {tab.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
