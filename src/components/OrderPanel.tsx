import { useEffect, useMemo, useRef, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { deleteOrder, getActiveOrderForTable, saveOrder } from '../db'
import type { MenuItem, Order, OrderItem } from '../types'
import { formatPrice, orderItemsCount, orderTotal } from '../utils'
import { MenuView } from './MenuView'

interface Props {
  tableNumber: number
  // undefined = still loading from DB; null = confirmed free table; Order = active order
  order: Order | null | undefined
  onClose: () => void
  onChanged: () => void
}

const GUEST_COUNTS = [1, 2, 3, 4, 5, 6, 7, 8]

const DONENESS_OPTIONS = [
  { label: 'Rare', sub: 'С кровью' },
  { label: 'Medium Rare', sub: 'Слабая' },
  { label: 'Medium', sub: 'Средняя' },
  { label: 'Medium Well', sub: 'Сильная' },
  { label: 'Well Done', sub: 'Прожаренный' },
]

const FISH_POULTRY_KEYWORDS = ['тунец', 'лосось', 'сом', 'индейк', 'форел', 'рыб']

const DRINK_CATEGORIES = new Set([
  'Авторская коктейльная карта', 'Авторские настойки', 'Авторские чаи',
  'Белые вина', 'Виски', 'Водка', 'Игристые вина', 'Коньяк/Бренди',
  'Кофе', 'Красные вина', 'Крепкие напитки', 'Ликёры', 'Лимонады',
  'Пенное импорт', 'Пиво на кране', 'Розовые вина', 'Русский крафт',
  'Свежевыжатые соки', 'Соки/Вода', 'Спецпредложение Бар',
  'Твист на классику', 'Чаи',
])

function isBeefSteak(item: MenuItem): boolean {
  if (item.category !== 'Стейки') return false
  const name = item.name.toLowerCase()
  return !FISH_POULTRY_KEYWORDS.some((k) => name.includes(k))
}

function isDrink(item: MenuItem): boolean {
  return DRINK_CATEGORIES.has(item.category)
}

function getVolumePresets(category: string): number[] {
  if (['Пиво на кране', 'Пенное импорт', 'Русский крафт'].includes(category)) return [300, 500]
  if (['Белые вина', 'Красные вина', 'Розовые вина', 'Игристые вина'].includes(category)) return [125, 150, 750]
  if (['Виски', 'Коньяк/Бренди', 'Водка', 'Ликёры', 'Крепкие напитки'].includes(category)) return [40, 50, 100]
  if (['Авторские настойки'].includes(category)) return [50]
  if (['Авторская коктейльная карта', 'Твист на классику', 'Спецпредложение Бар'].includes(category)) return [200, 250, 350, 400]
  if (['Кофе'].includes(category)) return [30, 60, 150, 200, 250, 280]
  if (['Чаи', 'Авторские чаи'].includes(category)) return [300, 500, 1000]
  if (['Лимонады'].includes(category)) return [400, 1000]
  if (['Свежевыжатые соки'].includes(category)) return [200]
  if (['Соки/Вода'].includes(category)) return [200, 330, 500]
  return [100, 200, 300, 500]
}

export function OrderPanel({ tableNumber, order, onClose, onChanged }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [note, setNote] = useState(order?.note ?? '')
  const [guestCount, setGuestCount] = useState<number | undefined>(order?.guestCount)
  // Only show guest picker when the table is CONFIRMED free (null), not while loading (undefined)
  const [showGuestPicker, setShowGuestPicker] = useState(false)
  const shownGuestPickerRef = useRef(false)

  // Trigger guest picker exactly once when we confirm there's no existing order
  useEffect(() => {
    if (order === null && !shownGuestPickerRef.current) {
      shownGuestPickerRef.current = true
      setShowGuestPicker(true)
    }
    // Sync note/guestCount when order loads
    if (order != null) {
      setNote(order.note ?? '')
      setGuestCount(order.guestCount)
    }
  }, [order])

  const [pendingItem, setPendingItem] = useState<MenuItem | null>(null)
  const [selectedDoneness, setSelectedDoneness] = useState('')
  const [selectedVolume, setSelectedVolume] = useState<number | null>(null)

  const items = order?.items ?? []
  const total = useMemo(() => orderTotal(items), [items])
  const servedCount = items.filter((i) => i.served).length
  const allServed = items.length > 0 && items.every((i) => i.served)
  const progress = items.length > 0 ? servedCount / items.length : 0

  async function ensureOrder(): Promise<Order> {
    const existing = order ?? (await getActiveOrderForTable(tableNumber))
    if (existing) return existing
    const now = Date.now()
    const created: Order = {
      id: uuid(), tableNumber, status: 'active', items: [],
      guestCount, createdAt: now, updatedAt: now,
    }
    await saveOrder(created)
    onChanged()
    return created
  }

  async function addItem(menuItem: MenuItem, opts: { note?: string; volume?: number } = {}) {
    const current = await ensureOrder()
    const newItem: OrderItem = {
      id: uuid(), menuItemId: menuItem.id, name: menuItem.name,
      price: menuItem.price, quantity: 1, served: false,
      note: opts.note || undefined,
      volume: opts.volume || undefined,
    }
    const existing = current.items.find(
      (i) => i.menuItemId === menuItem.id && i.note === newItem.note && i.volume === newItem.volume
    )
    const nextItems = existing
      ? current.items.map((i) =>
          i.id === existing.id ? { ...i, quantity: i.quantity + 1 } : i
        )
      : [...current.items, newItem]
    await saveOrder({ ...current, items: nextItems, note, updatedAt: Date.now() })
    onChanged()
    setShowMenu(false)
  }

  function handlePickItem(menuItem: MenuItem) {
    const needsDoneness = isBeefSteak(menuItem)
    const needsVolume = isDrink(menuItem)
    if (needsDoneness || needsVolume) {
      setPendingItem(menuItem)
      setSelectedDoneness('')
      setSelectedVolume(null)
    } else {
      addItem(menuItem)
    }
  }

  async function confirmPendingItem() {
    if (!pendingItem) return
    await addItem(pendingItem, {
      note: selectedDoneness || undefined,
      volume: selectedVolume ?? undefined,
    })
    setPendingItem(null)
  }

  async function updateItems(nextItems: OrderItem[]) {
    if (!order) return
    await saveOrder({ ...order, items: nextItems, note, updatedAt: Date.now() })
    onChanged()
  }

  async function changeQty(itemId: string, delta: number) {
    const next = items
      .map((item) => item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item)
      .filter((item) => item.quantity > 0)
    await updateItems(next)
  }

  async function removeItem(itemId: string) {
    await updateItems(items.filter((i) => i.id !== itemId))
  }

  async function toggleServed(itemId: string) {
    const next = items.map((item) => item.id === itemId ? { ...item, served: !item.served } : item)
    await updateItems(next)
  }

  async function markAllServed() {
    const next = items.map((item) => ({ ...item, served: true }))
    await updateItems(next)
  }

  async function setStatus(status: Order['status']) {
    if (!order) return
    const now = Date.now()
    await saveOrder({ ...order, status, note, updatedAt: now, closedAt: status === 'paid' ? now : order.closedAt })
    onChanged()
    if (status === 'paid') onClose()
  }

  async function cancelOrder() {
    if (!order) return
    if (!confirm('Удалить заказ со стола?')) return
    await deleteOrder(order.id)
    onChanged()
    onClose()
  }

  async function saveNote() {
    if (!order) return
    await saveOrder({ ...order, note, updatedAt: Date.now() })
    onChanged()
  }

  async function confirmGuestCount(count: number) {
    setGuestCount(count)
    setShowGuestPicker(false)
    if (order) {
      await saveOrder({ ...order, guestCount: count, updatedAt: Date.now() })
      onChanged()
    }
  }

  const statusLabel = order?.status === 'served' ? 'На оплате' : order?.status === 'paid' ? 'Оплачен' : 'Активен'
  const statusCls = order?.status === 'served' ? 'badge-served' : order?.status === 'paid' ? 'badge-paid' : 'badge-active'

  return (
    <div className="fixed inset-0 z-50 flex flex-col animate-slide-up" style={{ background: 'var(--bg)' }}>
      {/* ── Header ── */}
      <header className="glass border-b border-[var(--border)] flex items-center gap-3 px-4"
        style={{ paddingTop: 'max(0.75rem, env(safe-area-inset-top))', paddingBottom: '0.75rem' }}>
        <button
          type="button"
          onClick={showMenu ? () => setShowMenu(false) : onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--muted)] transition active:scale-95"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} className="w-5 h-5">
            <path d="M19 12H5M12 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>

        <div className="min-w-0 flex-1">
          {showMenu ? (
            <div>
              <div className="text-xs text-[var(--muted)] uppercase tracking-widest">Добавить блюдо</div>
              <div className="text-base font-bold">Стол {tableNumber}</div>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-base font-black">Стол {tableNumber}</div>
              {order && <span className={`badge ${statusCls}`}>{statusLabel}</span>}
              {guestCount && (
                <span className="badge badge-active">
                  👤 {guestCount}
                </span>
              )}
            </div>
          )}
        </div>

        {order && !showMenu && (
          <div className="text-right shrink-0">
            <div className="text-xs text-[var(--muted)]">{orderItemsCount(items)} поз.</div>
            <div className="text-lg font-black text-[var(--accent)]">{formatPrice(total)}</div>
          </div>
        )}
      </header>

      {/* Progress strip */}
      {!showMenu && items.length > 0 && (
        <div className="h-1 bg-[var(--surface-2)]">
          <div
            className="h-full bg-gradient-to-r from-[var(--success)] to-[#90d4a8] transition-all duration-700"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
      )}

      {/* ── Body ── */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
        {showMenu ? (
          <MenuView selectable onPickItem={handlePickItem} />
        ) : (
          <div className="space-y-3 pb-36">
            {/* Empty state */}
            {!items.length ? (
              <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in">
                <div className="w-20 h-20 rounded-3xl bg-[var(--surface-2)] flex items-center justify-center text-4xl">
                  🍽️
                </div>
                <div>
                  <p className="font-semibold text-[var(--text-2)]">Заказ пуст</p>
                  <p className="text-sm text-[var(--muted)] mt-1">Нажмите «+ Добавить» чтобы выбрать блюда</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Progress summary */}
                <div className="flex items-center justify-between px-1 mb-3">
                  <span className="text-xs text-[var(--muted)]">Подано {servedCount} из {items.length}</span>
                  {!allServed && (
                    <button
                      type="button"
                      onClick={markAllServed}
                      className="text-xs font-semibold text-[var(--success)] active:opacity-70"
                    >
                      ✓ Всё подано
                    </button>
                  )}
                </div>

                {items.map((item, idx) => (
                  <div
                    key={item.id}
                    className={`order-item ${item.served ? 'order-item-served' : ''}`}
                    style={{ animation: `fadeIn 0.25s ease-out ${idx * 0.04}s both` }}
                  >
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleServed(item.id)}
                      className={`shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                        item.served
                          ? 'border-[var(--success)] bg-[var(--success)] text-white shadow-[0_0_8px_rgba(107,191,135,0.4)]'
                          : 'border-[var(--border)] hover:border-[var(--accent)]'
                      }`}
                    >
                      {item.served && (
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3">
                          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                        </svg>
                      )}
                    </button>

                    {/* Name & price */}
                    <div className="min-w-0 flex-1">
                      <div className={`text-sm font-semibold leading-snug ${
                        item.served ? 'text-[var(--success)] line-through opacity-60' : 'text-[var(--text)]'
                      }`}>
                        {item.name}
                      </div>
                      <div className="text-xs text-[var(--muted)] mt-0.5 flex flex-wrap gap-x-1.5 items-center">
                        {item.volume && (
                          <span className="text-[var(--accent)] font-semibold">{item.volume}мл</span>
                        )}
                        {item.note && (
                          <span className="text-[#c4a35a] font-medium">{item.note}</span>
                        )}
                        {(item.volume || item.note) && <span>·</span>}
                        <span>{formatPrice(item.price)} × {item.quantity}</span>
                        <span>= <span className="font-semibold text-[var(--text-2)]">{formatPrice(item.price * item.quantity)}</span></span>
                      </div>
                    </div>

                    {/* Qty controls */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => changeQty(item.id, -1)}
                        className="w-8 h-8 rounded-xl bg-[var(--surface-2)] text-base font-bold text-[var(--muted)] flex items-center justify-center active:scale-90"
                      >−</button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => changeQty(item.id, 1)}
                        className="w-8 h-8 rounded-xl bg-[var(--surface-2)] text-base font-bold text-[var(--muted)] flex items-center justify-center active:scale-90"
                      >+</button>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="w-8 h-8 rounded-xl bg-[var(--danger-soft)] text-[var(--danger)] flex items-center justify-center text-xs active:scale-90 ml-0.5"
                      >✕</button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Note */}
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-3">
              <label className="block text-[10px] font-bold uppercase tracking-widest text-[var(--muted)] mb-2">
                Комментарий
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => order && saveNote()}
                rows={3}
                placeholder="Пожелания гостя, аллергии, подача…"
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none transition focus:border-[var(--border-accent)] placeholder:text-[var(--muted)]"
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Footer ── */}
      {!showMenu && (
        <footer
          className="fixed inset-x-0 bottom-0 glass border-t border-[var(--border)] px-4 pt-3"
          style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
        >
          <div className="mx-auto max-w-3xl space-y-2">
            {items.length > 0 && (
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-xs text-[var(--muted)]">Итого по заказу</span>
                <span className="text-base font-black text-[var(--accent)]">{formatPrice(total)}</span>
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowMenu(true)}
                className="btn btn-accent flex-1"
              >
                + Добавить
              </button>

              {order && items.length > 0 && (
                <>
                  {order.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => setStatus('served')}
                      className="btn btn-success"
                    >
                      На оплату
                    </button>
                  )}
                  {(order.status === 'active' || order.status === 'served') && (
                    <button
                      type="button"
                      onClick={() => setStatus('paid')}
                      className="btn btn-ghost font-bold text-[var(--accent)] border border-[var(--border-accent)]"
                    >
                      💳
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={cancelOrder}
                    className="btn btn-danger btn-icon"
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-4 h-4">
                      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" strokeLinecap="round"/>
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
        </footer>
      )}

      {/* ── Guest Count Picker ── */}
      {showGuestPicker && !showMenu && (
        <div className="fixed inset-0 z-60 flex items-end" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full rounded-t-3xl border-t border-[var(--border)] px-5 pt-5 pb-8 animate-slide-up"
            style={{ background: 'var(--surface)' }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border)]" />
            <p className="text-base font-bold mb-1">Стол {tableNumber}</p>
            <p className="text-sm text-[var(--muted)] mb-4">Сколько гостей?</p>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {GUEST_COUNTS.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => confirmGuestCount(n)}
                  className={`rounded-2xl py-3 text-lg font-bold transition active:scale-95 ${
                    guestCount === n
                      ? 'bg-[var(--accent)] text-[#0f0c09]'
                      : 'bg-[var(--surface-2)] text-[var(--text)]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowGuestPicker(false)}
              className="w-full rounded-2xl border border-[var(--border)] py-3 text-sm text-[var(--muted)] active:opacity-70"
            >
              Пропустить
            </button>
          </div>
        </div>
      )}

      {/* ── Item Options Modal (doneness / volume) ── */}
      {pendingItem && (
        <div className="fixed inset-0 z-60 flex items-end" style={{ background: 'rgba(0,0,0,0.6)' }}>
          <div
            className="w-full rounded-t-3xl border-t border-[var(--border)] px-5 pt-5 pb-8 animate-slide-up"
            style={{ background: 'var(--surface)' }}
          >
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-[var(--border)]" />
            <p className="text-sm font-black mb-1 text-[var(--accent)]">{pendingItem.name}</p>

            {/* Doneness (beef steaks) */}
            {isBeefSteak(pendingItem) && (
              <div className="mb-4">
                <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2 font-semibold">Степень прожарки</p>
                <div className="grid grid-cols-5 gap-1.5">
                  {DONENESS_OPTIONS.map((d) => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => setSelectedDoneness(d.label)}
                      className={`rounded-xl py-2 px-1 text-center transition active:scale-95 ${
                        selectedDoneness === d.label
                          ? 'bg-[var(--accent)] text-[#0f0c09]'
                          : 'bg-[var(--surface-2)] text-[var(--text)]'
                      }`}
                    >
                      <div className="text-[10px] font-bold leading-tight">{d.label}</div>
                      <div className="text-[9px] opacity-70 leading-tight mt-0.5">{d.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Volume (drinks) */}
            {isDrink(pendingItem) && (
              <div className="mb-4">
                <p className="text-xs text-[var(--muted)] uppercase tracking-widest mb-2 font-semibold">Объём</p>
                <div className="flex flex-wrap gap-2">
                  {getVolumePresets(pendingItem.category).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setSelectedVolume(v)}
                      className={`rounded-xl px-4 py-2 text-sm font-bold transition active:scale-95 ${
                        selectedVolume === v
                          ? 'bg-[var(--accent)] text-[#0f0c09]'
                          : 'bg-[var(--surface-2)] text-[var(--text)]'
                      }`}
                    >
                      {v}мл
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2 mt-2">
              <button
                type="button"
                onClick={() => setPendingItem(null)}
                className="flex-1 rounded-2xl border border-[var(--border)] py-3 text-sm text-[var(--muted)] active:opacity-70"
              >
                Отмена
              </button>
              <button
                type="button"
                onClick={confirmPendingItem}
                className="flex-1 rounded-2xl py-3 text-sm font-bold transition active:scale-95 bg-[var(--accent)] text-[#0f0c09]"
              >
                Добавить в заказ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
