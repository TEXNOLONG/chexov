import { useMemo, useState } from 'react'
import { v4 as uuid } from 'uuid'
import { deleteOrder, getActiveOrderForTable, saveOrder } from '../db'
import type { MenuItem, Order, OrderItem } from '../types'
import { formatPrice, orderItemsCount, orderTotal } from '../utils'
import { Button } from './Button'
import { Card } from './Card'
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
  const allServed = items.length > 0 && items.every((i) => i.served)

  async function ensureOrder(): Promise<Order> {
    const existing = order ?? (await getActiveOrderForTable(tableNumber))
    if (existing) return existing

    const now = Date.now()
    const created: Order = {
      id: uuid(),
      tableNumber,
      status: 'active',
      items: [],
      createdAt: now,
      updatedAt: now,
    }
    await saveOrder(created)
    onChanged()
    return created
  }

  async function addItem(menuItem: MenuItem) {
    const current = await ensureOrder()
    const existing = current.items.find((i) => i.menuItemId === menuItem.id)

    const nextItems = existing
      ? current.items.map((i) =>
          i.menuItemId === menuItem.id ? { ...i, quantity: i.quantity + 1 } : i,
        )
      : [
          ...current.items,
          {
            id: uuid(),
            menuItemId: menuItem.id,
            name: menuItem.name,
            price: menuItem.price,
            quantity: 1,
            served: false,
          } satisfies OrderItem,
        ]

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
      .map((item) =>
        item.id === itemId ? { ...item, quantity: Math.max(0, item.quantity + delta) } : item,
      )
      .filter((item) => item.quantity > 0)
    await updateItems(next)
  }

  async function removeItem(itemId: string) {
    await updateItems(items.filter((i) => i.id !== itemId))
  }

  async function toggleServed(itemId: string) {
    const next = items.map((item) => (item.id === itemId ? { ...item, served: !item.served } : item))
    await updateItems(next)
  }

  async function markAllServed() {
    const next = items.map((item) => ({ ...item, served: true }))
    await updateItems(next)
  }

  async function setStatus(status: Order['status']) {
    if (!order) return
    const now = Date.now()
    await saveOrder({
      ...order,
      status,
      note,
      updatedAt: now,
      closedAt: status === 'paid' ? now : order.closedAt,
    })
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

  const statusLabel =
    order?.status === 'served' ? 'На оплате' : order?.status === 'paid' ? 'Оплачен' : 'Активен'
  const statusClass =
    order?.status === 'served'
      ? 'badge badge-served'
      : order?.status === 'paid'
        ? 'badge badge-paid'
        : 'badge badge-active'

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]">
      {/* Header */}
      <header className="glass flex items-center gap-3 border-b border-[var(--border)] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--surface-2)] text-[var(--muted)] transition hover:text-[var(--text)]"
        >
          ←
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <div className="text-xs uppercase tracking-widest text-[var(--muted)]">Стол</div>
            <div className="text-xl font-bold">{tableNumber}</div>
            {order && <span className={statusClass}>{statusLabel}</span>}
          </div>
        </div>
        {order && (
          <div className="text-right">
            <div className="text-xs text-[var(--muted)]">{orderItemsCount(items)} поз.</div>
            <div className="text-lg font-bold text-[var(--accent)]">{formatPrice(total)}</div>
          </div>
        )}
      </header>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32">
        {showMenu ? (
          <MenuView selectable onPickItem={addItem} />
        ) : (
          <div className="space-y-4">
            {!items.length ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                <div className="text-5xl">🍽️</div>
                <p className="text-[var(--muted)]">Заказ пуст</p>
                <p className="text-sm text-[var(--muted)]">Нажмите «+ Блюдо» чтобы добавить позиции</p>
              </div>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`rounded-2xl border p-3 transition-all ${
                      item.served
                        ? 'border-[var(--success)]/40 bg-[rgba(107,159,123,0.08)]'
                        : 'border-[var(--border)] bg-[var(--surface)]'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Served toggle checkbox */}
                      <button
                        type="button"
                        onClick={() => toggleServed(item.id)}
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                          item.served
                            ? 'border-[var(--success)] bg-[var(--success)] text-white'
                            : 'border-[var(--border)] hover:border-[var(--accent)]'
                        }`}
                      >
                        {item.served && (
                          <svg viewBox="0 0 24 24" fill="currentColor" className="h-3 w-3">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                          </svg>
                        )}
                      </button>

                      {/* Item info */}
                      <div className="min-w-0 flex-1">
                        <div
                          className={`text-sm font-medium leading-snug ${
                            item.served ? 'text-[var(--success)] line-through opacity-70' : 'text-[var(--text)]'
                          }`}
                        >
                          {item.name}
                        </div>
                        <div className="mt-0.5 text-xs text-[var(--muted)]">
                          {formatPrice(item.price)} × {item.quantity} ={' '}
                          <span className="font-medium text-[var(--text)]">
                            {formatPrice(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>

                      {/* Controls */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => changeQty(item.id, -1)}
                          className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--surface-2)] text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                        >
                          −
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          type="button"
                          onClick={() => changeQty(item.id, 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-xl bg-[var(--surface-2)] text-sm font-bold text-[var(--muted)] transition hover:bg-[var(--surface-3)] hover:text-[var(--text)]"
                        >
                          +
                        </button>
                        {/* Remove item */}
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#3a1e1e] text-xs text-[#ffb4b4] transition hover:bg-[#4a2424]"
                          title="Убрать из заказа"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Progress indicator */}
                <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
                  <div className="mb-2 flex justify-between text-xs text-[var(--muted)]">
                    <span>Подано блюд</span>
                    <span className="font-medium text-[var(--text)]">
                      {items.filter((i) => i.served).length} / {items.length}
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
                    <div
                      className="h-full rounded-full bg-[var(--success)] transition-all duration-500"
                      style={{
                        width: `${items.length ? (items.filter((i) => i.served).length / items.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            <Card>
              <label className="mb-2 block text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">
                Комментарий
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => order && saveNote()}
                rows={3}
                placeholder="Пожелания гостя, аллергии, подача..."
                className="w-full resize-none rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none transition focus:border-[var(--accent)] placeholder:text-[var(--muted)]"
              />
            </Card>
          </div>
        )}
      </div>

      {/* Footer actions */}
      <footer className="fixed inset-x-0 bottom-0 glass border-t border-[var(--border)] px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <div className="mx-auto max-w-3xl space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button variant="accent" className="flex-1" onClick={() => setShowMenu((v) => !v)}>
              {showMenu ? '← К заказу' : '+ Блюдо'}
            </Button>
            {order && items.length > 0 && !showMenu && (
              <>
                {!allServed && (
                  <Button onClick={markAllServed}>✓ Всё подано</Button>
                )}
                {order.status === 'active' && (
                  <Button onClick={() => setStatus('served')}>На оплату</Button>
                )}
                {(order.status === 'active' || order.status === 'served') && (
                  <Button variant="accent" onClick={() => setStatus('paid')}>
                    💳 Оплачено
                  </Button>
                )}
                <Button variant="danger" onClick={cancelOrder}>
                  🗑
                </Button>
              </>
            )}
          </div>
          {order && items.length > 0 && !showMenu && (
            <div className="flex justify-between text-xs text-[var(--muted)]">
              <span>Итого по заказу</span>
              <span className="font-semibold text-[var(--accent)]">{formatPrice(total)}</span>
            </div>
          )}
        </div>
      </footer>
    </div>
  )
}
