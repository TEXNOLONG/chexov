import type { Tab } from '../types'
import { cn } from '../utils'

const tabs: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'tables', label: 'Столы', icon: '🪑' },
  { id: 'menu', label: 'Меню', icon: '📋' },
  { id: 'ai', label: 'AI', icon: '🤖' },
  { id: 'stats', label: 'Смена', icon: '📊' },
]

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--border)] glass px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
      <div className="mx-auto grid max-w-3xl grid-cols-4 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex flex-col items-center gap-0.5 rounded-2xl px-2 py-2 text-xs font-medium transition-all duration-200',
              active === tab.id
                ? 'bg-[var(--accent-soft)] text-[var(--accent)] scale-105'
                : 'text-[var(--muted)] hover:text-[var(--text)]',
            )}
          >
            <span className={cn('text-xl transition-transform', active === tab.id && 'drop-shadow-sm')}>
              {tab.icon}
            </span>
            <span className="leading-none">{tab.label}</span>
            {active === tab.id && (
              <span className="absolute bottom-[max(0.4rem,calc(env(safe-area-inset-bottom)+0.25rem))] h-1 w-5 rounded-full bg-[var(--accent)] opacity-70" />
            )}
          </button>
        ))}
      </div>
    </nav>
  )
}
