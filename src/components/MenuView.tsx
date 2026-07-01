import { useMemo, useState } from 'react'
import menuData from '../data/menu.json'
import type { MenuItem } from '../types'
import { formatPrice, groupMenuByCategory } from '../utils'
import { DishModal } from './DishModal'
import { useLongPress } from '../hooks/useLongPress'

export const DRINK_CATS = new Set([
  'Спецпредложение Бар', 'Игристые вина', 'Белые вина', 'Красные вина', 'Розовые вина',
  'Пиво на кране', 'Русский крафт', 'Пенное импорт', 'Крепкие напитки', 'Виски', 'Водка',
  'Ликёры', 'Коньяк/Бренди', 'Авторская коктейльная карта', 'Твист на классику',
  'Авторские настойки', 'Соки/Вода', 'Свежевыжатые соки', 'Лимонады', 'Чаи', 'Авторские чаи',
  'Прочее',
])

export const menu = menuData as MenuItem[]

interface ControlledProps {
  // When provided, MenuView is "display-only" (no internal filter UI)
  filtered: MenuItem[]
  filteredGrouped: Map<string, MenuItem[]>
  query: string
  category: string
  viewMode: 'grid' | 'list'
  onPickItem?: (item: MenuItem) => void
  selectable?: false
}

interface SelectableProps {
  // When selectable, MenuView manages its own filter state (used in OrderPanel)
  selectable: true
  onPickItem?: (item: MenuItem) => void
  filtered?: undefined
  filteredGrouped?: undefined
  query?: undefined
  category?: undefined
  viewMode?: undefined
}

type Props = ControlledProps | SelectableProps

