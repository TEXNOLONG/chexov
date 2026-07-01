import { useState } from 'react'
import type { Order } from '../types'
import { calcStats, formatDateTime, formatPrice, getShiftStart, orderItemsCount, orderTotal, resetShift } from '../utils'
import { Card } from './Card'

interface Props {
  orders: Order[]
}

export function StatsView({ orders }: Props) {
  const [, forceUpdate] = useState(0)
  const stats = calcStats(orders)
  const shiftStart = getShiftStart()
  const recentPaid = orders
    .filter((o) => o.status === 'paid' && o.createdAt >= shiftStart)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 15)

  function handleReset() {
    resetShift()
    forceUpdate((v) => v + 1)
  }

  return (
    <div className="space-y-4">
      {/* Shift header */}
      <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold uppercase tracking-widest text-[var(--muted)]">Текущая смена</div>
            <div className="mt-0.5 text-sm">с {formatDateTime(shiftStart)}</div>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-xl border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--muted)] transition hover:border-[var(--muted)] hover:text-[var(--text)]"
          >
            Новая смена
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Stat label="Всего заказов" value={String(stats.ordersCount)} />
          <Stat label="Активных" value={String(stats.activeCount)} accent="accent" />
          <Stat label="На оплате" value={String(stats.servedCount)} accent="warning" />
          <Stat label="Оплачено" value={String(stats.paidCount)} accent="success" />
          <Stat label="Позиций продано" value={String(stats.itemsSold)} />
          <Stat label="Выручка" value={formatPrice(stats.totalRevenue)} accent="main" large />
        </div>
      </div>

      {/* Progress bar */}
      {stats.ordersCount > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3">
          <div className="mb-2 flex justify-between text-xs text-[var(--muted)]">
            <span>Оплачено из открытых</span>
            <span className="font-medium text-[var(--text)]">
              {stats.paidCount} / {stats.ordersCount}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-[var(--surface-3)]">
            <div
              className="h-full rounded-full bg-[var(--success)] transition-all duration-700"
              style={{ width: `${(stats.paidCount / stats.ordersCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Recent orders */}
      <section>
        <h3 className="mb-2 text-xs font-semibold uppercase tracking-widest text-[var(--accent)]">
          Последние оплаченные
        </h3>
        {recentPaid.length ? (
          <div className="space-y-2">
            {recentPaid.map((order) => (
              <Card key={order.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--accent)]">
                      {order.tableNumber}
                    </div>
                    <div>
                      <div className="text-sm font-medium">Стол {order.tableNumber}</div>
                      <div className="text-xs text-[var(--muted)]">
                        {orderItemsCount(order.items)} поз. · {formatDateTime(order.updatedAt)}
                      </div>
                    </div>
                  </div>
                  <div className="font-semibold text-[var(--accent)]">
                    {formatPrice(orderTotal(order.items))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <div className="text-4xl">📊</div>
              <p className="text-sm text-[var(--muted)]">Пока нет оплаченных заказов за смену</p>
            </div>
          </Card>
        )}
      </section>
    </div>
  )
}

function Stat({
  label,
  value,
  accent,
  large,
}: {
  label: string
  value: string
  accent?: 'main' | 'success' | 'warning' | 'accent'
  large?: boolean
}) {
  const color =
    accent === 'main'
      ? 'text-[var(--accent)]'
      : accent === 'success'
        ? 'text-[var(--success)]'
        : accent === 'warning'
          ? 'text-[var(--warning)]'
          : accent === 'accent'
            ? 'text-[var(--accent)]'
            : 'text-[var(--text)]'

  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted)]">{label}</div>
      <div className={`mt-1 font-bold ${large ? 'text-xl' : 'text-lg'} ${color}`}>{value}</div>
    </div>
  )
}
