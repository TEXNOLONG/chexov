import type { Order } from '../types'
import { calcStats, formatDateTime, formatPrice, getShiftStart, orderTotal, resetShift } from '../utils'
import { Button } from './Button'
import { Card } from './Card'

interface Props {
  orders: Order[]
}

export function StatsView({ orders }: Props) {
  const stats = calcStats(orders)
  const shiftStart = getShiftStart()
  const recentPaid = orders.filter((o) => o.status === 'paid' && o.createdAt >= shiftStart).slice(0, 10)

  return (
    <div className="space-y-4">
      <Card>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-[var(--muted)]">Текущая смена</div>
            <div className="text-sm">с {formatDateTime(shiftStart)}</div>
          </div>
          <Button variant="ghost" onClick={() => resetShift()}>
            Новая смена
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Stat label="Заказов" value={String(stats.ordersCount)} />
          <Stat label="Активных" value={String(stats.activeCount)} />
          <Stat label="Подано" value={String(stats.servedCount)} />
          <Stat label="Оплачено" value={String(stats.paidCount)} />
          <Stat label="Позиций продано" value={String(stats.itemsSold)} />
          <Stat label="Выручка" value={formatPrice(stats.totalRevenue)} accent />
        </div>
      </Card>

      <section>
        <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-[var(--accent)]">
          Последние оплаченные
        </h3>
        {recentPaid.length ? (
          <div className="space-y-2">
            {recentPaid.map((order) => (
              <Card key={order.id}>
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-medium">Стол {order.tableNumber}</div>
                    <div className="text-xs text-[var(--muted)]">{formatDateTime(order.updatedAt)}</div>
                  </div>
                  <div className="font-semibold text-[var(--accent)]">{formatPrice(orderTotal(order.items))}</div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-center text-sm text-[var(--muted)]">Пока нет оплаченных заказов за смену</p>
          </Card>
        )}
      </section>
    </div>
  )
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl bg-[var(--surface-2)] p-3">
      <div className="text-xs text-[var(--muted)]">{label}</div>
      <div className={`mt-1 text-lg font-semibold ${accent ? 'text-[var(--accent)]' : ''}`}>{value}</div>
    </div>
  )
}
