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

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[var(--bg)]">
      <header className="flex items-center gap-3 border-b border-[#342920] px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <Button variant="ghost" onClick={onClose}>
          ← Назад
        </Button>
        <div className="min-w-0 flex-1">
          <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Стол</div>
          <div className="text-xl font-semibold">{tableNumber}</div>
        </div>
        {order && (
          <div className="text-right">
            <div className="text-xs text-[var(--muted)]">{orderItemsCount(items)} поз.</div>
            <div className="font-semibold text-[var(--accent)]">{formatPrice(total)}</div>
          </div>
        )}
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 pb-28">
        {showMenu ? (
          <MenuView selectable onPickItem={addItem} />
        ) : (
          <div className="space-y-4">
            {!items.length ? (
              <Card>
                <p className="text-center text-[var(--muted)]">Заказ пуст. Добавьте блюда из меню.</p>
              </Card>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.id}>
                    <div className="flex items-start justify-between gap-3">
                      <button type="button" className="min-w-0 flex-1 text-left" onClick={() => toggleServed(item.id)}>
                        <div className={`font-medium ${item.served ? 'text-[var(--success)] line-through opacity-80' : ''}`}>
                          {item.name}
                        </div>
                        <div className="mt-1 text-sm text-[var(--muted)]">
                          {formatPrice(item.price)} × {item.quantity}
                        </div>
                        <div className="mt-1 text-xs text-[var(--muted)]">
                          {item.served ? 'Подано' : 'Нажмите, чтобы отметить поданным'}
                        </div>
                      </button>
                      <div className="flex items-center gap-2">
                        <Button className="px-3 py-2" onClick={() => changeQty(item.id, -1)}>
                          −
                        </Button>
                        <span className="w-6 text-center">{item.quantity}</span>
                        <Button className="px-3 py-2" onClick={() => changeQty(item.id, 1)}>
                          +
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            <Card>
              <label className="mb-2 block text-xs uppercase tracking-wide text-[var(--muted)]">
                Комментарий к заказу
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onBlur={() => order && saveNote()}
                rows={3}
                placeholder="Пожелания гостя, аллергии, подача..."
                className="w-full rounded-xl border border-[#342920] bg-[var(--surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              />
            </Card>
          </div>
        )}
      </div>

      <footer className="fixed inset-x-0 bottom-0 border-t border-[#342920] bg-[#120e0b]/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-wrap gap-2">
          <Button variant="accent" className="flex-1" onClick={() => setShowMenu((v) => !v)}>
            {showMenu ? 'К заказу' : '+ Блюдо'}
          </Button>
          {order && items.length > 0 && (
            <>
              <Button onClick={markAllServed}>Всё подано</Button>
              {order.status === 'active' && (
                <Button onClick={() => setStatus('served')}>На оплату</Button>
              )}
              {(order.status === 'active' || order.status === 'served') && (
                <Button variant="accent" onClick={() => setStatus('paid')}>
                  Оплачено
                </Button>
              )}
              <Button variant="danger" onClick={cancelOrder}>
                Удалить
              </Button>
            </>
          )}
        </div>
      </footer>
    </div>
  )
}
