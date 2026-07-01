import type { Tab } from '../types'
import { cn } from '../utils'

const tabs: Array<{ id: Tab; label: string; icon: string }> = [
  { id: 'tables', label: 'Столы', icon: '🪑' },
  { id: 'menu', label: 'Меню', icon: '📋' },
  { id: 'stats', label: 'Смена', icon: '📊' },
]

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[#342920] bg-[#120e0b]/95 px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur">
      <div className="mx-auto grid max-w-3xl grid-cols-3 gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex flex-col items-center rounded-xl px-2 py-2 text-xs transition',
              active === tab.id
                ? 'bg-[var(--accent-soft)] text-[var(--accent)]'
                : 'text-[var(--muted)]',
            )}
          >
            <span className="text-lg">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </nav>
  )
}
