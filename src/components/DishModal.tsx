import { useEffect } from 'react'
import type { MenuItem } from '../types'
import { formatPrice } from '../utils'

const DRINK_CATS = new Set([
  'Спецпредложение Бар', 'Игристые вина', 'Белые вина', 'Красные вина', 'Розовые вина',
  'Пиво на кране', 'Русский крафт', 'Пенное импорт', 'Крепкие напитки', 'Виски', 'Водка',
  'Ликёры', 'Коньяк/Бренди', 'Авторская коктейльная карта', 'Твист на классику',
  'Авторские настойки', 'Соки/Вода', 'Свежевыжатые соки', 'Лимонады', 'Чаи', 'Авторские чаи',
  'Прочее',
])

interface Props {
  item: MenuItem
  onClose: () => void
  onAdd?: (item: MenuItem) => void
}

export function DishModal({ item, onClose, onAdd }: Props) {
  const isDrink = DRINK_CATS.has(item.category)

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      {/* Sheet */}
      <div
        className="relative w-full max-h-[92dvh] overflow-y-auto rounded-t-[28px] overscroll-contain"
        style={{
          background: 'var(--surface)',
          animation: 'sheetUp 0.32s cubic-bezier(0.32,1,0.45,1) both',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--surface-3)' }} />
        </div>

        {/* Image */}
        <div className="relative mx-4 mt-2 overflow-hidden rounded-2xl" style={{ aspectRatio: '16/9' }}>
          {item.image ? (
            <>
              <img
                src={item.image}
                alt={item.name}
                className="w-full h-full object-cover"
              />
              {/* gradient bottom overlay */}
              <div
                className="absolute inset-x-0 bottom-0 h-1/2"
                style={{ background: 'linear-gradient(to top, rgba(19,16,9,0.9), transparent)' }}
              />
              {/* Price badge on image */}
              <div
                className="absolute bottom-3 right-3 px-3 py-1.5 rounded-xl font-black text-base"
                style={{
                  background: isDrink ? 'rgba(0,100,180,0.85)' : 'rgba(212,165,116,0.95)',
                  color: isDrink ? '#e0f0ff' : '#0a0806',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {item.price > 0 ? formatPrice(item.price) : '—'}
              </div>
            </>
          ) : (
            <div
              className="w-full h-full flex items-center justify-center text-6xl"
              style={{ background: 'var(--surface-2)' }}
            >
              {isDrink ? '🍷' : '🍽'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="px-4 pt-4 pb-6 space-y-4">
          {/* Header */}
          <div>
            <div className="flex items-start justify-between gap-3">
              <h2 className="text-xl font-black leading-snug flex-1" style={{ color: 'var(--text)' }}>
                {item.name}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-sm font-bold"
                style={{ background: 'var(--surface-3)', color: 'var(--muted)' }}
              >
                ✕
              </button>
            </div>
            <span
              className="inline-block mt-1.5 px-2.5 py-1 rounded-full text-xs font-semibold"
              style={{ background: isDrink ? 'rgba(0,100,180,0.15)' : 'var(--accent-soft)', color: isDrink ? '#9fc5e8' : 'var(--accent)' }}
            >
              {item.category}
            </span>
          </div>

          {/* Description */}
          {item.description && (
            <div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                {item.description}
              </p>
            </div>
          )}

          {/* Divider */}
          {(item.composition || item.allergens) && (
            <div className="h-px" style={{ background: 'var(--border)' }} />
          )}

          {/* Composition */}
          {item.composition && (
            <div
              className="rounded-2xl p-4 space-y-1.5"
              style={{ background: 'var(--surface-2)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-4 h-4 flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4" style={{ color: 'var(--accent)' }}>
                    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" strokeLinecap="round"/>
                    <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round"/>
                    <path d="M9 12h6M9 16h4" strokeLinecap="round"/>
                  </svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
                  Состав
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {item.composition}
              </p>
            </div>
          )}

          {/* Allergens */}
          {item.allergens && (
            <div
              className="rounded-2xl p-4"
              style={{ background: 'rgba(224,176,48,0.08)', border: '1px solid rgba(224,176,48,0.2)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-base">⚠️</span>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--warning)' }}>
                  Аллергены
                </span>
              </div>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
                {item.allergens}
              </p>
            </div>
          )}

          {/* Add button */}
          {onAdd && (
            <button
              type="button"
              onClick={() => { onAdd(item); onClose() }}
              className="w-full btn btn-accent"
              style={{ fontSize: '1rem', padding: '0.875rem' }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} className="w-5 h-5">
                <path d="M12 5v14M5 12h14" strokeLinecap="round"/>
              </svg>
              Добавить в заказ — {item.price > 0 ? formatPrice(item.price) : '—'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
