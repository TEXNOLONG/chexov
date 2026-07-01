import { useMemo, useState } from 'react'
import menuData from '../data/menu.json'
import type { MenuItem } from '../types'
import { formatPrice, groupMenuByCategory } from '../utils'

const menu = menuData as MenuItem[]

const DRINK_CATS = new Set([
  'Спецпредложение Бар', 'Игристые вина', 'Белые вина', 'Красные вина', 'Розовые вина',
  'Пиво на кране', 'Русский крафт', 'Пенное импорт', 'Крепкие напитки', 'Виски', 'Водка',
  'Ликёры', 'Коньяк/Бренди', 'Авторская коктейльная карта', 'Твист на классику',
  'Авторские настойки', 'Соки/Вода', 'Свежевыжатые соки', 'Лимонады', 'Чаи', 'Авторские чаи',
  'Прочее',
])

interface Props {
  onPickItem?: (item: MenuItem) => void
  selectable?: boolean
}

export function MenuView({ onPickItem, selectable }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [section, setSection] = useState<'food' | 'drinks'>('food')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const categories = useMemo(() => [...new Set(menu.map((m) => m.category))], [])
  const foodCats = useMemo(() => categories.filter((c) => !DRINK_CATS.has(c)), [categories])
  const drinkCats = useMemo(() => categories.filter((c) => DRINK_CATS.has(c)), [categories])
  const visibleCats = section === 'food' ? foodCats : drinkCats

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return menu.filter((item) => {
      if (q) {
        return (
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.composition.toLowerCase().includes(q) ||
          item.allergens.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q)
        )
      }
      const inSection = section === 'food' ? !DRINK_CATS.has(item.category) : DRINK_CATS.has(item.category)
      if (!inSection) return false
      return category === 'all' || item.category === category
    })
  }, [query, category, section])

  const filteredGrouped = useMemo(() => groupMenuByCategory(filtered), [filtered])

  function handleCategoryClick(cat: string) {
    setCategory(cat)
    setExpandedId(null)
  }

  return (
    <div className="space-y-3 pb-2">
      {/* Search bar */}
      <div className="sticky top-0 z-20 space-y-3 pt-1 pb-2"
        style={{ background: 'var(--bg)' }}>

        <div className="relative">
          <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--muted)] pointer-events-none"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
          </svg>
          <input
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCategory('all') }}
            placeholder="Поиск блюд, состава, аллергенов…"
            className="search-input"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setCategory('all') }}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-full bg-[var(--surface-3)] text-[var(--muted)] text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {/* Food / Drinks + view toggle */}
        {!query && (
          <div className="flex gap-2 items-center">
            <div className="flex flex-1 gap-1.5 p-1 rounded-2xl bg-[var(--surface-2)]">
              <button
                type="button"
                onClick={() => { setSection('food'); setCategory('all') }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  section === 'food'
                    ? 'bg-[var(--accent)] text-[#0a0806] shadow-sm'
                    : 'text-[var(--muted)]'
                }`}
              >
                🍽 Кухня
              </button>
              <button
                type="button"
                onClick={() => { setSection('drinks'); setCategory('all') }}
                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  section === 'drinks'
                    ? 'bg-[var(--accent)] text-[#0a0806] shadow-sm'
                    : 'text-[var(--muted)]'
                }`}
              >
                🍷 Бар
              </button>
            </div>

            {/* Grid/list toggle */}
            {!selectable && (
              <button
                type="button"
                onClick={() => setViewMode(v => v === 'grid' ? 'list' : 'grid')}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted)] shrink-0"
              >
                {viewMode === 'grid' ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" strokeLinecap="round"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
                  </svg>
                )}
              </button>
            )}
          </div>
        )}

        {/* Category pills */}
        {!query && (
          <div className="flex gap-2 overflow-x-auto pb-0.5 scrollbar-hide">
            <button
              type="button"
              onClick={() => handleCategoryClick('all')}
              className={`cat-pill shrink-0 ${category === 'all' ? 'cat-pill-active' : 'cat-pill-inactive'}`}
            >
              Все
            </button>
            {visibleCats.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => handleCategoryClick(cat)}
                className={`cat-pill shrink-0 ${category === cat ? 'cat-pill-active' : 'cat-pill-inactive'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center animate-fade-in">
          <div className="text-5xl">🔍</div>
          <p className="text-[var(--muted)] font-medium">Ничего не найдено</p>
          <p className="text-xs text-[var(--muted)]">Попробуйте изменить запрос</p>
        </div>
      ) : (
        [...filteredGrouped.entries()].map(([cat, items]) => (
          <section key={cat} className="animate-fade-in">
            {(query || category === 'all') && (
              <div className="flex items-center gap-2 mb-3">
                <h3 className="text-xs font-bold uppercase tracking-widest text-[var(--accent)]">{cat}</h3>
                <div className="flex-1 h-px bg-[var(--border)]" />
                <span className="text-[10px] text-[var(--muted)]">{items.length}</span>
              </div>
            )}

            {viewMode === 'grid' && !selectable ? (
              <div className="grid grid-cols-2 gap-3">
                {items.map((item, idx) => renderGridCard(item, idx))}
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item, idx) => renderListRow(item, idx))}
              </div>
            )}
          </section>
        ))
      )}
    </div>
  )

  function renderGridCard(item: MenuItem, idx: number) {
    const expanded = expandedId === item.id
    const isDrink = DRINK_CATS.has(item.category)

    return (
      <div
        key={item.id}
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-200 active:scale-[0.97]"
        style={{ animation: `fadeIn 0.3s ease-out ${Math.min(idx * 0.03, 0.3)}s both` }}
        onClick={() => setExpandedId(expanded ? null : item.id)}
      >
        {/* Image */}
        {item.image ? (
          <img
            src={item.image}
            alt={item.name}
            className="w-full aspect-[4/3] object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[4/3] flex items-center justify-center bg-[var(--surface-2)] text-3xl">
            {isDrink ? '🍷' : '🍽'}
          </div>
        )}

        {/* Info */}
        <div className="p-3">
          <div className="text-sm font-semibold leading-snug text-[var(--text)] line-clamp-2">{item.name}</div>
          <div className={`mt-1.5 text-sm font-bold ${isDrink ? 'text-[#9fc5e8]' : 'text-[var(--accent)]'}`}>
            {item.price > 0 ? formatPrice(item.price) : '—'}
          </div>

          {expanded && (
            <div className="mt-2 pt-2 border-t border-[var(--border)] space-y-1.5 animate-fade-fast">
              {item.description && (
                <p className="text-[11px] text-[var(--muted)] leading-relaxed">{item.description}</p>
              )}
              {item.allergens && (
                <div className="rounded-lg bg-[rgba(201,162,39,0.1)] px-2 py-1.5">
                  <span className="text-[10px] font-bold text-[var(--warning)] uppercase tracking-wider">⚠️ </span>
                  <span className="text-[10px] text-[var(--muted)]">{item.allergens}</span>
                </div>
              )}
            </div>
          )}

          {selectable && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onPickItem?.(item) }}
              className="mt-2 w-full btn btn-accent btn-sm"
            >
              + Добавить
            </button>
          )}
        </div>
      </div>
    )
  }

  function renderListRow(item: MenuItem, idx: number) {
    const expanded = expandedId === item.id
    const isDrink = DRINK_CATS.has(item.category)

    return (
      <div
        key={item.id}
        className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] overflow-hidden transition-all duration-200"
        style={{ animation: `fadeIn 0.25s ease-out ${Math.min(idx * 0.025, 0.25)}s both` }}
        onClick={selectable && onPickItem ? () => onPickItem(item) : () => setExpandedId(expanded ? null : item.id)}
      >
        <div className="flex items-center gap-3 p-3">
          {/* Thumbnail */}
          {item.image ? (
            <img
              src={item.image}
              alt={item.name}
              className="w-14 h-14 rounded-xl object-cover shrink-0"
              loading="lazy"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-xl shrink-0">
              {isDrink ? '🍷' : '🍽'}
            </div>
          )}

          {/* Text */}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold leading-snug">{item.name}</div>
            {!selectable && (
              <div className="text-[11px] text-[var(--muted)] mt-0.5 truncate">{item.category}</div>
            )}
          </div>

          {/* Price + action */}
          <div className="shrink-0 text-right">
            <div className={`text-sm font-bold ${isDrink ? 'text-[#9fc5e8]' : 'text-[var(--accent)]'}`}>
              {item.price > 0 ? formatPrice(item.price) : '—'}
            </div>
            {selectable ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onPickItem?.(item) }}
                className="mt-1 btn btn-accent btn-sm px-3"
              >
                +
              </button>
            ) : (
              <div className={`mt-0.5 text-[10px] transition-transform duration-200 text-[var(--muted)] ${expanded ? 'rotate-180' : ''}`}>
                ▾
              </div>
            )}
          </div>
        </div>

        {/* Expanded details */}
        {expanded && !selectable && (
          <div className="px-3 pb-3 pt-0 space-y-2 border-t border-[var(--border)] animate-fade-fast">
            {item.description && (
              <p className="text-xs text-[var(--muted)] leading-relaxed pt-2">{item.description}</p>
            )}
            {item.composition && (
              <div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--accent)] mb-1">Состав</div>
                <p className="text-xs text-[var(--muted)] leading-relaxed">{item.composition}</p>
              </div>
            )}
            {item.allergens && (
              <div className="rounded-xl bg-[rgba(201,162,39,0.08)] px-3 py-2 border border-[rgba(201,162,39,0.15)]">
                <div className="text-[10px] font-bold uppercase tracking-widest text-[var(--warning)] mb-0.5">⚠️ Аллергены</div>
                <p className="text-xs text-[var(--muted)]">{item.allergens}</p>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }
}

export { menu }
