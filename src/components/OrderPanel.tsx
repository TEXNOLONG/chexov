import { useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { deleteOrder, getActiveOrderForTable, saveOrder } from '../db'
import type { MenuItem, Order, OrderItem } from '../types'
import { formatPrice, orderItemsCount, orderTotal } from '../utils'
import { MenuView } from './MenuView'

interface Props {
  tableNumber: number
  order?: Order
  onClose: () => void
  onChanged: () => void
}

export function OrderPanel({ tableNumber, order, onClose, onChanged }: Props) {
  const [showMenu, setShowMenu] = useState(false)
  const [note, setNote] = useState(order?.note ?? '')

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
      createdAt: now, updatedAt: now,
    }
    await saveOrder(created)
    onChanged()
    return created
  }

  async function addItem(menuItem: MenuItem) {
    const current = await ensureOrder()
    const existing = current.items.find((i) => i.menuItemId === menuItem.id)
    const nextItems = existing
      ? current.items.map((i) => i.menuItemId === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i)
      : [...current.items, {
          id: uuid(), menuItemId: menuItem.id, name: menuItem.name,
          price: menuItem.price, quantity: 1, served: false,
        } satisfies OrderItem]
    await saveOrder({ ...current, items: nextItems, note, updatedAt: Date.now() })
    onChanged()
    setShowMenu(false)
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
          <MenuView selectable onPickItem={addItem} />
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
                      <div className="text-xs text-[var(--muted)] mt-0.5">
                        {formatPrice(item.price)} × {item.quantity}
                        {' = '}
                        <span className="font-semibold text-[var(--text-2)]">{formatPrice(item.price * item.quantity)}</span>
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
            {/* Total */}
            {items.length > 0 && (
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-xs text-[var(--muted)]">Итого по заказу</span>
                <span className="text-base font-black text-[var(--accent)]">{formatPrice(total)}</span>
              </div>
            )}

            {/* Action buttons */}
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
    </div>
  )
}
