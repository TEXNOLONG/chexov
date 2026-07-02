import type { ReactNode } from 'react'
import type { Tab } from '../types'

const tabs: Array<{ id: Tab; label: string; icon: ReactNode }> = [
  {
    id: 'tables',
    label: 'Столы',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <rect x="3" y="10" width="18" height="2.5" rx="1.2" strokeLinecap="round"/>
        <path d="M6.5 12.5v5.5M17.5 12.5v5.5M6.5 6v4.5M17.5 6v4.5" strokeLinecap="round"/>
        <rect x="4.5" y="4" width="15" height="3.5" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'menu',
    label: 'Меню',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
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
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M12 2a4 4 0 014 4v1h1a2 2 0 012 2v2a2 2 0 01-2 2h-1v1a4 4 0 01-8 0v-1H7a2 2 0 01-2-2V9a2 2 0 012-2h1V6a4 4 0 014-4z" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="9.5"  cy="9.5" r="0.8" fill="currentColor" stroke="none"/>
        <circle cx="14.5" cy="9.5" r="0.8" fill="currentColor" stroke="none"/>
        <path d="M9.5 13.5s.8 1.5 2.5 1.5 2.5-1.5 2.5-1.5" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'profile',
    label: 'Профиль',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round"/>
      </svg>
    ),
  },
  {
    id: 'stats',
    label: 'Смена',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
        <path d="M4 20h16M4 20V10l6-6 4 4 6-4v16" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
]

export function BottomNav({ active, onChange }: { active: Tab; onChange: (tab: Tab) => void }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-3"
      style={{ paddingBottom: 'max(0.85rem, env(safe-area-inset-bottom))' }}
    >
      <div
        className="w-full max-w-sm flex items-center rounded-[28px] px-1.5 py-1.5"
        style={{
          background: 'rgba(9,6,20,0.92)',
          backdropFilter: 'blur(32px) saturate(220%)',
          WebkitBackdropFilter: 'blur(32px) saturate(220%)',
          border: '1px solid rgba(167,139,250,0.18)',
          boxShadow: '0 8px 48px rgba(60,20,180,0.30), 0 2px 16px rgba(0,0,0,0.55), inset 0 1px 0 rgba(167,139,250,0.10)',
        }}
      >
        {tabs.map((tab) => {
          const isActive = active === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-2 px-1 rounded-[22px] transition-all duration-200"
              style={{
                background: isActive ? 'var(--accent)' : 'transparent',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span style={{ color: isActive ? '#07050e' : 'rgba(167,139,250,0.38)' }}>
                {tab.icon}
              </span>
              <span
                className="text-[9px] font-bold leading-none"
                style={{ color: isActive ? '#07050e' : 'rgba(167,139,250,0.28)' }}
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
