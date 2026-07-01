import { useMemo, useState } from 'react'
import menuData from '../data/menu.json'
import type { MenuItem } from '../types'
import { formatPrice, groupMenuByCategory } from '../utils'
import { Card } from './Card'

const menu = menuData as MenuItem[]

// Category groups for color-coded tabs
const DRINK_CATS = new Set([
  'Спецпредложение Бар', 'Игристые вина', 'Белые вина', 'Красные вина', 'Розовые вина',
  'Пиво на кране', 'Русский крафт', 'Пенное импорт', 'Крепкие напитки', 'Виски', 'Водка',
  'Ликёры', 'Коньяк/Бренди', 'Авторская коктейльная карта', 'Твист на классику',
  'Авторские настойки', 'Соки/Вода', 'Свежевыжатые соки', 'Лимонады', 'Чаи', 'Авторские чаи',
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

  const categories = useMemo(() => {
    const all = [...new Set(menu.map((m) => m.category))]
    return all
  }, [])

  const foodCats = useMemo(() => categories.filter((c) => !DRINK_CATS.has(c)), [categories])
  const drinkCats = useMemo(() => categories.filter((c) => DRINK_CATS.has(c)), [categories])

  const visibleCats = section === 'food' ? foodCats : drinkCats

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return menu.filter((item) => {
      const inSection = section === 'food' ? !DRINK_CATS.has(item.category) : DRINK_CATS.has(item.category)
      if (!inSection && !q) return false
      const matchCategory = category === 'all' || item.category === category
      if (!matchCategory && !q) return false
      if (!q) return matchCategory && inSection
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.composition.toLowerCase().includes(q) ||
        item.allergens.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      )
    })
  }, [query, category, section])

  const filteredGrouped = useMemo(() => groupMenuByCategory(filtered), [filtered])

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="sticky top-0 z-10 space-y-3 bg-[var(--bg)] pb-2 pt-1">
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setCategory('all')
          }}
          placeholder="Поиск по блюдам, составу, аллергенам..."
          className="w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm outline-none transition focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
        />

        {/* Food / Drinks toggle */}
        {!query && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setSection('food'); setCategory('all') }}
              className={`flex-1 rounded-2xl py-2 text-sm font-medium transition ${
                section === 'food'
                  ? 'bg-[var(--accent)] text-[#0f0c09]'
                  : 'bg-[var(--surface-2)] text-[var(--muted)]'
              }`}
            >
              🍽️ Кухня
            </button>
            <button
              type="button"
              onClick={() => { setSection('drinks'); setCategory('all') }}
              className={`flex-1 rounded-2xl py-2 text-sm font-medium transition ${
                section === 'drinks'
                  ? 'bg-[var(--accent)] text-[#0f0c09]'
                  : 'bg-[var(--surface-2)] text-[var(--muted)]'
              }`}
            >
              🍷 Бар
            </button>
          </div>
        )}

        {/* Category pills */}
        {!query && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`cat-pill shrink-0 ${category === 'all' ? 'cat-pill-active' : 'cat-pill-inactive'}`}
            >
              Все
            </button>
            {visibleCats.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`cat-pill shrink-0 ${category === cat ? 'cat-pill-active' : 'cat-pill-inactive'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      {query || category !== 'all' ? (
        <div className="space-y-2">
          {[...filteredGrouped.entries()].map(([cat, items]) => (
            <section key={cat}>
              {(query || category === 'all') && (
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">{cat}</h3>
              )}
              {items.map((item) => renderItem(item))}
            </section>
          ))}
        </div>
      ) : (
        [...filteredGrouped.entries()].map(([cat, items]) => (
          <section key={cat}>
            <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">{cat}</h3>
            <div className="space-y-2">{items.map((item) => renderItem(item))}</div>
          </section>
        ))
      )}

      {!filtered.length && (
        <div className="flex flex-col items-center gap-3 py-12 text-center">
          <div className="text-4xl">🔍</div>
          <p className="text-[var(--muted)]">Ничего не найдено</p>
        </div>
      )}
    </div>
  )

  function renderItem(item: MenuItem) {
    const expanded = expandedId === item.id
    const isDrink = DRINK_CATS.has(item.category)
    return (
      <Card
        key={item.id}
        onClick={
          selectable && onPickItem
            ? () => onPickItem(item)
            : () => setExpandedId(expanded ? null : item.id)
        }
        className="animate-fade-in"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium leading-snug">{item.name}</div>
            {!selectable && (
              <div className="mt-0.5 text-xs text-[var(--muted)]">{item.category}</div>
            )}
          </div>
          <div className="shrink-0 text-right">
            <div className={`font-semibold ${isDrink ? 'text-[#9fc5e8]' : 'text-[var(--accent)]'}`}>
              {item.price > 0 ? formatPrice(item.price) : '—'}
            </div>
            {selectable && (
              <div className="mt-1 rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-xs text-[var(--accent)]">
                + добавить
              </div>
            )}
            {!selectable && !expanded && (
              <div className="mt-1 text-xs text-[var(--muted)]">ↂ подробнее</div>
            )}
          </div>
        </div>

        {(expanded || selectable) && (
          <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3 text-sm text-[var(--muted)]">
            {item.description && <p className="leading-relaxed">{item.description}</p>}
            {item.composition && (
              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
                  Состав
                </div>
                <p className="whitespace-pre-wrap leading-relaxed">{item.composition}</p>
              </div>
            )}
            {item.allergens && (
              <div className="rounded-xl bg-[rgba(201,162,39,0.1)] px-3 py-2">
                <div className="mb-1 text-xs font-semibold uppercase tracking-widest text-[var(--warning)]">
                  ⚠️ Аллергены
                </div>
                <p>{item.allergens}</p>
              </div>
            )}
          </div>
        )}
      </Card>
    )
  }
}

export { menu }
