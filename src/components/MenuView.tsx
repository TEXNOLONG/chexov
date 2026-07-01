import { useMemo, useState } from 'react'
import menuData from '../data/menu.json'
import type { MenuItem } from '../types'
import { formatPrice, groupMenuByCategory } from '../utils'
import { Card } from './Card'

const menu = menuData as MenuItem[]

interface Props {
  onPickItem?: (item: MenuItem) => void
  selectable?: boolean
}

export function MenuView({ onPickItem, selectable }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<string>('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const categories = useMemo(() => ['all', ...new Set(menu.map((m) => m.category))], [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return menu.filter((item) => {
      const matchCategory = category === 'all' || item.category === category
      if (!matchCategory) return false
      if (!q) return true
      return (
        item.name.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.composition.toLowerCase().includes(q) ||
        item.allergens.toLowerCase().includes(q)
      )
    })
  }, [query, category])

  const filteredGrouped = useMemo(() => groupMenuByCategory(filtered), [filtered])

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-10 space-y-3 bg-[var(--bg)] pb-2 pt-1">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Поиск по блюдам, составу, аллергенам..."
          className="w-full rounded-xl border border-[#342920] bg-[var(--surface)] px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
        />
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs ${
                category === cat
                  ? 'bg-[var(--accent)] text-[#1a1410]'
                  : 'bg-[var(--surface-2)] text-[var(--muted)]'
              }`}
            >
              {cat === 'all' ? 'Все' : cat}
            </button>
          ))}
        </div>
      </div>

      {category === 'all' ? (
        [...filteredGrouped.entries()].map(([cat, items]) => (
          <section key={cat}>
            <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">{cat}</h3>
            <div className="space-y-2">{items.map((item) => renderItem(item))}</div>
          </section>
        ))
      ) : (
        <div className="space-y-2">{filtered.map((item) => renderItem(item))}</div>
      )}

      {!filtered.length && (
        <Card>
          <p className="text-center text-[var(--muted)]">Ничего не найдено</p>
        </Card>
      )}
    </div>
  )

  function renderItem(item: MenuItem) {
    const expanded = expandedId === item.id
    return (
      <Card
        key={item.id}
        onClick={
          selectable && onPickItem
            ? () => onPickItem(item)
            : () => setExpandedId(expanded ? null : item.id)
        }
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="font-medium leading-snug">{item.name}</div>
            <div className="mt-1 text-xs text-[var(--muted)]">{item.category}</div>
          </div>
          <div className="shrink-0 text-right">
            <div className="font-semibold text-[var(--accent)]">
              {item.price > 0 ? formatPrice(item.price) : '—'}
            </div>
            {selectable && <div className="mt-1 text-xs text-[var(--muted)]">+ добавить</div>}
          </div>
        </div>

        {(expanded || selectable) && (
          <div className="mt-3 space-y-2 border-t border-[#342920] pt-3 text-sm text-[var(--muted)]">
            {item.description && <p>{item.description}</p>}
            {item.composition && (
              <div>
                <div className="mb-1 text-xs uppercase text-[var(--accent)]">Состав</div>
                <p className="whitespace-pre-wrap">{item.composition}</p>
              </div>
            )}
            {item.allergens && (
              <div>
                <div className="mb-1 text-xs uppercase text-[var(--warning)]">Аллергены</div>
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