export function MenuView(props: Props) {
  const { selectable, onPickItem } = props

  // ── Internal state (only used when selectable) ──
  const [intQuery, setIntQuery] = useState('')
  const [intCategory, setIntCategory] = useState('all')
  const [intSection, setIntSection] = useState<'food' | 'drinks'>('food')
  const [intViewMode] = useState<'grid' | 'list'>('list') // selectable always list

  const allCats = useMemo(() => [...new Set(menu.map((m) => m.category))], [])
  const foodCats = useMemo(() => allCats.filter((c) => !DRINK_CATS.has(c)), [allCats])
  const drinkCats = useMemo(() => allCats.filter((c) => DRINK_CATS.has(c)), [allCats])
  const intVisibleCats = intSection === 'food' ? foodCats : drinkCats

  const intFiltered = useMemo(() => {
    if (!selectable) return []
    const q = intQuery.trim().toLowerCase()
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
      const inSection = intSection === 'food' ? !DRINK_CATS.has(item.category) : DRINK_CATS.has(item.category)
      if (!inSection) return false
      return intCategory === 'all' || item.category === intCategory
    })
  }, [selectable, intQuery, intCategory, intSection])

  const intFilteredGrouped = useMemo(() => groupMenuByCategory(intFiltered), [intFiltered])

  // Resolve which values to use
  const query    = selectable ? intQuery    : props.query
  const category = selectable ? intCategory : props.category
  const viewMode = selectable ? intViewMode : props.viewMode
  const filtered = selectable ? intFiltered : props.filtered
  const filteredGrouped = selectable ? intFilteredGrouped : props.filteredGrouped

  const [detailItem, setDetailItem] = useState<MenuItem | null>(null)

  return (
    <>
      {detailItem && (
        <DishModal
          item={detailItem}
          onClose={() => setDetailItem(null)}
          onAdd={selectable && onPickItem ? (item) => { onPickItem(item); setDetailItem(null) } : undefined}
        />
      )}

      <div className="space-y-3 pb-2">
        {/* ── Internal sticky search bar (selectable / OrderPanel mode only) ── */}
        {selectable && (
          <div className="sticky top-0 z-20 space-y-2.5 pt-1 pb-2" style={{ background: 'var(--bg)' }}>
            <div className="relative">
              <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                style={{ color: 'var(--muted)' }}
                viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35" strokeLinecap="round"/>
              </svg>
              <input
                value={intQuery}
                onChange={(e) => { setIntQuery(e.target.value); setIntCategory('all') }}
                placeholder="Поиск блюд…"
                className="search-input"
              />
              {intQuery && (
                <button type="button"
                  onClick={() => { setIntQuery(''); setIntCategory('all') }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-full text-sm"
                  style={{ background: 'var(--surface-3s)', color: 'var(--muted)' }}>✕</button>
              )}
            </div>

            {!intQuery && (
              <>
                <div className="flex flex-1 gap-1 p-1 rounded-2xl" style={{ background: 'var(--surface-2s)' }}>
                  {(['food', 'drinks'] as const).map((s) => (
                    <button key={s} type="button"
                      onClick={() => { setIntSection(s); setIntCategory('all') }}
                      className="flex-1 py-2 rounded-xl text-sm font-bold transition-all duration-200"
                      style={intSection === s ? { background: 'var(--accent)', color: '#0a0806' } : { color: 'var(--muted)' }}>
                      {s === 'food' ? '🍽 Кухня' : '🍷 Бар'}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-hide">
                  <button type="button" onClick={() => setIntCategory('all')}
                    className={`cat-pill shrink-0 ${intCategory === 'all' ? 'cat-pill-active' : 'cat-pill-inactive'}`}>
                    Все
                  </button>
                  {intVisibleCats.map((cat) => (
                    <button key={cat} type="button" onClick={() => setIntCategory(cat)}
                      className={`cat-pill shrink-0 ${intCategory === cat ? 'cat-pill-active' : 'cat-pill-inactive'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {!selectable && !query && (
          <p className="text-[10px] text-center pt-1" style={{ color: 'var(--muted)' }}>
            Зажмите карточку чтобы увидеть подробности
          </p>
        )}

        {/* ── Results ── */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center animate-fade-in">
            <div className="text-5xl">🔍</div>
            <p className="font-medium" style={{ color: 'var(--muted)' }}>Ничего не найдено</p>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>Попробуйте изменить запрос</p>
          </div>
        ) : (
          [...filteredGrouped.entries()].map(([cat, items]) => (
            <section key={cat} className="animate-fade-in">
              {(query || category === 'all') && (
                <div className="flex items-center gap-2 mb-3 mt-1">
                  <h3 className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>{cat}</h3>
                  <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{items.length}</span>
                </div>
              )}

              {viewMode === 'grid' && !selectable ? (
                <div className="grid grid-cols-2 gap-3">
                  {items.map((item, idx) => <GridCard key={item.id} item={item} idx={idx} onDetail={setDetailItem} />)}
                </div>
              ) : (
                <div className="space-y-2">
                  {items.map((item, idx) => (
                    <ListRow
                      key={item.id}
                      item={item}
                      idx={idx}
                      selectable={!!selectable}
                      onDetail={setDetailItem}
                      onPick={onPickItem}
                    />
                  ))}
                </div>
              )}
            </section>
          ))
        )}
      </div>
    </>
  )
}

/* ─── Grid card ── */
function GridCard({ item, idx, onDetail }: { item: MenuItem; idx: number; onDetail: (i: MenuItem) => void }) {
  const isDrink = DRINK_CATS.has(item.category)
  const lp = useLongPress({ onLongPress: () => onDetail(item) })

  return (
    <div {...lp}
      className="rounded-2xl overflow-hidden select-none"
      style={{
        background: 'var(--surface-solid)',
        border: '1px solid var(--border)',
        animation: `fadeIn 0.3s ease-out ${Math.min(idx * 0.03, 0.3)}s both`,
        cursor: 'pointer', WebkitUserSelect: 'none', userSelect: 'none',
      }}
      onClick={() => onDetail(item)}
    >
      <div className="relative" style={{ aspectRatio: '4/3' }}>
        {item.image ? (
          <>
            <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
            <div className="absolute inset-x-0 bottom-0 h-2/3"
              style={{ background: 'linear-gradient(to top, rgba(10,8,6,0.85) 0%, transparent 100%)' }} />
            <div className="absolute bottom-2.5 left-2.5 right-2.5">
              <div className="inline-block px-2 py-0.5 rounded-lg text-[11px] font-black"
                style={{ background: isDrink ? 'rgba(60,120,200,0.85)' : 'rgba(212,165,116,0.95)', color: isDrink ? '#dff' : '#0a0806' }}>
                {item.price > 0 ? formatPrice(item.price) : '—'}
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl" style={{ background: 'var(--surface-2s)' }}>
            {isDrink ? '🍷' : '🍽'}
          </div>
        )}
      </div>
      <div className="px-3 py-2.5">
        <div className="text-[13px] font-semibold leading-snug line-clamp-2" style={{ color: 'var(--text)' }}>{item.name}</div>
        {!item.image && (
          <div className="mt-1 text-sm font-bold" style={{ color: isDrink ? '#9fc5e8' : 'var(--accent)' }}>
            {item.price > 0 ? formatPrice(item.price) : '—'}
          </div>
        )}
        <div className="mt-1.5 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3 h-3 shrink-0">
            <circle cx="12" cy="12" r="10"/><path d="M12 8v4l2 2" strokeLinecap="round"/>
          </svg>
          <span className="text-[10px]">Удержите для деталей</span>
        </div>
      </div>
    </div>
  )
}

/* ─── List row ── */
function ListRow({
  item, idx, selectable, onDetail, onPick,
}: {
  item: MenuItem; idx: number; selectable: boolean
  onDetail: (i: MenuItem) => void; onPick?: (i: MenuItem) => void
}) {
  const isDrink = DRINK_CATS.has(item.category)
  const lp = useLongPress({
    onLongPress: () => onDetail(item),
    onClick: selectable && onPick ? () => onPick(item) : () => onDetail(item),
  })

  return (
    <div {...lp}
      className="rounded-2xl overflow-hidden flex items-center gap-3 select-none"
      style={{
        background: 'var(--surface-solid)',
        border: '1px solid var(--border)',
        padding: '10px 12px',
        animation: `fadeIn 0.25s ease-out ${Math.min(idx * 0.025, 0.25)}s both`,
        cursor: 'pointer', WebkitUserSelect: 'none', userSelect: 'none',
      }}
    >
      <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: 60, height: 60 }}>
        {item.image ? (
          <img src={item.image} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl" style={{ background: 'var(--surface-2s)' }}>
            {isDrink ? '🍷' : '🍽'}
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold leading-snug" style={{ color: 'var(--text)' }}>{item.name}</div>
        <div className="text-[11px] mt-0.5 truncate" style={{ color: 'var(--muted)' }}>{item.category}</div>
      </div>
      <div className="shrink-0 text-right">
        <div className="text-sm font-black" style={{ color: isDrink ? '#9fc5e8' : 'var(--accent)' }}>
          {item.price > 0 ? formatPrice(item.price) : '—'}
        </div>
        {selectable ? (
          <button type="button"
            onClick={(e) => { e.stopPropagation(); onPick?.(item) }}
            className="mt-1.5 w-8 h-8 flex items-center justify-center rounded-xl font-bold text-lg"
            style={{ background: 'var(--accent)', color: '#0a0806' }}>+</button>
        ) : (
          <div className="mt-1 text-[10px]" style={{ color: 'var(--muted)' }}>удержи</div>
        )}
      </div>
    </div>
  )
}
